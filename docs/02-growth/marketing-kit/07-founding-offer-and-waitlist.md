# Ưu đãi Thành viên sáng lập & danh sách chờ

> **Thuộc**: 02-growth/marketing-kit · **Trạng thái**: Accepted · **Cập nhật**: 2026-10-30
> **Mục đích**: tạo lý do mua sớm một cách trung thực, giúp có 100 khách đầu tiên nhanh nhất.

## 1. Cơ chế

| Mục | Quy định |
| :--- | :--- |
| Số suất | **100 bản quyền đầu tiên** (tính chung mọi kênh và mọi khu vực) |
| Giá sáng lập | Việt Nam **149.000₫** · Quốc tế **$19** · Thị trường mới nổi **$9.95** |
| Giá sau 100 suất | 199.000₫ · $29 · $14.95 |
| Quyền lợi | Như PRO trọn đời: đồng bộ mã hóa, không giới hạn dự án, báo cáo không giới hạn, mọi bản cập nhật |
| Cam kết | Hoàn tiền 14 ngày, không cần lý do |

## 2. Quy tắc trung thực (bắt buộc)

- Số suất còn lại hiển thị là **số thật**, đếm từ sổ cái đơn hàng (đơn hoàn tiền vẫn tính đã dùng suất).
- Không đặt đồng hồ đếm ngược giả, không "chỉ còn 3 suất" khi không đúng.
- Ghi rõ giá sau ưu đãi là giá sẽ áp dụng, không trình bày như "giá gốc đã giảm" khi chưa từng bán ở giá đó (tránh vi phạm quy định về công bố giảm giá của EU và FTC).
- Người mua ở giá sáng lập giữ toàn bộ quyền lợi khi giá tăng.

## 3. Danh sách chờ (trước khi mở bán)

- **Kênh chính**: Telegram channel (không cần thu thập email, người dùng tự rời kênh khi muốn).
- **Kênh phụ**: nút "giữ suất" trên trang đích mở email tới `support@nexuspulsetech.xyz`. Trả lời mỗi email bằng một câu cảm ơn và lời hứa báo ngay khi mở bán; lưu email vào một danh sách riêng chỉ dùng cho việc này.
- Khi đã có link Telegram: thay nút "giữ suất" trên `/vi/` và `/en/` bằng link Telegram có UTM (dev làm trong 5 phút).

## 4. Ngày mở bán

1. Kiểm tra lại thanh toán thật cả 2 kênh trong 24 giờ trước.
2. Gửi tin Telegram và trả lời từng email trong danh sách chờ (mẫu ở [05-community-posts.md](./05-community-posts.md) mục 7).
3. Đổi CTA trang đích và bài ghim trên mọi kênh.
4. Đăng video V10 và bài X số 14.
5. Cập nhật số suất còn lại mỗi ngày (bài ghim Telegram, X).

## 5. Sau 100 suất

Thông báo trước 48 giờ khi còn khoảng 10 suất; khi hết, cập nhật giá trên trang đích, app (`src/config/commerceConfig.ts`), Worker (`PRICE_VND`) và cổng thanh toán cùng lúc.
