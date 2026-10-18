// Which lyric treatment each shot uses, and where that line sits.
//
// This replaces the subtitle band: each shot chooses a treatment from
// engine/lyric.js so the words belong to the picture. Assignments are by shot id
// where a shot deserves its own placement, and by section otherwise, so an
// un-designed shot still gets a sensible default rather than a band.
//
// The floor is 42px at 1080p; nothing here goes below it.

const DEFAULT = Object.freeze({ style: "display", size: 92, align: "center" });

// Section-level defaults. Section 0 is the warning page (no lyric), section 1 is
// the boot/interface section, so its words read as terminal output.
const BY_SECTION = {
  0: { style: "none" },
  1: { style: "typed", size: 46, align: "left" },
};

/**
 * Per-shot placements. Coordinates are canvas pixels at 1920x1080 and are chosen
 * against each shot's composition, not against a global band.
 */
export const LYRIC_BY_SHOT = Object.freeze({
  // bottom-left inside the window, where a shell would echo
  "boot-power": { style: "typed", size: 48, align: "left", anchor: [214, 916] },
  // the line as display type across the foot of the assembled window
  "boot-layout": { style: "display", size: 92, align: "center", anchor: [960, 744], maxWidth: 980, rule: true },
  // bottom-centre of the card window: the top margin read as a title, not a line
  "boot-params": { style: "display", size: 88, align: "center", anchor: [750, 872], maxWidth: 1020, rule: true },
  // the composer types its first line itself; the rest of the section gets the
  // big type back, which is the moment this shot is here for
  "boot-world": {
    style: "display", size: 104, align: "center", anchor: [950, 772], maxWidth: 1120,
    rule: true, embeddedLines: [9],
  },
});

/** The plan for a shot, with the line attached by the caller. */
export function lyricPlanFor(shot) {
  const own = LYRIC_BY_SHOT[shot.id];
  if (own) return own;
  const sec = BY_SECTION[shot.section];
  return { ...DEFAULT, ...(sec ?? {}) };
}
