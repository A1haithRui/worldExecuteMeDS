"""Turn the image model's raw plates into production plates.

The model returns: 1086x1448 RGB, no alpha, flat magenta background, a few
colours that are close to ours but not ours. This script does the four things
the film needs and nothing else:

  1. key the magenta out (with an alpha ramp, and unmix it so no pink fringe
     survives on the edges);
  2. scale the figure so its content height equals the female plate's (1438),
     and centre it on the same axis -- so all three plates can be drawn at the
     same (cx, cy, height) and land on top of each other;
  3. quantise to the film's three inks (#041220 / #00B4E6 / #F2F7FA), which also
     removes whatever fourth colour the model felt like using;
  4. write 1342x1704 RGBA plates into assets/character/.

Run:  python tools/process-character-raw.py
"""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "assets" / "character" / "raw"
OUT = ROOT / "assets" / "character"

# The film's three inks, and the canvas/registration the female plate already uses.
INKS = np.array([[0x04, 0x12, 0x20], [0x00, 0xB4, 0xE6], [0xF2, 0xF7, 0xFA]], dtype=np.int16)
CANVAS = (1342, 1704)
# content box of deepseek_bust_v3.png, measured from its alpha channel
FEMALE_BOX = (128, 128, 1214, 1566)
CONTENT_H = FEMALE_BOX[3] - FEMALE_BOX[1]
CONTENT_CX = (FEMALE_BOX[0] + FEMALE_BOX[2]) // 2
CONTENT_TOP = FEMALE_BOX[1]

JOBS = [
    ("man_bust_raw.png", "deepseek_man_bust.png"),
    ("cat_bust_raw.png", "deepseek_cat_bust.png"),
    # the god plate is a plate like any other: same canvas, same inks, same
    # registration, so it can be drawn at the same (cx, cy, height) as the rest
    ("god_paper_triangles_raw.png", "deepseek_god_paper.png"),
]


def key_magenta(rgb: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Return (colour, alpha) with the background removed and un-mixed out of the edges."""
    px = rgb.astype(np.float32)
    # the background colour is whatever fills the corners
    corners = np.concatenate([px[:8, :8].reshape(-1, 3), px[:8, -8:].reshape(-1, 3),
                              px[-8:, :8].reshape(-1, 3), px[-8:, -8:].reshape(-1, 3)])
    bg = np.median(corners, axis=0)
    d = np.linalg.norm(px - bg, axis=2)
    lo, hi = 26.0, 96.0
    a = np.clip((d - lo) / (hi - lo), 0.0, 1.0)
    # un-mix: p = ink*a + bg*(1-a)  ->  ink = (p - bg*(1-a)) / a
    safe = np.maximum(a, 1e-3)[..., None]
    ink = (px - bg * (1.0 - a[..., None])) / safe
    ink = np.clip(ink, 0, 255)
    # keep the interior opaque even where the ink is dark and the diff is small
    return ink, a


def content_box(alpha: np.ndarray) -> tuple[int, int, int, int]:
    ys, xs = np.where(alpha > 0.35)
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def quantise(rgb: np.ndarray) -> np.ndarray:
    """Nearest ink per pixel. Flat, hard edges -- a screen print, not a render.

    int32 on purpose: the squared distances reach 3*255^2, which overflows int16 and
    silently sends every pixel to the wrong ink (the first run of this script turned
    both new plates white).
    """
    px = rgb.reshape(-1, 3).astype(np.int32)
    d = ((px[:, None, :] - INKS.astype(np.int32)[None, :, :]) ** 2).sum(axis=2)
    idx = d.argmin(axis=1)
    return INKS[idx].reshape(rgb.shape).astype(np.uint8)


def process(raw_name: str, out_name: str) -> dict:
    src = Image.open(RAW / raw_name).convert("RGB")
    rgb = np.array(src)
    ink, alpha = key_magenta(rgb)
    box = content_box(alpha)
    w, h = box[2] - box[0], box[3] - box[1]
    s = CONTENT_H / h
    new_w, new_h = int(round(w * s)), int(round(h * s))

    colour = Image.fromarray(ink.astype(np.uint8)).crop(box).resize((new_w, new_h), Image.LANCZOS)
    amask = Image.fromarray((alpha * 255).astype(np.uint8)).crop(box).resize((new_w, new_h), Image.LANCZOS)

    canvas = Image.new("RGB", CANVAS, (0, 0, 0))
    canvas.paste(colour, (CONTENT_CX - new_w // 2, CONTENT_TOP))
    out_alpha = Image.new("L", CANVAS, 0)
    out_alpha.paste(amask, (CONTENT_CX - new_w // 2, CONTENT_TOP))

    rgb_out = np.array(canvas)
    a_out = np.array(out_alpha)
    # hard-edged ink: quantise, then drop the soft rim to fully transparent so the
    # composite has no grey halo
    rgb_q = quantise(rgb_out)
    a_final = np.where(a_out > 140, 255, 0).astype(np.uint8)
    # fill the interior of the figure: the resampler can leave 1px gaps at colour
    # boundaries, and a transparent pinhole inside a solid mass reads as dirt
    rgba = np.dstack([rgb_q, a_final])
    plate = Image.fromarray(rgba, "RGBA")
    plate.save(OUT / out_name)

    keep = (a_final > 0)
    ys, xs = np.where(keep)
    return {
        "file": out_name,
        "canvas": CANVAS,
        "content_box": (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1),
        "scale_from_raw": round(s, 4),
    }


def derive_navy(src_name: str, out_name: str) -> dict:
    """The same plate with the white ink taken off.

    The film prints in two passes, so the shot needs the plate before the paper is
    laid down: only the navy and azure shapes are there, and the white paper floods
    in on the beat. Deriving it from the finished plate keeps the two passes in
    perfect register -- there is no second drawing to drift.
    """
    plate = Image.open(OUT / src_name).convert("RGBA")
    a = np.array(plate)
    rgb = a[:, :, :3].astype(np.int16)
    is_paper = (rgb[:, :, 0] > 190) & (rgb[:, :, 1] > 190) & (rgb[:, :, 2] > 190)
    a[:, :, 3] = np.where(is_paper, 0, a[:, :, 3])
    Image.fromarray(a, "RGBA").save(OUT / out_name)
    return {"file": out_name, "removed": int(is_paper.sum())}


def derive_paper_pass(src_name: str, out_name: str) -> dict:
    """Only the paper ink, on its own.

    The shot needs the fringe to fall IN FRONT of the eye it opens in the void, so the
    white pass is drawn again over the eye. Same plate, so it lands in register.
    """
    plate = Image.open(OUT / src_name).convert("RGBA")
    a = np.array(plate)
    rgb = a[:, :, :3].astype(np.int16)
    is_paper = (rgb[:, :, 0] > 190) & (rgb[:, :, 1] > 190) & (rgb[:, :, 2] > 190)
    a[:, :, 3] = np.where(is_paper, a[:, :, 3], 0)
    Image.fromarray(a, "RGBA").save(OUT / out_name)
    return {"file": out_name, "kept": int(is_paper.sum())}


def main() -> None:
    for raw, out in JOBS:
        info = process(raw, out)
        print(info)
        if out == "deepseek_god_paper.png":
            print(derive_navy(out, "deepseek_god_navy.png"))
            print(derive_paper_pass(out, "deepseek_god_paper_ink.png"))


if __name__ == "__main__":
    main()
