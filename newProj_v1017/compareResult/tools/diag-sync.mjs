import { createRequire } from "node:module";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const here = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(resolve(here, "../../world-execute-me-lyric-mv/package.json"));
const { chromium } = require("playwright-core");
const b = await chromium.launch({ channel: "chrome", headless: true });
const p = await b.newPage({ viewport: { width: 1200, height: 800 } });
await p.goto(pathToFileURL(resolve(here, "index.html")).href, { waitUntil: "load" });
await p.waitForTimeout(2500);
const out = await p.evaluate(async () => {
  const vL = document.getElementById('vL'), vR = document.getElementById('vR');
  const wait = (v) => new Promise((r) => v.readyState >= 2 ? r() : setTimeout(r, 500));
  await wait(vL); await wait(vR);
  document.querySelector('#rows tbody tr.shot[data-i="11"]').click();
  const cfg = window.COMPARE;
  const samples = [];
  for (let i = 0; i < 12; i++) {
    await new Promise((r) => setTimeout(r, 300));
    samples.push({
      t: +( (vL.currentTime - cfg.left.preroll) - (vR.currentTime - cfg.right.preroll) ).toFixed(3),
      rL: vL.readyState, rR: vR.readyState,
      rateL: +vL.playbackRate.toFixed(3), rateR: +vR.playbackRate.toFixed(3),
      pausedL: vL.paused, pausedR: vR.paused,
    });
  }
  return samples;
});
console.log('song(L) - song(R) 每 300ms 采样：');
out.forEach((s, i) => console.log(`  ${(i+1)*300}ms  差 ${String(s.t).padStart(7)}s  rate L/R ${s.rateL}/${s.rateR}  rs ${s.rL}/${s.rR}  paused ${s.pausedL}/${s.pausedR}`));
await b.close();
