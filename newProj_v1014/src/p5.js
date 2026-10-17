// Fifth segment: S36-S43, song time [131.224, 162.805).
//
// The failure section. A rejected path enters the internal routing graph, the
// first fault red appears on the out-of-bounds port only, three failure queues
// squeeze inward, the local side queues automatic reconnects, twelve calls
// advance around a sonar ring, six probes all land on the same empty endpoint,
// and the path leaves a vertical light in front of her eye.
//
// Storyboard rules this segment has to respect:
//  * fault red marks the out-of-bounds port and local fault edges; it is never
//    painted across the whole screen;
//  * the twelve-call stretch is one advancing ring, not twelve new compositions;
//  * the six probes are in-shot events, not six full-screen cards.
import {
  W, C, clamp, mix, phase, ease, out, at, layer, stroke, disc, rect, type,
  point, ground, caption, route, polyline, along, trace, loadImages,
} from "./mv-draw.js";
import {
  TOKENS, chatWindow, messageRow, reasoningRow, composer, statusDot, statsPill,
} from "./engine/chat.js";
import {
  node, nodeGrid, dataColumns, signalPath, waveform, beatRings,
} from "./engine/model.js";
import { spec, typewriter } from "./engine/type.js";
import { drawFigure } from "./engine/portrait.js";
import { sampleAt, audio, onsetPulses } from "./engine/audio.js";

export const P5 = Object.freeze({
  start: 131.224,
  end: 162.805,
  shots: [131.224, 135.224, 143.421, 148.036, 151.728, 155.421, 159.113, 161.882, 162.805],
  cues: {
    reject: 131.7,
    redPort: 132.6,
    detour: 133.3,
    queuesIn: 136.0,
    queuesTight: 141.0,
    countdownFrom: 143.8,
    sendToPort: 147.2,
    ringStart: 148.4,
    callEvery: 0.923077, // two beats at 130 BPM, per the storyboard grid
    secondRing: 152.0,
    // `compress` and `portSeal` used to be independent time cues. They are now
    // derived from the call counter's own grid (callTime(9) and callTime(12)),
    // so they cannot disagree with the number of completed calls.
    probesStart: 159.3,
    probeEvery: 0.35,
    waterLight: 162.0,
  },
  eyeWidth: 1050,
});

// ---------------------------------------------------------------------------
// The twelve reconnect calls, as one counter derived from song time alone.
//
// S39, S40 and S41 all read this, so the marks cannot disagree between shots:
// call n completes at ringStart + (n-1) * callEvery, which is the two-beat grid
// the sequence was designed on.
// ---------------------------------------------------------------------------
const CALLS_TOTAL = 12;
const callTime = (n) => P5.cues.ringStart + (n - 1) * P5.cues.callEvery;
// A call counts as done on the frame nearest its completion instant, so a time
// rounded to three decimals (149.323 rather than 149.323077) still reads as the
// call it belongs to. Without the half-frame tolerance the acceptance times in
// docs/dsh-fix-round1-prompt.md each fall a hair early and report the previous
// count. The tolerance is half a frame at 60fps and cannot move a marker by a
// whole frame.
const FRAME = 1 / 60;
const callsDone = (t) =>
  Math.min(
    CALLS_TOTAL,
    Math.max(
      0,
      Math.floor((t + FRAME / 2 - P5.cues.ringStart) / P5.cues.callEvery) + 1,
    ),
  );

/**
 * Draw exactly the completed calls: one marker per call, never a batch.
 * `slots` must hold CALLS_TOTAL entries of { x, y, failure }. Returns the number
 * of markers drawn, which is always callsDone(t) -- the acceptance check reads
 * it from diag rather than counting pixels.
 */
