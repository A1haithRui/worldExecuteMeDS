// Song-time feature sampler.
//
// Pure: given the feature table and a song time it returns the same numbers
// every call. No cross-frame state, no Math.random. The renderer must be able
// to seek backwards and get bit-identical output.
//
// The table is produced by tools/build-audio-features.py:
//   { rate_hz, count, series: { names, data: [base64 uint8, ...] },
//     beat_grid: { bpm, period, phase }, onsets: { time[], strength[] } }

const DECAY = {
  low: 7.0,
  rms: 5.0,
  mid: 6.0,
  high: 8.0,
  beat: 6.0,
  bar: 3.6,
  onset: 9.0,
};
const BEATS_PER_BAR = 4;
// "No onset before t" sentinel. Finite on purpose: it keeps exp(-k*since) at 0
// and survives JSON.stringify in the export diagnostics.
const NO_ONSET = 1e9;

function decodeBase64(text) {
  if (typeof atob === "function") {
    const bin = atob(text);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  // Node, for offline checks and the export tool.
  const buf = Buffer.from(text, "base64");
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}

export function createFeatures(table) {
  const rate = table.rate_hz;
  const count = table.count;
  const names = table.series.names;
  const series = {};
  names.forEach((name, i) => {
    series[name] = decodeBase64(table.series.data[i]);
  });

  const grid = table.beat_grid || {};
  const period = grid.period || 60 / (grid.bpm || 130);
  const phase0 = grid.phase || 0;
  const onsetTime = table.onsets?.time || [];
  const onsetStrength = table.onsets?.strength || [];

  // Last table frame index at or before t, plus the blend factor.
  function locate(t) {
    const x = t * rate;
    if (x <= 0) return { i: 0, k: 0 };
    if (x >= count - 1) return { i: count - 1, k: 0 };
    const i = Math.floor(x);
    return { i, k: x - i };
  }

  function seriesAt(name, t) {
    const data = series[name];
    if (!data) throw new Error(`unknown feature series: ${name}`);
    const { i, k } = locate(t);
    if (k === 0) return data[i] / 255;
    const next = i + 1 < count ? i + 1 : i;
    return (data[i] * (1 - k) + data[next] * k) / 255;
  }

  // Stateless peak-hold: max over the recent window of value * exp(-release*age).
  // Stateless matters: a scene stays a pure function of t, so scrubbing and
  // exporting agree.
  function envAt(name, t, release = DECAY[name] ?? 6, window = 0.9) {
    const data = series[name];
    if (!data) throw new Error(`unknown feature series: ${name}`);
    const end = Math.min(count - 1, Math.floor(t * rate));
    const back = Math.max(0, Math.round(window * rate));
    let best = 0;
    for (let i = end; i >= end - back && i >= 0; i--) {
      const age = (end - i) / rate;
      const v = (data[i] / 255) * Math.exp(-release * age);
      if (v > best) best = v;
      // Once the decay has buried the raw ceiling there is nothing to gain.
      if (best > 0 && Math.exp(-release * age) < 0.02) break;
    }
    return best;
  }

  function onsetAt(t) {
    // Binary search: index of the last onset at or before t.
    let lo = 0;
    let hi = onsetTime.length - 1;
    let found = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (onsetTime[mid] <= t) {
        found = mid;
        lo = mid + 1;
      } else hi = mid - 1;
    }
    if (found < 0) return { index: -1, since: NO_ONSET, strength: 0 };
    return {
      index: found,
      since: t - onsetTime[found],
      strength: onsetStrength[found] ?? 0,
    };
  }

  function onsetsIn(t0, t1, minStrength = 0) {
    const out = [];
    for (let i = 0; i < onsetTime.length; i++) {
      if (onsetTime[i] < t0) continue;
      if (onsetTime[i] >= t1) break;
      if ((onsetStrength[i] ?? 0) >= minStrength) out.push(i);
    }
    return out;
  }

  /** Onsets inside a window as {index, time, strength}, earliest first. */
  function onsetEvents(t0, t1, minStrength = 0) {
    return onsetsIn(t0, t1, minStrength).map((i) => ({
      index: i,
      time: onsetTime[i],
      strength: onsetStrength[i] ?? 0,
    }));
  }

  function beatIndex(t) {
    return Math.floor((t - phase0) / period);
  }
  function beatTime(n) {
    return phase0 + n * period;
  }
  function beatAt(t) {
    const n = beatIndex(t);
    const since = t - beatTime(n);
    const beatInBar = ((n % BEATS_PER_BAR) + BEATS_PER_BAR) % BEATS_PER_BAR;
    const barIndex = Math.floor(n / BEATS_PER_BAR);
    const sinceBar = t - (phase0 + barIndex * BEATS_PER_BAR * period);
    return { n, since, beatInBar, barIndex, sinceBar };
  }
  // Snap a time to the nearest beat, or return it unchanged when nothing is close.
  function snapToBeat(t, tolerance = 0.06) {
    const n = Math.round((t - phase0) / period);
    const snapped = beatTime(n);
    return Math.abs(snapped - t) <= tolerance ? snapped : t;
  }
  function snapHalf(t, tolerance = 0.06) {
    const half = period / 2;
    const n = Math.round((t - phase0) / half);
    const snapped = phase0 + n * half;
    return Math.abs(snapped - t) <= tolerance ? snapped : t;
  }

  function sample(t) {
    const low = seriesAt("low", t);
    const mid = seriesAt("mid", t);
    const high = seriesAt("high", t);
    const rms = seriesAt("rms", t);
    const lowEnv = envAt("low", t, DECAY.low);
    const rmsEnv = envAt("rms", t, DECAY.rms);
    const highEnv = envAt("high", t, DECAY.high);
    const b = beatAt(t);
    const o = onsetAt(t);
    return {
      t,
      rms,
      low,
      mid,
      high,
      lowEnv,
      rmsEnv,
      highEnv,
      beat: b.n,
      beatPhase: (t - phase0) / period - b.n,
      sinceBeat: b.since,
      beatInBar: b.beatInBar,
      bar: b.barIndex,
      sinceBar: b.sinceBar,
      beatPulse: Math.exp(-DECAY.beat * b.since),
      barPulse: Math.exp(-DECAY.bar * b.sinceBar),
      onset: o.index,
      sinceOnset: o.since,
      onsetStrength: o.strength,
      onsetPulse: o.since >= NO_ONSET ? 0 : o.strength * Math.exp(-DECAY.onset * o.since),
    };
  }

  return {
    rate,
    count,
    bpm: 60 / period,
    period,
    phase: phase0,
    duration: table.source?.duration ?? count / rate,
    seriesAt,
    envAt,
    onsetAt,
    onsetsIn,
    onsetEvents,
    onsetCount: onsetTime.length,
    beatIndex,
    beatTime,
    beatAt,
    snapToBeat,
    snapHalf,
    sample,
  };
}

export { DECAY, BEATS_PER_BAR, NO_ONSET, decodeBase64 };
