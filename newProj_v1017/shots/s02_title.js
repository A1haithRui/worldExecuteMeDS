// Section 2 标题与第一个问题 — song time [15.080, 29.388). Four shots:
//
//   title       15.080–16.926  the mark lights, the launch command is entered
//   chat-open   16.926–22.465  the client opens, the pointer crosses, you arrive
//   chat-type   22.465–26.157  the question: a false start, deleted, then the real one
//   chat-think  26.157–29.388  it is sent; the answer will form inside the mark
//
// The reference marks this section by leaving the product world and entering the
// chat world, and its "title" is the launch command typed into an input bar. We do
// the same thing with the same words, because `world.execute(me);` is both the
// song's opening line and literally the command that starts a session.
//
// Direction, settled with the director: the question the film answers is
// "would you love me if I ran you"; the palette stays DeepSeek blue, but the room
// comes up -- section 2 is lit where section 1 was near-black, which is what
// stepping inside the client should feel like. And the cut from `title` is not a
// cut: the whole picture is pulled into the mark and the next shot grows back out
// of it.
import { at, layer, stroke, disc, rect, type, halo, ground } from "../src/mv-draw.js";
import { drawWhale } from "../src/assets/whale.js";
import { typewriter } from "../src/engine/type.js";
import { figure } from "./figure.js";
import {
  clientWindow, composerCloseUp, cursorArrow, clickRipple,
  markFlare, connectionToast, messageBubble, CLIENT_R,
} from "./ui-client.js";

const BRAND = "#4d6bfe";
const BRAND_SOFT = "#7f93ff";

const LAUNCH = "world.execute(me);";
const FALSE_START = "how does a sine wave work";
const QUESTION = "would you love me if I ran you";

const easeOut = (k) => 1 - (1 - k) ** 3;
const LIFT = 0.5; // how far the room is raised above the product world

// The mark's home in the title shot, and the point the cut collapses into and
// grows back out of. Both shots share it, so the transition reads as continuous.
const GATE = { x: 960, y: 366 };

/** A blown-out core: the light the picture is pulled into. */
function bloom(ctx, x, y, r, a) {
  if (a <= 0.001) return;
  layer(ctx, Math.min(1, a), () => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(244,248,255,0.97)");
    g.addColorStop(0.22, "rgba(158,186,255,0.6)");
    g.addColorStop(1, "rgba(77,107,254,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1920, 1080);
  });
}

/** Rays that travel inward as `k` rises: everything falling into the mark. */
function collapseRays(ctx, x, y, k) {
  if (k <= 0.001) return;
  layer(ctx, 0.55 * k, () => {
    const inner = 200 + (1 - k) * 980;
    const outer = inner + 420;
    for (let i = 0; i < 30; i++) {
      const a = (i / 30) * Math.PI * 2 + 0.21;
      const g = ctx.createLinearGradient(
        x + Math.cos(a) * inner, y + Math.sin(a) * inner,
        x + Math.cos(a) * outer, y + Math.sin(a) * outer,
      );
      g.addColorStop(0, "rgba(214,226,255,0.9)");
      g.addColorStop(1, "rgba(127,147,255,0)");
      ctx.strokeStyle = g;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * inner, y + Math.sin(a) * inner);
      ctx.lineTo(x + Math.cos(a) * outer, y + Math.sin(a) * outer);
      ctx.stroke();
    }
  });
}

// ---------------------------------------------------------------------------
// title — 15.080–16.926. The mark is the first thing in the chat world that is
// lit, and the launch command types itself into the bar beneath it. When the
// command lands, the picture is pulled into the mark.
// ---------------------------------------------------------------------------
const TYPE_AT = 0.42; // the command starts, relative to the shot
const TYPE_CPS = 18; // 18 characters, so it lands at about 16.5 s of song time
const SUCK_AT = 1.44; // and the collapse begins at about 16.52 s

