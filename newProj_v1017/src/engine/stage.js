// Stage: owns the shot layers and the post grade, and turns a song time into a
// finished frame.
//
// Draw order per frame:
//   1. stage.begin()          -> cleared layer A; the current shot draws here
//   2. stage.beginIncoming()  -> cleared layer B; only during a transition
//   3. stage.setTransition()  -> how A and B mix
//   4. stage.present()        -> composite A/B, then camera + grade
//
// Shots only ever draw flat content. All camera, transition and grade decisions
// live here or in a shot's resolvers, so a still is reproducible from its time.
import { createGrade, GRADE_DEFAULTS } from "./grade.js";
import { shake, clamp } from "./motion.js";
import { drawTransition } from "./transitions.js";

function makeLayer(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return { canvas, ctx: canvas.getContext("2d") };
}

function resetCtx(ctx, width, height) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.filter = "none";
  // Shadow and dash are part of the frame's state and have to go with it. A shot
  // that set a shadow and did not put it back made the NEXT frame render differently
  // -- which is exactly the bug the determinism check exists to catch, and it only
  // showed up when two shots were rendered in sequence rather than alone.
  //
  // Text alignment, line width and the stroking properties are the same class of
  // leak, but resetting them here changed the output of shots that had grown used to
  // inheriting them, so that is a refactor to do together with a full re-render
  // rather than after the fact.
  ctx.shadowBlur = 0;
  ctx.shadowColor = "rgba(0,0,0,0)";
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.setLineDash([]);
  ctx.lineDashOffset = 0;
  ctx.clearRect(0, 0, width, height);
}

export function createStage(width = 1920, height = 1080) {
  const grade = createGrade(width, height);
  const a = makeLayer(width, height);
  const b = makeLayer(width, height);
  let transition = null;
  let last = { camera: null, options: { ...GRADE_DEFAULTS }, transition: null };

  function begin() {
    resetCtx(a.ctx, width, height);
    transition = null;
    return a.ctx;
  }

  function beginIncoming() {
    resetCtx(b.ctx, width, height);
    return b.ctx;
  }

  /** spec: { type, k, dir, flash, flashColor, cells, seed } or null to cut. */
  function setTransition(spec) {
    transition = spec && spec.k > 0 && spec.k < 1 ? spec : null;
  }

  /**
   * @param overlay optional fn(ctx) drawn onto the composited frame after the
   *   transition and before the grade. Captions go here so a wipe or dissolve
   *   never cuts through lyric text, while still being graded with the picture.
   */
  function present(target, t, options = {}, overlay = null) {
    const ctx = grade.contentCtx;
    if (transition) {
      drawTransition(ctx, {
        from: a.canvas,
        to: b.canvas,
        width,
        height,
        seed: 0,
        ...transition,
      });
    } else {
      resetCtx(ctx, width, height);
      ctx.drawImage(a.canvas, 0, 0);
    }
    if (overlay) {
      ctx.save();
      overlay(ctx);
      ctx.restore();
    }
    last = {
      camera: options.camera || null,
      options: { ...GRADE_DEFAULTS, ...options },
      transition: transition ? { type: transition.type, k: transition.k } : null,
    };
    grade.render(target, t, last.options);
    return last;
  }

  return {
    width,
    height,
    grade,
    content: a.canvas,
    contentCtx: a.ctx,
    incoming: b.canvas,
    incomingCtx: b.ctx,
    get last() {
      return last;
    },
    begin,
    beginIncoming,
    setTransition,
    present,
  };
}

// Helper for shots that want a deterministic shake from an event.
export function shakeAt(t, eventTime, amplitude, fall = 14, seed = 0) {
  const age = t - eventTime;
  if (age < 0) return [0, 0];
  const env = Math.exp(-fall * age);
  return shake(t, amplitude * env, seed);
}

// Cross-fade a grade option set between two shots across their overlap.
export function blendGrade(a, b, k) {
  const out = { ...GRADE_DEFAULTS, ...a };
  for (const key of Object.keys(GRADE_DEFAULTS)) {
    const av = { ...GRADE_DEFAULTS, ...a }[key];
    const bv = { ...GRADE_DEFAULTS, ...b }[key];
    if (typeof av === "number" && typeof bv === "number") out[key] = av + (bv - av) * clamp(k);
    else if (typeof bv !== "undefined" && k >= 0.5) out[key] = bv;
  }
  return out;
}
