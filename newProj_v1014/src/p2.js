// Second quality sample: S01-S06, song time [0, 29.709).
//
// The story: a channel opens into the deep. A signal arrives, the interface
// wakes, describes itself, reaches out once, and the character is revealed.
// Same engine layers as P0/P1 -- grade, ambient, transitions, kinetic type,
// chat components, model interior -- so this segment is the test of whether the
// vocabulary generalises beyond the first sample.
import {
  W, C, clamp, mix, phase, ease, out, at, layer, stroke, disc, rect, type,
  point, ground, caption, route, along, trace, loadImages,
} from "./mv-draw.js";
import {
  TOKENS, chatWindow, messageRow, reasoningRow, composer, statusDot, statsPill,
  contextRing, caret as chatCaret, toolCard, streamText,
} from "./engine/chat.js";
import {
  node, nodeGrid, dataColumns, signalPath, waveform, beatRings,
} from "./engine/model.js";
import { spec, typewriter } from "./engine/type.js";
import { idle, rimPulse } from "./engine/portrait.js";
import { sampleAt, audio } from "./engine/audio.js";

export const P2 = Object.freeze({
  start: 0,
  end: 29.709,
  shots: [0, 3.873, 7.446, 11.095, 16.0, 20.0, 29.709],
  cues: {
    caretOn: 0.35,
    frameConfirm: 0.72,
    signalArrive: 1.55,
    firstNode: 4.2,
    coordsDone: 6.6,
    cardStart: 7.9,
    cardDone: 10.5,
    portsOpen: 11.9,
    sonarGo: 12.6,
    reveal: 16.4,
    headpiece: 18.6,
    writeStart: 21.4,
    sent: 24.1,
    waiting: 24.7,
  },
});

const { images, ready } = loadImages({
  bust: "/assets/character/deepseek_bust_v3.png",
  silhouette: "/assets/character/v4/deepseek_bust_v4_silhouette.png",
  lowlight: "/assets/character/v4/deepseek_bust_v4_lowlight.png",
});
export const p2Ready = ready;

const BUST_W = 1342;
const BUST_H = 1704;

function figureLayout(cx, cy, height) {
  const s = height / 1438;
  return { s, x: cx - 671 * s, y: cy - 847 * s, w: BUST_W * s, h: BUST_H * s };
}

function drawFigure(ctx, t, key, cx, cy, height, opts = {}) {
  const { alpha = 1, animate = true, seed = 5, rim = false } = opts;
  const img = images[key] || images.bust;
  const b = animate ? idle(t, { seed, bobAmp: 4 }) : { bobY: 0, breathe: 1, sway: 0 };
  const L = figureLayout(cx + b.sway, cy + b.bobY, height * b.breathe);
  if (rim) rimPulse(ctx, cx, cy, height * 0.8, t, { alpha: 0.12 * alpha });
  layer(ctx, alpha, () => ctx.drawImage(img, L.x, L.y, L.w, L.h));
  return L;
}

