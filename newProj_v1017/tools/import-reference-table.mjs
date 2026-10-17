// Bootstrap our shot table from the reference film's shot list.
//
// We are deliberately mirroring the reference 1:1: same sections, same shot
// ids, same lyric lines, same slot count (87), because we use the same audio
// and want the two films on one timeline. Two things are NOT copied:
//
//   1. Times are re-derived on OUR beat grid. The reference's grid phase is
//      0.344s; ours is 0.310s. Against the strongest 40 kick onsets the
//      reference's phase puts every kick 10-37 ms BEFORE the grid point, while
//      ours puts them 1-33 ms after (a normal detector lag), so ours is the one
//      that matches the music. Every reference time is therefore shifted by
//      (0.310 - 0.344) = -0.034 s, keeping its bar/beat position.
//   2. Moments are ours. Where one of our own v1014 shots covers a slot, its
//      picture_event is carried over as a PROVISIONAL moment and marked
//      inherited; everything else is marked todo so the checker can count it
//      down instead of hiding it.
//
// Output is hand-maintained from then on; re-running this overwrites it.
//
//   node tools/import-reference-table.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const study = resolve(root, "..", "claude-version-study");
const v1014 = resolve(root, "..", "newProj_v1014");

const cfg = JSON.parse(readFileSync(resolve(root, "config.json"), "utf8"));
const features = JSON.parse(readFileSync(resolve(root, cfg.paths.features), "utf8"));
const ref = JSON.parse(readFileSync(resolve(study, "data/shots.json"), "utf8"));
const prev = JSON.parse(readFileSync(resolve(v1014, "data/storyboard-v1.json"), "utf8"));

// --- beat grid -------------------------------------------------------------
const rate = features.rate_hz;
const count = features.count;
const grid = features.beat_grid;
const period = grid.period || 60 / grid.bpm;
const phase = grid.phase || 0;
const BEATS_PER_BAR = 4;
const PHASE_FIX = 0.310 - 0.344; // reference grid -> our grid

const toGrid = (t) => {
  const n = Math.round((t - phase) / (period / 2)); // nearest half beat
  return phase + n * (period / 2);
};
const barBeat = (t) => {
  if (t <= 0) return "歌曲前";
  const b = (t - phase) / period;
  const half = Math.round(b * 2) / 2;
  const bar = Math.floor(half / BEATS_PER_BAR);
  const off = Math.abs(b - half) * period * 1000;
  return `${bar}:${(half - bar * BEATS_PER_BAR + 1).toFixed(1).replace(".0", "")}${off > 2 ? ` (+${off.toFixed(0)}ms)` : ""}`;
};

// --- our own previous shots, for provisional moments -----------------------
const PICTURE = { chat: "ui", plate: "plate", model: "portrait", portrait: "portrait", code: "code" };
const prevShots = prev.shots.map((s) => ({
  id: s.id,
  start: s.start,
  end: s.end,
  moment: s.picture_event ?? "",
  picture: PICTURE[s.dominant] ?? "ui",
  lines: s.lyric_lines ?? null,
}));

function inheritFor(a, b) {
  let best = null;
  for (const p of prevShots) {
    const overlap = Math.min(b, p.end) - Math.max(a, p.start);
    if (overlap <= 0) continue;
    if (!best || overlap > best.overlap) best = { overlap, shot: p };
  }
  if (!best) return { shot: null, coverage: 0 };
  return { shot: best.shot, coverage: best.overlap / (b - a) };
}

