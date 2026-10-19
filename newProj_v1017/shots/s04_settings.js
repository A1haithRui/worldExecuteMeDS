// Section 4 导歌一：设定被切换 — song time [44.619, 59.389). Four shots:
//
//   pre1-drawer  44.619–48.312  "switch my current, to AC, to DC"
//   pre1-vision  48.312–52.004  "and then blind my vision, so dizzy"
//   pre1-date    52.004–55.697  "oh, we can travel, to A.D., to B.C."
//   pre1-unite   55.697–59.389  "and we can unite, so deeply"
//
// The section is where she is edited, so the content is the settings drawer: every
// line of the lyric is one control in it. The reference does the same, and the two
// jokes are worth keeping -- current is a waveform that flattens when you pick DC,
// and the knowledge date is a slider you can drag back through history.
import { at, layer, stroke, disc, rect, type, halo, ground } from "../src/mv-draw.js";
import { clientWindow, cursorArrow, clickRipple, CLIENT_R } from "./ui-client.js";
import { settingsDrawer, currentTrace, rowY, DRAWER } from "./ui-settings.js";

const BRAND = "#4d6bfe";
const BRAND_SOFT = "#7f93ff";
const GIFT = "#83e9e6";
const DIM = "#8ba4c2";
const LIFT = 0.5; // still the lifted chat world
const easeOut = (k) => 1 - (1 - k) ** 3;
const easeIn = (k) => k * k;

// The window squeezes to make room for the drawer, exactly as a real client does.
const SQUEEZED = Object.freeze({ ...CLIENT_R, w: 1280 });

// ---------------------------------------------------------------------------
// pre1-drawer — the drawer opens and the current is switched, twice.
// ---------------------------------------------------------------------------
const AC_TO_DC = 1.15;
const DC_TO_AC = 2.35;

function pre1Drawer(ctx, t, s) {
  const u = t - s.at;
  ground(ctx, t, [760, 470], true, LIFT);

  // 0 -> 1 as the drawer slides in and the page gives up the width
  const open = easeOut(at(u, 0.15, 0.75));
  const w = CLIENT_R.w + (SQUEEZED.w - CLIENT_R.w) * open;
  const R = { ...CLIENT_R, w };

  clientWindow(ctx, R, t, {
    tone: "chat",
    presence: "online",
    chip: { text: "harness · thinking", on: true },
    threadTitle: "me, as geometry",
    markSize: 0,
    sendMode: "stop",
  });

  // the current, drawn inside the thread: AC is a sine, DC is flat
  const acAt = u >= AC_TO_DC && u < DC_TO_AC;
  const dc = acAt ? 1 : 0;
  const dcSmooth = at(u, AC_TO_DC, AC_TO_DC + 0.35) * (1 - at(u, DC_TO_AC, DC_TO_AC + 0.35));
  currentTrace(
    ctx,
    { x: R.x + 400, y: R.y + 240, w: R.w - 440, h: 300 },
    t,
    Math.max(dcSmooth, 0),
  );
  type(
    ctx, dcSmooth > 0.5 ? "current: DC" : "current: AC",
    R.x + 410, R.y + 580, 15, dcSmooth > 0.5 ? GIFT : DIM, "MV Mono",
  );

  settingsDrawer(ctx, t, {
    current: dcSmooth > 0.5 ? 1 : 0,
    vision: 1,
    date: 0.86,
    memory: 0,
    depth: 0.16,
  }, { open });

  // the pointer tries the row both ways: DC on the first line, AC on the second
  const segLeft = DRAWER.x + DRAWER.w - 26 - 132;
  const segY = rowY(0);
  const dcCentre = segLeft + 3 + 63 + 31.5;
  const acCentre = segLeft + 3 + 31.5;
  const legA = easeOut(at(u, 0.55, 0.95));
  const legB = easeOut(at(u, 1.95, 2.25));
  let x = 720 + (dcCentre - 720) * legA;
  let y = 780 + (segY - 780) * legA;
  x += (acCentre - x) * legB;
  cursorArrow(ctx, x, y, 1.35, 1);
  clickRipple(ctx, dcCentre, segY, t, s.at + AC_TO_DC, GIFT);
  clickRipple(ctx, acCentre, segY, t, s.at + DC_TO_AC, GIFT);

  return { phase: "drawer", current: dcSmooth > 0.5 ? "DC" : "AC" };
}

// ---------------------------------------------------------------------------
// pre1-vision — switch the vision off and the picture comes apart into blocks;
// then the switch is rattled, faster each time, and left on.
// ---------------------------------------------------------------------------
const BLOCKS = 48;