// A rounded frame that draws itself on, used for the channel opening.
function revealFrame(ctx, x, y, w, h, k, opts = {}) {
  const { color = C.cyan, width = 1.6, radius = 26, alpha = 1 } = opts;
  if (k <= 0) return;
  ctx.save();
  ctx.globalAlpha = clamp(alpha);
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.clip();
  ctx.beginPath();
  // The perimeter grows from the top-left corner.
  const total = 2 * (w + h);
  const drawn = total * clamp(k);
  const segs = [
    [x, y, x + w, y],
    [x + w, y, x + w, y + h],
    [x + w, y + h, x, y + h],
    [x, y + h, x, y],
  ];
  ctx.beginPath();
  let left = drawn;
  for (const [x1, y1, x2, y2] of segs) {
    if (left <= 0) break;
    const len = Math.hypot(x2 - x1, y2 - y1);
    const f = Math.min(1, left / len);
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + (x2 - x1) * f, y1 + (y2 - y1) * f);
    left -= len;
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.restore();
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------------------
// S01  0.000-3.873  chat / silhouette: a channel opens out of the dark
// ---------------------------------------------------------------------------
function s01(ctx, t, line, diag) {
  ground(ctx, t, [1240, 470], true);
  const f = sampleAt(t);
  const period = audio()?.period ?? 60 / 130;
  const phase0 = audio()?.phase ?? 0;

  dataColumns(ctx, t, {
    x: 80, y: 120, w: 1760, h: 800, columns: 20,
    alpha: 0.05 * (0.5 + 0.7 * f.lowEnv), focus: [1240, 470], speed: 14, size: 14,
  });

  // The character is only a dark shape at the right rear until the end.
  drawFigure(ctx, t, "silhouette", 1330, 520, 378, {
    alpha: 0.5 + 0.2 * at(t, P2.cues.frameConfirm, 2.6),
  });

  // The frame is confirmed: its perimeter draws itself over about half a second.
  const R = { x: 232, y: 168, w: 1456, h: 700 };
  revealFrame(ctx, R.x, R.y, R.w, R.h, phase(t, P2.cues.caretOn, P2.cues.frameConfirm), {
    color: C.edge, width: 1.4,
  });
  // Corner ticks land when the frame closes.
  const tick = at(t, P2.cues.frameConfirm, P2.cues.frameConfirm + 0.3);
  if (tick > 0) {
    const L = 42 * ease(tick);
    ctx.save();
    ctx.globalAlpha = tick;
    stroke(ctx, [[R.x + L, R.y], [R.x, R.y], [R.x, R.y + L]], C.cyan, 1.8);
    stroke(ctx, [[R.x + R.w - L, R.y + R.h], [R.x + R.w, R.y + R.h], [R.x + R.w, R.y + R.h - L]],
      C.cyan, 1.8);
    ctx.restore();
  }

  // Only a caret is lit at first.
  const caretK = at(t, P2.cues.caretOn, P2.cues.caretOn + 0.4);
  if (caretK > 0) {
    layer(ctx, caretK, () =>
      chatCaret(ctx, R.x + 66, R.y + R.h - 78, 22, t, { color: TOKENS.accentHot }),
    );
  }

  // A signal point arrives from the right along a shallow path.
  const signalRoute = route([[1560, 236], [1400, 300], [1120, 380], [880, 430]]);
  const arrive = at(t, P2.cues.caretOn, P2.cues.signalArrive);
  if (arrive > 0) {
    trace(ctx, signalRoute, arrive, C.white, 1.4, 0.22, Math.max(0, arrive - 0.2));
    const [sx, sy] = along(signalRoute, arrive);
    node(ctx, sx, sy, t, {
      r: 6, color: C.hot, alpha: clamp(0.5 + arrive), pulse: 0.4 + 0.6 * f.beatPulse,
    });
  }
  if (arrive >= 1) {
    const ack = at(t, P2.cues.signalArrive, P2.cues.signalArrive + 0.5);
    disc(ctx, 880, 430, 16 + ack * 62, C.cyan, 0.5 * (1 - ack), false, 2);
  }
  beatRings(ctx, 880, 430, t, {
    alpha: 0.18 * arrive, maxR: 180, period, phase: phase0, count: 2,
  });

  caption(ctx, line, t, { x: 146, y: 940, width: 1500, size: 56 }, diag);
  diag.channel = { frame: phase(t, P2.cues.caretOn, P2.cues.frameConfirm), arrive };
}

// ---------------------------------------------------------------------------
// S02  3.873-7.446  model interior: inputs join a coordinate system
// ---------------------------------------------------------------------------
function s02(ctx, t, line, diag) {
  ground(ctx, t, [1020, 470]);
  const f = sampleAt(t);
  const period = audio()?.period ?? 60 / 130;
  const phase0 = audio()?.phase ?? 0;

  nodeGrid(ctx, t, {
    alpha: 0.2 * (0.7 + 0.6 * f.lowEnv), step: 96,
    beatPulse: f.beatPulse, lowEnv: f.lowEnv, seed: 31,
  });
  dataColumns(ctx, t, {
    x: 60, y: 110, w: 1800, h: 820, columns: 26,
    alpha: 0.07 * (0.6 + 0.7 * f.lowEnv), focus: [1020, 470], speed: 20, size: 14,
  });

  const origin = [700, 560];
  // Axes draw themselves in first.
  const axes = at(t, 4.05, 5.0);
  layer(ctx, 0.4 * axes, () => {
    stroke(ctx, [[origin[0] - 240, origin[1]], [origin[0] + 660, origin[1]]], C.edge, 1);
    stroke(ctx, [[origin[0], origin[1] + 250], [origin[0], origin[1] - 300]], C.edge, 1);
  });

  // Nodes attach one at a time, each on a beat, each drawing its own edge in.
  const nodes = [
    [860, 470], [1010, 520], [1160, 445], [1310, 540], [1450, 460], [1180, 640],
  ];
  nodes.forEach((p, i) => {
    const start = P2.cues.firstNode + i * 0.36;
    const k = at(t, start, start + 0.42);
    if (k <= 0) return;
    const from = i === 0 ? origin : nodes[i - 1];
    layer(ctx, 0.5 * k, () =>
      stroke(ctx, [from, [mix(from[0], p[0], k), mix(from[1], p[1], k)]], C.cyan, 1.4),
    );
    node(ctx, p[0], p[1], t, {
      r: 5, color: i % 2 ? C.cyan : C.hot,
      alpha: k, pulse: 0.3 + 0.7 * f.beatPulse, seed: i,
    });
  });

  // The origin keeps radiating, so the shot is never still.
  node(ctx, origin[0], origin[1], t, { r: 8, color: C.hot, pulse: 0.4 + 0.6 * f.beatPulse });
  beatRings(ctx, origin[0], origin[1], t, {
    alpha: 0.24, maxR: 240, period, phase: phase0, count: 2,
  });

  const done = at(t, P2.cues.coordsDone, 7.3);
  if (done > 0)
    layer(ctx, done, () => type(ctx, "coordinate frame locked", 146, 200, 20, C.muted, "MV Sans"));

  caption(ctx, line, t, { x: 146, y: 940, width: 1580, size: 56 }, diag);
  diag.nodes = nodes.length;
}

// ---------------------------------------------------------------------------
// S03  7.446-11.095  chat / lowlight: the first parameters are filled in
// ---------------------------------------------------------------------------
function s03(ctx, t, line, diag) {
  ground(ctx, t, [1180, 480], true);
  const f = sampleAt(t);
  const period = audio()?.period ?? 60 / 130;
  const phase0 = audio()?.phase ?? 0;

  // Right-hand lowlight bust holds its pose.
  drawFigure(ctx, t, "lowlight", 1480, 520, 720, { alpha: 0.92 });

  const R = { x: 190, y: 158, w: 1000, h: 742 };
  const win = chatWindow(ctx, R, t, {
    title: "deepseek",
    subtitle: "/ world model",
    session: "SESSION 000",
    state: t < P2.cues.cardDone ? "busy" : "online",
    stateLabel: t < P2.cues.cardDone ? "configuring" : "online",
    sidebar: false,
    headerH: 96,
    enterAt: P2.cues.cardStart,
    enterDur: 0.5,
    footer: true,
    footerLabel: "PARAMETERS",
    clock: "00:0" + Math.floor(t) % 10,
  });
  const cx = R.x + 36;
  const cw = R.w - 72;

  // A parameter card whose fields fill one after another.
  const fields = [
    ["name", "deepseek"],
    ["role", "world model"],
    ["context", "211.96 s"],
    ["signal", "bidirectional"],
  ];
  const cardTop = R.y + 140;
  fields.forEach(([key, value], i) => {
    const start = P2.cues.cardStart + 0.3 + i * 0.55;
    const k = at(t, start, start + 0.34);
    if (k <= 0) return;
    const y = cardTop + i * 74;
    layer(ctx, k, () => {
      rect(ctx, cx, y, cw, 58, "#0d1c2c", 10, TOKENS.border1);
      type(ctx, key, cx + 20, y + 37, 17, TOKENS.labelTertiary, "MV Mono");
      if (k > 0.5) {
        const shown = typewriter(value, t, start + 0.12, 9);
        type(ctx, shown, cx + 200, y + 37, 20, TOKENS.labelPrimary, "MV Mono");
        if (shown.length < value.length)
          chatCaret(ctx, cx + 204 + shown.length * 12, y + 37 + 7, 20, t, {
            color: TOKENS.accent,
          });
      }
    });
    // Each field lands on its own beat ring.
    beatRings(ctx, cx + 12, y + 29, t, {
      alpha: 0.22 * k, maxR: 90, period, phase: phase0, count: 1,
    });
  });

  const done = at(t, P2.cues.cardDone, P2.cues.cardDone + 0.5);
  if (done > 0) {
    layer(ctx, done, () => {
      // The avatar lights up only once every field is in.
      disc(ctx, R.x + R.w - 74, R.y + 62, 26, C.hot, 0.16, false, 2);
      type(ctx, "ready", R.x + R.w - 130, R.y + 68, 16, C.hot, "MV Sans");
    });
  }

  caption(ctx, line, t, { x: 146, y: 940, width: 1600, size: 56 }, diag);
  diag.card = { ready: t >= P2.cues.cardDone, fields: fields.length, contentX: win.contentX };
}

// ---------------------------------------------------------------------------
// S04  11.095-16.000  model interior: two ports, first sonar
// ---------------------------------------------------------------------------
function s04(ctx, t, line, diag) {
  ground(ctx, t, [1060, 470]);
  const f = sampleAt(t);
  const period = audio()?.period ?? 60 / 130;
  const phase0 = audio()?.phase ?? 0;

  drawFigure(ctx, t, "silhouette", 1330, 520, 460, { alpha: 0.34 });

  nodeGrid(ctx, t, {
    alpha: 0.2 * (0.7 + 0.6 * f.lowEnv), step: 96,
    beatPulse: f.beatPulse, lowEnv: f.lowEnv, seed: 41,
  });
  dataColumns(ctx, t, {
    x: 60, y: 110, w: 1800, h: 820, columns: 30,
    alpha: 0.075 * (0.6 + 0.7 * f.lowEnv), focus: [1060, 470], speed: 22, size: 14,
  });

  const local = [520, 520];
  const remote = [1520, 430];
  const open = at(t, P2.cues.portsOpen, P2.cues.portsOpen + 0.45);
  layer(ctx, 0.35 * open, () =>
    stroke(ctx, [local, [760, 430], [1160, 470], remote], C.edge, 1),
  );

  node(ctx, local[0], local[1], t, { r: 9, color: C.hot, pulse: 0.4 + 0.6 * f.beatPulse });
  if (remote[0] > 0)
    layer(ctx, open, () => {
      // The far port is hollow: nothing has come back yet.
      disc(ctx, remote[0], remote[1], 12, C.white, 0.9, false, 2);
      disc(ctx, remote[0], remote[1], 22, C.white, 0.25 * (1 - open), false, 1.5);
    });

  // The sonar leaves the local port toward the right edge.
  const sonar = at(t, P2.cues.sonarGo, P2.cues.sonarGo + 1.6);
  if (sonar > 0) {
    const sonarRoute = route([local, [820, 470], [1200, 430], [1860, 400]]);
    trace(ctx, sonarRoute, sonar, C.cyan, 2.4, 0.7, Math.max(0, sonar - 0.2));
    const [sx, sy] = along(sonarRoute, sonar);
    if (sonar < 1)
      node(ctx, sx, sy, t, { r: 6, color: C.hot, alpha: 1, pulse: 0.3 + 0.7 * f.beatPulse });
  }
  beatRings(ctx, local[0], local[1], t, {
    alpha: 0.26, maxR: 300, period, phase: phase0, count: 2,
  });

  caption(ctx, line, t, { x: 146, y: 940, width: 1600, size: 56 }, diag);
  diag.ports = { open, sonar };
}

// ---------------------------------------------------------------------------
// S05  16.000-20.000  plate: the character is revealed
// ---------------------------------------------------------------------------
function s05(ctx, t, line, diag) {
  ground(ctx, t, [1320, 500], true);
  const f = sampleAt(t);
  const period = audio()?.period ?? 60 / 130;
  const phase0 = audio()?.phase ?? 0;

  dataColumns(ctx, t, {
    x: 80, y: 120, w: 1760, h: 800, columns: 18,
    alpha: 0.05 * (0.5 + 0.7 * f.lowEnv), focus: [1320, 500], speed: 13, size: 14,
  });

  // Same registration: the silhouette and the colour plate sit exactly on top of
  // each other, so the reveal is a change of ink and not a jump.
  const reveal = at(t, P2.cues.reveal, P2.cues.reveal + 0.85);
  const height = mix(760, 820, ease(reveal));
  drawFigure(ctx, t, "silhouette", 1320, 520, height, { alpha: 1 - reveal * 0.9 });
  drawFigure(ctx, t, "bust", 1320, 520, height, { alpha: reveal, rim: reveal > 0.2 });

  // The sea-foam headpiece develops last.
  const hp = at(t, P2.cues.headpiece, P2.cues.headpiece + 0.7);
  const L = figureLayout(1320, 520, height);
  if (hp > 0) {
    const L2 = figureLayout(1320, 520, height);
    layer(ctx, hp * 0.85, () => {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const hx = L2.x + 875 * L2.s;
      const hy = L2.y + 430 * L2.s;
      const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, 190 * L2.s * 8);
      g.addColorStop(0, "rgba(131,233,230,.55)");
      g.addColorStop(1, "rgba(131,233,230,0)");
      ctx.fillStyle = g;
      ctx.fillRect(hx - 260, hy - 260, 520, 520);
      ctx.restore();
    });
  }

  // A confirmation flash stops on the left and stays as a point.
  const flash = at(t, P2.cues.reveal + 0.2, P2.cues.reveal + 0.5);
  if (flash > 0) {
    disc(ctx, 420, 470, 30 + (1 - flash) * 70, C.hot, 0.5 * (1 - flash), false, 2);
    node(ctx, 420, 470, t, {
      r: 7, color: C.white, alpha: flash, pulse: 0.3 + 0.7 * f.beatPulse,
    });
  }
  beatRings(ctx, 1320, 500, t, {
    alpha: 0.16, maxR: 420, period, phase: phase0, count: 2,
  });

  caption(ctx, line, t, { x: 146, y: 235, width: 880, size: 56 }, diag);
  diag.reveal = { k: reveal, headpiece: hp, height };
}

