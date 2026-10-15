# Terracotta & Linen — Visual Design System

Status: Implemented in the source files; phone testing is still required.

## Color system
| Token | Light | Role |
| --- | --- | --- |
| Background | #F3E6D6 | Warm linen article/page paper |
| Card | #E8D8C2 | Oat surfaces |
| Raised surface | #F0E1CF | Toolbar and featured articles |
| Main text | #382E27 | Dark earth brown |
| Secondary text | #685849 | Accessible warm brown |
| Accent | #85412E | Terracotta links, progress, and highlights |
| Secondary accent | #3D5547 | Woodland green for diagrams and labels |
| Sage | #BAC1A3 | Soft fills for active navigation |
| Dividers | #CCB8A1 | Quiet visual separators |

The previous pure-white card surfaces have been removed. The optional night palette uses warm charcoal, not blue-black.

## Typography
Georgia is the primary editorial typeface for articles and article titles, with system sans-serif for navigation, settings, charts, and diagrams. Article body text starts at 19px with 1.67 line spacing. Readers can adjust article text from 16px to 24px.

## Visual assets
- A simple landscape SVG appears above the featured item. It is decorative, carries no facts, and is hidden from assistive technology.
- The Home Screen logo uses terracotta, woodland and sage.
- Do not insert decorative graphics in the middle of article explanations.
- Factual imagery requires a caption, source, rights information and alternative text.

## Charts and diagrams
- Use terracotta for emphasis and woodland green for measurements and bar fills.
- Use labels, units, source dates and explanatory text in addition to color.
- Keep diagram steps in reading order; avoid graphics that require horizontal pinch zoom.
- Keep tables scrollable at small widths and preserve real cell text.
- The new theme applies to existing HTML reports without replacing their content.

## Accessibility and maintenance
- Contrast checks run in the publishing tests.
- Interactive controls retain a minimum 44px target.
- Text resizing, VoiceOver, built-in iPhone text sizes, offline reading and installed-app updates still require direct device tests.
- A new release hash is written into version.json on every app shell change.
- The Home Screen app compares that hash when returning to the foreground. It should not need to be reinstalled for ordinary updates.
- Avoid a claim that the reported installed-app issue is fully resolved until two successive iPhone updates succeed.

