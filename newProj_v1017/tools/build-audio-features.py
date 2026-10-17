#!/usr/bin/env python3
"""Build the song-time feature table the MV renderer consumes.

Deterministic, offline, no browser. Reads the local WAV (never committed) and
writes compact quantised series plus a beat grid and an onset list.

Output is pure data: no lyric text, no audio samples.

Usage:
    python tools/build-audio-features.py [--wav audio/song.wav]
        [--out data/audio-features-v1.json] [--rate 100] [--quiet]

Method (kept consistent with tools/analyze_storyboard_audio.py so the two agree):
  * stereo -> mono mixdown
  * STFT, Hann window, 2048 points, hop = sample_rate / table_rate
  * low 40-180 Hz, mid 300-3400 Hz, high 3400-16000 Hz, plus full-band flux
  * onsets = adaptive-threshold peaks of the wide flux, >=90 ms apart
  * beat grid = integer-lag autocorrelation of the low flux over the
    120-141 BPM range with parabolic refinement, then a fine 0.01 BPM and
    0.01 s phase search scored on the low flux sampled at the lattice
"""

import argparse
import base64
import hashlib
import json
import os
import sys
import wave

import numpy as np

LOW_HZ = (40.0, 180.0)
MID_HZ = (300.0, 3400.0)
HIGH_HZ = (3400.0, 16000.0)
N_FFT = 2048
BPM_SEARCH = (120.0, 141.0)
MIN_ONSET_GAP = 0.090
BLOCK = 1024  # STFT frames per batch; keeps peak memory ~16 MB


def read_wav(path):
    with wave.open(path, "rb") as w:
        channels = w.getnchannels()
        width = w.getsampwidth()
        rate = w.getframerate()
        frames = w.getnframes()
        raw = w.readframes(frames)
    if width != 2:
        raise SystemExit(f"expected 16-bit PCM, got {width * 8}-bit")
    data = np.frombuffer(raw, dtype="<i2").astype(np.float64) / 32768.0
    if channels > 1:
        data = data.reshape(-1, channels).mean(axis=1)
    return data, rate, channels, frames


def sha256_file(path, chunk=1 << 20):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(chunk), b""):
            h.update(block)
    return h.hexdigest()


def frame_analysis(signal, rate, hop):
    """One pass: Hann STFT magnitudes plus the per-frame RMS."""
    window = np.hanning(N_FFT)
    starts = np.arange(0, len(signal) - N_FFT, hop)
    freqs = np.fft.rfftfreq(N_FFT, 1.0 / rate)
    mags = np.empty((len(starts), len(freqs)), dtype=np.float32)
    rms = np.empty(len(starts), dtype=np.float64)
    offsets = np.arange(N_FFT)[None, :]
    for i in range(0, len(starts), BLOCK):
        j = min(len(starts), i + BLOCK)
        frames = signal[starts[i:j, None] + offsets]
        rms[i:j] = np.sqrt(np.mean(frames ** 2, axis=1))
        mags[i:j] = np.abs(np.fft.rfft(frames * window, axis=1)).astype(np.float32)
    return mags, freqs, starts, rms


def band_energy(mags, freqs, lo, hi):
    sel = (freqs >= lo) & (freqs < hi)
    return mags[:, sel].sum(axis=1)


def normalise(x, percentile=99.5):
    hi = float(np.percentile(x, percentile))
    if hi <= 1e-12:
        return np.zeros_like(x)
    return np.clip(x / hi, 0.0, 1.0)


def spectral_flux(energy):
    return np.maximum(np.diff(energy, prepend=energy[:1]), 0.0)


