"""Package the game for people to download: one self-contained page plus a guide, zipped for Mac and for Windows.

    python3 tools/build_dist.py            -> dist/Secret-Pet-Mac.zip, dist/Secret-Pet-Windows.zip (and the guides beside them)

The page has every script, picture and the Fredoka font inside it, so it opens with a double-click
(no server, no internet). Pictures have to be inside the page: a page opened from a file may not read
the pixels of separate image files, and the game does that to build the heroes' walking frames.
"""
import base64
import re
import shutil
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TOOLS = ROOT / "tools"
OUT = ROOT / "dist"
GAME = "Play Secret Pet.html"
FOLDER = "Secret Pet"
SYSTEMS = ["Mac", "Windows"]


def data_url(path, kind):
    return f"data:{kind};base64," + base64.b64encode(path.read_bytes()).decode()


def build_page():
    html = (ROOT / "index.html").read_text()
    # the font, from inside the page instead of Google Fonts
    font = data_url(TOOLS / "fonts" / "fredoka-latin.woff2", "font/woff2")
    face = f"@font-face {{ font-family: 'Fredoka'; font-style: normal; font-weight: 300 700; font-display: block; src: url({font}) format('woff2'); }}\n"
    html = re.sub(r'\s*<link rel="preconnect"[^>]*>\s*<link href="https://fonts.googleapis.com[^>]*>', "", html)
    html = html.replace("<style>\n", "<style>\n" + face, 1)
    # every picture, by the same path the game asks for (js/core.js loadImages looks here first)
    pics = sorted((ROOT / "assets").rglob("*.png"))
    table = ",\n".join(f'"{p.relative_to(ROOT).as_posix()}":"{data_url(p, "image/png")}"' for p in pics)
    assets = f"<script>\nwindow.ASSET_DATA = {{\n{table}\n}};\n</script>"
    # the scripts, inlined in the same order
    def inline(m):
        src = (ROOT / m.group(1)).read_text()
        if "</script" in src.lower():
            sys.exit(f"{m.group(1)} contains </script, which would end the inlined script early")
        return f"<script>\n/* {m.group(1)} */\n{src}\n</script>"
    html, n = re.subn(r'<script src="([^"]+)"></script>', inline, html)
    if not n or "https://fonts" in html:
        sys.exit("index.html didn't look as expected: check the font link and script tags")
    html = html.replace("<script>\n/* js/core.js */", assets + "\n<script>\n/* js/core.js */", 1)
    return html, len(pics), n


def guide_for(system, shot):
    """tools/dist/guide.html has both computers' steps: keep this one's <!--mac--> or <!--windows--> parts, drop the other's"""
    text = (TOOLS / "dist" / "guide.html").read_text().replace("{{TITLE_SHOT}}", shot).replace("{{SYSTEM}}", system)
    for other in SYSTEMS:
        tag = other.lower()
        if other == system: text = re.sub(rf"[ \t]*<!--/?{tag}-->\n?", "", text)
        else: text = re.sub(rf"[ \t]*<!--{tag}-->.*?<!--/{tag}-->\n?", "", text, flags=re.S)
    if "<!--" in text or "{{" in text:
        sys.exit(f"the {system} guide still has an unmatched marker")
    return text


def main():
    page, pics, scripts = build_page()
    shutil.rmtree(OUT, ignore_errors=True)
    OUT.mkdir()
    (OUT / GAME).write_text(page)
    shot = data_url(TOOLS / "dist" / "title.jpg", "image/jpeg")
    for system in SYSTEMS:
        text = guide_for(system, shot)
        name = f"How to play ({system}).html"
        (OUT / name).write_text(text)  # also beside the zip, to read before downloading
        with zipfile.ZipFile(OUT / f"Secret-Pet-{system}.zip", "w", zipfile.ZIP_DEFLATED) as z:
            z.writestr(f"{FOLDER}/{GAME}", page)
            z.writestr(f"{FOLDER}/{name}", text)
            z.write(TOOLS / "fonts" / "OFL.txt", f"{FOLDER}/font licence (Fredoka).txt")
    print(f"{GAME}: {len(page) / 1e6:.1f} MB, {scripts} scripts, {pics} pictures")
    for z in sorted(OUT.glob("*.zip")):
        print(f"{z.name}: {z.stat().st_size / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