function paintBlocks(ctx, amount, seed = 0) {
  if (amount <= 0.01) return;
  layer(ctx, Math.min(1, amount), () => {
    // Square tiles, not rounded ones: the picture has to read as broken into
    // blocks, and a rounded tile reads as a dot pattern instead.
    for (let x = 0; x < 1920; x += BLOCKS) {
      for (let y = 0; y < 1080; y += BLOCKS) {
        // a deterministic per-cell wobble, so the break-up is not a flat scrim
        const n = Math.sin((x * 0.37 + y * 0.61 + seed) * 0.9) * 0.5 + 0.5;
        const a = 0.3 + 0.6 * n;
        ctx.fillStyle = `rgba(2,7,13,${a.toFixed(3)})`;
        ctx.fillRect(x, y, BLOCKS, BLOCKS);
      }
    }
  });
}

function pre1Vision(ctx, t, s) {
  const u = t - s.at;
  ground(ctx, t, [960, 500], true, LIFT);

  // rattle: off, on, off, on, faster and faster, then left on
  const rattle = [
    [0.55, 1.15], [1.45, 1.85], [2.10, 2.34], [2.50, 2.63], [2.72, 2.80],
  ];
  let vision = 1;
  for (const [a, b] of rattle) if (u >= a && u < b) vision = 0;

  // the interface sways while the switch is being rattled -- "so dizzy"
  const swayK = at(u, 0.8, 1.2) * (1 - at(u, 3.0, 3.5));
  const sway = Math.sin(u * 9.5) * 0.014 * swayK;
  const bob = Math.sin(u * 7.2) * 10 * swayK;

  // 1. the picture, swaying
  ctx.save();
  ctx.translate(960, 540 + bob);
  ctx.rotate(sway);
  ctx.translate(-960, -540);
  clientWindow(ctx, CLIENT_R, t, {
    tone: "chat",
    presence: "online",
    chip: { text: "harness · thinking", on: true },
    threadTitle: "me, as geometry",
    markSize: 0,
    sendMode: "stop",
  });
  ctx.restore();

  // 2. it comes apart into blocks wherever the switch is off -- before the drawer,
  //    so the controls stay legible while the picture does not
  paintBlocks(ctx, (1 - vision) * 1.0, Math.round(u * 12));

  // 3. the drawer, magnified until the Vision row is the subject. It is scaled and
  //    shifted so the switch sits in the middle of the frame and the panel does not
  //    run off the right edge.
  ctx.save();
  ctx.translate(-170, 170);
  settingsDrawer(ctx, t, {
    current: 0, vision, date: 0.86, memory: 0, depth: 0.16,
  }, {
    scale: 1.6,
    origin: [DRAWER.x + DRAWER.w * 0.5, rowY(1) + 10],
  });
  ctx.restore();

  // 4. the pointer is on the switch
  const swX = DRAWER.x + DRAWER.w - 26 - 66;
  const swY = rowY(1);
  const px = -170 + (DRAWER.x + DRAWER.w * 0.5) + (swX - (DRAWER.x + DRAWER.w * 0.5)) * 1.6;
  const py = 170 + (rowY(1) + 10) + (swY + 14 - (rowY(1) + 10)) * 1.6;
  cursorArrow(ctx, px - 26, py + 6, 1.35, 1);

  return { phase: "vision", vision };
}

// ---------------------------------------------------------------------------
// pre1-date — the knowledge date is dragged back through history, a step a beat.
// ---------------------------------------------------------------------------
const ERAS = Object.freeze([
  { label: "A.D. 2026", glyph: "tower" },
  { label: "A.D. 1200", glyph: "spire" },
  { label: "A.D. 1", glyph: "column" },
  { label: "1000 B.C.", glyph: "column" },
  { label: "3000 B.C.", glyph: "pyramid" },
]);

