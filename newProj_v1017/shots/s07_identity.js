// Section 7 导歌二：设定改的是她本人 — song time [88.929, 103.698). Seven shots.
//
//   pre2-settings 88.929–90.775  the drawer, further down its list
//   pre2-gender   90.775–92.621  Gender: F | M, and she stands in the cell
//   pre2-day      92.621–96.313  On call: an arc whose knob is her spark, the sun
//   pre2-role     96.313–100.006 Role: two letters and a switch
//   pre2-loop     100.006–100.467 back in the drawer: Loop on, Done
//   pre2-trance   100.467–103.237 the three looks drift, then register
//   pre2-loop-b   103.237–103.698 the drawer again
//
// Where section 4 changed her settings, this one changes her: gender, on call, role,
// loop. The controls are the subject, so three of the shots are the control at the
// size of the sheet with her standing in it, and the drawer only appears to open,
// to switch Loop, and to be dismissed.
import { at, layer, stroke, disc, rect, type, halo, ground } from "../src/mv-draw.js";
import { clientWindow, cursorArrow, clickRipple } from "./ui-client.js";
import { figure } from "./figure.js";
import { plateBase, PLATE, paperDisc, tickRing } from "./plate.js";

const BRAND = "#4d6bfe";
const BRAND_SOFT = "#7f93ff";
const GIFT = "#83e9e6";
const DIM = "#8ba4c2";
const LIFT = 0.5;
const easeOut = (k) => 1 - (1 - k) ** 3;
const clamp01 = (k) => Math.max(0, Math.min(1, k));

const SHEET = Object.freeze({ x: 120, y: 80, w: 1250, h: 910 });
const DRAWER = Object.freeze({ x: 1400, y: 110, w: 360, h: 850 });
const ROW_H = 118;
const rowY = (i) => DRAWER.y + 110 + i * ROW_H;

// The identity page, further down the list than the one section 4 opened on.
const ROWS = Object.freeze([
  { key: "gender", label: "Gender", value: "F" },
  { key: "call", label: "On call", value: "A.M." },
  { key: "role", label: "Role", value: "S" },
  { key: "loop", label: "Loop", value: "off" },
]);

/** The drawer, showing the identity rows. */
function identityDrawer(ctx, t, state = {}, opts = {}) {
  const { open = 1, alpha = 1 } = opts;
  layer(ctx, alpha, () => {
    ctx.save();
    ctx.translate((1 - open) * (DRAWER.w + 40), 0);
    const R = DRAWER;
    rect(ctx, R.x, R.y, R.w, R.h, "rgba(7,26,40,0.97)", 16, "rgba(61,122,156,0.85)");
    type(ctx, "settings", R.x + 26, R.y + 46, 21, "#ffffff", "MV Sans");
    type(ctx, "×", R.x + R.w - 32, R.y + 46, 22, DIM, "MV Sans", "right");
    stroke(ctx, [[R.x + 26, R.y + 66], [R.x + R.w - 26, R.y + 66]], "rgba(61,122,156,0.5)", 1);
    // the list is scrolled: a faint row above shows the page continues
    type(ctx, "Context depth", R.x + 26, R.y + 104, 17, "rgba(139,164,194,0.35)", "MV Sans");
    type(ctx, "deep", R.x + R.w - 26, R.y + 104, 14, "rgba(139,164,194,0.35)", "MV Mono", "right");
    stroke(ctx, [[R.x + 26, R.y + 124], [R.x + R.w - 26, R.y + 124]], "rgba(61,122,156,0.3)", 1);

    const lx = R.x + 26;
    const vx = R.x + R.w - 26;

    ROWS.forEach((row, i) => {
      const y = rowY(i);
      type(ctx, row.label, lx, y, 19, "#cfe0ee", "MV Sans");
      if (row.key === "gender") {
        segmented(ctx, vx - 120, y - 20, 120, 36, ["F", "M"], state.gender ?? 0);
      } else if (row.key === "call") {
        // the arc, small: the same control the next shot opens on
        arcSlider(ctx, vx - 120, y - 4, 100, 34, state.call ?? 0.5);
      } else if (row.key === "role") {
        segmented(ctx, vx - 120, y - 20, 120, 36, ["S", "M"], state.role ?? 0);
      } else {
        toggle(ctx, vx - 66, y - 20, 66, 34, state.loop ?? 0);
      }
      type(
        ctx, ROWS[i].value.toLowerCase(),
        lx, y + 24, 14, DIM, "MV Mono",
      );
    });

    const dy = R.y + R.h - 62;
    const done = state.done ?? 0;
    rect(ctx, vx - 108, dy, 108, 40, done > 0.02 ? "rgba(131,233,230,0.22)" : "rgba(30,58,80,0.9)", 20,
      done > 0.02 ? GIFT : "rgba(61,122,156,0.8)");
    type(ctx, "Done", vx - 54, dy + 26, 17, done > 0.02 ? GIFT : DIM, "MV Sans", "center");
    ctx.restore();
  });
}

