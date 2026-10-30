# Danh mục tính năng & gói Free / PRO

> **Thuộc**: 03-product · **Trạng thái**: Reviewed (khớp code v3.1.0) · **Cập nhật**: 2026-10-30
> **Nguồn sự thật cho giới hạn**: `src/hooks/useProLicense.ts` (`FREE_PROJECT_LIMIT = 5`, `TRIAL_PASSES = 3`), `src/config/commerceConfig.ts` (bậc giá).

## 1. Danh mục

| Nhóm | Tính năng | Free | PRO | Code chính |
| :--- | :--- | :---: | :---: | :--- |
| Ghi nhận | Nhập nhanh một dòng NLP (`~45m @daily !pin`), Quick Paste tạo cây việc con | ✅ | ✅ | `src/features/tasks/utils/` |
| Tổ chức | Dự án, việc con nhiều cấp (rollup/cascade), ghim, trạng thái tùy chỉnh | ✅ (≤ 5 dự án, không tính dự án mẫu) | ✅ không giới hạn | `src/features/tasks/` |
| Hiển thị | Danh sách, **Kanban 4 cột** | ✅ | ✅ | `KanbanBoardView.tsx` |
| Tập trung | **Pomodoro** + nhật ký Deep Work, Daily Focus | ✅ | ✅ | `src/features/focus/`, `DailyFocusModal.tsx` |
| Ghi nhớ | **Ôn tập ngắt quãng SM-2** cho việc, hoãn thông minh | ✅ | ✅ | `AnkiSrsModal.tsx`, `spacedSnooze.ts` |
| Lập lịch | Smart Schedule | ✅ | ✅ | `SmartScheduleModal.tsx` |
| Phân tích | Heatmap nhịp độ, chuỗi ngày, chia sẻ năng suất | ✅ | ✅ | `src/features/analytics/` |
| Báo cáo | Xuất báo cáo Markdown (Obsidian/Notion) | 3 lượt thử | ✅ không giới hạn | `MarkdownReportModal.tsx` |
| Điều hướng | Command palette, phím tắt | ✅ | ✅ | `CommandPaletteModal.tsx` |
| Dữ liệu | Sao lưu/khôi phục JSON, sao lưu tự động, khôi phục khẩn cấp | ✅ | ✅ | `BackupModal.tsx`, `persistentStorage.ts` |
| Đồng bộ | **Đồng bộ đa thiết bị mã hóa đầu-cuối** (mã 26 ký tự, link `#sync=`) | ❌ | ✅ | `src/features/sync/` |
| Nền tảng | PWA offline, Windows (Tauri), VI/EN, giao diện sáng/tối | ✅ | ✅ | `vite.config.ts`, `src-tauri/` |

## 2. Nguyên tắc phân gói

1. **Vòng lặp cốt lõi luôn miễn phí** (ghi → làm → hoàn thành → ôn). Đối thủ đều cho miễn phí Kanban/Pomodoro (lý do mở khóa từ v3.1).
2. PRO bán **sự tiện lợi & quy mô**: nhiều thiết bị (sync), nhiều mảng đời sống (dự án), xuất báo cáo thường xuyên.
3. Khi thêm tính năng mới phải ghi vào bảng trên **và** quyết định gói trong cùng PR; tính năng PRO mới không được lấy đi thứ người dùng Free đang có.

## 3. Ứng viên PRO tương lai (chỉ làm khi khách trả tiền yêu cầu)

- Nhiều bộ mã đồng bộ (không gian làm việc tách biệt), lịch sử phiên bản kho đồng bộ.
- Chủ đề giao diện/biểu tượng ứng dụng.
- Xuất CSV/ICS, tích hợp lịch.
- Thống kê nâng cao theo tuần/tháng.
