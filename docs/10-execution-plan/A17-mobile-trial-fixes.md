# A17: Sửa lỗi dùng thử trên điện thoại (từ đợt kiểm đường mua 2026-11-18)

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | A: First Dollar |
| Ưu tiên | P1 (khách từ video ngắn vào bằng điện thoại) |
| Ước lượng | 4 giờ |
| Phụ thuộc | A16 |
| Trạng thái | ◐ 2026-11-19: đã deploy production (founder duyệt; `main` = `36b2c86`, Deploy xanh 07:06:10 UTC). Còn kiểm nút mở bằng trình duyệt ngoài trên https (Instagram, TikTok iOS) |

## Mục tiêu
Người mở app lần đầu trên điện thoại thêm được việc không bị hộp thoại chen ngang, đọc được tên việc và các tab lọc ở màn 390 px, bấm trúng các nút chính, và được nhắc mở app trong Safari hoặc Chrome khi đang ở trình duyệt trong TikTok, Instagram, Facebook.

## Vì sao
Phiên kiểm đường mua (chỉ đọc, iPhone 14 390x844 và Pixel 7 412x915, 4G chậm, production, 2026-11-18) không thấy lỗi chặn mua nhưng thấy:
1. P1-1: nút nổi "Add task" trên điện thoại bật hộp ôn tập ngắt quãng sau MỖI việc mới (`useTaskManager.ts`, nhánh một việc). Hộp dùng thuật ngữ và phím tắt (1, 2, 3, Space, Esc) vô nghĩa trên điện thoại; trong lượt thử, cú bấm thứ hai rơi vào lớp nền của hộp nên việc thứ hai không được tạo. Ô nhập trong dự án không bật hộp này.
2. P1-2: chữ bị cắt ở 390 px: tab lọc thành "Do... / Sch... / D...", tên việc mẫu đầu tiên mất hẳn vì các nhãn (Daily 3d, 0/2, ghim) chiếm hết hàng, chữ gợi ý ô thêm dự án bị cắt, dải thông báo việc mẫu bị cắt.
3. P1-3: 72 (iPhone) và 77 (Android) phần tử bấm được dưới 44 px ở màn đầu; quan trọng nhất là nút PRO 32x30, ngôn ngữ 50x30, menu 30x30, tab lọc cao 28, nút hoàn thành 20x20, mở việc con 16x16, nút trạng thái 38x22, liên kết chân trang cao 17.
4. P2-1: chữ "Ghim" viết cứng trong giao diện tiếng Anh (`AnkiSrsModal.tsx`).
5. P2-2: lần đầu mở app, 5 giây sau đã hiện "5 tasks left to finish today" đếm cả việc mẫu, đứng 10 giây, che nút "Add task".
6. Rủi ro trình duyệt trong ứng dụng (TikTok, Instagram, Facebook): dữ liệu lưu trong bộ nhớ riêng của trình duyệt đó, khách mở lại bằng Safari hoặc Chrome sẽ không thấy; trang thanh toán mở bằng cửa sổ mới có thể bị chặn.

7. Bốn lỗi đúng/sai do phiên quay cảnh phát hiện (phiên Cố vấn chuyển 2026-11-18, gộp vào đợt này): tab "Doing" đếm mọi việc chưa xong kể cả Todo ("Doing 11" trong khi Kanban ghi In progress 3); số WIP của báo cáo cuối ngày sai cùng nguyên nhân; tab Scheduled chỉ lọc dự án, không lọc từng việc nên vẫn hiện việc chưa hẹn và việc đã xong; trên desktop ô tìm kiếm cuối hàng công cụ bị cắt (hàng cần khoảng 800 px trong cột 640 px).

Founder chọn sửa cả 6 mục ngày 2026-11-18 (banner trình duyệt trong ứng dụng làm bản tối thiểu, phần còn lại chờ nghiên cứu của phiên Cố vấn), và duyệt deploy một lần sau khi xong.

