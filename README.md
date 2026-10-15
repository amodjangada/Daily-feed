# My Daily Feed

Mobile-first reading app hosted by GitHub Pages.

## Publishing

Add individual HTML files to reports/YYYY-MM-DD/topic.html on main. The GitHub Actions workflow automatically builds and deploys the site. It scans all published reports to generate feeds.json. It preserves legacy reports from my-daily-feed-site.zip and overlays the current reports/ folder. Reader CSS and JS are added to the published copies of articles without changing their source files.

## Features

- Today, Archive and Saved views; search by topic or title.
- Light, dark and system color themes.
- Reading progress and adjustable 16–24 px article text.
- A dedicated offline cache for saved reports.
- A network-first Home Screen app that reloads the feed on open, return to foreground, reconnection and while active.
- Saved items and reading progress live only on this phone; they do not sync across devices.
- iOS may clear stored website data when storage is low.

## Tests

Run Python 3 scripts/build_site.py and then scripts/test_site.py. Use node --check to check assets/app.js, assets/reader.js and service-worker.js. These checks run automatically on every GitHub Pages deployment.

## Main files

index.html, assets/site.css, assets/app.js — homepage UI
assets/reader.css, assets/reader.js — consistent article UI
service-worker.js — update-aware offline support
manifest.webmanifest — Home Screen app metadata
scripts/build_site.py — archive builder
scripts/test_site.py — validation tests
.github/workflows/pages.yml — build, test and deploy

Existing installed Home Screen apps do not need to be installed again after each report update.