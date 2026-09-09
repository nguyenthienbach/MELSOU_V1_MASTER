# MELSOU V1 — GOLDEN BASELINE / CURRENT BEST VERSION (FB87 MILESTONE)

- **Designation:** `GOLDEN BASELINE / PHIÊN BẢN TỐT NHẤT HIỆN TẠI (FB87 MILESTONE)`
- **Target Timestamp:** `2026-09-09T23:54:00+07:00`
- **Approved by Product Owner:** `2026-09-09` (Directive: "trước khi sửa, chọn mốc FB 87 làm phiên bản tốt nhất")
- **Active Baseline Checkpoint:** `demo/checkpoint_fb87_golden/`
- **Baseline Lineage:** Evolves cleanly from `checkpoint_fb77_golden` and integrates:
  - **FB78–FB84:** Header package section rename ("Gói sản phẩm"), blank interior canvas baseline, removed redundant top contextual toolbar (+40px height for canvas), authentic Spotify track display metadata (`spotifyTrackObj`), drawer height clamped 12px above filmstrip, fit-to-workspace display scaling, all 4 physical album formats standard at 0₫ delta.
  - **FB85 (Full-Site Responsive Architecture):** Unified 3-tier responsive architecture (Desktop $\ge 1180\text{px}$, Tablet $768 - 1179.98\text{px}$, Mobile $< 768\text{px}$), zero premature desktop hamburger collapse at 1100px / 125% zoom, tablet portrait preservation of CTA button, tablet studio overlay drawer mode, 0 canonical coordinate drift.
  - **FB86 (Desktop Scale Restored):** Hero 3D book clamp restored to `clamp(500px, 36vw, 680px)`, pricing grid container expanded to `1400px`, Tier 1 nav link sizing & optical density restored on $\ge 1180\text{px}$.
  - **FB87 (Clean New-User State & Demo Data Removal / Deployment Readiness):**
    - All 8 templates have 100% blank interior freestyle spreads (`elements: []`).
    - Fresh visitor cart is strictly empty (`0`, `.is-empty`).
    - Spotify starts clean (`null`, no autoplay, mini-player hidden, no fake soundwave code).
    - Purged 100% of demo personal data ("Thiện Bách", "Thien Bach", `MELS-2608-001`, `MELS2608001`) with 0 grep matches across codebase.
    - Tracking page starts clean, ready for backend connection (`window.codexTrackOrder`).
    - Orders manager modal displays clean empty state.
    - Protected Guest-First Persistence: returning visitors with active drafts have their draft 100% preserved across reloads.

## Verification Status
- Automated FB87 clean state test suite (`test_fb87_clean_state.cjs`): 8/8 PASSED (100%).
- Automated FB85 responsive matrix suite (`test_fb85_full_matrix.cjs`): 16/16 viewports PASSED (100%).
- Codebase grep audit: 0 occurrences of "Thiện Bách", "Thien Bach", "MELS-2608-001", "MELS2608001".
- JS Syntax check: `node -c demo/checkpoint_fb87_golden/app.js` exited with 0 (0 errors).
- Clean visual proof artifacts saved in brain artifact directory.

