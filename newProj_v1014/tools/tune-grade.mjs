// Grade tuning harness: renders one song time under several grade settings and
// writes a labelled contact sheet, so a look can be compared in one image
// instead of one screenshot per variant.
//
//   node tools/tune-grade.mjs --time 68.3 --out out/tune/grade-68.3.jpg
//   node tools/tune-grade.mjs --time 68.3 --variants variants.json
//
// A variant is any subset of the grade options, e.g. { "glow": 0.2, "grain": 0 }.
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { startServer } from "../server.mjs";
import { dependency, chromePath, root } from "./media-runtime.mjs";

const args = process.argv.slice(2);
const arg = (key, fallback) => {
  const i = args.indexOf("--" + key);
  return i < 0 ? fallback : args[i + 1];
};

const time = Number(arg("time", 68.3));
const cols = Number(arg("cols", 2));
const cellW = Number(arg("cell", 640));
const cellH = Math.round((cellW * 1080) / 1920);

const DEFAULT_VARIANTS = [
  { label: "none", glow: 0, scanline: 0, vignette: 0, grain: 0 },
  { label: "grade-default" },
  { label: "glow .22", glow: 0.22 },
  { label: "glow .42 b.9 c2.2", glow: 0.42, glowBrightness: 0.9, glowContrast: 2.2 },
  { label: "glow .60 hard", glow: 0.6, glowBrightness: 0.6, glowContrast: 3.6 },
  { label: "no-grain", grain: 0, scanline: 0 },
];

const variants = arg("variants")
  ? JSON.parse(readFileSync(resolve(arg("variants")), "utf8"))
  : DEFAULT_VARIANTS;

const out = resolve(root, arg("out", "out/tune/grade.jpg"));
mkdirSync(resolve(out, ".."), { recursive: true });

const { server, url } = await startServer(0);
const { chromium } = dependency("playwright-core");
let browser;
const failures = [];
try {
  browser = await chromium.launch({
    executablePath: chromePath(),
    headless: true,
    args: ["--force-color-profile=srgb", "--disable-lcd-text"],
  });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });
  page.on("pageerror", (e) => failures.push(e.message));
  await page.goto(url + "/?render=1&t=" + time);
  await page.waitForFunction(() => window.renderReady || window.renderError, { timeout: 30000 });
  const err = await page.evaluate(() => window.renderError);
  if (err) throw new Error(err);

  const rows = Math.ceil(variants.length / cols);
  const sheetW = cols * cellW;
  const sheetH = rows * cellH;

  const png = await page.evaluate(
    async ({ time, variants, cols, cellW, cellH, sheetW, sheetH }) => {
      const src = document.getElementById("storyboardCanvas");
      const sheet = document.createElement("canvas");
      sheet.width = sheetW;
      sheet.height = sheetH;
      const g = sheet.getContext("2d");
      g.fillStyle = "#000";
      g.fillRect(0, 0, sheetW, sheetH);
      const results = [];
      for (let i = 0; i < variants.length; i++) {
        const v = { ...variants[i] };
        const label = v.label || `variant ${i}`;
        delete v.label;
        window.gradeOverrides = v;
        const diag = window.renderFrame(time);
        const cx = (i % cols) * cellW;
        const cy = Math.floor(i / cols) * cellH;
        g.drawImage(src, cx, cy, cellW, cellH);
        g.font = '600 16px "MV Mono", monospace';
        const text = `${label}`;
        const w = g.measureText(text).width;
        g.fillStyle = "rgba(0,0,0,.72)";
        g.fillRect(cx + 6, cy + 6, w + 16, 26);
        g.fillStyle = "#83e9e6";
        g.fillText(text, cx + 14, cy + 24);
        results.push({ label, diag: diag?.shot });
      }
      window.gradeOverrides = {};
      return { data: sheet.toDataURL("image/jpeg", 0.92).split(",")[1], results };
    },
    { time, variants, cols, cellW, cellH, sheetW, sheetH },
  );

  writeFileSync(out, Buffer.from(png.data, "base64"));
  console.log(JSON.stringify({ out, time, variants: png.results, errors: failures }, null, 2));
} finally {
  if (browser) await browser.close();
  await new Promise((r) => server.close(r));
}
if (failures.length) throw new Error("page errors: " + failures.join("; "));
