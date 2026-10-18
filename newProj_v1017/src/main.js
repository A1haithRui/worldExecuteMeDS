// Render entry. A song time goes in, a finished frame comes out.
//
// Shots draw flat content onto a stage layer; the stage owns camera, transitions
// and grade. Captions are drawn by the stage after the transition composite, so
// a wipe can never cut through lyric text.
//
// The only state here is playback (audio position); every frame is a pure
// function of t, which is what makes export deterministic.
import { createStage, shakeAt } from "./engine/stage.js";
import { setAudioFeatures, sampleAt } from "./engine/audio.js";
import { caption, drawCaption } from "./mv-draw.js";
import { clamp, mix, smooth } from "./engine/motion.js";
import { SHOTS_DERIVED, SOURCE, shotAt, shotById } from "../shots/index.js";
import { BOOT_RENDER } from "../shots/s01_boot.js";

const $ = (id) => document.getElementById(id);
const stageCanvas = $("storyboardCanvas");
const audio = $("audio");
const seek = $("seek");
const clock = $("clock");
const shotName = $("shotName");
const coverage = $("coverage");

const stage = createStage(1920, 1080);
const RENDER = { ...BOOT_RENDER };

const BASE_GRADE = Object.freeze({
  exposure: 1,
  glow: 0.42,
  scanline: 0.022,
  vignette: 0.36,
  grain: 0.03,
});

let features = null;
let lines = [];
window.renderReady = false;
window.renderError = null;

const params = new URLSearchParams(location.search);
const renderMode = params.has("render");
if (renderMode) document.body.classList.add("render-only");

// --- data ------------------------------------------------------------------
const lyricsReady = fetch("/data/lyrics.json")
  .then((r) => (r.ok ? r.json() : { lines: [] }))
  .then((d) => {
    lines = d.lines ?? [];
  });

const featuresReady = fetch("/data/audio-features-v1.json")
  .then((r) => (r.ok ? r.json() : null))
  .then((table) => {
    features = setAudioFeatures(table);
  })
  .catch(() => {});

const fontReady = (async () => {
  const faces = ["600 20px 'MV Serif'", "400 20px 'MV Sans'", "400 20px 'MV Mono'"];
  await Promise.all(faces.map((f) => document.fonts.load(f).catch(() => {})));
  await document.fonts.ready;
})();

// --- captions --------------------------------------------------------------
function lineAt(t) {
  let lo = 0;
  let hi = lines.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid].start <= t) {
      found = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  if (found < 0) return null;
  const l = lines[found];
  return t < (l.end || l.start + 3) ? l : null;
}

// --- transitions -----------------------------------------------------------
// Spec semantics follow the shot table: a transition named on a shot starts at
// that shot's cut (align "start") or finishes on it (align "end").
function planAt(t) {
  let i = 0;
  for (let k = 0; k < SHOTS_DERIVED.length; k++) if (t >= SHOTS_DERIVED[k].at) i = k;
  const cur = SHOTS_DERIVED[i];
  const prev = i > 0 ? SHOTS_DERIVED[i - 1] : null;
  const next = i + 1 < SHOTS_DERIVED.length ? SHOTS_DERIVED[i + 1] : null;

  const own = cur.enter;
  if (own && own.type !== "cut" && own.dur && own.align !== "end" && prev) {
    const k = (t - cur.at) / own.dur;
    if (k > 0 && k < 1) return { cur, other: prev, spec: own, k };
  }
  if (next && next.enter && next.enter.type !== "cut" && next.enter.dur && next.enter.align === "end") {
    const k = (t - (next.at - next.enter.dur)) / next.enter.dur;
    if (k > 0 && k < 1) return { cur, other: next, spec: next.enter, k };
  }
  return { cur, other: null, spec: null, k: 0 };
}

// --- drawing ---------------------------------------------------------------
function drawPending(ctx, shot, t) {
  // An unimplemented shot must look unimplemented, not broken. This is the same
  // discipline the storyboard uses for a shot with no moment: say so, loudly.
  ctx.fillStyle = "#070d14";
  ctx.fillRect(0, 0, 1920, 1080);
  ctx.strokeStyle = "#243a4c";
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 8]);
  ctx.strokeRect(220, 210, 1480, 660);
  ctx.setLineDash([]);
  ctx.fillStyle = "#5d7d95";
  ctx.font = "400 30px 'MV Mono'";
  ctx.textAlign = "center";
  ctx.fillText("NOT RENDERED YET", 960, 500);
  ctx.font = "400 22px 'MV Mono'";
  ctx.fillText(shot.id + "  ·  " + shot.sectionTitle, 960, 545);
  const moment = shot.momentState === "todo" ? "（这一镜还没有写明叙事时刻）" : shot.moment;
  ctx.font = "400 20px 'MV Sans'";
  ctx.fillStyle = "#476378";
  const max = 900;
  const words = [...moment];
  let line = "";
  let y = 600;
  for (const ch of words) {
    if (ctx.measureText(line + ch).width > max) {
      ctx.fillText(line, 960, y);
      y += 32;
      line = "";
    }
    line += ch;
  }
  if (line) ctx.fillText(line, 960, y);
}