## Quyết định
1. Thêm việc bằng nút nổi không bật hộp ôn tập nữa. Hộp vẫn mở được như cũ từ menu của việc, Tiêu điểm hôm nay, bảng lệnh. Không đổi thuật toán.
2. Hàng việc (danh sách dự án, Ưu tiên, việc con): phần tên và nhãn được xuống dòng trên màn hẹp (`flex-wrap`, giữ một dòng từ `sm`), nên tên việc luôn có chỗ; nhãn xuống dòng dưới khi không đủ chỗ.
3. Hàng công cụ trên điện thoại chia 2 dòng: dòng 1 là 4 tab lọc cao 44 px và nút ẩn việc xong; dòng 2 là chuyển danh sách/Kanban, Tiêu điểm hôm nay, bảng lệnh, tìm kiếm, cao 44 px. Từ `sm` giữ như cũ.
4. Nút đầu trang trên điện thoại cao 40 px, vùng chạm 44 px; nút PRO hiện chữ "PRO" cạnh vương miện ở mọi kích thước.
5. Nút nhỏ trong hàng việc (hoàn thành, mở việc con, thêm việc con, trạng thái, thêm) giữ nguyên hình nhưng vùng chạm được nới bằng lớp giả `::after` chỉ trên màn cảm ứng (`@media (pointer: coarse)`, lớp `touch-hit`). Nút hoàn thành và mở việc con đứng sát nhau nên chỉ nới tới 40 và 36 px để không chồng lấn quá nhiều; khoảng cách giữa chúng tăng trên điện thoại.
6. Chữ gợi ý ô thêm dự án rút ngắn; dải thông báo việc mẫu được xuống dòng; liên kết chân trang có đệm dọc trên điện thoại.
7. "Ghim" thành "Pin" ở giao diện tiếng Anh.
8. Nhắc việc định kỳ không chạy khi dữ liệu vẫn đúng là bộ việc mẫu (`isSampleTemplate`).
9. Banner trình duyệt trong ứng dụng (bản tối thiểu): nhận diện TikTok, Instagram, Facebook, Messenger, Zalo, LINE qua User-Agent (hàm thuần có test); hiện ở đầu app một dòng giải thích ngắn, nút "Copy link", trên Android thêm nút mở bằng Chrome (`intent://`), trên iPhone ghi cách mở (nút ••• rồi mở bằng trình duyệt). Có nút ẩn trong phiên. Không theo dõi, không gửi gì về máy chủ.
10. `isDoingStatus` chỉ gồm nhóm đang làm (khớp cột In progress của Kanban); chỗ cần "chưa xong" (chế độ Focus, mục "In progress and next up" của báo cáo) dùng `!isDoneStatus`. Số WIP của báo cáo chỉ đếm việc đang làm. Bộ lọc danh sách gom vào hàm thuần `taskMatchesListFilter` (có test), tab Scheduled lọc từng việc bằng `isScheduledTask` dùng chung với số đếm. Hàng công cụ được xuống dòng ở mọi kích thước, nhóm nút phải canh phải.

## Phạm vi
- Trong: `useTaskManager.ts`, `AnkiSrsModal.tsx`, `useSmartReminder.ts`, `ActionBar.tsx`, `AppHeader.tsx`, `TaskItem.tsx`, `PinnedSection.tsx`, `SubTaskRow.tsx`, `TaskStatusButton.tsx`, `EmergencyRecoveryBanner.tsx`, `AppFooter.tsx`, `src/index.css`, bộ dịch EN/VI, thành phần banner mới và test.
- Ngoài: đổi nút "Restore earlier data" (P2-3), ô tạo việc ở trên cùng (P2-4), khung chờ khi tải app (P2-6), giữ utm qua CTA (P2-7), VietQR, sửa toàn bộ 72 phần tử nhỏ.

## Tiêu chí nghiệm thu
- [x] Thêm 3 việc liền bằng nút nổi trên điện thoại: không hộp nào bật, cả 3 việc được tạo (bản dev, 390x844, 2026-11-19).
- [x] Ở 390 px: 4 tab đọc đủ chữ; tên việc mẫu đầu tiên hiện đủ ("Plan your day in 10 minutes"), nhãn xuống dòng dưới; dải thông báo việc mẫu xuống dòng.
- [x] Ở 390 px: tab lọc và nút dòng công cụ cao 44 px; nút PRO (có chữ), ngôn ngữ, menu cao 40 px với vùng chạm 44 px; 26 nút nhỏ có vùng chạm nới (nhỏ nhất 36 px là mũi tên mở việc con, đứng sát nút hoàn thành 40 px). Còn nhỏ, chấp nhận: nút ở đầu thẻ dự án (cả đầu thẻ bấm được để thu gọn), liên kết trong tên việc. Desktop giữ nguyên trừ hàng công cụ.
- [x] Giao diện tiếng Anh không còn "Ghim"; lần đầu mở app với dữ liệu mẫu, sau 7 giây không hiện nhắc việc (khi đã có việc thật thì nhắc như cũ).
- [x] Banner chỉ hiện với User-Agent của trình duyệt trong ứng dụng (test `src/utils/__tests__/inAppBrowser.test.ts`); giả UA TikTok iPhone: banner "Open Stride in Safari" nằm trên ô thêm dự án. Nút mở bằng Safari/Chrome chỉ có trên https (kiểm trên production sau deploy).
- [x] Tab Doing đếm 2 với dữ liệu mẫu (khớp Kanban); test `statusCategory.test.ts` cho Doing, Scheduled, Completed, All, Focus, tìm kiếm; ô tìm kiếm hiện đủ ở desktop 1920 px.
- [x] Vùng chạm đạt WCAG 2.2 SC 2.5.8 (tối thiểu 24 px) ở 390 và 412 px (đo lại 2026-11-19, xem bên dưới).
- [x] Lint, test app (99/99), test Worker (45/45), quét bí mật qua; kiểm trên trình duyệt EN/VI, sáng/tối, 390, 412 px và desktop 1280 px: không phần tử nào bị khung cắt.
- [x] Founder duyệt rồi mới deploy (2026-11-19, push 07:05:32 UTC, Deploy xanh 07:06:10 UTC).

