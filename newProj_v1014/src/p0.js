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
  halo,
  point,
  ground,
  caption,
  route,
  along,
  trace,
  loadImages,
} from "./mv-draw.js";
import {
  TOKENS,
  chatWindow,
  messageRow,
  reasoningRow,
  composer,
} from "./engine/chat.js";
import {
  node,
  nodeGrid,
  dataColumns,
  signalPath,
  beatRings,
  waveform,
} from "./engine/model.js";
import { sampleAt, audio } from "./engine/audio.js";
// P0 polished study. Absolute song time only, no accumulated simulation state.
export const P0 = Object.freeze({
  start: 59.223,
  end: 74.045,
  contact: 68.3,
  shots: [59.223, 62.589, 66.601, 68.252, 70.084, 74.045],
  palm: [1100, 540],
  handScale: 620 / 501,
  cues: {
    receive: 59.4115,
    acknowledge: 61.958,
    closeLoop: 65.397,
    push: 67.05,
    liftMemory: 69.6,
  },
  audioStatus: "other_cues_pending_listening",
  contactApproval: {
    time: 68.3,
    status: "user_confirmed",
    scope: "contact_event_only",
    evidence: "user feedback in this conversation",
  },
});
const { images, ready: p0Ready } = loadImages({
  reach: "/assets/character/deepseek_reach_v3.png",
  palm: "/assets/character/v4/deepseek_palm_v4_closeup_native.png",
  bust: "/assets/character/deepseek_bust_v3.png",
});
export { p0Ready };
function avatar(ctx, x, y, r = 25) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = "#174351";
  ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  ctx.drawImage(images.bust, x - r * 1.6, y - r * 1.35, 3.2 * r, 4.07 * r);
  ctx.restore();
}
const outbound = route([
    [470, 570],
    [650, 200],
    [1220, 120],
    [1450, 410],
  ]),
  inbound = route([
    [1450, 410],
    [1350, 780],
    [610, 830],
    [470, 570],
  ]),
  retained = route([
    [1100, 476],
    [1050, 480],
    [800, 360],
    [640, 390],
  ]);