function drawShot(ctx, shot, t) {
  const fn = RENDER[shot.id];
  if (fn) return fn(ctx, t, shot, { features });
  drawPending(ctx, shot, t);
  return { pending: shot.id };
}

function gradeOptions(t, diag, shot) {
  const o = { ...BASE_GRADE };
  if (diag && diag.grade) Object.assign(o, diag.grade);

  // Breathe with the music, but hold the shot still: the reference moves the
  // picture by well under one percent per beat and so do we.
  if (features) {
    const f = sampleAt(t);
    o.glow = (o.glow ?? 0) * (0.86 + 0.3 * f.lowEnv);
    const cam = { ...(o.camera || {}), zoom: 1 + 0.006 * f.lowEnv + 0.0015 * f.barPulse };
    o.camera = cam;
  }
  if (diag && diag.shakeAt != null) {
    const [x, y] = shakeAt(t, diag.shakeAt.time, diag.shakeAt.amplitude ?? 6, diag.shakeAt.fall ?? 14, 0);
    o.camera = { ...(o.camera || {}), shakeX: x, shakeY: y };
  }
  return o;
}

/** Render one frame. Pure in t: same t always yields the same pixels. */
function renderFrame(t) {
  const plan = planAt(t);
  const shot = plan.cur;
  const diag = { t, shot: shot.id, section: shot.sectionTitle };

  const ctx = stage.begin();
  Object.assign(diag, drawShot(ctx, shot, t) || {});

  if (plan.other) {
    const inc = stage.beginIncoming();
    drawShot(inc, plan.other, t);
    stage.setTransition({ ...plan.spec, k: plan.k, from: shot.id, to: plan.other.id });
    diag.transition = { type: plan.spec.type, k: Number(plan.k.toFixed(3)) };
  } else {
    stage.setTransition(null);
  }

  const line = lineAt(t);
  const opts = gradeOptions(t, diag, shot);
  diag.lyrics = lines.length;
  diag.captionLine = line ? line.index : null;
  stage.present(stageCanvas, t, opts, (c) => {
    if (!line) return;
    // caption() only plans (it measures the block and fills diag.caption);
    // drawCaption() is what puts ink on the frame.
    const plan = caption(c, line, t, { x: 146, y: 940, width: 1600, size: 56 }, diag);
    drawCaption(c, plan, t);
    diag.captionDrawn = true;
  });
  return diag;
}

// --- playback --------------------------------------------------------------
let playing = false;
let clockT = 0;
const END = SOURCE.songDuration;

function setTime(t) {
  clockT = Math.max(0, Math.min(END, t));
  if (seek) seek.value = String(clockT);
}

function frameLabel(t) {
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return `${m}:${s < 10 ? "0" : ""}${s.toFixed(3)}`;
}

function tick() {
  let t = clockT;
  if (playing) {
    if (audio && audio.readyState >= 2 && !audio.paused) t = audio.currentTime;
    else t = clockT + 1 / 60;
    if (t >= END) {
      t = END;
      playing = false;
      if (audio) audio.pause();
      $("play").textContent = "播放";
    }
  }
  clockT = t;
  renderFrame(t);
  const shot = shotAt(t);
  if (clock) clock.textContent = `${frameLabel(t)} / ${frameLabel(END)}`;
  if (shotName) shotName.textContent = `${shot.id} · ${shot.sectionTitle}`;
  if (seek && playing) seek.value = String(t);
  requestAnimationFrame(tick);
}

// --- boot ------------------------------------------------------------------
async function boot() {
  await Promise.all([lyricsReady, featuresReady, fontReady]);
  // In render mode the picture is all that matters: ffmpeg muxes the original
  // audio afterwards. Dropping the element's source stops the page pulling a
  // 35 MB WAV it will never use (and aborting it at teardown).
  if (renderMode && audio) {
    audio.removeAttribute("src");
  } else if (audio) {
    audio.src = "/audio/song.wav";
  }
  for (const id of ["play", "seek"]) $(id)?.addEventListener?.("focus", () => {});
  $("play").onclick = () => {
    playing = !playing;
    $("play").textContent = playing ? "暂停" : "播放";
    if (playing) {
      if (audio) {
        audio.currentTime = clockT;
        audio.play().catch(() => {});
      }
    } else if (audio) audio.pause();
  };
  seek.oninput = () => {
    setTime(Number(seek.value));
    if (audio) audio.currentTime = clockT;
  };
  document.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      $("play").click();
    }
    if (e.code === "ArrowRight") setTime(clockT + 1);
    if (e.code === "ArrowLeft") setTime(clockT - 1);
  });
  if (audio) audio.addEventListener("seeked", () => {});

  const startT = Number(params.get("t") ?? 0);
  setTime(Number.isFinite(startT) ? startT : 0);
  renderFrame(clockT);

  const implemented = SHOTS_DERIVED.filter((s) => RENDER[s.id]).length;
  if (coverage)
    coverage.textContent = `已实现 ${implemented}/${SHOTS_DERIVED.length} 镜 · ${Object.keys(RENDER).join(", ")}`;

  window.renderFrame = renderFrame;
  window.renderReady = true;
  if (!renderMode) requestAnimationFrame(tick);
}

boot().catch((e) => {
  window.renderError = String(e && e.stack ? e.stack : e);
  console.error(e);
});


