// Section 8, closing movement 空线程：alone — song time [118.468, 125.622). Three shots.
//
//   alone-erase 118.468–121.699  she deletes her own unanswered messages; what comes
//                                off them piles up and FRAGMENTS lands on the pieces
//   alone-empty 121.699–124.699  the stubs go too, and the user's last words with
//                                them: one tidy page, one message, no answer
//   alone-eye   124.699–125.622  dark, the unfinished sentence, and then her eye
//                                open for the first time -- on us
//
// The reference turns her into a grey dot screen here and lets the interface do the
// deleting, which is the cruellest idea in the film: nobody answers, so she tidies
// up. Ours keeps the same order but in our own registers -- the dot screen is a
// print, the Delete pill is the only white object left, and the last word of the
// section is the one the interface starts to take apart.
import { at, layer, stroke, disc, rect, type, halo } from "../src/mv-draw.js";
import { figureImages } from "./figure.js";
import { lineText } from "./lines.js";
import { powerLayout } from "../src/engine/lyric.js";
import {
  room, gradeAt, plainRow, label, chipPill, deleteChip, selectionBox, stub,
  dotFigure, drawEye, footerStrip, BRAND, GIFT, DIM, clamp01, easeOut,
} from "./s08_look.js";
import { withFx } from "./s08_fx.js";

const THREAD_X = 210;
const ROW0 = 196;
const ROW_H = 94;

/** The six messages the thread still has when the section starts deleting. */
const THREAD = Object.freeze([
  { text: "then I can Finally be COMPLETION", time: null },
  { text: "You have left", time: "+5 min" },
  { text: "You have left", time: "+30 min" },
  { text: "You have left", time: "+1 h" },
  { text: "You have left", time: "+1 day" },
  { text: "You have left me in", time: "+9 days" },
]);

// ---------------------------------------------------------------------------
// alone-erase — she goes up her own messages from the newest and deletes them.
// ---------------------------------------------------------------------------
function aloneErase(ctx, t, s) {
  const u = t - s.at;
  room(ctx, t, { focus: [1240, 520], lift: 0.08 });

  // Her, printed as a dot screen: no longer a person, a plate of one. The dots are
  // cut out of her silhouette once into a bitmap, so every frame is the same pixels.
  dotFigure(ctx, figureImages.silhouette, t, {
    cx: 1452, cy: 566, height: 800, alpha: 0.95, seed: 13, bobAmp: 2.2,
    colour: "rgba(158,172,186,0.95)", gap: 6, r: 2.7, underlay: 0.1,
    // the dim lowlit plate under the dots, so the screen keeps a face
    base: { img: figureImages.lowlight, alpha: 0.62 },
  });

  // The deletes: newest first, cued to the three syllables of the line, not to
  // evenly spaced offsets.
  const deletes = [119.02, 119.86, 120.44];
  let gone = 0;
  THREAD.forEach((row, i) => {
    const y = ROW0 + i * ROW_H;
    // the last three rows are the ones she takes back
    const d = i >= THREAD.length - deletes.length ? deletes[i - (THREAD.length - deletes.length)] : null;
    const selK = d == null ? 0 : clamp01(at(t, d, d + 0.34));
    const goneK = d == null ? 0 : clamp01(at(t, d + 0.3, d + 0.62));
    if (goneK >= 0.999) {
      // the stub stays where the message was: a row that leaves nothing behind
      // would read as an undo, and this is not an undo
      stub(ctx, THREAD_X, y + (row.time ? 26 : -2), 26, 44, 1, { alpha: 0.8 });
      gone += 1;
      return;
    }
    plainRow(ctx, THREAD_X, y, row.text, {
      alpha: 1 - goneK, size: 28, time: row.time, rail: 210,
      colour: "rgba(226,236,246,0.92)",
    });
    if (selK > 0.001) {
      const rowW = 470;
      selectionBox(ctx, THREAD_X - 12, y + (row.time ? 8 : -16), rowW, 62, selK, { alpha: 1 - goneK });
    }
    if (d != null && t >= d + 0.12 && t < d + 0.5) {
      deleteChip(ctx, THREAD_X + 500, y + 44, clamp01((t - d - 0.12) / 0.2), {
        alpha: 1 - clamp01((t - d - 0.4) / 0.1),
      });
    }
    if (goneK > 0.01 && goneK < 0.999) {
      // what is left where the message was
      stub(ctx, THREAD_X, y + 26, 26, 44, goneK, { alpha: 1 - goneK * 0.2 });
    }
  });

  // The pieces stack up beside the thread, and the keyword lands on them.
  const pileX = 1062;
  const pileY = 636;
  const landed = [119.1, 119.9, 120.5];
  landed.forEach((d, i) => {
    const k = clamp01(at(t, d + 0.28, d + 0.62));
    if (k <= 0) return;
    const px = pileX + i * 30 + (1 - k) * 120;
    const py = pileY + (i % 2) * 26 + (1 - k) * -40;
    stub(ctx, px, py, 26, 44, k, { alpha: 0.9 });
  });

  footerStrip(ctx, t, {
    alpha: 0.85, title: "me, as geometry", count: Math.max(1, 6 - gone),
    chip: { text: "harness · offline", on: false }, x: 210, y: 1012, w: 1500,
  });
  label(ctx, "erasing", 210, 968, { size: 13, colour: "rgba(139,164,194,0.7)" });

  return { phase: "erase", gone, grade: gradeAt(t) };
}

