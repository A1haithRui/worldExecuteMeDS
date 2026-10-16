import {
  W,
  H,
  C,
  clamp,
  mix,
  phase,
  ease,
  out,
  at,
  layer,
  stroke,
  disc,
  rect,
  type,
  point,
  ground,
  caption,
  route,
  along,
  trace,
  loadImages,
} from "./mv-draw.js";
import { drawP0Join } from "./p0.js";
import { idle, rimPulse } from "./engine/portrait.js";
import {
  nodeGrid,
  dataColumns,
  signalPath,
  beatRings,
} from "./engine/model.js";
import { sampleAt, audio, onsetPulses } from "./engine/audio.js";

export const P1 = Object.freeze({
  start: 74.045,
  end: 95.465,
  shots: [
    74.045, 77.576, 81.351, 82.833, 85.078, 88.587, 90.197, 92.015, 95.465,
  ],
  cues: {
    give: 76.959,
    shieldHits: [78.3, 79.05, 79.75, 80.35],
    finHint: 82.5,
    finHintEnd: 82.78,
    echoWhite: 84.268,
    coordinateLock: 87.922,
    current: 90.45,
    alternate: 91.04,
    secondWatch: 94.93,
  },
  eventStatus: "pending_listening",
  alternate: "outline_fallback_no_alternate_art",
  cat: "brief_contour_fallback",
  finAnchors: {
    left: { rootA: [438, 570], rootB: [452, 624], tip: [332, 475] },
    right: { rootA: [897, 548], rootB: [903, 620], tip: [1040, 460] },
  },
  joinNode: [686, 398.6],
});
const { images, ready } = loadImages({
  bust: "/assets/character/deepseek_bust_v3.png",
  silhouette: "/assets/character/v4/deepseek_bust_v4_silhouette.png",
});
let finHint;
export function getP1DerivedLayer() { return finHint; }
export const p1Ready = ready.then(() => {
  // Rejected full-colour warp is not used. A very short monochrome contour study
  // suppresses the old fins first, then substitutes one pointed outline per root.
  finHint = document.createElement("canvas");
  finHint.width = 1342;
  finHint.height = 1704;
  const g = finHint.getContext("2d");
  g.drawImage(images.silhouette, 0, 0);
  g.globalCompositeOperation = "destination-out";
  for (const poly of [
    [
      [280, 620],
      [400, 540],
      [461, 550],
      [465, 650],
      [390, 677],
      [280, 650],
    ],
    [
      [875, 525],
      [1065, 568],
      [1075, 635],
      [930, 666],
      [875, 620],
    ],
  ]) {
    g.beginPath();
    poly.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
    g.fill();
  }
  g.globalCompositeOperation = "source-over";
  g.fillStyle = "#173749";
  for (const bridge of [
    [
      [438, 570],
      [480, 560],
      [490, 650],
      [452, 624],
    ],
    [
      [897, 548],
      [850, 535],
      [850, 650],
      [903, 620],
    ],
  ]) {
    g.beginPath();
    bridge.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
    g.fill();
  }
  for (const f of Object.values(P1.finAnchors)) {
    g.beginPath();
    g.moveTo(...f.rootA);
    g.quadraticCurveTo(f.tip[0], f.tip[1] + 30, ...f.tip);
    g.quadraticCurveTo(f.tip[0] + 25, f.tip[1] + 90, ...f.rootB);
    g.fillStyle = "#173749";
    g.fill();
    g.strokeStyle = C.cyan;
    g.lineWidth = 3;
    g.stroke();
  }
});
function portrait(
  ctx,
  t,
  pose,
  { silhouette = false, hint = false, alpha = 1, animate = true, seed = 0, rim = null } = {},
) {
  // A slow breath, bob and sway: a plate that holds one PNG perfectly still
  // reads as a still image no matter what the ambient layer does.
  const b = animate ? idle(t, { seed, bobAmp: pose.bobAmp ?? 5 }) : { bobY: 0, breathe: 1, sway: 0 };
  const s = (pose.height / 1438) * b.breathe,
    x = pose.x + b.sway - 671 * s,
    y = pose.y + b.bobY - 847 * s;
  const wantRim = rim === null ? animate && !silhouette && !hint : rim;
  if (wantRim) {
    rimPulse(ctx, pose.x, pose.y + pose.height * 0.06, pose.height * 0.82, t, {
      alpha: 0.13 * alpha,
    });
  }
  layer(ctx, alpha, () =>
    ctx.drawImage(
      hint ? finHint : silhouette ? images.silhouette : images.bust,
      x,
      y,
      1342 * s,
      1704 * s,
    ),
  );
  return {
    s,
    x,
    y,
    eye: [x + 596 * s, y + 526 * s],
    headpiece: [x + 875 * s, y + 430 * s],
  };
}
function frame(ctx, x, y, w, h, alpha = 1) {
  layer(ctx, alpha, () => {
    stroke(
      ctx,
      [
        [x + 38, y],
        [x, y],
        [x, y + 45],
      ],
      C.cyan,
      1.5,
    );
    stroke(
      ctx,
      [
        [x + w - 38, y],
        [x + w, y],
        [x + w, y + 45],
      ],
      C.cyan,
      1.5,
    );
    stroke(
      ctx,
      [
        [x, y + h - 45],
        [x, y + h],
        [x + 38, y + h],
      ],
      C.cyan,
      1.5,
    );
    stroke(
      ctx,
      [
        [x + w - 38, y + h],
        [x + w, y + h],
        [x + w, y + h - 45],
      ],
      C.cyan,
      1.5,
    );
  });
}
function curvePath(kind) {
  const p = new Path2D();
  if (kind === "seed") {
    p.moveTo(75, -195);
    p.bezierCurveTo(180, -150, 170, 60, 55, 165);
    p.bezierCurveTo(-40, 270, -200, 185, -185, 55);
    p.bezierCurveTo(-175, -70, -60, -100, -15, -170);
    p.bezierCurveTo(15, -230, 40, -220, 75, -195);
  } else {
    p.moveTo(0, -175);
    p.bezierCurveTo(90, -230, 210, -170, 230, -70);
    p.bezierCurveTo(285, 80, 175, 205, 75, 200);
    p.bezierCurveTo(15, 230, -25, 215, -75, 200);
    p.bezierCurveTo(-205, 210, -275, 70, -230, -65);
    p.bezierCurveTo(-205, -185, -100, -225, 0, -175);
  }
  p.closePath();
  return p;
}
const seedShape = curvePath("seed"),
  shieldShape = curvePath("shield");