function segmented(ctx, x, y, w, h, options, active) {
  const segW = (w - 6) / options.length;
  rect(ctx, x, y, w, h, "rgba(9,32,48,0.95)", h / 2, "rgba(61,122,156,0.8)");
  options.forEach((opt, i) => {
    const on = i === active;
    const sx = x + 3 + i * segW;
    if (on) rect(ctx, sx, y + 3, segW - 2, h - 6, BRAND, (h - 6) / 2, null);
    type(ctx, opt, sx + segW / 2, y + h / 2 + 6, 16, on ? "#ffffff" : DIM, "MV Mono", "center");
  });
}

function toggle(ctx, x, y, w, h, v) {
  const k = clamp01(v);
  rect(ctx, x, y, w, h, k > 0.5 ? "rgba(77,107,254,0.85)" : "rgba(30,58,80,0.95)", h / 2,
    k > 0.5 ? BRAND_SOFT : "rgba(61,122,156,0.8)");
  disc(ctx, x + h / 2 + (w - h) * k, y + h / 2, h / 2 - 5, k > 0.5 ? "#ffffff" : "#7f93a8", 1);
}

/** A short arc with a knob: the On call control, at drawer or sheet size. */
function arcSlider(ctx, x, y, w, h, v, opts = {}) {
  const { alpha = 1, big = false, knob = true } = opts;
  const k = clamp01(v);
  layer(ctx, alpha, () => {
    const r = w / 2;
    const cx = x + r;
    const cy = y + h * 0.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI * 0.88, Math.PI * 2.12);
    ctx.strokeStyle = "rgba(61,122,156,0.9)";
    ctx.lineWidth = big ? 3 : 2;
    ctx.stroke();
    const a = Math.PI * 0.88 + Math.PI * 1.24 * k;
    const kx = cx + Math.cos(a) * r;
    const ky = cy + Math.sin(a) * r;
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI * 0.88, a);
    ctx.strokeStyle = GIFT;
    ctx.lineWidth = big ? 4 : 2.4;
    ctx.stroke();
    if (!knob) return;
    halo(ctx, kx, ky, big ? 90 : 34, 0.5, GIFT);
    disc(ctx, kx, ky, big ? 14 : 6, "#ffffff", 1);
  });
}

// ---------------------------------------------------------------------------
// pre2-settings — the drawer opens on the identity page.
// ---------------------------------------------------------------------------
function pre2Settings(ctx, t, s) {
  const u = t - s.at;
  ground(ctx, t, [800, 480], true, LIFT);
  clientWindow(ctx, SHEET, t, {
    tone: "chat", sideW: 0, presence: "online",
    chip: { text: "harness · thinking", on: true },
    threadTitle: "me, as geometry", markSize: 0, sendMode: "stop",
  });
  identityDrawer(ctx, t, { gender: 0, call: 0.5, role: 0, loop: 0 }, { open: easeOut(at(u, 0.05, 0.6)) });

  // the pointer is already on Settings and clicks; the view closes on Gender
  const px = 1240 + (rowY(0) + 20 - 1240) * easeOut(at(u, 0.4, 1.5));
  const py = 300 + (DRAWER.x + 60 - 300) * easeOut(at(u, 0.4, 1.5));
  cursorArrow(ctx, py, px, 1.4, 1);
  clickRipple(ctx, DRAWER.x + 26, rowY(0), t, s.at + 1.2, GIFT);
  return { phase: "settings" };
}

