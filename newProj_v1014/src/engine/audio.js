// Single access point for the song's feature table.
//
// Shots are pure functions of song time, and so is this: the table is loaded
// once and never mutated, so importing it does not break the property that a
// frame depends only on `t`.
import { createFeatures } from "./features.js";

let table = null;
let features = null;

export function setAudioFeatures(json) {
  table = json;
  features = json ? createFeatures(json) : null;
  return features;
}

export function audio() {
  return features;
}

// Safe sample: before the table loads (or if the file is missing) every field
// falls back to a neutral value instead of throwing, so a missing data file
// degrades the look rather than breaking the player.
const NEUTRAL = Object.freeze({
  t: 0, rms: 0, low: 0, mid: 0, high: 0,
  lowEnv: 0, rmsEnv: 0, highEnv: 0,
  beat: 0, beatPhase: 0, sinceBeat: 0, beatInBar: 0, bar: 0, sinceBar: 0,
  beatPulse: 0, barPulse: 0,
  onset: -1, sinceOnset: 1e9, onsetStrength: 0, onsetPulse: 0,
});

export function sampleAt(t) {
  return features ? features.sample(t) : { ...NEUTRAL, t };
}

export function seriesAt(name, t, fallback = 0) {
  return features ? features.seriesAt(name, t) : fallback;
}

export function onsetsIn(t0, t1, minStrength = 0) {
  return features ? features.onsetsIn(t0, t1, minStrength) : [];
}

export function onsetAt(t) {
  return features ? features.onsetAt(t) : { index: -1, since: 1e9, strength: 0 };
}

export function beatTime(n) {
  return features ? features.beatTime(n) : n * (60 / 130);
}

export function snapToBeat(t, tolerance = 0.06) {
  return features ? features.snapToBeat(t, tolerance) : t;
}

/** Convenience: the most recent onset's age in seconds, or Infinity. */
export function sinceOnset(t) {
  return onsetAt(t).since;
}

/** Recent onsets with their strength, newest last, inside a look-back window. */
export function recentOnsets(t, lookback = 1.2, minStrength = 0) {
  return features ? features.onsetEvents(t - lookback, t + 1e-6, minStrength) : [];
}

export const audioTable = () => table;

/**
 * The most recent beats, newest first, each with its age.
 *
 * Shots re-simulate an event from its own timestamp rather than accumulating
 * state, which is what keeps a frame reproducible after a seek: a pulse is a
 * pure function of (t, its own event time).
 */
export function beatPulses(t, count = 4) {
  const period = features ? features.period : 60 / 130;
  const phase = features ? features.phase : 0;
  const base = Math.floor((t - phase) / period);
  const out = [];
  for (let k = 0; k < count; k++) {
    const index = base - k;
    if (index < 0) continue;
    const time = phase + index * period;
    const age = t - time;
    if (age < 0) continue;
    out.push({
      index,
      time,
      age,
      progress: Math.min(1, Math.max(0, age / period)),
    });
  }
  return out;
}

/** Recent onsets, newest first, each with its age in seconds. */
export function onsetPulses(t, lookback = 1.5, minStrength = 0.12) {
  if (!features) return [];
  return features
    .onsetEvents(t - lookback, t + 1e-6, minStrength)
    .map((o) => ({ ...o, age: t - o.time }))
    .reverse();
}
