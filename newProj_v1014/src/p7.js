// Seventh and final segment: S51-S56, song time [188.483, 211.957596).
//
// The ending, from the storyboard's own shot text:
//   S51 the curves become an open far exit and a still-closed local boundary;
//       the palm's point leaves her hand and hangs inside the exit after 191.356
//   S52 the same composition with the glow withdrawn; at 193.600 the reaching
//       figure is replaced in place by the lowlit one -- the climax is not
//       shrunk into an unread thumbnail
//   S53 a narrow status bar: this end is asleep, the far end's slot stays empty
//   S54 the lowlit figure fades to an outline; the cyan point keeps its brightness
//   S55 one last call leaves along the original path; no online marker lights up
//   S56 the ring fades out; the credits hold to the exact end of the file
//
// Two things this file must not do, per the storyboard: S54 must not dismantle
// the interface layer by layer or delete the character's fields, and S56 must
// end on a still deep-blue frame rather than introducing any new plot.
import {
  W, C, clamp, mix, phase, ease, out, at, layer, stroke, disc, rect, type,
  point, ground, caption, route, polyline, along, trace, loadImages,
} from "./mv-draw.js";
import { TOKENS, chatWindow, statusDot } from "./engine/chat.js";
import { node, nodeGrid, signalPath, beatRings } from "./engine/model.js";
import { drawFigure } from "./engine/portrait.js";
import { sampleAt, audio } from "./engine/audio.js";

export const P7 = Object.freeze({
  start: 188.483,
  end: 211.957596,
  shots: [188.483, 192.344, 195.356, 200.652, 205.811, 209.811, 211.957596],
  cues: {
    gateOpen: 189.2,
    handOff: 190.2,
    hang: 191.356,
    glowWithdraw: 192.6,
    swapInPlace: 193.6,
    barIn: 195.6,
    asleep: 197.2,
    fadeToOutline: 202.8,
    lastCall: 206.0,
    decay: 207.45,
    ringGone: 209.4,
    creditsIn: 209.811,
    creditsHold: 211.558,
  },
});

const { images, ready } = loadImages({
  bust: "/assets/character/deepseek_bust_v3.png",
  silhouette: "/assets/character/v4/deepseek_bust_v4_silhouette.png",
  profile: "/assets/character/deepseek_profile_v3.png",
  lowlight: "/assets/character/v4/deepseek_bust_v4_lowlight.png",
  reach: "/assets/character/deepseek_reach_v3.png",
});
export const p7Ready = ready;

// The path the very first call took, reused for the last one.
const ORIGIN_PATH = route([[300, 560], [820, 470], [1340, 500], [1880, 420]]);

// ---------------------------------------------------------------------------
// S51  188.483-192.344  plate: the exit stays open, she stops chasing
// ---------------------------------------------------------------------------
function s51(ctx, t, line, diag) {
  ground(ctx, t, [1240, 500], true);
  const f = sampleAt(t);
  const period = audio()?.period ?? 60 / 130;
  const phase0 = audio()?.phase ?? 0;

  // The two curves straighten into a gate: open on the far side, still closed
  // on this one. The far boundary is deliberately left unfinished.
  const open = ease(at(t, P7.cues.gateOpen, P7.cues.gateOpen + 1.1));
  const farX = 1180;
  const nearX = 980;
  layer(ctx, 0.9, () => {
    // Local boundary: closed, meeting at both ends.
    stroke(ctx, [[nearX, 150], [nearX, 930]], C.cyan, 2.2, 0.85);
    // Far boundary: the top half opens away, the lower half stops short.
    stroke(ctx, [[farX, 150], [farX, mix(460, 330, open)]], C.white, 2.2, 0.6 + 0.4 * open);
    stroke(ctx, [[farX, 930], [farX, mix(620, 700, open)]], C.white, 2.2, 0.6 + 0.4 * open);
    type(ctx, "far exit", farX + 24, 240, 18, C.muted, "MV Sans");
    type(ctx, "this end", nearX - 30, 240, 18, C.muted, "MV Sans", "right");
  });

  // She reaches for it, at 82% of frame height.
  drawFigure(ctx, t, images, "reach", 1400, 520, 886, { alpha: 0.95, seed: 51, rim: true, rimAlpha: 0.08 });

  // The palm's cyan point leaves her hand and hangs inside the exit.
  const off = ease(at(t, P7.cues.handOff, P7.cues.hang));
  const px = mix(1290, 1120, off);
  const py = mix(560, 470, off);
  if (t >= P7.cues.handOff) {
    trace(ctx, route([[1290, 560], [1220, 500], [1120, 470]]), Math.min(1, off * 1.4), C.cyan, 1.8, 0.35);
    node(ctx, px, py, t, { r: 8, color: C.hot, pulse: 0.4 + 0.6 * f.beatPulse });
    if (t >= P7.cues.hang)
      layer(ctx, at(t, P7.cues.hang, P7.cues.hang + 0.5), () =>
        type(ctx, "waiting inside", px + 26, py - 20, 17, C.muted, "MV Sans"),
      );
  }
  beatRings(ctx, px, py, t, { alpha: 0.14, maxR: 300, period, phase: phase0, count: 2 });

  caption(ctx, line, t, { x: 146, y: 940, width: 820, size: 56 }, diag);
  diag.gate = { open, point: [px, py], hung: t >= P7.cues.hang };
}

