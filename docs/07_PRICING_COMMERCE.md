# Pricing, quotes and commerce

All price arithmetic occurs server-side in integer VND; client values are display-only. Pricing is config data with an immutable `pricing_version` captured by a quote and order. Never recalculate an existing order from current prices.

| Item | Locked V1 value |
|---|---:|
| Melody | 159,000 VND |
| Voice | 219,000 VND |
| Signature | 259,000 VND |
| A5 portrait | +0 |
| Square | +20,000 |
| A6 | -20,000 |
| A5 landscape | +10,000 |
| 12 / 16 / 24 pages | +0 / +30,000 / +60,000 |
| Twin second identical copy | 75% of configured first-copy amount |
| Shipping | 30,000 VND per shipment |

The first configured copy includes its selected package, size/page modifiers and any future explicitly-approved options. Twin copy uses exactly 75% of that configured copy amount, excluding shipment. A Twin order has one canonical design/order snapshot and up to two independently addressed shipments. Total = first copy + optional second-copy charge + 30,000 × required shipment count.

Create a short-lived quote after preflight succeeds. `Continue to order` authenticates, captures delivery information, creates an immutable production snapshot and `AWAITING_PAYMENT` order/payment expectation. Order codes follow `MEL` + package letter (`M/V/S`) + `YYMM` + sequence, e.g. `MELS-2608-001`; enforce uniqueness transactionally.

Preflight categories: `PASS`, `WARNING`, `BLOCKING_ERROR`. Required slots, missing assets, invalid QR, text overflow, unsafe critical content and unprintably low asset quality block; warnings require explicit customer acknowledgement and are captured in snapshot/audit history.