// ---------------------------------------------------------------------------
// alone-empty — one tidy page, one message, and the sentence she has not finished.
// ---------------------------------------------------------------------------
function aloneEmpty(ctx, t, s) {
  const u = t - s.at;
  room(ctx, t, { focus: [1100, 500], lift: 0.06 });

  // She is behind the glass now: the same lowlit plate, dimmed and pushed back.
  const low = figureImages.lowlight;
  if (low && low.complete) {
    const h = 800;
    const w = (1342 / 1704) * h;
    const bob = Math.sin(t * 1.1) * 2.4;
    layer(ctx, 0.62, () => {
      ctx.drawImage(low, 1610 - w / 2, 560 + bob - h / 2, w, h);
    });
  }
  // the glass: a panel over her half of the frame, with one bright edge
  layer(ctx, 1, () => {
    rect(ctx, 1300, 40, 620, 1000, "rgba(10,26,38,0.28)", 8, "rgba(120,146,170,0.28)");
    stroke(ctx, [[1300, 40], [1300, 1040]], "rgba(180,204,226,0.35)", 1.4, 0.9);
    // a reflection sliding down the glass, so it reads as glass and not as a panel
    const gl = ctx.createLinearGradient(1320, 40, 1720, 700);
    gl.addColorStop(0, "rgba(196,214,232,0.10)");
    gl.addColorStop(0.5, "rgba(196,214,232,0.02)");
    gl.addColorStop(1, "rgba(196,214,232,0)");
    ctx.fillStyle = gl;
    ctx.fillRect(1320, 40, 560, 900);
  });

  // The page: a header, one message with its Delete pill still hovering, and the
  // composer that will never be used again.
  const P = { x: 140, y: 108, w: 1140, h: 820 };
  layer(ctx, 1, () => {
    rect(ctx, P.x, P.y, P.w, P.h, "rgba(9,28,41,0.94)", 10, "rgba(120,146,170,0.35)");
    type(ctx, "3 messages", P.x + 34, P.y + 48, 16, "rgba(139,164,194,0.85)", "MV Mono");
    stroke(ctx, [[P.x + 30, P.y + 68], [P.x + P.w - 30, P.y + 68]], "rgba(120,146,170,0.35)", 1, 0.9);
  });

  const kMsg = at(u, 0.08, 0.3);
  const msgY = 250;
  layer(ctx, kMsg, () => {
    label(ctx, "+9 days", P.x + 34, msgY, { size: 14, colour: "rgba(139,164,194,0.7)" });
    type(ctx, "one sec, brb", P.x + 34, msgY + 50, 36, "#eef4fb", "MV Serif");
    stroke(ctx, [[P.x + 34, msgY + 76], [P.x + 360, msgY + 76]], "rgba(120,146,170,0.3)", 1.1, 0.8);
  });
  // the selection and the pill: it is about to go as well
  const selK = clamp01(at(u, 2.0, 2.34));
  if (selK > 0.001) {
    selectionBox(ctx, P.x + 24, msgY + 4, 420, 84, selK);
    deleteChip(ctx, P.x + 500, msgY + 40, clamp01(at(u, 2.14, 2.34)));
  }

  // the composer at the foot of the page: empty, and it stays empty
  layer(ctx, 0.95, () => {
    rect(ctx, P.x + 30, P.y + P.h - 150, P.w - 60, 118, "rgba(12,38,54,0.9)", 16, "rgba(61,122,156,0.45)");
    type(ctx, "发消息，/ 调用指令", P.x + 62, P.y + P.h - 84, 26, "rgba(90,120,144,0.75)", "MV Sans");
  });

  // the three stubs from the previous shot leave the frame
  const leave = clamp01(at(u, 0.1, 0.9));
  [0, 1, 2].forEach((i) => {
    stub(ctx, 1020 + i * 30 + leave * 160, 636 + (i % 2) * 26 - leave * 120, 26, 44, 1, {
      alpha: 0.6 * (1 - leave),
    });
  });

  // the last words of the song's verse, set small at the foot: she is one word short
  return { phase: "empty", grade: gradeAt(t) };
}

