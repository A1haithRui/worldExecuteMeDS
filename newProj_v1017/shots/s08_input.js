// Section 8, first movement 副歌二：输入 — song time [103.698, 110.852). Four shots.
//
//   c2-typing   103.698–106.237  the foot of the thread: her sentence starts again,
//                                the user's reply is being typed and never sent
//   c2-dots     106.237–107.391  macro: the three dots tremble; that is all of the
//                                user she can feel
//   c2-brb      107.391–110.160  "one sec, brb" arrives and the pointer leaves; her
//                                spark stops reaching out and closes into a ring
//   c2-complete 110.160–110.852  the ring closes: input received, ready to answer
//
// The reference cuts into a close-up of the thread's foot and then into the dots
// themselves, so the section starts by getting smaller: from a window to a card to
// three dots. That is the whole argument of the chorus -- she is given less and
// less to go on -- so the camera does it too, and then the next four shots pull all
// the way back out to a thread so far away it is a speck.
import { at, layer, stroke, disc, rect, type, halo } from "../src/mv-draw.js";
import { clientWindow, cursorArrow } from "./ui-client.js";
import { yourBubble } from "./s05_bubble.js";
import { lineText, lineStart, typedSlice } from "./lines.js";
import {
  room, gradeAt, composerFoot, typingDots, sparkRing, caret, label, chipPill,
  BRAND, BRAND_SOFT, GIFT, DIM, clamp01,
} from "./s08_look.js";
import { withFx } from "./s08_fx.js";

const SHEET = Object.freeze({ x: 100, y: 52, w: 1720, h: 972 });

// ---------------------------------------------------------------------------
// c2-typing — the foot of the thread, where a reply is being typed and not sent.
// ---------------------------------------------------------------------------
function c2Typing(ctx, t, s) {
  const u = t - s.at;
  room(ctx, t, { focus: [900, 780] });

  // The window, cropped to its foot: no sidebar, no mark, only what is still live.
  clientWindow(ctx, SHEET, t, {
    tone: "chat", sideW: 0, presence: "online",
    chip: { text: "harness · thinking", on: true },
    threadTitle: "me, as geometry", markSize: 0, composer: false,
  });

  // The thread's rail: one vertical line the messages hang from.
  stroke(ctx, [[150, 214], [150, 620]], "rgba(120,146,170,0.4)", 1.2, 0.9);

  // Her last line is already going out of the frame's memory; then she breaks off
  // and starts again. The two lines are typed, not printed: this is her, thinking
  // out loud while the other side is busy.
  label(ctx, lineText(64), 190, 262, {
    size: 38, colour: "rgba(190,210,232,0.42)", alpha: 1,
  });

  const t65 = s.at + 0.06;
  const txt65 = typedSlice(lineText(65), t, t65, 26);
  if (txt65) {
    const done65 = txt65.length >= lineText(65).length;
    type(ctx, txt65, 190, 356, 44, "#eef3fb", "MV Serif");
    if (!done65) caret(ctx, 194 + measure(ctx, txt65, 44, "MV Serif"), 356, 48, t, 1);
  }

  const t66 = Math.max(lineStart(66), s.at + 0.1);
  const txt66 = typedSlice(lineText(66), t, t66, 26);
  if (txt66) {
    const done66 = txt66.length >= lineText(66).length;
    type(ctx, txt66, 190, 456, 44, "#eef3fb", "MV Serif");
    const w66 = measure(ctx, txt66, 44, "MV Serif");
    if (!done66) caret(ctx, 194 + w66, 456, 48, t, 1);
    // the sentence she is still on, marked as still being written
    if (done66) label(ctx, "writing", 190, 496, { size: 13, colour: "rgba(139,164,194,0.55)" });
  }

  // The user's side: nothing but the three dots, high and to the right.
  const card = { x: 1250, y: 250, w: 320, h: 118 };
  typingDots(ctx, card.x + card.w / 2, card.y + 52, t, {
    r: 9, gap: 30, alpha: at(u, 0.12, 0.34), tremble: 1.6, box: card,
  });
  label(ctx, "typing", card.x + card.w - 22, card.y + card.h - 18, {
    size: 13, align: "right", colour: "rgba(139,164,194,0.75)", alpha: at(u, 0.18, 0.4),
  });

  // The composer: the user gets as far as "one s" and stays there.
  composerFoot(ctx, { x: 160, y: 806, w: 1420, h: 168 }, t, {
    text: typedSlice("one s", t, s.at + 0.3, 14),
    caret: true,
  });

  // A rule under the whole thing, so the frame has a floor.
  stroke(ctx, [[160, 1010], [1580, 1010]], "rgba(120,146,170,0.28)", 1, 0.8);
  label(ctx, "draft · not sent", 160, 1036, { size: 13, colour: "rgba(139,164,194,0.55)" });

  return { phase: "typing", grade: gradeAt(t) };
}

