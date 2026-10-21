"""Measure the god plate's face hole, and trace the cat parts into polygons.

Two jobs, both one-off geometry rather than per-frame work:

1. The eye in the proof shot has to sit in the middle of the void where her face is.
   I guessed that point; this measures it off the processed plate (largest very-dark
   region inside the head) and prints it in plate coordinates.

2. The cat ears and tail arrived as flat bitmaps. The film is vector, and the parts
   have to grow from their own roots, so they are traced here into polygon outlines
   that shots/cat-parts.js can draw, scale and reveal.
"""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "character"


def face_hole() -> None:
    plate = Image.open(OUT / "deepseek_god_paper.png").convert("RGBA")
    a = np.array(plate)
    rgb = a[:, :, :3].astype(np.int16)
    dark = (a[:, :, 3] > 128) & (rgb[:, :, 0] < 30) & (rgb[:, :, 1] < 40) & (rgb[:, :, 2] < 60)
    # the head is roughly the upper middle; take the biggest dark run there
    region = dark[240:760, 300:1000]
    ys, xs = np.where(region)
    if not len(xs):
        raise SystemExit("no dark region found")
    # the void face is the biggest connected dark blob: approximate it with a coarse
    # grid so a stray hair shadow cannot drag the centroid
    gy, gx = np.mgrid[0:region.shape[0], 0:region.shape[1]]
    cell = 8
    blocks = {}
    for y, x in zip(ys[::3], xs[::3]):
        blocks.setdefault((y // cell, x // cell), []).append((y, x))
    biggest = max(blocks.values(), key=len)
    by = np.array([p[0] for p in biggest])
    bx = np.array([p[1] for p in biggest])
    cy = int(by.mean()) + 240
    cx = int(bx.mean()) + 300
    print({"face_plate_xy": [cx, cy], "blob_w": int(np.ptp(bx)), "blob_h": int(np.ptp(by))})


def largest_contour(mask: np.ndarray) -> list[tuple[int, int]]:
    """Outer boundary of a binary mask, walked on the pixel grid (Moore tracing)."""
    ys, xs = np.where(mask)
    start = (int(ys[np.argmin(ys * 100000 + xs)]), int(xs[np.argmin(ys * 100000 + xs)]))
    # start at the topmost-then-leftmost filled pixel
    sy, sx = start
    dirs = [(-1, 0), (-1, 1), (0, 1), (1, 1), (1, 0), (1, -1), (0, -1), (-1, -1)]
    contour = [(sy, sx)]
    prev = 7
    cur = (sy, sx)
    for _ in range(200000):
        found = False
        for k in range(8):
            d = (prev + 6 + k) % 8  # start from the back-left of the previous step
            dy, dx = dirs[d]
            ny, nx = cur[0] + dy, cur[1] + dx
            if 0 <= ny < mask.shape[0] and 0 <= nx < mask.shape[1] and mask[ny, nx]:
                contour.append((ny, nx))
                prev = d
                cur = (ny, nx)
                found = True
                break
        if not found:
            break
        if cur == (sy, sx) and len(contour) > 3:
            break
    return contour


def simplify(points: list[tuple[int, int]], tol: float) -> list[tuple[int, int]]:
    """Douglas-Peucker."""
    if len(points) < 3:
        return points
    a = np.array(points, dtype=float)
    keep = np.zeros(len(a), dtype=bool)
    keep[0] = keep[-1] = True

    def walk(i: int, j: int) -> None:
        if j <= i + 1:
            return
        p, q = a[i], a[j]
        seg = q - p
        n = np.hypot(*seg)
        if n < 1e-6:
            d = np.hypot(*(a[i + 1:j] - p).T)
        else:
            d = np.abs(np.cross(seg, a[i + 1:j] - p)) / n
        k = int(np.argmax(d))
        if d[k] > tol:
            keep[i + 1 + k] = True
            walk(i, i + 1 + k)
            walk(i + 1 + k, j)

    walk(0, len(a) - 1)
    return [points[i] for i in np.where(keep)[0]]


def trace_part(name: str) -> dict:
    img = Image.open(OUT / "cat-whale-icon" / f"{name}.png").convert("RGBA")
    a = np.array(img)
    mask = a[:, :, 3] > 128
    ys, xs = np.where(mask)
    y0, y1, x0, x1 = int(ys.min()), int(ys.max()) + 1, int(xs.min()), int(xs.max()) + 1
    contour = largest_contour(mask)
    pts = simplify(contour, 1.6)
    # normalise into the part's own box, 0..1, y down
    w, h = x1 - x0, y1 - y0
    norm = [[round((x - x0) / w, 4), round((y - y0) / h, 4)] for y, x in pts]
    return {"name": name, "box": [w, h], "points": norm}


def main() -> None:
    face_hole()
    parts = [trace_part(n) for n in ("left_ear", "right_ear", "cat_tail")]
    for p in parts:
        print(p["name"], "box", p["box"], "points", len(p["points"]))
    Path(ROOT / "out" / "cat-parts.json").write_text(
        __import__("json").dumps(parts, indent=1), encoding="utf8"
    )


if __name__ == "__main__":
    main()
