# App Store Optimization (ASO)

> **Thuộc**: 02-growth · **Trạng thái**: Draft v1 · **Cập nhật**: 2026-10-30
> **Mục đích**: tối ưu hiển thị trong Microsoft Store (P1) và Google Play (P2). Nội dung listing Microsoft đã soạn tại [store-listings/microsoft-store-listing.md](./store-listings/microsoft-store-listing.md).

## 1. Yếu tố xếp hạng chung trong store

1. **Tên + mô tả + từ khóa** khớp truy vấn ("todo", "pomodoro", "study planner").
2. **Tỉ lệ chuyển đổi trang listing** (ảnh chụp, 2 dòng đầu mô tả).
3. **Đánh giá & số sao**, đặc biệt đánh giá gần đây.
4. **Độ ổn định** (crash, thời gian khởi động).

## 2. Microsoft Store

| Thành phần | Khuyến nghị |
| :--- | :--- |
| Tên | `Stride Tasks` (phải khớp tên đã giữ chỗ trong Partner Center) |
| 2 dòng đầu mô tả | Nêu kết quả + khác biệt: offline, Pomodoro, ôn tập SM-2, không cần tài khoản |
| Từ khóa tìm kiếm (≤ 7) | to-do list · task manager · pomodoro · kanban · spaced repetition · study planner · offline |
| Ảnh chụp | 4 ảnh đã có (`wide-list`, `wide-kanban`, `wide-daily-focus`, `narrow-list`); thêm chú thích chữ lớn trên ảnh khi làm lại |
| Danh mục | Productivity |
| Ngôn ngữ listing | EN + VI (thêm theo đợt bản địa hóa) |
| Xin đánh giá | Sau khoảnh khắc tích cực (hoàn thành chuỗi 7 ngày / xong 1 phiên Pomodoro), tối đa 1 lần/90 ngày, dùng link `ms-windows-store://review/?ProductId=<id>` |

## 3. Google Play (khi làm task `C06`)

| Thành phần | Giới hạn | Gợi ý |
| :--- | :--- | :--- |
| Tiêu đề | 30 ký tự | `Stride: Tasks, Focus & Review` |
| Mô tả ngắn | 80 ký tự | `Offline to-do list with Pomodoro and spaced repetition. No account needed.` |
| Mô tả đầy đủ | 4.000 ký tự | Cấu trúc như trang đích; từ khóa tự nhiên, không nhồi |
| Feature graphic | 1024×500 | Tiêu đề + ảnh app |
| Ảnh chụp | ≥ 4 ảnh điện thoại | Dùng ảnh `narrow-*`, chụp thêm màn Pomodoro và lịch ôn |

## 4. Quy tắc

- Không mua/đổi đánh giá; không yêu cầu đánh giá 5 sao có điều kiện, vi phạm chính sách store.
- Ghi chú phát hành (release notes) mỗi bản cập nhật, dùng lại nội dung từ `docs/Release/`.
- Theo dõi từ khóa và số lượt cài theo tuần trong Partner Center / Play Console.
