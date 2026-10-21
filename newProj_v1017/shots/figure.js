// The character bust, drawn once for every shot that needs her.
//
// The idle motion is a pure function of song time (portrait.js), so a still stays
// reproducible like everything else in the film.
import { loadImages, layer } from "../src/mv-draw.js";
import { idle as portraitIdle } from "../src/engine/portrait.js";

const { images, ready } = loadImages({
  lowlight: "/assets/character/v4/deepseek_bust_v4_lowlight.png",
  silhouette: "/assets/character/v4/deepseek_bust_v4_silhouette.png",
  bust: "/assets/character/deepseek_bust_v3.png",
  // Section 8 needs the fourth pose: the one she turns away in. The bust looks at
  // the thread; the profile is already looking down, so "head bowed towards the
  // thread" is a pose we own rather than a rotation we fake on the bust.
  profile: "/assets/character/deepseek_profile_v3.png",
  // The two plates generated from docs/character-prompts-v1.md and processed by
  // tools/process-character-raw.py: same framing, same inks, so all of them can be
  // drawn at the same (cx, cy, height) and land on top of each other.
  man: "/assets/character/deepseek_man_bust.png",
  cat: "/assets/character/deepseek_cat_bust.png",
  // The god plate: same registration as the others, printed in paper. The shot shows
  // it dim first (the paper ink has not been laid) and then floods the white in.
  godPaper: "/assets/character/deepseek_god_paper.png",
});

/** Resolves when the bust images have decoded. The renderer must await this:
 * without it the first frame can be drawn before the art exists, which shows up
 * as a frame with no character in it and as a flaky determinism check. */
export const figureReady = ready;

/** The decoded plates, for shots that need to draw one at a placement of their
 * own (the layered reach pose moves its hand, so it cannot go through figure()). */
export const figureImages = images;

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
