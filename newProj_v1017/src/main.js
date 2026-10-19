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
import { figureReady } from "../shots/figure.js";
import { drawLyric } from "./engine/lyric.js";
import { lyricPlanFor } from "../shots/lyric-plan.js";
import { clamp, mix, smooth } from "./engine/motion.js";
import { SHOTS_DERIVED, SOURCE, shotAt, shotById } from "../shots/index.js";
import { BOOT_RENDER } from "../shots/s01_boot.js";
import { preroll } from "../shots/s00_preroll.js";
import { SECTION2_RENDER } from "../shots/s02_title.js";
import { SECTION3_RENDER } from "../shots/s03_geometry.js";
import { SECTION4_RENDER } from "../shots/s04_settings.js";
import { SECTION5_RENDER, SECTION5_READY } from "../shots/s05_chorus.js";

const $ = (id) => document.getElementById(id);
const stageCanvas = $("storyboardCanvas");
const audio = $("audio");
const seek = $("seek");
const clock = $("clock");
const shotName = $("shotName");
const coverage = $("coverage");

const stage = createStage(1920, 1080);
const RENDER = {
  preroll, ...BOOT_RENDER, ...SECTION2_RENDER, ...SECTION3_RENDER,
  ...SECTION4_RENDER, ...SECTION5_RENDER,
};

const BASE_GRADE = Object.freeze({
  exposure: 1,
  glow: 0.42,
  scanline: 0.022,
  vignette: 0.36,
  grain: 0.03,
});

let features = null;
let config = {};
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

const configReady = fetch("/config.json").then((r) => (r.ok ? r.json() : {})).catch(() => ({}));

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
  // safety comes from config.json so the preroll copy and the flash cap are one
  // source of truth; songDuration lets the warning page state the film's length
  if (fn) return fn(ctx, t, shot, { features, safety: config.safety, songDuration: SOURCE.songDuration });
  drawPending(ctx, shot, t);
  return { pending: shot.id };
}

/**
 * The film's colour state over song time.
 *
 * The reference keeps its whole setup monochrome -- a chroma magnitude of about 1
 * from its warning page through its last client shot -- and colour arrives only
 * when the spark lights and the session launches (10.8 at that shot). We do the
 * same with our own colour: sections 0 and 1 are steel grey, the launch in `title`
 * brings the blue in, and from there it stays.
 *
 * The ramp is placed so the colour arrives with the light and is complete when the
 * command finishes typing, rather than snapping on at a cut.
 */
const COLOUR_AT = 15.13; // the mark begins to light
const COLOUR_DONE = 16.5; // the launch command has been entered
const lerp = (a, b, k) => a + (b - a) * Math.max(0, Math.min(1, k));

function saturationAt(t) {
  if (t < 7.6949) return 0.08;
  if (t < 11.3873) return lerp(0.08, 0.2, (t - 7.6949) / (11.3873 - 7.6949));
  if (t < 15.0798) return lerp(0.2, 0.32, (t - 11.3873) / (15.0798 - 11.3873));
  if (t < COLOUR_DONE) return lerp(0.32, 1, ((t - COLOUR_AT) / (COLOUR_DONE - COLOUR_AT)) ** 0.7);
  return 1;
}

function gradeOptions(t, diag, shot) {
  const o = { ...BASE_GRADE, sat: saturationAt(t) };
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
/**
 * The lyric line for this frame, clipped to the shot that owns it.
 *
 * Lines do not start exactly on shot boundaries: L7 begins 0.25 s before
 * boot-layout cuts, so choosing by time alone let the outgoing shot display the
 * incoming shot's words. A shot may only show lines it declares; a line that
 * began before the cut starts when the shot does, so the typewriter begins with
 * the picture rather than mid-word.
 */
function lyricFor(t, shot, plan) {
  const raw = lineAt(t);
  if (!raw) return null;
  // A shot that declares no lines carries none: the table's "-" means this shot
  // has no lyric of its own, which is how the reference reads too. Without this,
  // a line that outlives its shot (L12 runs from 16.0 to 20.0, past a cut at
  // 16.93) would be drawn again by the next shot at that shot's placement.
  if (!shot.lines) return null;
  const idx = raw.index + 1;
  if (idx < shot.lines[0] || idx > shot.lines[1]) return null;
  if (plan.embeddedLines && plan.embeddedLines.includes(idx)) return null;
  const start = Math.max(raw.start, shot.at);
  const end = Math.min(raw.end ?? raw.start + 3, shot.until);
  return end > start ? { ...raw, start, end } : null;
}

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

  // The plan is resolved against the line, because a keyword line takes the power
  // treatment wherever it lands, overriding the shot's usual one.
  const raw = lineAt(t);
  const lyricPlan = lyricPlanFor(shot, raw ? raw.index : null);
  const line = lyricFor(t, shot, lyricPlan);
  const opts = gradeOptions(t, diag, shot);
  diag.lyrics = lines.length;
  diag.captionLine = line ? line.index : null;
  // Lyrics are drawn by the stage after the composite, but placed by the shot's
  // own plan: no band, no fixed baseline, so the picture can use the whole frame.
  stage.present(stageCanvas, t, opts, (c) => {
    if (!line) return;
    // A shot may keep the line before the current one on screen: a transcript that
    // holds its previous line reads as a conversation, while one line at a time
    // reads as the shot erasing itself. The echo is only drawn when the shot has
    // given the previous line a place of its own -- otherwise it falls back to the
    // current line's anchor and the two print on top of each other. And never under
    // a keyword: the shout is meant to land on its own.
    const echoSlot = lyricPlan.byLine && lyricPlan.byLine[line.index - 1];
    if (lyricPlan.echo && echoSlot && lyricPlan.style !== "power") {
      const prev = lines[line.index - 1];
      if (prev && prev.text) {
        const echoPlan = lyricPlanFor(shot, prev.index);
        drawLyric(
          c,
          { ...echoPlan, line: { ...prev, end: Infinity }, color: lyricPlan.echoColor ?? "#8ba4c2" },
          t,
        );
      }
    }
    const drew = drawLyric(c, { ...lyricPlan, line }, t);
    if (drew != null) diag.lyric = { style: lyricPlan.style, line: line.index };
  });
  return diag;
}

// --- playback --------------------------------------------------------------
let playing = false;
let clockT = 0;
const END = SOURCE.songDuration;
// The film opens on the warning page, which sits before the song starts.
const START = -SOURCE.preroll;

function setTime(t) {
  clockT = Math.max(START, Math.min(END, t));
  if (seek) seek.value = String(clockT);
}

function frameLabel(t) {
  const a = Math.abs(t);
  const m = Math.floor(a / 60);
  const s = a - m * 60;
  return (t < 0 ? "-" : "") + m + ":" + (s < 10 ? "0" : "") + s.toFixed(3);
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
  await Promise.all([lyricsReady, featuresReady, fontReady, figureReady, SECTION5_READY]);
  config = await configReady;
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
        audio.currentTime = Math.max(0, clockT);
        audio.play().catch(() => {});
      }
    } else if (audio) audio.pause();
  };
  seek.oninput = () => {
    setTime(Number(seek.value));
    if (audio) audio.currentTime = Math.max(0, clockT);
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