def detect_onsets(flux, hop, rate, min_gap=MIN_ONSET_GAP):
    """Adaptive-threshold peak picking on a positive flux curve."""
    n = len(flux)
    win = max(3, int(round(0.25 * rate / hop)))
    thresh = np.empty(n, dtype=np.float64)
    for i in range(0, n, win):
        j = min(n, i + win)
        thresh[i:j] = np.median(flux[max(0, i - win):min(n, j + win)]) * 1.6 + 1e-12
    gap = max(1, int(round(min_gap * rate / hop)))
    is_peak = (flux > thresh) & (flux >= np.roll(flux, 1)) & (flux >= np.roll(flux, -1))
    is_peak[0] = is_peak[-1] = False
    # Greedy non-maximum suppression over the candidate peaks, strongest first.
    cand = np.flatnonzero(is_peak)
    order = cand[np.argsort(-flux[cand])]
    taken = np.zeros(n, dtype=bool)
    keep = []
    for p in order:
        if taken[max(0, p - gap):p + gap + 1].any():
            continue
        taken[p] = True
        keep.append(p)
    keep.sort()
    times = [round(float(p) * hop / rate, 4) for p in keep]
    scale = float(flux.max()) or 1.0
    strengths = [round(float(flux[p]) / scale, 4) for p in keep]
    return times, strengths


