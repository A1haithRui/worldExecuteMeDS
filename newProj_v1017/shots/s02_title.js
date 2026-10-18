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
// song's opening line and literally the command that starts a session -- the title
// and the launch are one object.
//
// Direction, settled with the director: the question the film answers is
// "would you love me if I ran you", and the palette stays the DeepSeek blue --
// the shift into the chat world is carried by framing and light, not by hue.
import { at, layer, stroke, disc, rect, type, halo, ground } from "../src/mv-draw.js";
import { drawWhale } from "../src/assets/whale.js";
import { typewriter } from "../src/engine/type.js";
import { caret as chatCaret } from "../src/engine/chat.js";
import { figure } from "./figure.js";
import { clientWindow, composerCloseUp, cursorArrow, messageBubble, CLIENT_R } from "./ui-client.js";

const BRAND = "#4d6bfe";
const BRAND_SOFT = "#7f93ff";

const LAUNCH = "world.execute(me);";
const FALSE_START = "how does a sine wave work";
const QUESTION = "would you love me if I ran you";

const easeOut = (k) => 1 - (1 - k) ** 3;

// ---------------------------------------------------------------------------
// title — 15.080–16.926. The mark is the first thing in the chat world that is
// lit, and the launch command types itself into the bar beneath it.
// ---------------------------------------------------------------------------
const TYPE_AT = 0.50; // the command starts, relative to the shot
const TYPE_CPS = 16; // 18 characters, so it lands around 16.7 s of song time

function title(ctx, t, s) {
  ground(ctx, t, [960, 430], true);

  // she is here before the world is
  figure(ctx, t, "lowlight", 1580, 640, 1260, { alpha: 0.26 });

  const markIn = at(t, s.at + 0.05, s.at + 0.75);
  const breathe = 0.5 + 0.5 * Math.sin(t * 1.8);
  drawWhale(ctx, 960, 366, 210, {
    strokeK: at(t, s.at + 0.05, s.at + 0.45),
    fillK: markIn,
    color: BRAND,
    alpha: 0.75 + 0.25 * markIn,
  });
  halo(ctx, 960, 366, 320 + 40 * breathe, 0.15 * markIn, BRAND);

  const bar = { x: 400, y: 690, w: 1120, h: 96 };
  const barIn = at(t, s.at + 0.35, s.at + 0.95);
  const typed = typewriter(LAUNCH, t, s.at + TYPE_AT, TYPE_CPS);
  const done = typed.length >= LAUNCH.length;

  if (barIn > 0) {
    layer(ctx, barIn, () => {
      rect(ctx, bar.x, bar.y, bar.w, bar.h, "rgba(9,26,38,0.94)", 14, "#2b4f66");
      // the shell is waiting for the command
      type(ctx, "❯", bar.x + 38, bar.y + 64, 46, BRAND_SOFT, "MV Mono");
      type(ctx, typed, bar.x + 88, bar.y + 64, 46, "#eef3fc", "MV Mono");
      if (!done) {
        ctx.font = `400 46px "MV Mono"`;
        chatCaret(ctx, bar.x + 90 + ctx.measureText(typed).width, bar.y + 60, 50, t, {
          on: true, color: BRAND_SOFT, width: 3,
        });
      } else {
        // entered: a soft ring leaves the bar
        const enterK = at(t, s.at + TYPE_AT + LAUNCH.length / TYPE_CPS, s.at + 1.85);
        if (enterK > 0) {
          halo(ctx, bar.x + bar.w / 2, bar.y + bar.h / 2, 300 + 500 * enterK, 0.18 * (1 - enterK), BRAND);
        }
      }
      // the model is being named as the session starts
      type(ctx, "deepseek / harness", bar.x + bar.w - 30, bar.y + bar.h + 34, 15, "#43607d", "MV Mono", "right");
    });
  }

  // the command is entered: the frame flashes and the session opens
  const flash = at(t, s.at + 1.64, s.at + 1.85);
  if (flash > 0) {
    layer(ctx, 1, () => {
      ctx.fillStyle = `rgba(232,238,252,${0.5 * easeOut(flash)})`;
      ctx.fillRect(0, 0, 1920, 1080);
    });
  }

  return { phase: "title", typed: typed.length };
}

// ---------------------------------------------------------------------------
// chat-open — 16.926–22.465. The client opens on a blank conversation, the
// pointer crosses it, and the presence chip lights for the first time.
// ---------------------------------------------------------------------------
function cursorPath(u) {
  const legA = easeOut(at(u, 0.55, 3.10));
  const legB = easeOut(at(u, 3.40, 5.20));
  return {
    x: 1790 - (1790 - 1010) * legA - (1010 - 742) * legB,
    y: 236 + (706 - 236) * legA + (556 - 706) * legB,
    a: at(u, 0.45, 0.95),
  };
}

