// Generate STORYBOARD.md and the machine-readable shot list from shots/table.js.
//
//   node tools/build-storyboard.mjs
//
// The table is generated from the live shot list, so it can never drift from the
// code -- the same reason the reference project generates its own storyboard.
// Nothing here is typed by hand except the table itself.
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SECTIONS, SHOTS_DERIVED, SOURCE, progress, validate } from "../shots/index.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const cfg = JSON.parse(readFileSync(resolve(root, "config.json"), "utf8"));
const lyrics = JSON.parse(readFileSync(resolve(root, cfg.paths.lyrics), "utf8"));

const tc = (t) => {
  const a = Math.abs(t);
  const m = Math.floor(a / 60);
  const s = a - m * 60;
  return `${t < -1e-6 ? "−" : ""}${m}:${s.toFixed(2).padStart(5, "0")}`;
};
const pct = (n, d) => `${Math.round((n / d) * 100)}%`;
const trans = (e) => {
  if (!e) return "—";
  const bits = [e.type ?? "cut"];
  if (e.dur) bits.push(`${e.dur}s`);
  if (e.align && e.align !== "end") bits.push(e.align);
  if (e.flash) bits.push(`flash ${e.flash}`);
  return bits.join(", ");
};

const lyrics_ = lyrics.lines ?? [];
const pr = progress();
const issues = validate({ features: { lyricLines: lyrics_.length, maxFlash: cfg.safety.maxFlash } });

// --- section table ---------------------------------------------------------
const secRows = SECTIONS.map((sec) => {
  const ss = SHOTS_DERIVED.filter((s) => s.section === sec.index);
  if (!ss.length) return null;
  const from = ss[0].at;
  const to = ss[ss.length - 1].until;
  const written = ss.filter((s) => s.momentState === "written").length;
  const inherited = ss.filter((s) => s.momentState === "inherited").length;
  const todo = ss.filter((s) => s.momentState === "todo").length;
  return `| ${sec.index} | ${sec.title} | ${ss.length} | ${tc(from)}–${tc(to)} | ${((to - from) / ss.length).toFixed(2)} s | ${written}/${ss.length} | ${inherited} | ${todo} |`;
})
  .filter(Boolean)
  .join("\n");

// --- shot rows -------------------------------------------------------------
const rows = SHOTS_DERIVED.map((s) => {
  const lines = s.lines ? (s.lines[0] === s.lines[1] ? `${s.lines[0]}` : `${s.lines[0]}-${s.lines[1]}`) : "-";
  const state =
    s.momentState === "written" ? "已写" : s.momentState === "inherited" ? `承接 ${s.inherits ?? "?"}` : "**待写**";
  const moment = s.moment ? s.moment.replace(/\|/g, "/") : "";
  return `| ${tc(s.at)}-${tc(s.until)} | ${s.barBeat} | \`${s.id}\` | ${lines} | ${moment} | ${s.picture} | ${s.state} | ${trans(s.enter)} | ${s.referenceEnter} | ${state} |`;
}).join("\n");

// Flash range, computed from the shots that actually carry flash.
const flashShots = SHOTS_DERIVED.filter((s) => (s.enter?.flash ?? 0) > 0);
const flashRange = flashShots.length
  ? `${tc(flashShots[0].at)}–${tc(flashShots[flashShots.length - 1].until)}（歌曲时间）`
  : "无";