function resource(ctx, kind, t, x, y, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const p = kind === "seed" ? seedShape : shieldShape;
  const fill = ctx.createLinearGradient(-220, 0, 220, 100);
  fill.addColorStop(0, "#0d4657");
  fill.addColorStop(1, "#1f8795");
  ctx.fillStyle = fill;
  ctx.fill(p);
  ctx.strokeStyle = C.cyan;
  ctx.lineWidth = 3;
  ctx.stroke(p);
  ctx.save();
  ctx.clip(p);
  const scan =
    kind === "seed"
      ? mix(-230, 240, at(t, 74.45, 76.45))
      : mix(-210, 240, at(t, 77.7, 79.7));
  ctx.fillStyle = "#83e9e61a";
  ctx.fillRect(-300, scan, 600, 44);
  if (kind === "seed")
    for (let j = 0; j < 3; j++)
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.translate(-70 + i * 48 + j * 14, -30 + j * 57);
        ctx.rotate(-0.5);
        ctx.fillStyle = j === 1 ? C.hot : "#53c3cb";
        ctx.beginPath();
        ctx.ellipse(0, 0, 5, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
  else {
    for (let i = 0; i < 7; i++) {
      const a = (i * Math.PI * 2) / 7;
      stroke(
        ctx,
        [
          [Math.cos(a) * 60, Math.sin(a) * 55],
          [Math.cos(a) * 185, Math.sin(a) * 155],
        ],
        C.hot,
        1,
        0.22,
      );
    }
    disc(ctx, 0, 0, 70, C.hot, 0.16, false, 2);
  }
  ctx.restore();
  if (kind === "seed")
    stroke(
      ctx,
      [
        [6, -179],
        [25, -212],
        [43, -192],
        [59, -231],
        [69, -194],
        [103, -184],
        [79, -163],
      ],
      C.hot,
      5,
    );
  else {
    const leaves = [
      [0, -175],
      [-35, -207],
      [-12, -178],
      [-76, -176],
      [-15, -158],
      [0, -192],
      [26, -163],
      [78, -181],
      [27, -184],
      [40, -215],
      [0, -175],
    ];
    stroke(ctx, leaves, C.hot, 4);
  }
  ctx.restore();
}
function slot(ctx, t) {
  const k = at(t, 74.045, 74.58);
  const r = [
    mix(407, 278, k),
    mix(254.6, 164, k),
    mix(900, 1360, k),
    mix(504, 658, k),
  ];
  rect(ctx, ...r, "#0b2433", mix(0, 22, k), "#285363");
  layer(ctx, k, () => {
    type(ctx, "deepseek", r[0] + 34, r[1] + 49, 26, C.white, "MV Sans");
    type(
      ctx,
      "Resource / 01",
      r[0] + r[2] - 35,
      r[1] + 49,
      18,
      C.muted,
      "MV Sans",
      "right",
    );
    stroke(
      ctx,
      [
        [r[0] + 30, r[1] + 76],
        [r[0] + r[2] - 30, r[1] + 76],
      ],
      C.edge,
      1,
    );
  });
  return k;
}
const giveRoute = route([
  [820, 485],
  [1040, 385],
  [1210, 415],
  [1420, 500],
]);
function exchange(ctx, t, line, diag) {
  const entry = at(t, 74.045, 74.43);
  if (entry < 1) drawP0Join(ctx);
  layer(ctx, entry, () => {
    ground(ctx, t, [920, 480]);
    const f = sampleAt(t);
    const period = audio()?.period ?? 60 / 130;
    const phase0 = audio()?.phase ?? 0;

    nodeGrid(ctx, t, {
      alpha: 0.15 * (0.7 + 0.6 * f.lowEnv),
      step: 104, beatPulse: f.beatPulse, lowEnv: f.lowEnv, seed: 13,
    });
    dataColumns(ctx, t, {
      x: 60, y: 110, w: 1800, h: 800,
      columns: 24, alpha: 0.065 * (0.6 + 0.7 * f.lowEnv),
      focus: [1120, 480], speed: 18, size: 14,
    });

    slot(ctx, t);
    resource(ctx, "seed", t, 760, 486, 1.05);
    type(ctx, "available", 1110, 345, 20, C.muted, "MV Sans");
    trace(ctx, giveRoute, 1, C.cyan, 1, 0.2);

    // The route carries packets continuously...
    signalPath(ctx, giveRoute, t, along, {
      packets: 3, speed: 0.34, color: C.cyan, packetColor: C.hot,
      baseAlpha: 0, width: 2.6, packetR: 5, beatPulse: f.beatPulse,
    });
    const p = at(t, 75.422, 77.25);
    trace(ctx, giveRoute, p, C.hot, 2.4, 0.7);
    for (let i = 0; i < 5; i++) {
      const q = phase(t, 75.45 + i * 0.18, 76.95 + i * 0.1);
      if (q > 0 && q < 1) {
        const v = along(giveRoute, ease(q));
        rect(ctx, v[0] - 5, v[1] - 9, 10, 18, C.hot, 4);
      }
    }

    // ...and every sung onset throws its own pulse down the same route. This is
    // the audio triggering a shot-level event, not only a global grade change.
    onsetPulses(t, 0.85, 0.18).forEach((o) => {
      const q = Math.min(1, o.age / 0.42);
      const v = along(giveRoute, ease(q));
      const a = (1 - q) * (0.35 + 0.7 * o.strength);
      if (a <= 0.012) return;
      disc(ctx, v[0], v[1], 10 + q * 34, C.hot, a * 0.5, false, 2);
      point(ctx, v[0], v[1], false, a, 5);
    });

    point(ctx, 1420, 500, true, 1, 7);
    disc(ctx, 1420, 500, 25 + f.beatPulse * 10, C.white, 0.3 * (1 - 0.4 * f.beatPulse), false, 1);
    beatRings(ctx, 1420, 500, t, { alpha: 0.28, maxR: 230, period, phase: phase0, count: 2 });
    type(
      ctx,
      t >= P1.cues.give ? "shared" : "receiving",
      1420,
      554,
      20,
      C.muted,
      "MV Sans",
      "center",
    );
    const n = at(t, 74.045, 74.66);
    point(ctx, mix(686, 760, n), mix(398.6, 486, n), false, 1 - n, 7);
  });
  caption(ctx, line, t, { x: 146, y: 940, width: 1600, size: 56 }, diag);
  diag.joinNode = P1.joinNode;
  diag.resource = "seed_attachment";
}
function shield(ctx, t, line, diag) {
  ground(ctx, t, [1060, 460]);
  const collapse = at(t, 80.96, 81.351);
  layer(ctx, 1 - collapse, () => {
    resource(ctx, "shield", t, 980, 480, 0.94);
    ctx.save();
    ctx.strokeStyle = C.cyan;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(980, 485, 360, 294, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    P1.cues.shieldHits.forEach((hit, i) => {
      const start = hit - 0.55,
        k = phase(t, start, hit),
        after = phase(t, hit, hit + 0.33),
        yy = 365 + i * 70;
      if (t >= start && t < hit + 0.33) {
        const x = mix(1650, 1310, out(k));
        disc(ctx, x, yy, 6, C.white, 1 - after);
        if (t >= hit)
          disc(
            ctx,
            1310,
            yy,
            8 + after * 44,
            C.hot,
            (1 - after) * 0.6,
            false,
            1.5,
          );
      }
    });
    type(ctx, "noise reduced", 980, 820, 18, C.muted, "MV Sans", "center");
  });
  if (collapse > 0)
    layer(ctx, collapse, () => {
      portrait(ctx, t, catPose(t));
      frame(ctx, 920, 60, 680, 880);
    });
  caption(ctx, line, t, { x: 146, y: 940, width: 1600, size: 56 }, diag);
  diag.shieldHits = P1.cues.shieldHits.filter((v) => v <= t).length;
}
function catPose(t) {
  const k = at(t, 82.68, 83.06);
  return { x: 1260, y: mix(500, 520, k), height: mix(820, 780, k) };
}
function cat(ctx, t, line, diag) {
  ground(ctx, t, [1250, 440], true);
  const isHint = t >= P1.cues.finHint && t < P1.cues.finHintEnd;
  const p = catPose(t),
    landmarks = portrait(ctx, t, p, { hint: isHint });
  frame(ctx, 920, 60, 680, 880, 0.45 * (1 - at(t, 84.92, 85.078)));
  if (t < 82.6) {
    const scan = at(t, 81.351, 82.6);
    stroke(
      ctx,
      [
        [925, mix(100, 490, scan)],
        [1595, mix(100, 490, scan)],
      ],
      C.hot,
      1.5,
      0.6 * (1 - at(t, 82.5, 82.6)),
    );
  }
  if (t >= 82.833) {
    const k = at(t, 82.833, 84.0),
      white = t >= P1.cues.echoWhite;
    for (let i = 0; i < 2; i++) {
      const rr = 40 + i * 48 + 80 * k;
      ctx.save();
      ctx.strokeStyle = white ? C.white : C.cyan;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.75;
      ctx.beginPath();
      ctx.ellipse(
        1060 - 260 * k,
        555,
        rr * 0.35,
        rr,
        -Math.PI * 0.04,
        Math.PI * 0.55,
        Math.PI * 1.45,
      );
      ctx.stroke();
      ctx.restore();
    }
    point(ctx, 650, 555, white, at(t, 83.65, 84.268), 7);
  }
  caption(ctx, line, t, { x: 145, y: 225, width: 670, size: 56 }, diag);
  diag.catMode = isHint ? "short_fin_contour_fallback" : "original_bust";
  diag.landmarks = landmarks;
  diag.finHintWindow = [P1.cues.finHint, P1.cues.finHintEnd];
}
function coordinatePose(t) {
  const k = at(t, 85.078, 87.0),
    settled = at(t, 87.3, P1.cues.coordinateLock);
  return {
    x: mix(1260, 1000, k) + Math.sin((t - 85.078) * 2) * 12 * k * (1 - settled),
    y: mix(520, 505, k) + Math.sin((t - 85.078) * 2.5) * 8 * k * (1 - settled),
    height: mix(780, 345, k),
  };
}
const ackRoute = route([
  [650, 555],
  [630, 310],
  [910, 310],
  [1000, 505],
]);
function locate(ctx, t, line, diag) {
  ground(ctx, t, [1050, 460], true);
  const p = coordinatePose(t);
  portrait(ctx, t, p);
  const k = at(t, 85.078, 87.0);
  frame(
    ctx,
    p.x - p.height * 0.43 - 24,
    p.y - p.height * 0.5 - 24,
    p.height * 0.86 + 48,
    p.height + 48,
    0.6,
  );
  layer(ctx, k * 0.35, () => {
    stroke(
      ctx,
      [
        [420, 505],
        [1540, 505],
      ],
      C.edge,
      1,
    );
    stroke(
      ctx,
      [
        [1000, 180],
        [1000, 830],
      ],
      C.edge,
      1,
    );
  });
  const q = at(t, 86.538, P1.cues.coordinateLock);
  trace(ctx, ackRoute, q, C.white, 1.5, 0.4 * k);
  if (q < 1) point(ctx, ...along(ackRoute, q), true, k, 6);
  const lock = at(t, P1.cues.coordinateLock, 88.2);
  if (lock > 0) {
    disc(ctx, 1000, 505, 20 + lock * 26, C.hot, 0.6 * (1 - lock), false, 2);
    type(ctx, "located", 1000, 764, 20, C.muted, "MV Sans", "center");
  }
  caption(ctx, line, t, { x: 146, y: 940, width: 1620, size: 56 }, diag);
  diag.coordinate = { ...p, locked: t >= P1.cues.coordinateLock };
}
function cursor(ctx, x, y, alpha = 1) {
  layer(ctx, alpha, () => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 4, y + 28);
    ctx.lineTo(x + 12, y + 18);
    ctx.lineTo(x + 23, y + 18);
    ctx.closePath();
    ctx.fillStyle = C.white;
    ctx.fill();
  });
}
function selector(ctx, t, selected = 0, alpha = 1) {
  layer(ctx, alpha, () => {
    type(ctx, "Presentation", 168, 350, 23, C.muted, "MV Sans");
    for (let i = 0; i < 2; i++) {
      rect(
        ctx,
        155,
        390 + i * 100,
        345,
        76,
        i === selected ? "#124454" : "#0b2433",
        12,
        i === selected ? C.cyan : C.edge,
      );
      type(
        ctx,
        i === 0 ? "01  Current" : "02  Outline preview",
        181,
        436 + i * 100,
        22,
        i === selected ? C.white : C.muted,
        "MV Sans",
      );
    }
  });
}
function preview(ctx, t, line, diag) {
  ground(ctx, t, [1100, 450]);
  const k = at(t, 88.587, 89.16);
  rect(
    ctx,
    mix(820, 590, k),
    mix(308, 118, k),
    mix(360, 1080, k),
    mix(393, 738, k),
    "#0a2634",
    20,
    "#285363",
  );
  type(ctx, "deepseek / presentation", 640, 163, 20, C.muted, "MV Sans");
  portrait(ctx, t, { x: mix(1000, 1210, k), y: 505, height: mix(345, 620, k) });
  selector(ctx, t, 0, k);
  const cp = at(t, 89.2, 89.75);
  cursor(ctx, mix(530, 440, cp), mix(330, 428, cp), k);
  if (t > 89.75)
    disc(
      ctx,
      440,
      428,
      8 + at(t, 89.75, 89.96) * 20,
      C.white,
      1 - at(t, 89.75, 89.96),
      false,
      1.5,
    );
  caption(ctx, line, t, { x: 146, y: 954, width: 1600, size: 56 }, diag);
  diag.presentation = "current";
}
function appearancePose(t) {
  const k = at(t, 90.197, 90.65);
  return {
    x: mix(1210, 1210, k),
    y: mix(505, 510, k),
    height: mix(620, 820, k),
  };
}
function appearance(ctx, t, line, diag) {
  ground(ctx, t, [1230, 430], true);
  const selected = t >= P1.cues.alternate;
  const pose = appearancePose(t),
    mask = t >= 90.99 && t < 91.09;
  const landmarks = portrait(ctx, t, pose, { silhouette: selected || mask });
  selector(ctx, t, selected ? 1 : 0);
  frame(ctx, 885, 60, 700, 890, 0.6);
  if (selected)
    type(ctx, "Outline only", 1210, 870, 21, C.muted, "MV Sans", "center");
  const k = at(t, 90.65, P1.cues.alternate);
  cursor(ctx, 440, mix(428, 528, k), 1 - at(t, 91.15, 91.45));
  caption(ctx, line, t, { x: 145, y: 220, width: 670, size: 56 }, diag);
  diag.presentation = selected ? "alternate_outline_fallback" : "original_bust";
  diag.landmarks = landmarks;
  diag.stableWindow = [91.09, 92.015];
}
const watchRoute = route([
    [1390, 287],
    [1400, 440],
    [1000, 470],
    [1000, 505],
  ]),
  watchReturn = route([
    [1000, 505],
    [1000, 650],
    [1220, 690],
    [1390, 687],
  ]);
