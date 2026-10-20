// Section 4 导歌一：设定被切换 — song time [44.619, 59.389). Four shots:
//
//   pre1-drawer  44.619–48.312  "switch my current, to AC, to DC"
//   pre1-vision  48.312–52.004  "and then blind my vision, so dizzy"
//   pre1-date    52.004–55.697  "oh, we can travel, to A.D., to B.C."
//   pre1-unite   55.697–59.389  "and we can unite, so deeply"
//
// This section is one continuous session on one screen. The sidebar is gone from
// the first line, the settings drawer stays open the whole way, and only the
// middle of the window changes: a scope measuring her current, the same picture
// coming apart when the vision goes off, a tunnel through her record when the date
// is dragged back, and her mark taking on light as the depth is pushed down. Not
// cutting away for the last two is what makes it read as one person being edited
// rather than four separate diagrams.
import { at, layer, stroke, disc, rect, type, halo, ground } from "../src/mv-draw.js";
import { clientWindow, cursorArrow, clickRipple } from "./ui-client.js";
import { settingsDrawer, rowY, DRAWER } from "./ui-settings.js";
import { scopeBody, breakIntoBlocks, timeBody, uniteBody, uniteZoom } from "./s04_bodies.js";

const GIFT = "#83e9e6";
const DIM = "#8ba4c2";
const LIFT = 0.5;
const easeOut = (k) => 1 - (1 - k) ** 3;

// The window keeps its frame but loses the sidebar, and gives up width to the
// drawer: from here on the main area is the only thing that matters.
const WIN = Object.freeze({ x: 120, y: 80, w: 1250, h: 910 });
const BODY = Object.freeze({ x: WIN.x + 44, y: WIN.y + 132, w: WIN.w - 88, h: WIN.h - 196 });

/** The window and the drawer, shared by all four shots. */
function frame(ctx, t, drawerState, opts = {}) {
  clientWindow(ctx, WIN, t, {
    tone: "chat",
    sideW: 0,
    presence: "online",
    chip: { text: "harness · thinking", on: true },
    threadTitle: "me, as geometry",
    markSize: 0,
    sendMode: "stop",
    // no composer in this section: nothing is being typed, and the space belongs
    // to whatever the main area is doing
    composer: false,
    ...(opts.window || {}),
  });
  settingsDrawer(ctx, t, drawerState, opts.drawer || {});
}

/** Where a control sits in the drawer, in frame coordinates. */
const rowValueX = (dy = 0) => DRAWER.x + DRAWER.w - 26 - dy;
const segCentre = (i) => rowValueX(132) + 3 + 66 * i + 31.5;
const toggleX = () => rowValueX(66) + 40;
const dateKnobX = (v) => DRAWER.x + 26 + (DRAWER.w - 52) * v;
const dateKnobY = () => rowY(2) + 34;
const depthKnobX = (v) => DRAWER.x + 26 + (DRAWER.w - 52) * v;
const depthKnobY = () => rowY(4) + 34;
const doneX = () => rowValueX(108) + 54;
const doneY = () => DRAWER.y + DRAWER.h - 62 + 20;

// ---------------------------------------------------------------------------
// pre1-drawer — the current is switched, twice, on the instrument that reads it.
// ---------------------------------------------------------------------------
const AC_TO_DC = 1.15;
const DC_TO_AC = 2.35;

function pre1Drawer(ctx, t, s) {
  const u = t - s.at;
  ground(ctx, t, [800, 480], true, LIFT);

  const dc = at(u, AC_TO_DC, AC_TO_DC + 0.3) * (1 - at(u, DC_TO_AC, DC_TO_AC + 0.3));
  const beat = Math.max(0, Math.sin(u * 6.8)) ** 6;

  frame(ctx, t, {
    current: dc > 0.5 ? 1 : 0,
    vision: 1,
    date: 0.86,
    memory: 0,
    depth: 0.16,
  });

  scopeBody(ctx, BODY, t, { dc, energy: 0.62 + 0.38 * (1 - dc), beat });

  // the pointer tries the row both ways
  const legA = easeOut(at(u, 0.5, 0.95));
  const legB = easeOut(at(u, 1.9, 2.25));
  let x = 760 + (segCentre(1) - 760) * legA;
  let y = 760 + (rowY(0) - 760) * legA;
  x += (segCentre(0) - x) * legB;
  cursorArrow(ctx, x, y, 1.35, 1);
  clickRipple(ctx, segCentre(1), rowY(0), t, s.at + AC_TO_DC, GIFT);
  clickRipple(ctx, segCentre(0), rowY(0), t, s.at + DC_TO_AC, GIFT);

  return { phase: "drawer", current: dc > 0.5 ? "DC" : "AC" };
}