## Kiểm sau deploy (2026-11-19, production)
- Bundle mới `index-DieLmWn1.js` được phục vụ từ 07:06:43 UTC.
- 390 và 412 px: 0 vùng chạm không đạt SC 2.5.8, 0 phần tử bị khung cắt, không có lỗi console mới.
- Lighthouse mobile (trợ năng, best practices, SEO): Accessibility 78 lên 83 (mục `target-size` qua), Best Practices 96, SEO 100 không đổi. Slow 4G, cache lạnh: LCP 2644 ms (trước 2656 ms), CLS 0, 211 KB (trước 208 KB).
- Ngoại tuyến: 07:10 đến 07:13 UTC trượt 3/3 (service worker không cài được); 07:21 UTC đạt 2/2, thêm việc khi mất mạng rồi tải lại vẫn còn. Lỗi trượt là `sw.js` cũ ở cache biên Cloudflare sau deploy (B11, lỗi 1), không do A17: A17 không đổi cấu hình build hay service worker, và cùng bản A17 chạy ở máy thì đạt.

## Đo lại vùng chạm theo WCAG 2.2 SC 2.5.8 (2026-11-19)
- Cách đo: Chrome giả lập cảm ứng (`pointer: coarse`), dữ liệu mẫu, đo vùng nhận chạm thật bằng `elementFromPoint` theo hàng ngang và cột dọc qua tâm (tính cả vùng nới `::after` của `.touch-hit` và phần bị nút bên cạnh che); mục dưới 24 px thì áp ngoại lệ khoảng cách (vòng tròn đường kính 24 px quanh tâm không chạm mục tiêu khác). Con số 40 của lần đo trước tính theo khung hình, chưa tính vùng nới.
- Trước khi sửa (390 px): 74 mục tiêu, 17 mục có một chiều dưới 24 px, 11 đạt nhờ khoảng cách, 6 không đạt: 4 mũi tên mở việc con (vùng chạm thật 20 đến 22 px do vùng nới của nút hoàn thành đè lên) và cặp "chuyển dự án xuống" 20 px, "dán nhanh" 22 px đứng sát nhau ở đầu thẻ dự án.
- Sửa (chỉ trên màn cảm ứng, desktop không đổi): mũi tên mở việc con thêm `pointer-coarse:mr-1.5`; 5 nút ở đầu thẻ dự án thành `pointer-coarse:p-1.5` (24 đến 26 px). Khoảng cách mới làm nhãn "0/2" bị cắt 5 px, nên nhóm nhãn cạnh tên việc được xuống dòng trên màn hẹp (`flex-wrap max-w-full`, giữ một dòng từ `sm`); trước đây nhóm này cũng sẽ bị cắt khi một việc có nhiều nhãn.
- Sau khi sửa: 390 và 412 px, EN và VI, sáng và tối: 0 mục không đạt; 5 mục cao 22 px đạt nhờ khoảng cách (4 huy hiệu số việc con, 1 liên kết trong tên việc, vốn thuộc ngoại lệ inline). Kiểm bằng phép tính: 0 phần tử bị khung cắt ở 390, 412 và 1280 px; đã thử trả nhóm nhãn về kiểu cũ thì bộ kiểm tra báo đúng "0/2" bị cắt.

## Rủi ro & rollback
- Đổi bố cục có thể làm lệch giao diện desktop: mọi thay đổi bố cục chỉ áp dụng dưới `sm` (640 px) hoặc với `pointer: coarse`; kiểm desktop trước khi gửi duyệt.
- Nhận diện User-Agent có thể sót hoặc nhầm: banner chỉ là lời nhắc, ẩn được, không chặn dùng app.
- Rollback: revert commit.
