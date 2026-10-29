# Release History & Commercial Evolution Hub (`docs/Release`)

Thư mục này lưu trữ toàn bộ lịch sử phát hành (Release Notes), nhật ký nâng cấp kiến trúc kỹ thuật, và tài liệu vận hành thương mại hóa theo từng mốc thời gian của dự án **Stride Tasks (Solo Checklist)**.

---

## 📅 Danh Sách Các Bản Phát Hành (Release Log)

| Ngày phát hành | Phiên bản | Tiêu đề & Trọng tâm nâng cấp | Tài liệu chi tiết |
| :--- | :---: | :--- | :--- |
| **10/28/2026** | `v3.0.0` → `v3.1.0` | **Đồng bộ đa thiết bị mã hóa đầu-cuối (PRO) · Kanban & Pomodoro miễn phí · 5 dự án Free · ảnh & hồ sơ Microsoft Store** | [📄 Xem Báo Cáo 10/28/2026](./2026-10-28-v3.1.0-e2e-sync-and-freemium-rebalance.md) |
| **10/27/2026** | `v2.5.0` → `v3.0.0` | **Execution Engine (NLP nhập nhanh 1 dòng, Kanban 4 cột, Pomodoro + nhật ký Deep Work, Time-Budget) & bản quyền PRO xác thực ngoại tuyến Ed25519 (paywall tắt mặc định)** — gộp các mốc nội bộ v2.8/v2.9 | [📄 Xem Báo Cáo Chi Tiết 10/27/2026](./2026-10-27-v3.0.0-omni-channel-and-execution-engine.md) |
| **Trước 10/27/2026** | `v1.0.0` → `v2.5.0` | **Nền tảng Local-First Checklist, cây việc con đệ quy vô hạn tầng, trạng thái Linear, Heatmap nhịp độ, lịch nhắc thông minh & ôn tập ngắt quãng Anki SM-2** | [📄 Xem Tổng Quan Kiến Trúc Hệ Thống](../architecture/system-overview.md) |

---

## 🧭 Quy Chuẩn Ghi Nhận Bản Phát Hành Mới (Release Documentation Standard)

Mỗi khi thực hiện một đợt nâng cấp tính năng hoặc kiến trúc mới, kỹ sư phụ trách cần tạo một tệp Markdown mới trong thư mục `docs/Release/` theo quy ước đặt tên:

```text
docs/Release/YYYY-MM-DD-vX.Y.Z-ten-ban-cap-nhat.md
```

Mỗi tài liệu phát hành bắt buộc bao gồm đủ **4 phần**:
1. **Executive Summary (Tóm tắt điều hành)**: Lý do nâng cấp và giá trị thực tế mang lại cho người dùng / mô hình kinh doanh.
2. **Chi tiết tính năng & Kiến trúc kỹ thuật**: Giải thích rõ thuật toán, luồng dữ liệu và cách vận hành.
3. **File Manifest (Danh mục tệp tin thay đổi)**: Liệt kê rõ các file tạo mới hoặc cập nhật để dễ truy vết code.
4. **Cam kết tương thích ngược (`localStorage` & Data Migration)**: Đảm bảo không làm hỏng dữ liệu cũ của người dùng.