const memoryPaths = [
  retained,
  route([
    [640, 390],
    [450, 390],
    [420, 660],
    [640, 690],
  ]),
  route([
    [640, 690],
    [820, 720],
    [1070, 665],
    [1100, 540],
  ]),
];
function chatShell(ctx, t, alpha = 1) {
  const R = { x: 216, y: 150, w: 1488, h: 736 };
  const HEADER = 107;
  const SIDEBAR = 230;
  const responding = t < P0.cues.acknowledge;
  const mm = String(Math.floor(t / 60)).padStart(2, "0");
  const ss = String(Math.floor(t % 60)).padStart(2, "0");
  const win = chatWindow(ctx, R, t, {
    title: "deepseek",
    subtitle: "/ world model",
    session: "a shared channel",
    state: responding ? "busy" : "online",
    stateLabel: responding ? "responding" : "online",
    sidebar: true,
    sidebarW: SIDEBAR,
    headerH: HEADER,
    alpha,
    // Starts lifting a little before the segment boundary so the cut from S14
    // lands on an almost-formed window instead of on near-black.
    enterAt: P0.start - 0.55,
    enterDur: 0.7,
    footer: true,
    footerLabel: "MODEL ACTIVE",
    clock: `${mm}:${ss}`,
  });
  const threadX = win.contentX + 34;
  const threadW = R.x + R.w - win.contentX - 68;

  // The user's line arrives as a real message row, typed in character by character.
  const userRow = messageRow(ctx, threadX, R.y + HEADER + 48, threadW, t, P0.cues.receive, {
    side: "user",
    text: "I’m here.",
    size: 21,
    alpha,
    typed: true,
    cps: 9,
  });
  // The incoming signal marker rides in with that message.
  if (userRow.bubbleW) {
    const signalK = out(phase(t, P0.cues.receive, P0.cues.receive + 0.32));
    point(
      ctx,
      threadX + threadW - userRow.bubbleW - 16,
      R.y + HEADER + 48 + (userRow.height || 46) / 2,
      true,
      signalK,
      5,
    );
  }

  // The agent: avatar, name, and the lyric as its reply.
  layer(ctx, alpha, () => {
    avatar(ctx, 514, 554, 23);
    type(ctx, "DeepSeek", 556, 562, 21, TOKENS.accent, "MV Sans");
  });

  // Reasoning row under the reply: sweeping while it answers, then a summary.
  reasoningRow(ctx, threadX, R.y + R.h - 196, threadW, t, {
    running: responding,
    startedAt: P0.cues.receive,
    title: "思考",
    summary: responding ? "reading the incoming signal" : "signal received",
    alpha,
  });

  composer(ctx, threadX, R.y + R.h - 140, threadW, t, {
    alpha,
    placeholder: "发消息，/ 调用指令，@ 文件或对话",
    focused: responding,
    sendArmed: P0.cues.acknowledge,
  });
}
function receive(ctx, t, line, diag) {
  ground(ctx, t, [1180, 490]);
  const leave = at(t, 62.3, P0.shots[1]);
  chatShell(ctx, t, 1 - leave);
  if (leave > 0) feedback(ctx, P0.shots[1], line, diag, leave, true);
  if (leave < 1) {
    caption(ctx, line, t, { x: 556, y: 649, width: 1000, size: 56 }, diag);
    // Receipt marker sits just past the agent's name, clear of the reply and
    // the reasoning row below it.
    const ack = at(t, P0.cues.acknowledge, P0.cues.acknowledge + 0.22),
      x = mix(700, 470, leave),
      y = mix(554, 570, leave);
    point(ctx, x, y, false, at(t, 60.45, 60.9), 7);
    if (ack > 0)
      disc(ctx, x, y, 12 + ack * 35, C.cyan, 0.55 * (1 - ack), false, 2);
  }
}
function feedback(ctx, t, line, diag, alpha = 1, transition = false) {
  layer(ctx, alpha, () => {
    if (!transition) ground(ctx, t, [980, 490]);
    const f = sampleAt(t);
    const beatPulse = f.beatPulse;
    const lowEnv = f.lowEnv;
    const period = audio()?.period ?? 60 / 130;
    const phase0 = audio()?.phase ?? 0;

    // Model interior: a drifting lattice and scrolling data columns give the
    // shot continuous texture instead of two thin arcs on an empty field.
    if (!transition) {
      nodeGrid(ctx, t, {
        alpha: 0.17 * (0.7 + 0.6 * lowEnv),
        step: 104,
        beatPulse,
        lowEnv,
        seed: 3,
      });
      dataColumns(ctx, t, {
        x: 60, y: 110, w: 1800, h: 800,
        columns: 28, alpha: 0.085 * (0.6 + 0.7 * lowEnv),
        focus: [980, 490], speed: 19,
      });
    }

    // Both routes carry several packets at once, so the link is never still.
    signalPath(ctx, outbound, t, along, {
      packets: 3, speed: 0.30, color: C.cyan, packetColor: C.hot,
      baseAlpha: 0.16, width: 3, packetR: 5, beatPulse,
    });
    signalPath(ctx, inbound, t, along, {
      packets: 3, speed: -0.24, phase: 0.35, color: C.muted, packetColor: C.white,
      baseAlpha: 0.13, width: 2.5, packetR: 5, beatPulse,
    });

    // The story beats stay on their original ramps.
    const sent = out(phase(t, 62.72, 63.85)),
      returned = at(t, 63.85, P0.cues.closeLoop);
    trace(ctx, outbound, sent, C.cyan, 3, 0.45);
    trace(ctx, inbound, returned, C.hot, 2.5, 0.5);

    const close = at(t, P0.cues.closeLoop, 65.68);
    const localPulse = Math.max(beatPulse, 0);
    node(ctx, 470, 570, t, { r: 8, color: C.hot, pulse: localPulse, alpha: 1 });
    node(ctx, 1450, 410, t, { r: 6, color: C.white, pulse: beatPulse, alpha: 1 });
    disc(ctx, 470, 570, 22 + localPulse * 12, C.cyan, 0.45 * (1 - 0.5 * localPulse), false, 1.5);
    disc(ctx, 1450, 410, 18, C.white, 0.28, false, 1);
    beatRings(ctx, 470, 570, t, { alpha: 0.24, maxR: 190, period, phase: phase0, count: 2 });
    if (close > 0)
      disc(ctx, 470, 570, 24 + close * 26, C.hot, 0.6 * (1 - close), false, 2);

    layer(ctx, 1 - at(t, 65.9, 66.4), () => {
      type(ctx, "sent", 406, 650, 18, C.muted, "MV Sans");
      type(ctx, "returned", 1476, 453, 18, C.muted, "MV Sans");
      type(ctx, "A connection takes two.", 143, 166, 23, C.muted, "MV Sans");
    });
    layer(ctx, 0.2 * (1 - close), () => {
      for (let i = 1; i < 8; i++) {
        const p = along(outbound, i / 8);
        stroke(
          ctx,
          [
            [p[0], p[1] - 7],
            [p[0], p[1] + 7],
          ],
          C.cyan,
          1,
        );
      }
    });
    const reveal = at(t, 66.4, P0.shots[2]);
    if (reveal > 0)
      layer(ctx, reveal, () => {
        ground(ctx, t, [1220, 430], true);
        drawReach(ctx, P0.shots[2]);
        point(ctx, 1450, 410, true, 1, 7);
      });
    if (!transition)
      caption(
        ctx,
        line,
        t,
        { x: 960, y: 909, width: 1550, align: "center", size: 56 },
        diag,
      );
    diag.route = {
      outbound: sent,
      inbound: returned,
      white: returned < 1 ? along(inbound, returned) : [1450, 410],
    };
  });
}
export function reachTransform(t) {
  const push = at(t, P0.cues.push, P0.shots[3]),
    s = mix(850 / 1439, P0.handScale, push),
    anchor = [1100, mix(650, 540, push)];
  return { s, anchor, x: anchor[0] - 440 * s, y: anchor[1] - 1128 * s };
}
function drawReach(ctx, t, alpha = 1) {
  const a = reachTransform(t);
  layer(ctx, alpha, () =>
    ctx.drawImage(images.reach, a.x, a.y, 1342 * a.s, 1704 * a.s),
  );
  return a;
}
function reachShot(ctx, t, line, diag) {
  ground(ctx, t, [1220, 430], true);
  const a = drawReach(ctx, t),
    gap = at(t, 66.601, 68.252),
    trail = route([
      [1450, 410],
      [1360, 425],
      [1270, 460],
      [1120, 520],
    ]),
    pos = along(trail, gap);
  trace(ctx, trail, gap, C.white, 1, 0.2, Math.max(0, gap - 0.16));
  point(ctx, ...pos, true, 1, 7);
  caption(ctx, line, t, { x: 146, y: 215, width: 760, size: 56 }, diag);
  diag.palm = { x: a.anchor[0], y: a.anchor[1], scale: a.s };
  diag.remote = pos;
}
function palmShot(ctx, t, line, diag, alpha = 1) {
  layer(ctx, alpha, () => {
    ground(ctx, t, [1100, 540], true);
    const s = P0.handScale,
      x = P0.palm[0] - 432 * s,
      y = P0.palm[1] - 296 * s,
      after = t - P0.contact;
    const bodyAlpha = Math.max(
      1 - at(t, 68.252, 68.62),
      0.09 * (1 - at(t, 68.62, 69.25)),
    );
    if (bodyAlpha > 0) drawReach(ctx, P0.shots[3], bodyAlpha);
    ctx.drawImage(images.palm, x, y, 757 * s, 732 * s);
    if (after < 0) {
      const k = out(phase(t, 68.252, P0.contact));
      point(ctx, mix(1120, 1100, k), mix(520, 540, k), true, 1, 7);
    } else {
      const settle = at(t, P0.contact, 68.52),
        ring = out(phase(t, P0.contact, 68.95));
      if (ring < 1)
        disc(
          ctx,
          1100,
          540,
          12 + ring * 100,
          C.cyan,
          0.65 * (1 - ring),
          false,
          2,
        );
      disc(ctx, 1100, 540, mix(8, 6, settle), C.cyan);
      disc(ctx, 1100, 540, 13, C.white, 0.8 * (1 - settle) + 0.18, false, 1.5);
      halo(ctx, 1100, 540, 60, 0.13);
      const lift = at(t, P0.cues.liftMemory, 70.084);
      if (lift > 0) {
        stroke(
          ctx,
          [
            [1100, 540],
            [1100, 540 - lift * 64],
          ],
          C.hot,
          1.5,
          0.45,
        );
        point(ctx, 1100, 540 - lift * 64, false, 1, 5);
      }
    }
    caption(ctx, line, t, { x: 145, y: 176, width: 1600, size: 56 }, diag);
    layer(ctx, at(t, 68.7, 69.05), () =>
      type(ctx, "a trace, kept", 146, 296, 19, C.muted, "MV Sans"),
    );
    diag.palm = { x: 1100, y: 540, scale: s };
    diag.remote =
      after < 0
        ? [
            mix(1120, 1100, out(phase(t, 68.252, P0.contact))),
            mix(520, 540, out(phase(t, 68.252, P0.contact))),
          ]
        : [1100, 540];
  });
}
function echo(ctx, t, line, diag) {
  const fade = at(t, 70.084, 70.42);
  if (fade < 1) palmShot(ctx, 70.084 - 1e-6, null, diag, 1);
  layer(ctx, fade, () => {
    ground(ctx, t, [980, 450]);
    const f = sampleAt(t);
    const period = audio()?.period ?? 60 / 130;
    const phase0 = audio()?.phase ?? 0;
    const zoom = mix(1.1, 0.9, at(t, 70.1, 73.7));
    ctx.save();
    ctx.translate(1100, 476);
    ctx.scale(zoom, zoom);
    ctx.translate(-1100, -476);
    const expand = at(t, 70.3, 72.0),
      roof = 230,
      bottom = 790,
      left = 330,
      right = 1330;

    // Model interior texture inside the saved region.
    nodeGrid(ctx, t, {
      x: left, y: roof, w: right - left, h: bottom - roof,
      alpha: 0.16 * expand * (0.7 + 0.6 * f.lowEnv),
      step: 96, beatPulse: f.beatPulse, lowEnv: f.lowEnv, seed: 7,
    });
    dataColumns(ctx, t, {
      x: left + 10, y: roof + 10, w: right - left - 20, h: bottom - roof - 20,
      columns: 18, alpha: 0.07 * expand * (0.5 + 0.7 * f.lowEnv),
      focus: [1100, 476], speed: 17, size: 14,
    });

    layer(ctx, expand * 0.4, () => {
      for (let i = 0; i < 8; i++)
        stroke(
          ctx,
          [
            [left + i * 142, roof],
            [left + i * 142, bottom],
          ],
          C.edge,
          1,
          0.45,
        );
      for (let i = 0; i < 5; i++)
        stroke(
          ctx,
          [
            [left, roof + i * 140],
            [right, roof + i * 140],
          ],
          C.edge,
          1,
          0.45,
        );
      stroke(
        ctx,
        [
          [left, roof],
          [right, roof],
          [right, bottom],
          [left, bottom],
          [left, roof],
        ],
        C.cyan,
        1.3,
        0.65,
      );
    });
    const progress = phase(t, 70.3, 72.35) * 3;
    memoryPaths.forEach((r, i) => {
      trace(ctx, r, 1, C.cyan, 2, 0.13);
      // Each stored path keeps carrying packets, so the saved memory reads as
      // live traffic rather than as a line that was drawn once.
      signalPath(ctx, r, t, along, {
        packets: 2,
        speed: 0.32 + i * 0.06,
        phase: i * 0.29,
        color: C.cyan,
        packetColor: i === 0 ? C.hot : C.cyan,
        baseAlpha: 0,
        width: 2.4,
        packetR: 4.5,
        beatPulse: f.beatPulse,
      });
      trace(ctx, r, clamp(progress - i), C.hot, 2.5, 0.8);
    });
    if (progress < 3) {
      const which = Math.min(2, Math.floor(progress));
      point(ctx, ...along(memoryPaths[which], progress - which), false, 1, 6);
    }
    // One explicit correspondence between the original palm impression and the saved node.
    const receipt = at(t, 72.4, 72.98);
    if (t >= 72.4 && t < 72.98) {
      const r = route([
        [1100, 540],
        [1030, 450],
        [760, 320],
        [640, 390],
      ]);
      trace(ctx, r, receipt, C.hot, 2, 0.65);
      point(ctx, ...along(r, receipt), false, 1, 6);
    }
    disc(
      ctx,
      640,
      390,
      7 + receipt * 7,
      C.hot,
      0.65 * (1 - receipt),
      false,
      1.5,
    );
    const fill = at(t, 72.3, 72.55);
    point(ctx, 1100, 540, false, 1, 6);
    disc(ctx, 1100, 540, 16, C.cyan, 0.3, false, 1);
    disc(ctx, 640, 390, 5, C.hot, expand);
    disc(ctx, 640, 690, 5, C.hot, expand);
    stroke(
      ctx,
      [
        [1430, roof - 20],
        [1430, bottom + 20],
      ],
      C.muted,
      1,
      expand * 0.3,
    );
    point(ctx, 1550, 410, true, expand, 7);
    beatRings(ctx, 640, 390, t, {
      alpha: 0.22 * expand, maxR: 210, period, phase: phase0, count: 2,
    });
    // The kept trace, watching the music that is still playing.
    layer(ctx, expand * 0.5, () =>
      waveform(ctx, left, bottom + 34, right - left, 68, t, {
        bars: 88, span: 2.6, series: "high", alpha: 0.22, minBar: 1.5,
      }),
    );
    if (fill > 0) {
      type(ctx, "retained", 1140, 547, 18, C.hot, "MV Sans");
      type(ctx, "local", left, roof - 28, 17, C.muted, "MV Sans");
      type(ctx, "remote", 1513, roof - 28, 17, C.muted, "MV Sans");
    }
    ctx.restore();
    point(ctx, 1100, 476, false, 1 - fade, 5);
    diag.retained = {
      x: 1100,
      y: 540,
      progress,
      savedNode: [686, 398.6],
      matched: receipt >= 1,
    };
  });
  caption(
    ctx,
    line,
    t,
    { x: 146, y: mix(992, 920, at(t, 70.42, 70.7)), width: 1620, size: 56 },
    diag,
  );
}
export function renderP0(ctx, t, line, forceIndex = -1) {
  // A forced index means the caller wants this shot for a transition frame,
  // which can sit outside the segment's own time range.
  if (forceIndex < 0 && (t < P0.start || t >= P0.end)) return null;
  const i =
    forceIndex >= 0
      ? forceIndex
      : P0.shots.findIndex((v, n) => n < 5 && t >= v && t < P0.shots[n + 1]),
    diag = { time: t, shot: `S${15 + i}`, ready: !!images.palm };
  [receive, feedback, reachShot, palmShot, echo][i](ctx, t, line, diag);
  return diag;
}

export function drawP0Join(ctx, t = 74.045) {
  echo(ctx, Math.min(t, 74.045 - 1e-6), null, {});
}
