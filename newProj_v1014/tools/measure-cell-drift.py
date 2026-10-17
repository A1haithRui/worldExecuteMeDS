#!/usr/bin/env python
"""Measure how far the S29 status cells have moved, from the frames themselves.

Independent of the renderer: for each cell it finds the row of the cell's top
border in a test frame and in a reference frame, and reports the difference. The
border is a horizontal stroke, so its row is the strongest vertical gradient in a
narrow band around its rest position; the median across columns ignores the
thumbnails and labels inside the cell.

This is what makes the drift envelope checkable on the "before" build too, which
exposed no drift figure at all.

Caveat: the reported rows are absolute, so they also contain the shot's camera
push. The camera is identical in both builds, so the drift is isolated by
subtracting the two builds' rows at the same time -- which is how the numbers in
docs/dsh-fix-round1-notes.md were produced. To read the drift from a single
build, hold the camera via ?g_zoom= or compare against a time when the envelope
is known to be zero.

Usage:
  python tools/measure-cell-drift.py --ref REF.png --cells 300,770,1240 \
      [--top 300] [--band 14] [--wide 300] FRAME [FRAME ...]
"""
import argparse
import sys

import numpy as np
from PIL import Image


def load_gray(path):
    return np.asarray(Image.open(path).convert("L"), dtype=np.float32)


def border_row(img, x_edge, top, band, wide, min_grad=1.5):
    """Row of the cell's top border, or None when the border is not visible."""
    y_lo, y_hi = max(1, top - band), min(img.shape[0] - 2, top + band)
    x0, x1 = x_edge + 40, x_edge + 40 + wide
    if x1 > img.shape[1]:
        return None
    strip = img[y_lo - 1 : y_hi + 2, x0:x1]
    grad = np.abs(np.diff(strip, axis=0))
    per_col = np.argmax(grad, axis=0)
    peak = grad[per_col, np.arange(grad.shape[1])]
    keep = peak >= min_grad
    if keep.sum() < (x1 - x0) * 0.25:
        return None
    return float(np.median(y_lo + per_col[keep]))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--ref", required=True, help="frame where the cells are at rest")
    ap.add_argument("--cells", required=True, help="comma-separated cell left edges")
    ap.add_argument("--top", type=int, default=300, help="cell top edge y at rest")
    ap.add_argument("--band", type=int, default=14, help="rows to search either side")
    ap.add_argument("--wide", type=int, default=300, help="columns to average over")
    ap.add_argument("frames", nargs="+")
    args = ap.parse_args()

    cells = [int(c) for c in args.cells.split(",")]
    ref = load_gray(args.ref)
    ref_rows = [border_row(ref, c, args.top, args.band, args.wide) for c in cells]

    print(f"reference: {args.ref}")
    print("  border rows: " + ", ".join(
        "n/a" if r is None else f"{r:.1f}" for r in ref_rows))
    header = "frame".ljust(34) + "".join(f"cell{i+1}".rjust(10) for i in range(len(cells)))
    print(header)
    print("-" * len(header))
    for path in args.frames:
        img = load_gray(path)
        vals = []
        for i, c in enumerate(cells):
            row = border_row(img, c, args.top, args.band, args.wide)
            if row is None or ref_rows[i] is None:
                vals.append("n/a")
            else:
                vals.append(f"{row - ref_rows[i]:+.1f}")
        name = path.rsplit("/", 1)[-1].rsplit("\\", 1)[-1]
        print(name.ljust(34) + "".join(v.rjust(10) for v in vals))
    return 0


if __name__ == "__main__":
    sys.exit(main())