function title(ctx, t, s) {
  const suck = easeOut(at(t, s.at + SUCK_AT, s.at + 1.85));

  // The ground stays put and the foreground is pulled into the mark: scaling the
  // ground too just exposes the void as a black border, which reads as a mistake
  // rather than a collapse.
  ground(ctx, t, [GATE.x, 470], true, LIFT);

  ctx.save();
  ctx.translate(GATE.x, GATE.y);
  const k = 1 - 0.34 * suck;
  ctx.scale(k, k);
  ctx.translate(-GATE.x, -GATE.y);

  // she is here before the world is
  figure(ctx, t, "lowlight", 1560, 650, 1260, { alpha: 0.52 });

  const markIn = at(t, s.at + 0.05, s.at + 0.75);
  drawWhale(ctx, GATE.x, GATE.y, 210, {
    strokeK: at(t, s.at + 0.05, s.at + 0.45),
    fillK: markIn,
    color: BRAND,
    alpha: 0.85 + 0.15 * markIn,
  });
  markFlare(ctx, GATE.x, GATE.y, 210, t, markIn);

  const bar = { x: 400, y: 690, w: 1120, h: 96 };
  const barIn = at(t, s.at + 0.30, s.at + 0.90);
  const typed = typewriter(LAUNCH, t, s.at + TYPE_AT, TYPE_CPS);
  const done = typed.length >= LAUNCH.length;

  if (barIn > 0) {
    layer(ctx, barIn, () => {
      rect(ctx, bar.x, bar.y, bar.w, bar.h, "rgba(12,36,54,0.95)", 14, "#2f6486");
      type(ctx, "❯", bar.x + 38, bar.y + 64, 46, BRAND_SOFT, "MV Mono");
      type(ctx, typed, bar.x + 88, bar.y + 64, 46, "#f2f7fd", "MV Mono");
      if (!done) {
        ctx.font = `400 46px "MV Mono"`;
        const cx = bar.x + 90 + ctx.measureText(typed).width;
        if (Math.floor(t * 12) % 2 === 0) {
          ctx.fillStyle = BRAND_SOFT;
          ctx.fillRect(cx + 4, bar.y + 34, 4, 40);
        }
      }
      type(ctx, "deepseek / harness", bar.x + bar.w - 30, bar.y + bar.h + 34, 15, "#6f93ae", "MV Mono", "right");
    });
  }
  ctx.restore();

  // the pull: rays converge, then the mark blows out and takes the frame
  collapseRays(ctx, GATE.x, GATE.y, at(t, s.at + SUCK_AT, s.at + 1.80));
  bloom(ctx, GATE.x, GATE.y, 260 + 1500 * suck, suck);
  const flash = at(t, s.at + 1.62, s.at + 1.85);
  if (flash > 0) {
    layer(ctx, 1, () => {
      ctx.fillStyle = `rgba(240,246,255,${0.8 * easeOut(flash)})`;
      ctx.fillRect(0, 0, 1920, 1080);
    });
  }

  return { phase: "title", typed: typed.length, suck };
}

// ---------------------------------------------------------------------------
// chat-open — 16.926–22.465. The window grows back out of the mark, the pointer
// crosses to the composer, and the connection is confirmed.
// ---------------------------------------------------------------------------
/** Top-right to the composer: the pointer has somewhere to be, not just to float. */
function cursorPath(u) {
  const legA = easeOut(at(u, 0.80, 2.60));
  const legB = easeOut(at(u, 2.70, 3.70));
  return {
    x: 1820 - (1820 - 1180) * legA - (1180 - 646) * legB,
    y: 190 + (660 - 190) * legA + (898 - 660) * legB,
    a: at(u, 0.72, 1.15),
  };
}
const LAND_AT = 3.70; // the pointer reaches the composer here

function chatOpen(ctx, t, s) {
  const grow = easeOut(at(t, s.at, s.at + 0.58));

  ctx.fillStyle = "#0a1e2c";
  ctx.fillRect(0, 0, 1920, 1080);
  ctx.save();
  // the window comes back out of the mark's position
  ctx.translate(GATE.x, GATE.y);
  ctx.scale(0.45 + 0.55 * grow, 0.45 + 0.55 * grow);
  ctx.translate(-GATE.x, -GATE.y);

  ground(ctx, t, [1180, 470], true, LIFT);
  figure(ctx, t, "silhouette", 1700, 560, 1320, { alpha: 0.5 });

  const arrived = t >= s.at + 1.05;
  clientWindow(ctx, CLIENT_R, t, {
    tone: "chat",
    presence: arrived ? "online" : "silent",
    chip: { text: arrived ? "harness · online" : "harness · ready", on: arrived },
    markAlpha: 0.55,
    markPulse: 1,
    sendK: 0,
  });
  ctx.restore();

  // the bloom that swallowed the last shot decays out of the same point
  bloom(ctx, GATE.x, GATE.y, 420 + 900 * grow, 0.85 * (1 - grow));

  // the connection is confirmed rather than merely switched on
  if (arrived) connectionToast(ctx, CLIENT_R, t, s.at + 1.05);

  const p = cursorPath(t - s.at);
  if (p.a > 0) cursorArrow(ctx, p.x, p.y, 1.5, p.a);
  clickRipple(ctx, 700, 898, t, s.at + LAND_AT);

  return { phase: "open", online: arrived, cursor: [Math.round(p.x), Math.round(p.y)] };
}

