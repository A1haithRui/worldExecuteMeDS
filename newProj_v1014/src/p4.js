// Fourth segment: S28-S35, song time [95.465, 131.224).
//
// The story turns. The channel is handed over, the agent starts to drift, the
// far end stops answering, the character is left alone with an unsent message,
// the local side clears its unconfirmed cache, and the request for a reconnect
// is stopped at the window edge.
//
// The storyboard's note for this stretch is that emptiness comes from whitespace
// and from messages arriving further and further apart -- not from the music
// getting quieter, and not from deleting the agent's own identity. So these
// shots are deliberately sparser than the first three segments: fewer moving
// parts, longer holds, and the ambient layer turned down.
import {
  W, C, clamp, mix, phase, ease, out, at, layer, stroke, disc, rect, type,
  point, ground, caption, route, polyline, along, trace, loadImages,
} from "./mv-draw.js";
import {
  TOKENS, chatWindow, messageRow, reasoningRow, composer, statusDot, statsPill,
  contextRing, toolCard,
} from "./engine/chat.js";
import {
  node, nodeGrid, dataColumns, signalPath, waveform, beatRings,
} from "./engine/model.js";
import { spec, typewriter, drawWipeRows } from "./engine/type.js";
import { drawFigure, figureLayout } from "./engine/portrait.js";
import { sampleAt, audio } from "./engine/audio.js";

export const P4 = Object.freeze({
  start: 95.465,
  end: 131.224,
  shots: [95.465, 99.349, 103.489, 110.9, 114.92, 118.333, 121.728, 125.708, 131.224],
  cues: {
    swapStart: 96.2,
    swapDone: 97.4,
    handed: 98.2,
    cellsIn: 99.8,
    loopDrift: 100.5,
    settleBack: 102.6,
    typingOn: 104.2,
    echo1: 106.4,
    echo2: 108.3,
    almostClosed: 110.221,
    remoteOut: 111.3,
    waiting: 112.2,
    attachShown: 113.4,
    profileShrink: 115.4,
    clearStart: 119.0,
    slotFull: 121.1,
    eyeCut: 124.89,
    requestGo: 127.2,
    blocked: 129.0,
  },
});

const { images, ready } = loadImages({
  bust: "/assets/character/deepseek_bust_v3.png",
  silhouette: "/assets/character/v4/deepseek_bust_v4_silhouette.png",
  profile: "/assets/character/deepseek_profile_v3.png",
  lowlight: "/assets/character/v4/deepseek_bust_v4_lowlight.png",
  eye: "/assets/character/deepseek_eye_v3.png",
  reach: "/assets/character/deepseek_reach_v3.png",
});
export const p4Ready = ready;

function fig(ctx, t, key, cx, cy, height, opts) {
  return drawFigure(ctx, t, images, key, cx, cy, height, opts);
}

