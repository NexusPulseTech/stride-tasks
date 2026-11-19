# B11: Service worker cài lỗi không bị nuốt, tự thử lại, và kiểm ngoại tuyến tự động

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | B: Foundation |
| Ưu tiên | P0 (lời hứa "chạy ngoại tuyến" trong bộ đăng thư mục) |
| Ước lượng | 0,5 ngày |
| Phụ thuộc | B04 |
| Trạng thái | ◐ 2026-11-19 (xong trên nhánh, chờ gộp và deploy) |

## Mục tiêu
Khi service worker (SW) cài lỗi, app ghi lỗi rõ ràng và tự thử cài lại một lần thay vì im lặng mất chế độ ngoại tuyến. Có một lệnh kiểm tự động chứng minh app thật sự chạy ngoại tuyến: tải trang, SW activated, cắt mạng, tải lại, app mở được, gõ được việc và việc còn sau khi tải lại.

## Vì sao
Lúc chụp ảnh cho thư mục phần mềm, SW trên production nhiều lần không cài được. Chrome 157 ghi trong console của `sw.js`:

```
Uncaught (in promise) InvalidAccessError: Failed to execute 'put' on 'Cache': Entry already exists.
```

Worker đi `installing > redundant`, `navigator.serviceWorker.controller` luôn null, cache `workbox-precache-v2-…` có 0 mục. Khi cắt mạng, trang có thể vẫn hiện nhờ bộ đệm HTTP, nhưng chunk tải lười (hộp hướng dẫn) làm app trắng trang.

Dòng thời gian (giờ Việt Nam):

| Thời điểm | Kết quả |
| :--- | :--- |
| 18/11 03:05 đến 03:25 | Lỗi, mọi lần thử (headless, headed, hồ sơ mới) |
| 18/11 khoảng 13:50, 14:05, 14:20 | Lỗi trong 3 lần chụp đầy đủ (SW không active sau 32 giây, kể cả khi tải lại) |
| 18/11 14:10 đến 14:25 | Phiên 6b kiểm cùng máy, hồ sơ khác: sạch, SW activated sau khoảng 2 giây |
| 19/11 01:34 đến 01:38 | Lỗi 5/5 lần (`swlog.mjs`) |
| 19/11 01:38 đến 01:41 | Lẫn lộn: 4 lỗi, 5 sạch |
| 19/11 01:42 đến 01:47 | Sạch 15/15 lần, ba vị trí hồ sơ |
| 19/11 14:05 | Lỗi trên **bản build local** (`vite preview`, 127.0.0.1:4317) với `sw.js` gốc: lần cài đầu và lần thử lại 10 giây sau đều thất bại, code B11 ghi đủ hai dòng `[sw]` |
| 19/11 14:06 đến 14:10 | Sạch 12/12 lần trên bản build local, ba kiểu đường dẫn hồ sơ |

