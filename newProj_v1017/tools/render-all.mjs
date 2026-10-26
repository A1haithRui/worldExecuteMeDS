// Re-render every shot at an arbitrary size and rate.
//
//   node tools/render-all.mjs                     720p30 into shots
//   node tools/render-all.mjs --w 3840 --h 2160 --fps 60 --dir shots4k
//
// The 4K pass writes to its own directory so the 720p master is never overwritten by
// an experiment, and the film is built from whichever directory is asked for.
import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { SHOTS_DERIVED } from "../shots/index.js";

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const W = opt("--w", "1280");
const H = opt("--h", "720");
const FPS = opt("--fps", "30");
const DIR = opt("--dir", "shots");
const only = args.filter((a) => /^\d{3}$/.test(a));

mkdirSync(DIR, { recursive: true });
console.log(`rendering ${SHOTS_DERIVED.length} shots at ${W}x${H} ${FPS}fps → ${DIR}`);

for (let i = 0; i < SHOTS_DERIVED.length; i++) {
  const n = String(i + 1).padStart(3, "0");
  if (only.length && !only.includes(n)) continue;
  const s = SHOTS_DERIVED[i];
  const out = `${DIR}/${n}_${s.id ?? "shot"}.mp4`;
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [
    "tools/export.mjs",
    "--from", String(s.at),
    "--to", String(s.until),
    "--fps", FPS, "--width", W, "--height", H,
    "--out", out,
  ], { encoding: "utf8" });
  const ok = r.status === 0;
  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  const elapsed = ((Date.now() - t0) / 60000).toFixed(1);
  console.log(`${n}/${SHOTS_DERIVED.length}  ${ok ? "ok " : "FAIL"}  ${out}  ${dt}s  (this shot ${elapsed} min)`);
  if (!ok) console.log((r.stderr || "").split("\n").slice(-4).join("\n"));
}
console.log("done");
