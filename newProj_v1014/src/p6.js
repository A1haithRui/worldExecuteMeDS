// Sixth segment: S44-S50, song time [162.805, 188.483).
//
// The consequence section, built from the storyboard's own shot text:
//   S44 all local resources fire along one wide cyan channel; the reply stays empty
//   S45 the front figure at 88%, the channel leaving past her on both sides
//   S46 back to the SAME palm coordinate as S18, the far white point never arrives
//   S47 three waves fold back into the grid and trap the dark figure
//   S48 the grid becomes a memory cross-section and one confirmation is chosen
//   S49 the cached chat returns; three saved questions replay, no active cursor
//   S50 two sampled curves approach but stay one cell apart
//
// Two rules from the storyboard that this file honours deliberately: S46 must
// register on the same palm coordinate and hand width as S18, and S50's
// intersection is a bounded graphic relation -- the reference film's
// heart-shaped boundary is explicitly not reproduced.
import {
  W, C, clamp, mix, phase, ease, out, at, layer, stroke, disc, rect, type,
  point, ground, caption, route, polyline, along, trace, loadImages,
} from "./mv-draw.js";
import { TOKENS, chatWindow, messageRow, reasoningRow } from "./engine/chat.js";
import {
  node, nodeGrid, dataColumns, signalPath, waveform, beatRings,
} from "./engine/model.js";
import { spec, typewriter } from "./engine/type.js";
import { drawFigure } from "./engine/portrait.js";
import { sampleAt, audio, onsetPulses } from "./engine/audio.js";
import { P0 } from "./p0.js";

export const P6 = Object.freeze({
  start: 162.805,
  end: 188.483,
  shots: [162.805, 166.016, 169.824, 173.643, 177.246, 180.857, 184.54, 188.483],
  cues: {
    sourceGrow: 162.9,
    channelOut: 163.5,
    fireFull: 164.4,
    channelPast: 166.3,
    redPortOut: 168.2,
    palmIn: 169.95,
    wave1: 170.8,
    wave2: 171.6,
    wave3: 172.4,
    foldIn: 174.0,
    trap: 175.4,
    section: 177.6,
    compare: 178.6,
    choose: 179.9,
    cacheIn: 181.1,
    replay: 181.8,
    answers: 183.2,
    curvesIn: 184.9,
    intersect: 187.2,
  },
});

const { images, ready } = loadImages({
  bust: "/assets/character/deepseek_bust_v3.png",
  silhouette: "/assets/character/v4/deepseek_bust_v4_silhouette.png",
  palm: "/assets/character/v4/deepseek_palm_v4_closeup_native.png",
});
export const p6Ready = ready;

