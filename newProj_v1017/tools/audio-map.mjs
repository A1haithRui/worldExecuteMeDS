// Print a bar-by-bar map of the song: energy bands, onsets and which lyric
// lines fall in each bar. This is the tool for choosing section boundaries --
// cuts should be placed where the music changes, not where it feels right.
//
//   node tools/audio-map.mjs              # every bar
//   node tools/audio-map.mjs --from 55 --to 100
//   node tools/audio-map.mjs --summary    # 8-bar blocks only
//
// Times are SONG time. Bars are counted from the grid phase (bar 0 starts at
// the first beat), so a section boundary that lands on a bar line can be quoted
// as a bar number and reproduced exactly.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createFeatures } from "../src/engine/features.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const cfg = JSON.parse(readFileSync(resolve(root, "config.json"), "utf8"));
const table = JSON.parse(readFileSync(resolve(root, cfg.paths.features), "utf8"));
const f = createFeatures(table);
const lyrics = JSON.parse(readFileSync(resolve(root, cfg.paths.lyrics), "utf8"));

const argv = process.argv.slice(2);
const num = (name, def) => {
  const i = argv.indexOf("--" + name);
  return i < 0 ? def : Number(argv[i + 1]);
};
const summary = argv.includes("--summary");
const from = num("from", 0);
const to = num("to", 1e9);

const BEATS = 4;
const barLen = f.period * BEATS;
const barAt = (n) => f.phase + n * barLen;
const bars = Math.ceil((f.duration - f.phase) / barLen);

const lines = lyrics.lines ?? [];
const linesIn = (a, b) =>
  lines
    .map((l, i) => ({ i, start: l.start, end: l.end }))
    .filter((l) => l.end > a && l.start < b)
    .map((l) => l.i + 1);

const mean = (name, a, b) => {
  let sum = 0, n = 0;
  for (let t = a; t < b; t += 1 / table.rate_hz) {
    sum += f.seriesAt(name, t);
    n++;
  }
  return n ? sum / n : 0;
};
const onsetsIn = (a, b) => f.onsetsIn(a, b).length;

console.log(`${cfg.song.title}`);
console.log(
  `时长 ${f.duration.toFixed(3)}s · ${f.bpm.toFixed(4)} BPM · 一拍 ${f.period.toFixed(4)}s · 一小节 ${barLen.toFixed(4)}s · 第 0 拍在 ${f.phase.toFixed(3)}s · 共 ${bars} 小节`,
);
console.log(`片头警告页 ${cfg.safety.preroll}s（成片时间 = 歌曲时间 + ${cfg.safety.preroll}）`);
console.log("");

const bar = "█";
const block = 8;
const rows = [];

const push = (n) => {
  const a = barAt(n);
  const b = Math.min(barAt(n + 1), f.duration);
  if (b <= a) return;
  const rms = mean("rms", a, b);
  const low = mean("low", a, b);
  const mid = mean("mid", a, b);
  const high = mean("high", a, b);
  const on = onsetsIn(a, b);
  const ln = linesIn(a, b);
  rows.push({ n, a, b, rms, low, mid, high, on, ln });
};

for (let n = 0; n < bars; n++) push(n);

const bar100 = (v) => bar.repeat(Math.max(0, Math.round(v * 24)));

if (summary) {
  const blocks = [];
  for (let n = 0; n < bars; n += block) {
    const group = rows.filter((r) => r.n >= n && r.n < n + block);
    if (!group.length) continue;
    const a = group[0].a;
    const b = group[group.length - 1].b;
    const ln = linesIn(a, b);
    blocks.push({
      n,
      a,
      b,
      rms: group.reduce((s, r) => s + r.rms, 0) / group.length,
      low: group.reduce((s, r) => s + r.low, 0) / group.length,
      on: group.reduce((s, r) => s + r.on, 0),
      ln,
    });
  }
  console.log("小节   时间              RMS    low  起音  歌词行");
  blocks.forEach((g) => {
    console.log(
      `${String(g.n).padStart(3)}-${String(g.n + block - 1).padStart(3)}  ${g.a.toFixed(2).padStart(7)}–${g.b.toFixed(2).padStart(7)}  ${g.rms.toFixed(3)}  ${bar100(g.rms).padEnd(24)}  ${String(g.on).padStart(4)}  ${g.ln.length ? g.ln[0] + "–" + g.ln[g.ln.length - 1] : "-"}`,
    );
  });
} else {
  console.log("小节  时间                RMS    low   mid   high  起音  歌词行");
  rows
    .filter((r) => r.n >= from && r.n <= to)
    .forEach((r) => {
      console.log(
        `${String(r.n).padStart(3)}  ${r.a.toFixed(2).padStart(7)}–${r.b.toFixed(2).padStart(7)}  ${r.rms.toFixed(3)}  ${bar100(r.rms).padEnd(24)} ${r.low.toFixed(2)}  ${r.mid.toFixed(2)}  ${r.high.toFixed(2)}  ${String(r.on).padStart(4)}  ${r.ln.length ? r.ln[0] + "–" + r.ln[r.ln.length - 1] : "-"}`,
      );
    });
}

// Where do lyric lines start and end? Sections rarely begin mid-line.
console.log("");
console.log("歌词行时间（1 起算；用于把段落边界对齐到句子）：");
const rowText = lines
  .map((l, i) => `${String(i + 1).padStart(3)}:${l.start.toFixed(2)}`)
  .join("  ");
for (let i = 0; i < rowText.length; i += 150) console.log("  " + rowText.slice(i, i + 150));
