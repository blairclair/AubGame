"""Cut each hero's poses and faces out of their sprite sheet (tools/sheets/<id>.png) into assets/heroes/<id>/.

Usage: python tools/extract_heroes.py tools/sheets assets/heroes [hero ...]
Requires: pillow, numpy, scipy, rembg[cpu]

Every pose is scaled by the same factor, chosen so the standing pose (idle_front) is FRONT_H px tall,
so all heroes stand the same height in every game."""
import sys
from pathlib import Path
import numpy as np
from PIL import Image
from rembg import new_session, remove
from scipy import ndimage

FRONT_H = 226
PAD_W = 97
FACE = (106, 118)
# box: (l, t, r, b) on the sheet, plus an optional 5th number for a source drawn at another scale than idle_front;
# pose crops get their background removed, faces are kept as-is ("face_cut": faces lifted onto a plain backdrop,
# "white": a white-background sheet whose pale halo is trimmed)
HEROES = {
  "aubrey": {
    "poses": {
      "idle_front": (8, 0, 98, 228), "idle_back": (286, 0, 374, 228),
      "run1": (192, 0, 290, 228), "run2": (462, 0, 568, 228), "run3": (668, 0, 772, 228),
      "run4": (462, 0, 568, 228), "run5": (192, 0, 290, 228),
      "jump": (768, 0, 882, 222), "cast": (668, 0, 772, 228), "twirl": (572, 0, 672, 228),
      "crouch": (872, 85, 968, 226),
    },
    "faces": {  # cells are 110 x 112: col x 1200/1313/1425, row y 0/115/230/345/457/572
      "happy": (1203, 0, 1307, 112), "excited": (1316, 0, 1420, 112), "laughing": (1428, 0, 1532, 112),
      "neutral": (1203, 572, 1307, 684), "determined": (1316, 457, 1420, 569), "focused": (1316, 572, 1420, 684),
      "surprised": (1316, 230, 1420, 342), "serious": (1428, 572, 1532, 684), "thinking": (1428, 457, 1532, 569),
      "sad": (1203, 572, 1307, 684), "angry": (1203, 457, 1307, 569), "silly": (1316, 115, 1420, 227), "winky": (1428, 115, 1532, 227),
    },
  },
  "charlotte": {
    "white": True,
    "poses": {
      "idle_front": (0, 598, 88, 834),
      "idle_back": (218, 846, 284, 1020, 1.36),
      "run1": (156, 846, 210, 1020, 1.36),
      "run2": (360, 846, 414, 1020, 1.36),
      "run3": (156, 846, 210, 1020, 1.36),
      "run4": (360, 846, 414, 1020, 1.36),
      "run5": (82, 846, 150, 1020, 1.36),
      "jump": (82, 846, 150, 1020, 1.36),
      "cast": (0, 598, 88, 834),
      "twirl": (82, 846, 150, 1020, 1.36),
      "crouch": (836, 630, 985, 818, 0.72),
    },
    "faces": {
      "happy": (996, 45, 1122, 185),
      "neutral": (1131, 45, 1257, 185),
      "laughing": (1266, 45, 1392, 185),
      "silly": (1401, 45, 1527, 185),
      "excited": (996, 225, 1122, 365),
      "surprised": (1131, 225, 1257, 365),
      "sad": (1266, 225, 1392, 365),
      "winky": (1401, 225, 1527, 365),
      "focused": (1131, 402, 1257, 542),
      "thinking": (1266, 402, 1392, 542),
      "determined": (1401, 402, 1527, 542),
      "serious": (1401, 402, 1527, 542),
      "angry": (1266, 225, 1392, 365),
    },
  },
  "ashton": {
    "face_cut": True,
    "poses": {
      "idle_front": (255, 0, 347, 268),
      "idle_back": (452, 0, 552, 268),
      "run1": (562, 0, 670, 268),
      "run2": (692, 0, 818, 268),
      "run3": (928, 0, 1052, 268),
      "run4": (692, 0, 818, 268),
      "run5": (562, 0, 670, 268),
      "jump": (1064, 0, 1226, 268),
      "cast": (0, 0, 154, 268),
      "twirl": (156, 0, 252, 268),
      "crouch": (1236, 85, 1334, 268),
    },
    "faces": {
      "happy": (264, 6, 336, 86),
      "excited": (44, 6, 116, 86),
      "laughing": (1114, 11, 1186, 91),
      "neutral": (32, 274, 104, 354),
      "determined": (247, 274, 319, 354),
      "focused": (1452, 6, 1524, 86),
      "surprised": (832, 6, 904, 86),
      "serious": (247, 274, 319, 354),
      "thinking": (169, 6, 241, 86),
      "sad": (32, 274, 104, 354),
      "angry": (247, 274, 319, 354),
      "silly": (1242, 91, 1314, 171),
      "winky": (169, 6, 241, 86),
    },
  },
  "levi": {
    "white": True,
    "poses": {
      "idle_front": (5, 258, 102, 548),
      "idle_back": (155, 258, 222, 548),
      "run1": (98, 258, 158, 548),
      "run2": (1404, 578, 1534, 862),
      "run3": (98, 258, 158, 548),
      "run4": (220, 258, 302, 548),
      "run5": (1404, 578, 1534, 862),
      "jump": (3, 578, 147, 862),
      "cast": (260, 578, 458, 862),
      "twirl": (220, 258, 302, 548),
      "crouch": (260, 578, 458, 862, 0.75),
    },
    "faces": {
      "happy": (147, 45, 282, 195),
      "excited": (424, 45, 559, 195),
      "laughing": (1390, 45, 1525, 195),
      "neutral": (562, 45, 697, 195),
      "determined": (701, 45, 836, 195),
      "focused": (285, 45, 420, 195),
      "surprised": (8, 45, 143, 195),
      "serious": (1252, 45, 1387, 195),
      "thinking": (976, 45, 1111, 195),
      "sad": (1114, 45, 1249, 195),
      "angry": (701, 45, 836, 195),
      "silly": (838, 45, 973, 195),
      "winky": (8, 45, 143, 195),
    },
  },
}


