# Accessibility (WCAG 2.2 AA)

> **Thuộc**: 08-design-system · **Trạng thái**: Draft v1 · **Cập nhật**: 2026-10-30
> **Mục tiêu**: đạt **WCAG 2.2 mức AA**; Lighthouse Accessibility ≥ 95 cho app và trang marketing.

## 1. Lỗi đã biết

| # | Lỗi | Tiêu chí | Vị trí | Sửa |
| :---: | :--- | :--- | :--- | :--- |
| 1 | `maximum-scale=1.0, user-scalable=no` chặn phóng to | 1.4.4 Resize Text | `index.html`, `public/quan-ly-cong-viec.html` | Bỏ hai thuộc tính; input cỡ chữ ≥ 16px (task A01) |
| 2 | Chưa audit tương phản màu `text-slate-400` trên nền sáng | 1.4.3 Contrast (Minimum) | toàn app | Kiểm bằng công cụ; dùng token `text-muted` đạt 4.5:1 |
| 3 | Chưa kiểm hết bẫy focus/trả focus của modal | 2.4.3 Focus Order, 2.4.11 Focus Not Obscured | modal lazy | Primitive `Dialog` chuẩn |

Điểm tốt: ~194 thuộc tính `aria-*`, ~45 xử lý phím, có phím tắt và command palette.

## 2. Checklist cho mỗi PR có UI

- [ ] Dùng được hoàn toàn bằng bàn phím (Tab, Shift+Tab, Enter, Space, Esc, phím mũi tên trong menu)
- [ ] Focus luôn nhìn thấy được (`focus-visible` + token `focus-ring`), không bị lớp nổi che
- [ ] Nút icon có `aria-label`; ảnh có `alt`
- [ ] Tương phản chữ ≥ 4.5:1 (chữ lớn ≥ 3:1), thành phần giao diện ≥ 3:1
- [ ] Không chỉ dùng màu để truyền thông tin (trạng thái việc có chữ/icon)
- [ ] Vùng chạm ≥ 24×24 px (2.5.8 Target Size)
- [ ] Thông báo động (toast, kết quả đồng bộ) dùng `aria-live="polite"`
- [ ] Tôn trọng `prefers-reduced-motion` (confetti, chuyển động)
- [ ] Phóng to 200% không mất nội dung/chức năng; hiển thị đúng ở 320 px
- [ ] `lang` đúng trên `<html>` theo ngôn ngữ đang dùng

## 3. Công cụ

- Lighthouse / axe DevTools (thủ công) → `@axe-core/playwright` trong E2E (tự động, task B01/B03).
- Thử với trình đọc màn hình: NVDA (Windows), VoiceOver (iOS/macOS) cho 5 hành trình E2E.

## Nguồn

- WCAG 2.2: <https://www.w3.org/TR/WCAG22/>
