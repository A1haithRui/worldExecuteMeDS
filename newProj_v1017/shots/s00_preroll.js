// Section 0 片头：闪光警告页 — film time [-5, 0), i.e. song time [-5, 0).
//
// This runs before the audio starts, so there is no beat grid to land on and the
// page is deliberately plain: a warning, the length of the film, and a three
// second countdown. The reference film puts the same page in front of its song
// for the same reason, and our own flash measurement sits right at the
// threshold (9.93% against a 10% cap), so this is not optional.
//
// The copy comes from config.safety so it cannot drift from the check that
// enforces the flash cap; the renderer receives it through `env.safety`.
import { C, at, layer, stroke, type } from "../src/mv-draw.js";
import { drawWhale } from "../src/assets/whale.js";

const BRAND = "#4d6bfe";
const BRAND_SOFT = "#7f93ff";

function mmss(t) {
  const m = Math.floor(t / 60);
  const s = Math.round(t % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function preroll(ctx, t, s, env) {
  const safety = env?.safety ?? {};
  const line = safety.warningLine ?? "本片含有闪烁画面与强光，光敏感者请留意";
  const total = -s.at; // 5.0 seconds
  const u = t - s.at; // 0 .. total
  const songLen = env?.songDuration ?? null;

  // A hairline opens the page, the same gesture that opens the film in
  // boot-power, so the warning does not feel like a different film.
  const open = at(t, s.at + 0.10, s.at + 0.75);
  const textIn = at(t, s.at + 0.65, s.at + 1.35);
  const subIn = at(t, s.at + 1.15, s.at + 1.75);

  layer(ctx, 0.9, () => {
    ctx.fillStyle = "#05090f";
    ctx.fillRect(0, 0, 1920, 1080);
  });

  // the hairline becomes a rule above the block
  const halfW = 620 * open;
  layer(ctx, open, () => {
    ctx.fillStyle = BRAND_SOFT;
    ctx.fillRect(960 - halfW, 352, Math.max(0.001, halfW * 2), 1.5);
  });

  const cx = 960;
  if (textIn > 0) {
    layer(ctx, textIn, () => {
      type(ctx, "WARNING", cx, 312, 15, BRAND_SOFT, "MV Mono", "center");
      type(ctx, line, cx, 452, 42, "#e8eefc", "MV Sans", "center");
    });
  }

  if (subIn > 0) {
    layer(ctx, subIn, () => {
      const bits = [
        "本片包含高对比快切与强光",
        songLen ? `片长 ${mmss(songLen)}` : null,
        "建议在光线充足处观看",
      ].filter(Boolean);
      type(ctx, bits.join("　·　"), cx, 512, 17, "#6b86a8", "MV Mono", "center");
    });
  }

  // Countdown: three seconds, one digit at a time, then the page clears. The
  // digits are driven by song time, so a still is reproducible like any other.
  const cdStart = total - (safety.warningCountdown ?? 3) - 0.2;
  const cd = (u - cdStart) / 1;
  const step = Math.floor(cd); // 0,1,2
  const frac = cd - step;
  if (cd >= 0 && cd < (safety.warningCountdown ?? 3)) {
    const digit = String((safety.warningCountdown ?? 3) - step);
    const pop = 1 - Math.pow(1 - Math.min(1, frac * 4), 3);
    const fadeOut = at(t, s.at + total - 0.45, s.at + total);
    layer(ctx, Math.min(1, pop) * (1 - fadeOut), () => {
      type(ctx, digit, 960, 700, 96 * (0.92 + 0.08 * pop), "#dfe6ef", "MV Sans", "center");
      type(ctx, "即将开始", 960, 748, 15, "#4a6a8c", "MV Mono", "center");
    });

    // progress rule under the countdown
    layer(ctx, 1 - fadeOut, () => {
      const w = 360;
      stroke(ctx, [[960 - w / 2, 800], [960 + w / 2, 800]], "#1f3f52", 1.2);
      stroke(ctx, [[960 - w / 2, 800], [960 - w / 2 + w * Math.min(1, cd / (safety.warningCountdown ?? 3)), 800]], BRAND_SOFT, 1.6);
    });
  }

  // The mark sits small and dim at the foot: whose film this is, without making
  // the warning page look like a title card.
  layer(ctx, at(t, s.at + 1.4, s.at + 2.2) * 0.5, () => {
    drawWhale(ctx, 960, 930, 54, { strokeK: 1, fillK: 1, color: BRAND, alpha: 0.55 });
    type(ctx, "deepseek / harness", 960, 992, 12, "#3d5f76", "MV Mono", "center");
  });

  return { phase: "preroll", u, countdown: cd };
}