// --- build the table -------------------------------------------------------
const END = features.source.duration;
const lastRef = ref.shots[ref.shots.length - 1].id;
const shots = ref.shots.map((r) => {
  // The warning page plays before the song, where there is no beat yet, so it
  // keeps its own times instead of being snapped to a grid that does not
  // exist there. The last shot runs to the end of the song for the same
  // reason: the song simply stops, it does not land on a beat.
  const isPreroll = r.section === 0;
  const isLast = r.id === lastRef;
  const atRaw = isPreroll ? r.songStart : r.songStart <= 0 ? 0 : toGrid(r.songStart + PHASE_FIX);
  const untilRaw = isPreroll ? 0 : isLast ? END : toGrid(r.songEnd + PHASE_FIX);
  const { shot, coverage } = inheritFor(atRaw, untilRaw);
  const inherited = shot && coverage >= 0.75 && shot.moment;
  return {
    id: r.id,
    section: r.section,
    at: Number(atRaw.toFixed(4)),
    // The final shot's end is the song's own end, so it keeps full precision:
    // rounding 211.957596 up to 211.9576 would poke past the song by 4 µs.
    until: isLast ? untilRaw : Number(untilRaw.toFixed(4)),
    atRaw,
    untilRaw,
    lines: r.lines ? [r.lines[0] + 1, r.lines[1] + 1] : null,
    picture: inherited ? shot.picture : "todo",
    moment: inherited ? shot.moment : "",
    momentState: inherited ? "inherited" : "todo",
    inherits: shot ? shot.id : null,
    inheritCoverage: Number(coverage.toFixed(2)),
    state: r.state === "off" ? "off" : "todo",
    enter: { type: "cut" },
    referenceEnter: r.enter && r.enter.text ? r.enter.text : "cut",
  };
});

// The snap must be exact before rounding: 4-decimal output would otherwise
// look off-grid by up to 5e-5 s. The warning page and the final shot are
// deliberately exempt (no beat exists before the song / at its end).
const offGrid = shots.filter(
  (s) => s.atRaw > 0 && Math.abs(s.atRaw - toGrid(s.atRaw)) > 1e-9 && s.until !== END && s.at !== s.until,
);
if (offGrid.length) throw new Error(`内部错误：${offGrid.length} 个切点没有落在网格上，例如 ${offGrid[0].id}`);
shots.forEach((s) => {
  delete s.atRaw;
  delete s.untilRaw;
});

const header = `// Our shot table, mirroring the reference film's shot list 1:1.
//
// Bootstrapped by tools/import-reference-table.mjs on ${new Date().toISOString().slice(0, 10)} from
// claude-version-study/data/shots.json (reference commit ${ref.source.commit.slice(0, 8)}).
// From here on this file is HAND-MAINTAINED: edit it, do not re-run the importer
// unless you intend to throw the edits away.
//
// Times are SONG time on OUR grid (phase ${phase.toFixed(3)}s, one beat ${period.toFixed(6)}s,
// ${grid.bpm} BPM). Film time = song time + config.safety.preroll.
//
// momentState:
//   written   -- we wrote this sentence; it is the shot's reason to exist
//   inherited -- carried over from newProj_v1014 and NOT yet rewritten
//   todo      -- nothing written yet; tools/check-storyboard.mjs counts these
//
// inherits: which v1014 shot the provisional text came from, for tracing back.
// referenceEnter: what the reference cut with here. Informational only -- our
// own enter stays "cut" until a slot is actually designed.

`;

const body =
  "export const SECTIONS = " +
  JSON.stringify(
    ref.sections.map((s) => ({ index: s.index, title: s.title, count: s.count })),
    null,
    2,
  ) +
  ";\n\nexport const SHOTS = " +
  JSON.stringify(shots, null, 2) +
  ";\n\nexport const SOURCE = " +
  JSON.stringify(
    {
      reference: "world-execute-me-lyric-mv",
      referenceCommit: ref.source.commit,
      songDuration: END,
      preroll: cfg.safety.preroll,
      bpm: grid.bpm,
      period: Number(period.toFixed(6)),
      phase,
      phaseFix: PHASE_FIX,
      lyricLines: ref.source.lyricLines,
    },
    null,
    2,
  ) +
  ";\n";

mkdirSync(resolve(root, "shots"), { recursive: true });
writeFileSync(resolve(root, "shots/table.js"), header + body);
const byState = shots.reduce((a, s) => ((a[s.momentState] = (a[s.momentState] ?? 0) + 1), a), {});
const pct = (n) => Math.round((n / shots.length) * 100);
console.log(`shots/table.js 已生成：${shots.length} 镜，${ref.sections.length} 段`);
console.log(`  相位修正 ${PHASE_FIX.toFixed(3)}s（参考片 ${0.344}s → 我们 ${phase.toFixed(3)}s）`);
console.log(
  `  moment：written ${byState.written ?? 0} · inherited ${byState.inherited ?? 0}（${pct(byState.inherited ?? 0)}%）· todo ${byState.todo ?? 0}`,
);
console.log(`  时间范围：${shots[0].at.toFixed(3)} – ${shots[shots.length - 1].until.toFixed(3)}（歌曲 ${END.toFixed(3)}s）`);
