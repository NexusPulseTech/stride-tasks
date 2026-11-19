# B12: Sửa lỗi logic việc lặp lại, Daily Focus, Workload Budget và Shutdown Ritual

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | B: Chất lượng |
| Ưu tiên | P1 (người dùng thử dùng việc lặp lại và Daily Focus ngay ngày đầu) |
| Ước lượng | 1 ngày |
| Phụ thuộc | A17 |
| Trạng thái | ◐ 2026-11-19 (đang làm trên nhánh `fix/b12-logic`, chưa gộp, chưa deploy) |

## Mục tiêu
Tám lỗi logic F01 đến F08 trong báo cáo rà soát giao diện và chức năng ngày 2026-11-19 được sửa, mỗi lỗi có test tái hiện chạy đỏ trên code cũ và xanh sau khi sửa.

## Vì sao
Phiên rà soát (chỉ đọc, preview cục bộ, giả lập đồng hồ) thấy việc lặp lại không tự làm mới khi đánh dấu xong bằng ô trạng thái hoặc Kanban, chuỗi ngày bơm được và không bao giờ ngắt, Daily Focus xếp sai việc hôm nay, Workload Budget cộng cả tồn đọng, Shutdown Ritual báo sai và bỏ sót việc. Báo cáo gốc nằm ở kho tài liệu nội bộ của founder (thư mục `stride-qa/2026-11-19_ux-logic`), không đưa vào repo công khai.

## Phạm vi
- Trong phạm vi: F01, F06, F07, F08, F02, F03, F04, F05 (theo thứ tự sửa).
- Ngoài phạm vi: F09 đến F11 (đợt sau), đổi giao diện ngoài những chỗ lỗi cần.

## Các bước
1. F01: một hàm chung ghi nhận việc lặp lại đã xong cho mọi đường đổi trạng thái (vòng tròn, ô trạng thái, Kanban, việc con xong hết đẩy việc cha lên Done, việc con).
2. F06: "Due Today" của Daily Focus chỉ gồm việc đến hạn hôm nay hoặc quá hạn.
3. F07: hoãn và ghim ở việc cha có việc con được Daily Focus tôn trọng.
4. F08: Workload Budget chỉ cộng tải của hôm nay.
5. F02: chuỗi ngày cộng tối đa 1 lần mỗi chu kỳ, bỏ tích thì trả lại, bỏ lỡ một chu kỳ thì về 0.
6. F03: làm mới việc lặp lại khi app để mở qua nửa đêm hoặc quay lại tab.
7. F04, F05: Shutdown Ritual tính kết quả trước khi cập nhật, dời cả nhắc đã quá hạn, theo nhóm trạng thái, có Hoàn tác.

## Tiêu chí nghiệm thu
- [ ] Mỗi lỗi có test tái hiện: đỏ trên code cũ, xanh sau khi sửa (ghi lại ở mục Nhật ký).
- [ ] Kiểm lại trên preview bằng thao tác thật (gõ phím, bấm chuột).
- [ ] `npm run lint`, `npm test`, test Worker, quét bí mật đều qua trước mỗi commit.
- [ ] Không push main, không deploy (Stride Phiên 2 gộp và deploy).

## Xác minh
`npx vitest run src/features/tasks` cho các test mới; preview `npm run dev` hoặc `npm run build && npm run preview`, thao tác thật trên Chrome.

## Rủi ro & rollback
Đổi đường ghi trạng thái dùng chung nên có thể ảnh hưởng mọi nơi đánh dấu xong. Mỗi lỗi một commit, hoàn tác được từng commit.

## Nhật ký

### F01: việc lặp lại đánh dấu xong qua ô trạng thái hoặc Kanban không tự làm mới
- Nguyên nhân: chỉ `toggleTaskDone` (vòng tròn) ghi `lastCompletedDate` và chuỗi. `changeStatus` (ô trạng thái, Kanban, Daily Focus qua ô trạng thái), `changeSubtaskStatus` và `toggleSubTask` (việc con xong hết đẩy việc cha lên Done) không ghi, nên `shouldResetRecurrence` trả false và việc nằm ở Done mãi. Việc con lặp lại đổi bằng ô trạng thái cũng không ghi; `cascadeSubtaskCompleted` ghi ngày theo giờ UTC thay vì giờ máy.
- Sửa: `markRecurringDone` (trong `recurringHelper.ts`) là nơi duy nhất ghi ngày làm xong (giờ máy) và chuỗi. Các bước đổi trạng thái tách thành hàm thuần trong `utils/taskTransitions.ts` (`toggleTaskDoneTransition`, `changeTaskStatusTransition`, `changeSubtaskStatusTransition`, `toggleSubtaskTransition`, `withSubtasks`); hook chỉ gọi các hàm này. Việc chỉ được ghi nhận khi chuyển từ chưa xong sang xong, nên đổi giữa hai trạng thái nhóm done không cộng chuỗi lần nữa. Thêm, xóa, sắp xếp việc con cũng tính lại trạng thái việc cha qua `withSubtasks` (xóa việc con chưa xong cuối cùng thì việc cha lên Done và được ghi nhận; thêm việc con vào việc đã xong thì bỏ `completedAt`). `updateSubtaskStatusInTree` giữ trạng thái tùy chỉnh nhóm done của việc con thay vì ép về `done`.
- Test: `src/features/tasks/utils/__tests__/taskTransitions.test.ts`. Chạy trên logic cũ (các hàm tách nguyên văn từ hook): 9 đỏ, 1 xanh (ca đối chứng việc không lặp lại). Sau khi sửa: 11 xanh.
- Kiểm trên preview (dev server của worktree, Chrome, dữ liệu mẫu tiếng Anh): bấm ô trạng thái của "Plan your day in 10 minutes", chọn Done → `done`, `lastCompletedDate` = 2026-11-19, chuỗi 3 → 4, hai việc con xong. Tải lại cùng ngày vẫn `done`. Tải lại với đồng hồ +26 giờ → `todo`, việc con mở lại. Kanban: Move to Doing → Move to Review → Mark Done → `done`, chuỗi 5, ngày làm xong ghi đúng.
- Chưa làm trong F01: việc con có con được đánh dấu xong do mọi việc con của nó xong (bọt khí nổi trong cây) chưa được ghi nhận chuỗi; hiếm, để lại.

