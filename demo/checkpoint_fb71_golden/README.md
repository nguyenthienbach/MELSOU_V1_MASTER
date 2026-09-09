# MELSOU GOLDEN CHECKPOINT — FB71 MILESTONE (PHIÊN BẢN TỐT NHẤT HIỆN TẠI)
**Created:** 2026-09-09
**Status:** GOLDEN BASELINE — APPROVED BY PRODUCT OWNER (Phiên bản hiện tại đang là bản tốt nhất từ trước đến nay về tổng thể UI/UX)

---

## 📌 Tổng quan mốc lưu trữ
Thư mục này là bản sao nguyên trạng, độc lập và được đóng băng hoàn toàn của phiên bản **FB71** sau khi vượt qua:
- 100% (65/65) bài kiểm tra hồi quy FB63–FB66.
- 100% bài kiểm tra tự động toàn diện FB67–FB71 trên headless browser (CDP Edge).

### Các tính năng cốt lõi hoàn thiện:
1. **FB67 — Full-Site i18n Single Source of Truth / Zero Mixed-Language UI:**
   - 1 nguồn chân lý ngôn ngữ runtime currentAppLanguage = 'vi' | 'en'.
   - Loại bỏ triệt để 100% chuỗi song ngữ/lẫn lộn: không còn (About us), (Canva Frames), (+35k) -> chuẩn hóa thành (+35.000đ) / (+35,000đ).
   - Dịch 100% modal Cài đặt hệ thống (tiêu đề, nhóm A–D, quyền truy cập phần cứng, trạng thái API, placeholder, nút bấm), Giỏ hàng, Speed Dial, Menu Mobile, Studio Toolbar.
2. **FB68 — Synchronize Journal Navigation Across Desktop & Mobile:**
   - Đồng bộ navigation item thứ 6 trên Desktop Header: Nhật ký Melsou (VI) / Melsou Journal (EN).
   - Đồng bộ Mobile Drawer: 📖 Nhật ký Melsou (VI) / 📖 Melsou Journal (EN).
   - Cả 2 cùng trỏ tới #blog-section, không bị tràn layout ở mọi kích thước từ 1180px đến 1920px+.
3. **FB69 — Mobile 3D Viewer Single-Page Projection (<768px):**
   - Trình chiếu 1 trang đơn tuần tự trên mobile: Bìa Trước -> Trang 2 -> Trang 3 ... -> Bìa Sau.
   - Ẩn hoàn toàn gáy sách và trang đối diện trên mobile, hỗ trợ vuốt chạm cảm ứng (touch swipe gestures).
   - Tự động scale overlay các sticker, khung ảnh Polaroid và washi tape vừa vặn hoàn hảo theo kích thước trang mobile.
   - Giữ nguyên trải nghiệm mở phẳng 2 trang liền mạch (180° spread) trên màn hình desktop >= 768px.
4. **FB70 — Fix Desktop Studio Workspace Shrink / Restore True 1:1 Editor Scale:**
   - Khắc phục triệt để lỗi co cụm workspace (flex: 1; width: 100%; min-width: 0).
   - Tỉ lệ scale tự động: ~1.08x ở 1366px, ~1.25x ở 1440px, ~1.52x ở 1920px.
   - Mở rộng filmstrip và toolbar đạt min(1200px, 94%).
   - Chuẩn hóa delta kéo thả theo currentStageScale đạt độ chuẩn xác 1:1.
5. **FB71 — Restore Floating Chat Button on Mobile:**
   - Khôi phục nút chat nổi tròn màu đỏ thương hiệu, icon trắng, kích thước 54px.
   - Vị trí cách mép 16px, đáy max(16px, env(safe-area-inset-bottom)).
   - Khi vào Studio Mobile, nút tự nâng lên 70px để không che bottom toolbar; tự ẩn khi mở drawer hoặc modal.
6. **Bảo toàn vững chắc FB63–FB66:**
   - Mobile Custom Album Canva-like (<768px) với bottom sheet 3 snap levels hoạt động mượt mà.
   - Desktop True Spread (>=768px) giữ nguyên chỉnh sửa 2 trang song song.

---

## 🔒 Quy tắc bảo toàn
- **KHÔNG CHỈNH SỬA TRỰC TIẾP** các tệp trong thư mục này.
- Khi cần phát triển các feedback tiếp theo, luôn thực hiện trên thư mục làm việc chính (demo/recovery_fb38/) để thư mục này luôn là điểm tựa rollback vững chắc 100%.
