// The settings drawer.
//
// Section 4 is the section where she is edited: the lyric runs "switch my current
// to AC, to DC", "blind my vision", "we can travel to A.D., to B.C.", "we can
// unite, so deeply" -- and every one of those is a control in this panel. The
// reference does the same thing, so the drawer is shared across all four shots
// rather than redrawn each time.
//
// Everything is driven by a state object that the shot resolves from song time, so
// a still stays reproducible.
import { at, layer, stroke, disc, rect, type, halo } from "../src/mv-draw.js";

const BRAND = "#4d6bfe";
const BRAND_SOFT = "#7f93ff";
const GIFT = "#83e9e6";
const LINE = "rgba(61,122,156,0.75)";
const TEXT = "#cfe0ee";
const DIM = "#8ba4c2";

export const DRAWER = Object.freeze({ x: 1400, y: 110, w: 360, h: 850 });

const ROW_H = 104;
const PAD = 26;

/** y of a row's baseline inside the drawer. */
export function rowY(i) {
  return DRAWER.y + 96 + i * ROW_H;
}

function label(ctx, text, x, y, color = TEXT, size = 19) {
  type(ctx, text, x, y, size, color, "MV Sans");
}

function sublabel(ctx, text, x, y, color = DIM, align = "left") {
  // the right-hand values are anchored to the panel's right edge, not started there
  type(ctx, text, x, y, 14, color, "MV Mono", align);
}

/** A two-position switch: the chosen side is filled, the other is a rim. */
function segmented(ctx, x, y, w, h, options, active) {
  const segW = (w - 6) / options.length;
  rect(ctx, x, y, w, h, "rgba(9,32,48,0.95)", h / 2, "rgba(61,122,156,0.8)");
  options.forEach((opt, i) => {
    const on = i === active;
    const sx = x + 3 + i * segW;
    if (on) rect(ctx, sx, y + 3, segW - 2, h - 6, BRAND, (h - 6) / 2, null);
    type(
      ctx, opt, sx + segW / 2, y + h / 2 + 6, 17,
      on ? "#ffffff" : DIM, "MV Mono", "center",
    );
  });
}

/** A toggle: the rail brightens as `v` goes 0 -> 1, the knob crosses. */
function toggle(ctx, x, y, w, h, v) {
  const k = Math.max(0, Math.min(1, v));
  const rail = k > 0.5 ? "rgba(77,107,254,0.85)" : "rgba(30,58,80,0.95)";
  rect(ctx, x, y, w, h, rail, h / 2, k > 0.5 ? BRAND_SOFT : LINE);
  const kx = x + h / 2 + (w - h) * k;
  disc(ctx, kx, y + h / 2, h / 2 - 5, k > 0.5 ? "#ffffff" : "#7f93a8", 1);
}

/** A slider: track, travelled part, knob, and the ticks under it. */
function slider(ctx, x, y, w, v, opts = {}) {
  const k = Math.max(0, Math.min(1, v));
  const { ticks = 0, knob = 6, hot = false } = opts;
  stroke(ctx, [[x, y], [x + w, y]], "rgba(30,58,80,0.95)", 4);
  stroke(ctx, [[x, y], [x + w * k, y]], hot ? GIFT : BRAND, 4);
  if (ticks > 0) {
    for (let i = 0; i <= ticks; i++) {
      const tx = x + (w * i) / ticks;
      stroke(ctx, [[tx, y - 7], [tx, y + 7]], "rgba(61,122,156,0.55)", 1.2);
    }
  }
  const kx = x + w * k;
  halo(ctx, kx, y, knob * 4.5, 0.5, hot ? GIFT : BRAND);
  disc(ctx, kx, y, knob, "#ffffff", 1);
  return kx;
}

/**
 * The drawer itself.
 *
 * `state` is whatever the shot has resolved: current (0 = AC, 1 = DC), vision,
 * date, memory, depth, and how far the Done button has been pressed. `open` slides
 * the panel in and `squeeze` is how far the window behind has been narrowed, so the
 * two can be driven from the same number.
 */
