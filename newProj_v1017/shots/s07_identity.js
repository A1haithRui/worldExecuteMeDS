// Section 7 导歌二：设定改的是她本人 — song time [88.929, 103.698). Seven shots.
//
//   pre2-settings 88.929–90.775  the drawer, further down its list
//   pre2-gender   90.775–92.621  Gender: F | M, and she stands in the cell
//   pre2-day      92.621–96.313  On call: the sun crosses the day, five things happen
//   pre2-role     96.313–100.006 Role: serif | mono -- two specimens and a switch
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
import { lineStart } from "./lines.js";

const BRAND = "#4d6bfe";
const BRAND_SOFT = "#7f93ff";
const GIFT = "#83e9e6";
const DIM = "#8ba4c2";
const LIFT = 0.5;
const easeOut = (k) => 1 - (1 - k) ** 3;
const clamp01 = (k) => Math.max(0, Math.min(1, k));

// Her own three inks, so the small portraits in this section read as her plates
// rather than as icons.
const AZURE = "#00b4e6";
const PAPER = "#f2f7fa";
const NAVY = "#041220";

/**
 * Which plate she is printed on once the Gender row says M.
 *
 * The reference prints a real male plate for this; we have only her, so the M look
 * is the lowlit print -- the same drawing with the colour taken down, which at least
 * stays legible in the dark room the day plate is. When `deepseek_man_bust.png`
 * exists it is a one-word change here; see docs/character-prompts-v1.md.
 */
const M_LOOK = "lowlight";

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

  // she stands in the chosen cell. Until the male plate exists, the M look is the
// lowlit silhouette -- the same character printed colder and harder, because the
// only two looks the art has are hers.
  const cell = m >= 0.5 ? cellM : cellF;
  const fk = m >= 0.5 ? M_LOOK : "bust";
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
// pre2-day — On call: the sun crosses the day, and the day happens to her.
// ---------------------------------------------------------------------------
// The arc is the control (AM at one end, PM at the other) and the sun is its knob,
// so one object does both jobs. What the first pass was missing is the middle of
// the sentence: "and then do whatever" deserves five ordinary things rather than an
// empty sheet, so the day is a strip of five small plates under the arc and each
// one lights as the sun passes over it.
const DAY = Object.freeze({
  x0: 360, x1: 1560, baseY: 648, apexY: 236,
  stripX: 409, stripY: 806, stripW: 206, stripH: 152, gap: 18,
});

/** The day arc is a flat parabola, so the sun's height is a function of its x. */
function dayArcY(x) {
  const s = ((x - DAY.x0) / (DAY.x1 - DAY.x0) - 0.5) * 2;
  return DAY.baseY - (DAY.baseY - DAY.apexY) * (1 - s * s);
}

/** The five things a day is made of, and when they happen. */
const DAY_EVENTS = Object.freeze([
  { time: "06:10", word: "wake", icon: "bed", eye: 0 },
  { time: "09:40", word: "out", icon: "door", eye: 1 },
  { time: "12:30", word: "eat", icon: "bowl", eye: 1 },
  { time: "18:00", word: "work", icon: "screen", eye: 1 },
  { time: "23:50", word: "sleep", icon: "moon", eye: 0 },
]);

/**
 * A small her, built from shapes instead of a plate: at 30px tall a 1704px PNG
 * would be an eightfold downscale -- the sampling path that once broke determinism
 * -- and at this size the shapes are also simply more legible than the art.
 */
