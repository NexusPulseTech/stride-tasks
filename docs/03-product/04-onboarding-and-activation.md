# Onboarding & kích hoạt (Activation)

> **Thuộc**: 03-product · **Trạng thái**: Draft v1 · **Cập nhật**: 2026-10-30
> **Mục đích**: đưa người dùng mới tới "khoảnh khắc aha" trong 2 phút đầu, người được kích hoạt mới có khả năng trả tiền.

## 1. Định nghĩa

- **Khoảnh khắc aha (giả thuyết)**: người dùng gõ một dòng nhập nhanh và thấy việc được tạo đúng thời lượng/lặp lại/ghim; bắt đầu một phiên Pomodoro trên việc đó.
- **Activated**: tạo ≥ 3 việc **và** hoàn thành ≥ 1 việc trong 24 giờ đầu.
- **Habit**: quay lại ≥ 3 ngày trong 7 ngày đầu.

## 2. Hành trình lần đầu (mục tiêu)

| Bước | Người dùng thấy | Mục tiêu thiết kế |
| :--- | :--- | :--- |
| 0 | Mở app, không màn hình đăng ký | Giữ lợi thế "không cần tài khoản" |
| 1 | Dự án mẫu + gợi ý ô nhập nhanh có ví dụ `Ôn chương 3 ~45m @daily !pin` | Hiểu cú pháp trong 10 giây |
| 2 | Checklist "3 bước bắt đầu": *Thêm việc bằng một dòng → Bắt đầu Pomodoro → Lên lịch ôn lại* | Dẫn tới aha |
| 3 | Hoàn thành việc đầu tiên → hiệu ứng ăn mừng (đã có) + chuỗi ngày | Phần thưởng |
| 4 | Ngày thứ 2: lịch ôn SM-2 xuất hiện trong Daily Focus | Lý do quay lại |
| 5 | Khi tạo dự án thứ 6 / muốn dùng máy thứ 2 → lời mời PRO | Nâng cấp đúng lúc |

## 3. Việc cần làm (đưa vào backlog sau khi có số liệu A07)

- [ ] Checklist "3 bước bắt đầu" có thể đóng, lưu trạng thái cục bộ.
- [ ] Trạng thái rỗng (empty state) cho mỗi màn hình có một hành động rõ ràng.
- [ ] Gợi ý cài PWA/Microsoft Store sau phiên thứ 2 (không phải phiên đầu).
- [ ] Sự kiện ẩn danh `activated`, `retained_d7` theo [../02-growth/07-analytics-and-measurement.md](../02-growth/07-analytics-and-measurement.md).

## 4. Nguyên tắc

- Không chặn người dùng bằng tour nhiều bước; mọi gợi ý bỏ qua được.
- Không xin quyền thông báo ở phiên đầu, chỉ xin khi người dùng bật nhắc việc.
- Đo trước, sửa sau: mọi thay đổi onboarding phải có giả thuyết và chỉ số để so sánh.
