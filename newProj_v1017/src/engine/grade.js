// Post grade: the pass that makes a canvas render read as graded film rather
// than as a web page. Everything here is a pure function of the content layer
// plus the frame's options, so reverse seeks still produce identical bytes.
//
// No WebGL and no getImageData: the bloom is an explicit glow layer, built by
// crushing the content with a contrast/brightness filter so only the bright
// saturated elements survive, blurring it at quarter resolution and adding it
// back with `lighter`.
import { clamp, mix, hash01 } from "./motion.js";

const GLOW_DIV = 4;
const TILE = 256;
const NOISE_VARIANTS = 4;

export const GRADE_DEFAULTS = Object.freeze({
  exposure: 1,
  glow: 0.42,
  // Darken then crush hard: the flat cyan sits at roughly 0.6 luma and should
  // only kiss the bloom, while the near-white skin and paper reach it fully.
  glowBrightness: 0.72,
  glowContrast: 3.0,
  glowSaturation: 1.25,
  glowBlur: 10,
  glowTint: "#ffffff",
  aberration: 0,
  flash: 0,
  flashColor: "#ffffff",
  scanline: 0.022,
  scanlinePeriod: 3,
  vignette: 0.36,
  grain: 0.03,
  tint: null,
  tintAmount: 0,
  fade: 0,
  fadeColor: "#02070d",
  // 1 = the film's chosen colour. Lower values pull the finished frame toward
  // grey without changing its hue, which is how the product world reads as
  // colourless and the launch reads as the moment colour arrives.
  sat: 1,
});

function makeNoiseTile(seed) {
  const c = document.createElement("canvas");
  c.width = TILE;
  c.height = TILE;
  const g = c.getContext("2d");
  const img = g.createImageData(TILE, TILE);
  let s = seed >>> 0;
  for (let i = 0; i < img.data.length; i += 4) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const v = s >>> 24;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}

function makeScanlineTile(period) {
  const c = document.createElement("canvas");
  c.width = 1;
  c.height = period;
  const g = c.getContext("2d");
  g.fillStyle = "#000000";
  g.fillRect(0, 0, 1, 1);
  return c;
}

