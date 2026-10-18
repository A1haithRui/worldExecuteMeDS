// The character bust, drawn once for every shot that needs her.
//
// The idle motion is a pure function of song time (portrait.js), so a still stays
// reproducible like everything else in the film.
import { loadImages, layer } from "../src/mv-draw.js";
import { idle as portraitIdle } from "../src/engine/portrait.js";

const { images } = loadImages({
  lowlight: "/assets/character/v4/deepseek_bust_v4_lowlight.png",
  silhouette: "/assets/character/v4/deepseek_bust_v4_silhouette.png",
  bust: "/assets/character/deepseek_bust_v3.png",
});

/**
 * Draw the bust centred on (cx, cy) at the given height, with the idle bob.
 * Returns its box, or null while the image is still decoding.
 */
export function figure(ctx, t, key, cx, cy, height, opts = {}) {
  const { alpha = 1, seed = 5, bobAmp = 4 } = opts;
  const img = images[key] || images.bust;
  if (!img || !img.complete || !img.naturalWidth) return null;
  const b = portraitIdle(t, { seed, bobAmp });
  const s = height / 1438;
  const w = 1342 * s;
  const h = 1704 * s;
  layer(ctx, alpha, () =>
    ctx.drawImage(img, cx + b.sway - w / 2, cy + b.bobY - h / 2, w * b.breathe, h * b.breathe),
  );
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}
