# Nguyên lý thiết kế

> **Thuộc**: 08-design-system · **Trạng thái**: Accepted · **Cập nhật**: 2026-10-30
> Mỗi quyết định giao diện phải trả lời được: *nguyên lý nào bên dưới ủng hộ nó?*

| # | Nguyên lý | Nghĩa là | Học từ |
| :---: | :--- | :--- | :--- |
| 1 | **Nội dung là trung tâm** | Khung giao diện "vô hình"; màu chỉ dùng cho ý nghĩa (trạng thái, cảnh báo, hành động chính) | Apple HIG — *Deference*; Notion |
| 2 | **Nhanh hơn suy nghĩ** | Mọi thao tác chính ≤ 2 bước, có phím tắt; phản hồi tức thì (optimistic UI), không spinner cho thao tác cục bộ | Linear |
| 3 | **Rõ ràng trước, đẹp sau** | Thứ bậc chữ rõ (một cỡ chữ chính, một phụ), nhãn bằng lời thay vì chỉ biểu tượng | Apple HIG — *Clarity*; IBM Carbon |
| 4 | **Bình tĩnh** | Không làm người dùng lo: hoàn tác 4,5 giây thay cho hộp xác nhận; cảnh báo nói *việc cần làm* | Material 3 — snackbar; Atlassian |
| 5 | **Dễ tiếp cận là mặc định** | WCAG 2.2 AA không phải tính năng thêm; bàn phím, trình đọc màn hình, phóng to đều dùng được | GitHub Primer; IBM Carbon |
| 6 | **Nhất quán bằng token, không bằng trí nhớ** | Màu, khoảng cách, bo góc, chuyển động lấy từ token; không giá trị "ma thuật" trong component | Material 3 design tokens |

## Hệ quả thực hành

- Không thêm màu mới ngoài bảng ngữ nghĩa ([color-system-and-palette.md](./color-system-and-palette.md)).
- Lưới khoảng cách 4pt/8pt ([notion-hierarchy-ux.md](./notion-hierarchy-ux.md)).
- Lớp nổi qua portal và thang z-index chuẩn ([portal-layering.md](./portal-layering.md)).
- Chuyển động ngắn (150–250 ms), tôn trọng `prefers-reduced-motion`.
- Trang marketing và app dùng **cùng** token để là một thương hiệu.