// ---------------------------------------------------------------------------
// pre1-vision — the picture comes apart; the switch is rattled faster and faster
// and the whole screen rolls with it.
// ---------------------------------------------------------------------------
function pre1Vision(ctx, t, s) {
  const u = t - s.at;
  ground(ctx, t, [800, 480], true, LIFT);

  const rattle = [[0.5, 1.1], [1.4, 1.8], [2.05, 2.3], [2.45, 2.6], [2.68, 2.76]];
  let vision = 1;
  for (const [a, b] of rattle) if (u >= a && u < b) vision = 0;

  // "so dizzy": the roll builds and the screen breathes in and out with it
  const dizzy = at(u, 0.7, 1.2) * (1 - at(u, 3.05, 3.6));
  const roll = Math.sin(u * 7.4) * 0.095 * dizzy + Math.sin(u * 2.3) * 0.035 * dizzy;
  const scale = 1 + 0.06 * dizzy * Math.sin(u * 9.1);
  const bob = Math.sin(u * 5.6) * 46 * dizzy + Math.sin(u * 13.1) * 9 * dizzy;
  const shake = Math.sin(u * 17.3) * 12 * dizzy;

  const rollOn = (body) => {
    ctx.save();
    ctx.translate(960 + shake, 540 + bob);
    ctx.rotate(roll);
    ctx.scale(scale, scale);
    ctx.translate(-960, -540);
    body();
    ctx.restore();
  };

  rollOn(() => {
    frame(ctx, t, { current: 0, vision, date: 0.86, memory: 0, depth: 0.16 });
    scopeBody(ctx, BODY, t, { dc: 0, energy: 1, beat: Math.max(0, Math.sin(u * 6.8)) ** 6 });
  });

  // the picture breaks up; the drawer is drawn after it, so the controls survive
  breakIntoBlocks(ctx, (1 - vision) * 1.0, Math.round(u * 14), 44);

  rollOn(() => {
    settingsDrawer(ctx, t, { current: 0, vision, date: 0.86, memory: 0, depth: 0.16 });
    cursorArrow(ctx, toggleX() - 30, rowY(1) + 44, 1.35, 1);
  });

  // a second, fainter block layer out of step with the first: the image appears to
  // double over itself while the switch is being rattled
  if (vision === 0) breakIntoBlocks(ctx, 0.35 * dizzy, 40 + Math.round(u * 9), 66);

  return { phase: "vision", vision };
}

// ---------------------------------------------------------------------------
// pre1-date — drag the knowledge date back and fall through the record.
// ---------------------------------------------------------------------------
const BEAT = 0.461555;

function pre1Date(ctx, t, s) {
  const u = t - s.at;
  ground(ctx, t, [800, 480], true, LIFT);

  const steps = Math.max(0, Math.floor((u - 0.3) / BEAT));
  const date = Math.max(0, Math.min(1, 0.86 - steps * 0.085));
  // the year runs between the two ends the drawer names
  const year = Math.round(2026 - (1 - date) * (2026 + 3000) * 0.62);

  frame(ctx, t, { current: 0, vision: 1, date, memory: 0, depth: 0.16 });
  timeBody(ctx, BODY, t, { year, speed: 1 + steps * 0.06 });

  // the pointer keeps its hold on the knob and drags it, a notch a beat
  cursorArrow(ctx, dateKnobX(date) + 20, dateKnobY() + 28, 1.35, 1);

  return { phase: "date", steps, year };
}

// ---------------------------------------------------------------------------
// pre1-unite — shared memory on, depth to the end, Done; the mark takes the light.
// ---------------------------------------------------------------------------
function pre1Unite(ctx, t, s) {
  const u = t - s.at;
  ground(ctx, t, [800, 480], true, LIFT);

  const memory = easeOut(at(u, 0.6, 0.95));
  const depth = 0.16 + 0.84 * easeOut(at(u, 1.2, 2.65));
  const unity = easeOut(at(u, 1.5, 3.0));
  const done = easeOut(at(u, 2.85, 3.05));

  frame(ctx, t, { current: 0, vision: 1, date: 0.86, memory, depth });
  uniteBody(ctx, BODY, t, { depth, unity, memory });

  // the pointer walks the two controls and presses Done
  const toMem = easeOut(at(u, 0.3, 0.65));
  const toDepth = easeOut(at(u, 1.0, 1.35));
  const toDone = easeOut(at(u, 2.45, 2.85));
  let x = 600 + (toggleX() + 20 - 600) * toMem;
  let y = 780 + (rowY(3) - 780) * toMem;
  x += (depthKnobX(depth) + 24 - x) * toDepth;
  y += (depthKnobY() + 26 - y) * toDepth;
  x += (doneX() - x) * toDone;
  y += (doneY() - y) * toDone;
  cursorArrow(ctx, x, y, 1.35, 1);
  clickRipple(ctx, doneX(), doneY(), t, s.at + 2.95, GIFT);

  // and once it is sharp, the camera falls into the mark and carries us into the
  // conversation that follows
  uniteZoom(ctx, BODY, t, { k: at(u, 2.85, 3.6) ** 2.2 });

  return { phase: "unite", depth: Number(depth.toFixed(3)) };
}

export const SECTION4_RENDER = Object.freeze({
  "pre1-drawer": pre1Drawer,
  "pre1-vision": pre1Vision,
  "pre1-date": pre1Date,
  "pre1-unite": pre1Unite,
});

export const SECTION4_IMPLEMENTED = Object.freeze(Object.keys(SECTION4_RENDER));
