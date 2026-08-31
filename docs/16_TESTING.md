# Testing strategy

Required gates for each phase: formatter/lint, typecheck, unit tests for changed pure logic, integration tests for database/service boundaries, end-to-end critical paths, build, and manual accessibility/responsive checks for changed screens. No external production keys in automated tests.

## Fixtures and test adapters

Use `tests/fixtures/` only synthetic content. Provide fakes for R2, Drive, Sheets, SePay and renderer. Contract-test adapters against sandbox/test credentials only when owner supplies them. Assert no secret/PII leaks in logs/fixture snapshots.

## Mandatory suites

- Pricing table/property tests: package/modifiers, Twin 75%, shipment count, immutable order snapshots and VND integer arithmetic.
- Project/document tests: schema validation, expected revision conflicts, checkpoints cap, template remap/unplaced content.
- Auth/RLS integration: guest isolation, all-draft idempotent claim, customer boundary, owner-only actions, Duo scope/max two.
- Upload security: magic bytes mismatch, extension spoof, SVG/archive/HTML rejection, quotas, EXIF stripping, signed URL expiry/authorization.
- Payment: signature verification, duplicate/order-independent webhooks, mismatch, expiry, concurrent delivery and render-job exactly-once enqueue.
- Render/preflight: missing `TBD_PRINT_VENDOR` blocks approval, assets/slots/QR/safe zone checks, pinned template reproducibility and rerender invariance.
- Lifecycle/jobs: 14-day guest expiry, 30-day trash, safe orphan cleanup, Drive/Sheets failure/retry, archive checksum-before-delete.
- E2E: guest Studio → preflight/quote → Google callback mock → checkout → SePay verified mock → render → owner approval → two shipments → completion; plus failure/retry paths.

Run load/concurrency probes on autosave, same-project revision writes and webhook duplicate delivery before launch. Accessibility covers keyboard interactions, visible focus, form error semantics and reduced-motion behavior. Never pass a test by disabling security or production gates.