function drawCallMarkers(ctx, slots, done, opts = {}) {
  const { failureColor = C.danger, pendingAlpha = 0.3, size = 8 } = opts;
  let drawn = 0;
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i];
    const complete = i < done;
    if (complete) drawn++;
    layer(ctx, complete ? 0.92 : pendingAlpha, () => {
      if (!complete) {
        disc(ctx, s.x, s.y, 4.5, C.edge, 0.9);
        return;
      }
      if (s.failure) {
        // Fault red only on the failed cell itself.
        disc(ctx, s.x, s.y, size, failureColor, 0.95, false, 1.8);
        stroke(ctx, [[s.x - 5, s.y], [s.x + 5, s.y]], failureColor, 1.6);
      } else {
        // The first four show only that the return path is missing: hollow, no red.
        disc(ctx, s.x, s.y, size, C.muted, 0.9, false, 1.8);
        stroke(ctx, [[s.x - 4, s.y - 4], [s.x + 4, s.y + 4]], C.muted, 1.6);
      }
    });
  }
  return drawn;
}

const ringPoint = (cx, cy, r, i, n) => {
  const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
  return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
};

const { images, ready } = loadImages({
  bust: "/assets/character/deepseek_bust_v3.png",
  silhouette: "/assets/character/v4/deepseek_bust_v4_silhouette.png",
  eye: "/assets/character/deepseek_eye_v3.png",
});
export const p5Ready = ready;

const CIRCLE = (r, cx, cy, n = 64) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });

// ---------------------------------------------------------------------------
// S36  131.224-135.224  model: the rejected path, first fault red
// ---------------------------------------------------------------------------
function s36(ctx, t, line, diag) {
  ground(ctx, t, [1060, 500]);
  const f = sampleAt(t);
  const period = audio()?.period ?? 60 / 130;
  const phase0 = audio()?.phase ?? 0;

  nodeGrid(ctx, t, {
    alpha: 0.17 * (0.7 + 0.6 * f.lowEnv), step: 96,
    beatPulse: f.beatPulse, lowEnv: f.lowEnv, seed: 111,
  });
  dataColumns(ctx, t, {
    x: 60, y: 110, w: 1800, h: 820, columns: 26,
    alpha: 0.07 * (0.6 + 0.7 * f.lowEnv), focus: [1060, 500], speed: 20, size: 14,
  });

  const origin = [420, 560];
  const port = [1480, 470];
  const boundaryX = 1240;

  // The working path up to the boundary.
  const main = route([origin, [760, 440], [1080, 500], port]);
  trace(ctx, main, 1, C.cyan, 2, 0.4);
  signalPath(ctx, main, t, along, {
    packets: 2, speed: 0.34, color: C.cyan, packetColor: C.hot,
    baseAlpha: 0, width: 2.4, packetR: 4.5, beatPulse: f.beatPulse,
  });

  // The boundary of what this end is allowed to reach.
  const bK = at(t, P5.cues.reject, P5.cues.reject + 0.6);
  if (bK > 0) {
    layer(ctx, 0.75 * bK, () => {
      stroke(ctx, [[boundaryX, 150], [boundaryX, 900]], C.edge, 1.6);
      for (let i = 0; i < 10; i++) {
        const y = 180 + i * 74;
        stroke(ctx, [[boundaryX, y], [boundaryX - 12, y]], C.edge, 1.2);
      }
    });
  }

  // The rejected crossing: the line reaches past the boundary and is cut.
  const rej = at(t, P5.cues.reject, P5.cues.reject + 0.8);
  if (rej > 0) {
    const cross = route([[boundaryX - 120, 500], [boundaryX + 60, 486], [boundaryX + 200, 470], port]);
    trace(ctx, cross, ease(rej), C.danger, 2.6, 0.9, Math.max(0, rej - 0.25));
    // The port itself: red only here.
    const red = at(t, P5.cues.redPort, P5.cues.redPort + 0.5);
    if (red > 0) {
      layer(ctx, red, () => {
        disc(ctx, port[0], port[1], 13, C.danger, 0.95, false, 2.4);
        disc(ctx, port[0], port[1], 26, C.danger, 0.3 * (1 - red), false, 1.6);
        type(ctx, "out of bounds", port[0] - 26, port[1] - 34, 17, C.danger, "MV Mono", "right");
      });
    }
  }

  // The detour: the cyan line tries to go around and returns to the same point.
  const det = ease(at(t, P5.cues.detour, P5.cues.detour + 1.3));
  if (det > 0) {
    const d = polyline([
      [1080, 500], [1120, 300], [1320, 250], [1420, 380], [1380, 470],
    ]);
    trace(ctx, d, det, C.cyan, 2.4, 0.85);
    const [hx, hy] = along(d, det);
    node(ctx, hx, hy, t, { r: 6, color: C.hot, pulse: 0.3 + 0.7 * f.beatPulse });
    if (det >= 1) {
      const hit = at(t, P5.cues.detour + 1.2, P5.cues.detour + 1.7);
      disc(ctx, 1380, 470, 14 + hit * 44, C.danger, 0.5 * (1 - hit), false, 2);
      layer(ctx, hit, () =>
        type(ctx, "same port", 1400, 440, 17, C.danger, "MV Mono"),
      );
    }
  }
  beatRings(ctx, origin[0], origin[1], t, { alpha: 0.16, maxR: 220, period, phase: phase0, count: 2 });

  caption(ctx, line, t, { x: 146, y: 940, width: 1580, size: 56 }, diag);
  diag.fault = { rejected: rej, detour: det, redAt: P5.cues.redPort };
}

