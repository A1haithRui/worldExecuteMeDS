// Which lyric treatment each shot uses, and where that line sits.
//
// This replaces the subtitle band: each shot chooses a treatment from
// engine/lyric.js so the words belong to the picture. Assignments are by shot id
// where a shot deserves its own placement, and by section otherwise, so an
// un-designed shot still gets a sensible default rather than a band.
//
// The floor is 42px at 1080p; nothing here goes below it.

import { BAND, WAVE, waveAt, PLOT_GEOM, plotY } from "./geometry.js";

// The wave's own numbers, so the lyric can be laid on it rather than near it.
const _w = waveAt(BAND, 1);
const WAVE_BAND = Object.freeze({
  span: _w.span, amp: _w.amp, midY: _w.midY, x0: _w.x0, period: _w.period,
  cx: _w.x0 + _w.span / 2,
});

const DEFAULT = Object.freeze({
  style: "display", size: 92, align: "center", anchor: [960, 900], maxWidth: 1400,
});

// Section-level defaults. Section 0 is the warning page (no lyric), section 1 is
// the boot/interface section, so its words read as terminal output.
const BY_SECTION = {
  0: { style: "none" },
  1: { style: "typed", size: 46, align: "left" },
  // section 2 is set inside the client, whose words are all drawn by the shots
  // themselves: the launch command types into the bar, the question into the box
  2: { style: "embedded" },
  // section 3 draws its answer inside the chat; its verse lines are plain type
  3: { style: "display", size: 44, align: "left", anchor: [548, 240], maxWidth: 780 },
};

/**
 * The song's shout lines. These are the ones the chorus spells out in capitals,
 * and they are the film's punctuation, so wherever one of them lands it takes the
 * power treatment instead of its shot's default: full width, blue glow, a
 * blue-to-white reveal and a light band that keeps crossing the word.
 *
 * L3 PROTECTION - L6 OBJECT CREATION - L8 INITIALIZATION - L11 SIMULATION
 */
export const POWER_LINES = Object.freeze([
  3, 6, 8, 11, // PROTECTION · OBJECT CREATION · INITIALIZATION · SIMULATION
  15, 18, 21, 24, // DIMENSION · CIRCUMFERENCE · TANGENTS · LIMITATIONS
]);

/**
 * Per-shot placements. Coordinates are canvas pixels at 1920x1080 and are chosen
 * against each shot's composition, not against a global band.
 *
 * `powerAnchor` / `powerMaxWidth` apply when a power line lands in this shot, for
 * cases where the keyword cannot sit where the shot's ordinary line does.
 */
export const LYRIC_BY_SHOT = Object.freeze({
  // the launch command IS this shot: the bar types it, so the lyric layer keeps out
  "title": { style: "embedded" },
  // bottom-left inside the window, where a shell would echo
  "boot-power": {
    style: "typed", size: 48, align: "left", anchor: [214, 916],
    // PROTECTION is shouted over the middle of the window, under the wordmark
    powerAnchor: [960, 884], powerMaxWidth: 1000,
  },
  // inside the conversation area, which is empty below the placeholder messages
  "boot-layout": {
    style: "display", size: 92, align: "center", anchor: [960, 752], maxWidth: 1200, rule: true,
  },
  // bottom-centre of the card window: the top margin read as a title, not a line
  "boot-params": {
    style: "display", size: 88, align: "center", anchor: [750, 872], maxWidth: 1040, rule: true,
  },
  // The anchor is the centre of the MAIN area (window minus sidebar), not the
  // centre of the window: centring on the window pushed the line across the
  // sidebar divider. The composer types its first line itself.
  "boot-world": {
    style: "display", size: 104, align: "center", anchor: [1120, 772], maxWidth: 1160,
    rule: true, embeddedLines: [9],
  },

  // ---- section 3: the answer, drawn inside the chat -----------------------
  // The verse lines stack like a transcript: the line being sung sits low and the
  // one before it stays above. Showing them one at a time made the shot feel as
  // though it kept erasing itself.
  "v1-points": {
    style: "display", size: 44, align: "left", anchor: [548, 312], maxWidth: 780,
    byLine: { 13: { anchor: [548, 240] }, 14: { anchor: [548, 312] } },
    echo: true, echoColor: "#8ba4c2",
    powerAnchor: [1150, 778], powerMaxWidth: 1040,
  },
  // A ring is the one figure whose line is set on the figure itself: the top arc
  // says "if I'm a circle", the bottom arc answers and runs the other way round so
  // it still reads left to right.
  "v1-circle": {
    style: "curve", path: "arc", size: 46, color: "#eef3fb", anchor: [1150, 452],
    byLine: {
      16: { arc: { cx: 1150, cy: 452, r: 246, mid: -Math.PI / 2, dir: 1 } },
      17: { arc: { cx: 1150, cy: 452, r: 246, mid: Math.PI / 2, dir: -1 } },
    },
    powerAnchor: [1150, 786], powerMaxWidth: 1000,
  },
  // The wave carries its own line: same span, amplitude and phase, so the words
  // ride the crests as they travel.
  "v1-sine": {
    style: "curve", path: "sine", size: 46, color: "#eef3fb",
    span: WAVE_BAND.span, amp: -WAVE_BAND.amp, phaseRate: WAVE.rate,
    pathX0: WAVE_BAND.x0, pathSpan: WAVE_BAND.period, pathWaves: 1,
    maxRotate: 0.5, spread: false,
    anchor: [WAVE_BAND.cx, WAVE_BAND.midY],
    powerAnchor: [1150, 786], powerMaxWidth: 1040,
  },
  // The limit's line is written along the curve that approaches it, and
  // LIMITATIONS lands on the limit itself.
  "v1-limit": {
    style: "curve", path: "plot", size: 46, color: "#eef3fb",
    plotY, plotLeft: PLOT_GEOM.x + 40, plotSpan: PLOT_GEOM.w - 80,
    plotX0: PLOT_GEOM.x + 200, plotX1: PLOT_GEOM.x + PLOT_GEOM.w - 200, plotDY: -30,
    maxRotate: 0.24, spread: false,
    anchor: [1150, 470],
    powerAnchor: [1150, PLOT_GEOM.y + PLOT_GEOM.h * 0.3 - 10], powerMaxWidth: 1120,
    ruleY: PLOT_GEOM.y + PLOT_GEOM.h * 0.3,
  },
});

/**
 * The plan for a shot and, when known, the line that will fill it: a power line
 * overrides the shot's own treatment.
 */
export function lyricPlanFor(shot, lineIndex = null) {
  const own = LYRIC_BY_SHOT[shot.id];
  const base = own ?? { ...DEFAULT, ...(BY_SECTION[shot.section] ?? {}) };
  const idx = lineIndex == null ? null : lineIndex + 1;
  if (idx != null && POWER_LINES.includes(idx)) {
    return {
      ...base,
      style: "power",
      // Power lines are centred in their area. Without this the shot's own align
      // leaks through -- boot-power's terminal line is left-aligned -- and the
      // keyword is drawn from that x outward, straight off the frame.
      align: base.powerAlign ?? "center",
      anchor: base.powerAnchor ?? base.anchor,
      maxWidth: base.powerMaxWidth ?? base.maxWidth ?? 1200,
    };
  }
  // A shot may place individual lines differently -- the ring sets its two verse
  // lines on the top and bottom arcs.
  const per = idx != null && base.byLine ? base.byLine[idx] : null;
  return per ? { ...base, ...per } : base;
}