function watch(ctx, t, line, diag) {
  ground(ctx, t, [1040, 480]);
  const f = sampleAt(t);
  const period = audio()?.period ?? 60 / 130;
  const phase0 = audio()?.phase ?? 0;
  nodeGrid(ctx, t, {
    alpha: 0.13 * (0.7 + 0.6 * f.lowEnv),
    step: 104, beatPulse: f.beatPulse, lowEnv: f.lowEnv, seed: 21,
  });
  dataColumns(ctx, t, {
    x: 60, y: 110, w: 1800, h: 820, columns: 22,
    alpha: 0.058 * (0.6 + 0.7 * f.lowEnv),
    focus: [1040, 480], speed: 16, size: 14,
  });
  const small = at(t, 92.015, 92.68),
    second = at(t, 94.5, P1.cues.secondWatch);
  const zones = [
    [360, 170, 1150, 235],
    [360, 570, 1150, 235],
  ];
  zones.forEach(([x, y, w, h], i) =>
    layer(ctx, small, () => {
      rect(
        ctx,
        x,
        y,
        w,
        h,
        i === 0 ? "#0e3544" : "#0c2c3b",
        16,
        i === 1 && second > 0 ? C.cyan : C.edge,
      );
      type(
        ctx,
        i === 0 ? "watch 01" : "watch 02",
        x + 35,
        y + 46,
        22,
        i === 1 && second > 0 ? C.hot : C.muted,
        "MV Sans",
      );
      stroke(
        ctx,
        [
          [x + 35, y + h - 36],
          [x + w - 35, y + h - 36],
        ],
        i === 0 ? C.cyan : C.hot,
        2,
        i === 0 ? 1 - second : second,
      );
      type(
        ctx,
        i === 0
          ? second < 1
            ? "listening"
            : "held"
          : second < 1
            ? "standby"
            : "listening",
        x + w - 40,
        y + 46,
        19,
        i === 1 && second > 0 ? C.hot : C.muted,
        "MV Sans",
        "right",
      );
      for (let j = 0; j < 3; j++) {
        const xx = x + 90 + j * 250;
        rect(ctx, xx, y + 92, 165, 44, "#123e4c", 9);
        stroke(
          ctx,
          [
            [xx + 18, y + 114],
            [xx + 120, y + 114],
          ],
          C.cyan,
          2,
          (i === 0 ? 1 - second * 0.7 : second * 0.7 + 0.1) *
            (0.55 + 0.8 * f.beatPulse),
        );
      }
      // The listening zone answers each beat with its own ring.
      const zoneOn = i === 0 ? 1 - second * 0.65 : second;
      if (zoneOn > 0.05)
        beatRings(ctx, 1390, y + h / 2, t, {
          alpha: 0.3 * zoneOn, maxR: 160, period, phase: phase0, count: 2,
        });
      point(ctx, 1390, y + h / 2, false, zoneOn, 7);
    }),
  );
  const p = {
    x: mix(1210, 1000, small),
    y: mix(510, 505, small),
    height: mix(820, 302, small),
  };
  portrait(ctx, t, p, { silhouette: true });
  frame(
    ctx,
    p.x - p.height * 0.43 - 15,
    p.y - p.height * 0.5 - 15,
    p.height * 0.86 + 30,
    p.height + 30,
    0.5,
  );
  const q = at(t, 92.9, 93.65),
    r = at(t, 93.65, P1.cues.secondWatch);
  trace(ctx, watchRoute, q, C.hot, 2, 0.5 * small);
  trace(ctx, watchReturn, r, C.hot, 2, 0.5 * small);
  // Both handoff legs keep carrying packets, so the relay reads as live.
  if (small > 0.02) {
    signalPath(ctx, watchRoute, t, along, {
      packets: 2, speed: 0.42, color: C.hot, packetColor: C.hot,
      baseAlpha: 0, width: 2.2, packetR: 4, beatPulse: f.beatPulse, alpha: small,
    });
    signalPath(ctx, watchReturn, t, along, {
      packets: 2, speed: -0.36, phase: 0.4, color: C.hot, packetColor: C.white,
      baseAlpha: 0, width: 2.2, packetR: 4, beatPulse: f.beatPulse, alpha: small,
    });
  }
  if (t >= 92.9 && t < P1.cues.secondWatch)
    point(
      ctx,
      ...(q < 1 ? along(watchRoute, q) : along(watchReturn, r)),
      true,
      1,
      6,
    );
  if (t >= P1.cues.secondWatch) {
    type(ctx, "handoff received", 1540, 694, 19, C.hot, "MV Sans");
    stroke(
      ctx,
      [
        [1510, 687],
        [1690, 687],
      ],
      C.cyan,
      2,
      at(t, 94.93, 95.3),
    );
  }
  caption(ctx, line, t, { x: 145, y: 954, width: 1620, size: 56 }, diag);
  diag.watch = {
    active: t < P1.cues.secondWatch ? 1 : 2,
    secondConfirmed: t >= P1.cues.secondWatch,
  };
  diag.presentation = "alternate_outline_fallback";
}
export function renderP1(ctx, t, line, forceIndex = -1) {
  if (forceIndex < 0 && (t < P1.start || t >= P1.end)) return null;
  const i =
    forceIndex >= 0
      ? forceIndex
      : P1.shots.findIndex((v, n) => n < 8 && t >= v && t < P1.shots[n + 1]),
    diag = { time: t, shot: `S${20 + i}`, ready: true };
  [exchange, shield, cat, cat, locate, preview, appearance, watch][i](
    ctx,
    t,
    line,
    diag,
  );
  return diag;
}
