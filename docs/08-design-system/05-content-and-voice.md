# Giọng văn, UX writing & i18n

> **Thuộc**: 08-design-system · **Trạng thái**: Draft v1 · **Cập nhật**: 2026-10-30
> **Áp dụng**: chuỗi trong app (`src/i18n/*`), trang marketing, store listing, email, bài cộng đồng.

## 1. Giọng văn

| Thuộc tính | Là | Không là |
| :--- | :--- | :--- |
| Rõ ràng | "Đã lưu trên máy này" | "Dữ liệu đã được đồng bộ hóa vào bộ nhớ cục bộ" |
| Bình tĩnh | "Chưa kết nối được — sẽ thử lại sau" | "LỖI! Đồng bộ thất bại!!!" |
| Tôn trọng | "Bạn có thể dùng bản miễn phí mãi mãi" | "Nâng cấp ngay kẻo lỡ!" |
| Thật | "Máy chủ chỉ thấy bản mã" | "Bảo mật cấp quân đội" |

## 2. Quy tắc UX writing

1. **Động từ trước**: nút = hành động ("Bật đồng bộ", "Xuất báo cáo"), không "OK/Đồng ý" chung chung.
2. **Lỗi = chuyện gì xảy ra + làm gì tiếp**: "Mã đồng bộ không đúng. Kiểm tra lại 26 ký tự trên thiết bị kia."
3. **Câu ngắn**, một ý; tránh thuật ngữ (chỉ dùng "E2E" ở trang kỹ thuật).
4. **Viết hoa kiểu câu** (sentence case) cho nút/tiêu đề tiếng Anh: "Open the app", không "Open The App".
5. Số và ngày định dạng bằng `Intl` theo ngôn ngữ người dùng; tiền tệ có ký hiệu và đơn vị rõ (`199.000₫`, `$25.95`).

## 3. Thuật ngữ thống nhất

| Khái niệm | Tiếng Việt | English |
| :--- | :--- | :--- |
| Task | Công việc / việc | Task |
| Subtask | Việc con | Subtask |
| Project | Dự án | Project |
| Quick capture | Nhập nhanh | Quick capture |
| Spaced repetition | Ôn tập ngắt quãng | Spaced repetition |
| Sync code | Mã đồng bộ | Sync code |
| Lifetime PRO | PRO trọn đời | Lifetime PRO |
| Founding member | Thành viên sáng lập | Founding member |

## 4. Quy tắc i18n

- Mọi chuỗi hiển thị nằm trong từ điển có kiểu (`src/i18n/types.ts`) — thiếu khóa ở một ngôn ngữ là lỗi biên dịch (đã có).
- Tham số qua `formatMessage` (`{region}`), không ghép chuỗi; số nhiều dùng `Intl.PluralRules`.
- Thiết kế chịu chuỗi dài hơn ~40% (tiếng Đức) và dấu tiếng Việt (không cắt chiều cao dòng).
- Ngôn ngữ mới thêm theo đợt ([../02-growth/03-keyword-and-content-strategy.md](../02-growth/03-keyword-and-content-strategy.md) và task C03); bản dịch máy phải được người bản ngữ rà trước khi phát hành.
- Tách từ điển theo namespace khi > 300 dòng/file (task B08).
