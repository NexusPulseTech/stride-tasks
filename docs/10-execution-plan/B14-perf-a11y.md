# B14: Hiệu năng, PWA và trợ năng sau đợt kiểm 19/11

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | B: Foundation |
| Ưu tiên | P1 |
| Ước lượng | B14a 0,5 ngày · B14b 1,5 ngày |
| Phụ thuộc | A17, B11; B14b chờ B12 gộp lên `main` |
| Trạng thái | ◐ 2026-11-20 (B14a đang làm trên nhánh `fix/b14a-notify-webp`) |

## Trạng thái và bước tiếp theo
- **B14a** (nhánh `fix/b14a-notify-webp`, worktree `../stride-wt-b14`, tách từ `main` 20a7a9e): mục 1 (thông báo nhắc việc) xong và đã commit; đang làm mục 2 (ảnh WebP trang đích). Xong thì bàn giao Stride Phiên 2, phiên duy nhất gộp và deploy. Không push, không deploy từ nhánh này.
- **B14b**: chưa bắt đầu. Bắt đầu sau khi B12 gộp lên `main`, tách nhánh mới từ `main` lúc đó.
- Phiên nào tiếp quản: đọc mục "Các bước", làm tiếp mục đầu tiên chưa đánh dấu; mỗi mục một commit có cập nhật file này.

## Mục tiêu
- B14a: nhắc việc hiện được thông báo hệ thống trên điện thoại, và khi không hiện được thì app nói đúng sự thật; trang đích `/vi/` trên mobile tải dưới 150 KB thay vì 537 KB, LCP không tăng.
- B14b: các luồng chính dùng được bằng bàn phím và trình đọc màn hình, đạt các tiêu chí WCAG 2.2 AA mà đợt kiểm báo trượt ở mức P1.

## Vì sao
Đợt kiểm hiệu năng, PWA và trợ năng ngày 19 và 20/11/2026 trên production (bản A17). Báo cáo đầy đủ nằm ở HQ: `stride-qa/2026-11-19_perf-pwa/BAO-CAO.md` và `stride-qa/2026-11-19_a11y/BAO-CAO.md`. Tóm tắt:
- **Thông báo nhắc việc (P1):** `useSmartReminder.ts` gọi `new Notification(...)` trong `try { } catch (e) {}`. MDN: "This constructor throws a TypeError when called in nearly all mobile browsers... you need to register a service worker and use ServiceWorkerRegistration.showNotification()". Trên Android người dùng cấp quyền, thấy toast "Periodic reminders enabled!", rồi mọi lần nhắc lỗi bị nuốt im lặng.
- **Ảnh trang đích (P1):** ảnh chụp màn hình là PNG 1280 px, không có WebP, không có `srcset`. Lighthouse mobile `/vi/` tải 537 KB, 3 PNG chiếm 500 KB. WebP 828 px đo bằng bộ mã hóa của Chrome: ảnh LCP 106 KB còn 18 KB.
- **Trợ năng (P1, B14b):** modal không nhận và không giữ focus; tab "All" chỉ nghe sự kiện pointer; popover trạng thái và menu Options không đi được bằng bàn phím; 3 `select` và nút "+" trên mobile không có tên; toast không có live region; chữ phụ trượt tương phản ở cả hai giao diện; vùng chạm khung desktop dưới 24 px (`touch-hit` chỉ ở `pointer: coarse`); tên đọc không chứa chữ nhìn thấy ở 4 loại nút.

## Phạm vi
- Trong phạm vi B14a:
  1. Hàm dùng chung `src/utils/systemNotification.ts`: ưu tiên `ServiceWorkerRegistration.showNotification()`, chỉ dùng constructor khi không có service worker, trả kết quả thật (`shown`, `unsupported`, `denied`, `failed`), ghi `console.warn` khi lỗi. Thay mọi chỗ gọi `new Notification(...)`. `useSmartReminder` giữ kênh thật (`system` hoặc `in-app`); bật nhắc việc thì gửi một thông báo xác nhận, chỉ báo "đã bật" khi thông báo đó hiện được, nếu không thì báo nhắc việc chỉ hiện trong app; menu Options hiện "ON" hoặc nhãn "trong app" theo kênh thật. Test đơn vị cho hàm mới.
  2. Ảnh trang đích: thêm WebP 828 và 1280 px cho 6 ảnh chụp màn hình trong `public/screenshots/` và `public/screenshots/vi/`, dùng `<picture>` với `srcset` và `sizes` theo bề rộng thật trong `public/site.css`, giữ PNG làm dự phòng, giữ `width`/`height`, `fetchpriority`, `loading`. Đo lại Lighthouse mobile `/vi/`.
