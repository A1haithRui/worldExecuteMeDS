#!/usr/bin/env python
"""Photosensitivity / flash-frame check for an exported film.

Counts frame-to-frame luminance jumps that are large enough to be a hazard, and
reports the worst single jump plus the worst 1-second window, following the usual
guidance of at most three general flashes per second.

Usage:
  python tools/check-flash.py VIDEO [--json OUT] [--width 160]
                                    [--flash-delta 0.10] [--max-per-second 3]

Luminance is measured on a downscaled greyscale frame, so this is a whole-frame
check: it catches a cut or a bloom to white, which is what actually triggers
photosensitivity. It is not a per-region analyser.
"""
import argparse
import json
import subprocess
import sys

import numpy as np


def ffmpeg_path():
    import os

    here = os.path.dirname(os.path.abspath(__file__))
    for cand in (
        os.path.join(here, "..", "..", "world-execute-me-lyric-mv",
                     "node_modules", "ffmpeg-static", "ffmpeg.exe"),
        os.path.join(here, "..", "node_modules", "ffmpeg-static", "ffmpeg.exe"),
    ):
        if os.path.exists(cand):
            return os.path.abspath(cand)
    return "ffmpeg"


def probe(ff, video):
    """Source fps and frame size."""
    out = subprocess.run(
        [ff, "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=r_frame_rate,width,height",
         "-of", "default=nw=1", video],
        capture_output=True, text=True,
    ).stdout
    fps, w, h = 60.0, 1920, 1080
    for line in out.splitlines():
        key, _, val = line.partition("=")
        if key == "r_frame_rate":
            num, _, den = val.partition("/")
            if den and float(den):
                fps = float(num) / float(den)
        elif key == "width":
            w = int(val)
        elif key == "height":
            h = int(val)
    return fps, w, h


def read_luma(ff, video, width):
    """Whole-frame mean luminance per frame, in 0..1.

    The output size is forced rather than inferred: guessing the frame height
    from the byte count silently picks a spurious divisor and corrupts every
    number in the report.
    """
    _, sw, sh = probe(ff, video)
    height = max(2, int(round(width * sh / sw / 2)) * 2)
    proc = subprocess.run(
        [ff, "-v", "error", "-i", video,
         "-vf", "scale=%d:%d,format=gray" % (width, height),
         "-f", "rawvideo", "-pix_fmt", "gray", "-"],
        capture_output=True,
    )
    if proc.returncode != 0:
        sys.stderr.write(proc.stderr.decode("utf-8", "replace")[-2000:])
        raise SystemExit("ffmpeg failed to decode %s" % video)
    raw = np.frombuffer(proc.stdout, dtype=np.uint8)
    if raw.size % (width * height):
        raise SystemExit(
            "decoded %d bytes, not a whole number of %dx%d frames"
            % (raw.size, width, height)
        )
    return raw, width, height


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--json")
    ap.add_argument("--width", type=int, default=160)
    ap.add_argument("--flash-delta", type=float, default=0.10,
                    help="relative luminance jump counted as a flash (default 0.10)")
    ap.add_argument("--max-per-second", type=int, default=3)
    args = ap.parse_args()

    ff = ffmpeg_path()
    fps, _, _ = probe(ff, args.video)
    raw, width, height = read_luma(ff, args.video, args.width)
    frames = raw.reshape(-1, height, width).astype(np.float32) / 255.0
    luma = frames.reshape(frames.shape[0], -1).mean(axis=1)

    delta = np.abs(np.diff(luma))
    flashes = np.flatnonzero(delta >= args.flash_delta)

    # Worst 1-second window, in frames.
    per_second = max(1, int(round(fps)))
    worst_window = 0
    worst_at = 0.0
    if flashes.size:
        for start in flashes:
            n = int(np.sum((flashes >= start) & (flashes < start + per_second)))
            if n > worst_window:
                worst_window = n
                worst_at = start / fps

    report = {
        "video": args.video,
        "fps": fps,
        "frames": int(luma.shape[0]),
        "duration": luma.shape[0] / fps,
        "flash_delta_threshold": args.flash_delta,
        "flash_count": int(flashes.size),
        "max_flashes_per_second": int(worst_window),
        "worst_window_at": worst_at,
        "max_luma_jump": float(delta.max()) if delta.size else 0.0,
        "max_luma_jump_at": float(delta.argmax() / fps) if delta.size else 0.0,
        "luma_min": float(luma.min()),
        "luma_max": float(luma.max()),
        "luma_mean": float(luma.mean()),
        "passes_max_per_second": bool(worst_window <= args.max_per_second),
    }
    # The three largest jumps, to point at the cuts worth looking at.
    if delta.size:
        top = np.argsort(delta)[-3:][::-1]
        report["largest_jumps"] = [
            {"at": float(i / fps), "delta": float(delta[i])} for i in top
        ]

    print(json.dumps(report, indent=2, ensure_ascii=False))
    if args.json:
        with open(args.json, "w", encoding="utf-8") as fh:
            json.dump(report, fh, indent=2, ensure_ascii=False)
    return 0 if report["passes_max_per_second"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