// Bouncing "typing" dots, as the client draws them.
function typingDots(ctx, x, y, t, opts = {}) {
  const { alpha = 1, color = TOKENS.labelTertiary, r = 4, gap = 15 } = opts;
  ctx.save();
  ctx.globalAlpha = alpha;
  for (let i = 0; i < 3; i++) {
    const ph = i * 0.22;
    const bounce = Math.max(0, Math.sin((t * 2.4 - ph) * Math.PI)) * 5;
    ctx.beginPath();
    ctx.arc(x + i * gap, y - bounce, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha * (0.45 + 0.55 * (1 - bounce / 5));
    ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// S28  95.465-99.349  chat: the two labels, and the arrows are swapped
// ---------------------------------------------------------------------------
function s28(ctx, t, line, diag) {
  ground(ctx, t, [1100, 490], true);
  const f = sampleAt(t);
  const period = audio()?.period ?? 60 / 130;
  const phase0 = audio()?.phase ?? 0;

  dataColumns(ctx, t, {
    x: 80, y: 120, w: 1760, h: 800, columns: 22,
    alpha: 0.055 * (0.5 + 0.7 * f.lowEnv), focus: [1100, 490], speed: 15, size: 14,
  });

  const R = { x: 240, y: 180, w: 1440, h: 700 };
  chatWindow(ctx, R, t, {
    title: "deepseek",
    subtitle: "/ routing",
    session: "HANDOFF",
    state: t >= P4.cues.handed ? "busy" : "online",
    stateLabel: t >= P4.cues.handed ? "handing over" : "online",
    sidebar: false,
    headerH: 92,
    enterAt: 95.465,
    enterDur: 0.4,
    footer: true,
    footerLabel: "ROUTE",
  });

  // Two labels standing in for the two ends.
  const A = [R.x + 330, R.y + 380];
  const B = [R.x + 1110, R.y + 380];
  [["F", A], ["M", B]].forEach(([ch, p], i) => {
    const k = at(t, 95.465 + 0.25 + i * 0.22, 95.465 + 0.7 + i * 0.22);
    layer(ctx, k, () => {
      disc(ctx, p[0], p[1], 62, "#0d1c2c", 1, false, 2);
      type(ctx, ch, p[0], p[1] + 20, 52, i === 0 ? C.hot : C.white, "MV Serif", "center");
      type(ctx, i === 0 ? "this side" : "far side", p[0], p[1] + 96, 17, C.muted, "MV Sans", "center");
    });
    node(ctx, p[0], p[1], t, {
      r: 5, color: i === 0 ? C.hot : C.white, pulse: 0.3 + 0.7 * f.beatPulse,
    });
  });

  // The two send/receive arrows swap places.
  const swap = ease(at(t, P4.cues.swapStart, P4.cues.swapDone));
  const yOut = mix(A[1] - 74, B[1] + 46, swap);
  const yBack = mix(B[1] + 46, A[1] - 74, swap);
  const drawArrow = (y, dir, color, alpha) => {
    if (alpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round";
    const x0 = A[0] + 76;
    const x1 = B[0] - 76;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
    ctx.stroke();
    const tip = dir > 0 ? x1 : x0;
    ctx.beginPath();
    ctx.moveTo(tip, y);
    ctx.lineTo(tip - dir * 16, y - 9);
    ctx.lineTo(tip - dir * 16, y + 9);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  };
  drawArrow(yOut, 1, C.cyan, 0.9);
  drawArrow(yBack, -1, C.white, 0.7);
  if (swap > 0 && swap < 1) {
    // A brief cross-fade at the midpoint, so the swap is legible.
    const k = Math.sin(Math.PI * swap);
    disc(ctx, 760, (yOut + yBack) / 2, 30 * k, C.hot, 0.4 * k, false, 2);
  }
  const handed = at(t, P4.cues.handed, P4.cues.handed + 0.5);
  if (handed > 0)
    layer(ctx, handed, () =>
      type(ctx, "channel handed to the far side", R.x + 40, R.y + R.h - 46, 19, C.hot, "MV Sans"),
    );
  beatRings(ctx, 760, 380, t, { alpha: 0.14, maxR: 220, period, phase: phase0, count: 2 });

  caption(ctx, line, t, { x: 146, y: 940, width: 1620, size: 56 }, diag);
  diag.swap = swap;
}

// ---------------------------------------------------------------------------
// S29  99.349-103.489  model: three status cells, then back to the original
// ---------------------------------------------------------------------------
function s29(ctx, t, line, diag) {
  ground(ctx, t, [1040, 500]);
  const f = sampleAt(t);
  const period = audio()?.period ?? 60 / 130;
  const phase0 = audio()?.phase ?? 0;

  nodeGrid(ctx, t, {
    alpha: 0.15 * (0.7 + 0.6 * f.lowEnv), step: 104,
    beatPulse: f.beatPulse, lowEnv: f.lowEnv, seed: 91,
  });
  dataColumns(ctx, t, {
    x: 60, y: 110, w: 1800, h: 820, columns: 24,
    alpha: 0.06 * (0.6 + 0.7 * f.lowEnv), focus: [1040, 500], speed: 17, size: 14,
  });

  // Three side-by-side status cells holding the same identity as thumbnails.
  const cells = [
    { x: 300, y: 300, w: 380, h: 440, label: "current", key: "bust" },
    { x: 770, y: 300, w: 380, h: 440, label: "alt / preview", key: "silhouette" },
    { x: 1240, y: 300, w: 380, h: 440, label: "current", key: "bust" },
  ];
  const settle = ease(at(t, P4.cues.settleBack, P4.cues.loopDrift + 1.6));
  cells.forEach((c, i) => {
    const k = at(t, P4.cues.cellsIn + i * 0.2, P4.cues.cellsIn + i * 0.2 + 0.5);
    if (k <= 0) return;
    // After 100.5s the whole group drifts slowly and then holds the original.
    const drift = (1 - settle) * Math.sin((t - P4.cues.loopDrift) * 0.5 + i * 0.7) * 6;
    layer(ctx, k, () => {
      rect(ctx, c.x, c.y + drift, c.w, c.h, "#0b1a2a", 16, i === 1 ? TOKENS.border2 : TOKENS.border1);
      type(ctx, `0${i + 1}`, c.x + 22, c.y + 40 + drift, 18, TOKENS.labelCaption, "MV Mono");
      type(ctx, c.label, c.x + c.w - 22, c.y + 40 + drift, 16,
        i === 1 ? C.muted : C.hot, "MV Sans", "right");
      // A small snapshot in each cell, all the same identity.
      const h = 300 - (i === 1 ? 40 : 0);
      drawFigure(ctx, t, images, i === 1 ? "silhouette" : "bust",
        c.x + c.w / 2, c.y + c.h / 2 + 20 + drift, h, {
          alpha: i === 1 ? 0.55 : 0.95, animate: true, seed: 20 + i, rim: i !== 1,
        });
    });
  });

  // The route loop runs through all three.
  const loop = polyline([
    [400, 800], [560, 880], [1040, 900], [1520, 880], [1520, 760], [1040, 740], [560, 760],
  ], true);
  trace(ctx, loop, 1, C.edge, 1.6, 0.5);
  signalPath(ctx, loop, t, along, {
    packets: 3, speed: 0.16, color: C.cyan, packetColor: C.hot,
    baseAlpha: 0, width: 2.4, packetR: 5, beatPulse: f.beatPulse,
  });
  const preview = t < P4.cues.settleBack;
  layer(ctx, at(t, P4.cues.settleBack, P4.cues.settleBack + 0.5), () =>
    type(ctx, "preview closed", 1040, 172, 20, C.muted, "MV Sans", "center"),
  );
  beatRings(ctx, 1040, 760, t, { alpha: 0.16, maxR: 200, period, phase: phase0, count: 2 });

  caption(ctx, line, t, { x: 146, y: 940, width: 1620, size: 56 }, diag);
  diag.cells = { count: cells.length, preview, settle };
}

// ---------------------------------------------------------------------------
// S30  103.489-110.900  chat: the far end types, answers are faint, the loop
// never closes
// ---------------------------------------------------------------------------
function s30(ctx, t, line, diag) {
  ground(ctx, t, [1150, 500], true);
  const f = sampleAt(t);
  const period = audio()?.period ?? 60 / 130;
  const phase0 = audio()?.phase ?? 0;

  dataColumns(ctx, t, {
    x: 80, y: 120, w: 1760, h: 800, columns: 18,
    alpha: 0.045 * (0.5 + 0.7 * f.lowEnv), focus: [1150, 500], speed: 12, size: 14,
  });

  const R = { x: 260, y: 170, w: 1400, h: 720 };
  const win = chatWindow(ctx, R, t, {
    title: "deepseek",
    subtitle: "/ world model",
    session: "SESSION 001",
    state: "busy",
    stateLabel: "waiting for confirmation",
    sidebar: true,
    sidebarW: 220,
    headerH: 92,
    enterAt: 103.489,
    enterDur: 0.4,
    footer: true,
    footerLabel: "MODEL ACTIVE",
    clock: "01:" + String(Math.floor(t - 60)).padStart(2, "0"),
  });
  const cx = win.contentX + 36;
  const cw = R.x + R.w - win.contentX - 72;

  // The messages arrive further and further apart.
  const rows = [
    { at: P4.cues.typingOn, text: "are you still there", side: "user" },
    { at: P4.cues.echo1, text: "I am here", side: "agent" },
    { at: P4.cues.echo2, text: "can you hear me", side: "user" },
  ];
  let y = R.y + 140;
  rows.forEach((r) => {
    if (t < r.at) return;
    const m = messageRow(ctx, cx, y, cw, t, r.at, {
      side: r.side, text: r.text, size: 18,
      alpha: r.side === "agent" ? 0.62 : 1,
      name: "DeepSeek",
    });
    y += m.height + 26;
  });

  // The far end's typing indicator sits where the next reply should be.
  if (t >= P4.cues.typingOn) {
    const k = at(t, P4.cues.echo1 + 0.5, P4.cues.echo1 + 1.4);
    if (k > 0 && t < P4.cues.echo2 + 1.2)
      layer(ctx, k * 0.8, () => typingDots(ctx, cx + 56, y + 14, t, { color: TOKENS.accent }));
  }

  // The loop almost closes and then stalls just short of the far end.
  const loop = route([
    [cx + 40, R.y + R.h - 180], [cx + 240, R.y + R.h - 300],
    [cx + cw - 260, R.y + R.h - 300], [cx + cw - 90, R.y + R.h - 180],
  ]);
  const close = ease(at(t, P4.cues.echo2, P4.cues.almostClosed));
  trace(ctx, loop, 1, C.edge, 1.4, 0.45);
  trace(ctx, loop, Math.min(close, 0.94), C.cyan, 2.6, 0.8);
  const gapLeft = 1 - Math.min(close, 0.94);
  if (gapLeft > 0.01) {
    const [gx, gy] = along(loop, 0.94);
    disc(ctx, gx, gy, 10 + gapLeft * 26, C.hot, 0.5 * (0.4 + gapLeft), false, 2);
    layer(ctx, at(t, P4.cues.almostClosed - 0.6, P4.cues.almostClosed + 0.3), () =>
      type(ctx, "no confirmation", gx + 84, gy - 6, 18, C.muted, "MV Sans"),
    );
  }
  beatRings(ctx, cx + cw - 90, R.y + R.h - 180, t, {
    alpha: 0.12, maxR: 160, period, phase: phase0, count: 2,
  });

  caption(ctx, line, t, { x: 146, y: 940, width: 1620, size: 56 }, diag);
  diag.loop = { close, gap: gapLeft };
}

// ---------------------------------------------------------------------------
// S31  110.900-114.920  chat: the light goes out; the reach stays unsent
// ---------------------------------------------------------------------------
function s31(ctx, t, line, diag) {
  ground(ctx, t, [1100, 500], true);
  const f = sampleAt(t);
  const period = audio()?.period ?? 60 / 130;
  const phase0 = audio()?.phase ?? 0;

  dataColumns(ctx, t, {
    x: 80, y: 120, w: 1760, h: 800, columns: 16,
    alpha: 0.04 * (0.5 + 0.7 * f.lowEnv), focus: [1100, 500], speed: 11, size: 14,
  });

  const R = { x: 230, y: 170, w: 1460, h: 720 };
  chatWindow(ctx, R, t, {
    title: "deepseek",
    subtitle: "/ world model",
    session: "SESSION 001",
    state: t < P4.cues.waiting ? "warn" : "idle",
    stateLabel: t < P4.cues.waiting ? "far end dimming" : "waiting",
    sidebar: false,
    headerH: 92,
    enterAt: 110.9,
    enterDur: 0.35,
    footer: true,
    footerLabel: "NO INPUT",
  });

  // The far light goes out, and nothing replaces it.
  const out_ = at(t, P4.cues.remoteOut, P4.cues.remoteOut + 0.6);
  const lampX = R.x + R.w - 150;
  const lampY = R.y + 220;
  layer(ctx, 1, () => {
    disc(ctx, lampX, lampY, 26, C.white, (1 - out_) * 0.5, false, 2);
    if (out_ < 1) disc(ctx, lampX, lampY, 14 * (1 - out_ * 0.6), C.white, 0.8 * (1 - out_));
    else {
      disc(ctx, lampX, lampY, 12, C.muted, 0.9, false, 1.6);
      type(ctx, "offline", lampX, lampY + 44, 17, C.muted, "MV Sans", "center");
    }
  });

  // The empty thread keeps its whitespace.
  messageRow(ctx, R.x + 120, R.y + 170, R.w - 240, t, 110.9, {
    side: "user", text: "are you still there", size: 18, alpha: 0.5,
  });
  type(ctx, "no reply yet", R.x + 120, R.y + 320, 18, C.muted, "MV Sans");
  typingDots(ctx, R.x + 120, R.y + 360, t, { color: TOKENS.labelCaption, alpha: 0.5 });

  // The reach image survives only as an attachment that was never sent.
  const shown = at(t, P4.cues.attachShown, P4.cues.attachShown + 0.5);
  if (shown > 0) {
    const ax = R.x + R.w - 400;
    const ay = R.y + R.h - 300;
    layer(ctx, shown, () => {
      rect(ctx, ax, ay, 320, 230, "#0b1a2a", 14, TOKENS.border1);
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.drawImage(images.reach, ax + 30, ay + 16, 260, 165);
      ctx.restore();
      type(ctx, "not sent", ax + 20, ay + 212, 17, TOKENS.labelCaption, "MV Mono");
      // The send affordance is struck through.
      stroke(ctx, [[ax + 232, ay + 204], [ax + 300, ay + 204]], TOKENS.labelCaption, 1.6);
    });
    beatRings(ctx, ax + 160, ay + 115, t, {
      alpha: 0.1 * shown, maxR: 150, period, phase: phase0, count: 1,
    });
  }

  caption(ctx, line, t, { x: 146, y: 940, width: 1620, size: 56 }, diag);
  diag.unsent = { shown, offline: out_ >= 1 };
}

// ---------------------------------------------------------------------------
// S32  114.920-118.333  plate: she is left facing an answer that never arrives
// ---------------------------------------------------------------------------
function s32(ctx, t, line, diag) {
  ground(ctx, t, [1300, 500], true);
  const f = sampleAt(t);
  const period = audio()?.period ?? 60 / 130;
  const phase0 = audio()?.phase ?? 0;

  dataColumns(ctx, t, {
    x: 80, y: 120, w: 1760, h: 800, columns: 14,
    alpha: 0.038 * (0.5 + 0.7 * f.lowEnv), focus: [1300, 500], speed: 10, size: 14,
  });

  // She pulls back from 55% to 24% of frame height, and does not turn.
  const shrink = ease(at(t, 114.92, P4.cues.profileShrink + 1.6));
  const h = mix(594, 259, shrink);
  fig(ctx, t, "profile", mix(1260, 1420, shrink), 520, h, { alpha: 0.92, seed: 23 });

  // One path on the left that never gets an answer back.
  const p = route([[150, 430], [420, 380], [760, 470], [980, 470]]);
  trace(ctx, p, 1, C.edge, 1.6, 0.4);
  signalPath(ctx, p, t, along, {
    packets: 2, speed: 0.22, color: C.cyan, packetColor: C.hot,
    baseAlpha: 0, width: 2.2, packetR: 4, beatPulse: f.beatPulse,
  });
  // Nothing comes back along the return leg.
  const back = route([[980, 470], [760, 560], [420, 470], [150, 520]]);
  trace(ctx, back, 1, C.muted, 1.4, 0.22);
  layer(ctx, 0.8, () => {
    const [ex, ey] = along(back, 0.06);
    disc(ctx, ex, ey, 8, C.muted, 0.8, false, 1.6);
  });
  beatRings(ctx, 980, 470, t, { alpha: 0.12, maxR: 240, period, phase: phase0, count: 2 });

  caption(ctx, line, t, { x: 146, y: 940, width: 900, size: 56 }, diag);
  diag.profile = { height: h, shrink };
}

// ---------------------------------------------------------------------------
// S33  118.333-121.728  model: the unconfirmed cache is pulled off the path
// ---------------------------------------------------------------------------
function s33(ctx, t, line, diag) {
  ground(ctx, t, [1060, 500]);
  const f = sampleAt(t);

  nodeGrid(ctx, t, {
    alpha: 0.14 * (0.7 + 0.6 * f.lowEnv), step: 104,
    beatPulse: f.beatPulse, lowEnv: f.lowEnv, seed: 101,
  });

  // A path with fragments on it; they are withdrawn one by one into a slot.
  const p = route([[200, 520], [620, 430], [1080, 470], [1560, 420]]);
  trace(ctx, p, 1, C.edge, 1.6, 0.5);
  const slot = { x: 1560, y: 620, w: 260, h: 150 };
  const clearK = ease(at(t, P4.cues.clearStart, P4.cues.slotFull));
  const N = 7;
  for (let i = 0; i < N; i++) {
    const u = 0.1 + (i / (N - 1)) * 0.78;
    const [px, py] = along(p, u);
    const removed = clamp((clearK - i / N) * N);
    const tx = mix(px, slot.x + 40 + (i % 4) * 46, ease(removed));
    const ty = mix(py, slot.y + 40 + Math.floor(i / 4) * 48, ease(removed));
    const a = 1 - removed * 0.75;
    layer(ctx, a, () => {
      rect(ctx, tx - 7, ty - 5, 14, 10, removed > 0.6 ? C.muted : C.hot, 2);
    });
  }
  // The slot itself, filling and then left empty again.
  layer(ctx, 0.9, () => {
    rect(ctx, slot.x, slot.y, slot.w, slot.h, "#0b1a2a", 12,
      clearK > 0.9 ? TOKENS.border2 : TOKENS.border1);
    type(ctx, "unconfirmed", slot.x + 16, slot.y + 30, 16, TOKENS.labelCaption, "MV Mono");
  });
  const drift = at(t, P4.cues.slotFull, P4.cues.slotFull + 0.7);
  if (drift > 0) {
    // The far coordinate is never deleted.
    layer(ctx, drift, () => {
      const [rx, ry] = [1560, 300];
      disc(ctx, rx, ry, 10, C.white, 0.7, false, 2);
      type(ctx, "far side: kept", rx - 20, ry - 40, 17, C.muted, "MV Sans", "right");
    });
  }
  signalPath(ctx, p, t, along, {
    packets: 2, speed: -0.24, color: C.cyan, packetColor: C.muted,
    baseAlpha: 0, width: 2, packetR: 4, beatPulse: f.beatPulse,
  });
  beatRings(ctx, 1080, 470, t, {
    alpha: 0.14, maxR: 220, period: audio()?.period ?? 60 / 130,
    phase: audio()?.phase ?? 0, count: 2,
  });

  caption(ctx, line, t, { x: 146, y: 940, width: 1580, size: 56 }, diag);
  diag.cache = { clearK, removed: Math.round(clearK * N) };
}

// ---------------------------------------------------------------------------
// S34  121.728-125.708  plate: lowlight, then the first eye close-up at 124.890
// ---------------------------------------------------------------------------
function s34(ctx, t, line, diag) {
  ground(ctx, t, [1160, 500], true);
  const f = sampleAt(t);
  const period = audio()?.period ?? 60 / 130;
  const phase0 = audio()?.phase ?? 0;

  const eyeIn = t >= P4.cues.eyeCut;
  if (!eyeIn) {
    dataColumns(ctx, t, {
      x: 80, y: 120, w: 1760, h: 800, columns: 14,
      alpha: 0.04 * (0.5 + 0.7 * f.lowEnv), focus: [1160, 500], speed: 11, size: 14,
    });
    // Lowlit front, right half; the left keeps only an echoless path.
    fig(ctx, t, "lowlight", 1290, 520, 700, { alpha: 0.95, seed: 29, rim: true, rimAlpha: 0.08 });
    const p = route([[130, 480], [380, 430], [640, 500], [860, 500]]);
    trace(ctx, p, 1, C.edge, 1.6, 0.35);
    signalPath(ctx, p, t, along, {
      packets: 1, speed: 0.18, color: C.cyan, packetColor: C.cyan,
      baseAlpha: 0, width: 2, packetR: 4, beatPulse: f.beatPulse,
    });
    const [ex, ey] = along(p, 1);
    disc(ctx, ex, ey, 10, C.muted, 0.8, false, 1.6);
    type(ctx, "no echo", 170, 420, 18, C.muted, "MV Sans");
  } else {
    // The first eye close-up. The eye plate is never mirrored.
    const k = at(t, P4.cues.eyeCut, P4.cues.eyeCut + 0.28);
    layer(ctx, k, () => {
      const w = 1500;
      const s = w / images.eye.naturalWidth;
      const dx = 1120 - (images.eye.naturalWidth / 2) * s;
      const dy = 470 - (images.eye.naturalHeight / 2) * s;
      ctx.drawImage(images.eye, dx, dy, images.eye.naturalWidth * s, images.eye.naturalHeight * s);
    });
    // A single cyan point inside the eye, matching the next shot's target.
    const dot = at(t, P4.cues.eyeCut + 0.2, P4.cues.eyeCut + 0.9);
    node(ctx, 1120, 430, t, {
      r: 6, color: C.hot, alpha: dot, pulse: 0.3 + 0.7 * f.beatPulse,
    });
    beatRings(ctx, 1120, 430, t, { alpha: 0.14, maxR: 220, period, phase: phase0, count: 2 });
  }

  const upper = eyeIn ? { x: 146, y: 220, width: 900, size: 56 } : { x: 146, y: 940, width: 900, size: 56 };
  caption(ctx, line, t, upper, diag);
  diag.eye = { cut: eyeIn };
}

// ---------------------------------------------------------------------------
// S35  125.708-131.224  chat: the request is stopped at the window edge
// ---------------------------------------------------------------------------
function s35(ctx, t, line, diag) {
  ground(ctx, t, [1080, 500], true);
  const f = sampleAt(t);
  const period = audio()?.period ?? 60 / 130;
  const phase0 = audio()?.phase ?? 0;

  const R = { x: 220, y: 160, w: 1480, h: 740 };
  const win = chatWindow(ctx, R, t, {
    title: "deepseek",
    subtitle: "/ world model",
    session: "SESSION 001",
    state: t < P4.cues.blocked ? "busy" : "warn",
    stateLabel: t < P4.cues.blocked ? "reconnecting" : "blocked",
    sidebar: true,
    sidebarW: 220,
    headerH: 92,
    enterAt: 125.708,
    enterDur: 0.35,
    footer: true,
    footerLabel: "LOCAL ONLY",
  });
  const cx = win.contentX + 36;
  const cw = R.x + R.w - win.contentX - 72;

  // The thread is empty, and stays empty.
  layer(ctx, 0.55, () =>
    type(ctx, "no messages since the far end went quiet", cx, R.y + 168, 18, C.muted, "MV Sans"),
  );
  const dotsK = at(t, 125.708, 126.4);
  if (dotsK > 0 && t < P4.cues.requestGo)
    layer(ctx, dotsK * 0.6, () => typingDots(ctx, cx + 56, R.y + 220, t, { color: TOKENS.labelCaption }));

  // The reconnect request travels right and is stopped by the window edge.
  const go = at(t, P4.cues.requestGo, P4.cues.requestGo + 1.4);
  if (go > 0) {
    const edgeX = R.x + R.w - 58;
    const r = route([[cx + 120, R.y + 300], [cx + 420, R.y + 280], [edgeX - 200, R.y + 300], [edgeX, R.y + 300]]);
    const travel = clamp(go / 0.72);
    trace(ctx, r, Math.min(travel, 1), C.cyan, 2.4, 0.8);
    const [px, py] = along(r, Math.min(travel, 1));
    if (travel < 1)
      node(ctx, px, py, t, { r: 6, color: C.hot, pulse: 0.3 + 0.7 * f.beatPulse });
    else {
      // Stopped: the request piles up against the boundary.
      const block = at(t, P4.cues.blocked, P4.cues.blocked + 0.5);
      node(ctx, edgeX, py, t, { r: 7, color: C.hot, pulse: 0.3 + 0.7 * f.beatPulse });
      disc(ctx, edgeX, py, 16 + block * 44, C.hot, 0.5 * (1 - block), false, 2);
      layer(ctx, at(t, P4.cues.blocked - 0.3, P4.cues.blocked + 0.4), () =>
        type(ctx, "no route past the window edge", edgeX - 30, py - 44, 18, C.muted, "MV Sans", "right"),
      );
    }
  }
  beatRings(ctx, R.x + R.w - 58, R.y + 300, t, {
    alpha: 0.12, maxR: 180, period, phase: phase0, count: 2,
  });

  caption(ctx, line, t, { x: 146, y: 940, width: 1620, size: 56 }, diag);
  diag.request = { go, blocked: t >= P4.cues.blocked };
}

const RENDERERS = [s28, s29, s30, s31, s32, s33, s34, s35];

export function renderP4(ctx, t, line, forceIndex = -1) {
  if (forceIndex < 0 && (t < P4.start || t >= P4.end)) return null;
  const i =
    forceIndex >= 0
      ? forceIndex
      : P4.shots.findIndex((v, n) => n < 8 && t >= v && t < P4.shots[n + 1]);
  if (i < 0 || i >= RENDERERS.length) return null;
  const diag = { time: t, shot: `S${String(28 + i).padStart(2, "0")}`, ready: !!images.bust };
  RENDERERS[i](ctx, t, line, diag);
  return diag;
}
