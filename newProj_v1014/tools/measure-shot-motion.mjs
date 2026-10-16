// Per-shot motion report.
//
// Renders every shot at the chosen frame rate and measures how much each
// consecutive pair of frames differs, so "this shot is basically a still" and
// "this shot moves" become numbers instead of opinions.
//
//   node tools/measure-shot-motion.mjs --preset p0
//   node tools/measure-shot-motion.mjs --preset combined --fps 60 --out out/motion-shots.json
//
// diff values are mean absolute difference in 0..255 grey levels, measured at
// --probe resolution so they are comparable between runs.
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { startServer } from "../server.mjs";
import { dependency, chromePath, root } from "./media-runtime.mjs";

const args = process.argv.slice(2);
const arg = (key, fallback) => {
  const i = args.indexOf("--" + key);
  return i < 0 ? fallback : args[i + 1];
};

const preset = arg("preset", "combined");
const fps = Number(arg("fps", 60));
const probeW = Number(arg("probe", 160));
const staticThreshold = Number(arg("static", 0.5));
const out = resolve(root, arg("out", `out/motion-${preset}.json`));
// Extra URL params, e.g. --param amb=0 to measure with the ambient layer off.
const extraParams = args.reduce((acc, a, i) => {
  if (a === "--param" && args[i + 1]) acc.push(args[i + 1]);
  return acc;
}, []);
const query = ["render=1", "t=60", ...extraParams].join("&");

const { server, url } = await startServer(0);
const { chromium } = dependency("playwright-core");
let browser;
const failures = [];
try {
  browser = await chromium.launch({ executablePath: chromePath(), headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => failures.push(e.message));
  await page.goto(url + "/?" + query);
  await page.waitForFunction(() => window.renderReady || window.renderError, { timeout: 30000 });
  const err = await page.evaluate(() => window.renderError);
  if (err) throw new Error(err);

  const report = await page.evaluate(
    async ({ preset, fps, probeW, staticThreshold }) => {
      const p0 = window.p0Config;
      const p1 = window.p1Config;
      const p2 = window.p2Config;
      const ranges = [];
      const push = (idStart, shots) => {
        for (let i = 0; i < shots.length - 1; i++) {
          ranges.push({ shot: `S${String(idStart + i).padStart(2, "0")}`, start: shots[i], end: shots[i + 1] });
        }
      };
      const want =
        { p2: ["p2"], p0: ["p0"], p1: ["p1"] }[preset] || ["p2", "p0", "p1"];
      if (want.includes("p2") && p2) push(1, p2.shots);
      if (want.includes("p0")) push(15, p0.shots);
      if (want.includes("p1")) push(20, p1.shots);

      const probeH = Math.max(1, Math.round((probeW * 9) / 16));
      const probe = document.createElement("canvas");
      probe.width = probeW;
      probe.height = probeH;
      const pg = probe.getContext("2d", { willReadFrequently: true });
      pg.imageSmoothingEnabled = true;
      const src = document.getElementById("storyboardCanvas");

      const results = [];
      for (const r of ranges) {
        const n = Math.max(2, Math.round((r.end - r.start) * fps));
        let prev = null;
        const diffs = [];
        for (let i = 0; i < n; i++) {
          const t = r.start + i / fps;
          window.renderFrame(t);
          pg.clearRect(0, 0, probeW, probeH);
          pg.drawImage(src, 0, 0, probeW, probeH);
          const cur = pg.getImageData(0, 0, probeW, probeH).data;
          if (prev) {
            let sum = 0;
            for (let p = 0; p < cur.length; p += 4) {
              sum += Math.abs(cur[p] - prev[p]);
            }
            diffs.push(sum / (cur.length / 4));
          }
          prev = cur;
        }
        const sorted = [...diffs].sort((a, b) => a - b);
        const mean = diffs.reduce((a, b) => a + b, 0) / diffs.length;
        const median = sorted[Math.floor(sorted.length / 2)];
        const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
        let still = 0;
        let run = 0;
        let longest = 0;
        for (const d of diffs) {
          if (d < staticThreshold) {
            still++;
            run++;
            longest = Math.max(longest, run);
          } else run = 0;
        }
        results.push({
          shot: r.shot,
          start: +r.start.toFixed(3),
          end: +r.end.toFixed(3),
          frames: n,
          diff_mean: +mean.toFixed(4),
          diff_median: +median.toFixed(4),
          diff_p95: +p95.toFixed(4),
          static_ratio: +(still / diffs.length).toFixed(4),
          longest_still: +(longest / fps).toFixed(3),
        });
      }
      return results;
    },
    { preset, fps, probeW, staticThreshold },
  );

  mkdirSync(resolve(out, ".."), { recursive: true });
  const total = report.reduce((a, r) => a + r.frames, 0);
  const weighted = report.reduce((a, r) => a + r.diff_mean * r.frames, 0) / total;
  const staticWeighted = report.reduce((a, r) => a + r.static_ratio * r.frames, 0) / total;
  const payload = {
    preset,
    fps,
    probe: `${probeW}x${Math.round((probeW * 9) / 16)}`,
    staticThreshold,
    overall: {
      frames: total,
      duration: +(total / fps).toFixed(3),
      diff_mean: +weighted.toFixed(4),
      static_ratio: +staticWeighted.toFixed(4),
    },
    shots: report,
    errors: failures,
  };
  writeFileSync(out, JSON.stringify(payload, null, 2));

  const pad = (s, n) => String(s).padEnd(n);
  console.log(pad("shot", 7) + pad("range", 20) + pad("mean", 9) + pad("median", 9) + pad("p95", 9) + pad("static", 9) + "longest");
  for (const r of report) {
    console.log(
      pad(r.shot, 7) +
      pad(`${r.start}-${r.end}`, 20) +
      pad(r.diff_mean.toFixed(3), 9) +
      pad(r.diff_median.toFixed(3), 9) +
      pad(r.diff_p95.toFixed(3), 9) +
      pad((r.static_ratio * 100).toFixed(1) + "%", 9) +
      r.longest_still.toFixed(2) + "s",
    );
  }
  console.log("");
  console.log(`overall: ${payload.overall.frames} frames, mean diff ${payload.overall.diff_mean}, static ${(payload.overall.static_ratio * 100).toFixed(1)}%`);
  console.log(`wrote ${out}`);
  if (failures.length) throw new Error("page errors: " + failures.join("; "));
} finally {
  if (browser) await browser.close();
  await new Promise((r) => server.close(r));
}