const md = `# 分镜表 / Storyboard · DeepSeek 版

由 \`node tools/build-storyboard.mjs\` 从 \`shots/table.js\` 自动生成(共 ${SHOTS_DERIVED.length} 个镜头,平均 ${(
  SHOTS_DERIVED.reduce((a, s) => a + s.duration, 0) / SHOTS_DERIVED.length
).toFixed(2)} 秒)。

**镜头与参考片一一对应**:同一首音频、同一套段落、同一个镜头 id,所以两支片子可以直接放在同一条时间轴上逐镜对比。

时间一律为**歌曲时间**(音频开始 = 0)。成片在歌曲前有 ${SOURCE.preroll} 秒无声的闪光警告页,所以**成片时间 = 歌曲时间 + ${SOURCE.preroll}**。

节拍:${SOURCE.bpm} BPM,第 0 拍在 ${SOURCE.phase} s,一拍 ${SOURCE.period.toFixed(6)} s,一小节 ${(
  SOURCE.period * 4
).toFixed(4)} s。网格相位取自**最强的 40 个底鼓起始点**(它们落在网格点后 1–33 ms,属正常检测延迟);参考片用的 ${(
  0.344
).toFixed(3)} s 会让每个底鼓落在网格点**之前** 10–37 ms,因此本表的时间是"参考片的拍位 + 我们的相位",统一前移 ${Math.abs(
  SOURCE.phaseFix,
).toFixed(3)} s。

**含闪烁画面**:${flashRange}。上限 \`config.safety.maxFlash = ${cfg.safety.maxFlash}\`,由自检强制。

## 进度

| 项 | 数量 |
| --- | --- |
| 镜头总数 | ${pr.total} |
| 叙事时刻已写 | **${pr.written}** |
| 从 newProj_v1014 承接(待重写) | ${pr.inherited} (${pct(pr.inherited, pr.total)}) |
| 完全待写 | ${pr.todo} |
| 已配成形转场 | ${pr.formedTransitions} (${pct(pr.formedTransitions, pr.total)};参考片是 13/87 = 15%) |
| 带 flash 的镜头 | ${pr.flashShots},最大 ${pr.maxFlash} |

## 段落总表

| # | 段落 | 镜头数 | 时间 | 平均镜头长 | 时刻已写 | 承接 | 待写 |
| --- | --- | --- | --- | --- | --- | --- | --- |
${secRows}

## 逐镜头

「时刻」栏说明这一镜是这场对话的哪个时刻——审片时唯一的叙事依据。
「画面」栏:ui(用户看到的界面)· plate(版画/图形)· portrait(角色)· code(程式码)· todo(未定)。
「参考片进入」栏是参考片在这一镜用的转场,仅供参考;我们的进入转场默认硬切,直到那一镜被真正设计过。

| 歌曲时间 | 小节:拍 | 镜头 id | 歌词行 | 时刻 | 画面 | 颜色 | 进入转场 | 参考片进入 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows}

## 检查

${issues.length ? issues.map((i) => `- **${i}**`).join("\n") : "- 结构检查:全部通过(首尾相接、无空隙重叠、切点全部落在半拍网格、歌词全覆盖、flash 不超上限)"}
`;

writeFileSync(resolve(root, cfg.paths.storyboard), md);

// Machine-readable copies for the review/compare pages and future tools.
const data = {
  source: SOURCE,
  safety: cfg.safety,
  checks: { issues },
  progress: pr,
  sections: SECTIONS,
  shots: SHOTS_DERIVED,
};
writeFileSync(resolve(root, "data/shots.json"), JSON.stringify(data, null, 2));
writeFileSync(
  resolve(root, "data/shots.js"),
  "// Generated by tools/build-storyboard.mjs -- loaded as a classic script so the\n" +
    "// pages work over file:// (ES modules are blocked there).\n" +
    "window.MV = " + JSON.stringify(data) + ";\n",
);

console.log(`STORYBOARD.md 已生成：${pr.total} 镜 / ${SECTIONS.length} 段`);
console.log(`  时刻：已写 ${pr.written} · 承接 ${pr.inherited} · 待写 ${pr.todo}`);
console.log(`  成形转场 ${pr.formedTransitions}/${pr.total}（${pct(pr.formedTransitions, pr.total)}）· flash 上限 ${pr.maxFlash}`);
console.log(`  闪烁区间：${flashRange}`);
if (issues.length) {
  console.log(`  结构检查：${issues.length} 项问题`);
  issues.slice(0, 8).forEach((i) => console.log("    - " + i));
  process.exitCode = 1;
} else {
  console.log("  结构检查：全部通过");
}
