# Storage, privacy and lifecycle

## R2 hot storage

Use one or more private R2 buckets. Keys must be opaque, for example `projects/prj_<id>/assets/ast_<id>/original` and `.../preview`; never use names, phone numbers, addresses, email, tokens or raw filenames as path identity. Server authorizes and issues least-privilege short-lived signed upload/download URLs. Validate ownership/session/quota before minting.

Limits: maximum 40 images and 150 MB total per draft; target normal post-processing about 2–4 MB/image. Accept JPEG/JPG, PNG, WebP, HEIC/HEIF only after magic-byte/MIME, byte-size, pixel dimension, decompression-bomb and quota checks. Reject SVG, archives, executables, HTML/JS, unknown binary and extension spoofing. Derived previews strip EXIF/location metadata and use safe image decoding. Originals remain protected.

## Lifecycle jobs

Guest drafts/assets expire 14 days after last activity. Account projects move to trash on deletion and are permanently cleaned after 30 days. Delete previews, orphan multipart uploads, unreferenced assets and superseded derivatives only after reference/integrity checks. Retain order snapshots and production artifacts according to legal/operational policy; never delete a referenced render input while order reproducibility requires it.

At/above the 8 GB R2 operational target, alert owner and prioritize expired guests, confirmed trash expiration, orphan cleanup and archive candidates; never purge active/paid-order assets opportunistically. Archive inactive account originals (after 30 days of inactivity) to Google Drive with checksum/manifest verification, commit archive location/state to Postgres, then only delete R2 originals after durable confirmation. Rehydrate on authorized edit with user-visible progress.

Drive archive layout: `ORDERS/YYYY/MM/<order-code>/` for production files; separate opaque project archive locations for cold originals. Drive outages enqueue retriable jobs; Postgres stays canonical. Google Sheets receives de-identified/minimum reporting fields as necessary and is never a data-store fallback.