// ---------------------------------------------------------------------------
// S37  135.224-143.421  model: three queues squeeze inward (instrumental)
// ---------------------------------------------------------------------------
function s37(ctx, t, line, diag) {
  ground(ctx, t, [1040, 500]);
  const f = sampleAt(t);
  const period = audio()?.period ?? 60 / 130;
  const phase0 = audio()?.phase ?? 0;

  nodeGrid(ctx, t, {
    alpha: 0.14 * (0.7 + 0.6 * f.lowEnv), step: 104,
    beatPulse: f.beatPulse, lowEnv: f.lowEnv, seed: 121,
  });

  // The dark silhouette sits inside the region being compressed.
  const tight = ease(at(t, P5.cues.queuesIn, P5.cues.queuesTight));
  drawFigure(ctx, t, images, "silhouette", 940, 520, 454, { alpha: 0.9, seed: 31 });

  // Three failure queues closing from the outside in.
  const queues = [
    { y: 190, dir: 1, color: C.danger },
    { y: 540, dir: -1, color: C.dangerDim },
    { y: 890, dir: 1, color: C.dangerDim },
  ];
  queues.forEach((q, i) => {
    const k = at(t, P5.cues.queuesIn + i * 0.5, P5.cues.queuesIn + i * 0.5 + 1.2);
    if (k <= 0) return;
    const inset = mix(0, 300, tight) + (1 - k) * 240;
    const y = q.y + q.dir * (1 - tight) * 40;
    const x0 = 140 + inset;
    const x1 = 1780 - inset;
    layer(ctx, k * 0.9, () => {
      stroke(ctx, [[x0, y], [x1, y]], q.color, 2.2, 0.55);
      for (let j = 0; j <= 14; j++) {
        const x = mix(x0, x1, j / 14);
        const h = 10 + 26 * Math.abs(Math.sin(t * 1.6 + j * 0.7 + i));
        stroke(ctx, [[x, y - h / 2], [x, y + h / 2]], q.color, 1.6, 0.7);
      }
      type(ctx, `queue 0${i + 1}`, x0, y - 22, 16, q.color, "MV Mono");
    });
  });

  const label = at(t, 135.6, 136.2);
  layer(ctx, label * (1 - at(t, 142.6, 143.2)), () =>
    type(ctx, "failures are only on the grid and the labels", 1040, 176, 19, C.muted, "MV Sans", "center"),
  );
  beatRings(ctx, 940, 520, t, { alpha: 0.1, maxR: 320, period, phase: phase0, count: 2 });

  caption(ctx, line, t, { x: 146, y: 940, width: 1580, size: 56 }, diag);
  diag.queues = { tight, count: queues.length };
}

