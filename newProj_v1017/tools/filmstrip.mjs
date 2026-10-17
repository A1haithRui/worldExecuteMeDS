// Filmstrip: render a set of song times into one labelled contact sheet, so
// motion can be judged in a single image.
//
//   node tools/filmstrip.mjs --start 59.223 --end 74.045 --count 16 --out out/strips/p0.jpg
//   node tools/filmstrip.mjs --times 60.1,62.6,65.4 --out out/strips/pick.jpg
//   node tools/filmstrip.mjs --start 66.6 --end 68.4 --count 12 --cols 4
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { startServer } from "../server.mjs";
import { dependency, chromePath, root } from "./media-runtime.mjs";

const args = process.argv.slice(2);
const arg = (key, fallback) => {
  const i = args.indexOf("--" + key);
  return i < 0 ? fallback : args[i + 1];
};

const start = Number(arg("start", 59.223));
const end = Number(arg("end", 74.045));
const count = Math.max(1, Number(arg("count", 16)));
const cols = Math.max(1, Number(arg("cols", 4)));
const cellW = Number(arg("cell", 480));
const cellH = Math.round((cellW * 1080) / 1920);
const out = resolve(root, arg("out", "out/strips/strip.jpg"));

const times = arg("times")
  ? arg("times").split(",").map(Number)
  : count === 1
    ? [start]
    : Array.from({ length: count }, (_, i) => start + ((end - start) * i) / (count - 1));

mkdirSync(resolve(out, ".."), { recursive: true });

const { server, url } = await startServer(0);
const { chromium } = dependency("playwright-core");
let browser;
const failures = [];
try {
  browser = await chromium.launch({
    executablePath: chromePath(),
    headless: true,
    args: ["--force-color-profile=srgb"],
  });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  page.on("pageerror", (e) => failures.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) failures.push(`${r.status()} ${r.url()}`);
  });
  await page.goto(url + "/?render=1&t=" + times[0]);
  await page.waitForFunction(() => window.renderReady || window.renderError, { timeout: 30000 });
  const err = await page.evaluate(() => window.renderError);
  if (err) throw new Error(err);

  const rows = Math.ceil(times.length / cols);
  const sheetW = cols * cellW;
  const sheetH = rows * cellH;

  const result = await page.evaluate(
    async ({ times, cols, cellW, cellH, sheetW, sheetH }) => {
      const src = document.getElementById("storyboardCanvas");
      const sheet = document.createElement("canvas");
      sheet.width = sheetW;
      sheet.height = sheetH;
      const g = sheet.getContext("2d");
      g.fillStyle = "#000";
      g.fillRect(0, 0, sheetW, sheetH);
      const diags = [];
      for (let i = 0; i < times.length; i++) {
        const t = times[i];
        const diag = window.renderFrame(t);
        const cx = (i % cols) * cellW;
        const cy = Math.floor(i / cols) * cellH;
        g.drawImage(src, cx, cy, cellW, cellH);
        const text = `${t.toFixed(3)}s  ${diag?.shot ?? "?"}`;
        g.font = '600 15px "MV Mono", monospace';
        const w = g.measureText(text).width;
        g.fillStyle = "rgba(0,0,0,.75)";
        g.fillRect(cx + 5, cy + 5, w + 14, 24);
        g.fillStyle = "#83e9e6";
        g.fillText(text, cx + 12, cy + 22);
        diags.push({ t, shot: diag?.shot, caption: diag?.caption?.line });
      }
      return { data: sheet.toDataURL("image/jpeg", 0.92).split(",")[1], diags };
    },
    { times, cols, cellW, cellH, sheetW, sheetH },
  );

  writeFileSync(out, Buffer.from(result.data, "base64"));
  console.log(JSON.stringify({
    out,
    frames: times.length,
    sheet: `${sheetW}x${sheetH}`,
    shots: [...new Set(result.diags.map((d) => d.shot))],
    errors: failures,
  }, null, 2));
} finally {
  if (browser) await browser.close();
  await new Promise((r) => server.close(r));
}
if (failures.length) throw new Error("page errors: " + failures.join("; "));
