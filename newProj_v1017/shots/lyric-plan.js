// Which lyric treatment each shot uses, and where that line sits.
//
// This replaces the subtitle band: each shot chooses a treatment from
// engine/lyric.js so the words belong to the picture. Assignments are by shot id
// where a shot deserves its own placement, and by section otherwise, so an
// un-designed shot still gets a sensible default rather than a band.
//
// The floor is 42px at 1080p; nothing here goes below it.

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
};

/**
 * The song's shout lines. These are the ones the chorus spells out in capitals,
 * and they are the film's punctuation, so wherever one of them lands it takes the
 * power treatment instead of its shot's default: full width, blue glow, a
 * blue-to-white reveal and a light band that keeps crossing the word.
 *
 * L3 PROTECTION - L6 OBJECT CREATION - L8 INITIALIZATION - L11 SIMULATION
 */
export const POWER_LINES = Object.freeze([3, 6, 8, 11]);

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
});

/**
 * The plan for a shot and, when known, the line that will fill it: a power line
 * overrides the shot's own treatment.
 */
export function lyricPlanFor(shot, lineIndex = null) {
  const own = LYRIC_BY_SHOT[shot.id];
  const base = own ?? { ...DEFAULT, ...(BY_SECTION[shot.section] ?? {}) };
  if (lineIndex != null && POWER_LINES.includes(lineIndex + 1)) {
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
  return base;
}
