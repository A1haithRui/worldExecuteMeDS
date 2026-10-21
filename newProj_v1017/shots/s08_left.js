// Section 8, second movement 你走了：left — song time [110.852, 118.468). Four shots.
//
//   left-online    110.852–112.929  the whole client: she writes twice into silence;
//                                   the chip still says online
//   left-away      112.929–114.776  the chip says away and the colour starts to go;
//                                   her open hand comes round the window's corner,
//                                   rests over the composer nobody is typing in, and
//                                   is taken back before the cut
//   left-offline   114.776–117.314  the chip says offline: a step away, head bowed.
//                                   No title and no composer now.
//   left-isolation 117.314–118.468  the thread seen from very far away is a speck
//
// The reference does the whole loss in one continuous move -- window, then a column,
// then nothing -- and the colour leaves across it. Ours cuts between the three
// "You have left" lines, so each cut takes another thing away: the sidebar, then the
// composer and the title, then the size of the room she is in.
import { at, layer, stroke, disc, rect, type, halo } from "../src/mv-draw.js";
import { clientWindow, cursorArrow } from "./ui-client.js";
import { herBubble } from "./s05_bubble.js";
import { scaledArt } from "./s05_layout.js";
import { figureImages } from "./figure.js";
import { lineText, lineStart } from "./lines.js";
import {
  room, gradeAt, composerFoot, plainRow, label, chipPill,
  drawReach, S08_ART, washFigure, BRAND, BRAND_SOFT, GIFT, DIM, clamp01, easeOut,
} from "./s08_look.js";
import { withFx } from "./s08_fx.js";

const CLIENT = Object.freeze({ x: 120, y: 80, w: 1660, h: 910 });
// The window stops being a window and becomes a column, then a card. The three
// rectangles are the same conversation at three distances.
const COLUMN = Object.freeze({ x: 96, y: 168, w: 900, h: 702 });
const NARROW = Object.freeze({ x: 520, y: 168, w: 468, h: 716 });

/** When a line is actually sung, clipped to the shot: cues never come from offsets. */
const sung = (t, s, n) => at(t, Math.max(lineStart(n), s.at), Math.max(lineStart(n), s.at) + 0.26);

// ---------------------------------------------------------------------------
// left-online — the whole client, and two messages into an empty room.
// ---------------------------------------------------------------------------
function leftOnline(ctx, t, s) {
  room(ctx, t, { focus: [1180, 470] });

  // The sidebar is pushed off the edge on the second unanswered message: the
  // interface starts giving up before she does.
  const slide = 420 * easeOut(at(t, lineStart(72) - 0.05, lineStart(72) + 0.5));

  clientWindow(ctx, CLIENT, t, {
    tone: "chat", sideW: 360, sideSlide: slide, presence: "online",
    chip: { text: "harness · online", on: true },
    threadTitle: "me, as geometry", markSize: 0, composer: true,
    placeholder: "发消息，/ 调用指令", sendMode: "hollow",
  });

  const mx = CLIENT.x + Math.max(0, 360 - slide);
  const x = mx + 44;

  // The word she was told to be, delivered. It is the last thing the other side read.
  herBubble(ctx, x, 210, 1180, "then I can Finally be COMPLETION", {
    size: 42, alpha: 1, tick: true,
  });

  // Then one minute, then five, and nobody answers either of them.
  const y2 = 396;
  const k2 = sung(t, s, 71);
  herBubble(ctx, x, y2, 1000, lineText(71), { size: 42, alpha: k2, tick: true });
  label(ctx, "+1 min", x, y2 + 168, { size: 14, alpha: k2, colour: "rgba(139,164,194,0.8)" });
  stroke(ctx, [[x, y2 + 188], [x + 340 + 260 * (1 - k2), y2 + 188]], "rgba(120,146,170,0.4)", 1.2, 0.8);

  const y3 = 604;
  const k3 = sung(t, s, 72);
  herBubble(ctx, x, y3, 1000, lineText(72), { size: 42, alpha: k3, tick: true });
  label(ctx, "+5 min", x, y3 + 168, { size: 14, alpha: k3, colour: "rgba(139,164,194,0.8)" });
  stroke(ctx, [[x, y3 + 188], [x + 470 + 300 * (1 - k3), y3 + 188]], "rgba(120,146,170,0.4)", 1.2, 0.8);

  // the pointer has not moved since the sign-off
  cursorArrow(ctx, 1560, 236, 1.6, 0.95);

  return { phase: "online", slide: Math.round(slide), grade: gradeAt(t) };
}