function miniHer(ctx, cx, cy, r, opts = {}) {
  const { eye = 1, alpha = 1 } = opts;
  layer(ctx, alpha, () => {
    disc(ctx, cx, cy, r, AZURE, 1);
    disc(ctx, cx - r * 0.5, cy + r * 0.56, r * 0.5, AZURE, 1);
    disc(ctx, cx + r * 0.56, cy + r * 0.5, r * 0.46, AZURE, 1);
    // the ahoge loop every version of her keeps
    stroke(ctx, [[cx - r * 0.04, cy - r * 0.98], [cx + r * 0.2, cy - r * 1.4], [cx + r * 0.5, cy - r * 1.18]],
      AZURE, 2.4, 0.95);
    // the face, only as much of it as the fringe leaves bare
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.16, cy + r * 0.14, r * 0.42, r * 0.52, 0, 0, Math.PI * 2);
    ctx.fillStyle = PAPER;
    ctx.fill();
    // the fringe sweeping down over the hidden eye
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.6, cy - r * 0.5);
    ctx.quadraticCurveTo(cx + r * 0.24, cy - r * 0.82, cx + r * 0.44, cy - r * 0.04);
    ctx.quadraticCurveTo(cx + r * 0.12, cy + r * 0.04, cx - r * 0.04, cy + r * 0.52);
    ctx.quadraticCurveTo(cx - r * 0.5, cy + r * 0.2, cx - r * 0.6, cy - r * 0.5);
    ctx.closePath();
    ctx.fillStyle = AZURE;
    ctx.fill();
    if (eye) disc(ctx, cx - r * 0.34, cy + r * 0.02, r * 0.09, NAVY, 1);
    else stroke(ctx, [[cx - r * 0.46, cy + r * 0.02], [cx - r * 0.22, cy + r * 0.02]], NAVY, 1.6, 0.9);
  });
}

/** The day's five pictograms: flat shapes in the plate's own ink. */
function dayIcon(ctx, kind, x, y, w, h, on) {
  const ink = on > 0.55 ? "#dff3fb" : "rgba(139,164,194,0.62)";
  const line = on > 0.55 ? GIFT : "rgba(71,140,175,0.55)";
  if (kind === "bed") {
    stroke(ctx, [[x + 4, y + h * 0.58], [x + w - 4, y + h * 0.58]], line, 2.4, 1);
    stroke(ctx, [[x + 6, y + h * 0.58], [x + 6, y + h * 0.9]], line, 2.4, 1);
    stroke(ctx, [[x + w - 6, y + h * 0.58], [x + w - 6, y + h * 0.9]], line, 2.4, 1);
    rect(ctx, x + 10, y + h * 0.34, w * 0.36, h * 0.2, ink, 4);
    type(ctx, "z", x + w - 18, y + h * 0.26, 20, ink, "MV Mono", "center");
  } else if (kind === "door") {
    // a door standing open, and the day going out through it
    stroke(ctx, [[x + 14, y + h * 0.14], [x + w * 0.52, y + h * 0.14], [x + w * 0.52, y + h * 0.9], [x + 14, y + h * 0.9], [x + 14, y + h * 0.14]],
      line, 2.2, 1);
    stroke(ctx, [[x + 14, y + h * 0.9], [x + w * 0.36, y + h * 0.2]], ink, 2.4, 1);
    stroke(ctx, [[x + w * 0.6, y + h * 0.52], [x + w - 6, y + h * 0.52]], ink, 2.2, 0.95);
    stroke(ctx, [[x + w - 20, y + h * 0.42], [x + w - 6, y + h * 0.52], [x + w - 20, y + h * 0.62]], ink, 2.2, 0.95);
  } else if (kind === "bowl") {
    ctx.beginPath();
    ctx.arc(x + w * 0.5, y + h * 0.56, w * 0.3, 0, Math.PI);
    ctx.strokeStyle = ink;
    ctx.lineWidth = 3;
    ctx.stroke();
    stroke(ctx, [[x + w * 0.2, y + h * 0.56], [x + w * 0.8, y + h * 0.56]], line, 2, 1);
    stroke(ctx, [[x + w * 0.34, y + h * 0.2], [x + w * 0.68, y + h * 0.5]], ink, 2.4, 1);
    stroke(ctx, [[x + w * 0.5, y + h * 0.18], [x + w * 0.8, y + h * 0.48]], ink, 2.4, 1);
    stroke(ctx, [[x + w * 0.2, y + h * 0.72], [x + w * 0.2, y + h * 0.84]], line, 1.6, 0.7);
    stroke(ctx, [[x + w * 0.34, y + h * 0.72], [x + w * 0.34, y + h * 0.88]], line, 1.6, 0.7);
  } else if (kind === "screen") {
    rect(ctx, x + 8, y + h * 0.16, w - 16, h * 0.46, "rgba(10,32,46,0.9)", 4, line);
    stroke(ctx, [[x + 18, y + h * 0.28], [x + w * 0.5, y + h * 0.28]], ink, 2, 0.9);
    stroke(ctx, [[x + 18, y + h * 0.38], [x + w * 0.62, y + h * 0.38]], ink, 2, 0.7);
    stroke(ctx, [[x + 18, y + h * 0.48], [x + w * 0.4, y + h * 0.48]], ink, 2, 0.5);
    stroke(ctx, [[x + w * 0.5, y + h * 0.62], [x + w * 0.5, y + h * 0.78]], line, 2, 1);
    stroke(ctx, [[x + w * 0.34, y + h * 0.82], [x + w * 0.66, y + h * 0.82]], line, 2.4, 1);
  } else {
    // moon: a crescent, drawn as one path so no background disc is needed
    const cx = x + w * 0.46;
    const cy = y + h * 0.46;
    const r = w * 0.26;
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI * 0.42, Math.PI * 1.58, false);
    ctx.arc(cx + r * 0.5, cy, r * 0.9, Math.PI * 1.58, Math.PI * 0.42, true);
    ctx.closePath();
    ctx.fillStyle = ink;
    ctx.fill();
    stroke(ctx, [[x + w * 0.74, y + h * 0.24], [x + w * 0.74, y + h * 0.36]], line, 1.6, 0.8);
    stroke(ctx, [[x + w * 0.68, y + h * 0.3], [x + w * 0.8, y + h * 0.3]], line, 1.6, 0.8);
    stroke(ctx, [[x + w * 0.56, y + h * 0.66], [x + w * 0.56, y + h * 0.74]], line, 1.4, 0.6);
  }
}