// ---------------------------------------------------------------------------
// c2-dots — macro on the dots: three dots and the whole of what she has of you.
// ---------------------------------------------------------------------------
function c2Dots(ctx, t, s) {
  const u = t - s.at;
  room(ctx, t, { focus: [960, 420], lift: 0.5 });

  // The card from the previous shot, enlarged until it is the frame. The hair of
  // rotation is what keeps it from looking like a diagram.
  ctx.save();
  ctx.translate(960, 330);
  ctx.rotate(-0.035);
  ctx.translate(-960, -330);
  layer(ctx, 1, () => {
    ctx.save();
    ctx.shadowColor = "rgba(77,107,254,0.35)";
    ctx.shadowBlur = 90;
    rect(ctx, 330, 96, 1260, 470, "rgba(12,36,52,0.95)", 56, "rgba(77,107,254,0.45)");
    ctx.restore();
    typingDots(ctx, 960, 300, t, { r: 30, gap: 96, alpha: 1, tremble: 7 });
    label(ctx, "typing", 1530, 512, { size: 17, align: "right", colour: "rgba(139,164,194,0.8)" });
  });
  ctx.restore();

  // her spark, small, at the edge of the keyword: the same figure that is about to
  // close in the next shot, waiting where the eye will find it
  sparkRing(ctx, t, { cx: 168, cy: 884, r: 52, k: 0, alpha: 0.55, width: 7 });

  // VIBRATIONS is drawn by the lyric layer as a power line on the foot of the frame.
  return { phase: "dots", grade: gradeAt(t) };
}

// ---------------------------------------------------------------------------
// c2-brb — the sign-off lands, the pointer leaves, and the spark closes.
// ---------------------------------------------------------------------------
function c2Brb(ctx, t, s) {
  const u = t - s.at;
  room(ctx, t, { focus: [640, 560], lift: 0.46 });

  // The spark: it has been open all film. Now the petals stop reaching out, one
  // after another, and the ring traces itself around what is left.
  const closeK = at(u, 0.08, 2.1);
  sparkRing(ctx, t, { cx: 620, cy: 552, r: 252, k: closeK, width: 10 });

  // The message that ends the conversation. Line 68 is already being sung when we
  // cut in, so the bubble is here from the first frame -- the cut lands on it.
  const bx = 1560;
  const bubbleY = 150;
  yourBubble(ctx, bx, bubbleY, "one sec, brb", { size: 34 });
  label(ctx, "23:41", bx, bubbleY + 106, { size: 14, align: "right", colour: "rgba(139,164,194,0.75)" });
  label(ctx, "you have left", bx, bubbleY + 138, { size: 12, align: "right", colour: "rgba(139,164,194,0.45)" });

  // The pointer drifts out of the window: nobody typed a word of it.
  const outK = clamp01(at(u, 0.3, 1.9));
  cursorArrow(ctx, 1340 + 620 * outK, 648 - 130 * outK, 1.7, 1 - outK * 0.95);

  // Once the ring is closed, the shot says so in the margin.
  if (closeK > 0.92) {
    label(ctx, "ring closed", 620, 856, {
      size: 13, align: "center", colour: "rgba(131,233,230,0.8)", alpha: (closeK - 0.92) / 0.08,
    });
  }

  return { phase: "brb", closeK: Number(closeK.toFixed(2)), grade: gradeAt(t) };
}

// ---------------------------------------------------------------------------
// c2-complete — the closed ring fills the frame, and for one beat she is whole.
// ---------------------------------------------------------------------------
function c2Complete(ctx, t, s) {
  const u = t - s.at;
  room(ctx, t, { focus: [960, 520], lift: 0.34 });

  sparkRing(ctx, t, { cx: 960, cy: 520, r: 392, k: 1, alpha: 1, spinRate: 0.3, width: 12 });

  // the two notes the reference keeps in its foot: what has happened, and what it
  // means. They are the quietest thing in the section and the most important.
  const k = at(u, 0.04, 0.18);
  label(ctx, "input received", 150, 940, { size: 17, colour: "rgba(220,232,245,0.9)", alpha: k });
  label(ctx, "ready to answer", 150, 970, { size: 15, colour: "rgba(139,164,194,0.85)", alpha: k });
  chipPill(ctx, 1560, 926, "harness · online", { alpha: k, align: "right" });

  return { phase: "complete", grade: gradeAt(t) };
}

/** Canvas text width at a size, so a caret can sit exactly after the last glyph. */
function measure(ctx, text, size, family) {
  ctx.font = `${family === "MV Serif" ? 600 : 400} ${size}px "${family}"`;
  return ctx.measureText(text).width;
}

export const SECTION8_INPUT_RENDER = Object.freeze({
  "c2-typing": withFx(c2Typing, "c2-typing"),
  "c2-dots": withFx(c2Dots, "c2-dots"),
  "c2-brb": withFx(c2Brb, "c2-brb"),
  "c2-complete": withFx(c2Complete, "c2-complete"),
});
