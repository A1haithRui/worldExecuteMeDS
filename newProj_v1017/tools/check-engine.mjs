// Regression harness for the pure engine modules.
//
//   node tools/check-engine.mjs [path/to/audio-features.json]
//
// These modules are pure, so they can be checked without a browser. The canvas
// and export paths are covered by tools/export-p0.mjs instead.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createFeatures, NO_ONSET } from "../src/engine/features.js";
import * as M from "../src/engine/motion.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const tablePath = process.argv[2] || resolve(root, "data/audio-features-v1.json");

const failures = [];
let checks = 0;
const ok = (name, cond, extra = "") => {
  checks++;
  if (!cond) failures.push(`${name} ${extra}`);
  console.log(`  ${cond ? "ok  " : "FAIL"} ${name}${extra ? "  " + extra : ""}`);
};
const near = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;

let table;
try {
  table = JSON.parse(readFileSync(tablePath, "utf8"));
} catch (error) {
  console.error(`Cannot read feature table: ${tablePath}\n${error.message}`);
  console.error("Generate it first: python tools/build-audio-features.py");
  process.exit(2);
}

const f = createFeatures(table);
const expectedDuration = table.source?.duration;

console.log(`features  (${tablePath})`);
ok("rate_hz positive", f.rate > 0, `= ${f.rate}`);
ok("count matches table", f.count === table.count, `= ${f.count}`);
ok("bpm plausible", f.bpm > 100 && f.bpm < 200, `= ${f.bpm.toFixed(4)}`);
ok("period matches bpm", near(f.period, 60 / f.bpm, 1e-9));
ok("duration matches source", expectedDuration == null || near(f.duration, expectedDuration, 1e-6));
ok("onsets present", f.onsetCount > 0, `= ${f.onsetCount}`);

let lo = 1;
let hi = 0;
for (let t = 0; t < f.duration; t += 0.37) {
  for (const name of table.series.names) {
    const v = f.seriesAt(name, t);
    if (!Number.isFinite(v)) failures.push(`${name} not finite at ${t}`);
    lo = Math.min(lo, v);
    hi = Math.max(hi, v);
  }
}
ok("all series in [0,1]", lo >= 0 && hi <= 1, `[${lo.toFixed(3)}, ${hi.toFixed(3)}]`);

// A frame must not depend on which frames were drawn before it.
const first = JSON.stringify(f.sample(68.3));
f.sample(150.9);
f.sample(3.14);
ok("sample deterministic across seeks", first === JSON.stringify(f.sample(68.3)));

const s = f.sample(68.3);
ok("sample numeric and finite", Object.values(s).every((v) => typeof v !== "number" || Number.isFinite(v)));
ok("beatPulse in (0,1]", s.beatPulse > 0 && s.beatPulse <= 1);
ok("barPulse in (0,1]", s.barPulse > 0 && s.barPulse <= 1);
ok("beatInBar in [0,4)", s.beatInBar >= 0 && s.beatInBar < 4, `= ${s.beatInBar}`);
ok("env is a peak-hold", f.envAt("low", 68.3) >= f.seriesAt("low", 68.3) - 1e-9);
ok("env <= 1", f.envAt("low", 68.3) <= 1 + 1e-9);

ok("beatTime(0) is the grid phase", near(f.beatTime(0), table.beat_grid.phase, 1e-9));
const b = f.beatAt(100);
ok("beatAt is self-consistent", near(f.beatTime(b.n), 100 - b.since, 1e-9));
ok("snapToBeat pulls a near miss", near(f.snapToBeat(f.beatTime(0) + 0.01), f.beatTime(0)));
ok("snapToBeat keeps a far value", f.snapToBeat(f.beatTime(0) + 0.3) === f.beatTime(0) + 0.3);

const window = f.onsetsIn(68.0, 69.0);
ok("onsetsIn finds a local window", window.length > 0 && window.length < 40, `= ${window.length}`);
ok("onsetsIn ascending", window.every((v, i) => i === 0 || v > window[i - 1]));
ok("onsetAt before first is sentinel", f.onsetAt(-5).index === -1 && f.onsetAt(-5).since === NO_ONSET);
ok("onsetPulse is 0 before the first onset", f.sample(-5).onsetPulse === 0);