function pre2Day(ctx, t, s) {
  plateBase(ctx, t, { index: 2 });

  // The day is cued to the line that says it: "From AM to PM". Before it the sun is
  // parked at AM, after it the night comes down -- so the whole crossing happens
  // inside the sentence, not at an offset somebody picked.
  const startK = Math.max(lineStart(60) - 0.28, s.at + 0.12);
  const endK = Math.max(lineStart(60) + 1.88, startK + 1.4);
  const k = clamp01(at(t, startK, endK));
  const day = Math.sin(Math.PI * k); // 0 at dawn, 1 at noon, 0 at dusk
  const night = clamp01(at(t, endK, s.until - 0.03));
  const bright = (0.3 + 0.7 * day) * (1 - 0.72 * night);

  // the plate's own light comes from the sun
  layer(ctx, 1, () => {
    const g = ctx.createLinearGradient(0, 180, 0, 1000);
    g.addColorStop(0, `rgba(24,70,104,${(0.08 + 0.4 * day).toFixed(3)})`);
    g.addColorStop(1, `rgba(3,12,20,${(0.5 - 0.22 * day + 0.34 * night).toFixed(3)})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1920, 1080);
  });

  // the arc, and the horizon it lands on
  const arc = [];
  for (let x = DAY.x0; x <= DAY.x1; x += 20) arc.push([x, dayArcY(x)]);
  stroke(ctx, arc, `rgba(131,233,230,${(0.22 + 0.55 * bright).toFixed(3)})`, 2.2, 1);
  stroke(ctx, [[DAY.x0 - 60, DAY.baseY], [DAY.x1 + 60, DAY.baseY]], "rgba(71,140,175,0.45)", 1.2, 0.9);

  // AM / PM: solid while it is that half of the day, an outline while it is not.
  // Outlined type is the plate's own way of saying "not set" (the same device the
  // disabled letters get in pre2-role).
  const endLabel = (label, x, align, on) => {
    ctx.font = `400 62px "MV Sans"`;
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = align;
    if (on > 0.5) {
      type(ctx, label, x, DAY.baseY + 66, 62, "#eef6ff", "MV Sans", align);
      stroke(ctx, [[align === "right" ? x - 96 : x, DAY.baseY + 82], [align === "right" ? x : x + 96, DAY.baseY + 82]], GIFT, 2, 0.7);
    } else {
      ctx.strokeStyle = "rgba(131,233,230,0.5)";
      ctx.lineWidth = 1.6;
      ctx.strokeText(label, x, DAY.baseY + 66);
    }
  };
  endLabel("AM", DAY.x0 - 26, "right", k < 0.52 ? 1 : 0);
  endLabel("PM", DAY.x1 + 26, "left", k >= 0.52 ? 1 : 0);

  // her, on call: the same plate the whole day, only the light on it changes
  layer(ctx, 0.32 + 0.66 * bright, () => {
    figure(ctx, t, M_LOOK, 960, 566, 348, { alpha: 0.95, seed: 11, bobAmp: 2 });
  });

  // the five things a day is made of: each one lights as the sun passes over it
  DAY_EVENTS.forEach((ev, i) => {
    const x = DAY.stripX + i * (DAY.stripW + DAY.gap);
    const y = DAY.stripY;
    const kIn = 0.08 + i * 0.2;
    const on = clamp01((k - kIn) / 0.05) * (1 - 0.45 * clamp01((k - (kIn + 0.19)) / 0.1));
    const a = 0.44 + 0.56 * on;
    layer(ctx, a, () => {
      rect(ctx, x, y, DAY.stripW, DAY.stripH, "rgba(7,26,40,0.9)", 6,
        on > 0.55 ? GIFT : "rgba(61,122,156,0.75)");
      type(ctx, ev.time, x + 14, y + 24, 13, on > 0.55 ? GIFT : DIM, "MV Mono");
      dayIcon(ctx, ev.icon, x + 12, y + 36, 104, DAY.stripH - 52, on);
      miniHer(ctx, x + DAY.stripW - 48, y + 98, 32, { eye: ev.eye, alpha: 0.85 + 0.15 * on });
      type(ctx, ev.word, x + DAY.stripW - 14, y + DAY.stripH - 12, 13,
        on > 0.55 ? "rgba(238,246,255,0.92)" : DIM, "MV Mono", "right");
    });
  });

  // The sun: the control's knob and the day's light are the same object. Drawing a
  // knob as well put two dots on one control, which is why there is only this one.
  const sunX = DAY.x0 + (DAY.x1 - DAY.x0) * k;
  const sunY = dayArcY(sunX);
  const sunR = 34 + 12 * day;
  halo(ctx, sunX, sunY, 300 * (0.35 + 0.65 * day), 0.3 + 0.4 * day, GIFT);
  layer(ctx, 1, () => {
    const spin = t * 0.35;
    for (let i = 0; i < 12; i++) {
      const a = spin + (i / 12) * Math.PI * 2;
      const r0 = sunR * 1.2;
      const r1 = sunR * (1.55 + 0.35 * day);
      stroke(ctx, [[sunX + Math.cos(a) * r0, sunY + Math.sin(a) * r0],
        [sunX + Math.cos(a) * r1, sunY + Math.sin(a) * r1]], GIFT, 2.6, 0.85);
    }
  });
  paperDisc(ctx, sunX, sunY, sunR, `rgba(131,233,230,${(0.45 + 0.45 * day).toFixed(2)})`, GIFT);
  cursorArrow(ctx, sunX + 44, sunY + 36, 1.5, 2 * bright + 0.15);

  // the clock the day is read against: a thin mono line that moves with the sun
  type(ctx, `${String(Math.floor(6 + 18 * k)).padStart(2, "0")}:${String(Math.floor((k * 1080) % 60)).padStart(2, "0")}`,
    960, DAY.baseY + 106, 15, `rgba(139,164,194,${(0.5 + 0.4 * bright).toFixed(2)})`, "MV Mono", "center");

  return { phase: "day", k: Number(k.toFixed(2)), day: Number(day.toFixed(2)), night: Number(night.toFixed(2)) };
}

// ---------------------------------------------------------------------------
// pre2-role — S and M are type roles, and the plate is a press, not a shelf.
// ---------------------------------------------------------------------------
// The reference settles this row with a sculpture: a heavy letter on a plinth, a
// light letter on the floor, a vertical track between them. That reads as a ranking
// -- one voice up, one down -- and it is somebody else's picture of the idea. This
// film already says what the row means everywhere else: serif is her voice, mono is
// the system's. So both sorts stand on ONE line at the SAME size (a choice, not a
// rank), and what moves is the press above them: a portal frame, a platen that
// travels from stop to stop, and a slug that comes down on the letter being chosen.
// The beat is unchanged -- S on "To S", M on "to M" -- and the light one still goes
// soft, but it now sinks into the paper it was printed on instead of lying on a
// floor.
function pre2Role(ctx, t, s) {
  const sCue = Math.max(lineStart(62) + 0.4, s.at + 0.45);
  const mCue = sCue + 0.8;

  const hit = (cue) => (t >= cue ? Math.exp(-(t - cue) * 8.5) : 0);
  const jolt = Math.sin((t - sCue) * 30) * 10 * hit(sCue)
    + Math.sin((t - mCue) * 30) * 9 * hit(mCue);

  ctx.save();
  ctx.translate(0, jolt);
  plateBase(ctx, t, { index: 3 });

  const BASE = 790;
  const SCX = 700;
  const MCX = 1220;
  const BEAM = { x0: 300, x1: 1620, y: 300 };
  const LETTER = 380;

  // ---- the press frame: two posts and a beam. The machine is the subject of this
  // plate, so it is drawn at the scale of the sheet and the letters are printed by it.
  layer(ctx, 1, () => {
    rect(ctx, BEAM.x0 - 46, 236, 46, 250, "rgba(10,30,44,0.92)", 4, "rgba(61,122,156,0.7)");
    rect(ctx, BEAM.x1, 236, 46, 250, "rgba(10,30,44,0.92)", 4, "rgba(61,122,156,0.7)");
    rect(ctx, BEAM.x0 - 52, BEAM.y - 18, BEAM.x1 - BEAM.x0 + 104, 34, "rgba(12,36,52,0.96)", 6, "rgba(131,233,230,0.6)");
    // the beam is a rail: a lighter groove down its middle
    stroke(ctx, [[BEAM.x0 - 40, BEAM.y + 4], [BEAM.x1 + 40, BEAM.y + 4]], "rgba(131,233,230,0.35)", 2, 0.9);
    // the two stops, labelled with the two sorts
    for (const [x, label, on] of [[SCX, "S", t >= sCue], [MCX, "M", t >= mCue]]) {
      stroke(ctx, [[x, BEAM.y + 16], [x, BEAM.y + 30]], on ? GIFT : "rgba(120,146,170,0.8)", 2, 0.95);
      type(ctx, label, x, BEAM.y - 28, 22, on ? "#eef6ff" : "rgba(159,184,210,0.75)", "MV Mono", "center");
    }
  });

  // ---- the platen: it travels between the stops (that travel is the switch) and
  // comes down on the letter being chosen
  const travelK = at(t, sCue + 0.24, mCue - 0.1);
  const headX = SCX + (MCX - SCX) * travelK;
  const punch = (cue) => {
    const d = t - cue;
    if (d < -0.2 || d > 0.42) return 0;
    return d < 0 ? easeOut((d + 0.2) / 0.2) : 1 - easeOut(d / 0.42);
  };
  const pS = punch(sCue);
  const pM = punch(mCue);
  const drop = 132 * Math.max(pS, pM);
  layer(ctx, 1, () => {
    // two rods from the beam to the platen
    // the platen hangs right under the beam at rest, so its descent is the motion
    stroke(ctx, [[headX - 92, BEAM.y + 16], [headX - 92, BEAM.y + 20 + drop]], "rgba(131,233,230,0.55)", 5, 0.95);
    stroke(ctx, [[headX + 92, BEAM.y + 16], [headX + 92, BEAM.y + 20 + drop]], "rgba(131,233,230,0.55)", 5, 0.95);
    rect(ctx, headX - 176, BEAM.y + 18 + drop, 352, 44, "rgba(16,44,62,0.97)", 6, "rgba(131,233,230,0.75)");
    rect(ctx, headX - 176, BEAM.y + 18 + drop, 352, 10, "rgba(131,233,230,0.18)", 3);
    // the slug under it: the face that is about to be pressed
    rect(ctx, headX - 104, BEAM.y + 62 + drop, 208, 22, "rgba(22,56,78,0.98)", 3, "rgba(131,233,230,0.85)");
    type(ctx, travelK > 0.5 ? "M" : "S", headX, BEAM.y + 79 + drop, 15, "#f2f7fa", "MV Mono", "center");
  });

  // ---- the two sorts, on one line
  const inkS = clamp01((t - sCue) / 0.1);
  const inkM = clamp01((t - mCue) / 0.1);

  stroke(ctx, [[240, BASE], [1680, BASE]], "rgba(131,233,230,0.45)", 2, 1);

  if (inkS < 0.999) {
    ctx.save();
    ctx.globalAlpha = 1 - inkS;
    ctx.font = `600 ${LETTER}px "MV Serif"`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.strokeStyle = "rgba(131,233,230,0.58)";
    ctx.lineWidth = 2;
    ctx.strokeText("S", SCX, BASE);
    ctx.restore();
  }
  if (inkS > 0.001) {
    layer(ctx, inkS, () => {
      // the impression comes down a touch oversized and settles onto the line
      type(ctx, "S", SCX, BASE, LETTER * (1.05 - 0.05 * easeOut(inkS)), "#f2f7fa", "MV Serif", "center");
    });
  }

  // M: the mono sort. An outline until its beat; then it prints thin -- and then it
  // sinks into the paper, which is the whole joke of setting her to M.
  const limpK = clamp01(at(t, mCue + 0.22, mCue + 0.66));
  const sink = 10 * limpK;
  if (inkM < 0.999) {
    ctx.save();
    ctx.globalAlpha = 1 - inkM;
    ctx.font = `400 ${LETTER}px "MV Mono"`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.strokeStyle = "rgba(131,233,230,0.52)";
    ctx.lineWidth = 1.8;
    ctx.strokeText("M", MCX, BASE);
    ctx.restore();
  }
  if (inkM > 0.001) {
    const drawM = (size, soft, colour, width) => {
      const half = size * 0.44;
      const top = -size * 0.78;
      const spread = size * 0.06 * soft;
      const sag = size * 0.14 * soft;
      stroke(ctx, [
        [-half - spread, 0],
        [-half * 0.7, top + sag * 0.5],
        [0, top * 0.55 + sag],
        [half * 0.7, top + sag * 0.5],
        [half + spread, 0],
      ], colour, width, 1);
    };
    layer(ctx, inkM, () => {
      ctx.save();
      // the tip is compensated so one foot never leaves the paper: a letter that
      // floats while it sinks reads as a sticker, not as ink
      const ang = -0.1 * limpK;
      const half = LETTER * 0.44;
      ctx.translate(MCX, BASE - 8 + sink + half * Math.abs(Math.sin(ang)));
      ctx.rotate(ang);
      ctx.scale(1 + 0.03 * limpK, 1 - 0.14 * limpK);
      drawM(LETTER * 0.94, limpK, "#f2f7fa", 15 - 3 * limpK);
      ctx.restore();
      // the paper takes the impression: a soft smear under it, not a floor dip
      if (limpK > 0.2) {
        layer(ctx, ((limpK - 0.2) / 0.8) * 0.4, () => {
          ctx.beginPath();
          ctx.ellipse(MCX, BASE + 12, 160, 13, 0, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(131,233,230,0.5)";
          ctx.fill();
        });
      }
    });
  }

  // ---- the hits: a ring of ink and four registration crosses per impression
  const ringAt = (x, cue) => {
    const k = clamp01((t - cue) / 0.44);
    if (t < cue || k >= 1) return;
    layer(ctx, (1 - k) * 0.6, () => {
      ctx.beginPath();
      ctx.arc(x, BASE - 160, 80 + 220 * k, 0, Math.PI * 2);
      ctx.strokeStyle = GIFT;
      ctx.lineWidth = 2.6 * (1 - k) + 0.6;
      ctx.stroke();
    });
  };
  ringAt(SCX, sCue);
  ringAt(MCX, mCue);
  const cross = (x, y, a) => {
    if (a <= 0.01) return;
    layer(ctx, a * 0.65, () => {
      stroke(ctx, [[x - 11, y], [x + 11, y]], GIFT, 1.6, 0.9);
      stroke(ctx, [[x, y - 11], [x, y + 11]], GIFT, 1.6, 0.9);
    });
  };
  cross(SCX - 200, BASE - 36, inkS);
  cross(SCX + 200, BASE - 36, inkS);
  cross(MCX - 200, BASE - 36, inkM);
  cross(MCX + 200, BASE - 36, inkM);

  type(ctx, "serif", SCX, BASE + 42, 18, inkS > 0.5 ? "rgba(178,200,222,0.95)" : "rgba(139,164,194,0.6)", "MV Mono", "center");
  type(ctx, "mono", MCX, BASE + 42, 18, inkM > 0.5 ? "rgba(178,200,222,0.95)" : "rgba(139,164,194,0.6)", "MV Mono", "center");

  // the setting, said plainly in the film's margin voice: this row is about voice
  type(ctx, "role  /  her voice (serif)  ·  the system (mono)", 210, 982, 15, "rgba(139,164,194,0.55)", "MV Mono");

  ctx.restore();
  return { phase: "role", headX: Math.round(headX), limp: Number(limpK.toFixed(2)) };
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
