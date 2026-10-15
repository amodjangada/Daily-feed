#!/usr/bin/env python3
"""Build My Daily Feed with only Python standard libraries."""
from __future__ import annotations
import html
import hashlib
import json
import pathlib
import re
import shutil
import struct
import zipfile
import zlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "_site"
LEGACY = ROOT / "_legacy_unpack"
TITLE_RE = re.compile(r"<title[^>]*>(.*?)</title>", re.IGNORECASE | re.DOTALL)
DATE_RE = re.compile(r"20\d{2}[-_./]\d{1,2}[-_./]\d{1,2}")
CATEGORY = [
    ("ai-technology", "AI & Technology"),
    ("philosophy-psychology", "Philosophy & Psychology"),
    ("economics-policy", "Economics & Public Policy"),
    ("sustainable-business", "Sustainable Business"),
    ("rotating-field", "Rotating Field"),
]

def legacy_files() -> None:
    archive = ROOT / "my-daily-feed-site.zip"
    if not archive.exists():
        return
    with zipfile.ZipFile(archive) as zf:
        for item in zf.infolist():
            rel = pathlib.PurePosixPath(item.filename)
            if (item.is_dir() or rel.is_absolute() or ".." in rel.parts
                    or "__MACOSX" in rel.parts or not rel.parts):
                continue
            dest = LEGACY.joinpath(*rel.parts)
            dest.parent.mkdir(parents=True, exist_ok=True)
            with zf.open(item) as source, dest.open("wb") as target:
                shutil.copyfileobj(source, target)
    indexes = list(LEGACY.rglob("index.html"))
    source = min((p.parent for p in indexes), key=lambda p: len(p.parts)) if indexes else LEGACY
    shutil.copytree(source, OUT, dirs_exist_ok=True)

def overlay() -> None:
    for name in ("assets", "reports"):
        source = ROOT / name
        if source.is_dir():
            shutil.copytree(source, OUT / name, dirs_exist_ok=True)
    for name in ("index.html", "service-worker.js", "manifest.webmanifest"):
        shutil.copy2(ROOT / name, OUT / name)

def make_png(name: str, size: int) -> None:
    """Draw a legible DF mark without Pillow or external programs."""
    D = ["11110", "10001", "10001", "10001", "10001", "10001", "11110"]
    F = ["11111", "10000", "10000", "11110", "10000", "10000", "10000"]
    glyph = [D[row] + "00" + F[row] for row in range(7)]
    cell = size / 17
    width = 12 * cell
    left, top = (size - width) / 2, (size - 7 * cell) / 2
    data = bytearray()
    for y in range(size):
        data.append(0)
        for x in range(size):
            xi, yi = int((x - left) // cell), int((y - top) // cell)
            on = 0 <= xi < 12 and 0 <= yi < 7 and glyph[yi][xi] == "1"
            data.extend((243, 230, 214) if on else (133, 65, 46))
    def chunk(typ: bytes, value: bytes) -> bytes:
        return struct.pack(">I", len(value)) + typ + value + struct.pack(">I", zlib.crc32(typ + value))
    image = b"\x89PNG\r\n\x1a\n"
    image += chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0))
    image += chunk(b"IDAT", zlib.compress(bytes(data), 9))
    image += chunk(b"IEND", b"")
    (OUT / "assets" / name).write_bytes(image)

def inject_reader(path: pathlib.Path) -> None:
    text = path.read_text(encoding="utf-8", errors="replace")
    if "data-mdf-reader" in text:
        return
    prefix = "../" * (len(path.relative_to(OUT).parts) - 1)
    inject = (
        f'<link rel="manifest" href="{prefix}manifest.webmanifest">\n'
        f'<link rel="stylesheet" href="{prefix}assets/site.css">\n'
        f'<link rel="stylesheet" href="{prefix}assets/reader.css">\n'
        f'<script defer data-mdf-reader src="{prefix}assets/reader.js"></script>\n'
    )
    if re.search(r"</head\s*>", text, re.IGNORECASE):
        text = re.sub(r"</head\s*>", lambda _: inject + "</head>", text, count=1, flags=re.IGNORECASE)
    else:
        text = inject + text
    path.write_text(text, encoding="utf-8")

def build() -> list[dict]:
    if OUT.exists():
        shutil.rmtree(OUT)
    if LEGACY.exists():
        shutil.rmtree(LEGACY)
    OUT.mkdir(parents=True)
    legacy_files()
    # Remove the obsolete worker bundled in older site ZIPs.
    (OUT / 'sw.js').unlink(missing_ok=True)
    overlay()
    make_png("apple-touch-icon.png", 180)
    make_png("icon-192.png", 192)
    make_png("icon-512.png", 512)
    docs = []
    for path in sorted(OUT.rglob("*.html")):
        rel = path.relative_to(OUT).as_posix()
        if rel == "index.html" or rel.startswith(("assets/", "scripts/")):
            continue
        original = path.read_text(encoding="utf-8", errors="replace")
        title_match = TITLE_RE.search(original)
        title = html.unescape(re.sub(r"<[^>]*>", "", title_match.group(1))).strip() if title_match else path.stem.replace("-", " ").title()
        title = title or path.stem
        date_match = DATE_RE.search(rel) or DATE_RE.search(title)
        date = date_match.group(0).replace("/", "-").replace("_", "-").replace(".", "-") if date_match else ""
        group = next((name for slug, name in CATEGORY if slug in rel.lower()), "Other")
        inject_reader(path)
        docs.append(dict(title=title, path=rel, date=date, category=group))
    docs.sort(key=lambda d: (d["date"], d["path"]), reverse=True)
    (OUT / "feeds.json").write_text(json.dumps(docs, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    # Fingerprint the site shell to update installed Home Screen apps.
    fingerprint = hashlib.sha256()
    for name in ("index.html", "assets/site.css", "assets/reader.css",
                 "assets/app.js", "assets/reader.js", "service-worker.js",
                 "manifest.webmanifest", "assets/landscape.svg"):
        fingerprint.update((OUT / name).read_bytes())
    version = fingerprint.hexdigest()[:12]
    homepage = OUT / "index.html"
    markup = homepage.read_text(encoding="utf-8")
    markup = markup.replace("</head>", f'<meta name="mdf-build" content="{version}"></head>', 1)
    homepage.write_text(markup, encoding="utf-8")
    (OUT / "version.json").write_text(json.dumps({"version": version}) + "\n", encoding="utf-8")
    (OUT / ".nojekyll").touch()
    print(f"Site: {OUT}")
    print(f"Published reports: {len(docs)}")
    for item in docs:
        print("  " + item["path"])
    return docs

if __name__ == "__main__":
    build()
