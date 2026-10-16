#!/usr/bin/env python3
"""Measure how much actually moves in a rendered video.

The recurring failure mode in this project is a shot that looks designed on
paper but is effectively a still frame. This turns that into a number: decode
the video small and grey, then take the mean absolute difference between
consecutive frames.

    python tools/measure-motion.py out/v2-p0.mp4
    python tools/measure-motion.py --fps 30 --size 160 old.mp4 new.mp4

Reports, per file:
  mean/median/p95 frame-to-frame difference, 0..255
  static_ratio  fraction of frames below --static-threshold
  longest_still  longest run of near-identical frames, seconds

A slideshow stretch shows up as a high static_ratio and a long still run.
"""

import argparse
import json
import os
import shutil
import subprocess
import sys

import numpy as np

DEFAULT_FFMPEG_CANDIDATES = [
    os.environ.get("MV_FFMPEG"),
    r"G:\CODE\worldExecuteMe\world-execute-me-lyric-mv\node_modules\ffmpeg-static\ffmpeg.exe",
]


def find_ffmpeg(explicit=None):
    for cand in [explicit, *DEFAULT_FFMPEG_CANDIDATES]:
        if cand and os.path.exists(cand):
            return cand
    found = shutil.which("ffmpeg")
    if found:
        return found
    raise SystemExit("ffmpeg not found; pass --ffmpeg")


def decode_grey(ffmpeg, path, fps, w, h):
    cmd = [
        ffmpeg, "-v", "error", "-i", path,
        "-vf", f"fps={fps},scale={w}:{h},format=gray",
        "-f", "rawvideo", "-",
    ]
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
    if proc.returncode != 0:
        raise SystemExit(f"ffmpeg failed on {path}: {proc.stderr.decode(errors='replace')[:400]}")
    frame = w * h
    n = len(proc.stdout) // frame
    if n == 0:
        raise SystemExit(f"no frames decoded from {path}")
    data = np.frombuffer(proc.stdout[: n * frame], dtype=np.uint8)
    return data.reshape(n, h, w)


def analyse(frames, fps, static_threshold):
    if len(frames) < 2:
        return None
    d = np.abs(np.diff(frames.astype(np.int16), axis=0)).mean(axis=(1, 2))
    static = d < static_threshold
    longest = 0
    run = 0
    for s in static:
        run = run + 1 if s else 0
        longest = max(longest, run)
    return {
        "frames": int(len(frames)),
        "duration": round(len(frames) / fps, 3),
        "diff_mean": round(float(d.mean()), 4),
        "diff_median": round(float(np.median(d)), 4),
        "diff_p95": round(float(np.percentile(d, 95)), 4),
        "diff_max": round(float(d.max()), 4),
        "static_ratio": round(float(static.mean()), 4),
        "longest_still_seconds": round(longest / fps, 3),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("videos", nargs="+")
    ap.add_argument("--ffmpeg", default=None)
    ap.add_argument("--fps", type=float, default=30.0)
    ap.add_argument("--size", type=int, default=160)
    ap.add_argument("--static-threshold", type=float, default=0.5,
                    help="mean abs grey difference below which a frame counts as static")
    ap.add_argument("--json", default=None)
    args = ap.parse_args()

    ffmpeg = find_ffmpeg(args.ffmpeg)
    h = max(1, round(args.size * 9 / 16))
    results = {}
    for path in args.videos:
        if not os.path.exists(path):
            raise SystemExit(f"missing video: {path}")
        frames = decode_grey(ffmpeg, path, args.fps, args.size, h)
        res = analyse(frames, args.fps, args.static_threshold)
        results[path] = res
        print(f"{os.path.basename(path)}")
        for k in ("frames", "duration", "diff_mean", "diff_median", "diff_p95",
                  "diff_max", "static_ratio", "longest_still_seconds"):
            print(f"  {k:24s} {res[k]}")

    if len(results) > 1:
        names = list(results)
        base = results[names[0]]["diff_mean"]
        print("\nrelative motion vs first file (mean diff):")
        for n in names:
            v = results[n]["diff_mean"]
            print(f"  {os.path.basename(n):52s} {v:7.4f}  x{v / base if base else 0:.2f}")
    if args.json:
        with open(args.json, "w", encoding="utf-8") as f:
            json.dump({"fps": args.fps, "size": args.size,
                       "static_threshold": args.static_threshold,
                       "results": results}, f, indent=2)
        print(f"\nwrote {args.json}")


if __name__ == "__main__":
    sys.exit(main())
