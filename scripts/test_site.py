#!/usr/bin/env python3
"""Check the published archive before deploying."""
from __future__ import annotations
import json
import pathlib
import struct

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "_site"
errors = []
def check(ok, message):
    if not ok:
        errors.append(message)

check((OUT / "index.html").is_file(), "Homepage missing")
check((OUT / "feeds.json").is_file(), "Feed index missing")
check((OUT / "service-worker.js").is_file(), "Service worker missing")
check((OUT / "assets/app.js").is_file(), "App missing")
check((OUT / "assets/reader.js").is_file(), "Reader script missing")
check((OUT / "manifest.webmanifest").is_file(), "Manifest missing")
data = json.loads((OUT / "feeds.json").read_text(encoding="utf-8"))
check(isinstance(data, list) and len(data) >= 5, "Too few published reports")
paths = [entry["path"] for entry in data]
check(len(paths) == len(set(paths)), "Duplicate paths in feed index")
for entry in data:
    rel = pathlib.PurePosixPath(entry["path"])
    check(not rel.is_absolute() and ".." not in rel.parts, "Unsafe path")
    article = OUT.joinpath(*rel.parts)
    check(article.is_file(), "Missing report: " + entry["path"])
    if article.is_file():
        markup = article.read_text(encoding="utf-8")
        check(markup.count("data-mdf-reader") == 1, "Reader injection failed: " + entry["path"])
        check("assets/reader.css" in markup, "Reader stylesheet missing: " + entry["path"])
for name, expected in (("apple-touch-icon.png", 180), ("icon-192.png", 192), ("icon-512.png", 512)):
    data_png = (OUT / "assets" / name).read_bytes()
    check(data_png[:8] == b"\x89PNG\r\n\x1a\n", name + " is not a PNG")
    check(struct.unpack(">II", data_png[16:24]) == (expected, expected), name + " dimensions wrong")
manifest = json.loads((OUT / "manifest.webmanifest").read_text(encoding="utf-8"))
check(manifest.get("display") == "standalone", "Manifest not standalone")
check(any(item.get("sizes") == "180x180" for item in manifest.get("icons", [])), "Apple icon not declared")
workflow=(ROOT / ".github/workflows/pages.yml").read_text(encoding="utf-8")
check("python3 scripts/build_site.py" in workflow, "Build not called from workflow")
check("python3 scripts/test_site.py" in workflow, "Tests not called from workflow")
app=(OUT / "assets/app.js").read_text(encoding="utf-8")
check("refresh(true)" in app and "visibilitychange" in app, "Resume update checks missing")
sw=(OUT / "service-worker.js").read_text(encoding="utf-8")
check("'CACHE_SAVED'" in sw and "'REMOVE_SAVED'" in sw, "Offline save messages missing")
if errors:
    for problem in errors:
        print("FAIL:", problem)
    raise SystemExit(1)
print(f"PASS: {len(paths)} indexed reports, reader injection, icons, offline app and publishing checks")
