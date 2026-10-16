// Deterministic Canvas-to-PNG pipe, original WAV decoded and sample-trimmed to AAC.
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { startServer } from "../server.mjs";
import { dependency, chromePath, root, ffmpeg } from "./media-runtime.mjs";
const args = process.argv.slice(2),
  arg = (key, fallback) => {
    const i = args.indexOf("--" + key);
    return i < 0 ? fallback : args[i + 1];
  };
const preset = arg("preset", "p0");
const profiles = {
  p2: {
    start: 0,
    end: 29.709,
    name: "p2-polished-0-29.709-1080p60",
    folder: "p2-polish",
  },
  p0: {
    start: 59.223,
    end: 74.045,
    name: "p0-polished-59.223-74.045-1080p60",
    folder: "p0-polish",
  },
  p1: {
    start: 74.045,
    end: 95.465,
    name: "p1-polished-74.045-95.465-1080p60",
    folder: "p1-polish",
  },
  combined: {
    start: 59.223,
    end: 95.465,
    name: "p0-p1-polished-59.223-95.465-1080p60",
    folder: "p0-p1-polish",
  },
};
const profile = profiles[preset];
if (!profile) throw new Error("Unknown export preset");
const mode = arg("mode", "video"),
  start = +arg("start", profile.start),
  end = +arg("end", profile.end),
  fps = 60;
const folder = resolve(root, arg("folder", "out/" + profile.folder));
mkdirSync(folder, { recursive: true });
const output = resolve(root, arg("out", "out/" + profile.name + ".mp4"));
mkdirSync(resolve(output, ".."), { recursive: true });
const { server, url } = await startServer(0);
const { chromium } = dependency("playwright-core");
let browser, encoder;
const failures = [],
  requests = [],
  diagnostics = [];
