# MELSOU V1 — GOLDEN BASELINE / CURRENT BEST VERSION (FB77 MILESTONE)

- **Designation:** `GOLDEN BASELINE / PHIÊN BẢN TỐT NHẤT HIỆN TẠI`
- **Target Timestamp:** `2026-09-09T21:24:00+07:00`
- **Approved by Product Owner:** `2026-09-09` (Directive: "hiện tại là phiên bản tốt nhất hãy cập nhật")
- **Baseline Lineage:** Evolves cleanly from `checkpoint_fb71_golden` and integrates:
  - **FB72:** Renamed Journal navigation to `Câu chuyện` (VI) / `Blog` (EN).
  - **FB73:** Corrected extra spread price to `+15.000đ / 2 trang` (`+15,000₫ / 2 pages`). All 35k references purged.
  - **FB74:** Desktop bottom filmstrip clearance $\ge 29.9\text{px}$ (prevents album overlap).
  - **FB75.1:** Removed fake Spotify catalog/generators; clean Codex service contract with authentic metadata.
  - **FB76:** Full bilingual i18n synchronization for all 8 launch templates in Template Library.
  - **FB77:** Restored real physical album format switching (A5 Portrait, Square 20×20, A5 Landscape, A6 Mini) with responsive stage geometry, confirmation modal popup, zero-data-loss coordinate remapping, and 3D viewer synchronization.

## Verification Status
- Automated format test suite (`test_fb77_formats.cjs`): 51/51 PASSED (100%).
- Template library i18n suite (`test_fb76.cjs`): 14/14 PASSED (100%).
- Spotify & navigation regression suite (`test_fb75_1_suite.cjs`): 34/34 PASSED (100%).
- Core system baseline suite (`test_fb67_fb71_suite.cjs`): ALL PASSED (100%).
- Visual matrix: 16 screenshots covering Desktop (1440×900) and Mobile (390×844) across 2D Studio and 3D Preview.
