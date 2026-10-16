import { p0Ready, P0 } from "./p0.js";
import { p1Ready, P1, getP1DerivedLayer } from "./p1.js";
import { p2Ready, P2 } from "./p2.js";
import { p3Ready, P3 } from "./p3.js";
import { drawCaption } from "./mv-draw.js";
import { createStage, shakeAt } from "./engine/stage.js";
import { setAudioFeatures, sampleAt, audio as songAudio } from "./engine/audio.js";
import { drawAmbient, ambientFor } from "./engine/ambient.js";
import { smooth, mix, clamp } from "./engine/motion.js";
import {
  ALL_SHOTS, POLISHED_RANGES, SEGMENT_RENDER, SHOT_CAMERA, SHOT_TRANSITIONS,
  AMBIENT_BY_SHOT, AMBIENT_FOCUS, inPolished,
} from "./segments.js";

// Per-shot camera. A slow push or pull keeps a still plate alive without
// putting anything on top of it, which matters because the storyboard rule is
// that support layers stay well under the subject's contrast.
const $ = (id) => document.getElementById(id);
const stage = $("stage");
const audio = $("audio");
const seek = $("seek");
const character = $("character");
const images = {
  profile: "/assets/character/deepseek_profile_v3.png",
  bust: "/assets/character/deepseek_bust_v3.png",
  reach: "/assets/character/deepseek_reach_v3.png",
  eye: "/assets/character/deepseek_eye_v3.png",
};
const conceptReady = Promise.all(
  Object.values(images).map(async (path) => {
    const img = new Image();
    img.src = path;
    await img.decode();
  }),
);

let lines = [],
  ready = false,
  offline = false,
  reviewEnd = null;
let features = null;
const lyricsReady = fetch("/data/lyrics.json")
  .then((r) => {
    if (!r.ok) throw new Error("Local lyric data missing");
    return r.json();
  })
  .then((data) => {
    lines = data.lines;
  });
// The feature table is optional: without it the grade falls back to fixed
// values and shots get neutral samples, so a missing file degrades the look
// instead of breaking the player. Shots read it through engine/audio.js.
const featuresReady = fetch("/data/audio-features-v1.json")
  .then((r) => (r.ok ? r.json() : null))
  .then((table) => {
    features = setAudioFeatures(table);
  })
  .catch(() => {});
const params = new URLSearchParams(location.search);
if (params.has("render")) document.body.classList.add("render-only");
window.renderReady = false;

// Canvas stage: shots draw flat content, the stage applies camera and grade.
const mvStage = createStage(1920, 1080);
const stageCanvas = $("storyboardCanvas");
const BASE_GRADE = Object.freeze({
  exposure: 1,
  glow: 0.42,
  scanline: 0.022,
  vignette: 0.36,
  grain: 0.03,
});

// ?g_glow=0.2&g_grain=0 overrides a grade value, so a look can be tuned from
// the URL without editing this file.
const gradeOverride = {};
for (const [key, value] of params) {
  if (!key.startsWith("g_")) continue;
  const parsed = Number(value);
  if (Number.isFinite(parsed)) gradeOverride[key.slice(2)] = parsed;
}

// Which ambient treatment each polished shot wants. Close-ups take less so the
// layer never competes with the subject.

