# Component & mẫu tương tác

> **Thuộc**: 08-design-system · **Trạng thái**: Draft v1 · **Cập nhật**: 2026-10-30
> **Nơi đặt**: primitive dùng chung ở `src/components/ui/` (sau refactor: `src/shared/ui/`).

## 1. Primitive cần có (theo thứ tự ưu tiên)

| Primitive | Biến thể | Trạng thái bắt buộc | Ghi chú |
| :--- | :--- | :--- | :--- |
| `Button` | `primary`, `secondary`, `ghost`, `danger`; cỡ `sm`/`md` | default, hover, focus-visible, active, disabled, loading | Nút chỉ có icon phải có `aria-label` |
| `IconButton` | — | như trên | Vùng chạm ≥ 24×24 px (WCAG 2.5.8), khuyến nghị 44×44 trên mobile |
| `TextField` / `TextArea` | có nhãn, mô tả, lỗi | focus, invalid, disabled | Cỡ chữ ≥ 16px để iOS không tự zoom (thay cho khóa `user-scalable`) |
| `Dialog` | modal, sheet (mobile) | mở/đóng, bẫy focus, `Esc` đóng, trả focus | Dựa trên portal chuẩn hiện có |
| `Menu` / `Popover` | — | điều hướng phím mũi tên | Mở rộng `PortalMenu` |
| `Toast` / `Snackbar` | info, success, error, có hành động Undo | tự đóng, dừng khi hover/focus | Đã có `ToastNotification`, `UndoSnackbar` → chuẩn hóa API |
| `Badge` / `StatusPill` | theo token `status-*` | — | Không dùng màu làm tín hiệu duy nhất (kèm chữ/icon) |
| `Checkbox`, `Switch` | — | checked, mixed (việc con một phần), disabled | |
| `EmptyState` | — | — | Tiêu đề + một hành động chính |
| `Skeleton` | — | — | Chỉ cho dữ liệu mạng (đồng bộ), không cho dữ liệu cục bộ |

## 2. Mẫu tương tác chuẩn

| Tình huống | Mẫu | Không dùng |
| :--- | :--- | :--- |
| Xóa | Xóa ngay + Snackbar "Hoàn tác" 4,5 giây | Hộp `confirm()` |
| Hành động phá hủy không hoàn tác được (xóa bản sao đám mây) | Dialog xác nhận nêu hậu quả + nút `danger` | Xác nhận bằng icon |
| Lỗi mạng khi đồng bộ | Chỉ báo nhỏ ở header + thử lại tự động | Chặn toàn màn hình |
| Paywall | Dialog giải thích lợi ích, nút đóng rõ ràng, giữ nguyên dữ liệu | Che dữ liệu, đếm ngược giả |
| Nhập nhanh | Gợi ý cú pháp inline, xem trước kết quả parse | Form nhiều trường |
| Lớp nổi chồng nhau | Thang z-index trong [portal-layering.md](./portal-layering.md) | `z-index` tùy ý |

## 3. Định nghĩa "component hoàn chỉnh"

- [ ] Dùng token, không giá trị màu/khoảng cách cứng
- [ ] Đủ trạng thái ở bảng mục 1
- [ ] Bàn phím đầy đủ + focus nhìn thấy được
- [ ] Văn bản qua i18n, chịu được chuỗi dài hơn 40% (tiếng Đức/Việt)
- [ ] Hoạt động ở 360 px chiều ngang và ở chế độ tối
- [ ] Có test component cho hành vi chính
