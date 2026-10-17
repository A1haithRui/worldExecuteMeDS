// Extract the Claude reference film's shot list as structured data.
//
// The reference project generates its own STORYBOARD.md from the live shot list
// (tools/storyboard.mjs), and the section modules are importable under Node as
// long as nothing touches the DOM while the list is built. This script reuses
// that path instead of parsing the markdown table, so the data we study is
// exactly what the film renders, field for field.
//
//   node tools/extract-shots.mjs
//
// Reads:  ../world-execute-me-lyric-mv/{config.json,src/**,data/**}
// Writes: data/shots.json, data/shots.js
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = fileURLToPath(new URL("../", import.meta.url));
const study = resolve(here);
// The reference checkout sits beside the study folder, at the workspace root.
const ref = resolve(here, "..", "world-execute-me-lyric-mv");
const refModule = (p) => pathToFileURL(resolve(ref, p)).href;

const { Features } = await import(refModule("src/engine/features.js"));
const { Lyrics } = await import(refModule("src/engine/lyrics.js"));
const { buildShots } = await import(refModule("src/scenes/index.js"));

const read = (p, fallback = {}) => {
  try {
    return JSON.parse(readFileSync(resolve(ref, p), "utf8"));
  } catch {
    return fallback;
  }
};

const cfg = read("config.json");
const features = new Features(read(cfg.paths.features), cfg);
const lyrics = new Lyrics(read(cfg.paths.lyrics), cfg, features);
// The section files only touch `art` while rendering; a stub is enough here.
const art = new Proxy({}, { get: () => () => null });
const shots = await buildShots({
  cfg,
  features,
  lyrics,
  art,
  script: read(cfg.paths.script),
  errors: read(cfg.paths.errors),
});

// The reference's own section grouping (mirrors tools/storyboard.mjs so the
// study page groups shots the same way its published table does).
const SECTION_TITLES = [
  [["preroll"], "0 片头：闪光警告页（歌曲开始之前）"],
  [["boot"], "1 启动"],
  [["title", "chat"], "2 标题与第一个问题"],
  [["v1"], "3 主歌一：用数学回答"],
  [["pre1"], "4 导歌一：设定被切换"],
  [["c1"], "5 副歌一：对话与四张版画"],
  [["v2"], "6 主歌二：三个名词三张版画，一张校样"],
  [["pre2"], "7 导歌二：设定改的是她本人"],
  [["c2", "left", "alone"], "8 副歌二到空线程：她站在视窗旁，然后第一次睁眼"],
  [["err", "crash"], "9 越界、第一个错误、扩散"],
  [["exec"], "10 EXECUTION：一台机器，十二圈"],
  [["count", "last"], "11 数数与最后一声"],
  [["cx"], "12 最后副歌：四张版画原位重印，但坏了"],
  [["out"], "13 LOVE 四句：课、测验、公式、证明"],
  [["down"], "14 结尾：一则以未读的图片讯息，逆向开机"],
  [["todo"], "（尚未分镜）"],
];
const sectionIndex = (id) =>
  SECTION_TITLES.findIndex(([prefixes]) => prefixes.some((p) => id === p || id.startsWith(p + "-")));

const PRE = cfg.safety.preroll ?? 0;
const DURATION = features.duration;
const endOf = (s) => Math.min(s.until, DURATION);
const beat = (t) => (t - features.t0) / features.period;
const barBeat = (t) => {
  if (t < 0) return "歌曲前";
  if (t === 0) return "0:1";
  const b = Math.round(beat(t) * 2) / 2;
  const bar = Math.floor(b / 4);
  const off = Math.abs(beat(t) - b) * features.period * 1000;
  return `${bar}:${(b - bar * 4 + 1).toFixed(1).replace(".0", "")}${off > 2 ? ` (+${off.toFixed(0)}ms)` : ""}`;
};
const rel = (t) => `${(t / features.period).toFixed(2)} 拍`;

const transition = (e) => {
  if (!e) return null;
  const bits = [];
  if (e.type && !(e.type === "cut" && !e.flash)) bits.push(e.type);
  else bits.push("cut");
  if (e.dur) bits.push(rel(e.dur) + (e.align && e.align !== "end" ? ` ${e.align}` : ""));
  if (e.flash) bits.push(`flash ${e.flash}`);
  return { text: bits.join(", "), type: e.type ?? "cut", dur: e.dur ?? 0, align: e.align ?? "end", flash: e.flash ?? 0 };
};