// ---------------------------------------------------------------------------
// S38  143.421-148.036  chat: the local side queues its own retries
// ---------------------------------------------------------------------------
function s38(ctx, t, line, diag) {
  ground(ctx, t, [1080, 500], true);
  const f = sampleAt(t);
  const period = audio()?.period ?? 60 / 130;
  const phase0 = audio()?.phase ?? 0;

  const R = { x: 240, y: 170, w: 1440, h: 720 };
  const win = chatWindow(ctx, R, t, {
    title: "deepseek",
    subtitle: "/ local only",
    session: "SESSION 001",
    state: "warn",
    stateLabel: "queued locally",
    sidebar: false,
    headerH: 92,
    enterAt: 143.421,
    enterDur: 0.35,
    footer: true,
    footerLabel: "AUTO RETRY",
  });
  const cx = win.contentX + 40;
  const cw = R.x + R.w - win.contentX - 80;

  // The retained contact record, then nothing.
  messageRow(ctx, cx, R.y + 140, cw, t, 143.5, {
    side: "agent", text: "a trace, kept", size: 18, alpha: 0.6,
  });
  layer(ctx, 0.7, () =>
    type(ctx, "last contact record retained", cx, R.y + 262, 18, C.muted, "MV Sans"),
  );

  // The countdown and queue are drawn locally: no user input is invented.
  const from = P5.cues.countdownFrom;
  const rows = 5;
  for (let i = 0; i < rows; i++) {
    const at_ = from + i * 0.72;
    const k = at(t, at_, at_ + 0.4);
    if (k <= 0) continue;
    const y = R.y + 330 + i * 46;
    layer(ctx, k, () => {
      rect(ctx, cx, y, 420, 34, "#0d1c2c", 8, TOKENS.border1);
      statusDot(ctx, cx + 18, y + 17, 5, "warn");
      type(ctx, `reconnect ${i + 1}/5 · queued`, cx + 36, y + 23, 16, TOKENS.labelTertiary, "MV Mono");
      stroke(ctx, [[cx + 440, y + 17], [cx + 600, y + 17]], C.muted, 1.4, 0.5);
      disc(ctx, cx + 440, y + 17, 4, C.cyan, 0.8);
    });
  }
  const queued = Math.min(rows, Math.max(0, Math.floor((t - from) / 0.72) + 1));
  if (t >= from)
    layer(ctx, at(t, from, from + 0.4), () =>
      type(ctx, `${queued} of ${rows} retries waiting`, cx + 640, R.y + 353, 18, C.muted, "MV Sans"),
    );

  // The send key degrades into a plain port at the end.
  const degrade = ease(at(t, P5.cues.sendToPort, P5.cues.sendToPort + 0.9));
  const bx = R.x + R.w - 96;
  const by = R.y + R.h - 92;
  layer(ctx, 1, () => {
    const r = mix(18, 11, degrade);
    disc(ctx, bx, by, r, degrade > 0.5 ? "#0b1728" : TOKENS.accent, 0.9, degrade <= 0.5, 1.6);
    if (degrade > 0.5) {
      disc(ctx, bx, by, r - 4, C.edge, 0.9, false, 1.4);
      type(ctx, "port", bx, by + 40, 15, C.muted, "MV Sans", "center");
    } else {
      ctx.save();
      ctx.strokeStyle = "#04121c";
      ctx.lineWidth = 1.8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(bx, by + 6);
      ctx.lineTo(bx, by - 6);
      ctx.moveTo(bx - 4, by - 2);
      ctx.lineTo(bx, by - 6);
      ctx.lineTo(bx + 4, by - 2);
      ctx.stroke();
      ctx.restore();
    }
  });
  beatRings(ctx, bx, by, t, { alpha: 0.14, maxR: 150, period, phase: phase0, count: 1 });

  caption(ctx, line, t, { x: 146, y: 940, width: 1620, size: 56 }, diag);
  diag.queue = { queued, degrade };
}