def largest_blob(alpha):
    lab, n = ndimage.label(alpha > 40)
    if n <= 1: return alpha
    sizes = ndimage.sum(np.ones_like(alpha), lab, range(1, n + 1))
    keep = ndimage.binary_dilation(lab == 1 + int(np.argmax(sizes)), iterations=2)
    return np.where(keep, alpha, 0).astype(np.uint8)


def defringe(a):
    """white-background sheets leave a pale halo: drop near-white pixels within 3px of the edge"""
    solid = a[..., 3] > 20
    rim = solid & ~ndimage.binary_erosion(solid, iterations=3)
    rgb = a[..., :3].astype(int)
    pale = (rgb.min(axis=2) > 215) & (rgb.max(axis=2) - rgb.min(axis=2) < 30)
    a[rim & pale, 3] = 0
    a[..., 3] = largest_blob(a[..., 3])
    # and pull the whole edge in by a pixel, softly, so no light outline is left round the hair
    inner = ndimage.binary_erosion(a[..., 3] > 20, iterations=1)
    a[..., 3] = (a[..., 3] * (0.35 + 0.65 * ndimage.uniform_filter(inner.astype(float), 3))).astype(np.uint8)
    return a


def drop_floor(a):
    """a sitting pose can keep a strip of white floor under it: drop pale patches reaching the bottom few rows"""
    solid = a[..., 3] > 20
    rows = np.nonzero(solid.any(axis=1))[0]
    if not len(rows): return a
    rgb = a[..., :3].astype(int)
    pale = solid & (rgb.min(axis=2) > 200) & (rgb.max(axis=2) - rgb.min(axis=2) < 30)
    lab, n = ndimage.label(pale)
    floor = set(lab[rows[-1] - 6:rows[-1] + 1].ravel()) - {0}
    for k in floor: a[lab == k, 3] = 0
    return a


def cut(sheet, box, sess, white=False, sitting=False):
    img = remove(sheet.crop(box), session=sess, post_process_mask=True)
    a = np.array(img); a[..., 3] = largest_blob(a[..., 3])
    if white: a = defringe(a)
    if white and sitting: a = drop_floor(a)
    img = Image.fromarray(a)
    return img.crop(img.getchannel("A").point(lambda v: 255 if v > 20 else 0).getbbox())


def main(sheets, out, names):
    sess = new_session("isnet-general-use")
    for name in names:
        h = HEROES[name]
        sheet = Image.open(Path(sheets) / f"{name}.png").convert("RGBA")
        d = Path(out) / name; (d / "sprites").mkdir(parents=True, exist_ok=True); (d / "faces").mkdir(parents=True, exist_ok=True)
        cuts = {k: cut(sheet, tuple(b[:4]), sess, h.get("white"), k == "crouch") for k, b in h["poses"].items()}
        k0 = FRONT_H / cuts["idle_front"].height
        for k, im in cuts.items():
            b = h["poses"][k]; k1 = k0 * (b[4] if len(b) > 4 else 1)  # a 5th number: that source's scale vs idle_front's
            im = im.resize((max(1, round(im.width * k1)), max(1, round(im.height * k1))), Image.LANCZOS)
            if k == "idle_front" and im.width < PAD_W:  # every hero's standing photo is 97 wide, head centred, like Aubrey's first one
                a = np.array(im)[: im.height // 5, :, 3] > 60
                cx = int(np.mean(np.nonzero(a)[1])) if a.any() else im.width // 2
                pad = Image.new("RGBA", (PAD_W, im.height)); pad.paste(im, (PAD_W // 2 - cx, 0)); im = pad
            im.save(d / "sprites" / f"{k}.png", optimize=True)
            print(name, k, im.size)
        for k, b in h["faces"].items():
            im = sheet.crop(tuple(b))
            if h.get("face_cut"):  # a busy backdrop: lift the face out onto a soft plain one
                fg = remove(im, session=sess, post_process_mask=True)
                bg = Image.new("RGBA", im.size)
                for y in range(im.height):
                    f = y / im.height; bg.paste((int(214 - 30 * f), int(226 - 30 * f), int(238 - 24 * f), 255), (0, y, im.width, y + 1))
                bg.alpha_composite(fg); im = bg
            im = im.convert("RGB").resize(FACE, Image.LANCZOS)
            im.save(d / "faces" / f"face_{k}.png", optimize=True)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], sys.argv[3:] or list(HEROES))
