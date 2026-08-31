# Acceptance criteria

## Guest and Studio

- A fresh visitor creates/edits multiple drafts, sees autosave and quote with no login.
- Guest activity extends only its own 14-day expiry; valid same-browser recovery works.
- Google login at checkout claims all and only the guest session’s drafts idempotently.
- Studio keeps canonical normalized document, pinned template version and data-driven slots; mobile/desktop preview agrees semantically.
- Switching templates never discards customer content; surplus appears unplaced.
- Offline/reconnect cannot silently overwrite a newer revision; checkpoints cap at ten.

## Storage, print and Duo

- Private R2 rejects unauthorized access and signed URLs expire; unsupported/spoofed file types are rejected; previews lack EXIF geolocation.
- Limits enforce 40 assets/150 MB per draft.
- Preflight blocks required missing content, invalid QR, unsafe critical placement and profile incompleteness; warnings are captured.
- Production rendering is server-side from immutable snapshot/template/assets/profile. It cannot become production-approved without all `TBD_PRINT_VENDOR` values confirmed.
- Only owner can approve prepress. Rerender does not mutate snapshot.
- Duo admits no more than two, prevents same-slot collisions with expiring soft locks, and becomes read-only during lock/checkout.

## Commerce and operations

- Server quotes exact V1 prices: 159k/219k/259k; modifiers, Twin at 75%, and 30k per shipment; old orders retain price snapshots.
- SePay forged, duplicate, late and mismatched webhooks never create duplicate paid/render state; exact verified payment queues once.
- Twin shipment statuses are independent; order completes only after every required shipment.
- Customer tracking unauthenticated response reveals only safe status/carrier/tracking information.
- Drive/Sheets outages do not corrupt or block canonical checkout/order state; owner dashboard actions are audited.
