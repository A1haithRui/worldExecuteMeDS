// Third segment: S07-S14, song time [29.709, 59.223).
//
// The story: the relationship takes a shape. Inputs spread into a field, the
// circle is sent as an attachment, the circle unrolls into a wave, the character
// is put on stage, a control panel changes how the signal is sampled, the view
// narrows, memory rewinds, and two channels finally line up.
import {
  W, C, clamp, mix, phase, ease, out, at, layer, stroke, disc, rect, type,
  point, ground, caption, route, along, trace, loadImages,
} from "./mv-draw.js";
import {
  TOKENS, chatWindow, messageRow, reasoningRow, composer, statusDot, statsPill,
  contextRing,
} from "./engine/chat.js";
import {
  node, nodeGrid, dataColumns, signalPath, waveform, beatRings,
} from "./engine/model.js";
import { spec, typewriter } from "./engine/type.js";
import { drawFigure, figureLayout } from "./engine/portrait.js";
import { sampleAt, audio, onsetPulses } from "./engine/audio.js";

export const P3 = Object.freeze({
  start: 29.709,
  end: 59.223,
  shots: [29.709, 33.412, 37.067, 40.706, 44.452, 47.672, 51.363, 55.083, 59.223],
  cues: {
    fieldOpen: 30.1,
    axisOut: 31.6,
    attach: 33.9,
    pathDrag: 35.0,
    confirmAttach: 36.3,
    unroll: 37.4,
    tangent: 38.6,
    catchPoint: 39.6,
    boundaryStop: 42.4,
    panelOpen: 44.9,
    modeSwitch: 46.1,
    bandNarrow: 48.0,
    scanFast: 50.0,
    rewindStart: 51.6,
    zeroCross: 53.4,
    channelsMeet: 58.4,
  },
});

const { images, ready } = loadImages({
  bust: "/assets/character/deepseek_bust_v3.png",
  silhouette: "/assets/character/v4/deepseek_bust_v4_silhouette.png",
  profile: "/assets/character/deepseek_profile_v3.png",
  lowlight: "/assets/character/v4/deepseek_bust_v4_lowlight.png",
});
export const p3Ready = ready;

function fig(ctx, t, key, cx, cy, height, opts) {
  return drawFigure(ctx, t, images, key, cx, cy, height, opts);
}

// ---------------------------------------------------------------------------
// S07  29.709-33.412  model interior: the input point opens into a field
// ---------------------------------------------------------------------------
function s07(ctx, t, line, diag) {
  ground(ctx, t, [980, 480]);
  const f = sampleAt(t);
  const period = audio()?.period ?? 60 / 130;
  const phase0 = audio()?.phase ?? 0;

  nodeGrid(ctx, t, {
    alpha: 0.19 * (0.7 + 0.6 * f.lowEnv), step: 92,
    beatPulse: f.beatPulse, lowEnv: f.lowEnv, seed: 51,
  });
  dataColumns(ctx, t, {
    x: 60, y: 110, w: 1800, h: 820, columns: 28,
    alpha: 0.07 * (0.6 + 0.7 * f.lowEnv), focus: [980, 480], speed: 21, size: 14,
  });

  // The input point spreads into a cloud, layer by layer along depth. Each layer
  // is drawn at its own scale so the field reads as having a third axis.
  const origin = [560, 540];
  const open = at(t, P3.cues.fieldOpen, P3.cues.fieldOpen + 1.1);
  const layers = 5;
  for (let L = 0; L < layers; L++) {
    const k = at(t, P3.cues.fieldOpen + L * 0.16, P3.cues.fieldOpen + L * 0.16 + 0.6);
    if (k <= 0) continue;
    const depth = L / (layers - 1);
    const s = 0.55 + depth * 0.75;
    const cols = 5 + L;
    layer(ctx, k * (0.75 - depth * 0.35), () => {
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < 3; j++) {
          const px = origin[0] + (i - (cols - 1) / 2) * 118 * s + L * 46;
          const py = origin[1] + (j - 1) * 104 * s - L * 26;
          const ph = (i * 7 + j * 13 + L * 3) % 11;
          const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * 0.9 + ph));
          node(ctx, px, py, t, {
            r: 3.4 * s, color: L % 2 ? C.cyan : C.hot,
            alpha: 0.5 + 0.5 * tw, pulse: 0.25 + 0.75 * f.beatPulse, seed: ph,
          });
        }
      }
    });
  }
  node(ctx, origin[0], origin[1], t, { r: 8, color: C.hot, pulse: 0.4 + 0.6 * f.beatPulse });
  beatRings(ctx, origin[0], origin[1], t, {
    alpha: 0.2 * open, maxR: 260, period, phase: phase0, count: 2,
  });

  // The far white point gains an axis of its own.
  const remote = [1560, 430];
  const axis = at(t, P3.cues.axisOut, P3.cues.axisOut + 0.9);
  if (axis > 0) {
    layer(ctx, 0.55 * axis, () => {
      stroke(ctx, [[remote[0] - 180 * axis, remote[1]], [remote[0] + 260 * axis, remote[1]]], C.white, 1.2);
      stroke(ctx, [[remote[0], remote[1] + 150 * axis], [remote[0], remote[1] - 190 * axis]], C.white, 1.2);
    });
    layer(ctx, axis, () => disc(ctx, remote[0], remote[1], 11, C.white, 0.9, false, 2));
    if (axis > 0.3)
      layer(ctx, at(t, P3.cues.axisOut + 0.4, P3.cues.axisOut + 0.9), () =>
        type(ctx, "remote", remote[0] + 26, remote[1] - 18, 18, C.muted, "MV Sans"),
      );
  }

  caption(ctx, line, t, { x: 146, y: 940, width: 1580, size: 56 }, diag);
  diag.field = { open, layers, axis };
}