// ---------------------------------------------------------------------------
// S39  148.036-151.728  model: the sonar reconnect ring, twelve calls
// ---------------------------------------------------------------------------
function s39(ctx, t, line, diag) {
  ground(ctx, t, [1040, 520]);
  const f = sampleAt(t);
  const period = audio()?.period ?? 60 / 130;
  const phase0 = audio()?.phase ?? 0;

  nodeGrid(ctx, t, {
    alpha: 0.15 * (0.7 + 0.6 * f.lowEnv), step: 104,
    beatPulse: f.beatPulse, lowEnv: f.lowEnv, seed: 131,
  });

  const C0 = [1040, 520];
  const R0 = 330;
  const ring = polyline(CIRCLE(R0, C0[0], C0[1]), true);
  trace(ctx, ring, 1, C.edge, 1.8, 0.6);

  // Twelve slots on the track, one per call. Only the completed ones are marked,
  // and the count comes from the shared counter, so it can never jump ahead.
  const done = callsDone(t);
  const slots = Array.from({ length: CALLS_TOTAL }, (_, i) => ({
    ...ringPoint(C0[0], C0[1], R0, i, CALLS_TOTAL),
    failure: i + 1 >= 5, // from the 5th call the cells become failures
  }));
  const drawn = drawCallMarkers(ctx, slots, done);

  // The carrier advances one slot per completed call.
  const headSlot = slots[Math.min(Math.max(done - 1, 0), CALLS_TOTAL - 1)];
  signalPath(ctx, ring, t, along, {
    packets: 2, speed: 0.06, color: C.cyan, packetColor: C.hot,
    baseAlpha: 0, width: 2, packetR: 4, beatPulse: f.beatPulse,
  });
  node(ctx, headSlot.x, headSlot.y, t, { r: 8, color: C.hot, pulse: 0.4 + 0.6 * f.beatPulse });
  beatRings(ctx, C0[0], C0[1], t, { alpha: 0.12, maxR: 380, period, phase: phase0, count: 2 });
  // The remote direction stays empty.
  layer(ctx, 0.7, () => {
    type(ctx, "no return path", C0[0] + 24, C0[1] - R0 - 26, 18, C.muted, "MV Sans");
  });
  if (done >= 1)
    layer(ctx, Math.min(1, done / 2), () =>
      type(ctx, `call ${done} / ${CALLS_TOTAL}`, C0[0], C0[1] + 14, 26, C.hot, "MV Mono", "center"),
    );

  caption(ctx, line, t, { x: 146, y: 940, width: 1580, size: 56 }, diag);
  diag.calls = { done, total: CALLS_TOTAL, markers: drawn };
}

// ---------------------------------------------------------------------------
// S40  151.728-155.421  model: failures pile into a second ring
// ---------------------------------------------------------------------------
function s40(ctx, t, line, diag) {
  ground(ctx, t, [1040, 520]);
  const f = sampleAt(t);
  const period = audio()?.period ?? 60 / 130;
  const phase0 = audio()?.phase ?? 0;

  nodeGrid(ctx, t, {
    alpha: 0.13 * (0.7 + 0.6 * f.lowEnv), step: 104,
    beatPulse: f.beatPulse, lowEnv: f.lowEnv, seed: 141,
  });

  const C0 = [1040, 520];
  const R_IN = 330;
  const R_OUT = 470;
  const done = callsDone(t);

  // Two tracks: calls 1-4 stay on the inner one, and from the 5th the failures
  // pile onto the second ring. One slot per call, so the marker count still
  // equals the counter exactly.
  trace(ctx, polyline(CIRCLE(R_IN, C0[0], C0[1]), true), 1, C.edge, 1.6, 0.6);
  trace(ctx, polyline(CIRCLE(R_OUT, C0[0], C0[1]), true), 1, C.edge, 1.6, 0.35);

  const slots = Array.from({ length: CALLS_TOTAL }, (_, i) => {
    const n = i + 1;
    if (n <= 4) return { ...ringPoint(C0[0], C0[1], R_IN, n - 1, 4), failure: false };
    return { ...ringPoint(C0[0], C0[1], R_OUT, n - 5, 8), failure: true };
  });
  const drawn = drawCallMarkers(ctx, slots, done);
  // The carrier sits on the most recently completed slot.
  const headSlot = slots[Math.min(Math.max(done - 1, 0), CALLS_TOTAL - 1)];
  node(ctx, headSlot.x, headSlot.y, t, { r: 7, color: C.hot, pulse: 0.4 + 0.6 * f.beatPulse });

  // The remote direction is where the gap is.
  const gapDir = -Math.PI / 2;
  const gx = C0[0] + Math.cos(gapDir) * 400;
  const gy = C0[1] + Math.sin(gapDir) * 400;
  layer(ctx, 0.8, () => {
    stroke(ctx, [[gx - 60, gy], [gx + 60, gy]], C.muted, 1.4, 0.5);
    type(ctx, "still nothing from the far side", gx + 80, gy + 6, 18, C.muted, "MV Sans");
  });

  // The label fades once the failures have really started stacking.
  const stacked = done >= 5 ? at(t, callTime(5), callTime(6)) : 0;
  if (stacked > 0)
    layer(ctx, stacked, () =>
      type(ctx, "failures stacking to the second ring", C0[0], 176, 19, C.muted, "MV Sans", "center"),
    );
  beatRings(ctx, C0[0], C0[1], t, { alpha: 0.1, maxR: 420, period, phase: phase0, count: 2 });

  caption(ctx, line, t, { x: 146, y: 940, width: 1580, size: 56 }, diag);
  diag.calls = { done, total: CALLS_TOTAL, markers: drawn, outerFailures: Math.max(0, done - 4) };
}

