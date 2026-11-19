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

### F11: nhãn hệ số giãn cách không khớp ("Good (×2.3)" ở Smart schedule, 2.2 trong code)
- Nguyên nhân: `SmartScheduleModal.tsx` viết cứng "×2.3"; `spacedSnooze.ts` viết cứng "×2.2" trong nhãn của lựa chọn thứ hai; hằng số thật là 2.2.
- Sửa: `spacedSnooze.ts` xuất `SNOOZE_GROWTH_FACTOR` (2.2) và `SNOOZE_GROWTH_LABEL` ("×2.2"); nhãn trong `getAnkiSrs3Options` và Smart schedule đọc từ đó. Chỉ đổi con số; chữ Good, Anki và các nhãn khác giữ nguyên cho đợt B13.
- Test: `src/features/tasks/utils/__tests__/snoozeGrowthLabel.test.ts` (không file mã nguồn nào viết cứng "×" kèm số; nhãn dùng chung khớp hệ số và có trong lựa chọn thứ hai). Trước khi sửa: 2 đỏ (2 file viết cứng, chưa có hằng số xuất ra). Sau khi sửa: 2 xanh.
- Kiểm trên preview: mở "Smart schedule / reminder" của một việc → lựa chọn 2 ghi "Good (×2.2)", không còn "×2.3".

### Chuỗi của việc con nhiều tầng tự chuyển sang xong
- Nguyên nhân: khi mọi con của một việc con đã xong, `subtaskTree.ts` chỉ đặt `completed: true` cho việc con đó (bọt khí nổi) ở 4 chỗ (tích, thêm, xóa, đổi trạng thái), không qua `markRecurringDone`, nên việc con lặp lại không được cộng chuỗi và không có ngày làm xong để làm mới hôm sau.
- Sửa: hàm `withBubbledCompletion` dùng chung cho mọi chỗ bọt khí nổi: vừa chuyển sang xong thì ghi nhận chuỗi, vừa rời trạng thái xong thì trả chuỗi (`unmarkRecurringDone`), như khi tích tay.
- Test: 3 ca mới trong `taskTransitions.test.ts`. Trước khi sửa: 2 đỏ (tích bước cuối, đổi bước cuối sang Done bằng ô trạng thái), 1 xanh (bỏ tích, vì trước đó chưa từng được cộng). Sau khi sửa: 3 xanh, 66 test của tasks xanh.
- Kiểm trên preview (thêm trước khi app chạy việc con lặp lại "Morning routine" chuỗi 2, làm lần cuối hôm qua, có 2 bước con "Stretch" đã xong và "Plan the day" chưa xong, trong "Launch a personal website"): mở việc con, bấm ô tích thật của "Plan the day" → "Morning routine" tự xong, chuỗi 3, ngày 2026-11-20. Bấm lại để bỏ tích → chuỗi 2, ngày 2026-11-19.

### Câu "Refreshed 1 recurring tasks" sai số ít, số nhiều
- Nguyên nhân: thông báo làm mới việc lặp lại chỉ có một dạng số nhiều.
- Sửa: thêm khóa `toast.recurringRolledOverOne` (EN "Refreshed {count} recurring task for today.", VI giữ câu như dạng nhiều vì tiếng Việt không đổi theo số), theo mẫu có sẵn `hiddenCompletedCount` và `hiddenCompletedCountOne`. Hàm `rolloverNotice` (`utils/rolloverNotice.ts`) chọn dạng bằng `pluralize`; `useTaskCRUD` dùng hàm này.
- Test: `src/features/tasks/utils/__tests__/rolloverNotice.test.ts` (EN và VI, 1 và 3 việc). Trên logic cũ (chép nguyên văn vào hàm): 1 đỏ (EN), 1 xanh (VI). Sau khi sửa: 2 xanh; test bộ chữ (cùng khóa, cùng biến ở EN và VI) vẫn xanh.
- Kiểm trên preview (trang có đồng hồ chỉnh được): bấm vòng tròn "Plan your day", đẩy đồng hồ sang 7:30 hôm sau và quay lại tab → "Refreshed 1 recurring task for today."

### Thanh Undo nằm ngoài vùng `aria-modal`
- Nguyên nhân: `UndoSnackbar` luôn gắn vào `document.body`. Khi đang mở hộp thoại `aria-modal="true"` (ô báo cáo mở ngay sau Shutdown Ritual, hay Daily Focus khi bấm Done ở F10), trình đọc màn hình coi phần ngoài hộp thoại là không dùng được, nên không tới được nút Undo.
- Sửa: hàm `undoSnackbarHost` (`components/feedback/undoSnackbarHost.ts`) chọn hộp thoại `aria-modal` trên cùng (z-index cao nhất, bằng nhau thì hộp mở sau), không có thì `body`. `UndoSnackbar` gắn vào đó và theo dõi DOM (MutationObserver, chỉ khi thanh đang hiện) để đổi chỗ khi hộp thoại mở hoặc đóng; thêm `role="status"` và `aria-live="polite"` để thông báo được đọc lên. Sự kiện bấm trong portal đi theo cây React nên không đóng nhầm hộp thoại.
- Test: `src/components/feedback/__tests__/undoSnackbarHost.test.ts` (không có hộp thoại, ô báo cáo trên Daily Focus, chỉ Daily Focus). Trên logic cũ (luôn trả `body`): 2 đỏ, 1 xanh. Sau khi sửa: 3 xanh.
- Kiểm trên preview: bấm Shutdown Ritual thật; đo trong trang mỗi 300 ms: lúc đầu thanh ở `body` (chưa có hộp thoại), khi ô báo cáo mở thì thanh chuyển vào hộp thoại "Markdown report". Cây truy cập (snapshot) có nút "Undo the last action (Ctrl+Z)" trong hộp thoại; lúc làm B12 cây này không có nút. Phép thử điểm chạm ở tâm nút trả đúng nút, khung nút đứng yên qua 2 khung hình, `visibility` và `pointer-events` bình thường. Bấm Done trong Daily Focus: vùng `status` với nút Undo nằm trong hộp thoại Daily Focus. Công cụ bấm của DevTools báo hết giờ chờ với nút Undo và cả với một nút menu bình thường trên cùng tab ("Delete task"), nên phần bấm được kiểm bằng phép thử điểm chạm và bằng Ctrl+Z (đã kiểm ở F05 của B12 và F10), không bằng cú bấm chuột của công cụ.

## Trạng thái và bước tiếp theo
- Xong: F09, F10, F11, chuỗi việc con nhiều tầng, chữ số nhiều, Undo trong hộp thoại.
- Tiếp theo: bàn giao Stride Phiên 2 (gộp sau B12) và báo Cố vấn.

## Tham chiếu
- [B12](./B12-logic-fixes.md)
