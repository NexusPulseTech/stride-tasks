# 3. State Persistence, Undo/Redo & Audio Engine

## 3.1. Lưu Trữ Bền Vững (Client-Side Storage Architecture)

Hệ thống hoạt động theo nguyên tắc **Local-First**: Toàn bộ dữ liệu được lưu tức thì vào `localStorage` (đồng thời mirror sang IndexedDB `NexusPulseTasksDB` để khôi phục khi trình duyệt dọn localStorage), sẵn sàng hoạt động 100% offline. Khi khởi động, app gọi `navigator.storage.persist()` để xin quyền lưu trữ bền vững (hạn chế việc Safari/Chrome tự xóa dữ liệu).

### Bảng Lưu Trữ Khóa (Storage Keys): khớp mã nguồn v3.0.0
| Khóa (Key) | Mục Đích | Kiểu Dữ Liệu |
|---|---|---|
| `SOLO_CORE_TASKS_V4` | Danh sách dự án, công việc và cây subtask | `Project[]` |
| `SOLO_CORE_INITIALIZED_V4` | Cờ đã khởi tạo dữ liệu mẫu | `'true'` |
| `SOLO_CORE_STREAK_V4` | Chuỗi ngày hoàn thành liên tục | JSON |
| `SOLO_COMPLETED_LOGS_V2` | Log hoàn thành chi tiết **≤ 90 ngày** (nguồn dữ liệu Heatmap) | `CompletedItemLog[]` |
| `SOLO_COMPLETED_LOGS_ARCHIVE_V1` | Log > 90 ngày đã gộp thành số đếm theo ngày (bản gốc chuyển sang IndexedDB `SOLO_COMPLETED_LOGS_ARCHIVE_RAW_V1`) | `{ archivedDailyCounts: Record<YYYY-MM-DD, number> }` |
| `SOLO_CHECKLIST_ACTIVITY_LOG_V1` | Nhật ký hoạt động cũ (giữ tương thích) | JSON |
| `SOLO_MUTED_V1` / `SOLO_REMINDER_V1` | Tắt âm thanh / nhắc việc (tương thích cũ) | `'true' \| 'false'` |
| `stride_tasks_reminder_enabled` / `stride_tasks_reminder_interval` | Nhắc việc định kỳ | `'true' \| 'false'` / `15 \| 30 \| 60` |
| `STRIDE_SNAPSHOT_VAULT_V1` | **5** bản sao toàn bộ workspace gần nhất (tự cắt còn 2 khi hết quota) | `SnapshotItem[]` |
| `STRIDE_AUTO_BACKUP_DATA` / `STRIDE_EMERGENCY_RECOVERY_DATA` | Bản sao lưu tự động / khẩn cấp | JSON |
| `STRIDE_CUSTOM_STATUSES_V1` | Trạng thái tùy chỉnh | `StatusDefinition[]` |
| `STRIDE_FOCUS_TIMER_V1` | Phiên Pomodoro đang chạy (khôi phục sau reload, có cờ `logged` chống ghi trùng) | `FocusTimerSession` |
| `STRIDE_FOCUS_LOG_V1` | Nhật ký Deep Work append-only (bản ghi > 90 ngày gộp theo ngày) | `FocusLogStore` |
| `STRIDE_PRO_LICENSE_V2` | Token bản quyền Ed25519 + trường hiển thị (verify lại mỗi lần khởi động; lệch là reset) | JSON |
| `STRIDE_PRO_TRIAL_V1` | Lượt dùng thử còn lại: `kanban`, `pomodoro`, `markdownReport` | JSON |
| `STRIDE_PRICING_REGION_V1` / `STRIDE_PENDING_ORDER_V1` | Vùng giá đã chọn / mã đơn đang chờ thanh toán | string / JSON |
| `STRIDE_PROJECT_LIMIT_BASELINE_V1` | Kết quả grandfathering giới hạn 3 dự án | JSON |
| `stride_tasks_language` / `stride_tasks_view_preferences_v1` / `task_manager_theme_mode` | Ngôn ngữ / tùy chọn hiển thị / giao diện | string / JSON / string |

### Bảo vệ hạn mức (Quota Guard)
- Mọi thao tác ghi quan trọng đi qua `safeSetItem()` (`src/utils/persistentStorage.ts`): gặp `QuotaExceededError` sẽ cắt Snapshot Vault rồi thử lại.
- Vẫn thất bại → phát sự kiện `stride:storage-error` và app hiện toast cảnh báo rõ ràng (hết bộ nhớ hoặc trình duyệt chặn lưu trữ ở chế độ ẩn danh), thay vì lặng lẽ mất dữ liệu.

---

## 3.2. Cơ Chế Hoàn Tác Thông Minh (4.5s Transient Undo Buffer)

Để tạo cảm giác an tâm tuyệt đối khi xóa việc hoặc xóa dự án, hệ thống cung cấp thanh thông báo kèm nút **Hoàn tác (Undo)** tồn tại trong 4.5 giây:

```typescript
const triggerUndoableAction = (message: string, undoFn: () => void) => {
  if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
  const actionId = Date.now().toString();
  setUndoState({
    id: actionId,
    message,
    undo: () => {
      undoFn();
      setUndoState(null);
      showToast('Đã khôi phục thành công!');
    },
  });
  undoTimerRef.current = window.setTimeout(() => {
    setUndoState(null);
  }, 4500);
};
```

---

## 3.3. Web Audio API Chime Synth

Hệ thống không phụ thuộc vào tệp âm thanh MP3 bên ngoài (tránh lỗi 404 hoặc độ trễ mạng). Thay vào đó, âm thanh hoàn thành được tổng hợp trực tiếp bằng trình duyệt qua **Web Audio API**:

- Sử dụng sóng hình sin (`sine`) kết hợp bộ khuếch đại `GainNode` với độ suy giảm hàm mũ tự nhiên (`exponentialRampToValueAtTime`).
- Chuỗi hợp âm ngũ cung trong sáng (Pentatonic chime: 523.25Hz `C5` ➔ 659.25Hz `E5` ➔ 783.99Hz `G5`), kích thích dopamine và tạo cảm giác thành tựu khi hoàn thành mục tiêu.