// ---------------------------------------------------------------------------
// S06  20.000-29.709  chat / bust: the first message is written and sent
// ---------------------------------------------------------------------------
function s06(ctx, t, line, diag) {
  ground(ctx, t, [1180, 480]);
  const f = sampleAt(t);
  const period = audio()?.period ?? 60 / 130;
  const phase0 = audio()?.phase ?? 0;

  drawFigure(ctx, t, "bust", 1500, 540, 560, { alpha: 0.55, rim: true });

  // The camera pulls from the avatar out to the full window.
  const pull = ease(at(t, 20.0, 24.6));
  const R = {
    x: mix(560, 232, pull),
    y: mix(320, 168, pull),
    w: mix(800, 1456, pull),
    h: mix(420, 700, pull),
  };
  const win = chatWindow(ctx, R, t, {
    title: "deepseek",
    subtitle: "/ world model",
    session: "SESSION 001",
    state: t < P2.cues.waiting ? "busy" : "online",
    stateLabel: t < P2.cues.waiting ? "receiving" : "online",
    sidebar: false,
    headerH: 92,
    enterAt: 20.0,
    enterDur: 0.45,
    footer: true,
    footerLabel: "MODEL ACTIVE",
    clock: "00:" + String(Math.floor(t)).padStart(2, "0"),
  });
  const cx = win.contentX + 34;
  const cw = R.x + R.w - win.contentX - 68;

  // The user writes the first short message, character by character.
  const typed = "Can you hear me?";
  const shown = typewriter(typed, t, P2.cues.writeStart, 8.5);
  const sent = t >= P2.cues.sent;
  const composerY = R.y + R.h - 118;
  layer(ctx, 1 - (sent ? at(t, P2.cues.sent, P2.cues.sent + 0.35) : 0), () =>
    composer(ctx, cx, composerY, cw, t, {
      placeholder: "发消息，/ 调用指令",
      focused: true,
      typed,
      cps: 8.5,
      startedAt: P2.cues.writeStart,
      sendArmed: P2.cues.sent,
    }),
  );

  // After sending: the message lands in the thread and the agent starts waiting.
  if (sent) {
    messageRow(ctx, cx, R.y + 128, cw, t, P2.cues.sent, {
      side: "user", text: typed, size: 19, typed: false,
    });
  }
  reasoningRow(ctx, cx, R.y + 268, cw, t, {
    running: t < P2.cues.waiting,
    startedAt: P2.cues.sent,
    title: "思考",
    summary: t < P2.cues.waiting ? "receiving your signal" : "listening",
  });
  statsPill(ctx, cx, R.y + 330, [
    `${Math.max(1, Math.floor((t - 20) / 3))} 轮`,
    `缓存命中 0%`,
  ], t >= P2.cues.sent ? 1 : 0.5);

  // A send burst plus the message flying off toward the agent.
  if (sent) {
    const age = t - P2.cues.sent;
    const fly = clamp(age / 0.5);
    const r = route([[cx + cw - 46, composerY + 29], [cx + cw - 200, 380], [cx + 120, 340]]);
    trace(ctx, r, fly, C.hot, 2, 0.6 * (1 - fly));
  }
  beatRings(ctx, cx + 24, R.y + 286, t, {
    alpha: 0.16, maxR: 140, period, phase: phase0, count: 1,
  });

  caption(ctx, line, t, { x: 146, y: 940, width: 1620, size: 56 }, diag);
  diag.thread = { sent, shown: shown.length, pull };
  diag.stableWindow = [P2.cues.sent, P2.end];
}

const RENDERERS = [s01, s02, s03, s04, s05, s06];

export function renderP2(ctx, t, line, forceIndex = -1) {
  if (forceIndex < 0 && (t < P2.start || t >= P2.end)) return null;
  const i =
    forceIndex >= 0
      ? forceIndex
      : P2.shots.findIndex((v, n) => n < 6 && t >= v && t < P2.shots[n + 1]);
  if (i < 0 || i >= RENDERERS.length) return null;
  const diag = { time: t, shot: `S${String(1 + i).padStart(2, "0")}`, ready: !!images.bust };
  RENDERERS[i](ctx, t, line, diag);
  return diag;
}