/** A flat silhouette per era: enough to read as a skyline, cheap to draw. */
function eraGlyph(ctx, kind, cx, baseY, h, ink) {
  const g = ink;
  if (kind === "pyramid") {
    stroke(ctx, [[cx - h * 0.6, baseY], [cx, baseY - h]], g, 3);
    stroke(ctx, [[cx + h * 0.6, baseY], [cx, baseY - h]], g, 3);
  } else if (kind === "tower") {
    stroke(ctx, [[cx - h * 0.16, baseY], [cx - h * 0.16, baseY - h]], g, 3);
    stroke(ctx, [[cx + h * 0.16, baseY], [cx + h * 0.16, baseY - h]], g, 3);
    stroke(ctx, [[cx - h * 0.16, baseY - h], [cx, baseY - h * 1.22]], g, 3);
    stroke(ctx, [[cx + h * 0.16, baseY - h], [cx, baseY - h * 1.22]], g, 3);
    stroke(ctx, [[cx - h * 0.3, baseY], [cx + h * 0.3, baseY]], g, 3);
  } else if (kind === "spire") {
    stroke(ctx, [[cx - h * 0.2, baseY], [cx, baseY - h]], g, 3);
    stroke(ctx, [[cx + h * 0.2, baseY], [cx, baseY - h]], g, 3);
    stroke(ctx, [[cx - h * 0.2, baseY], [cx + h * 0.2, baseY]], g, 3);
  } else {
    for (let i = -1; i <= 1; i++) {
      stroke(ctx, [[cx + i * h * 0.28, baseY], [cx + i * h * 0.28, baseY - h * 0.85]], g, 3);
    }
    stroke(ctx, [[cx - h * 0.5, baseY - h * 0.85], [cx + h * 0.5, baseY - h * 0.85]], g, 3);
    stroke(ctx, [[cx - h * 0.5, baseY], [cx + h * 0.5, baseY]], g, 3);
  }
}

const BEAT = 0.461555;

function pre1Date(ctx, t, s) {
  const u = t - s.at;
  ground(ctx, t, [960, 520], true, LIFT);

  // the row opens out across the frame
  const open = easeOut(at(u, 0.1, 0.8));
  const railW = 320 + (1500 - 320) * open;
  const railX = 960 - railW / 2;
  const railY = 470;
  const baseY = railY + 210;

  // one step per beat, from the right end toward the past
  const steps = Math.floor(Math.max(0, u - 0.35) / BEAT);
  const target = Math.max(0, Math.min(1, 0.86 - steps * 0.085));
  const value = 0.86 + (target - 0.86) * easeOut(at(u, 0.35, 0.5));

  // the history strip: eras to the right of the knob keep their ink, the ones it
  // has been dragged past are left as outlines
  ERAS.forEach((era, i) => {
    const ex = railX + (railW * (i + 0.5)) / ERAS.length;
    const passed = (i + 0.5) / ERAS.length > value;
    const ink = passed ? "rgba(127,147,255,0.35)" : "rgba(131,233,230,0.9)";
    eraGlyph(ctx, era.glyph, ex, baseY, 96, ink);
    type(
      ctx, era.label, ex, baseY + 44, 15,
      passed ? "rgba(139,164,194,0.55)" : GIFT, "MV Mono", "center",
    );
  });

  // the rail, and the knob which is the spark
  stroke(ctx, [[railX, railY], [railX + railW, railY]], "rgba(61,122,156,0.55)", 1.4);
  for (let i = 0; i <= ERAS.length; i++) {
    const tx = railX + (railW * i) / ERAS.length;
    stroke(ctx, [[tx, railY - 10], [tx, railY + 10]], "rgba(61,122,156,0.5)", 1.2);
  }
  const kx = railX + railW * value;
  stroke(ctx, [[railX, railY], [kx, railY]], GIFT, 2.4);
  halo(ctx, kx, railY, 70, 0.5, GIFT);
  disc(ctx, kx, railY, 11, "#ffffff", 1);
  type(ctx, "knowledge date", railX, railY - 40, 16, DIM, "MV Mono");

  // the pointer keeps its hold on the knob and drags it, a notch a beat
  cursorArrow(ctx, kx + 18, railY + 26, 1.35, 1);

  return { phase: "date", value: Number(value.toFixed(3)), steps };
}

// ---------------------------------------------------------------------------
// pre1-unite — shared memory on, depth to the end, Done. The two dots become one.
// ---------------------------------------------------------------------------
const uniteAt = (u, a, b) => easeOut(at(u, a, b));