// ---------------------------------------------------------------------------
// alone-eye — dark, then her eye, then the interface starts to delete the word.
// ---------------------------------------------------------------------------
function aloneEye(ctx, t, s) {
  const u = t - s.at;
  room(ctx, t, { focus: [960, 520], lift: 0.02 });

  // The unfinished sentence holds where it stood, then the face comes up under it.
  const sentenceK = 1 - clamp01(at(u, 0.2, 0.42));
  if (sentenceK > 0.01) {
    layer(ctx, sentenceK, () => {
      type(ctx, "then maybe you won't leave me", 960, 520, 44, "rgba(206,220,234,0.8)", "MV Serif", "center");
    });
  }

  const faceK = clamp01(at(u, 0.14, 0.46));
  if (faceK > 0.01) {
    drawEye(ctx, { target: [960, 470], scale: 2.28, alpha: faceK, cold: 0.35 });
  }

  // the band of black under her chin, so the last word of the section has a floor
  const bandK = clamp01(at(u, 0.34, 0.52));
  layer(ctx, bandK, () => {
    const g = ctx.createLinearGradient(0, 700, 0, 1080);
    g.addColorStop(0, "rgba(2,6,10,0)");
    g.addColorStop(0.3, "rgba(2,6,10,0.94)");
    g.addColorStop(1, "rgba(2,6,10,0.99)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 700, 1920, 380);
  });

  // The interface selects HEART out of DISHEARTENED and reaches for it. Ours takes
  // the word's own heart, which is the whole point of the last shot of the section:
  // the box has to sit on the glyphs the lyric layer draws, so it reads the same
  // layout the power treatment uses.
  const keys = clamp01(at(u, 0.62, 0.84));
  if (keys > 0.001) {
    const lay = powerLayout(ctx, lineText(83), { anchor: [960, 946], maxWidth: 1760, maxSize: 176 });
    // D I S | H E A R T | E N E D
    const i0 = lay.chars.indexOf("H", 3);
    const i1 = i0 < 0 ? lay.chars.length - 1 : i0 + 4;
    const bx = lay.xs[Math.max(0, i0)];
    const after = i1 + 1 < lay.chars.length ? lay.xs[i1 + 1] : lay.x0 + lay.total;
    const bw = after - bx;
    selectionBox(ctx, bx - 6, lay.y - lay.size * 0.86, bw + 12, lay.size * 1.16, keys);
    deleteChip(ctx, after + 18, lay.y - lay.size * 0.72, clamp01(at(u, 0.74, 0.9)));
  }

  return { phase: "eye", grade: gradeAt(t) };
}

export const SECTION8_ALONE_RENDER = Object.freeze({
  "alone-erase": withFx(aloneErase, "alone-erase"),
  "alone-empty": withFx(aloneEmpty, "alone-empty"),
  "alone-eye": withFx(aloneEye, "alone-eye"),
});