function gradeOptions(diag, t, plan = null) {
  const o = { ...BASE_GRADE, ...gradeOverride, ...(window.gradeOverrides || {}) };
  if (!diag) return o;
  // Per-shot overrides are filled in as shots adopt the new engine.
  if (diag.grade) Object.assign(o, diag.grade);

  let zoom = 1;
  const cam = plan ? SHOT_CAMERA[plan.cur.id] : null;
  if (cam) {
    const span = Math.max(0.001, (plan.end ?? plan.cur.t + 4) - plan.cur.t);
    const e = smooth(clamp((t - plan.cur.t) / span));
    zoom = mix(cam.from, cam.to, e);
    o.camera = { ...(o.camera || {}), x: cam.focus[0], y: cam.focus[1] };
  }

  // Ride the music: the grade breathes with the low band and the picture lifts
  // a little on every beat. Subtle on purpose -- the reference uses the same
  // idea at +/-0.5% zoom.
  if (features && !window.gradeOverrides) {
    const f = sampleAt(t);
    const baseGlow = o.glow ?? 0;
    o.glow = baseGlow * (0.80 + 0.42 * f.lowEnv) + 0.12 * f.beatPulse * f.onsetStrength;
    zoom *= 1 + 0.007 * f.lowEnv + 0.002 * f.barPulse;
  }
  o.camera = { ...(o.camera || {}), zoom };

  if (diag.shakeAt != null) {
    const [x, y] = shakeAt(t, diag.shakeAt.time, diag.shakeAt.amplitude ?? 6,
      diag.shakeAt.fall ?? 14, diag.shakeAt.seed ?? 0);
    o.camera = { ...(o.camera || {}), shakeX: x, shakeY: y };
  }
  return o;
}

const scenes = [
  {
    from: 0,
    to: 20,
    mode: "boot",
    image: "profile",
    title: "BOOT / 连接",
    system: "initializing world model...",
    chat: "Searching for your signal",
  },
  {
    from: 20,
    to: 29.71,
    mode: "reveal",
    image: "bust",
    title: "REVEAL / 唤醒",
    system: "connection established",
    chat: "I am here",
  },
  {
    from: 29.71,
    to: 59.7,
    mode: "dialogue",
    image: "reach",
    title: "DIALOGUE / 回应",
    system: "receiving user input...",
    chat: "I can hear you",
  },
  {
    from: 59.7,
    to: 84,
    mode: "close",
    image: "eye",
    title: "SEARCH / 寻找",
    system: "searching through the deep...",
    chat: "Let me find the answer",
  },
  {
    from: 84,
    to: 136,
    mode: "dialogue",
    image: "reach",
    title: "WORLD / 运行",
    system: "world model active",
    chat: "Stay with me a little longer",
  },
  {
    from: 136,
    to: 165,
    mode: "reveal",
    image: "bust",
    title: "SILENCE / 独白",
    system: "signal falling...",
    chat: "Are you still there?",
  },
  {
    from: 165,
    to: 196,
    mode: "close",
    image: "eye",
    title: "DISCOVERY / 发现",
    system: "reconnecting...",
    chat: "I found your signal",
  },
  {
    from: 196,
    to: Infinity,
    mode: "boot",
    image: "profile",
    title: "OUTRO / 归航",
    system: "world model idle",
    chat: "Until we meet again",
  },
];

const clock = (n) =>
  `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(Math.floor(n % 60)).padStart(2, "0")}`;
const sceneAt = (t) => scenes.find((s) => t >= s.from && t < s.to) || scenes[0];
function lineAt(t) {
  let lo = 0,
    hi = lines.length - 1,
    found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid].start <= t) {
      found = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return found >= 0 && t < (lines[found].end || lines[found].start + 3)
    ? lines[found]
    : null;
}

function shotEntryAt(t) {
  let found = -1;
  for (let i = 0; i < ALL_SHOTS.length; i++) {
    if (t >= ALL_SHOTS[i].t) found = i;
    else break;
  }
  return found;
}

function renderShot(ctx, entry, t, line) {
  return SEGMENT_RENDER[entry.seg](ctx, t, line, entry.idx);
}

function ambientInto(ctx, t, diag) {
  if (ambientScale <= 0) return;
  const f = sampleAt(t);
  const preset = ambientFor(diag?.ambient || AMBIENT_BY_SHOT[diag?.shot] || "chat");
  drawAmbient(ctx, t, {
    ...preset,
    intensity: preset.intensity * ambientScale,
    focus: diag?.ambientFocus || AMBIENT_FOCUS[diag?.shot] || [960, 500],
    period: songAudio()?.period ?? 60 / 130,
    phase: songAudio()?.phase ?? 0,
    beatPulse: f.beatPulse,
    lowEnv: f.lowEnv,
  });
}