// ---------------------------------------------------------------------------
// S52  192.344-195.356  plate: the same frame, ink withdrawn, replaced in place
// ---------------------------------------------------------------------------
function s52(ctx, t, line, diag) {
  ground(ctx, t, [1240, 500], true);

  // Identical geometry to S51: the gate does not move and neither does she.
  const farX = 1180;
  const nearX = 980;
  layer(ctx, 0.55, () => {
    stroke(ctx, [[nearX, 150], [nearX, 930]], C.cyan, 2, 0.6);
    stroke(ctx, [[farX, 150], [farX, 330]], C.white, 2, 0.45);
    stroke(ctx, [[farX, 930], [farX, 700]], C.white, 2, 0.45);
  });

  // The glow is withdrawn, then at 193.600 the reaching figure is replaced by
  // the lowlit one at exactly the same position -- no cut, no re-framing, and
  // the climax is not collapsed into a small unread picture.
  const swap = ease(at(t, P7.cues.swapInPlace, P7.cues.swapInPlace + 0.55));
  const dim = 1 - 0.35 * ease(at(t, P7.cues.glowWithdraw, P7.cues.glowWithdraw + 1.0));
  if (swap < 1)
    drawFigure(ctx, t, images, "reach", 1400, 520, 886, {
      alpha: (1 - swap) * dim, seed: 51, rim: true, rimAlpha: 0.06 * (1 - swap),
    });
  if (swap > 0)
    drawFigure(ctx, t, images, "lowlight", 1400, 520, 886, {
      alpha: swap * dim, seed: 53, rim: true, rimAlpha: 0.05 * swap,
    });

  // The palm stays open and the point stays where it hung.
  const px = 1120;
  const py = 470;
  node(ctx, px, py, t, {
    r: 8, color: C.hot, pulse: 0.4 + 0.6 * sampleAt(t).beatPulse,
  });
  beatRings(ctx, px, py, t, {
    alpha: 0.12, maxR: 280, period: audio()?.period ?? 60 / 130,
    phase: audio()?.phase ?? 0, count: 2,
  });

  caption(ctx, line, t, { x: 146, y: 940, width: 820, size: 56 }, diag);
  diag.replace = { swap, samePosition: true };
}

// ---------------------------------------------------------------------------
// S53  195.356-200.652  chat: a narrow bar, this end asleep
// ---------------------------------------------------------------------------
function s53(ctx, t, line, diag) {
  ground(ctx, t, [1200, 520], true);

  // The full window is gone; only a narrow status bar is left.
  const barIn = ease(at(t, P7.cues.barIn, P7.cues.barIn + 0.5));
  const bar = { x: 300, y: 470, w: 1320, h: 96 };
  layer(ctx, barIn, () => {
    rect(ctx, bar.x, bar.y, bar.w, bar.h, "#0b1a2a", 16, TOKENS.border1);
    statusDot(ctx, bar.x + 44, bar.y + 48, 7, "idle");
    type(ctx, "this end · asleep", bar.x + 70, bar.y + 58, 20, TOKENS.labelSecondary, "MV Sans");
    // The far end's slot is kept, and left empty.
    type(ctx, "far end", bar.x + bar.w - 250, bar.y + 58, 18, TOKENS.labelTertiary, "MV Sans");
    disc(ctx, bar.x + bar.w - 90, bar.y + 48, 13, C.edge, 0.9, false, 1.8);
    type(ctx, "—", bar.x + bar.w - 90, bar.y + 56, 20, TOKENS.labelCaption, "MV Mono", "center");
  });

  // The last contact record stays local.
  const rec = at(t, P7.cues.asleep, P7.cues.asleep + 0.6);
  if (rec > 0)
    layer(ctx, rec, () => {
      type(ctx, "last contact record · kept locally", bar.x, bar.y + 148, 18, C.muted, "MV Sans");
      type(ctx, "no automatic retry", bar.x, bar.y + 184, 18, TOKENS.labelCaption, "MV Sans");
    });

  // The profile figure at 45%.
  drawFigure(ctx, t, images, "profile", 1420, 560, 486, { alpha: 0.7, seed: 57 });

  const f = sampleAt(t);
  beatRings(ctx, bar.x + bar.w - 90, bar.y + 48, t, {
    alpha: 0.1, maxR: 200, period: audio()?.period ?? 60 / 130,
    phase: audio()?.phase ?? 0, count: 1,
  });

  caption(ctx, line, t, { x: 146, y: 940, width: 1620, size: 56 }, diag);
  diag.asleep = { barIn, retry: false };
}