try {
  browser = await chromium.launch({
    executablePath: chromePath(),
    headless: true,
    args: [
      "--disable-background-timer-throttling",
      "--disable-renderer-backgrounding",
      "--force-color-profile=srgb",
    ],
  });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  page.on("pageerror", (e) => failures.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) requests.push({ url: r.url(), status: r.status() });
  });
  await page.goto(url + "/?render=1&t=" + start);
  await page.waitForFunction(() => window.renderReady || window.renderError, {
    timeout: 30000,
  });
  const err = await page.evaluate(() => window.renderError);
  if (err) throw new Error(err);
  async function render(t) {
    return page.evaluate((t) => {
      const diag = window.renderFrame(t);
      return {
        diag,
        png: document
          .getElementById("storyboardCanvas")
          .toDataURL("image/png")
          .split(",")[1],
      };
    }, t);
  }
  if (mode === "stills") {
    if(preset!=='p0') {
      const derived=await page.evaluate(()=>window.exportP1DerivedLayer().split(',')[1]);
      writeFileSync(resolve(folder,'fin-contour-layer.png'),Buffer.from(derived,'base64'));
    }
    const times = arg(
      "times",
      preset === "p0"
        ? "59.223,60.1,61.958,62.572,62.589,64,65.397,66.584,66.601,67.1,67.8,68.235,68.252,68.3,68.8,69.259,70.067,70.084,70.42,72,73.169,74.028"
        : preset === "p2"
          ? "0,0.35,0.72,1.55,2.6,3.873,4.2,5.5,6.6,7.446,7.9,9.2,10.5,11.095,11.9,12.6,14,16,16.4,18.6,20,21.4,22.5,24.1,24.7,26,29.7"
          : "59.5,64,67.1,68.299,68.3,68.8,72.5,74.028,74.045,74.35,75.1,76.959,77.56,77.576,78.9,80.62,81.334,81.351,82.48,82.52,82.65,82.78,82.816,82.833,83.5,84.268,85.061,85.078,86.2,87.922,88.57,88.587,89.6,90.18,90.197,90.99,91.04,91.4,91.998,92.015,93.4,94.93,95.448",
    )
      .split(",")
      .map(Number);
    for (const t of times) {
      const r = await render(t);
      writeFileSync(
        resolve(folder, `frame-${t.toFixed(3)}.png`),
        Buffer.from(r.png, "base64"),
      );
      diagnostics.push(r.diag);
    }
    // Same time following reverse seeks must give precisely the same Canvas bytes.
    const repeats = [];
    for (const t of preset === "p0"
      ? [68.8]
      : [68.3, 82.65, 84.268, 91.4, 94.93]) {
      const a = await render(t);
      await render(95.448);
      await render(59.3);
      const b = await render(t);
      if (a.png !== b.png)
        throw new Error("Non-deterministic frame after reverse seek at " + t);
      repeats.push(t);
    }
    const timing = await page.evaluate(async () => {
      const data=await (await fetch('/data/lyrics.json')).json();
      return data.lines.map(({index,start,end})=>({index,start,end}));
    });
    const captionAudit=[];
    for(const l of timing.filter(l=>l.start<end&&l.end>start)){
      const t=(Math.max(l.start,start)+Math.min(l.end,end))/2;
      const d=await page.evaluate(t=>window.renderFrame(t),t);
      if(d.caption?.line!==l.index || d.caption.rows>2 || d.caption.bottom>1015 || d.caption.size<48)throw new Error('Caption audit failed for local index '+l.index);
      captionAudit.push({index:l.index,time:t,...d.caption});
    }
    for (const t of [59.206, 59.223, 74.044, 74.045, 95.464, 95.465, 96]) {
      const d = await page.evaluate((t) => {
        const r = window.renderFrame(t);
        return {
          diag: r,
          canvas: getComputedStyle(document.getElementById("storyboardCanvas"))
            .display,
          hidden: getComputedStyle(document.getElementById("character"))
            .visibility,
        };
      }, t);
      diagnostics.push(d);
    }
    writeFileSync(
      resolve(folder, "stills-validation.json"),
      JSON.stringify(
        {
          deterministic: true,
          repeatSeekTimes: repeats,
          captionAudit,
          errors: failures,
          failedRequests: requests,
          diagnostics,
        },
        null,
        2,
      ),
    );
    console.log(
      JSON.stringify({
        mode,
        frames: times.length,
        deterministic: true,
        errors: failures,
        failedRequests: requests,
      }),
    );
  } else {
    const frames = Math.ceil((end - start) * fps),
      videoDuration = frames / fps;
    const audioStartSample = Math.round(start * 44100),
      audioEndSample = Math.round(end * 44100);
    const ffargs = [
      "-y",
      "-hide_banner",
      "-loglevel",
      "warning",
      "-f",
      "image2pipe",
      "-framerate",
      String(fps),
      "-vcodec",
      "png",
      "-i",
      "pipe:0",
      "-i",
      resolve(root, "audio/song.wav"),
      "-filter_complex",
      `[1:a]atrim=start_sample=${audioStartSample}:end_sample=${audioEndSample},asetpts=PTS-STARTPTS[a]`,
      "-map",
      "0:v:0",
      "-map",
      "[a]",
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "18",
      "-pix_fmt",
      "yuv420p",
      "-r",
      "60",
      "-c:a",
      "aac",
      "-b:a",
      "256k",
      "-ar",
      "44100",
      "-movflags",
      "+faststart",
      "-color_primaries",
      "bt709",
      "-color_trc",
      "bt709",
      "-colorspace",
      "bt709",
      "-metadata",
      `comment=song_start=${start};song_end=${end};audio_sample_start=${audioStartSample};absolute_time_renderer`,
      output,
    ];
    encoder = spawn(ffmpeg, ffargs, {
      stdio: ["pipe", "ignore", "pipe"],
      windowsHide: true,
    });
    let stderr = "";
    encoder.stderr.on("data", (b) => (stderr += b));
    encoder.stdin.on("error", () => {});
    const finished = once(encoder, "close");
    for (let i = 0; i < frames; i++) {
      const t = start + i / fps,
        r = await render(t);
      if (!encoder.stdin.write(Buffer.from(r.png, "base64")))
        await once(encoder.stdin, "drain");
      if (i % 120 === 0) console.log(`Rendered ${i}/${frames}`);
    }
    encoder.stdin.end();
    const [code] = await finished;
    if (code !== 0) throw new Error(stderr || `ffmpeg exit ${code}`);
    const manifest = {
      output,
      start,
      end,
      fps,
      frames,
      videoDuration,
      lastFrameSongTime: start + (frames - 1) / fps,
      audioStartSample,
      audioEndSample,
      audioSamples: audioEndSample - audioStartSample,
      audioDuration: (audioEndSample - audioStartSample) / 44100,
      videoRoundingSeconds: videoDuration - (end - start),
      encoder: "H.264/libx264 crf18, yuv420p, BT.709 + AAC256k",
      errors: failures,
      failedRequests: requests,
      ffmpegWarnings: stderr,
      preset,
      approvedContact: {
        songTime: 68.3,
        status: "user_confirmed_contact_only",
      },
      fallback: {
        cat: "brief_contour",
        alternate: "outline_preview_no_alternate_art",
      },
    };
    writeFileSync(
      resolve(folder, "export-manifest.json"),
      JSON.stringify(manifest, null, 2),
    );
    console.log(JSON.stringify(manifest));
  }
  if (failures.length || requests.length)
    throw new Error(
      "Browser errors or missing resources; see validation output",
    );
} finally {
  if (encoder && !encoder.killed) encoder.kill();
  if (browser) await browser.close();
  await new Promise((r) => server.close(r));
}
