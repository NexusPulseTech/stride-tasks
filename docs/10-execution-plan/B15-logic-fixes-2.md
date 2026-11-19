# B15: Sửa lỗi logic đợt 2 (Daily Focus, chuỗi việc con nhiều tầng, chữ số nhiều, Undo sau Shutdown Ritual)

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | B: Chất lượng |
| Ưu tiên | P2 |
| Ước lượng | 0,5 ngày |
| Phụ thuộc | B12 (nhánh `fix/b12-logic`, chưa gộp) |
| Trạng thái | ◐ 2026-11-20 (đang làm trên nhánh `fix/b15-logic` tách từ `fix/b12-logic`, chưa gộp, chưa deploy) |

## Mục tiêu
Sửa F09, F10, F11 của báo cáo rà soát giao diện và chức năng ngày 2026-11-19 và ba lỗi thấy thêm khi làm B12, mỗi lỗi có test tái hiện chạy đỏ trên code cũ và xanh sau khi sửa.

## Vì sao
- F09: phím 1, 2, 3 trong Daily Focus vẫn tác động lên việc đầu tiên khi đang xem tab Snoozed.
- F10: bấm Done trong Daily Focus không hoàn tác được.
- F11: nhãn hệ số giãn cách không khớp giữa Smart schedule, code và chân Daily Focus.
- Thấy khi làm B12: việc con nhiều tầng tự chuyển sang xong (vì mọi con đã xong) không được tính vào chuỗi ngày; câu "Refreshed 1 recurring tasks" sai số ít, số nhiều; thanh Undo sau Shutdown Ritual nằm ngoài vùng `aria-modal` của ô báo cáo mở ngay sau đó.

Báo cáo gốc nằm ở kho tài liệu nội bộ của founder, không đưa vào repo công khai.

## Phạm vi
- Trong phạm vi: 6 lỗi trên.
- Ngoài phạm vi: đổi nhãn Anki, Again, Good, Easy, Spaced Snooze trên giao diện (đợt B13, theo định vị mới 2026-11-20: khoảng 1, 3, 7, 16, 35 ngày là hoãn việc có chủ đích để làm xong sớm hơn, không phải ôn bài). B15 không đổi các nhãn này.

## Các bước
1. F09: chỉ bắt phím 1, 2, 3 ở tab Due Today.
2. F10: Done trong Daily Focus có Hoàn tác.
3. F11: một nguồn duy nhất cho hệ số giãn cách, mọi nhãn đọc từ đó.
4. Chuỗi của việc con nhiều tầng tự xong.
5. Số ít, số nhiều cho thông báo làm mới việc lặp lại (EN và VI).
6. Thanh Undo dùng được khi đang mở ô báo cáo sau Shutdown Ritual.

## Tiêu chí nghiệm thu
- [ ] Mỗi lỗi có test tái hiện: đỏ trên code cũ, xanh sau khi sửa (ghi ở Nhật ký).
- [ ] Kiểm lại trên preview bằng thao tác thật.
- [ ] `npm run lint`, `npm test`, test Worker, quét bí mật đều qua trước mỗi commit.
- [ ] Không push, không deploy (Stride Phiên 2 gộp sau B12).

## Xác minh
`npx vitest run` cho test mới; dev server của worktree, thao tác thật trên Chrome.

## Rủi ro & rollback
Mỗi lỗi một commit, hoàn tác được từng commit. Nhánh tách từ `fix/b12-logic` nên phải gộp sau B12.

## Nhật ký

### F09: phím 1, 2, 3 trong Daily Focus vẫn tác động khi đang xem tab Snoozed
- Nguyên nhân: trình nghe phím của `DailyFocusModal.tsx` dùng `currentList[0]`, mà ở tab Snoozed đó là việc đang hoãn đầu tiên: phím 2 dời thêm một bậc, phím 1 đưa về ngay và ghim.
- Sửa: hàm thuần `resolveFocusShortcut` (`utils/dailyFocusKeys.ts`) chỉ trả việc khi đang ở tab Due Today; modal gọi hàm này. Ở tab Snoozed vẫn bấm được nút trên từng việc.
- Test: `src/features/tasks/utils/__tests__/dailyFocusKeys.test.ts`. Trên logic cũ (chép nguyên văn vào hàm): 1 đỏ (tab Snoozed), 2 xanh. Sau khi sửa: 3 xanh.
- Kiểm trên preview (dev server của worktree, dữ liệu mẫu tiếng Anh): gõ "Call the bank @tomorrow" + Enter, mở Daily Focus (Due Today 5, Snoozed 1), sang tab Snoozed, bấm phím 2 thật → việc không đổi (không có `snoozeUntil`, `snoozeLevel`). Sang Due Today, bấm phím 2 → việc đầu tiên được hoãn, tab thành 4 và 2.

### F10: bấm Done trong Daily Focus không có Undo
- Nguyên nhân: `handleMarkDone` gọi thẳng `onToggleTaskDone(..., true)` hoặc `onToggleSubTask`, không có thanh hoàn tác.
- Sửa: `completeFocusItemWithUndo` trong `useTaskManager.ts` chụp bản trước của việc (cả việc cha khi đánh dấu một bước con), đánh dấu xong như cũ, rồi gọi `triggerUndoableAction` với thông báo mới `toast.focusDoneUndo` (EN "Done: "{title}"", VI "Đã xong: "{title}""). Hoàn tác dùng `restoreTaskSnapshot` (`utils/taskSnapshot.ts`): trả đúng bản trước (trạng thái cũ như Doing chứ không phải Todo, việc con, chuỗi ngày), bỏ `updatedAt` để được đóng dấu mới, không hồi sinh việc đã bị xóa; nếu thao tác đã làm việc lên Done thì gỡ dòng nhật ký hoàn thành. Modal nhận prop `onMarkDone`. Hàm đóng dấu mới tách từ Shutdown Ritual (B12) sang `taskSnapshot.ts` để dùng chung.
- Test: `src/features/tasks/utils/__tests__/taskSnapshot.test.ts` (3 ca). Trước khi sửa: đỏ vì chưa có cơ chế khôi phục (module chưa tồn tại). Sau khi sửa: 3 xanh; 61 test của tasks vẫn xanh sau khi Shutdown Ritual chuyển sang hàm dùng chung.
- Kiểm trên preview: Daily Focus, bấm nút Done thật của "Study chapter 3" (Doing) → `done`, có dòng nhật ký, thanh "Done: "Study chapter 3" · Undo (Ctrl+Z)". Bấm Ctrl+Z → `doing`, không còn `completedAt`, dòng nhật ký bị gỡ, hiện "Restored successfully!", việc quay lại Due Today.

## Trạng thái và bước tiếp theo
- Xong: F09, F10.
- Tiếp theo: F11, chuỗi việc con nhiều tầng, chữ số nhiều, Undo sau Shutdown Ritual.

## Tham chiếu
- [B12](./B12-logic-fixes.md)