// Which shots should be on screen at t, and how they mix. Returns the current
// shot plus, during a transition window, the partner layer and the mix spec.
function planFrame(t) {
  const i = shotEntryAt(t);
  if (i < 0) return null;
  const cur = ALL_SHOTS[i];
  const prev = i > 0 ? ALL_SHOTS[i - 1] : null;
  const next = i + 1 < ALL_SHOTS.length ? ALL_SHOTS[i + 1] : null;
  const end = next ? next.t : cur.t + 4;

  // A transition named by the current shot, starting on its own boundary.
  const own = SHOT_TRANSITIONS[cur.id];
  if (own && own.type !== "cut" && own.align !== "end" && own.dur && prev) {
    const k = (t - cur.t) / own.dur;
    if (k > 0 && k < 1) return { cur, prev, next, end, other: prev, spec: own, k, boundary: cur.t };
  }
  // A transition named by the next shot, finishing on the next boundary.
  if (next) {
    const ns = SHOT_TRANSITIONS[next.id];
    if (ns && ns.type !== "cut" && ns.align === "end" && ns.dur) {
      const k = (t - (next.t - ns.dur)) / ns.dur;
      if (k > 0 && k < 1) return { cur, prev, next, end, other: next, spec: ns, k, boundary: next.t };
    }
  }
  return { cur, prev, next, end, other: null, spec: null, k: 0, boundary: cur.t };
}

function paint(t) {
  const scene = sceneAt(t);
  const line = lineAt(t);
  const img = images[scene.image];
  if (!character.src.endsWith(img)) character.src = img;
  for (const mode of ["boot", "reveal", "dialogue", "close"])
    stage.classList.toggle(`mode-${mode}`, mode === scene.mode);
  const plan = inPolished(t) ? planFrame(t) : null;
  const polished = plan !== null;
  stage.classList.toggle("p0-polished", polished);
  let p0Scene = null;
  let appliedGrade = null;
  if (plan) {
    const ctx = mvStage.begin();
    p0Scene = renderShot(ctx, plan.cur, t, line);
    ambientInto(ctx, t, p0Scene);

    if (plan.other) {
      // The partner layer keeps its own shot alive through the overlap, so a
      // wipe shows motion on both sides rather than a frozen frame. It draws no
      // caption: the lyric belongs to the line that is current, once.
      const ctxB = mvStage.beginIncoming();
      const otherScene = renderShot(ctxB, plan.other, t, null);
      ambientInto(ctxB, t, otherScene);
      mvStage.setTransition({
        ...plan.spec,
        k: plan.k,
        width: 1920,
        height: 1080,
        seed: Math.round(plan.boundary * 1000) % 99991,
      });
    }

    appliedGrade = gradeOptions(p0Scene, t, plan);
    const captionPlan = p0Scene?.captionPlan || null;
    mvStage.present(stageCanvas, t, appliedGrade, (ctx) => {
      drawCaption(ctx, captionPlan, t);
    });
  } else {
    // Concept range: the DOM overlay owns the picture, so leave no stale frame.
    const c = stageCanvas.getContext("2d");
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, 1920, 1080);
  }
  window.frameDiagnostics = {
    ...(p0Scene || { time: t, shot: "concept", line: line?.index }),
    transition: mvStage.last.transition,
    gradeApplied: appliedGrade
      ? { glow: +appliedGrade.glow.toFixed(4), zoom: +(appliedGrade.camera?.zoom ?? 1).toFixed(5) }
      : null,
  };
  $("sceneName").textContent = p0Scene ? `${p0Scene.shot} / 精修` : scene.title;
  $("systemText").textContent = scene.system;
  $("chatText").innerHTML = `${scene.chat}<span class="cursor">_</span>`;
  $("thinkingText").textContent =
    `${scene.title.split(" / ")[0].toLowerCase()} trace / ${Math.floor(t * 13)
      .toString(16)
      .padStart(4, "0")}`;
  $("panelTime").textContent = `${clock(t)}.${Math.floor(t * 10) % 10}`;
  $("signal").textContent = String(Math.min(99, Math.floor(t * 1.8))).padStart(
    2,
    "0",
  );
  $("lyric").textContent = line?.text || (t < 20 ? "..." : "∿");
  $("lyricIndex").textContent = line
    ? `L.${String(line.index ?? lines.indexOf(line)).padStart(3, "0")}`
    : "SIGNAL";
  $("lyricProgress").style.width = line
    ? `${Math.min(100, Math.max(0, ((t - line.start) / (line.end - line.start)) * 100))}%`
    : "0%";
  $("clock").textContent =
    `${clock(t)} / ${clock(Number.isFinite(audio.duration) ? audio.duration : 211.96)}`;
  if (document.activeElement !== seek) seek.value = t;
  stage.style.setProperty("--beam", `${t * 7}deg`);
  character.style.transform = `translateY(${Math.sin(t * 1.4) * 0.6}%)`;
  $("play").textContent = audio.paused ? "播放" : "暂停";
}
function render() {
  if (ready && !offline) {
    if (reviewEnd !== null && audio.currentTime >= reviewEnd) {
      audio.pause();
      audio.currentTime = reviewEnd - 1 / 60;
      reviewEnd = null;
    }
    paint(audio.currentTime || 0);
  }
  requestAnimationFrame(render);
}
window.renderFrame = (songTime) => {
  if (!ready) throw new Error("Wait for window.renderReady");
  if (!Number.isFinite(songTime))
    throw new Error("Finite song seconds required");
  offline = true;
  audio.pause();
  paint(songTime);
  return window.frameDiagnostics;
};
window.resumePreview = () => {
  offline = false;
};
window.p0Config = P0;
window.p1Config = P1;
window.p2Config = P2;
window.p3Config = P3;
window.exportP1DerivedLayer = () => getP1DerivedLayer().toDataURL('image/png');