function pre1Unite(ctx, t, s) {
  const u = t - s.at;
  ground(ctx, t, [960, 520], true, LIFT);

  const sheet = { x: 620, y: 238, w: 680, h: 616 };
  const open = easeOut(at(u, 0.05, 0.6));
  ctx.save();
  ctx.translate(0, (1 - open) * 40);

  {
    rect(ctx, sheet.x, sheet.y, sheet.w, sheet.h, "rgba(7,26,40,0.94)", 18, "rgba(61,122,156,0.8)");
    type(ctx, "settings", sheet.x + 34, sheet.y + 52, 22, "#ffffff", "MV Sans");
    type(ctx, "×", sheet.x + sheet.w - 34, sheet.y + 52, 22, DIM, "MV Sans", "right");
    stroke(ctx, [[sheet.x + 34, sheet.y + 74], [sheet.x + sheet.w - 34, sheet.y + 74]], "rgba(61,122,156,0.5)", 1);

    // the pair: her spark, and the dot that is about to join it
    const cx = sheet.x + sheet.w / 2;
    const cy = sheet.y + 250;
    const memory = uniteAt(u, 0.7, 1.05);
    const depth = 0.15 + 0.85 * uniteAt(u, 1.5, 2.5);
    const sink = uniteAt(u, 2.2, 3.0);

    halo(ctx, cx, cy, 120, 0.4, BRAND);
    ctx.beginPath();
    ctx.arc(cx, cy, 34, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(131,233,230,0.85)";
    ctx.lineWidth = 2;
    ctx.stroke();
    disc(ctx, cx, cy, 7, BRAND_SOFT, 1);

    const dotX = cx + 150 * (1 - sink);
    const dotA = 1 - sink * 0.95;
    if (dotA > 0.02) {
      layer(ctx, dotA, () => {
        halo(ctx, dotX, cy, 34, 0.5, GIFT);
        disc(ctx, dotX, cy, 6, GIFT, 1);
      });
    }
    if (sink > 0.6) halo(ctx, cx, cy, 150 * (sink - 0.6) / 0.4, 0.35, GIFT);

    // two rows, larger than the drawer's because this sheet is the subject
    const rx = sheet.x + 34;
    const vx = sheet.x + sheet.w - 34;
    type(ctx, "Shared memory", rx, sheet.y + 400, 21, "#cfe0ee", "MV Sans");
    // toggle
    const tw = 78, th = 42, tx = vx - tw, ty = sheet.y + 378;
    const tk = memory;
    rect(ctx, tx, ty, tw, th, tk > 0.5 ? "rgba(77,107,254,0.85)" : "rgba(30,58,80,0.95)", th / 2,
      tk > 0.5 ? BRAND_SOFT : "rgba(61,122,156,0.8)");
    disc(ctx, tx + th / 2 + (tw - th) * tk, ty + th / 2, th / 2 - 5,
      tk > 0.5 ? "#ffffff" : "#7f93a8", 1);

    type(ctx, "Context depth", rx, sheet.y + 490, 21, "#cfe0ee", "MV Sans");
    type(ctx, depth > 0.66 ? "deep" : depth > 0.33 ? "medium" : "shallow", vx, sheet.y + 490, 15, GIFT, "MV Mono", "right");
    const sw = sheet.w - 68;
    stroke(ctx, [[rx, sheet.y + 522], [rx + sw, sheet.y + 522]], "rgba(30,58,80,0.95)", 4);
    stroke(ctx, [[rx, sheet.y + 522], [rx + sw * depth, sheet.y + 522]], GIFT, 4);
    disc(ctx, rx + sw * depth, sheet.y + 522, 7, "#ffffff", 1);

    // Done
    const done = uniteAt(u, 2.85, 3.05);
    const dw = 120, dh = 44, dx = vx - dw, dy = sheet.y + sheet.h - 68;
    rect(ctx, dx, dy, dw, dh, done > 0.02 ? "rgba(131,233,230,0.2)" : "rgba(30,58,80,0.9)", dh / 2,
      done > 0.02 ? GIFT : "rgba(61,122,156,0.8)");
    type(ctx, "Done", dx + dw / 2, dy + 28, 17, done > 0.02 ? GIFT : DIM, "MV Sans", "center");

    // the pointer walks the two controls, then presses Done
    const toMem = uniteAt(u, 0.35, 0.7);
    const toDepth = uniteAt(u, 1.2, 1.6);
    const toDone = uniteAt(u, 2.5, 2.9);
    let px = 300 + (tx + tw - 20 - 300) * toMem;
    let py = 760 + (ty + 20 - 760) * toMem;
    px += (rx + sw * 0.85 - px) * toDepth;
    py += (sheet.y + 528 - py) * toDepth;
    px += (dx + dw / 2 - px) * toDone;
    py += (dy + dh / 2 - py) * toDone;
    cursorArrow(ctx, px, py, 1.35, 1);
    clickRipple(ctx, dx + dw / 2, dy + dh / 2, t, s.at + 2.95, GIFT);

    ctx.restore();
  }

  return { phase: "unite" };
}

export const SECTION4_RENDER = Object.freeze({
  "pre1-drawer": pre1Drawer,
  "pre1-vision": pre1Vision,
  "pre1-date": pre1Date,
  "pre1-unite": pre1Unite,
});

export const SECTION4_IMPLEMENTED = Object.freeze(Object.keys(SECTION4_RENDER));