- Trong phạm vi B14b: hook `useDialogFocus` dùng chung cho các modal; tab All nhận Enter/Space và `aria-pressed` cho tab lọc, List/Kanban; popover trạng thái dùng `button`; menu Options theo mẫu disclosure; nhãn cho axe critical (`button-name`, `select-name`, `aria-required-children`); màu chữ đạt 4,5:1; live region cho toast; vùng chạm 24 px cho chuột; label in name. Chi tiết và số dòng ở báo cáo trợ năng.
- Ngoài phạm vi:
  - Đổi chữ trên giao diện theo định vị mới, kể cả nhãn Anki/Good/Easy (B13). B14 chỉ thêm khóa i18n mới cần cho mục 1.
  - Thanh Undo sau Shutdown nằm ngoài `aria-modal` (Phiên Main làm ở B15).
  - Cache Rule cho `/assets/`, `/workbox-`, `/screenshots/`, `/media/` (Browser TTL 1 năm): chỉ đề xuất cho Phúc, không tự đổi cài đặt Cloudflare.
  - Nhắc việc khi app đã đóng (cần Web Push và máy chủ).

## Các bước
1. [x] B14a mục 1 (2026-11-20): `src/utils/systemNotification.ts` (8 test), `src/features/tasks/utils/reminderChannel.ts` (hàm thuần chọn kênh và thông điệp, 7 test), `useSmartReminder.ts` dùng hai hàm này và giữ `channel`; `useCelebrationAndStreak.ts` cũng chuyển sang hàm dùng chung; menu Options ghi "ON", nhãn trong app (`header.reminderInApp`) hoặc "OFF"; khóa mới `toast.systemNotifyFailed`. Khi bật nhắc việc: gửi một thông báo xác nhận, rồi kiểm việc chờ mà không gửi thêm thông báo hệ thống (tránh hai thông báo cùng lúc).
   - Kiểm trên bản build local (`vite preview`, Chrome 157, quyền thông báo cấp qua CDP): (a) desktop có SW: toast "Periodic reminders enabled!", menu "ON"; (b) giả lập điện thoại, constructor ném `TypeError` như Chrome Android, SW chạy: thông báo xác nhận đi qua `registration.showNotification` đúng 1 lần, toast "Periodic reminders enabled!", không có cảnh báo; (c) giả lập điện thoại và `showNotification` cũng lỗi: toast "System notifications didn't show on this device...", menu "In-app", console có `[notify] registration.showNotification() failed`.
   - Ghi nhận cho đợt sau, không sửa ở B14a: `useCelebrationAndStreak.ts` còn một vòng nhắc riêng 20 phút theo khóa cũ `SOLO_REMINDER_V1` (mặc định tắt, chỉ chạy với người dùng bản rất cũ từng bật); với họ, desktop có thể nhận hai luồng nhắc. Đề xuất gỡ vòng này khi dọn mã.
2. [ ] B14a mục 2: WebP và `<picture>` cho `public/en/index.html`, `public/vi/index.html`; đo lại.
3. [ ] B14a: bàn giao Stride Phiên 2.
4. [ ] B14b (sau khi B12 gộp): theo thứ tự trong báo cáo trợ năng.

## Tiêu chí nghiệm thu
- [ ] Không còn `new Notification(` ngoài `systemNotification.ts`.
- [ ] Test đơn vị: có service worker thì gọi `showNotification`; không có thì dùng constructor; quyền chưa cấp thì `denied`; không có API thì `unsupported`; lỗi thì `failed` và có `console.warn`.
- [ ] Bật nhắc việc khi thông báo hệ thống không hiện được: toast nói rõ chỉ nhắc trong app, menu không ghi "ON" trơn.
- [ ] Lighthouse mobile `/vi/` sau deploy: dung lượng dưới 150 KB, LCP không tăng so với 2055 ms, CLS 0.
- [ ] `npm run lint`, `npm test`, test Worker xanh; quét diff không có mảnh khóa.

## Xác minh
- `npm test -- systemNotification`.
- Android thật (Chrome): bật nhắc việc trong menu Options, cho phép thông báo: thấy thông báo xác nhận của hệ thống. Từ chối quyền: toast báo chỉ nhắc trong app, menu ghi nhãn trong app.
- Sau deploy: Lighthouse mobile `/vi/` 3 lần, lấy trung vị (cùng cách đo ở báo cáo hiệu năng).

## Rủi ro & rollback
- Thông báo xác nhận khi bật nhắc việc là hành vi mới; nếu Phúc thấy phiền thì bỏ, nhưng khi đó không còn cách xác nhận kênh hệ thống chạy được trước lần nhắc đầu tiên.
- WebP chất lượng 0,8 có thể làm mờ chữ nhỏ trong ảnh chụp: xem bằng mắt trước khi gộp; PNG vẫn là dự phòng nên trình duyệt không hỗ trợ WebP không bị ảnh hưởng.
- Rollback: `git revert` từng commit; không đổi dữ liệu người dùng, không đổi khóa localStorage.

## Tham chiếu
- MDN, Notification(): https://developer.mozilla.org/en-US/docs/Web/API/Notification/Notification
- MDN, ServiceWorkerRegistration.showNotification(): https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification
- web.dev, responsive images: https://web.dev/articles/serve-responsive-images
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