// ---------------------------------------------------------------------------
// pre2-gender — the control at the size of the sheet, and she stands in the cell.
// ---------------------------------------------------------------------------
function pre2Gender(ctx, t, s) {
  const u = t - s.at;
  plateBase(ctx, t, { index: 1 });

  const cx = 960;
  const cy = 520;
  const cellW = 520;
  const cellH = 620;
  const gap = 26;
  // F on the first letter, M on the switch
  const m = at(u, 0.75, 0.95);

  const drawCell = (i, letter, on) => {
    const x = cx + (i === 0 ? -1 : 1) * (cellW / 2 + gap / 2) - cellW / 2;
    const y = cy - cellH / 2;
    rect(ctx, x, y, cellW, cellH, on ? "rgba(77,107,254,0.16)" : "rgba(9,30,46,0.7)", 18,
      on ? BRAND_SOFT : "rgba(61,122,156,0.7)");
    type(ctx, letter, x + cellW / 2, y + 96, 62, on ? "#ffffff" : "rgba(139,164,194,0.55)", "MV Sans", "center");
    return { x, y, w: cellW, h: cellH };
  };

  const cellF = drawCell(0, "F", m < 0.5);
  const cellM = drawCell(1, "M", m >= 0.5);

  // she stands in the chosen cell. The register changes rather than the person:
  // the boy's plate in this film is the same character printed colder and harder,
  // because the only two looks the art has are hers.
  const cell = m >= 0.5 ? cellM : cellF;
  const fk = m >= 0.5 ? "silhouette" : "bust";
  const figH = 430;
  layer(ctx, m >= 0.5 ? 0.9 : 1, () => {
    figure(ctx, t, fk, cell.x + cell.w / 2, cell.y + cell.h * 0.62, figH, {
      alpha: m >= 0.5 ? 0.75 : 0.95,
      seed: 7,
      bobAmp: 2,
    });
  });
  if (m >= 0.5) {
    // the letter is printed over him once the switch lands
    type(ctx, "M", cell.x + cell.w / 2, cell.y + 96, 62, "#ffffff", "MV Sans", "center");
  }

  const px = cellM.x + cellM.w / 2 + 60;
  cursorArrow(ctx, px, cell.y + cell.h * 0.5, 1.5, 1);
  clickRipple(ctx, cellM.x + cellM.w / 2, cy, t, s.at + 0.85, GIFT);
  return { phase: "gender", m: Number(m.toFixed(2)) };
}