### F06: "Due Today" của Daily Focus xếp việc hẹn ngày mai lên đầu
- Nguyên nhân: `getDailyFocusQueue` đưa mọi việc có giờ nhắc hoặc hạn chót bất kỳ lên trước, không so ngày, và không sắp theo thời điểm.
- Sửa (`utils/spacedSnooze.ts`): `getDueTime` lấy thời điểm đến hạn sớm nhất (hạn chót chỉ có ngày tính tới cuối ngày theo giờ máy). `getWakeTime` cho biết lúc việc quay lại Due Today: hết hoãn, hoặc đầu ngày hẹn nếu ngày đó còn ở tương lai. Due Today chỉ gồm việc không có lúc quay lại; việc đến hạn hôm nay hoặc quá hạn xếp theo thời điểm sớm nhất, trước việc đang làm và việc chưa hẹn. Việc hẹn ngày sau nằm ở tab Snoozed, đếm ngược tới đầu ngày hẹn (`wakeAt`). Việc đã ghim (kể cả bằng nút "1 · Remind Now") luôn ở Due Today, để nút đó vẫn có tác dụng với việc hẹn ngày sau.
- Test: `src/features/tasks/utils/__tests__/dailyFocusQueue.test.ts`. Trên code cũ: 3 đỏ, 1 xanh (ca sáng hôm sau). Sau khi sửa: 5 xanh (thêm ca việc đã ghim).
- Kiểm trên preview: gõ "Call the bank @tomorrow" + Enter trong dự án "Getting started" → nhắc 9:00 mai. Daily Focus: Due Today 4, không có "Call the bank"; tab Snoozed 1, "Call the bank", đếm ngược tới nửa đêm. Bấm "1 · NOW Remind Now" → Due Today 5, Snoozed 0.

### F07: hoãn và ghim ở việc cha có việc con bị Daily Focus bỏ qua
- Nguyên nhân: `resolveActionableItemForTask` trả về bước con tiếp theo và chỉ lấy `snoozeUntil`, `snoozeLevel`, `isPinned` của bước con. Smart schedule ghi hoãn lên việc cha nên việc vẫn ở Due Today, tab Snoozed trống; việc cha đang ghim không được xếp trước.
- Sửa (`utils/spacedSnooze.ts`): việc cha đang hoãn thì mục đại diện là chính việc cha (rời Due Today, sang Snoozed; "Remind Now" ở đó gỡ đúng lần hoãn của việc cha). Hết hoãn thì bước con tiếp theo quay lại, mức hoãn là mức cao hơn của cha và con. Bước con được xếp như việc ghim khi nó hoặc việc cha đang ghim; `pinSource` cho nút ghim trong Daily Focus biết gỡ ghim ở đâu (`DailyFocusModal.tsx`).
- Test: thêm 3 ca vào `dailyFocusQueue.test.ts`. Trên code cũ: 3 đỏ. Sau khi sửa: 8 xanh.
- Kiểm trên preview: nút "Smart schedule / reminder" của "Launch a personal website" (9 việc con, đang ghim) → phím 2 thật → `snoozeUntil` 9:00 mai, mức 2. Daily Focus: Due Today 4, không còn "Write the About page"; Snoozed 1 là "Launch a personal website", Lvl 2, còn 10 giờ.

### F08: Workload Budget cộng toàn bộ backlog và mọi phút Focus từ trước tới nay
- Nguyên nhân: thanh Workload Budget trong `DailyFocusModal.tsx` cộng `estimatedMinutes` của mọi việc chưa xong ở mọi dự án (kể cả việc đang hoãn, hẹn tuần sau) và `focusedMinutes` của mọi việc kể cả việc đã xong.
- Sửa: hàm thuần `computeWorkloadBudget` (`utils/workloadBudget.ts`) cộng ước tính của đúng các việc trong Due Today, mỗi việc một lần (bước con tính theo ước tính của việc cha, vì việc con không có ước tính riêng), và lấy phút Focus của hôm nay từ nhật ký tập trung (`focusLog.summary.todayMinutes`, truyền từ `App.tsx`). Ngưỡng quá tải vẫn là 6 giờ. Bỏ điều kiện luôn đúng `activeDoingCount >= 0` ở nút Shutdown Ritual.
- Test: `src/features/tasks/utils/__tests__/workloadBudget.test.ts`. Trên logic cũ (chép nguyên văn vào hàm): 4 đỏ, 1 xanh (ca quá 6 giờ). Sau khi sửa: 5 xanh.
- Kiểm trên preview (cùng dữ liệu sau F06, F07): trước "~2h 15m · 50m Focus", sau "~45m · 0m Focus · +3 unestimated" = đúng ước tính của "Study chapter 3", việc duy nhất có ước tính trong Due Today; nhật ký tập trung hôm nay 0 phút.

## Trạng thái và bước tiếp theo
- Xong: F01, F06, F07, F08.
- Tiếp theo: F02, F03, F04 và F05.

## Tham chiếu
- [A17](./A17-mobile-trial-fixes.md) (đợt sửa trước, cùng cách làm)