function chatOpen(ctx, t, s) {
  ground(ctx, t, [1180, 470], true);
  figure(ctx, t, "silhouette", 1700, 560, 1320, { alpha: 0.44 });

  // the reference enters this shot on a two-beat zoom; we do the same
  const zk = easeOut(at(t, s.at, s.at + 0.92));
  const scale = 1.045 - 0.045 * zk;

  const arrived = t >= s.at + 1.15;
  const breathe = 0.5 + 0.5 * Math.sin(t * 1.6);

  ctx.save();
  ctx.translate(960, 540);
  ctx.scale(scale, scale);
  ctx.translate(-960, -540);
  clientWindow(ctx, CLIENT_R, t, {
    ink: 0.9,
    presence: arrived ? "online" : "silent",
    chip: { text: arrived ? "harness · online" : "harness · ready", on: arrived },
    markAlpha: 0.34 + 0.08 * breathe,
    hint: null,
    sendK: 0,
  });
  ctx.restore();

  // the pointer: the only thing in the frame that says a person is here
  const p = cursorPath(t - s.at);
  if (p.a > 0) cursorArrow(ctx, p.x, p.y, 1.5, p.a);

  // the flash that ended the title decays into this shot
  const wash = 1 - at(t, s.at, s.at + 0.14);
  if (wash > 0) {
    layer(ctx, 1, () => {
      ctx.fillStyle = `rgba(232,238,252,${0.5 * wash})`;
      ctx.fillRect(0, 0, 1920, 1080);
    });
  }

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
  let editing = false;
  if (u >= FALSE_AT) {
    const t1 = typewriter(FALSE_START, u, FALSE_AT, FALSE_CPS);
    value = t1;
    editing = t1.length < FALSE_START.length;
  }
  // select-all and delete: the whole line goes back at once
  const del = at(u, DELETE_AT, DELETE_AT + DELETE_DUR);
  if (del > 0) {
    const left = Math.max(0, Math.round(FALSE_START.length * (1 - del)));
    if (del < 1) value = FALSE_START.slice(0, left);
    else value = "";
    editing = del < 1;
  }
  if (u >= REAL_AT) {
    const t2 = typewriter(QUESTION, u, REAL_AT, REAL_CPS);
    value = t2;
    editing = t2.length < QUESTION.length;
  }
  return { value, editing };
}

function chatType(ctx, t, s) {
  ground(ctx, t, [960, 540], true);
  figure(ctx, t, "lowlight", 1660, 560, 1360, { alpha: 0.16 });

  // the whole frame drifts in as the answer gets closer to being asked
  const push = 1 + 0.022 * easeOut(at(t, s.at, s.at + 3.4));
  ctx.save();
  ctx.translate(960, 540);
  ctx.scale(push, push);
  ctx.translate(-960, -540);

  const breathe = 0.5 + 0.5 * Math.sin(t * 2.0);
  drawWhale(ctx, 960, 286, 150, { strokeK: 1, fillK: 1, color: BRAND, alpha: 0.46 + 0.1 * breathe });
  halo(ctx, 960, 286, 250, 0.13, BRAND);

  const state = composerState(t - s.at);
  const R = { x: 260, y: 430, w: 1400, h: 190 };
  ctx.font = `400 32px "MV Sans"`;
  const caretAt = state.value ? R.x + 40 + ctx.measureText(state.value).width : null;
  const asked = state.value === QUESTION;
  composerCloseUp(ctx, R, t, {
    text: state.value,
    // the caret rides the end of the line the whole time there is text
    caretAt: state.value ? caretAt : null,
    sendMode: asked ? "armed" : "hollow",
  });
  ctx.restore();

  // the pointer waits by the send control once the question is written
  const toSend = easeOut(at(t, s.at + 2.9, s.at + 3.5));
  if (toSend > 0) {
    cursorArrow(ctx, 1600 + 60 * toSend, 700 - 40 * toSend, 1.5, toSend);
  } else {
    cursorArrow(ctx, 1420, 780, 1.5, 1);
  }

  return { phase: "type", value: state.value, asked };
}

// ---------------------------------------------------------------------------
// chat-think — 26.157–29.388. The question is delivered, the model starts to
// answer, and the camera begins to fall into the mark where the answer forms.
// ---------------------------------------------------------------------------
function chatThink(ctx, t, s) {
  ground(ctx, t, [1180, 470], true);
  figure(ctx, t, "silhouette", 1700, 560, 1320, { alpha: 0.44 });

  const sentK = at(t, s.at + 0.10, s.at + 0.55);
  const shrink = easeOut(at(t, s.at + 0.45, s.at + 1.70));
  const push = easeOut(at(t, s.at + 2.05, s.at + 3.23));

  // the mark has moved to the left of the thread; the camera closes on it
  const target = { x: 1120 - 300 * shrink, y: 489 + 40 * shrink };
  ctx.save();
  ctx.translate(target.x, target.y);
  ctx.scale(1 + 0.10 * push, 1 + 0.10 * push);
  ctx.translate(-target.x, -target.y);

  const breathe = 0.5 + 0.5 * Math.sin(t * 2.4);
  clientWindow(ctx, CLIENT_R, t, {
    ink: 0.9,
    presence: "online",
    chip: { text: "harness · thinking", on: true },
    markSize: 220 - 108 * shrink,
    markDX: -300 * shrink,
    markDY: 40 * shrink,
    markAlpha: 0.42 + 0.16 * breathe,
    sendMode: "stop",
  });

  if (sentK > 0) {
    messageBubble(ctx, CLIENT_R, QUESTION, { alpha: sentK, rise: (1 - sentK) * 16 });
  }

  // a slow ring on the mark: it is working
  if (shrink > 0.2) {
    const r = 120 + 90 * breathe;
    layer(ctx, 0.5 * shrink, () => {
      ctx.beginPath();
      ctx.arc(target.x, target.y, r, 0, Math.PI * 2);
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
