// Her messages, as messages.
//
// The first pass at this section used labelled data blocks, which read as neither a
// conversation nor a diagram: sizes disagreed, the fields competed with the words,
// and nothing was where the eye expected it. This is the plain thing done properly --
// large bubbles with her mark at the head of them, one type size per role, and the
// words as the only bright element in the frame.
import { at, layer, stroke, disc, rect, type, halo } from "../src/mv-draw.js";
import { drawWhale } from "../src/assets/whale.js";

const BRAND = "#4d6bfe";
const BRAND_SOFT = "#7f93ff";
const GIFT = "#83e9e6";
const SERIF = "MV Serif";
const SANS = "MV Sans";

/** One type size per role, so nothing in the frame has to be guessed at. */
export const TYPE = Object.freeze({
  her: 52, // a line already said
  beat: 74, // the line being sung: pushed up and enlarged
  you: 38, // your line: a reply, not the subject
  meta: 15, // field labels and ticks
  caption: 60, // the lyric at the foot
});

/**
 * Her message: the mark at its head, her name beside it, the line in serif, and the
 * delivered tick under it. `w` is the bubble width; `size` shrinks to fit inside it.
 */
export function herBubble(ctx, x, y, w, text, opts = {}) {
  const { alpha = 1, size = TYPE.her, name = "deepseek", tick = true, hot = false, emph = false } = opts;
  if (!text || alpha <= 0.001) return 0;
  const pad = 34;
  const headH = 46;
  ctx.font = `600 ${size}px "${SERIF}"`;
  const measured = ctx.measureText(text).width;
  // one line only, shrunk until it fits: a wrapped bubble would break the panel grid
  const fit = Math.min(size, (size * (w - pad * 2)) / Math.max(1, measured));
  const textW = (measured * fit) / size;
  const bw = Math.min(w, textW + pad * 2);
  const bh = headH + fit * 1.5 + pad * 0.9;

  layer(ctx, alpha, () => {
    ctx.save();
    ctx.shadowColor = hot ? "rgba(131,233,230,0.35)" : "rgba(77,107,254,0.3)";
    ctx.shadowBlur = hot ? 40 : 26;
    rect(ctx, x, y, bw, bh, hot ? "rgba(14,44,62,0.95)" : "rgba(9,33,48,0.95)", 18,
      hot ? "rgba(131,233,230,0.85)" : "rgba(77,107,254,0.8)");
    ctx.restore();

    // her mark at the head of the bubble, then her name
    drawWhale(ctx, x + pad + 13, y + headH * 0.62, 26, {
      strokeK: 1, fillK: 1, color: BRAND, alpha: 0.95,
    });
    type(ctx, name, x + pad + 40, y + headH * 0.62 + 6, TYPE.meta, GIFT, "MV Mono");

    type(ctx, text, x + pad, y + headH + fit * 1.06, fit, "#f2f6fb", SERIF);

    if (tick) {
      type(ctx, "✓ Delivered", x + pad, y + bh + 28, TYPE.meta, "rgba(139,164,194,0.75)", "MV Mono");
    }
  });
  return bh;
}

/** Your message: a reply, quieter, on the right. */
export function yourBubble(ctx, rightX, y, text, opts = {}) {
  const { alpha = 1, size = TYPE.you } = opts;
  if (!text || alpha <= 0.001) return 0;
  const pad = 30;
  ctx.font = `400 ${size}px "${SANS}"`;
  const tw = ctx.measureText(text).width;
  const bw = tw + pad * 2;
  const bh = size * 2.1;
  layer(ctx, alpha, () => {
    rect(ctx, rightX - bw, y, bw, bh, "rgba(19,45,64,0.92)", 18, "rgba(120,152,182,0.65)");
    type(ctx, text, rightX - bw + pad, y + bh * 0.62, size, "#cfdcea", SANS);
  });
  return bh;
}

/**
 * A lyric bubble: the foot caption is replaced by the line itself, pushed up to the
 * centre as a message. This is the one place the film lets a line be loud.
 */
export function lyricBubble(ctx, t, text, start, opts = {}) {
  if (!text) return;
  const { x = 120, y = 860, w = 1200, size = 64, alpha = 1 } = opts;
  const k = at(t, start, start + 0.16);
  if (k <= 0) return;
  herBubble(ctx, x, y, w, text, { alpha: alpha * k, size, tick: false, name: "deepseek" });
}