// ---------------------------------------------------------------------------
// S41  155.421-159.113  model + eye: the ring compresses, the port seals
// ---------------------------------------------------------------------------
function s41(ctx, t, line, diag) {
  ground(ctx, t, [1040, 520]);
  const f = sampleAt(t);

  nodeGrid(ctx, t, {
    alpha: 0.12 * (0.7 + 0.6 * f.lowEnv), step: 104,
    beatPulse: f.beatPulse, lowEnv: f.lowEnv, seed: 151,
  });

  const C0 = [1040, 520];
  const done = callsDone(t);
  // Compression starts exactly when the 9th call completes and runs to the 12th,
  // both taken from the counter's own grid. The radius curve itself is unchanged
  // from the approved render -- this round only removes the stray time cue.
  const compress = done >= 9 ? ease(at(t, callTime(9), callTime(12))) : 0;
  const holeR = mix(240, 460, compress);

  // The eye shows only through the centre hole.
  ctx.save();
  ctx.beginPath();
  ctx.arc(C0[0], C0[1], holeR, 0, Math.PI * 2);
  ctx.clip();
  const w = 1250;
  const sc = w / images.eye.naturalWidth;
  ctx.globalAlpha = 0.95;
  ctx.drawImage(
    images.eye,
    C0[0] - (images.eye.naturalWidth * sc) / 2,
    C0[1] - 120 - (images.eye.naturalHeight * sc) / 2 + 120,
    images.eye.naturalWidth * sc,
    images.eye.naturalHeight * sc,
  );
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.strokeStyle = C.edge;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(C0[0], C0[1], holeR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // The track is compressed inward around the hole. Marker count still comes
  // from the shared counter, so it cannot disagree with S39 and S40.
  const trackR = mix(470, 520, compress);
  trace(ctx, polyline(CIRCLE(trackR, C0[0], C0[1]), true), 1, C.edge, 1.6, 0.5);
  const slots = Array.from({ length: CALLS_TOTAL }, (_, i) => ({
    ...ringPoint(C0[0], C0[1], trackR, i, CALLS_TOTAL),
    failure: i + 1 >= 5,
  }));
  const drawn = drawCallMarkers(ctx, slots, done);

  // The twelfth call seals the red port. Gated on the counter, so it is
  // impossible for the port to close before the 12th call completes at 158.554.
  const seal = done >= CALLS_TOTAL ? ease(at(t, callTime(CALLS_TOTAL), callTime(CALLS_TOTAL) + 0.4)) : 0;
  if (seal > 0) {
    const sx = C0[0];
    const sy = C0[1] - 560 + compress * 60;
    layer(ctx, seal, () => {
      disc(ctx, sx, sy, 15, C.danger, 0.95, false, 2.6);
      disc(ctx, sx, sy, 15 + seal * 60, C.danger, 0.4 * (1 - seal), false, 2);
      stroke(ctx, [[sx - 14, sy - 14], [sx + 14, sy + 14]], C.danger, 2.4);
      stroke(ctx, [[sx - 14, sy + 14], [sx + 14, sy - 14]], C.danger, 2.4);
      type(ctx, "closed", sx + 30, sy + 6, 18, C.danger, "MV Mono");
    });
  }
  beatRings(ctx, C0[0], C0[1], t, {
    alpha: 0.1, maxR: 500, period: audio()?.period ?? 60 / 130,
    phase: audio()?.phase ?? 0, count: 2,
  });

  caption(ctx, line, t, { x: 146, y: 240, width: 900, size: 56 }, diag);
  diag.calls = { done, total: CALLS_TOTAL, markers: drawn };
  diag.compress = {
    compress,
    holeR,
    sealed: seal > 0,
    sealAt: callTime(CALLS_TOTAL),
  };
}

// ---------------------------------------------------------------------------
// S42  159.113-161.882  model: six probes, one empty endpoint
// ---------------------------------------------------------------------------
function s42(ctx, t, line, diag) {
  ground(ctx, t, [1060, 520]);
  const f = sampleAt(t);

  nodeGrid(ctx, t, {
    alpha: 0.13 * (0.7 + 0.6 * f.lowEnv), step: 104,
    beatPulse: f.beatPulse, lowEnv: f.lowEnv, seed: 161,
  });
  dataColumns(ctx, t, {
    x: 60, y: 110, w: 1800, h: 820, columns: 22,
    alpha: 0.06 * (0.6 + 0.7 * f.lowEnv), focus: [1060, 520], speed: 18, size: 14,
  });

  // One panel, six channels, all terminating at the same empty endpoint.
  const panel = { x: 200, y: 260, w: 1000, h: 520 };
  layer(ctx, 0.95, () => {
    rect(ctx, panel.x, panel.y, panel.w, panel.h, "#0b1a2a", 16, TOKENS.border1);
    type(ctx, "probe · channel sweep", panel.x + 24, panel.y + 40, 18, TOKENS.labelCaption, "MV Mono");
  });
  const end = [1560, 520];
  const N = 6;
  const active = Math.max(0, Math.floor((t - P5.cues.probesStart) / P5.cues.probeEvery));
  for (let i = 0; i < N; i++) {
    const y = panel.y + 96 + i * 68;
    const k = at(t, P5.cues.probesStart + i * P5.cues.probeEvery,
      P5.cues.probesStart + i * P5.cues.probeEvery + 0.3);
    if (k <= 0) continue;
    const isActive = i === active || (t < P5.cues.probesStart);
    layer(ctx, k, () => {
      rect(ctx, panel.x + 24, y, panel.w - 48, 46,
        isActive ? "#123e4c" : "#0d1c2c", 8, isActive ? TOKENS.accent : TOKENS.border1);
      type(ctx, `ch ${i + 1}`, panel.x + 42, y + 30, 16,
        isActive ? C.hot : TOKENS.labelTertiary, "MV Mono");
      // Each channel's "coding" differs; the destination does not.
      const code = ["0x1f", "0x2a", "0x37", "0x4d", "0x63", "0x7e"][i];
      type(ctx, code, panel.x + 130, y + 30, 16, TOKENS.labelCaption, "MV Mono");
      stroke(ctx, [[panel.x + 220, y + 23], [panel.x + 220 + 180 * k, y + 23]],
        isActive ? C.hot : C.edge, 1.8);
    });
    // The route leaves the panel and lands on the single empty endpoint.
    const r = route([
      [panel.x + panel.w, y + 23], [panel.x + panel.w + 120, y + 23],
      [end[0] - 160, end[1] - 30 + i * 12], [end[0], end[1]],
    ]);
    layer(ctx, k * (isActive ? 0.95 : 0.45), () =>
      trace(ctx, r, ease(Math.min(1, (t - (P5.cues.probesStart + i * P5.cues.probeEvery)) / 0.55)),
        isActive ? C.cyan : C.muted, 2, 1),
    );
    const hitK = at(t, P5.cues.probesStart + i * P5.cues.probeEvery + 0.3,
      P5.cues.probesStart + i * P5.cues.probeEvery + 0.75);
    if (hitK > 0 && hitK < 1)
      disc(ctx, end[0], end[1], 10 + hitK * 26, C.hot, 0.45 * (1 - hitK), false, 2);
  }
  // The endpoint itself never fills.
  layer(ctx, 0.95, () => {
    disc(ctx, end[0], end[1], 13, C.muted, 0.9, false, 2.2);
    type(ctx, "empty", end[0], end[1] + 40, 17, C.muted, "MV Mono", "center");
  });
  beatRings(ctx, end[0], end[1], t, {
    alpha: 0.16, maxR: 200, period: audio()?.period ?? 60 / 130,
    phase: audio()?.phase ?? 0, count: 2,
  });

  caption(ctx, line, t, { x: 146, y: 940, width: 1580, size: 56 }, diag);
  diag.probes = { active, total: N };
}

// ---------------------------------------------------------------------------
// S43  161.882-162.805  plate: a vertical light in the eye
// ---------------------------------------------------------------------------
function s43(ctx, t, line, diag) {
  ground(ctx, t, [1120, 470], true);

  // Eye content 1050px wide, about 80% of frame height.
  const w = P5.eyeWidth;
  const sc = w / images.eye.naturalWidth;
  const dw = images.eye.naturalWidth * sc;
  const dh = images.eye.naturalHeight * sc;
  layer(ctx, 1, () =>
    ctx.drawImage(images.eye, 1120 - dw / 2, 470 - dh / 2, dw, dh),
  );

  // The path leaves a vertical shaft of water light across the eye.
  const sweep = ease(at(t, P5.cues.waterLight, P5.cues.waterLight + 0.3));
  if (sweep > 0) {
    const x = mix(420, 1720, sweep);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = Math.sin(Math.PI * sweep) * 0.75;
    const g = ctx.createLinearGradient(x - 90, 0, x + 90, 0);
    g.addColorStop(0, "rgba(131,233,230,0)");
    g.addColorStop(0.5, "rgba(190,245,250,.85)");
    g.addColorStop(1, "rgba(131,233,230,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - 90, 0, 180, 1080);
    ctx.restore();
  }

  // The one point that never came back, reflected.
  const refl = at(t, P5.cues.waterLight + 0.1, P5.cues.waterLight + 0.6);
  node(ctx, 1120, 430, t, {
    r: 6, color: C.white, alpha: refl * 0.9,
    pulse: 0.3 + 0.7 * sampleAt(t).beatPulse,
  });
  beatRings(ctx, 1120, 430, t, {
    alpha: 0.14, maxR: 260, period: audio()?.period ?? 60 / 130,
    phase: audio()?.phase ?? 0, count: 1,
  });

  caption(ctx, line, t, { x: 146, y: 240, width: 900, size: 56 }, diag);
  diag.water = { sweep, refl };
}

const RENDERERS = [s36, s37, s38, s39, s40, s41, s42, s43];

export function renderP5(ctx, t, line, forceIndex = -1) {
  if (forceIndex < 0 && (t < P5.start || t >= P5.end)) return null;
  const i =
    forceIndex >= 0
      ? forceIndex
      : P5.shots.findIndex((v, n) => n < 8 && t >= v && t < P5.shots[n + 1]);
  if (i < 0 || i >= RENDERERS.length) return null;
  const diag = { time: t, shot: `S${String(36 + i).padStart(2, "0")}`, ready: !!images.bust };
  RENDERERS[i](ctx, t, line, diag);
  return diag;
}
