// Render song-time ranges to PNG stills or an MP4 with the original audio.
//
//   node tools/export.mjs --from 0 --to 15.08 --out out/s01-boot-720p30.mp4 --fps 30 --width 1280 --height 720
//   node tools/export.mjs --from 0 --to 15.08 --stills out/s01 --times 0.6,1.2,2.8,4.5,6.9,9.2,10.6,12.5
//
// The page owns the picture; this tool only drives it frame by frame and pipes
// the PNGs into ffmpeg. Times are SONG time, matching the shot table. Because a
// frame is a pure function of t, the determinism check below (render A, seek far
// away, render A again, compare bytes) is a real test of that property.
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { startServer } from "../server.mjs";
import { dependency, chromePath, root, ffmpeg } from "./media-runtime.mjs";

const args = process.argv.slice(2);
const arg = (key, fallback) => {
  const i = args.indexOf("--" + key);
  return i < 0 ? fallback : args[i + 1];
};
const num = (key, fallback) => {
  const v = arg(key, null);
  return v == null ? fallback : Number(v);
};

const from = num("from", 0);
const to = num("to", 15.08);
const fps = num("fps", 60);
const width = num("width", 1920);
const height = num("height", 1080);
const stillsDir = arg("stills", null);
const out = resolve(root, arg("out", "out/clip.mp4"));

if (!(to > from)) throw new Error(`--to (${to}) must be greater than --from (${from})`);

const { server, url } = await startServer(0);
const { chromium } = dependency("playwright-core");
const failures = [];
let browser;

const times = (arg("times", "") || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .map(Number);

try {
  browser = await chromium.launch({
    executablePath: chromePath(),
    headless: true,
    args: ["--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--force-color-profile=srgb"],
  });
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => failures.push(e.message));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    // Resource 404s are reported below with their URL; Chrome's generic
    // "Failed to load resource" line would just duplicate them (and it is what
    // the favicon request produces).
    if (/Failed to load resource/.test(m.text())) return;
    failures.push("console: " + m.text());
  });
  // A 404 for the favicon is noise; anything else missing is a real problem.
  page.on("response", (r) => {
    if (r.status() < 400) return;
    const u = r.url();
    if (/\/favicon\.ico$/.test(u)) return;
    failures.push(`HTTP ${r.status()} ${u.replace(url, "")}`);
  });
  page.on("requestfailed", (r) => {
    if (/\/favicon\.ico$/.test(r.url())) return;
    failures.push(`request failed ${r.url().replace(url, "")} (${r.failure()?.errorText ?? "?"})`);
  });

  await page.goto(`${url}/?render=1&t=${from}`);
  await page.waitForFunction(() => window.renderReady || window.renderError, { timeout: 40000 });
  const err = await page.evaluate(() => window.renderError);
  if (err) throw new Error("page failed to start:\n" + err);

  const render = (t) =>
    page.evaluate((t) => {
      const diag = window.renderFrame(t);
      return {
        diag,
        png: document.getElementById("storyboardCanvas").toDataURL("image/png").split(",")[1],
      };
    }, t);

  // --- stills --------------------------------------------------------------
  if (stillsDir) {
    const dir = resolve(root, stillsDir);
    mkdirSync(dir, { recursive: true });
    const list = times.length ? times : [from, (from + to) / 2, to - 0.01];
    const diag = [];
    for (const t of list) {
      const r = await render(t);
      writeFileSync(resolve(dir, `frame-${t.toFixed(3)}.png`), Buffer.from(r.png, "base64"));
      diag.push({ t, ...(r.diag || {}) });
      console.log(`  still ${t.toFixed(3)}  ${r.diag?.shot ?? "?"}${r.diag?.pending ? "  (NOT RENDERED)" : ""}`);
    }

    // Determinism: the same time after an unrelated seek must give identical bytes.
    const probe = list[Math.min(1, list.length - 1)];
    const a = await render(probe);
    await render(Math.min(to, from + 9));
    await render(from);
    const b = await render(probe);
    const deterministic = a.png === b.png;
    writeFileSync(
      resolve(dir, "stills.json"),
      JSON.stringify({ from, to, deterministic, probe, frames: diag, errors: failures }, null, 2),
    );
    console.log(`stills: ${list.length} 帧 → ${stillsDir}`);
    console.log(`deterministic: ${deterministic ? "yes" : "NO"}`);
    if (failures.length) console.log("page errors: " + failures.join(" | "));
    process.exitCode = deterministic && failures.length === 0 ? 0 : 1;
  } else {
    // --- video -------------------------------------------------------------
    const frames = Math.max(1, Math.round((to - from) * fps));
    const audioStart = Math.round(from * 44100);
    const audioEnd = Math.round(to * 44100);
    mkdirSync(resolve(out, ".."), { recursive: true });
    const encoder = spawn(
      ffmpeg,
      [
        "-y", "-hide_banner", "-loglevel", "error",
        "-f", "image2pipe", "-framerate", String(fps), "-vcodec", "png", "-i", "pipe:0",
        "-i", resolve(root, "audio/song.wav"),
        "-filter_complex", `[1:a]atrim=start_sample=${audioStart}:end_sample=${audioEnd},asetpts=PTS-STARTPTS[a]`,
        "-map", "0:v:0", "-map", "[a]",
        "-vf", `scale=${width}:${height}:flags=lanczos`,
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-r", String(fps),
        "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
        "-movflags", "+faststart",
        "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
        out,
      ],
      { stdio: ["pipe", "ignore", "pipe"], windowsHide: true },
    );
    let stderr = "";
    encoder.stderr.on("data", (b) => (stderr += b));
    encoder.stdin.on("error", () => {});
    const finished = once(encoder, "close");

    const t0 = Date.now();
    for (let i = 0; i < frames; i++) {
      const t = from + i / fps;
      const r = await render(t);
      if (!encoder.stdin.write(Buffer.from(r.png, "base64"))) await once(encoder.stdin, "drain");
      if (i % 60 === 0) {
        const done = i / Math.max(1, frames);
        const rate = (Date.now() - t0) / Math.max(1, i) / 1000;
        process.stdout.write(
          `\r  ${i}/${frames} frames  ${(done * 100).toFixed(0)}%  eta ${(rate * (frames - i)).toFixed(0)}s   `,
        );
      }
    }
    encoder.stdin.end();
    const [code] = await finished;
    if (code !== 0) throw new Error(stderr || `ffmpeg exited ${code}`);
    console.log("");
    console.log(`wrote ${arg("out", "out/clip.mp4")}  (${frames} frames, ${(to - from).toFixed(3)}s)`);
    if (failures.length) {
      console.log("page errors: " + failures.join(" | "));
      process.exitCode = 1;
    }
  }
} finally {
  await browser?.close();
  server?.close();
}