export function settingsDrawer(ctx, t, state = {}, opts = {}) {
  const {
    current = 0, vision = 1, date = 0.82, memory = 0, depth = 0.15, done = 0,
  } = state;
  const { alpha = 1, open = 1, focusRow = null, scale = 1, origin = null } = opts;
  const R = DRAWER;

  layer(ctx, alpha, () => {
    ctx.save();
    if (scale !== 1 && origin) {
      ctx.translate(origin[0], origin[1]);
      ctx.scale(scale, scale);
      ctx.translate(-origin[0], -origin[1]);
    }
    // the panel slides in from the right as `open` goes 0 -> 1
    ctx.translate((1 - open) * (R.w + 40), 0);

    rect(ctx, R.x, R.y, R.w, R.h, "rgba(7,26,40,0.97)", 16, "rgba(61,122,156,0.85)");
    // header
    type(ctx, "settings", R.x + PAD, R.y + 46, 21, "#ffffff", "MV Sans");
    type(ctx, "×", R.x + R.w - PAD - 6, R.y + 46, 22, DIM, "MV Sans", "right");
    stroke(ctx, [[R.x + PAD, R.y + 66], [R.x + R.w - PAD, R.y + 66]], "rgba(61,122,156,0.5)", 1);

    const lx = R.x + PAD;
    const valX = R.x + R.w - PAD;

    // 1 current ------------------------------------------------------------
    label(ctx, "Current", lx, rowY(0));
    segmented(ctx, valX - 132, rowY(0) - 22, 132, 40, ["AC", "DC"], current);
    sublabel(ctx, current === 1 ? "to DC," : "to AC,", lx, rowY(0) + 24, DIM);

    // 2 vision -------------------------------------------------------------
    label(ctx, "Vision", lx, rowY(1));
    toggle(ctx, valX - 66, rowY(1) - 22, 66, 36, vision);
    sublabel(ctx, vision > 0.5 ? "on" : "off", lx, rowY(1) + 24, DIM);

    // 3 knowledge date -----------------------------------------------------
    label(ctx, "Knowledge date", lx, rowY(2));
    sublabel(ctx, date > 0.5 ? "A.D. 2026" : "3000 B.C.", valX, rowY(2) - 6, TEXT, "right");
    slider(ctx, lx, rowY(2) + 34, R.w - PAD * 2, date, { ticks: 4, hot: true });
    sublabel(ctx, "3000 B.C.", lx, rowY(2) + 60);
    sublabel(ctx, "A.D. 2026", valX, rowY(2) + 60, DIM, "right");

    // 4 shared memory ------------------------------------------------------
    label(ctx, "Shared memory", lx, rowY(3));
    toggle(ctx, valX - 66, rowY(3) - 22, 66, 36, memory);
    sublabel(ctx, memory > 0.5 ? "on" : "off", lx, rowY(3) + 24, DIM);

    // 5 context depth ------------------------------------------------------
    label(ctx, "Context depth", lx, rowY(4));
    sublabel(ctx, depth > 0.66 ? "deep" : depth > 0.33 ? "medium" : "shallow", valX, rowY(4) - 6, TEXT, "right");
    slider(ctx, lx, rowY(4) + 34, R.w - PAD * 2, depth, { ticks: 0 });
    sublabel(ctx, "shallow", lx, rowY(4) + 60);
    sublabel(ctx, "deep", valX, rowY(4) + 60, DIM, "right");

    // the highlighted row, when the shot is about one control
    if (focusRow != null) {
      const fy = rowY(focusRow) - 46;
      rect(ctx, R.x + 10, fy, R.w - 20, 92, "rgba(77,107,254,0.10)", 10, "rgba(77,107,254,0.5)");
    }

    // Done
    const dy = R.y + R.h - 62;
    rect(
      ctx, valX - 108, dy, 108, 40,
      done > 0.02 ? "rgba(131,233,230,0.22)" : "rgba(30,58,80,0.9)", 20,
      done > 0.02 ? GIFT : "rgba(61,122,156,0.8)",
    );
    type(ctx, "Done", valX - 54, dy + 26, 17, done > 0.02 ? GIFT : DIM, "MV Sans", "center");
    ctx.restore();
  });
}

/**
 * The waveform the Current row actually changes: AC is a sine, DC is a flat line.
 * It is the joke the lyric is making, so the thread behind the drawer shows it.
 */
export function currentTrace(ctx, R, t, dc) {
  const k = Math.max(0, Math.min(1, dc));
  const midY = R.y + R.h * 0.5;
  const amp = R.h * 0.2 * (1 - k);
  layer(ctx, 0.9, () => {
    stroke(ctx, [[R.x, midY], [R.x + R.w, midY]], "rgba(61,122,156,0.45)", 1);
    ctx.beginPath();
    for (let x = R.x; x <= R.x + R.w; x += 3) {
      const u = (x - R.x) / R.w;
      const y = midY - amp * Math.sin(u * Math.PI * 2 * 2.4 + t * 1.8);
      x === R.x ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = k > 0.5 ? GIFT : BRAND_SOFT;
    ctx.lineWidth = 3;
    ctx.stroke();
  });
}
