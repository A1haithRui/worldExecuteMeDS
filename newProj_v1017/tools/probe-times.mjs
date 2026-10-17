#!/usr/bin/env node
// Render a list of song times and dump `window.frameDiagnostics` for each.
//
// The acceptance points in docs/dsh-fix-round1-prompt.md need numbers, not just
// pictures: the carrier origin, the ring's radius and alpha, the completed-call
// count, the drift envelope. Reading them straight out of the renderer is more
// reliable than counting pixels, and the same run also reports any reversed time
// windows the runtime guard saw.
//
//   node tools/probe-times.mjs --times 206.0,207.45 --json out/probe.json
//   node tools/probe-times.mjs --times 206.0 --folder out/frames   # also write PNGs
//
// Optional --select a.b,c.d prints just those dotted paths, one line per time.

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { startServer } from "../server.mjs";
import { dependency, chromePath } from "./media-runtime.mjs";

const args = process.argv.slice(2);
const arg = (k, d) => {
  const i = args.indexOf("--" + k);
  return i < 0 ? d : args[i + 1];
};

const times = String(arg("times", ""))
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .map(Number);
if (!times.length || times.some((t) => !Number.isFinite(t))) {
  console.error("--times needs a comma-separated list of song seconds");
  process.exit(2);
}
const jsonOut = arg("json");
const folder = arg("folder");
const selects = String(arg("select", ""))
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const label = arg("label", "");

const { server, url } = await startServer(0);
const { chromium } = dependency("playwright-core");
let browser;
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
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));
  await page.goto(url + "/?render=1&t=" + times[0]);
  await page.waitForFunction(() => window.renderReady || window.renderError, {
    timeout: 30000,
  });
  const bootError = await page.evaluate(() => window.renderError);
  if (bootError) throw new Error(bootError);

  if (folder) mkdirSync(resolve(folder), { recursive: true });
  // Start from a clean guard so this run's violations are this run's.
  await page.evaluate(() => window.resetTimeWindowGuard && window.resetTimeWindowGuard());

  const rows = [];
  for (const t of times) {
    const r = await page.evaluate((t) => {
      const diag = window.renderFrame(t);
      return {
        diag,
        png: document
          .getElementById("storyboardCanvas")
          .toDataURL("image/png")
          .split(",")[1],
      };
    }, t);
    if (folder)
      writeFileSync(resolve(folder, `frame-${t.toFixed(3)}.png`), Buffer.from(r.png, "base64"));
    rows.push({ time: t, diag: r.diag });
  }

  const guard = await page.evaluate(() =>
    window.timeWindowReport ? window.timeWindowReport() : null,
  );

  const report = {
    label,
    times,
    pageErrors,
    timeWindowViolations: guard?.violations ?? [],
    timeWindowViolationHits: guard?.hits ?? 0,
    rows,
  };
  if (jsonOut) {
    writeFileSync(resolve(jsonOut), JSON.stringify(report, null, 2));
    console.log(`wrote ${jsonOut}`);
  }

  const pick = (obj, path) =>
    path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
  if (selects.length) {
    console.log(`time      ${selects.join("  ")}`);
    for (const row of rows) {
      const vals = selects.map((p) => {
        const v = pick(row.diag, p);
        return typeof v === "number" ? (+v.toFixed(4)).toString() : JSON.stringify(v);
      });
      console.log(`${row.time.toFixed(3)}  ${vals.join("  ")}`);
    }
  } else {
    for (const row of rows) console.log(row.time.toFixed(3), JSON.stringify(row.diag));
  }
  console.log(
    `probe: ${rows.length} times, ${pageErrors.length} page errors, ` +
      `${report.timeWindowViolationHits} reversed-window hits`,
  );
  if (guard?.violations?.length) {
    for (const v of guard.violations)
      console.log(`  REVERSED ${v.kind} a=${v.a} b=${v.b} hits=${v.hits}`);
  }
} finally {
  if (browser) await browser.close();
  server.close();
}
