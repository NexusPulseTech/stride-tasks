# 3. State Persistence, Undo/Redo & Audio Engine

## 3.1. Lưu Trữ Bền Vững (Client-Side Storage Architecture)

Hệ thống hoạt động theo nguyên tắc **Local-First**: Toàn bộ dữ liệu được lưu tức thì vào trình duyệt người dùng qua `localStorage`, sẵn sàng hoạt động 100% offline.

### Bảng Lưu Trữ Khóa (Storage Keys):
| Khóa (Key) | Mục Đích | Kiểu Dữ Liệu |
|---|---|---|
| `checklist_projects_v2` | Danh sách dự án, nhiệm vụ và cây subtask | `Project[]` JSON |
| `checklist_streak_v1` | Chuỗi ngày hoàn thành liên tục | `{ count, lastDoneDate, maxStreak }` |
| `checklist_sound_muted` | Trạng thái tắt/bật âm thanh | `'true' \| 'false'` |
| `checklist_reminder_enabled` | Cài đặt nhắc việc qua Web Notification | `'true' \| 'false'` |

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