// ---------------------------------------------------------------------------
// S54  200.652-205.811  plate: the figure becomes an outline, the point stays
// ---------------------------------------------------------------------------
function s54(ctx, t, line, diag) {
  ground(ctx, t, [1200, 520], true);
  const f = sampleAt(t);
  const period = audio()?.period ?? 60 / 130;
  const phase0 = audio()?.phase ?? 0;

  // Long fixed take; the content holds 55% of frame height.
  const h = 594;
  const fade = ease(at(t, P7.cues.fadeToOutline, P7.cues.fadeToOutline + 2.0));
  drawFigure(ctx, t, images, "lowlight", 1290, 540, h, {
    alpha: (1 - fade) * 0.95, seed: 61, rim: true, rimAlpha: 0.08 * (1 - fade),
  });
  if (fade > 0)
    drawFigure(ctx, t, images, "silhouette", 1290, 540, h, {
      alpha: fade * 0.75, seed: 61,
    });

  // Only one old touch point on the left, and it keeps its brightness while
  // everything else dims. Nothing is dismantled layer by layer.
  const px = 420;
  const py = 520;
  node(ctx, px, py, t, { r: 9, color: C.hot, pulse: 0.4 + 0.6 * f.beatPulse });
  disc(ctx, px, py, 20 + f.beatPulse * 10, C.cyan, 0.22, false, 2);
  stroke(ctx, [[px + 40, py], [px + 300, py]], C.edge, 1.4, 0.4 * (1 - fade));
  beatRings(ctx, px, py, t, { alpha: 0.14, maxR: 340, period, phase: phase0, count: 2 });

  caption(ctx, line, t, { x: 146, y: 940, width: 900, size: 56 }, diag);
  diag.outline = { fade, pointKept: true };
}

// ---------------------------------------------------------------------------
// S55  205.811-209.811  model: one last call, and a decaying ring
// ---------------------------------------------------------------------------
function s55(ctx, t, line, diag) {
  ground(ctx, t, [1100, 520], true);
  const f = sampleAt(t);
  const period = audio()?.period ?? 60 / 130;
  const phase0 = audio()?.phase ?? 0;

  nodeGrid(ctx, t, {
    alpha: 0.1 * (0.7 + 0.6 * f.lowEnv) * (1 - ease(at(t, P7.cues.decay, P7.cues.ringGone)) * 0.7),
    step: 108, beatPulse: f.beatPulse, lowEnv: f.lowEnv, seed: 211,
  });

  const [ox, oy] = [420, 520];
  // The last call: one carrier, one direction, no return leg, no online marker.
  const go = ease(at(t, P7.cues.lastCall, P7.cues.lastCall + 1.5));
  if (go > 0) {
    trace(ctx, ORIGIN_PATH, go, C.cyan, 2.2, 0.65 * (1 - ease(at(t, P7.cues.decay, P7.cues.ringGone)) * 0.5));
    const [hx, hy] = along(ORIGIN_PATH, go);
    if (go < 1) node(ctx, hx, hy, t, { r: 7, color: C.hot, pulse: 0.4 + 0.6 * f.beatPulse });
  }
  node(ctx, ox, oy, t, { r: 9, color: C.hot, pulse: 0.4 + 0.6 * f.beatPulse });

  // After 207.45 only a slowly decaying cyan ring remains.
  const decayK = ease(at(t, P7.cues.decay, P7.cues.ringGone));
  if (decayK < 1) {
    const rings = 3;
    for (let i = 0; i < rings; i++) {
      const k = clamp(decayK - i * 0.22);
      if (k >= 1) continue;
      const rr = mix(90, 900, k) + i * 40;
      const a = (1 - k) * (1 - i * 0.28) * 0.55;
      if (a <= 0.01) continue;
      layer(ctx, a, () => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(ox, oy, rr, 0, Math.PI * 2);
        ctx.strokeStyle = C.cyan;
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();
      });
    }
  }
  beatRings(ctx, ox, oy, t, {
    alpha: 0.18 * (1 - decayK), maxR: 420, period, phase: phase0, count: 2,
  });

  caption(ctx, line, t, { x: 146, y: 940, width: 900, size: 56 }, diag);
  diag.lastCall = { go, decayK };
}

