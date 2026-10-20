"""Cut Aubrey's sprites out of the sprite sheet and remove their backgrounds.

Usage: python tools/extract_sprites.py "Aubrey_sprites (1).png" assets
Requires: pillow, numpy, scipy, rembg[cpu]
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from rembg import new_session, remove
from scipy import ndimage

# name: (left, top, right, bottom, mode)
#   mode "body"  -> remove bg, keep the largest blob (drops neighbouring figures)
#   mode "item"  -> remove bg, keep every blob (bubbles, sparkles)
#   mode "face"  -> keep as-is (portraits are shown in a frame)
CROPS = {
    # pink dress
    "idle_front":   (8, 2, 128, 240, "body"),
    "idle_3q":      (140, 2, 252, 240, "body"),
    "idle_side":    (258, 2, 362, 240, "body"),
    "idle_back":    (376, 2, 484, 240, "body"),
    "idle_front2":  (498, 2, 612, 240, "body"),
    "walk_side":    (636, 2, 745, 240, "body"),
    "jump":         (745, 2, 920, 200, "body"),
    "run1":         (2, 228, 130, 445, "body"),
    "run2":         (128, 228, 262, 445, "body"),
    "run3":         (258, 228, 378, 445, "body"),
    "run4":         (376, 228, 522, 445, "body"),
    "run5":         (500, 228, 662, 445, "body"),
    "cast":         (668, 195, 900, 445, "body"),
    "wand1":        (5, 440, 190, 655, "body"),
    "crouch":       (585, 520, 705, 660, "body"),
    "twirl":        (700, 410, 945, 660, "body"),
    # faces (label strip trimmed off)
    "face_neutral":    (8, 666, 114, 784, "face"),
    "face_happy":      (120, 666, 226, 784, "face"),
    "face_excited":    (230, 666, 336, 784, "face"),
    "face_determined": (340, 666, 446, 784, "face"),
    "face_focused":    (452, 666, 558, 784, "face"),
    "face_surprised":  (566, 666, 672, 784, "face"),
    "face_laughing":   (678, 666, 784, 784, "face"),
    "face_serious":    (796, 666, 902, 784, "face"),
    "face_thinking":   (916, 666, 1022, 784, "face"),
    "face_sad":        (1040, 666, 1146, 784, "face"),
    "face_angry":      (1158, 666, 1264, 784, "face"),
    "face_silly":      (1280, 666, 1386, 784, "face"),
    "face_winky":      (1396, 666, 1502, 784, "face"),
    # props
    "item_book":       (682, 830, 765, 915, "item"),
    "item_flashlight": (478, 925, 578, 1020, "item"),
    "item_binoculars": (352, 915, 470, 1015, "item"),
    "item_bubbles":    (590, 915, 795, 1020, "item"),
    "item_plush":      (605, 820, 685, 910, "item"),
    "item_butterfly":  (498, 822, 592, 900, "item"),
    "item_tiara":      (215, 818, 295, 875, "item"),
    "item_backpack":   (225, 878, 325, 1018, "item"),
    "item_heartwand":  (72, 828, 135, 1015, "item"),
    "item_necklace":   (336, 836, 464, 910, "item"),
}

MAX_H = {"body": 260, "item": 96, "face": 128}


def largest_blob(alpha: np.ndarray) -> np.ndarray:
    labels, n = ndimage.label(alpha > 40)
    if n <= 1:
        return alpha
    sizes = ndimage.sum(np.ones_like(alpha), labels, range(1, n + 1))
    keep = 1 + int(np.argmax(sizes))
    mask = ndimage.binary_dilation(labels == keep, iterations=2)
    return np.where(mask, alpha, 0).astype(np.uint8)


def main(src: str, out: str) -> None:
    sheet = Image.open(src).convert("RGBA")
    out_dir = Path(out)
    for sub in ("sprites", "faces", "items"):
        (out_dir / sub).mkdir(parents=True, exist_ok=True)
    session = new_session("isnet-general-use")

    for name, (l, t, r, b, mode) in CROPS.items():
        img = sheet.crop((l, t, r, b))
        if mode != "face":
            img = remove(img, session=session, post_process_mask=True)
            arr = np.array(img)
            if mode == "body":
                arr[..., 3] = largest_blob(arr[..., 3])
            img = Image.fromarray(arr)
            bbox = img.getchannel("A").point(lambda a: 255 if a > 20 else 0).getbbox()
            if bbox:
                img = img.crop(bbox)
        if img.height > MAX_H[mode]:
            w = round(img.width * MAX_H[mode] / img.height)
            img = img.resize((w, MAX_H[mode]), Image.LANCZOS)
        sub = {"body": "sprites", "item": "items", "face": "faces"}[mode]
        img.save(out_dir / sub / f"{name}.png", optimize=True)
        print(f"{sub}/{name}.png {img.size}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