export function createGrade(width = 1920, height = 1080, { noiseSeed = 71124 } = {}) {
  const content = document.createElement("canvas");
  content.width = width;
  content.height = height;
  const contentCtx = content.getContext("2d");

  const gw = Math.max(1, Math.round(width / GLOW_DIV));
  const gh = Math.max(1, Math.round(height / GLOW_DIV));
  const glow = document.createElement("canvas");
  glow.width = gw;
  glow.height = gh;
  const glowCtx = glow.getContext("2d");

  const noiseTiles = Array.from({ length: NOISE_VARIANTS }, (_, i) =>
    makeNoiseTile(noiseSeed + i * 7919),
  );
  const scanTiles = new Map();

  function noisePattern(ctx, t) {
    const frame = Math.round(t * 60);
    // Modulo, not remainder: the film now starts on a warning page at negative
    // song time, and a negative frame index yields undefined here, which makes
    // createPattern throw on the very first preroll frame.
    const variant = noiseTiles[((frame % NOISE_VARIANTS) + NOISE_VARIANTS) % NOISE_VARIANTS];
    const p = ctx.createPattern(variant, "repeat");
    const ox = Math.round(hash01(frame, 1) * TILE);
    const oy = Math.round(hash01(frame, 2) * TILE);
    if (typeof DOMMatrix === "function") {
      p.setTransform(new DOMMatrix().translateSelf(ox, oy));
    }
    return p;
  }

  function scanPattern(ctx, period) {
    let tile = scanTiles.get(period);
    if (!tile) {
      tile = makeScanlineTile(period);
      scanTiles.set(period, tile);
    }
    return ctx.createPattern(tile, "repeat");
  }

  // Cached because rebuilding this gradient every frame is measurable at 1080p.
  let vignetteKey = "";
  let vignetteGradient = null;
  function vignetteFor(ctx, strength) {
    const key = `${strength.toFixed(3)}`;
    if (key !== vignetteKey || !vignetteGradient) {
      const g = ctx.createRadialGradient(
        width * 0.5, height * 0.48, Math.min(width, height) * 0.28,
        width * 0.5, height * 0.48, Math.max(width, height) * 0.72,
      );
      g.addColorStop(0, "rgba(2,7,13,0)");
      g.addColorStop(0.62, `rgba(2,7,13,${(strength * 0.35).toFixed(4)})`);
      g.addColorStop(1, `rgba(2,7,13,${strength.toFixed(4)})`);
      vignetteGradient = g;
      vignetteKey = key;
    }
    return vignetteGradient;
  }

  function clearContent() {
    contentCtx.setTransform(1, 0, 0, 1, 0, 0);
    contentCtx.globalAlpha = 1;
    contentCtx.globalCompositeOperation = "source-over";
    contentCtx.filter = "none";
    contentCtx.clearRect(0, 0, width, height);
  }

  /**
   * Composite the content layer onto `target` and grade it.
   * `camera` is {x, y, zoom, rotation, shakeX, shakeY} in content pixels.
   */
  function render(target, t, options = {}) {
    const o = { ...GRADE_DEFAULTS, ...options };
    const ctx = target.getContext ? target.getContext("2d") : target;
    const cam = options.camera || null;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.filter = "none";
    ctx.clearRect(0, 0, width, height);

    // --- camera + base blit ------------------------------------------------
    const zoom = cam?.zoom ?? 1;
    const rot = cam?.rotation ?? 0;
    const cx = cam?.x ?? width / 2;
    const cy = cam?.y ?? height / 2;
    const sx = cam?.shakeX ?? 0;
    const sy = cam?.shakeY ?? 0;
    if (zoom === 1 && rot === 0 && sx === 0 && sy === 0) {
      ctx.drawImage(content, 0, 0);
    } else {
      ctx.save();
      ctx.translate(cx + sx, cy + sy);
      if (rot) ctx.rotate(rot);
      ctx.scale(zoom, zoom);
      ctx.translate(-cx, -cy);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(content, 0, 0);
      ctx.restore();
    }

    // --- chromatic split on hits ------------------------------------------
    if (o.aberration > 0.01) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = clamp(o.aberration / 8) * 0.5;
      ctx.drawImage(content, o.aberration, 0);
      ctx.drawImage(content, -o.aberration, 0);
      ctx.restore();
    }

    // --- bloom -------------------------------------------------------------
    if (o.glow > 0.001) {
      glowCtx.setTransform(1, 0, 0, 1, 0, 0);
      glowCtx.globalCompositeOperation = "source-over";
      glowCtx.globalAlpha = 1;
      glowCtx.filter = "none";
      glowCtx.clearRect(0, 0, gw, gh);
      glowCtx.filter =
        `brightness(${o.glowBrightness}) contrast(${o.glowContrast}) ` +
        `saturate(${o.glowSaturation}) blur(${Math.max(1, o.glowBlur / GLOW_DIV)}px)`;
      glowCtx.drawImage(content, 0, 0, gw, gh);
      glowCtx.filter = "none";

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = clamp(o.glow) * 0.85;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(glow, 0, 0, width, height);
      ctx.restore();
    }

    // --- flash -------------------------------------------------------------
    if (o.flash > 0.001) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = clamp(o.flash, 0, 0.7);
      ctx.fillStyle = o.flashColor;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    // --- exposure ----------------------------------------------------------
    if (o.tint && o.tintAmount > 0.001) {
      ctx.save();
      ctx.globalCompositeOperation = "overlay";
      ctx.globalAlpha = clamp(o.tintAmount);
      ctx.fillStyle = o.tint;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    // --- scanlines ---------------------------------------------------------
    if (o.scanline > 0.001) {
      ctx.save();
      ctx.globalAlpha = clamp(o.scanline);
      ctx.fillStyle = scanPattern(ctx, Math.max(2, Math.round(o.scanlinePeriod)));
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    // --- vignette ----------------------------------------------------------
    if (o.vignette > 0.001) {
      ctx.save();
      ctx.fillStyle = vignetteFor(ctx, clamp(o.vignette));
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    // --- grain -------------------------------------------------------------
    if (o.grain > 0.001) {
      ctx.save();
      ctx.globalCompositeOperation = "overlay";
      ctx.globalAlpha = clamp(o.grain);
      ctx.fillStyle = noisePattern(ctx, t);
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    // --- fade to black -----------------------------------------------------
    if (o.fade > 0.001) {
      ctx.save();
      ctx.globalAlpha = clamp(o.fade);
      ctx.fillStyle = o.fadeColor;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    // --- colour state ------------------------------------------------------
    // The product world has no colour at all; colour is what "running" looks
    // like, so it arrives with the launch and not before. This is applied after
    // everything else -- including the fade, and the words too, because the stage
    // draws the lyrics before it calls render -- so the whole frame is colourless
    // together rather than one element escaping the state.
    if (o.sat < 0.999) {
      ctx.save();
      ctx.globalCompositeOperation = "saturation";
      ctx.globalAlpha = 1 - clamp(o.sat);
      ctx.fillStyle = "hsl(0, 0%, 50%)";
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.filter = "none";
  }

  return { content, contentCtx, glow, clearContent, render, width, height };
}
