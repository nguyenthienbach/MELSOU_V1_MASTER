# Owner dashboard and fulfilment

Owner dashboard is an operations surface, not an analytics experiment. Routes under `/dashboard/*` require server-enforced authenticated `OWNER` access.

## V1 sections

- Overview: today’s orders/revenue, payment states, prepress/production/shipping queues, mismatches and actionable work.
- Orders/detail: customer/contact only as authorized; configuration, quote snapshot, payment, snapshot/artifacts, shipments and timeline.
- Payment mismatch: expected/received/reference, manual resolution/refund note, audit history.
- Prepress: preview/artifacts/preflight, rerender, owner-only approve production.
- Production: simple queues—waiting, active, ready to ship.
- Shipping: carrier name, tracking code/link, sent date; no carrier API. Each Twin shipment tracks independently.
- Pricing/templates/settings: versioned prices/enable-state and non-secret operational settings. Secrets show only connection status, never their values.

## State policy

Owner actions use the transition service and append `audit_logs`: actor, action, resource, before/after, timestamp and note when consequential. `PREPRESS_REVIEW → PRODUCTION` requires explicit owner confirmation; production snapshot cannot be edited. Move `PRODUCTION → READY_TO_SHIP`, then shipment dispatch moves order to `SHIPPING`; complete only when all required shipments complete. Customer tracking without login requires order code plus phone verification and returns only status timeline, carrier and tracking—not address, email, price breakdown, files or design.