// ---------------------------------------------------------------------------
// pre2-day — On call: the arc, the sun behind her head, and then dusk.
// ---------------------------------------------------------------------------
function pre2Day(ctx, t, s) {
  const u = t - s.at;
  plateBase(ctx, t, { index: 2 });

  // the pointer takes the knob on the cut and pulls: up over the top, then down
  const pull = u < 1.6 ? easeOut(at(u, 0.15, 1.6)) : 1 - easeOut(at(u, 1.6, 3.3));
  const v = 0.5 + (pull - 0.5) * 1.0;
  const k = clamp01(v);

  // the light follows the knob, and the knob is the sun: brightest when it stands
  // over her head at the top of the arc, black at either end of the pull
  const dayness = clamp01(1 - Math.abs(k - 0.5) * 2);
  layer(ctx, 1, () => {
    const g = ctx.createLinearGradient(0, 0, 0, 1080);
    g.addColorStop(0, `rgba(24,70,104,${(0.15 + 0.5 * dayness).toFixed(3)})`);
    g.addColorStop(1, `rgba(3,12,20,${(0.55 - 0.3 * dayness).toFixed(3)})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1920, 1080);
  });

  // the arc has to keep its ends inside the sheet: at the wider radius the sun
  // travelled below the frame at either end of the pull and the control vanished
  const arcW = 1100;
  const arcX = 960 - arcW / 2;
  const arcY = 490;
  const arcH = 420;
  arcSlider(ctx, arcX, arcY, arcW, arcH, k, { big: true, knob: false });

  // her bust, standing under the arc
  const dim = 0.35 + 0.65 * dayness;
  layer(ctx, dim, () => {
    figure(ctx, t, "silhouette", 960, 700, 400, { alpha: 0.55, seed: 11, bobAmp: 2 });
  });

  // the knob IS her spark: the sun travels the arc, so the light and the control
  // are the same object. Drawing a knob as well put two dots on the same control.
  const a = Math.PI * 0.88 + Math.PI * 1.24 * k;
  const kx = arcX + arcW / 2 + Math.cos(a) * (arcW / 2);
  const ky = arcY + arcH / 2 + Math.sin(a) * (arcW / 2);
  halo(ctx, kx, ky, 300 * (0.4 + dayness * 0.6), 0.35 + 0.4 * dayness, GIFT);
  paperDisc(ctx, kx, ky, 52 + 26 * dayness, `rgba(131,233,230,${(0.35 + 0.5 * dayness).toFixed(2)})`, GIFT);
  cursorArrow(ctx, kx + 46, ky + 40, 1.5, 1);

  type(ctx, dayness > 0.5 ? "A.M." : "P.M.", 960, 900, 40, dayness > 0.5 ? GIFT : DIM, "MV Mono", "center");
  return { phase: "day", dayness: Number(dayness.toFixed(2)) };
}

// ---------------------------------------------------------------------------
// pre2-role — S and M, and the sheet jolts with each letter.
// ---------------------------------------------------------------------------
function pre2Role(ctx, t, s) {
  const u = t - s.at;
  // the split: S printed on the first letter, M on the second
  const m = at(u, 1.55, 1.75);
  // the sheet changes weight with the switch
  const jolt = Math.sin(u * 26) * 6 * (at(u, 1.5, 1.6) * (1 - at(u, 1.9, 2.2)));
  const drop = at(u, 2.4, 2.75) * (1 - at(u, 2.9, 3.2));

  ctx.save();
  ctx.translate(0, jolt + drop * 46);
  plateBase(ctx, t, { index: 3 });

  const cellW = 500;
  const cellH = 560;
  const cy = 500;
  const gap = 30;
  const x0 = 960 - cellW - gap / 2;
  const x1 = 960 + gap / 2;

  const draw = (x, letter, on) => {
    const y = cy - cellH / 2;
    rect(ctx, x, y, cellW, cellH, on ? "rgba(77,107,254,0.16)" : "rgba(9,30,46,0.7)", 18,
      on ? BRAND_SOFT : "rgba(61,122,156,0.7)");
    type(ctx, letter, x + cellW / 2, cy + 46, 150, on ? "#ffffff" : "rgba(139,164,194,0.45)", "MV Sans", "center");
    return { x, y };
  };
  draw(x0, "S", m < 0.5);
  draw(x1, "M", m >= 0.5);

  // the switch between them
  const swX = 960 - 40;
  const swY = cy + 200;
  rect(ctx, swX, swY, 80, 40, m > 0.5 ? "rgba(77,107,254,0.85)" : "rgba(30,58,80,0.95)", 20,
    m > 0.5 ? BRAND_SOFT : "rgba(61,122,156,0.8)");
  disc(ctx, swX + 20 + 40 * m, swY + 20, 15, "#ffffff", 1);

  const px = swX + 20 + 40 * m + 46;
  cursorArrow(ctx, px, swY + 44, 1.5, 1);
  clickRipple(ctx, swX + 60, swY + 20, t, s.at + 1.6, GIFT);
  ctx.restore();

  return { phase: "role", m: Number(m.toFixed(2)) };
}

// ---------------------------------------------------------------------------
// the two drawer hits
// ---------------------------------------------------------------------------
function loopShot(b) {
  return function loop(ctx, t, s) {
    const u = t - s.at;
    ground(ctx, t, [800, 480], true, LIFT);
    clientWindow(ctx, SHEET, t, {
      tone: "chat", sideW: 0, presence: "online",
      chip: { text: "harness · thinking", on: true },
      threadTitle: "me, as geometry", markSize: 0, sendMode: "stop",
    });
    const loop = at(u, 0.1, 0.18);
    const done = at(u, 0.24, 0.32);
    identityDrawer(ctx, t, { gender: 1, call: 0.5, role: 1, loop, done });
    cursorArrow(ctx, DRAWER.x + DRAWER.w - 40, rowY(3) + 40, 1.4, 1);
    clickRipple(ctx, DRAWER.x + DRAWER.w - 34, rowY(3), t, s.at + 0.14, GIFT);
    clickRipple(ctx, DRAWER.x + DRAWER.w - 80, DRAWER.y + DRAWER.h - 42, t, s.at + 0.28, GIFT);
    return { phase: "loop", which: b };
  };
}

// ---------------------------------------------------------------------------
// pre2-trance — the three looks drift apart and then register into one.
// ---------------------------------------------------------------------------
function pre2Trance(ctx, t, s) {
  const u = t - s.at;
  plateBase(ctx, t, { index: 4 });
  const settle = easeOut(at(u, 1.5, 2.6));
  const look = (i) => {
    const spread = (1 - settle) * 260;
    const a = u * 0.9 + (i / 3) * Math.PI * 2;
    const cx = 960 + Math.cos(a) * spread * (0.6 + i * 0.2);
    const cy = 520 + Math.sin(a) * spread * 0.5;
    const keys = ["bust", "lowlight", "silhouette"];
    layer(ctx, 0.4 + 0.6 * (1 - i * 0.18), () => {
      figure(ctx, t, keys[i], cx, cy, 380 + i * 20, {
        alpha: 0.5 + 0.4 * (1 - settle),
        seed: 20 + i * 7,
        bobAmp: 3,
      });
    });
  };
  look(0);
  look(1);
  look(2);
  // once they register, the boy is what the settings were left at
  if (settle > 0.6) {
    layer(ctx, (settle - 0.6) / 0.4, () => {
      figure(ctx, t, "silhouette", 960, 560, 460, { alpha: 0.8, seed: 3, bobAmp: 2 });
    });
  }
  return { phase: "trance", settle: Number(settle.toFixed(2)) };
}

export const SECTION7_RENDER = Object.freeze({
  "pre2-settings": pre2Settings,
  "pre2-gender": pre2Gender,
  "pre2-day": pre2Day,
  "pre2-role": pre2Role,
  "pre2-loop": loopShot("a"),
  "pre2-trance": pre2Trance,
  "pre2-loop-b": loopShot("b"),
});

export const SECTION7_IMPLEMENTED = Object.freeze(Object.keys(SECTION7_RENDER));