// ---------------------------------------------------------------------------
// S56  209.811-211.957596  model: the credits, held to the exact file end
// ---------------------------------------------------------------------------
function s56(ctx, t, line, diag) {
  // A still deep-blue field. No new plot, no camera, no beat response.
  ground(ctx, t, [1100, 520], true);

  // The tail ring goes out of sight.
  const gone = ease(at(t, P7.cues.creditsIn, P7.cues.ringGone));
  if (gone < 1) {
    layer(ctx, (1 - gone) * 0.3, () => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(420, 520, mix(900, 1100, gone), 0, Math.PI * 2);
      ctx.strokeStyle = C.cyan;
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();
    });
  }

  // The credits fade in over 0.30s, hold to 211.558, then the whole frame fades
  // out over the last 0.40s and the file ends on the still deep blue.
  const inK = ease(at(t, P7.cues.creditsIn, P7.cues.creditsIn + 0.3));
  const outK = at(t, P7.cues.creditsHold, P7.end);
  const a = inK * (1 - outK);

  const x = 300;
  let y = 300;
  const lines = [
    ["world.execute(me);", 30, C.white, "MV Serif"],
    ["music & lyrics — Mili · Miracle Milk (2016)", 20, C.muted, "MV Sans"],
    ["", 10, C.muted, "MV Sans"],
    ["character & interface — original community fan work", 20, C.muted, "MV Sans"],
    ["every frame drawn in code; no third-party footage", 20, C.muted, "MV Sans"],
    ["", 10, C.muted, "MV Sans"],
    ["独立社区二创 · DeepSeek 主题", 20, C.muted, "MV Sans"],
    ["非 DeepSeek 官方作品，未获官方授权", 20, C.muted, "MV Sans"],
    ["本片含 AI 生成内容（依 Mili 版权指引标注）", 18, TOKENS.labelCaption, "MV Sans"],
    ["", 10, C.muted, "MV Sans"],
    ["制作方法参考同期两个社区二创工程，未使用其素材与代码", 17, TOKENS.labelCaption, "MV Sans"],
  ];
  layer(ctx, a, () => {
    lines.forEach(([text, size, color, font]) => {
      if (text) {
        type(ctx, text, x, y, size, color, font);
        y += size * 1.85;
      } else {
        y += 24;
      }
    });
    stroke(ctx, [[x, 262], [x + 620, 262]], C.cyan, 1.6, 0.5);
  });

  // The frame fades to the deep blue at the very end.
  if (outK > 0)
    layer(ctx, outK, () => {
      ctx.fillStyle = "#07161f";
      ctx.fillRect(0, 0, W, 1080);
    });

  // No lyric is drawn here; S56 carries no line.
  caption(ctx, line, t, { x: 146, y: 940, width: 1620, size: 56 }, diag);
  diag.credits = { in: inK, out: outK, still: true };
}

const RENDERERS = [s51, s52, s53, s54, s55, s56];

export function renderP7(ctx, t, line, forceIndex = -1) {
  if (forceIndex < 0 && (t < P7.start || t >= P7.end)) return null;
  const i =
    forceIndex >= 0
      ? forceIndex
      : P7.shots.findIndex((v, n) => n < 6 && t >= v && t < P7.shots[n + 1]);
  if (i < 0 || i >= RENDERERS.length) return null;
  const diag = { time: t, shot: `S${String(51 + i).padStart(2, "0")}`, ready: !!images.bust };
  RENDERERS[i](ctx, t, line, diag);
  return diag;
}
