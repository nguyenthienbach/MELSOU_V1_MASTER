# Product specification

Melsou is a Vietnamese D2C e-commerce and web-to-print studio for premium 180° seamless layflat photo albums. Brand line: “Gói tâm tình trong dáng hình thanh âm.” The product is template-first so customers focus on memories, not professional layout.

## V1 scope

- Marketing site: About, values, three packages, template library, FAQ, Studio, review/price, tracking.
- Studio four conceptual steps: configuration/template; interior content; covers; options/preview. Voice customers choose private web recording or recording at home after delivery.
- Customer: guest design, username/password checkout login, optional linked email/Google identity, projects, order history, addresses, trash, low-information tracking.
- Owner: operational dashboard, orders, payment mismatches, prepress, production, shipping, pricing, templates, settings.

## Product configuration

Supported album sizes: `A5_PORTRAIT` (+0), `SQUARE` (+20,000), `A6` (-20,000), `A5_LANDSCAPE` (+10,000). Page counts: 12 (+0), 16 (+30,000), 24 (+60,000). The physical dimensions and all print geometry remain `TBD_PRINT_VENDOR`.

Packages: Basic / `MELODY` (119,000, album/message/Spotify QR), Premium / `VOICE` (159,000, album/message/physical voice module), `SIGNATURE` (199,000, both plus gift box/sticker). The physical module’s recording duration/hardware values are product configuration and must not imply an unsupported “300s ISD1820” capability. Customers either upload a finalized private Studio recording for Melsou to load onto the module or select `RECORD_AT_HOME`.

`Twin` creates an identical second copy priced at 75% of the first configured copy; it may have a separate delivery address and therefore a separate 30,000 shipment fee. The price calculator produces a versioned quote and the order captures a snapshot.

## Explicit exclusions

No freeform canvas; email-required registration or email OTP as primary auth; staff roles; online voice merge; carrier API; paid queue/SaaS requirement; template-builder CMS; customer prepress approval; Google Drive/Sheets as transactional database.
