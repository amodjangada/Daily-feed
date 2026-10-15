# My Daily Feed — Mobile-First Implementation Plan

Date: 15 October 2026. Target: iPhone Home Screen web app on GitHub Pages.

## Goal
Keep daily reading fast and clear on a phone, with no need to reinstall after new reports publish. Preserve original article text and sources.

## Step 1 — Publishing and article inventory [COMPLETE]
- Preserve reports from the repository and legacy ZIP.
- Generate feeds.json by scanning published HTML, with repaired dates.
- Test article count, paths, reader injection, icons and script syntax before deployment.
- Deploy using the existing GitHub Pages Actions environment.
Acceptance: Actions build and deploy succeed; every indexed report exists.

## Step 2 — Mobile feed and navigation [COMPLETE]
- One-column phone layout with restrained colors and 44 px minimum tap targets.
- Today, Archive and Saved navigation fixed above the iPhone safe area.
- One featured report and one current report per subject on Today; all versions remain in Archive.
- Search and subject filter.
Acceptance: articles can be found without horizontal scrolling and visited from each section.

## Step 3 — Reading screen [COMPLETE]
- Shared styles injected at build time into all published article pages.
- Consistent back button, fixed progress indicator, saved control and size settings.
- Light, dark and system themes.
- Reading place stored on this device; larger text does not clip tables.
Acceptance: legacy HTML content and citation links remain unmodified.

## Step 4 — Home Screen use and offline [COMPLETE IN CODE]
- Web app manifest and generated touch icons.
- Network-first requests: updated index and articles are fetched when online.
- App refreshes when opened, resumed, reconnected, and every minute while active.
- Cache only essential app files plus specifically saved articles.
Acceptance: changes published to GitHub Pages become visible without reinstalling.

## Step 5 — Accessibility and verification [AUTOMATED CHECKS COMPLETE; PHONE CHECKS PENDING]
- Visible focus states, semantic headings, text labels and skip link.
- Reduced-motion support, 44 px controls, good text contrast.
- Python build and contract tests plus JavaScript syntax checks in GitHub Actions.
- Still verify with actual iPhone Safari and installed Home Screen app:
  (1) back navigation from an article returns to the prior feed position;
  (2) dynamic type and VoiceOver labels;
  (3) offline saved report behavior in airplane mode;
  (4) latest edition appears after a fresh deploy;
  (5) small and large iPhone layouts, both appearances.
Acceptance: pass these on-device checks. They cannot be confirmed by GitHub Actions.

## Maintenance
1. Commit a full standalone HTML report to reports/YYYY-MM-DD/ .
2. GitHub Actions builds and checks the complete site automatically.
3. The installed app checks for new feed.json content when online. No new install is needed.
4. If deployment fails, inspect the failed step under Actions before changing the site.
5. Saved articles and reading place are local to the current phone and may be cleared by the browser.

Reference design report: My Daily Feed — Mobile-First Design Research (15 October 2026).
