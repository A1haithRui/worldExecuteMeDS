// Re-render every shot: the subtitles are global, so all of them change.
import { spawnSync } from "node:child_process";
import { SHOTS_DERIVED } from "../shots/index.js";

const only = process.argv.slice(2).map((s) => s.padStart(3, "0"));
const names = [
  "preroll", "boot", "title", "geometry", "settings", "chorus1", "plates", "identity",
];

for (let i = 0; i < SHOTS_DERIVED.length; i++) {
  const n = String(i + 1).padStart(3, "0");
  if (only.length && !only.includes(n)) continue;
  const s = SHOTS_DERIVED[i];
  const name = s.id ?? `shot-${n}`;
  const out = `shots/${n}_${name}.mp4`;
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [
    "tools/export.mjs",
    "--from", String(s.at),
    "--to", String(s.until),
    "--fps", "30", "--width", "1280", "--height", "720",
    "--out", out,
  ], { encoding: "utf8" });
  const ok = r.status === 0;
  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`${n}/${SHOTS_DERIVED.length}  ${ok ? "ok " : "FAIL"}  ${out}  ${dt}s`);
  if (!ok) console.log((r.stderr || "").split("\n").slice(-4).join("\n"));
}
console.log("done");