// ---------------------------------------------------------------------------
// chat-type — 22.465–26.157. Close on the composer: one question is started and
// thrown away, and then the real one is typed. This is the film's thesis.
// ---------------------------------------------------------------------------
const FALSE_AT = 0.10;
const FALSE_CPS = 21;
const DELETE_AT = 1.62;
const DELETE_DUR = 0.30;
const REAL_AT = 2.02;
const REAL_CPS = 21;

/** What is in the box at this point in the shot, and how it is being edited. */
function composerState(u) {
  let value = "";
  if (u >= FALSE_AT) value = typewriter(FALSE_START, u, FALSE_AT, FALSE_CPS);
  // select-all and delete: the whole line goes back at once
  const del = at(u, DELETE_AT, DELETE_AT + DELETE_DUR);
  if (del > 0) {
    value = del < 1 ? FALSE_START.slice(0, Math.round(FALSE_START.length * (1 - del))) : "";
  }
  if (u >= REAL_AT) value = typewriter(QUESTION, u, REAL_AT, REAL_CPS);
  return { value };
}

function chatType(ctx, t, s) {
  ground(ctx, t, [960, 540], true, LIFT);
  figure(ctx, t, "lowlight", 1660, 560, 1360, { alpha: 0.3 });

  // the whole frame drifts in as the answer gets closer to being asked
  const push = 1 + 0.022 * easeOut(at(t, s.at, s.at + 3.4));
  ctx.save();
  ctx.translate(960, 540);
  ctx.scale(push, push);
  ctx.translate(-960, -540);

  drawWhale(ctx, 960, 286, 150, { strokeK: 1, fillK: 1, color: BRAND, alpha: 0.75 });
  markFlare(ctx, 960, 286, 150, t, 0.6, { rays: false });

  const state = composerState(t - s.at);
  const R = { x: 260, y: 430, w: 1400, h: 190 };
  ctx.font = `400 32px "MV Sans"`;
  const caretAt = state.value ? R.x + 40 + ctx.measureText(state.value).width : null;
  const asked = state.value === QUESTION;
  composerCloseUp(ctx, R, t, {
    text: state.value,
    caretAt,
    sendMode: asked ? "armed" : "hollow",
    tone: "chat",
  });
  ctx.restore();

  // the pointer is already in the box -- it landed there at the end of chat-open
  const toSend = easeOut(at(t, s.at + 2.9, s.at + 3.5));
  cursorArrow(ctx, 520 + 1086 * toSend, 560 + 30 * toSend, 1.5, 1);

  return { phase: "type", value: state.value, asked };
}

// ---------------------------------------------------------------------------
// chat-think — 26.157–29.388. The question is delivered, the model starts to
// answer, and the camera begins to fall into the mark where the answer forms.
// ---------------------------------------------------------------------------
function chatThink(ctx, t, s) {
  ground(ctx, t, [1180, 470], true, LIFT);
  figure(ctx, t, "silhouette", 1700, 560, 1320, { alpha: 0.5 });

  const sentK = at(t, s.at + 0.10, s.at + 0.55);
  const shrink = easeOut(at(t, s.at + 0.45, s.at + 1.70));
  const push = easeOut(at(t, s.at + 2.05, s.at + 3.23));

  // the mark has moved to the left of the thread; the camera closes on it
  const target = { x: 1120 - 300 * shrink, y: 489 + 40 * shrink };
  ctx.save();
  ctx.translate(target.x, target.y);
  ctx.scale(1 + 0.1 * push, 1 + 0.1 * push);
  ctx.translate(-target.x, -target.y);

  clientWindow(ctx, CLIENT_R, t, {
    tone: "chat",
    presence: "online",
    chip: { text: "harness · thinking", on: true },
    markSize: 220 - 108 * shrink,
    markDX: -300 * shrink,
    markDY: 40 * shrink,
    markAlpha: 0.62,
    markPulse: 1,
    sendMode: "stop",
  });

  if (sentK > 0) messageBubble(ctx, CLIENT_R, QUESTION, { alpha: sentK, rise: (1 - sentK) * 16 });

  // a slow ring on the mark: it is working
  if (shrink > 0.2) {
    const breathe = 0.5 + 0.5 * Math.sin(t * 2.4);
    layer(ctx, 0.5 * shrink, () => {
      ctx.beginPath();
      ctx.arc(target.x, target.y, 120 + 90 * breathe, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(127,147,255,0.35)";
      ctx.lineWidth = 1.6;
      ctx.stroke();
    });
  }
  ctx.restore();

  return { phase: "think", push };
}

export const SECTION2_RENDER = Object.freeze({
  title,
  "chat-open": chatOpen,
  "chat-type": chatType,
  "chat-think": chatThink,
});

export const SECTION2_IMPLEMENTED = Object.freeze(Object.keys(SECTION2_RENDER));