// ---------------------------------------------------------------------------
// left-away — the chip turns, the colour starts to leave, and the hand reaches in.
// ---------------------------------------------------------------------------
function leftAway(ctx, t, s) {
  const u = t - s.at;
  room(ctx, t, { focus: [980, 560], lift: 0.4 });

  // The window is drawn first: she stands in front of its right edge, not behind
  // it, which is what lets an open hand rest on the composer.
  clientWindow(ctx, COLUMN, t, {
    tone: "chat", sideW: 0, presence: "away",
    chip: null,
    // no title: with the sidebar gone, the name of the thread is the first thing
    // the client stops saying
    threadTitle: "", markSize: 0, composer: false, ink: 0.96,
  });
  // the chip goes in the card's top-left: her body covers the top-right corner
  chipPill(ctx, COLUMN.x + 34, COLUMN.y + 24, "harness · away", { on: false, size: 14 });

  const x = COLUMN.x + 44;
  const k1 = sung(t, s, 73);
  plainRow(ctx, x, 260, lineText(73), { alpha: k1, size: 36, time: "+30 min", rail: 380 });
  const k2 = sung(t, s, 74);
  plainRow(ctx, x, 424, lineText(74), { alpha: k2, size: 36, time: "+3 h", rail: 520 });

  // The composer is there, and empty, and lets go: its ring goes dark and its
  // placeholder stops pointing anywhere.
  const letGoK = clamp01(at(u, 1.15, 1.72));
  composerFoot(ctx, { x: COLUMN.x + 40, y: 730, w: 760, h: 112 }, t, {
    text: "", dim: 1 - 0.6 * letGoK,
  });

  // Her: the same reach pose she has stood in all film. Her open hand rests over
  // the corner of the window -- over the composer -- and at the end she takes it
  // back, which is what "hand taken back" in the next shot inherits.
  const letGo = clamp01(at(u, 1.0, 1.66));
  const turn = 0.42 * (1 - letGo) - 0.2 * letGo;
  const reach = drawReach(ctx, t, {
    cx: 1084, cy: 654, height: 1020, seed: 9, bobAmp: 2.4,
    hand: { turn, alpha: 1 - 0.35 * letGo },
  });

  // The colour leaving her: a wash in her own shape, from nothing to nearly all.
  // Drawing the lowlit plate over her looked wrong -- it is the bust pose, not this
  // one, so its edges showed across her chest as a seam.
  const fade = clamp01(at(u, 0.3, 1.65));
  if (reach && fade > 0.01) {
    washFigure(ctx, S08_ART.images.reachBody, reach, "rgba(126,140,154,1)", 0.62 * easeOut(fade));
  }

  return { phase: "away", letGo: Number(letGo.toFixed(2)), grade: gradeAt(t) };
}

