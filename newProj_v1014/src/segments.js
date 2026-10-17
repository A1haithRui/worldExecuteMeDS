// Segment registry.
//
// Adding a drawn segment should mean writing one module and adding one entry
// here, not threading seven tables through main.js. Everything main.js needs to
// place, light, move and cut between shots is derived from this list.
import { P2, renderP2 } from "./p2.js";
import { P3, renderP3 } from "./p3.js";
import { P0, renderP0 } from "./p0.js";
import { P1, renderP1 } from "./p1.js";
import { P4, renderP4 } from "./p4.js";
import { P5, renderP5 } from "./p5.js";
import { P6, renderP6 } from "./p6.js";
import { P7, renderP7 } from "./p7.js";

export const SEGMENTS = [
  {
    id: "p2",
    base: 1, // shot numbering starts at S01
    config: P2,
    render: renderP2,
    ambient: { S01: "chat", S02: "model", S03: "chat", S04: "model", S05: "plate", S06: "chat" },
    focus: {
      S01: [1240, 470], S02: [1020, 470], S03: [1180, 480],
      S04: [1060, 470], S05: [1320, 500], S06: [1180, 480],
    },
    camera: {
      S01: { from: 1.0, to: 1.03, focus: [1240, 470] },
      S02: { from: 1.04, to: 1.0, focus: [1020, 470] },
      S03: { from: 1.0, to: 1.03, focus: [1180, 480] },
      S04: { from: 1.02, to: 1.0, focus: [1060, 470] },
      S05: { from: 1.0, to: 1.045, focus: [1320, 500] },
      S06: { from: 1.03, to: 1.0, focus: [1180, 480] },
    },
    transitions: {
      S02: { type: "scan", dir: 0, dur: 0.4, align: "end" },
      S03: { type: "dissolve", dur: 0.34, align: "start", cells: 16 },
      S04: { type: "fade", dur: 0.3, align: "start" },
      S05: { type: "scan", dir: 2, dur: 0.42, align: "end" },
      S06: { type: "fade", dur: 0.36, align: "start" },
    },
  },
  {
    id: "p3",
    base: 7, // S07-S14
    config: P3,
    render: renderP3,
    ambient: { S07: "model", S08: "chat", S09: "model", S10: "plate", S11: "chat", S12: "model", S13: "model", S14: "plate" },
    focus: {
      S07: [980, 480], S08: [1240, 490], S09: [1040, 490], S10: [1240, 470],
      S11: [1220, 490], S12: [1040, 500], S13: [1040, 500], S14: [1240, 490],
    },
    camera: {
      S07: { from: 1.0, to: 1.035, focus: [980, 480] },
      S08: { from: 1.02, to: 1.0, focus: [1240, 490] },
      S09: { from: 1.0, to: 1.04, focus: [1040, 490] },
      S10: { from: 1.0, to: 1.035, focus: [1240, 470] },
      S11: { from: 1.03, to: 1.0, focus: [1220, 490] },
      S12: { from: 1.0, to: 1.04, focus: [1040, 500] },
      S13: { from: 1.02, to: 1.0, focus: [1040, 500] },
      S14: { from: 1.0, to: 1.045, focus: [1390, 520] },
    },
    transitions: {
      S08: { type: "scan", dir: 1, dur: 0.4, align: "end" },
      S09: { type: "dissolve", dur: 0.34, align: "start", cells: 20 },
      S10: { type: "cut", flash: 0.2 },
      S11: { type: "fade", dur: 0.3, align: "start" },
      S12: { type: "scan", dir: 2, dur: 0.36, align: "end" },
      S13: { type: "dissolve", dur: 0.34, align: "start", cells: 22 },
      S14: { type: "cut", flash: 0.18 },
    },
  },
  {
    id: "p0",
    base: 15, // S15-S19
    config: P0,
    render: renderP0,
    ambient: { S15: "chat", S16: "model", S17: "plate", S18: "plate", S19: "model" },
    focus: {
      S15: [1180, 490], S16: [980, 490], S17: [1220, 430], S18: [1100, 540], S19: [980, 450],
    },
    camera: {
      S15: { from: 1.0, to: 1.035, focus: [1180, 490] },
      S16: { from: 1.02, to: 1.0, focus: [980, 490] },
      S17: { from: 1.0, to: 1.045, focus: [1220, 430] },
      S18: { from: 1.0, to: 1.055, focus: [1100, 540] },
      S19: { from: 1.06, to: 1.0, focus: [980, 450] },
    },
    transitions: {
      // Flash into the first polished section rather than fading up from black.
      S15: { type: "flashcut", dur: 0.34, align: "end", flash: 0.45 },
      S16: { type: "scan", dir: 0, dur: 0.42, align: "end" },
      S17: { type: "cut", flash: 0.22 },
      S18: { type: "cut" },
      S19: { type: "fade", dur: 0.34, align: "start" },
    },
  },
  {
    id: "p1",
    base: 20, // S20-S27
    config: P1,
    render: renderP1,
    ambient: {
      S20: "chat", S21: "model", S22: "plate", S23: "plate",
      S24: "model", S25: "chat", S26: "plate", S27: "model",
    },
    focus: {
      S20: [920, 480], S21: [1060, 460], S22: [1250, 440], S23: [1250, 440],
      S24: [1050, 460], S25: [1100, 450], S26: [1230, 430], S27: [1040, 480],
    },
    camera: {
      S20: { from: 1.0, to: 1.04, focus: [920, 480] },
      S21: { from: 1.03, to: 1.0, focus: [1060, 460] },
      S22: { from: 1.0, to: 1.045, focus: [1250, 440] },
      S23: { from: 1.045, to: 1.0, focus: [1250, 440] },
      S24: { from: 1.05, to: 1.0, focus: [1050, 460] },
      S25: { from: 1.0, to: 1.03, focus: [1100, 450] },
      S26: { from: 1.0, to: 1.06, focus: [1230, 430] },
      S27: { from: 1.02, to: 1.0, focus: [1040, 480] },
    },
    transitions: {
      S20: { type: "scan", dir: 2, dur: 0.38, align: "end" },
      S21: { type: "fade", dur: 0.3, align: "start" },
      S22: { type: "cut", flash: 0.18 },
      S23: { type: "cut" },
      S24: { type: "dissolve", dur: 0.36, align: "start", cells: 18 },
      S25: { type: "scan", dir: 1, dur: 0.34, align: "end" },
      S26: { type: "cut", flash: 0.2 },
      S27: { type: "dissolve", dur: 0.4, align: "start", cells: 20 },
    },
  },
  {
    id: "p4",
    base: 28, // S28-S35
    config: P4,
    render: renderP4,
    // The storyboard asks for emptiness here, so the ambient layer is quieter
    // than anywhere else in the film.
    ambient: {
      S28: "chat", S29: "model", S30: "chat", S31: "chat",
      S32: "plate", S33: "model", S34: "plate", S35: "chat",
    },
    focus: {
      S28: [1100, 490], S29: [1040, 500], S30: [1150, 500], S31: [1100, 500],
      S32: [1300, 500], S33: [1060, 500], S34: [1160, 500], S35: [1080, 500],
    },
    camera: {
      S28: { from: 1.0, to: 1.03, focus: [1100, 490] },
      S29: { from: 1.03, to: 1.0, focus: [1040, 500] },
      S30: { from: 1.0, to: 1.035, focus: [1150, 500] },
      S31: { from: 1.02, to: 1.0, focus: [1100, 500] },
      S32: { from: 1.0, to: 1.05, focus: [1300, 500] },
      S33: { from: 1.03, to: 1.0, focus: [1060, 500] },
      S34: { from: 1.0, to: 1.05, focus: [1160, 500] },
      S35: { from: 1.03, to: 1.0, focus: [1080, 500] },
    },
    transitions: {
      S29: { type: "scan", dir: 0, dur: 0.4, align: "end" },
      S30: { type: "fade", dur: 0.4, align: "start" },
      S31: { type: "dissolve", dur: 0.34, align: "start", cells: 18 },
      S32: { type: "fade", dur: 0.38, align: "start" },
      S33: { type: "dissolve", dur: 0.34, align: "start", cells: 20 },
      // Into and out of a face is a hard cut or a fade, never a wipe.
      S34: { type: "fade", dur: 0.36, align: "start" },
      S35: { type: "scan", dir: 1, dur: 0.36, align: "end" },
    },
  },
  {
    id: "p5",
    base: 36, // S36-S43
    config: P5,
    render: renderP5,
    ambient: {
      S36: "model", S37: "model", S38: "chat", S39: "model",
      S40: "model", S41: "model", S42: "model", S43: "plate",
    },
    focus: {
      S36: [1060, 500], S37: [1040, 500], S38: [1080, 500], S39: [1040, 520],
      S40: [1040, 520], S41: [1040, 520], S42: [1060, 520], S43: [1120, 470],
    },
    camera: {
      S36: { from: 1.0, to: 1.04, focus: [1060, 500] },
      S37: { from: 1.05, to: 1.0, focus: [1040, 500] },
      S38: { from: 1.02, to: 1.0, focus: [1080, 500] },
      S39: { from: 1.0, to: 1.035, focus: [1040, 520] },
      S40: { from: 1.04, to: 1.0, focus: [1040, 520] },
      S41: { from: 1.0, to: 1.05, focus: [1040, 520] },
      S42: { from: 1.04, to: 1.0, focus: [1060, 520] },
      S43: { from: 1.0, to: 1.03, focus: [1120, 470] },
    },
    transitions: {
      S37: { type: "dissolve", dur: 0.36, align: "start", cells: 20 },
      S38: { type: "scan", dir: 1, dur: 0.36, align: "end" },
      S39: { type: "fade", dur: 0.34, align: "start" },
      S40: { type: "dissolve", dur: 0.32, align: "start", cells: 22 },
      S41: { type: "circle", dur: 0.4, align: "start" },
      S42: { type: "scan", dir: 0, dur: 0.34, align: "end" },
      // A face in frame only ever gets a cut or a fade.
      S43: { type: "cut", flash: 0.2 },
    },
  },
  {
    id: "p6",
    base: 44, // S44-S50
    config: P6,
    render: renderP6,
    ambient: {
      S44: "model", S45: "plate", S46: "plate", S47: "model",
      S48: "model", S49: "chat", S50: "model",
    },
    focus: {
      S44: [1100, 520], S45: [1280, 500], S46: [1100, 540], S47: [1040, 520],
      S48: [1040, 520], S49: [1120, 520], S50: [1040, 540],
    },
    camera: {
      // S44 pushes fast along the channel and then stops.
      S44: { from: 1.0, to: 1.08, focus: [1180, 500] },
      S45: { from: 1.0, to: 1.04, focus: [1280, 500] },
      // S46 holds the hand and only the background depth moves (done in-shot).
      S46: { from: 1.0, to: 1.0, focus: [1100, 540] },
      S47: { from: 1.06, to: 1.0, focus: [1040, 520] },
      S48: { from: 1.04, to: 1.0, focus: [1480, 540] },
      S49: { from: 1.0, to: 1.05, focus: [1160, 520] },
      S50: { from: 1.0, to: 1.0, focus: [1040, 540] },
    },
    transitions: {
      S45: { type: "dissolve", dur: 0.4, align: "start", cells: 24 },
      // A matching cut: the light point lands on the same palm coordinate.
      S46: { type: "cut", flash: 0.16 },
      S47: { type: "dissolve", dur: 0.36, align: "start", cells: 22 },
      S48: { type: "slices", dur: 0.23, align: "end" },
      S49: { type: "dissolve", dur: 0.23, align: "end", cells: 26 },
      S50: { type: "cut" },
    },
  },
  {
    id: "p7",
    base: 51, // S51-S56
    config: P7,
    render: renderP7,
    ambient: {
      S51: "plate", S52: "plate", S53: "chat",
      S54: "plate", S55: "model", S56: "plate",
    },
    focus: {
      S51: [1240, 500], S52: [1240, 500], S53: [1200, 520],
      S54: [1200, 520], S55: [1100, 520], S56: [1100, 520],
    },
    camera: {
      S51: { from: 1.04, to: 1.0, focus: [1240, 500] },
      // S52 holds exactly: the swap happens in place.
      S52: { from: 1.0, to: 1.0, focus: [1240, 500] },
      S53: { from: 1.04, to: 1.0, focus: [1200, 520] },
      S54: { from: 1.0, to: 1.0, focus: [1200, 520] },
      S55: { from: 1.0, to: 1.0, focus: [1100, 520] },
      S56: { from: 1.0, to: 1.0, focus: [1100, 520] },
    },
    transitions: {
      S52: { type: "fade", dur: 0.4, align: "start" },
      S53: { type: "scan", dir: 1, dur: 0.4, align: "end" },
      S54: { type: "fade", dur: 0.5, align: "start" },
      S55: { type: "fade", dur: 0.45, align: "start" },
      S56: { type: "fade", dur: 0.5, align: "start" },
    },
  },
];

export const shotId = (segment, index) =>
  `S${String(segment.base + index).padStart(2, "0")}`;

/** Every drawn shot in song-time order, with what is needed to render it. */
export const ALL_SHOTS = SEGMENTS.flatMap((segment) =>
  segment.config.shots.slice(0, -1).map((t, index) => ({
    t,
    id: shotId(segment, index),
    seg: segment.id,
    idx: index,
  })),
).sort((a, b) => a.t - b.t);

/** Song-time ranges drawn by the engine; everything else is still the concept overlay. */
export const POLISHED_RANGES = SEGMENTS.map((s) => [s.config.start, s.config.end]);

const merge = (key) => Object.assign({}, ...SEGMENTS.map((s) => s[key] || {}));
export const AMBIENT_BY_SHOT = merge("ambient");
export const AMBIENT_FOCUS = merge("focus");
export const SHOT_CAMERA = merge("camera");
export const SHOT_TRANSITIONS = merge("transitions");

export const SEGMENT_RENDER = Object.fromEntries(
  SEGMENTS.map((s) => [s.id, s.render]),
);

export const inPolished = (t) =>
  POLISHED_RANGES.some(([a, b]) => t >= a && t < b);