const rows = shots.map((s, i) => {
  const section = sectionIndex(s.id);
  return {
    index: i,
    id: s.id,
    section,
    sectionTitle: section >= 0 ? SECTION_TITLES[section][1] : "(未分组)",
    songStart: s.at,
    songEnd: endOf(s),
    duration: endOf(s) - s.at,
    filmStart: s.at + PRE,
    filmEnd: endOf(s) + PRE,
    barBeat: barBeat(s.at),
    beatOffsetMs: Math.abs(beat(s.at) - Math.round(beat(s.at) * 2) / 2) * features.period * 1000,
    lines: s.lines ? [s.lines[0], s.lines[1]] : null,
    lineLabel: s.lines ? (s.lines[0] === s.lines[1] ? String(s.lines[0] + 1) : `${s.lines[0] + 1}-${s.lines[1] + 1}`) : "-",
    moment: s.moment ?? "",
    layout: s.layout ?? "",
    state: s.state ?? "",
    enter: transition(s.enter),
    exit: transition(shots[i + 1]?.enter ?? null),
  };
});

const sections = SECTION_TITLES.map(([, title], k) => {
  const ss = rows.filter((r) => r.section === k);
  if (!ss.length) return null;
  return {
    index: k,
    title,
    from: ss[0].songStart,
    to: ss[ss.length - 1].songEnd,
    count: ss.length,
    avg: (ss[ss.length - 1].songEnd - ss[0].songStart) / ss.length,
    states: [...new Set(ss.map((r) => r.state))].join(" / "),
  };
}).filter(Boolean);

let commit = "unknown";
try {
  commit = execFileSync("git", ["-C", ref, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
} catch {
  /* the reference checkout may have no .git; not fatal */
}

// The reference's own checks, reproduced so we can report them honestly.
const covered = new Set();
for (const s of shots) if (s.lines) for (let i = s.lines[0]; i <= s.lines[1]; i++) covered.add(i);
const missing = lyrics.lines.map((_, i) => i).filter((i) => !covered.has(i));
const offGrid = shots.filter((s) => s.at > 0.3 && Math.abs(beat(s.at) * 2 - Math.round(beat(s.at) * 2)) * features.period * 1000 > 2);
const noMoment = shots.filter((s) => !s.moment || /not storyboarded/.test(s.moment));
const fallback = shots.filter((s) => s.id.startsWith("todo-"));

const data = {
  source: {
    project: "world-execute-me-lyric-mv",
    commit,
    preroll: PRE,
    bpm: features.bpm,
    t0: features.t0,
    period: features.period,
    songDuration: DURATION,
    filmDuration: DURATION + PRE,
    lyricLines: lyrics.lines.length,
    note: "song time = film time - preroll; the table's times are song time",
  },
  checks: {
    lyricCoverageMissing: missing.map((i) => i + 1),
    offGrid: offGrid.map((s) => ({ id: s.id, at: s.at, ms: Math.abs(beat(s.at) * 2 - Math.round(beat(s.at) * 2)) * features.period * 1000 })),
    noMoment: noMoment.map((s) => s.id),
    fallbackShots: fallback.map((s) => s.id),
  },
  sections,
  shots: rows,
};

mkdirSync(resolve(study, "data"), { recursive: true });
writeFileSync(resolve(study, "data/shots.json"), JSON.stringify(data, null, 2));
writeFileSync(
  resolve(study, "data/shots.js"),
  "// Generated by tools/extract-shots.mjs -- loaded as a classic script so the\n" +
    "// study page works over file:// (ES modules are blocked there).\n" +
    "window.CLAUDE_STUDY = " + JSON.stringify(data) + ";\n",
);

console.log(`参考片：${rows.length} 个镜头，${sections.length} 段，歌曲 ${DURATION.toFixed(3)}s，成片 ${data.source.filmDuration.toFixed(3)}s，片头 ${PRE}s`);
console.log(`节拍：${features.bpm} BPM，第 0 拍在 ${features.t0}s（一拍 ${features.period.toFixed(4)}s）`);
console.log("各段：");
sections.forEach((s) =>
  console.log(
    `  ${String(s.index).padStart(2)}  ${s.title.padEnd(30)} ${s.count} 镜  ${s.from.toFixed(2)}–${s.to.toFixed(2)}s  平均 ${s.avg.toFixed(2)}s  ${s.states}`,
  ),
);
console.log("参考片自检：");
console.log(`  歌词覆盖：${missing.length ? "缺 " + missing.map((i) => i + 1).join(",") : `全部 ${lyrics.lines.length} 行`}`);
console.log(`  剪辑点对拍：${offGrid.length ? offGrid.map((s) => s.id).join(", ") : "全部落在拍/半拍线上"}`);
console.log(`  对话时刻：${noMoment.length ? noMoment.map((s) => s.id).join(", ") : "每镜都有"}`);
console.log(`  后备镜头：${fallback.length ? fallback.map((s) => s.id).join(", ") : "无"}`);
