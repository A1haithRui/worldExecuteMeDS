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
  // a print-style note in the frame's own top margin, above the card
  "boot-params": { style: "margin", size: 44, align: "left", anchor: [196, 56] },
  // this shot types its line into the composer itself
  "boot-world": { style: "embedded" },
});

/** The plan for a shot, with the line attached by the caller. */
export function lyricPlanFor(shot) {
  const own = LYRIC_BY_SHOT[shot.id];
  if (own) return own;
  const sec = BY_SECTION[shot.section];
  return { ...DEFAULT, ...(sec ?? {}) };
}