// ---------------------------------------------------------------------------
// S44  162.805-166.016  model: everything fires down one channel
// ---------------------------------------------------------------------------
function s44(ctx, t, line, diag) {
  ground(ctx, t, [1100, 520]);
  const f = sampleAt(t);
  const period = audio()?.period ?? 60 / 130;
  const phase0 = audio()?.phase ?? 0;

  nodeGrid(ctx, t, {
    alpha: 0.18 * (0.7 + 0.6 * f.lowEnv), step: 96,
    beatPulse: f.beatPulse, lowEnv: f.lowEnv, seed: 171,
  });

  const source = [1120, 430];
  const end = [1660, 560];

  // The eye's point, carried in from S43, opens into the emission source.
  const grow = ease(at(t, P6.cues.sourceGrow, P6.cues.sourceGrow + 0.8));
  layer(ctx, 0.5 + 0.5 * grow, () => {
    const g = ctx.createRadialGradient(source[0], source[1], 0, source[0], source[1], 60 + grow * 220);
    g.addColorStop(0, "rgba(131,233,230,.55)");
    g.addColorStop(1, "rgba(37,189,212,0)");
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = g;
    ctx.fillRect(source[0] - 300, source[1] - 300, 600, 600);
    ctx.restore();
  });
  node(ctx, source[0], source[1], t, { r: 8 + grow * 6, color: C.hot, pulse: 0.4 + 0.6 * f.beatPulse });

  // The coordinate axis and the waveform converge into one wide cyan channel.
  const conv = ease(at(t, P6.cues.channelOut, P6.cues.channelOut + 1.1));
  const axisY = mix(760, 560, conv);
  const waveY = mix(300, 520, conv);
  layer(ctx, 0.5 * (1 - conv * 0.7), () => {
    stroke(ctx, [[320, axisY], [source[0], axisY]], C.edge, 1.4);
    stroke(ctx, [[source[0], mix(180, 300, conv)], [source[0], axisY]], C.edge, 1.4);
  });
  layer(ctx, 0.45 * (1 - conv * 0.6), () =>
    waveform(ctx, 320, waveY - 40, 760, 80, t, {
      bars: 60, span: 2.0, series: "mid", alpha: 0.7, minBar: 2,
    }),
  );

  // The channel itself: a wide tapered band from the source to the empty port.
  const out_ = ease(at(t, P6.cues.channelOut, P6.cues.fireFull));
  if (out_ > 0) {
    const tipX = mix(source[0], end[0], out_);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.55;
    const halfW = mix(6, 96, out_ * conv + 0.2);
    const g = ctx.createLinearGradient(source[0], 0, tipX, 0);
    g.addColorStop(0, "rgba(37,189,212,.75)");
    g.addColorStop(1, "rgba(131,233,230,.35)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(source[0], source[1] - 10);
    ctx.lineTo(tipX, mix(source[1], end[1], out_) - halfW);
    ctx.lineTo(tipX, mix(source[1], end[1], out_) + halfW);
    ctx.lineTo(source[0], source[1] + 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Onsets travel down the channel.
    onsetPulses(t, 0.7, 0.2).forEach((o) => {
      const q = Math.min(1, o.age / 0.5);
      const a = (1 - q) * (0.4 + 0.7 * o.strength);
      if (a <= 0.02) return;
      const px = mix(source[0], tipX, q);
      const py = mix(source[1], mix(source[1], end[1], out_), q);
      disc(ctx, px, py, 14 + q * 40, C.hot, a * 0.5, false, 2.4);
    });
  }

  // The port receives and stays empty.
  layer(ctx, 0.95, () => {
    disc(ctx, end[0], end[1], 15, C.muted, 0.9, false, 2.4);
    type(ctx, "empty", end[0], end[1] + 44, 18, C.muted, "MV Mono", "center");
  });
  const arrive = at(t, P6.cues.fireFull, P6.cues.fireFull + 0.6);
  if (arrive > 0)
    disc(ctx, end[0], end[1], 15 + arrive * 70, C.hot, 0.4 * (1 - arrive), false, 2);
  beatRings(ctx, source[0], source[1], t, { alpha: 0.18, maxR: 320, period, phase: phase0, count: 2 });

  caption(ctx, line, t, { x: 146, y: 940, width: 1580, size: 56 }, diag);
  diag.channel = { out: out_, conv, empty: true };
}

// ---------------------------------------------------------------------------
// S45  166.016-169.824  plate: the channel leaves past her on both sides
// ---------------------------------------------------------------------------
function s45(ctx, t, line, diag) {
  ground(ctx, t, [1280, 500], true);
  const f = sampleAt(t);
  const period = audio()?.period ?? 60 / 130;
  const phase0 = audio()?.phase ?? 0;

  // The channel arrives from the left, splits around her and leaves right.
  const past = ease(at(t, P6.cues.channelPast, P6.cues.channelPast + 1.1));
  const band = (y0, y1, alpha) => {
    if (alpha <= 0.01) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = alpha;
    const g = ctx.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, "rgba(37,189,212,0)");
    g.addColorStop(0.35, "rgba(37,189,212,.5)");
    g.addColorStop(1, "rgba(131,233,230,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, y0, W, y1 - y0);
    ctx.restore();
  };
  band(mix(430, 210, past), mix(500, 268, past), 0.5 * past);
  band(mix(600, 800, past), mix(670, 858, past), 0.45 * past);

  drawFigure(ctx, t, images, "bust", 1290, 520, 950, { rim: true, seed: 41, rimAlpha: 0.1 });

  // Red only on the failing port leaving frame.
  const red = at(t, P6.cues.redPortOut, P6.cues.redPortOut + 0.5);
  if (red > 0) {
    const y = 268;
    const x = mix(-40, 96, ease(red));
    layer(ctx, red, () => {
      disc(ctx, x, y, 13, C.danger, 0.95, false, 2.4);
      stroke(ctx, [[x - 11, y - 11], [x + 11, y + 11]], C.danger, 2.2);
      stroke(ctx, [[x - 11, y + 11], [x + 11, y - 11]], C.danger, 2.2);
      type(ctx, "port lost", x + 30, y + 6, 17, C.danger, "MV Mono");
    });
  }
  beatRings(ctx, 1290, 620, t, { alpha: 0.12, maxR: 300, period, phase: phase0, count: 2 });

  caption(ctx, line, t, { x: 146, y: 940, width: 900, size: 56 }, diag);
  diag.bands = past;
}

// ---------------------------------------------------------------------------
// S46  169.824-173.643  plate: the same palm as S18, and no white point
// ---------------------------------------------------------------------------
function s46(ctx, t, line, diag) {
  // Same registration as S18: identical palm centre, identical hand width, and
  // the same draw rect relative to the image, so the two shots land on the very
  // same pixel coordinate. The storyboard calls this out explicitly.
  const [px, py] = P0.palm;
  const s = P0.handScale;
  const x = px - 432 * s;
  const y = py - 296 * s;

  // Only the background depth moves; the hand itself is fixed.
  const depth = 1 + 0.06 * ease(at(t, P6.cues.palmIn, P6.cues.palmIn + 1.8));
  ctx.save();
  ctx.translate(px, py);
  ctx.scale(depth, depth);
  ctx.translate(-px, -py);
  ground(ctx, t, [px, py], true);
  ctx.restore();

  const f = sampleAt(t);
  const period = audio()?.period ?? 60 / 130;
  const phase0 = audio()?.phase ?? 0;

  layer(ctx, 1, () => ctx.drawImage(images.palm, x, y, 757 * s, 732 * s));

  // Three sonar waves reach left and stop off frame. These carry the shot's
  // motion, so they are wide and bright rather than thin ticks.
  [[P6.cues.wave1, 1.5], [P6.cues.wave2, 1.75], [P6.cues.wave3, 2.0]].forEach(([start, life], i) => {
    const k = at(t, start, start + life);
    if (k <= 0) return;
    const rr = 90 + k * 1180;
    ctx.save();
    ctx.globalAlpha = (1 - k) * 0.6;
    ctx.beginPath();
    ctx.arc(px - 40, py + 30, rr, Math.PI * 0.58, Math.PI * 1.42);
    ctx.strokeStyle = C.cyan;
    ctx.lineWidth = 5 + (1 - k) * 9;
    ctx.stroke();
    ctx.globalAlpha = (1 - k) * 0.25;
    ctx.lineWidth = 22;
    ctx.stroke();
    ctx.restore();
    // The leading edge reads as a moving front.
    const ax = px - 40 + Math.cos(Math.PI * 1.0) * rr;
    layer(ctx, (1 - k) * 0.8, () => disc(ctx, ax, py + 30, 5, C.hot, 0.8));
  });

  // Only the old cyan touch point. The far white point never appears.
  const touch = at(t, P6.cues.palmIn, P6.cues.palmIn + 0.5);
  node(ctx, px, py, t, {
    r: 7, color: C.hot, alpha: touch, pulse: 0.35 + 0.65 * f.beatPulse,
  });
  disc(ctx, px, py, 22 + (1 - touch) * 40, C.cyan, 0.4 * (1 - touch), false, 2);
  beatRings(ctx, px, py, t, { alpha: 0.2, maxR: 300, period, phase: phase0, count: 2 });

  // The palm sits low, so the caption goes to the upper band, exactly as S18.
  caption(ctx, line, t, { x: 146, y: 210, width: 1000, size: 56 }, diag);
  diag.palm = { x: px, y: py, scale: s, depth, whiteArrived: false };
}

// ---------------------------------------------------------------------------
// S47  173.643-177.246  model: the waves fold back and trap the figure
// ---------------------------------------------------------------------------
function s47(ctx, t, line, diag) {
  ground(ctx, t, [1040, 520]);
  const f = sampleAt(t);
  const period = audio()?.period ?? 60 / 130;
  const phase0 = audio()?.phase ?? 0;

  const fold = ease(at(t, P6.cues.foldIn, P6.cues.trap + 0.6));
  // The grid tightens, but the cyan energy stays full: no early lights-out.
  const step = mix(112, 74, fold);
  nodeGrid(ctx, t, {
    alpha: (0.15 + 0.08 * fold) * (0.7 + 0.6 * f.lowEnv),
    step, beatPulse: f.beatPulse, lowEnv: f.lowEnv, seed: 181,
  });

  // The dark figure, overhead and far: 28% of frame height.
  drawFigure(ctx, t, images, "silhouette", 1040, 540, 302, { alpha: 0.95, seed: 43 });

  // Three waves fold back in and become the boundaries of the trap.
  const edges = [
    polyline([[1040, 120], [1400, 320], [1400, 780], [1040, 940]], false),
    polyline([[1040, 120], [660, 320], [660, 780], [1040, 940]], false),
    polyline([[300, 540], [660, 300], [1040, 300], [1400, 300], [1780, 540]], false),
  ];
  edges.forEach((e, i) => {
    const k = at(t, P6.cues.foldIn + i * 0.32, P6.cues.foldIn + i * 0.32 + 1.0);
    if (k <= 0) return;
    layer(ctx, k * 0.85, () => trace(ctx, e, 1, i === 2 ? C.cyan : C.cyan, 2, 0.8));
    // The grid energy stays at full brightness throughout.
    signalPath(ctx, e, t, along, {
      packets: 2, speed: 0.3 + i * 0.05, color: C.cyan, packetColor: C.hot,
      baseAlpha: 0, width: 2, packetR: 4, beatPulse: f.beatPulse, alpha: k,
    });
  });
  layer(ctx, 0.75, () => {
    type(ctx, "the far exit is off frame", 150, 190, 19, C.muted, "MV Sans");
  });
  beatRings(ctx, 1040, 540, t, { alpha: 0.14, maxR: 340, period, phase: phase0, count: 2 });

  caption(ctx, line, t, { x: 146, y: 940, width: 1580, size: 56 }, diag);
  diag.trap = { fold, step };
}

// ---------------------------------------------------------------------------
// S48  177.246-180.857  model: the memory cross-section, one confirmation kept
// ---------------------------------------------------------------------------
function s48(ctx, t, line, diag) {
  ground(ctx, t, [1040, 520]);
  const f = sampleAt(t);

  const open = ease(at(t, P6.cues.section, P6.cues.section + 0.9));
  nodeGrid(ctx, t, {
    alpha: 0.1 * (0.7 + 0.6 * f.lowEnv) * (1 - open * 0.6), step: 104,
    beatPulse: f.beatPulse, lowEnv: f.lowEnv, seed: 191,
  });

  // Three large cells: the earlier point set, the feedback path, the palm touch.
  const cells = [
    { x: 200, y: 240, w: 480, h: 620, key: "points", label: "point set" },
    { x: 720, y: 240, w: 480, h: 620, key: "path", label: "feedback path" },
    { x: 1240, y: 240, w: 480, h: 620, key: "palm", label: "palm touch" },
  ];
  const chosen = 2;
  const compareCycle = 0.42;
  const choosing = t < P6.cues.choose;
  const active = choosing
    ? Math.floor(Math.max(0, t - P6.cues.compare) / compareCycle) % 3
    : chosen;
  cells.forEach((c, i) => {
    const k = at(t, P6.cues.section + i * 0.14, P6.cues.section + i * 0.14 + 0.6);
    if (k <= 0) return;
    const isActive = i === active && t >= P6.cues.compare;
    layer(ctx, k, () => {
      rect(ctx, c.x, c.y, c.w, c.h, isActive ? "#123e4c" : "#0b1a2a", 18,
        isActive ? TOKENS.accent : TOKENS.border1);
      type(ctx, c.label, c.x + 24, c.y + 46, 18,
        isActive ? C.hot : TOKENS.labelCaption, "MV Mono");
      if (c.key === "points") {
        for (let j = 0; j < 14; j++) {
          const px = c.x + 70 + (j % 5) * 80;
          const py = c.y + 140 + Math.floor(j / 5) * 110;
          node(ctx, px, py, t, { r: 3.4, color: C.cyan, alpha: 0.8, pulse: 0.3, seed: j });
        }
      } else if (c.key === "path") {
        const p = route([[c.x + 60, c.y + 480], [c.x + 240, c.y + 260], [c.x + 400, c.y + 420], [c.x + 420, c.y + 200]]);
        trace(ctx, p, 1, C.cyan, 2.2, 0.75);
      } else {
        disc(ctx, c.x + c.w / 2, c.y + c.h / 2 + 20, 70, C.cyan, 0.14);
        node(ctx, c.x + c.w / 2, c.y + c.h / 2 + 20, t, {
          r: 10, color: C.hot, pulse: 0.4 + 0.6 * f.beatPulse,
        });
      }
    });
  });

  // The selection settles on the one confirmation that was ever received.
  const settle = at(t, P6.cues.choose, P6.cues.choose + 0.45);
  if (settle > 0) {
    const c = cells[chosen];
    layer(ctx, settle, () => {
      stroke(ctx, [
        [c.x, c.y - 14], [c.x + c.w, c.y - 14], [c.x + c.w, c.y + c.h + 14], [c.x, c.y + c.h + 14], [c.x, c.y - 14],
      ], C.hot, 2.4);
      type(ctx, "one confirmation", c.x + c.w / 2, c.y + c.h + 56, 19, C.hot, "MV Sans", "center");
    });
  }
  beatRings(ctx, 1480, 540, t, {
    alpha: 0.14, maxR: 280, period: audio()?.period ?? 60 / 130,
    phase: audio()?.phase ?? 0, count: 2,
  });

  caption(ctx, line, t, { x: 146, y: 940, width: 1580, size: 56 }, diag);
  diag.section = { open, active, chosen };
}

// ---------------------------------------------------------------------------
// S49  180.857-184.540  chat: the cache replays, with no active cursor
// ---------------------------------------------------------------------------
function s49(ctx, t, line, diag) {
  ground(ctx, t, [1120, 520], true);
  const f = sampleAt(t);
  const period = audio()?.period ?? 60 / 130;
  const phase0 = audio()?.phase ?? 0;

  const R = { x: 300, y: 200, w: 1320, h: 660 };
  const win = chatWindow(ctx, R, t, {
    title: "deepseek",
    subtitle: "/ cached",
    session: "REPLAY",
    state: "idle",
    stateLabel: "cache · no cursor",
    sidebar: false,
    headerH: 88,
    enterAt: P6.cues.cacheIn,
    enterDur: 0.45,
    footer: true,
    footerLabel: "HISTORY ONLY",
  });
  const cx = win.contentX + 40;
  const cw = R.x + R.w - win.contentX - 120;

  // Three saved questions, laid on a diagonal but the window itself stays square.
  const saved = ["can you hear me", "are you still there", "do you remember me"];
  const answerPoint = [R.x + R.w - 150, R.y + 300];
  saved.forEach((q, i) => {
    const start = P6.cues.replay + i * 0.62;
    const k = at(t, start, start + 0.42);
    if (k <= 0) return;
    const y = R.y + 150 + i * 108 + i * 16;
    const x = cx + i * 22;
    layer(ctx, k * 0.9, () => {
      rect(ctx, x, y, cw - 120, 62, "#0d1c2c", 14, TOKENS.border1);
      type(ctx, q, x + 22, y + 40, 19, TOKENS.labelSecondary, "MV Sans");
      // The past echo thumbnail: a cache, not a live reply.
      disc(ctx, answerPoint[0] - 300, y + 31, 9, C.cyan, 0.45, false, 1.6);
      ctx.save();
      ctx.globalAlpha = 0.5;
      stroke(ctx, [[x + cw - 138, y + 31], [answerPoint[0] - 320, y + 31]], C.edge, 1.2);
      ctx.restore();
      type(ctx, "echo", answerPoint[0] - 300, y + 58, 14, TOKENS.labelCaption, "MV Mono", "center");
    });
    // The answers return to the same cyan point on a continuous replay loop.
    // This is a cache read and not a live cursor: the streaks flow at a fixed
    // rate, and nothing on screen tracks the song's playhead position.
    // They are drawn as long bright streaks rather than small cells: a 12px
    // marker barely registers as motion at all.
    const cells = 4;
    const loopPeriod = 1.45;
    const stagger = i * 0.24;
    for (let c = 0; c < cells; c++) {
      const q = ((t - start) / loopPeriod + stagger + c / cells) % 1;
      if (q < 0 || q > 1) continue;
      const e = ease(q);
      const sx = mix(x + cw - 200, answerPoint[0], e);
      const sy = mix(y + 31, answerPoint[1] + 90, e);
      const a = Math.sin(Math.PI * q) * 0.85;
      layer(ctx, a, () => {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const g = ctx.createLinearGradient(sx - 150, sy, sx + 30, sy);
        g.addColorStop(0, "rgba(37,189,212,0)");
        g.addColorStop(0.75, "rgba(131,233,230,.75)");
        g.addColorStop(1, "rgba(190,245,250,.95)");
        ctx.fillStyle = g;
        ctx.fillRect(sx - 150, sy - 7, 180, 14);
        ctx.restore();
      });
    }
  });
  const answers = at(t, P6.cues.answers, P6.cues.answers + 0.6);
  if (answers > 0) {
    node(ctx, answerPoint[0], answerPoint[1] + 90, t, {
      r: 9, color: C.hot, alpha: answers, pulse: 0.4 + 0.6 * f.beatPulse,
    });
    layer(ctx, answers, () =>
      type(ctx, "all answers land on one point", answerPoint[0] - 40, answerPoint[1] + 140, 17,
        C.muted, "MV Sans", "right"),
    );
  }
  beatRings(ctx, answerPoint[0], answerPoint[1] + 90, t, {
    alpha: 0.16, maxR: 200, period, phase: phase0, count: 2,
  });

  caption(ctx, line, t, { x: 146, y: 940, width: 1620, size: 56 }, diag);
  diag.replay = { count: saved.length, answers };
}

// ---------------------------------------------------------------------------
// S50  184.540-188.483  model: two sampled curves, one cell apart
// ---------------------------------------------------------------------------
function s50(ctx, t, line, diag) {
  ground(ctx, t, [1040, 540]);
  const f = sampleAt(t);
  const period = audio()?.period ?? 60 / 130;
  const phase0 = audio()?.phase ?? 0;

  nodeGrid(ctx, t, {
    alpha: 0.12 * (0.7 + 0.6 * f.lowEnv), step: 112,
    beatPulse: f.beatPulse, lowEnv: f.lowEnv, seed: 201,
  });

  const x0 = 200;
  const x1 = 1720; // sampling lines span 80% of the width
  const midY = 540;
  const gap = 82; // one cell apart, and never closer
  const drawn = ease(at(t, P6.cues.curvesIn, P6.cues.intersect + 0.6));

  const curve = (sign, samples) => {
    const pts = [];
    for (let i = 0; i <= 160; i++) {
      const u = i / 160;
      const x = mix(x0, x1, u);
      const y = midY + sign * gap / 2 + Math.sin(u * Math.PI * 2.6) * 190 * (1 - u * 0.25);
      pts.push([x, y]);
    }
    // Draw only as far as the local computation has reached.
    const upto = Math.max(1, Math.floor(pts.length * drawn));
    layer(ctx, 0.9, () => {
      ctx.save();
      ctx.strokeStyle = sign < 0 ? C.cyan : C.hot;
      ctx.lineWidth = 2.6;
      ctx.lineCap = "round";
      ctx.beginPath();
      pts.slice(0, upto).forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
      ctx.stroke();
      ctx.restore();
    });
    // Sampled cells along the curve.
    const step = 12;
    for (let i = 0; i < upto; i += step) {
      const [px, py] = pts[i];
      layer(ctx, samples, () => {
        rect(ctx, px - 5, py - 4, 10, 8, sign < 0 ? C.cyan : C.hot, 2);
      });
    }
  };
  const samples = at(t, P6.cues.curvesIn + 0.2, P6.cues.intersect);
  curve(-1, samples);
  curve(1, samples);

  // The crossing is supplied by this end's assumption; the far samples are missing.
  const near = at(t, P6.cues.intersect, P6.cues.intersect + 0.6);
  if (near > 0) {
    const mx = mix(x0, x1, 0.62);
    layer(ctx, near, () => {
      disc(ctx, mx, midY, 11, C.cyan, 0.95, false, 2.2);
      stroke(ctx, [[mx - 30, midY - 26], [mx + 30, midY + 26]], C.cyan, 1.4, 0.5);
      type(ctx, "assumed crossing", mx + 40, midY - 18, 17, C.cyan, "MV Mono");
      // The far half of the crossing stays hollow.
      disc(ctx, mx + 96, midY + 34, 11, C.muted, 0.9, false, 2);
      type(ctx, "far samples missing", mx + 118, midY + 82, 16, C.muted, "MV Sans");
    });
  }
  beatRings(ctx, mix(x0, x1, 0.62), midY, t, { alpha: 0.12, maxR: 240, period, phase: phase0, count: 2 });

  caption(ctx, line, t, { x: 146, y: 940, width: 1580, size: 56 }, diag);
  diag.curves = { drawn, gap };
}

const RENDERERS = [s44, s45, s46, s47, s48, s49, s50];

export function renderP6(ctx, t, line, forceIndex = -1) {
  if (forceIndex < 0 && (t < P6.start || t >= P6.end)) return null;
  const i =
    forceIndex >= 0
      ? forceIndex
      : P6.shots.findIndex((v, n) => n < 7 && t >= v && t < P6.shots[n + 1]);
  if (i < 0 || i >= RENDERERS.length) return null;
  const diag = { time: t, shot: `S${String(44 + i).padStart(2, "0")}`, ready: !!images.bust };
  RENDERERS[i](ctx, t, line, diag);
  return diag;
}
