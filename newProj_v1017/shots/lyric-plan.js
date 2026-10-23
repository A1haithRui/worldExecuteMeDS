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
  4: { style: "display", size: 46, align: "left", anchor: [512, 250], maxWidth: 820 },
  5: { style: "embedded" },
  6: { style: "embedded" },
  7: { style: "display", size: 46, align: "center", anchor: [960, 180], maxWidth: 1400 },
  // Section 8 is the same client, three sizes further out. Where a shot has a
  // message the message carries the line; the five shouts are set as words.
  8: { style: "display", size: 48, align: "center", anchor: [960, 940], maxWidth: 1600 },
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
  35, 38, 41, 44, // STIMULATIONS · SATISFACTION · EXECUTION · SIMULATION
  47, 50, 53, 56, // NUTRIENTS · ANTIOXIDANTS · ENJOYMENT · EXISTENCE
  // The second chorus shouts its own five, and they are the section's spine.
  67, 70, 77, 80, 83, // VIBRATIONS · COMPLETION · ISOLATION · FRAGMENTS · DISHEARTENED
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
    // start the sentence where the wave leaves the circle: half a period earlier,
    // which also keeps it clear of the tangent further along
    pathStart: WAVE_BAND.x0 + 10,
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

  // ---- section 4: she is edited ------------------------------------------
  // The window squeezes left to make room for the drawer, so the line sits in the
  // conversation area that is still visible.
  "pre1-drawer": {
    style: "display", size: 46, align: "left", anchor: [212, 402], maxWidth: 940,
    byLine: { 25: { anchor: [212, 336] }, 26: { anchor: [212, 402] } },
    echo: true, echoColor: "#8ba4c2",
  },
  // The picture is in pieces behind it, and the words are the sharp thing: they are
  // drawn after the block break-up, so they simply survive it.
  "pre1-vision": {
    style: "display", size: 46, align: "left", anchor: [212, 402], maxWidth: 940,
    byLine: { 27: { anchor: [212, 336] }, 28: { anchor: [212, 402] } },
    echo: true, echoColor: "#8ba4c2",
  },
  "pre1-date": {
    style: "display", size: 46, align: "left", anchor: [212, 402], maxWidth: 940,
    byLine: { 29: { anchor: [212, 336] }, 30: { anchor: [212, 402] } },
    echo: true, echoColor: "#8ba4c2",
  },
  // ---- section 5: the conversation and its plates -----------------------
  // Her messages are the lyric, so the close-ups draw the words themselves; the
  // plates hand the keyword to the power treatment at the foot of the sheet.
  // ---- section 6: the object plates ---------------------------------------
  // The verse line is spoken inside the plate, so the sheet prints it as type at the
  // foot of the object; the keyword is a power line under it.
  "pre2-settings": { style: "display", size: 44, align: "left", anchor: [200, 260], maxWidth: 1000 },
  "pre2-gender": { style: "display", size: 50, align: "center", anchor: [960, 156], maxWidth: 1300 },
  "pre2-day": { style: "display", size: 50, align: "center", anchor: [960, 160], maxWidth: 1300 },
  "pre2-role": { style: "display", size: 50, align: "center", anchor: [960, 170], maxWidth: 1300 },
  "pre2-loop": { style: "display", size: 44, align: "left", anchor: [200, 260], maxWidth: 1000 },
  "pre2-trance": { style: "display", size: 50, align: "center", anchor: [960, 168], maxWidth: 1300 },
  "pre2-loop-b": { style: "display", size: 44, align: "left", anchor: [200, 260], maxWidth: 1000 },

  "v2-ask1": { style: "embedded" },
  "v2-eggplant": { style: "display", size: 58, pop: 0.02, align: "center", anchor: [960, 196], maxWidth: 1560,
    powerAnchor: [960, 900], powerMaxWidth: 1500 },
  "v2-ask2": { style: "embedded" },
  "v2-tomato": { style: "display", size: 58, pop: 0.02, align: "center", anchor: [960, 196], maxWidth: 1560,
    powerAnchor: [960, 900], powerMaxWidth: 1500 },
  "v2-ask3": { style: "embedded" },
  "v2-cat": { style: "display", size: 58, pop: 0.02, align: "center", anchor: [960, 196], maxWidth: 1560,
    powerAnchor: [960, 900], powerMaxWidth: 1500 },
  "v2-ask4": { style: "embedded" },
  "v2-proof": { style: "display", size: 58, pop: 0.02, align: "center", anchor: [960, 196], maxWidth: 1560,
    powerAnchor: [960, 900], powerMaxWidth: 1500 },

    "err-request": { style: "display", size: 62, pop: 0.02, align: "center", anchor: [960, 150], maxWidth: 1560 },
  "err-check": { style: "display", size: 62, pop: 0.02, align: "center", anchor: [960, 150], maxWidth: 1560 },
  "err-first": { style: "display", size: 58, pop: 0.02, align: "center", anchor: [960, 150], maxWidth: 1560,
    powerAnchor: [960, 946], powerMaxWidth: 1780 },
  "err-send": { style: "display", size: 58, pop: 0.02, align: "center", anchor: [960, 150], maxWidth: 1560,
    powerAnchor: [960, 946], powerMaxWidth: 1780 },
  "err-chrome": { style: "embedded" },
  "err-drawer": { style: "embedded" },
  "err-forge": { style: "embedded" },
  "err-window": { style: "embedded" },
  "err-breath": { style: "embedded" },

  // ---- section 10: the machine shouts the same word twelve times -----------
  // The word is the machine's output, so it is printed under the loop like the
  // last line of a log, and it grows a size per shot as the call count rises.
  // It is deliberately NOT a power line: power adds the blue glow of a keyword,
  // and this section's energy is mechanical, not luminous.
  "exec-01": { style: "display", size: 84, tracking: 0.14, align: "center", anchor: [960, 1006], maxWidth: 1500 },
  "exec-05": { style: "display", size: 96, tracking: 0.14, align: "center", anchor: [960, 1006], maxWidth: 1500 },
  "exec-09": { style: "display", size: 108, tracking: 0.14, align: "center", anchor: [960, 1006], maxWidth: 1500 },
  "exec-12": { style: "display", size: 124, tracking: 0.14, align: "center", anchor: [960, 1006], maxWidth: 1500 },

  // ---- section 11: six counts and the last shout ---------------------------
  // The six counts are printed on the probe panel as channel labels, not as
  // captions. The shot owns them: at 0.46 s a stamp/power entrance would spend
  // the whole beat arriving, and the moment explicitly rules out six full-screen
  // language cards.
  "count-1-de": { style: "embedded" },
  "count-2-es": { style: "embedded" },
  "count-3-fr": { style: "embedded" },
  "count-4-ko": { style: "embedded" },
  "count-5-sv": { style: "embedded" },
  "count-6-zh": { style: "embedded" },
  // The last shout is no longer a caption under a face: the shot builds the
  // giant two-line word itself, because the word IS the frame (and the mask the
  // whale is printed through), so the engine must not draw a second copy.
  "last-shout": { style: "embedded" },

  // ---- section 12: the last chorus, the four plates reprinted in place ------
  // The verse is set in the plate's top-left margin -- the same place the reference
  // puts its section 12 lines -- and never over a plate's subject: the channel, her
  // face, the palm and the trapped figure all own the middle of the sheet.
  // 072 is the one shot whose ground is her own face, printed paper white: the verse
  // is set in ink here instead of paper, so it reads like a line printed ON her.
  // 072's lyric is not set by the engine: the shot prints it in bold serif on a paper
  // card laid over her hair, so it stays readable on the one bright frame in the section.
  "cx-eye": { style: "embedded" },
  // The three EXECUTIONs are the plate's title, not a shout, so they are not power
  // lines: the plates already print that word four times, and a power treatment
  // would make it glow like a new keyword instead of a reprint. The shot prints the
  // title itself into its title bar (`embedded`) because the engine's stamp is
  // clipped to the lyric's own window: it would lift off the bar the moment the
  // syllable ends, and a printed title has to stay on the paper until the cut.
  "cx-kw1": { style: "embedded" },
  "cx-bust": {
    style: "display", size: 46, align: "left", anchor: [150, 200], maxWidth: 640,
    byLine: { 109: { anchor: [150, 200] }, 110: { anchor: [150, 268] } },
  },
  "cx-kw2": { style: "embedded" },
  // The caption band the moment asks for (S18's, y 100-240) with the palm clear.
  "cx-hand": {
    style: "display", size: 46, align: "left", anchor: [150, 172], maxWidth: 620,
    byLine: { 112: { anchor: [150, 180] }, 113: { anchor: [150, 248] } },
  },
  "cx-kw3": { style: "embedded" },
  // the last plate is a paper-white form with rays across it, so this line is ink on
  // paper too: it has to stay readable against the one bright frame in the section.
  "cx-fall": {
    style: "display", size: 46, align: "left", anchor: [150, 200], maxWidth: 620,
    color: "#041220",
    byLine: { 115: { anchor: [150, 200] }, 116: { anchor: [150, 268] } },
  },

  // ---- section 13: the exam paper, four questions ---------------------------
  // The verse is set like a line of the question, in the page's top-left writing
  // area. The four LO-O-OVE answers are printed on the last ruled line of every
  // page, in the same place and at the same size: one refrain, four times, and the
  // answer written at the foot of the sheet.
  //
  // L128 starts at 191.356 and runs into section 14, so section 14 MUST keep this
  // exact placement (bottom left, 96 px, left aligned) or the cut will jump.
  "out-lesson": {
    style: "display", size: 44, align: "left", anchor: [330, 210], maxWidth: 900,
    byLine: {
      117: { anchor: [330, 210] },
      118: { anchor: [330, 274] },
      119: { size: 96, align: "left", anchor: [330, 1000], maxWidth: 1200 },
    },
  },
  "out-test": {
    style: "display", size: 44, align: "left", anchor: [330, 210], maxWidth: 900,
    byLine: {
      120: { anchor: [330, 210] },
      121: { anchor: [330, 274] },
      122: { size: 96, align: "left", anchor: [330, 1000], maxWidth: 1200 },
    },
  },
  "out-formula": {
    style: "display", size: 44, align: "left", anchor: [330, 210], maxWidth: 900,
    byLine: {
      123: { anchor: [330, 210] },
      124: { size: 96, align: "left", anchor: [330, 1000], maxWidth: 1200 },
    },
  },
  "out-proof": {
    style: "display", size: 42, align: "left", anchor: [330, 200], maxWidth: 620,
    byLine: {
      125: { anchor: [330, 200] },
      126: { anchor: [330, 258] },
      127: { anchor: [330, 316] },
      128: { size: 96, align: "left", anchor: [330, 1000], maxWidth: 1200 },
    },
  },

  // ---- section 14: the ending ----------------------------------------------
  // L128 "LO-O-OVE" is carried straight in from out-proof, so this entry copies that
  // shot's placement letter for letter: if it moved at the cut, the word would jump
  // and the held frame would no longer be a held frame. Nothing else here speaks.
  "down-message": {
    style: "display", size: 42, align: "left", anchor: [330, 200], maxWidth: 620,
    byLine: {
      128: { size: 96, align: "left", anchor: [330, 1000], maxWidth: 1200 },
    },
  },
  // The four syllables of EXECUTION are printed into the launch bar's cells by the
  // shot itself, one cell per sung syllable, so the lyric layer stays out: a second
  // copy of the word on the same frame would print it twice.
  "down-last": { style: "embedded" },

  "c1-give": { style: "embedded" },
  "c1-kw1": { style: "power", align: "center", anchor: [960, 900], maxWidth: 1500 },
  "c1-only": { style: "embedded" },
  "c1-kw2": { style: "power", align: "center", anchor: [960, 900], maxWidth: 1500 },
  "c1-happy": { style: "embedded" },
  "c1-kw3": { style: "power", align: "center", anchor: [960, 900], maxWidth: 1500 },
  "c1-trap": { style: "embedded" },
  "c1-kw4": { style: "power", align: "center", anchor: [960, 900], maxWidth: 1500 },

  "pre1-unite": {
    style: "display", size: 46, align: "left", anchor: [212, 402], maxWidth: 940,
    byLine: { 31: { anchor: [212, 336] }, 32: { anchor: [212, 402] } },
    echo: true, echoColor: "#8ba4c2",
  },

  // ---- section 8: the chorus nobody answers ------------------------------
  // The first shot builds her sentence as a transcript, so the lyric layer stays
  // out of it entirely: two typewriters in one frame only read as one if one of
  // them is the picture's own.
  "c2-typing": { style: "embedded" },
  // The three dots are the whole frame, so the word is shouted on its foot.
  "c2-dots": { style: "power", align: "center", anchor: [960, 900], maxWidth: 1700 },
  // The spark is closing on the left and the sign-off is in the top right: the two
  // lines sit between them, and the line being sung is the lower of the two.
  "c2-brb": {
    style: "display", size: 52, align: "left", anchor: [980, 700], maxWidth: 820,
    byLine: { 68: { anchor: [980, 640] }, 69: { anchor: [980, 722] } },
  },
  // Inside the ring. Small enough not to break it, and no rule: the ring is the rule.
  "c2-complete": {
    style: "power", align: "center", anchor: [960, 552], maxWidth: 660, rule: false,
  },
  // Her messages carry these lines, which is what makes them unanswered.
  "left-online": { style: "embedded" },
  "left-away": { style: "embedded" },
  "left-offline": { style: "embedded" },
  // The thread is a speck in a huge frame: the word is set as wide as one line can
  // be, so its letters stand as far apart as the messages do.
  "left-isolation": {
    style: "power", align: "center", anchor: [960, 928], maxWidth: 1720,
    tracking: 0.62, rule: false,
  },
  // The transcript of what she is saying while she deletes it, low on the left;
  // FRAGMENTS lands on the pieces she took off the thread, high on the right.
  "alone-erase": {
    style: "display", size: 40, align: "left", anchor: [210, 902], maxWidth: 900,
    byLine: { 78: { anchor: [210, 866] }, 79: { anchor: [210, 918] } },
    powerAnchor: [1372, 704], powerMaxWidth: 700, powerAlign: "center",
  },
  // Under the page, two lines and no more room than that.
  "alone-empty": {
    style: "display", size: 42, align: "left", anchor: [150, 974], maxWidth: 1180,
    byLine: { 81: { anchor: [150, 938] }, 82: { anchor: [150, 994] } },
  },
  // Across the whole sheet, on the band of black under her chin.
  "alone-eye": {
    style: "power", align: "center", anchor: [960, 946], maxWidth: 1760,
    maxSize: 176, rule: false,
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