Đã loại trừ:
- Đăng ký hai lần: chỉ có một lệnh `register` (`src/main.tsx`), `injectRegister: false` nên vite-plugin-pwa không chèn thêm.
- Manifest precache hỏng: 27 mục, không trùng URL, đều trả 200, không chuyển hướng (kể cả có `?__WB_REVISION__`).
- CSP chặn trong SW: header của `sw.js` chỉ có `frame-ancestors`.
- App tự ghi vào Cache API: không có (chỉ có IndexedDB).
- Đường dẫn hồ sơ Chrome (ổ C hay D, Temp hay không, có dấu `\` cuối hay không): kiểm có kiểm soát, cùng một dạng lúc lỗi lúc sạch.
- Chạy đua do deploy liên tục (giả thuyết của phiên 6b): deploy cuối lúc 18/11 03:03, nhưng lỗi vẫn xuất hiện lúc 14:00 và 19/11 01:35, cách hơn 10 và 22 giờ không có deploy nào.
- CDN trả các bản `sw.js` khác nhau: lỗi tái hiện cả trên bản build local không qua CDN (19/11 14:05); `sw.js` trên production trả cùng một bản 8/8 lần.

Kết luận: lỗi có thật, nằm **phía trình duyệt**, xuất hiện thành từng đợt vài phút trên máy này rồi tự hết; không gây ra được theo ý muốn nên **chưa xác định được nguyên nhân gốc**. Ứng viên, chưa chứng minh: Cache Storage của Chrome ghi lỗi khi máy tải nặng (máy chạy nhiều phiên build, test, Chrome cùng lúc) hoặc phần mềm quét file can thiệp lúc Chrome ghi bộ đệm. Người dùng thật cũng có thể gặp khi máy bận; hậu quả là mất chế độ ngoại tuyến tới lần cài thành công sau. Vì chưa có nguyên nhân, B11 **không** đổi cấu hình Workbox hay `cacheId` (`cleanupOutdatedCaches` không xóa cache khác `cacheId`), chỉ làm lỗi hiện rõ, tự thử lại và có kiểm tự động.

## Phạm vi
- Trong phạm vi:
  - `src/utils/registerServiceWorker.ts`: đăng ký SW, không nuốt lỗi (`register` bị từ chối thì `console.warn` kèm lỗi), theo dõi worker đang cài. Hai nhánh (xem mục "Đối chiếu spec"):
    - (a) Lần cài đầu thất bại, chưa có worker active: `console.error`, gọi lại `register()` đúng một lần sau 10 giây.
    - (b) Bản cập nhật cài thất bại khi đã có worker active: bản cũ vẫn phục vụ; `console.warn`, gọi `registration.update()` đúng một lần, lỗi của lần đó cũng được ghi.
    - Test đơn vị cho cả hai nhánh, cho việc không đếm trùng một worker (Chrome bắn `updatefound` cho chính worker `register` vừa trả về) và cho lỗi bị từ chối.
  - `scripts/offline-check.mjs` và `npm run check:offline`: Chrome hồ sơ tạm qua giao thức DevTools, không cần thư viện. Pha 1 có mạng: chờ SW activated, điều khiển trang và cache precache có mục. Pha 2 mở lại cùng hồ sơ qua proxy chết (kể cả localhost) nên trang lẫn SW đều mất mạng thật: app mở được, yêu cầu mạng thất bại, gõ việc thật, tải lại vẫn còn việc đó, mở hộp Daily Focus (chunk tải lười).
  - `health-check.yml`: thêm job chạy kiểm này trên production mỗi 6 giờ.
- Ngoài phạm vi: đổi cấu hình Workbox, `cacheId`, chiến lược cache; tự xóa cache khi lỗi (chưa có bằng chứng là cần).

## Đối chiếu spec (đọc ngày 2026-11-19)

Nguồn: W3C Service Workers, Editor's Draft, 17 November 2026, https://w3c.github.io/ServiceWorker/

- Install, bước 2: "Let newestWorker be the result of running Get Newest Worker algorithm passing registration as its argument." Bước này chạy trước khi gán worker đang cài, nên với lần cài đầu newestWorker là null.
- Install, bước 12 (installFailed): 12.1 đưa worker đang cài sang "redundant"; 12.2 "Run the Update Registration State algorithm passing registration, "installing" and null as the arguments."; 12.3 "If newestWorker is null, then remove registration map[...]".
- `update()`, bước 3: "If newestWorker is null, return a promise rejected with an "InvalidStateError" DOMException and abort these steps."
- Get Newest Worker trả về installing, rồi waiting, rồi active, nếu không có thì null.

Suy ra: lần cài đầu thất bại thì registration bị gỡ (Chrome có thể vẫn giữ đối tượng registration, nhưng không còn worker nào), `update()` bị từ chối, nên nhánh (a) phải gọi lại `register()`. Khi đã có worker active thì newestWorker khác null, `update()` hợp lệ, nên nhánh (b) dùng `update()`.

## Các bước
1. Viết tài liệu này.
2. Tách đăng ký SW sang `registerServiceWorker.ts`, viết test, gọi từ `main.tsx`.
3. Viết `scripts/offline-check.mjs`, thêm script npm và job health-check.
4. Kiểm trên bản build local (`npm run build`, `npx vite preview --port 4317 --strictPort --host 127.0.0.1`): `npm run check:offline -- http://127.0.0.1:4317/`.
5. Kiểm production bằng cùng lệnh, chụp lại ảnh 04 "ngoại tuyến" cho bộ đăng thư mục.
6. `npm run lint`, `npm test`, test Worker, quét bí mật; commit trên nhánh `fix/sw-precache`. Stride Phiên 2 (phiên deploy duy nhất) duyệt, gộp, deploy sau khi Phúc đồng ý.

## Trạng thái và bước tiếp theo
- 2026-11-19: xong toàn bộ phần code trên nhánh `fix/sw-precache`, chưa gộp, chưa deploy.
  - `registerServiceWorker.ts` hai nhánh (a) và (b), 6 test; `main.tsx` dùng hàm mới.
  - `scripts/offline-check.mjs`, `npm run check:offline`, job `offline` trong `health-check.yml`, runbook triển khai mục 1 bước 5.
  - Ảnh 04 ngoại tuyến đã chụp trên production lúc khoảng 01:55 (SW active, 27 mục precache, cắt mạng thật).
- Kết quả kiểm: xem mục "Xác minh".
- Tiếp theo (Stride Phiên 2): duyệt, gộp, deploy; sau deploy chạy `npm run check:offline` và chạy job `offline` một lần bằng `workflow_dispatch` (tiêu chí cuối). Nếu lỗi `Entry already exists` quay lại, ghi giờ và chạy `swlog.mjs` để bổ sung dòng thời gian.

## Tiêu chí nghiệm thu
- [x] Không còn `.catch(() => {})` nuốt lỗi đăng ký SW; lỗi đăng ký và lỗi cài SW hiện trong console với tiền tố `[sw]`.
- [x] Cài lỗi lần đầu thì tự đăng ký lại đúng một lần, không lặp vô hạn (test đơn vị, và đã thấy trong Chrome thật).
- [x] `npm run check:offline` đạt trên bản build local, và **trượt** đúng khi SW hỏng.
- [x] `npm run check:offline` đạt trên production.
- [ ] Job `offline` trong `health-check.yml` chạy đạt một lần bằng `workflow_dispatch` sau khi gộp.

## Xác minh
```
npm test -- registerServiceWorker
npm run build
npx vite preview --port 4317 --strictPort --host 127.0.0.1
npm run check:offline -- http://127.0.0.1:4317/
npm run check:offline
```

Kết quả ngày 2026-11-19 (Chrome 157, Windows):
- Production: đạt (pha 1: SW activated, 27 mục precache; pha 2: app mở do SW phục vụ, yêu cầu mạng thất bại, gõ "Offline check …" bằng phím thật, còn sau khi tải lại, hộp Daily Focus mở).
- Bản build local: đạt, cùng các bước; yêu cầu mạng tới localhost cũng thất bại nên proxy chết chặn được cả localhost.
- Kiểm âm 1, xóa `dist/sw.js`: trượt với mã 1, in `[sw] Service worker registration failed … unsupported MIME type ('text/html')` (lỗi này trước đây bị nuốt).
- Kiểm âm 2, `sw.js` luôn cài lỗi: trượt với mã 1, in `[sw] … install failed … Retrying once in 10s.` rồi `[sw] … install failed again …`: lần gọi lại `register()` có tạo lượt cài mới, không lặp quá một lần.
- Lỗi thật 14:05 trên bản build local (`sw.js` gốc): hai dòng `[sw]` như kiểm âm 2, đúng hành vi mong đợi.
Tái hiện lỗi gốc nếu nó quay lại: `node D:\NguyenVinhPhuc\Video\Stride\store-shots\capture\swlog.mjs` (in dòng console của `sw.js`).

## Rủi ro & rollback
- Lần đăng ký lại có thể gặp đúng lỗi cũ nếu nguyên nhân còn đó: chỉ thử một lần nên không tốn tài nguyên; lần mở app sau vẫn đăng ký lại như trước.
- Job health-check mới chạy Chrome trên runner Ubuntu (cờ `--no-sandbox` chỉ bật khi `CI` và Linux), chưa chạy thật trước khi gộp: nếu lỗi do môi trường runner thì GitHub gửi email, sửa job hoặc tạm bỏ job đó.
- Rollback: revert commit; hành vi đăng ký SW quay về như cũ.

## Tham chiếu
- `vite.config.ts` (VitePWA, `generateSW`, `skipWaiting`, `clientsClaim`, `cleanupOutdatedCaches`)
- Bộ ảnh thư mục: `D:\NguyenVinhPhuc\Video\Stride\store-shots\README.md`
- [B04](./B04-error-boundary-and-csp.md)