// ---------------------------------------------------------------------------
// S08  33.412-37.067  chat / bust: the circle is sent as an attachment
// ---------------------------------------------------------------------------
function s08(ctx, t, line, diag) {
  ground(ctx, t, [1240, 490], true);
  const f = sampleAt(t);
  const period = audio()?.period ?? 60 / 130;
  const phase0 = audio()?.phase ?? 0;

  // Only the avatar remains of the character.
  fig(ctx, t, "bust", 1560, 500, 460, { alpha: 0.5, rim: true, seed: 9 });

  const R = { x: 210, y: 150, w: 1010, h: 750 };
  chatWindow(ctx, R, t, {
    title: "deepseek",
    subtitle: "/ world model",
    session: "RELATION / 01",
    state: "busy",
    stateLabel: "attaching",
    sidebar: false,
    headerH: 92,
    enterAt: 33.412,
    enterDur: 0.45,
    footer: true,
    footerLabel: "ATTACHMENT",
  });
  const cx = R.x + 40;
  const cw = R.w - 80;

  // The attachment: the circle as a deliverable card.
  const card = at(t, P3.cues.attach, P3.cues.attach + 0.5);
  if (card > 0) {
    const cardY = R.y + 132;
    layer(ctx, card, () => {
      rect(ctx, cx, cardY, cw, 330, "#0d1c2c", 14, TOKENS.border2);
      type(ctx, "relation / circle", cx + 22, cardY + 36, 17, TOKENS.labelTertiary, "MV Mono");
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(cx + cw / 2, cardY + 195, 20, cx + cw / 2, cardY + 195, 190);
      g.addColorStop(0, "rgba(37,189,212,.22)");
      g.addColorStop(1, "rgba(37,189,212,0)");
      ctx.fillStyle = g;
      ctx.fillRect(cx + cw / 2 - 200, cardY - 5, 400, 400);
      ctx.restore();
      disc(ctx, cx + cw / 2, cardY + 195, 118, C.cyan, 0.9, false, 2.4);
      disc(ctx, cx + cw / 2, cardY + 195, 118, C.cyan, 0.06);
    });

    // A white path is dragged along the rim, then confirmed.
    const drag = at(t, P3.cues.pathDrag, P3.cues.pathDrag + 1.3);
    if (drag > 0) {
      const cxp = cx + cw / 2;
      const cyp = cardY + 195;
      ctx.save();
      ctx.globalAlpha = 0.95;
      ctx.strokeStyle = C.white;
      ctx.lineWidth = 3.4;
      ctx.lineCap = "round";
      ctx.beginPath();
      const a0 = -Math.PI * 0.75;
      const a1 = a0 + Math.PI * 1.25 * ease(drag);
      const steps = Math.max(2, Math.floor(48 * ease(drag)) + 2);
      for (let i = 0; i <= steps; i++) {
        const a = mix(a0, a1, i / steps);
        const px = cxp + Math.cos(a) * 118;
        const py = cyp + Math.sin(a) * 118;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();
      const [hx, hy] = [cxp + Math.cos(a1) * 118, cyp + Math.sin(a1) * 118];
      node(ctx, hx, hy, t, {
        r: 6, color: C.hot, pulse: 0.4 + 0.6 * f.beatPulse,
      });
    }
    const ok = at(t, P3.cues.confirmAttach, P3.cues.confirmAttach + 0.45);
    if (ok > 0) {
      disc(ctx, cx + cw / 2, cardY + 195, 118 + ok * 70, C.hot, 0.5 * (1 - ok), false, 2);
      layer(ctx, ok, () =>
        type(ctx, "confirmed", cx + 22, cardY + 306, 18, C.hot, "MV Sans"),
      );
    }
  }

  // The thread acknowledges below.
  const ack = at(t, P3.cues.confirmAttach + 0.3, P3.cues.confirmAttach + 0.9);
  if (ack > 0)
    layer(ctx, ack, () =>
      reasoningRow(ctx, cx, R.y + R.h - 150, cw, t, {
        running: false, startedAt: P3.cues.confirmAttach,
        title: "思考", summary: "a shared shape",
      }),
    );
  beatRings(ctx, cx + 12, R.y + 180, t, {
    alpha: 0.14, maxR: 120, period, phase: phase0, count: 1,
  });

  caption(ctx, line, t, { x: 146, y: 940, width: 1620, size: 56 }, diag);
  diag.attachment = { card, confirm: t >= P3.cues.confirmAttach };
}

// ---------------------------------------------------------------------------
// S09  37.067-40.706  model interior: the rim unrolls into a wave
// ---------------------------------------------------------------------------
function s09(ctx, t, line, diag) {
  ground(ctx, t, [1040, 490]);
  const f = sampleAt(t);

  nodeGrid(ctx, t, {
    alpha: 0.17 * (0.7 + 0.6 * f.lowEnv), step: 96,
    beatPulse: f.beatPulse, lowEnv: f.lowEnv, seed: 61,
  });

  // The circle's rim unrolls into a sine: the same points, straightening out.
  const unroll = ease(at(t, P3.cues.unroll, P3.cues.unroll + 1.2));
  const cxp = mix(700, 300, unroll);
  const cy = 520;
  const r = 150;
  const WAVE_X0 = 300;
  const WAVE_X1 = 1620;
  const amp = 120;
  ctx.save();
  ctx.strokeStyle = C.cyan;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.75;
  ctx.beginPath();
  const N = 220;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const a = -Math.PI * 0.5 + u * Math.PI * 2;
    const cx0 = cxp + Math.cos(a) * r;
    const cy0 = cy + Math.sin(a) * r;
    const wx = mix(WAVE_X0, WAVE_X1, u);
    const wy = cy + Math.sin(u * Math.PI * 3.2) * amp;
    const px = mix(cx0, wx, unroll);
    const py = mix(cy0, wy, unroll);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();

  // The far white point leaves along the tangent and is caught by the next wave.
  const tangent = at(t, P3.cues.tangent, P3.cues.tangent + 0.9);
  if (tangent > 0) {
    const tx = mix(700, WAVE_X0 + 260, unroll);
    const ty = cy;
    const route1 = route([
      [tx, ty],
      [tx + 520, ty - 300 * tangent],
      [mix(tx, WAVE_X1, 0.75), cy - amp],
    ]);
    trace(ctx, route1, ease(tangent), C.white, 2.4, 0.85, Math.max(0, tangent - 0.18));
    const [px, py] = along(route1, ease(tangent));
    if (tangent < 1)
      node(ctx, px, py, t, { r: 6, color: C.white, pulse: 0.3 + 0.7 * f.beatPulse });
  }
  // The catch: a node appears exactly where the wave can receive it.
  const caught = at(t, P3.cues.catchPoint, P3.cues.catchPoint + 0.5);
  if (caught > 0) {
    const cx2 = mix(700, WAVE_X0 + 780, unroll);
    disc(ctx, cx2, cy - amp, 14 + (1 - caught) * 44, C.hot, 0.6 * (1 - caught), false, 2);
    node(ctx, cx2, cy - amp, t, { r: 7, color: C.hot, alpha: caught, pulse: 0.4 + 0.6 * f.beatPulse });
  }
  beatRings(ctx, cxp, cy, t, {
    alpha: 0.16, maxR: 260, period: audio()?.period ?? 60 / 130,
    phase: audio()?.phase ?? 0, count: 2,
  });

  caption(ctx, line, t, { x: 146, y: 940, width: 1580, size: 56 }, diag);
  diag.wave = { unroll, tangent, caught };
}

// ---------------------------------------------------------------------------
// S10  40.706-44.452  plate: a boundary approaches her and stops
// ---------------------------------------------------------------------------
function s10(ctx, t, line, diag) {
  ground(ctx, t, [1240, 470], true);
  const f = sampleAt(t);
  const period = audio()?.period ?? 60 / 130;
  const phase0 = audio()?.phase ?? 0;

  dataColumns(ctx, t, {
    x: 80, y: 120, w: 1760, h: 800, columns: 18,
    alpha: 0.05 * (0.5 + 0.7 * f.lowEnv), focus: [1240, 470], speed: 13, size: 14,
  });

  fig(ctx, t, "bust", 1300, 520, 734, { rim: true, seed: 11 });

  // The boundary on the left closes in, then stops short of her.
  const close = ease(at(t, 40.706, P3.cues.boundaryStop));
  const bx = mix(140, 880, close);
  ctx.save();
  ctx.globalAlpha = 0.5 + 0.5 * close;
  stroke(ctx, [[bx, 150], [bx, 900]], C.cyan, 2);
  ctx.restore();
  // Tick marks on the boundary, densest closest to her.
  ctx.save();
  ctx.globalAlpha = 0.35;
  for (let i = 0; i < 12; i++) {
    const y = 170 + i * 62;
    stroke(ctx, [[bx, y], [bx - 14, y]], C.cyan, 1.2);
  }
  ctx.restore();
  if (close >= 1) {
    const halo = at(t, P3.cues.boundaryStop, P3.cues.boundaryStop + 0.6);
    if (halo < 1) disc(ctx, bx, 520, 20 + halo * 90, C.hot, 0.4 * (1 - halo), false, 2);
    layer(ctx, at(t, P3.cues.boundaryStop + 0.2, P3.cues.boundaryStop + 0.7), () =>
      type(ctx, "still inside", bx + 22, 196, 19, C.muted, "MV Sans"),
    );
  }
  // The white point stays outside the boundary, since it can leave the frame.
  node(ctx, 214, 330, t, {
    r: 6, color: C.white, alpha: 0.9, pulse: 0.3 + 0.7 * f.beatPulse,
  });
  beatRings(ctx, 1300, 500, t, {
    alpha: 0.14, maxR: 380, period, phase: phase0, count: 2,
  });

  caption(ctx, line, t, { x: 146, y: 940, width: 620, size: 56 }, diag);
  diag.boundary = { x: bx, closed: close };
}

// ---------------------------------------------------------------------------
// S11  44.452-47.672  chat / bust: a control panel changes the sampling
// ---------------------------------------------------------------------------
function s11(ctx, t, line, diag) {
  ground(ctx, t, [1220, 490], true);
  const f = sampleAt(t);
  const period = audio()?.period ?? 60 / 130;
  const phase0 = audio()?.phase ?? 0;

  fig(ctx, t, "bust", 1560, 520, 620, { alpha: 0.45, rim: true, seed: 13 });

  const R = { x: 220, y: 200, w: 940, h: 660 };
  chatWindow(ctx, R, t, {
    title: "deepseek",
    subtitle: "/ signal",
    session: "MODE",
    state: "busy",
    stateLabel: t >= P3.cues.modeSwitch ? "resampling" : "sampling",
    sidebar: false,
    headerH: 86,
    enterAt: 44.452,
    enterDur: 0.4,
    footer: false,
  });
  const cx = R.x + 44;
  const cw = R.w - 88;

  const open = at(t, P3.cues.panelOpen, P3.cues.panelOpen + 0.5);
  if (open > 0) {
    layer(ctx, open, () => {
      // Segmented control: the pill slides rather than snapping.
      const segY = R.y + 140;
      rect(ctx, cx, segY, cw, 62, "#0b1728", 14, TOKENS.border1);
      const segW = cw / 2 - 8;
      const slide = ease(at(t, P3.cues.modeSwitch, P3.cues.modeSwitch + 0.35));
      const selX = cx + 6 + slide * (segW + 4);
      ctx.save();
      ctx.globalAlpha = 0.95;
      rect(ctx, selX, segY + 6, segW, 50, "#16304a", 11, TOKENS.accent);
      ctx.restore();
      type(ctx, "WAVE", cx + 6 + segW / 2, segY + 40, 19, slide < 0.5 ? C.white : C.muted, "MV Sans", "center");
      type(ctx, "EDGE", cx + cw / 2 + 2 + segW / 2, segY + 40, 19, slide >= 0.5 ? C.white : C.muted, "MV Sans", "center");

      // The waveform changes how it is sampled.
      const wy = R.y + 250;
      const mode = slide;
      for (let i = 0; i < 96; i++) {
        const u = i / 95;
        const tt = t - 1.8 + u * 1.8;
        const base = (i % 3 === 0 ? 0.85 : 0.35) * (0.5 + 0.5 * Math.sin(t * 2 + i * 0.4));
        const smooth = audio() ? audio().seriesAt("mid", Math.max(0, tt)) : 0.4;
        const v = mix(base, smooth, mode);
        const bh = Math.max(2, v * 130);
        ctx.save();
        ctx.globalAlpha = 0.55 + 0.35 * u;
        ctx.fillStyle = u > 0.82 ? C.hot : C.cyan;
        ctx.fillRect(cx + i * (cw / 96), wy + (130 - bh) / 2, Math.max(1, cw / 96 - 3), bh);
        ctx.restore();
      }
      type(ctx, mode < 0.5 ? "sampling: stepped" : "sampling: continuous", cx, R.y + 430, 18, C.muted, "MV Sans");
    });
  }

  statsPill(ctx, cx, R.y + 470, [`${Math.round(mix(12, 96, ease(at(t, P3.cues.modeSwitch, P3.cues.modeSwitch + 0.35))))} Hz`, "latency 0ms"], 1);
  beatRings(ctx, cx + 10, R.y + 300, t, {
    alpha: 0.16, maxR: 140, period, phase: phase0, count: 1,
  });

  caption(ctx, line, t, { x: 146, y: 940, width: 1620, size: 56 }, diag);
  diag.mode = t >= P3.cues.modeSwitch ? "edge" : "wave";
}

// ---------------------------------------------------------------------------
// S12  47.672-51.363  model interior: the window narrows to a band
// ---------------------------------------------------------------------------
function s12(ctx, t, line, diag) {
  ground(ctx, t, [1040, 500]);
  const f = sampleAt(t);
  const seek = at(t, P3.cues.bandNarrow, P3.cues.bandNarrow + 1.0);

  nodeGrid(ctx, t, {
    alpha: 0.16 * (0.7 + 0.6 * f.lowEnv), step: 100,
    beatPulse: f.beatPulse, lowEnv: f.lowEnv, seed: 71,
  });

  // The visible band narrows and opens again; the waveform is clipped by it.
  const narrow = Math.sin(Math.PI * clamp(at(t, P3.cues.bandNarrow, 50.6))) * (1 - seek * 0.15);
  const bandH = mix(420, 96, narrow);
  const bandY = 500 - bandH / 2;
  const bx = 260;
  const bw = 1400;
  ctx.save();
  ctx.beginPath();
  ctx.rect(bx, bandY, bw, bandH);
  ctx.clip();
  waveform(ctx, bx, bandY, bw, bandH, t, {
    bars: 140, span: 3.2, series: "mid", alpha: 0.75, minBar: 2,
  });
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.7;
  stroke(ctx, [[bx, bandY], [bx + bw, bandY]], C.cyan, 1.4);
  stroke(ctx, [[bx, bandY + bandH], [bx + bw, bandY + bandH]], C.cyan, 1.4);
  ctx.restore();
  layer(ctx, at(t, P3.cues.bandNarrow, P3.cues.bandNarrow + 0.4) * (1 - at(t, 50.4, 50.9)), () =>
    type(ctx, "region of interest", bx, bandY - 20, 18, C.muted, "MV Sans"),
  );

  // The local scan gets faster.
  const speed = mix(0.35, 3.4, ease(at(t, P3.cues.scanFast, P3.cues.scanFast + 1.4)));
  const sx = bx + (((t - P3.cues.bandNarrow) * speed * 320) % bw + bw) % bw;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 0.75;
  const g = ctx.createLinearGradient(sx - 40, 0, sx + 40, 0);
  g.addColorStop(0, "rgba(131,233,230,0)");
  g.addColorStop(0.5, "rgba(131,233,230,.55)");
  g.addColorStop(1, "rgba(131,233,230,0)");
  ctx.fillStyle = g;
  ctx.fillRect(sx - 40, bandY, 80, bandH);
  ctx.restore();
  // The scan throws an onset pulse each time it crosses a marked tick.
  onsetPulses(t, 0.6, 0.25).forEach((o) => {
    const q = Math.min(1, o.age / 0.3);
    const a = (1 - q) * (0.3 + 0.6 * o.strength);
    if (a <= 0.02) return;
    disc(ctx, sx, bandY + bandH / 2, 12 + q * 50, C.hot, a * 0.5, false, 2);
  });
  beatRings(ctx, sx, bandY + bandH / 2, t, {
    alpha: 0.2, maxR: 130, period: audio()?.period ?? 60 / 130,
    phase: audio()?.phase ?? 0, count: 1,
  });

  caption(ctx, line, t, { x: 146, y: 940, width: 1580, size: 56 }, diag);
  diag.band = { bandH, speed, sx };
}

// ---------------------------------------------------------------------------
// S13  51.363-55.083  model interior: memory rewinds past zero
// ---------------------------------------------------------------------------
function s13(ctx, t, line, diag) {
  ground(ctx, t, [1040, 500]);
  const f = sampleAt(t);
  const period = audio()?.period ?? 60 / 130;
  const phase0 = audio()?.phase ?? 0;

  nodeGrid(ctx, t, {
    alpha: 0.14 * (0.7 + 0.6 * f.lowEnv), step: 104,
    beatPulse: f.beatPulse, lowEnv: f.lowEnv, seed: 81,
  });

  // A rail of timestamped records scrolling into the past.
  const railY = 500;
  const x0 = 220;
  const x1 = 1700;
  stroke(ctx, [[x0, railY], [x1, railY]], C.edge, 1.4);
  const rewind = ease(at(t, P3.cues.rewindStart, P3.cues.rewindStart + 2.6));
  const offset = rewind * 2600;
  const spacing = 168;
  const zero = x0 + 430 - offset;
  for (let i = -3; i < 22; i++) {
    const x = x0 + i * spacing - (offset % spacing);
    if (x < x0 - 60 || x > x1 + 60) continue;
    const past = x < zero;
    const dist = Math.abs(x - zero);
    const a = clamp(1 - dist / 2100) * 0.9 + 0.1;
    // Records already sampled go hollow once the pointer crosses zero.
    layer(ctx, a, () => {
      const r = past ? 6 : 9;
      if (past) {
        disc(ctx, x, railY, r, C.muted, 0.9, false, 1.6);
      } else {
        disc(ctx, x, railY, r, C.hot, 0.95);
        disc(ctx, x, railY, r + 5, C.hot, 0.3, false, 1.2);
      }
      type(ctx, past ? "sampled" : "held", x, railY + 40, 15,
        past ? C.muted : C.cyan, "MV Mono", "center");
    });
    stroke(ctx, [[x, railY - 26], [x, railY + 26]], C.edge, 1, a * 0.5);
  }
  // The zero tick the pointer is crossing.
  layer(ctx, 0.85, () => {
    stroke(ctx, [[zero, railY - 54], [zero, railY + 54]], C.white, 2);
    type(ctx, "0", zero, railY - 66, 20, C.white, "MV Mono", "center");
  });
  node(ctx, zero, railY, t, {
    r: 7, color: C.hot, pulse: 0.4 + 0.6 * f.beatPulse,
  });
  beatRings(ctx, zero, railY, t, { alpha: 0.22, maxR: 240, period, phase: phase0, count: 2 });

  const crossed = t >= P3.cues.zeroCross;
  if (crossed)
    layer(ctx, at(t, P3.cues.zeroCross, P3.cues.zeroCross + 0.5), () =>
      type(ctx, "everything before this is already sampled", x0, railY + 150, 19, C.muted, "MV Sans"),
    );

  caption(ctx, line, t, { x: 146, y: 940, width: 1580, size: 56 }, diag);
  diag.rewind = { offset, zero, crossed };
}

// ---------------------------------------------------------------------------
// S14  55.083-59.223  plate: two channels line up
// ---------------------------------------------------------------------------
function s14(ctx, t, line, diag) {
  ground(ctx, t, [1240, 490], true);
  const f = sampleAt(t);
  const period = audio()?.period ?? 60 / 130;
  const phase0 = audio()?.phase ?? 0;

  dataColumns(ctx, t, {
    x: 80, y: 120, w: 1760, h: 800, columns: 18,
    alpha: 0.05 * (0.5 + 0.7 * f.lowEnv), focus: [1240, 490], speed: 13, size: 14,
  });

  fig(ctx, t, "profile", 1390, 520, 690, { rim: true, seed: 17 });

  // Two channels on the left, almost but not quite in phase.
  const meet = ease(at(t, P3.cues.channelsMeet - 1.4, P3.cues.channelsMeet + 0.4));
  const gap = mix(60, 0, meet);
  const y0 = 430;
  const x0 = 180;
  const x1 = 980;
  ctx.save();
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  for (let c = 0; c < 2; c++) {
    const sign = c === 0 ? -1 : 1;
    ctx.strokeStyle = c === 0 ? C.cyan : C.hot;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    for (let i = 0; i <= 120; i++) {
      const u = i / 120;
      const x = mix(x0, x1, u);
      const y = y0 + sign * (gap / 2) + Math.sin(u * Math.PI * 3.4 + t * 2.2 + c * 0.35) * 74;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
  if (meet > 0.75) {
    const k = at(t, P3.cues.channelsMeet, P3.cues.channelsMeet + 0.5) * (1 - at(t, 58.9, 59.223));
    disc(ctx, x1, y0, 16 + k * 80, C.hot, 0.5 * k, false, 2);
    node(ctx, x1, y0, t, { r: 7, color: C.hot, alpha: 0.6 + 0.4 * k, pulse: 0.4 + 0.6 * f.beatPulse });
    layer(ctx, k, () => type(ctx, "in phase", x1 - 60, y0 - 118, 19, C.hot, "MV Sans"));
  }
  beatRings(ctx, x1, y0, t, { alpha: 0.16, maxR: 300, period, phase: phase0, count: 2 });

  caption(ctx, line, t, { x: 146, y: 940, width: 1580, size: 56 }, diag);
  diag.channels = { gap, meet };
}

const RENDERERS = [s07, s08, s09, s10, s11, s12, s13, s14];

export function renderP3(ctx, t, line, forceIndex = -1) {
  if (forceIndex < 0 && (t < P3.start || t >= P3.end)) return null;
  const i =
    forceIndex >= 0
      ? forceIndex
      : P3.shots.findIndex((v, n) => n < 8 && t >= v && t < P3.shots[n + 1]);
  if (i < 0 || i >= RENDERERS.length) return null;
  const diag = { time: t, shot: `S${String(7 + i).padStart(2, "0")}`, ready: !!images.bust };
  RENDERERS[i](ctx, t, line, diag);
  return diag;
}