for (const t of [-1e6, -10, -0.001, 0, 1e-4, f.duration - 1e-6, f.duration, f.duration + 50, 1e6]) {
  const r = f.sample(t);
  const bad = Object.values(r).some((v) => typeof v === "number" && !Number.isFinite(v));
  if (bad) failures.push(`sample non-finite at t=${t}`);
  try {
    JSON.stringify(r);
  } catch {
    failures.push(`sample not JSON-safe at t=${t}`);
  }
}
ok("edge times finite and JSON-safe", true);

console.log("motion");
ok("clamp", M.clamp(-1) === 0 && M.clamp(2) === 1 && M.clamp(0.5) === 0.5);
ok("mix", M.mix(0, 10, 0.25) === 2.5);
ok("smooth hits both ends", M.smooth(0) === 0 && M.smooth(1) === 1, `mid=${M.smooth(0.5)}`);
ok("easeOut hits both ends", M.easeOut(0) === 0 && M.easeOut(1) === 1);
ok("easeInOut hits both ends", M.easeInOut(0) === 0 && M.easeInOut(1) === 1);
ok("backOut lands on 1", near(M.backOut(1), 1), `= ${M.backOut(1)}`);
ok("easeBack lands on 1", near(M.easeBack(1), 1));
ok("backOut actually overshoots", Math.max(...Array.from({ length: 101 }, (_, i) => M.backOut(i / 100))) > 1);
ok("hit is 1 at the event", M.hit(2, 2, 6) === 1);
ok("hit is 0 before", M.hit(1, 2, 6) === 0);
ok("hit decays after", M.hit(2.5, 2, 6) > 0 && M.hit(2.5, 2, 6) < 1);
ok("spike is a triangle", M.spike(2, 2, 0.2) === 1 && M.spike(2.3, 2, 0.2) === 0);
ok("spring rests at both ends", M.spring(0) === 0 && M.spring(1) === 0 && M.spring(0.2) > 0);

let eLo = Infinity;
let eHi = -Infinity;
let nonFinite = 0;
for (const fn of [M.smooth, M.easeOut, M.easeIn, M.easeInOut, M.easeOutQuint, M.easeOutExpo, M.backOut, M.easeBack]) {
  for (let i = -5; i <= 105; i++) {
    const v = fn(i / 100);
    if (!Number.isFinite(v)) nonFinite++;
    eLo = Math.min(eLo, v);
    eHi = Math.max(eHi, v);
  }
}
ok("easings finite and bounded", nonFinite === 0 && eLo >= -0.15 && eHi <= 1.15, `[${eLo.toFixed(3)}, ${eHi.toFixed(3)}]`);

ok("hash01 in [0,1)", Array.from({ length: 1000 }, (_, i) => M.hash01(i, 7)).every((v) => v >= 0 && v < 1));
ok("hash01 stable", M.hash01(123, 45) === M.hash01(123, 45));
ok("hash01 spreads", new Set(Array.from({ length: 200 }, (_, i) => M.hash01(i))).size > 190);
const genA = M.mulberry32(7);
const genB = M.mulberry32(7);
const seqA = Array.from({ length: 50 }, () => genA());
const seqB = Array.from({ length: 50 }, () => genB());
ok("mulberry deterministic", seqA.every((v, i) => v === seqB[i]));
ok("mulberry in range", seqA.every((v) => v >= 0 && v < 1));
ok("mulberry spreads", new Set(seqA).size > 45, `${new Set(seqA).size}/50 distinct`);
ok("jitter bounded", Array.from({ length: 500 }, (_, i) => M.jitter(i * 0.013, 3)).every((v) => v >= -1 && v <= 1));
ok("shake finite", M.shake(12.34, 8, 2).every(Number.isFinite));
ok("ghosts newest first", (() => {
  const g = M.ghosts((t) => t, 10, 3, 0.05);
  return g.length === 4 && g[0] === 10 && near(g[3], 9.85, 1e-9);
})());
ok("held steps in blocks", M.held(0, 6, 60) === M.held(0.09, 6, 60) && M.held(0.11, 6, 60) !== M.held(0, 6, 60));
ok("blendInto lerps numbers", (() => {
  const r = M.blendInto({ a: 0, b: 10, s: "x" }, { a: 4, b: 0, s: "y" }, 0.5);
  return r.a === 2 && r.b === 5 && r.s === "y";
})());

console.log("");
if (failures.length) {
  console.log(`FAILED: ${failures.length} of ${checks} checks`);
  for (const m of failures) console.log(`  - ${m}`);
  process.exit(1);
}
console.log(`PASSED: all ${checks} engine module checks`);
