# D04: Tiến hóa mô hình giá

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | D: Scale |
| Ưu tiên | P3 |
| Ước lượng | 1 ngày phân tích |
| Điều kiện bắt đầu | ≥ 50 đơn trả tiền |
| Trạng thái | ☐ Todo |

## Mục tiêu
Quyết định giữ hay bổ sung mô hình giá dựa trên dữ liệu thật, không phá cam kết với người đã mua lifetime.

## Dữ liệu cần
Tỉ lệ chuyển đổi theo bậc PPP, tỉ lệ hoàn tiền, chi phí hạ tầng đồng bộ/khách, tỉ lệ khách dùng sync, phản hồi phỏng vấn về giá.

## Phương án
1. Giữ lifetime, tăng giá niêm yết cho khách mới (khách cũ giữ nguyên quyền lợi).
2. Thêm gói **Sync hằng năm** giá thấp bên cạnh lifetime (giống Obsidian Sync ~$4/tháng).
3. Lifetime + nâng cấp major trả phí (kiểu Things).

## Các bước
1. Tổng hợp dữ liệu → so sánh 3 phương án theo doanh thu dự kiến 12 tháng.
2. Phỏng vấn 5 khách hiện tại về phương án được chọn.
3. Ghi ADR; cập nhật [../01-business/03-pricing-and-packaging.md](../01-business/03-pricing-and-packaging.md) và MoR.

## Tiêu chí nghiệm thu
- [ ] ADR có số liệu; khách lifetime hiện tại không mất quyền lợi.
