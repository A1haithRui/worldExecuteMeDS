// The shot list, assembled and validated.
//
// shots/table.js is the source of truth (hand-maintained); this module adds
// derived fields, answers "which shot is on screen at time t", and states every
// structural rule the table must obey so both the storyboard generator and the
// runtime agree on what a valid table is.
import { SECTIONS, SHOTS, SOURCE } from "./table.js";

export { SECTIONS, SOURCE };

export const BEATS_PER_BAR = 4;
const half = SOURCE.period / 2;

/** Song time of half-beat n (the grid every cut lands on). */
export const gridTime = (n) => SOURCE.phase + n * half;
/** Nearest half-beat to a song time. */
export const snapHalf = (t) => gridTime(Math.round((t - SOURCE.phase) / half));

const EPS = 1e-6;

/** "bar:beat" for a song time, plus how far it is off the half-beat grid. */
export function barBeat(t) {
  if (t <= 0) return { text: "歌曲前", offMs: 0 };
  const beats = (t - SOURCE.phase) / SOURCE.period;
  const snapped = Math.round(beats * 2) / 2;
  const offMs = Math.abs(beats - snapped) * SOURCE.period * 1000;
  const bar = Math.floor(snapped / BEATS_PER_BAR);
  const beat = snapped - bar * BEATS_PER_BAR + 1;
  return { text: `${bar}:${beat.toFixed(1).replace(".0", "")}`, offMs, bar, beat };
}

/** Shots with derived timing and grid facts. */
export const SHOTS_DERIVED = SHOTS.map((s, i) => {
  const bb = barBeat(s.at);
  const next = SHOTS[i + 1];
  // The table is contiguous, so a shot ends where the next begins; saying it
  // this way means a gap or an overlap cannot hide behind two sources of truth.
  const until = next ? next.at : s.until;
  return {
    ...s,
    index: i,
    until,
    duration: until - s.at,
    filmStart: s.at + SOURCE.preroll,
    filmEnd: until + SOURCE.preroll,
    barBeat: bb.text,
    offGridMs: bb.offMs,
    sectionTitle: SECTIONS[s.section]?.title ?? "(未分组)",
    // The warning page is before the song and the final shot runs to the song's
    // end, so neither can sit on a beat grid that does not exist there.
    gridExempt: s.section === 0 || !next,
  };
});

export const shotById = (id) => SHOTS_DERIVED.find((s) => s.id === id) ?? null;

/** The shot on screen at song time t (the warning page covers t < 0). */
export function shotAt(t) {
  let lo = 0;
  let hi = SHOTS_DERIVED.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const s = SHOTS_DERIVED[mid];
    if (t < s.at) hi = mid - 1;
    else if (t >= s.until) lo = mid + 1;
    else return s;
  }
  // Before the first shot or after the last: clamp, so a renderer never gets
  // null for a time inside the film's own range.
  return t < SHOTS_DERIVED[0].at ? SHOTS_DERIVED[0] : SHOTS_DERIVED[SHOTS_DERIVED.length - 1];
}

/**
 * Every structural rule the table must satisfy. Returns a list of problems,
 * empty when the table is sound. Callers decide which ones are fatal.
 */
export function validate({ features } = {}) {
  const issues = [];
  const ids = new Set();

  SHOTS_DERIVED.forEach((s, i) => {
    if (!s.id) issues.push(`第 ${i} 项没有 id`);
    if (ids.has(s.id)) issues.push(`${s.id}: id 重复`);
    ids.add(s.id);
    if (!(s.until > s.at)) issues.push(`${s.id}: 结束时间不晚于开始时间`);
    if (!s.gridExempt && s.offGridMs > 2) issues.push(`${s.id}: 切点偏离半拍网格 ${s.offGridMs.toFixed(1)}ms`);
    if (s.section == null || !SECTIONS[s.section]) issues.push(`${s.id}: 段落编号无效`);
    if (s.momentState === "written" && !s.moment.trim()) issues.push(`${s.id}: 标为已写但没有内容`);
    if (s.momentState !== "written" && s.momentState !== "inherited" && s.momentState !== "todo")
      issues.push(`${s.id}: momentState 非法（${s.momentState}）`);
    if (s.lines && s.lines[0] > s.lines[1]) issues.push(`${s.id}: 歌词行区间反了`);
  });

  const first = SHOTS_DERIVED[0];
  const last = SHOTS_DERIVED[SHOTS_DERIVED.length - 1];
  if (Math.abs(first.at - -SOURCE.preroll) > EPS)
    issues.push(`首镜应从 -${SOURCE.preroll} 开始（片头警告页），实际 ${first.at}`);
  if (Math.abs(last.until - SOURCE.songDuration) > 0.05)
    issues.push(`末镜应结束于歌曲末尾 ${SOURCE.songDuration}，实际 ${last.until}`);
  if (last.until > SOURCE.songDuration + EPS) issues.push(`末镜超出歌曲末尾 ${(last.until - SOURCE.songDuration).toFixed(3)}s`);

  // Lyric coverage, when a feature/lyric source is available.
  if (features?.lyricLines) {
    const covered = new Set();
    SHOTS_DERIVED.forEach((s) => {
      if (!s.lines) return;
      for (let i = s.lines[0]; i <= s.lines[1]; i++) covered.add(i);
    });
    const missing = [];
    for (let i = 1; i <= features.lyricLines; i++) if (!covered.has(i)) missing.push(i);
    if (missing.length) issues.push(`歌词第 ${missing.join(",")} 行没有镜头`);
  }

  const flashCap = features?.maxFlash ?? 0.7;
  SHOTS_DERIVED.forEach((s) => {
    const f = s.enter?.flash ?? 0;
    if (f > flashCap + EPS) issues.push(`${s.id}: flash ${f} 超过上限 ${flashCap}`);
  });

  return issues;
}

/** Progress counters the storyboard and the review page both show. */
export function progress() {
  const by = { written: 0, inherited: 0, todo: 0 };
  SHOTS_DERIVED.forEach((s) => (by[s.momentState] = (by[s.momentState] ?? 0) + 1));
  const flashy = SHOTS_DERIVED.filter((s) => (s.enter?.flash ?? 0) > 0);
  const formed = SHOTS_DERIVED.filter((s) => s.enter && s.enter.type !== "cut");
  return {
    total: SHOTS_DERIVED.length,
    ...by,
    flashShots: flashy.length,
    maxFlash: Math.max(0, ...SHOTS_DERIVED.map((s) => s.enter?.flash ?? 0)),
    formedTransitions: formed.length,
    // The reference cut with a formed transition on 13 of 87 boundaries; this is
    // the number we are compared against.
    formedShare: formed.length / SHOTS_DERIVED.length,
  };
}