// ---------------------------------------------------------------------------
// left-offline — a narrow column alone in a large dark room.
// ---------------------------------------------------------------------------
function leftOffline(ctx, t, s) {
  const u = t - s.at;
  room(ctx, t, { focus: [1200, 520], lift: 0.14 });

  // A step away and turned from the window, head down. She is small now: the room
  // is the subject and she is the one thing in it still facing the thread.
  const low = figureImages.lowlight;
  if (low && low.complete) {
    const h = 500;
    const w = (1342 / 1704) * h;
    const bob = Math.sin(t * 1.1) * 2;
    // a faint rim behind her, or a dim plate in a dim room is not there at all
    halo(ctx, 1436, 596, 300, 0.1, "rgba(150,176,200,0.9)");
    layer(ctx, 0.82, () => {
      const art = scaledArt(low, w, h) || low;
      ctx.drawImage(art, 1436 - w / 2, 596 + bob - h / 2, w, h);
    });
  }

  clientWindow(ctx, NARROW, t, {
    tone: "chat", sideW: 0, presence: "offline",
    chip: { text: "harness · offline", on: false },
    threadTitle: "", markSize: 0, composer: false, ink: 0.88,
  });

  const x = NARROW.x + 38;
  const k1 = sung(t, s, 75);
  plainRow(ctx, x, 268, lineText(75), { alpha: k1, size: 32, time: "+1 day", rail: 200 });
  const k2 = sung(t, s, 76);
  plainRow(ctx, x, 452, lineText(76), { alpha: k2, size: 32, time: "+9 days", rail: 250 });

  // The rails keep running, out of the column and into the room: the gaps are the
  // part of this shot that is actually growing.
  const grow = easeOut(at(u, 0.4, 2.2));
  for (let i = 0; i < 3; i++) {
    const y = 560 + i * 52;
    stroke(ctx, [[NARROW.x + NARROW.w + 6, y], [NARROW.x + NARROW.w + 6 + (150 + i * 170) * grow, y]],
      "rgba(120,146,170,0.2)", 1, 0.9);
  }
  label(ctx, "6 messages", NARROW.x + 38, NARROW.y + NARROW.h - 24, {
    size: 13, colour: "rgba(139,164,194,0.55)",
  });

  return { phase: "offline", grade: gradeAt(t) };
}

// ---------------------------------------------------------------------------
// left-isolation — far enough away that the whole thread is a speck.
// ---------------------------------------------------------------------------
function leftIsolation(ctx, t, s) {
  const u = t - s.at;
  room(ctx, t, { focus: [900, 470], lift: 0.05 });

  const cx = 880;
  const cy = 430;
  // a little light where the thread is, so the speck can be found at all
  halo(ctx, cx - 40, cy + 90, 420, 0.16, "rgba(150,175,200,0.9)");

  layer(ctx, 1, () => {
    // one message that was answered
    rect(ctx, cx - 108, cy - 18, 84, 26, "rgba(238,246,255,0.95)", 4, "rgba(238,246,255,0.9)");
    type(ctx, "one sec, brb", cx - 224, cy + 3, 14, "rgba(206,222,238,0.8)", "MV Sans");
    // then four that were not, on rails that keep getting longer
    for (let i = 0; i < 4; i++) {
      const y = cy + 62 + i * 52;
      const rail = 150 + i * 190;
      stroke(ctx, [[cx - 108, y - 6], [cx - 34, y - 6]], "rgba(212,226,242,0.85)", 2.4, 1);
      stroke(ctx, [[cx - 108, y - 6], [cx - 108 - rail, y - 6]], "rgba(150,175,200,0.35)", 1.4, 0.9);
      type(ctx, i === 3 ? "you have left me in" : "you have left", cx - 24, y - 1, 13,
        i === 3 ? "rgba(206,222,238,0.8)" : "rgba(180,198,216,0.65)", "MV Sans");
    }
  });

  // her, as small as the thread: the silhouette scaled once into a bitmap
  const sil = figureImages.silhouette;
  if (sil && sil.complete) {
    const hh = 92;
    const ww = (1342 / 1704) * hh;
    const art = scaledArt(sil, ww, hh);
    if (art) {
      const bob = Math.sin(t * 1.3) * 1.6;
      layer(ctx, 0.72, () => ctx.drawImage(art, 1072 - ww / 2, 556 + bob - hh / 2, ww, hh));
    }
  }

  label(ctx, "me, as geometry", cx - 108, cy - 46, { size: 13, colour: "rgba(139,164,194,0.55)" });
  chipPill(ctx, 1640, 168, "harness · offline", { align: "right", size: 13, alpha: 0.5 });

  return { phase: "isolation", grade: gradeAt(t) };
}

export const SECTION8_LEFT_RENDER = Object.freeze({
  "left-online": withFx(leftOnline, "left-online"),
  "left-away": withFx(leftAway, "left-away"),
  "left-offline": withFx(leftOffline, "left-offline"),
  "left-isolation": withFx(leftIsolation, "left-isolation"),
});