def beat_grid(low_flux, hop, rate, total_time):
    """Autocorrelation for tempo, then a vectorised tempo+phase lattice search."""
    flux = low_flux - low_flux.mean()
    n = len(flux)
    lo_lag = int(round(60.0 / BPM_SEARCH[1] * rate / hop))
    hi_lag = min(int(round(60.0 / BPM_SEARCH[0] * rate / hop)), n // 2)
    if hi_lag <= lo_lag:
        raise SystemExit("audio too short for beat search")
    lags = np.arange(lo_lag, hi_lag + 1)
    ac = np.array([float(np.dot(flux[:-lag], flux[lag:])) for lag in lags])
    k = int(np.argmax(ac))
    delta = 0.0
    if 0 < k < len(ac) - 1:
        y0, y1, y2 = ac[k - 1], ac[k], ac[k + 1]
        denom = y0 - 2 * y1 + y2
        if abs(denom) > 1e-12:
            delta = float(np.clip(0.5 * (y0 - y2) / denom, -0.5, 0.5))
    coarse_bpm = 60.0 * rate / ((lags[k] + delta) * hop)

    lo_bpm = max(BPM_SEARCH[0], coarse_bpm - 2.0)
    hi_bpm = min(BPM_SEARCH[1], coarse_bpm + 2.0)
    phases = np.arange(0.0, 60.0 / lo_bpm, 0.01)
    best = None
    for bpm in np.arange(lo_bpm, hi_bpm + 1e-9, 0.01):
        period = 60.0 / bpm
        count = int(total_time / period) + 1
        if count < 8:
            continue
        ks = np.arange(count)
        idx = np.round((phases[:, None] + ks[None, :] * period) * rate / hop).astype(np.int64)
        valid = (idx >= 0) & (idx < n)
        vals = np.where(valid, low_flux[np.clip(idx, 0, n - 1)], 0.0)
        cnt = np.maximum(valid.sum(axis=1), 1)
        mean = vals.sum(axis=1) / cnt
        std = np.sqrt(np.maximum((vals ** 2).sum(axis=1) / cnt - mean ** 2, 0.0))
        score = mean + 0.5 * std
        j = int(np.argmax(score))
        if best is None or score[j] > best[0]:
            best = (float(score[j]), float(bpm), float(phases[j]))
    if best is None:
        raise SystemExit("beat grid search found no candidate")
    _, bpm, phase = best
    return {
        "bpm": round(bpm, 4),
        "period": round(60.0 / bpm, 6),
        "phase": round(phase, 4),
        "autocorrelation_bpm": round(coarse_bpm, 3),
        "autocorrelation_lag_frames": int(lags[k]),
        "search_range_bpm": [round(lo_bpm, 3), round(hi_bpm, 3)],
    }


def quantise(series):
    return np.clip(np.rint(np.asarray(series, dtype=np.float64) * 255.0), 0, 255).astype(np.uint8)


def pack(series):
    """uint8 bytes -> base64, so the table stays small and decodes into a typed array."""
    return base64.b64encode(quantise(series).tobytes()).decode("ascii")


def main():
    ap = argparse.ArgumentParser()
    here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ap.add_argument("--wav", default=os.path.join(here, "audio", "song.wav"))
    ap.add_argument("--out", default=os.path.join(here, "data", "audio-features-v1.json"))
    ap.add_argument("--rate", type=float, default=100.0, help="table rate in Hz")
    ap.add_argument("--spectrum", action="store_true",
                    help="also emit the 32-band spectrum (adds roughly 0.9 MB)")
    ap.add_argument("--spectrum-bands", type=int, default=32)
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args()

    if not os.path.exists(args.wav):
        raise SystemExit(f"missing wav: {args.wav}")

    signal, rate, channels, frames = read_wav(args.wav)
    duration = frames / rate
    hop = max(1, int(round(rate / args.rate)))
    mags, freqs, starts, rms = frame_analysis(signal, rate, hop)
    table_rate = rate / hop
    table_len = len(starts)
    total_time = (table_len - 1) * hop / rate

    low = band_energy(mags, freqs, *LOW_HZ)
    mid = band_energy(mags, freqs, *MID_HZ)
    high = band_energy(mags, freqs, *HIGH_HZ)
    wide = mags.sum(axis=1)

    low_f = spectral_flux(low)
    onsets_t, onsets_s = detect_onsets(spectral_flux(wide), hop, rate)
    grid = beat_grid(low_f, hop, rate, total_time)

    out = {
        "schema_version": 1,
        "source": {
            "path": os.path.relpath(args.wav, here).replace("\\", "/"),
            "sample_rate": rate,
            "channels": channels,
            "frames": frames,
            "duration": round(duration, 6),
            "sha256": sha256_file(args.wav),
        },
        "method": {
            "kind": "stft_spectral_flux",
            "window": "hann",
            "n_fft": N_FFT,
            "hop_samples": hop,
            "bands_hz": {"low": list(LOW_HZ), "mid": list(MID_HZ), "high": list(HIGH_HZ)},
            "onset_min_gap_seconds": MIN_ONSET_GAP,
            "bpm_search": list(BPM_SEARCH),
            "note": "acoustic estimates for animation timing; not human-verified onsets",
        },
        "rate_hz": round(table_rate, 6),
        "count": table_len,
        "series": {
            "encoding": "base64-uint8",
            "quantisation": "uint8 = round(value*255); value normalised to the 99.5th percentile",
            "names": ["rms", "low", "mid", "high"],
            "data": [
                pack(normalise(rms)),
                pack(normalise(low)),
                pack(normalise(mid)),
                pack(normalise(high)),
            ],
        },
        "beat_grid": grid,
        "onsets": {"time": onsets_t, "strength": onsets_s, "count": len(onsets_t)},
    }

    if args.spectrum:
        edges = np.geomspace(max(float(freqs[1]), 40.0), min(float(freqs[-1]), 16000.0),
                             args.spectrum_bands + 1)
        rows = np.empty((args.spectrum_bands, table_len), dtype=np.float64)
        for b in range(args.spectrum_bands):
            sel = (freqs >= edges[b]) & (freqs < edges[b + 1])
            band = mags[:, sel].mean(axis=1) if sel.any() else np.zeros(table_len)
            hi = float(np.percentile(band, 99.0)) or 1.0
            rows[b] = np.clip(band / hi, 0.0, 1.0)
        out["spectrum"] = {
            "bands": args.spectrum_bands,
            "edges_hz": [round(float(e), 1) for e in edges],
            "encoding": "base64-uint8",
            "layout": "row-major, bands*count",
            "quantisation": "uint8 rows, each band normalised to its own 99th percentile",
            "data": pack(rows.reshape(-1)),
        }

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(out, f, separators=(",", ":"), ensure_ascii=False)

    if not args.quiet:
        table = out["series"]["data"]
        decoded = [
            np.frombuffer(base64.b64decode(s), dtype=np.uint8) for s in table
        ]
        print(json.dumps({
            "out": args.out,
            "bytes": os.path.getsize(args.out),
            "duration": round(duration, 6),
            "table_rate_hz": round(table_rate, 4),
            "table_count": table_len,
            "bpm": grid["bpm"],
            "phase": grid["phase"],
            "autocorrelation_bpm": grid["autocorrelation_bpm"],
            "onsets": len(onsets_t),
            "series_bytes_each": [len(base64.b64decode(s)) for s in table],
            "series_quant_means": [round(float(d.mean()), 2) for d in decoded],
            "spectrum": bool(args.spectrum),
        }, indent=2))


if __name__ == "__main__":
    sys.exit(main())
