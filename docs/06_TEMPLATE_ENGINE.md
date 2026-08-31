# Template engine

Template definitions reside in this repository under `templates/<slug>/template.json`. Each is immutable by `(template_id, version)` and declares metadata, compatible album configurations, spreads/covers, normalized geometry, required/optional slots, allowed content, constraints, decorative elements, and preflight semantics. Do not hard-code layouts in UI components.

Locked V1 template library:

1. `first-love` — anniversary/couple, white space and handwritten notes.
2. `our-graduation` — graduation, polaroid/tape/captions.
3. `besties-archive` — playful scrapbook, collage/stickers.
4. `somewhere-together` — travel, panorama/map/date accents.
5. `birthday-letters` — warm message-led birthday.
6. `quiet-moments` — minimal, typography-led premium.
7. `memory-box` — nostalgic paper/film/date texture.
8. `melsou-editorial` — modern photobook/editorial.

Discovery filters use `style` and `occasion`; eligibility is strictly `album_size + page_count`. New template versions are added, never overwrite a referenced version. Owner V1 can enable/disable and preview a template but cannot build arbitrary geometry in the dashboard.

Required slots must be fulfilled before a blocking preflight passes. QR uses a dedicated controlled back-cover slot, never a freeform customer placement. Slot constraints must make text overflow, unauthorized asset types and unsafe placement detectable.
