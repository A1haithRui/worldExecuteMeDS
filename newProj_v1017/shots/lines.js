// The song's lines, for the shots that draw them inside the picture.
//
// The stage already loads lyrics.json for the caption treatments, but a shot that
// builds a transcript of her own words needs the text while it draws, and it must
// not draw a half-loaded file. So this module loads once, exports its promise, and
// the renderer waits for it with every other asset.
let LINES = null;

export const linesReady = fetch("/data/lyrics.json")
  .then((r) => (r.ok ? r.json() : { lines: [] }))
  .then((d) => {
    LINES = d.lines ?? [];
    return LINES;
  })
  .catch(() => {
    LINES = [];
    return LINES;
  });

/** The text of lyric line n (1-based), or "" before the file has loaded. */
export const lineText = (n) => (LINES && LINES[n - 1] ? LINES[n - 1].text : "");
/** When line n is actually sung. Cues are written against this, never a hand-picked offset. */
export const lineStart = (n) => (LINES && LINES[n - 1] ? LINES[n - 1].start : 0);
export const lineEnd = (n) => (LINES && LINES[n - 1] ? LINES[n - 1].end ?? LINES[n - 1].start + 2 : 0);

/** A character count for a line, at a speed that finishes it inside its own phrase. */
export function typedSlice(text, t, start, cps = 30) {
  if (t <= start) return "";
  const n = Math.floor((t - start) * cps);
  return text.slice(0, Math.max(0, n));
}