$("play").addEventListener("click", async () => {
  if (!ready) return;
  offline = false;
  if (audio.paused) {
    try {
      await audio.play();
    } catch {
      $("play").textContent = "音频不可用";
    }
  } else audio.pause();
});
async function review(from, end) {
  if (!ready) return;
  offline = false;
  reviewEnd = end;
  audio.currentTime = from;
  await audio.play();
}
$("reviewP2").addEventListener("click", () => review(P2.start, P2.end));
$("reviewP3").addEventListener("click", () => review(P3.start, P3.end));
$("reviewP0").addEventListener("click", () => review(P0.start, P0.end));
$("reviewP1").addEventListener("click", () => review(P1.start, P1.end));
$("reviewCombined").addEventListener("click", () => review(P0.start, P1.end));
seek.addEventListener("input", () => {
  offline = false;
  reviewEnd = null;
  audio.currentTime = Number(seek.value);
});
document.addEventListener("keydown", (event) => {
  if (event.target instanceof HTMLInputElement) return;
  if (event.code === "Space") {
    event.preventDefault();
    $("play").click();
  }
  if (event.code === "ArrowRight" || event.code === "ArrowLeft") {
    event.preventDefault();
    offline = false;
    reviewEnd = null;
    audio.currentTime = Math.max(
      0,
      Math.min(
        audio.duration || 211.96,
        audio.currentTime + (event.code === "ArrowRight" ? 1 : -1),
      ),
    );
  }
});
const initial = Number(params.get("t"));
window.readyPromise = Promise.all([
  p0Ready,
  p1Ready,
  p2Ready,
  p3Ready,
  conceptReady,
  lyricsReady,
  featuresReady,
  document.fonts.load('600 56px "MV Serif"'),
  document.fonts.load('400 24px "MV Sans"'),
  document.fonts.load('400 24px "MV Mono"'),
])
  .then(() => {
    ready = true;
    if (Number.isFinite(initial) && initial > 0) audio.currentTime = initial;
    paint(initial || 0);
    stage.classList.remove("loading");
    window.renderReady = true;
  })
  .catch((error) => {
    window.renderError = error.message;
    $("sceneName").textContent = error.message;
    console.error(error);
  });
render();
