# B11: Service worker cài lỗi sau deploy, lớp phục hồi và kiểm ngoại tuyến tự động

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | B: Foundation |
| Ưu tiên | P0 (lời hứa "chạy ngoại tuyến" trong bộ đăng thư mục và video) |
| Ước lượng | 1 ngày |
| Phụ thuộc | B04 |
| Trạng thái | ◐ 2026-11-19 (code xong trên nhánh `fix/sw-precache`; chờ Phúc thêm Cache Rule ở Cloudflare, chờ gộp và deploy) |

## Mục tiêu
Khách mở app lần đầu, kể cả ngay sau một lần deploy, đều cài được service worker (SW) và dùng được khi mất mạng. Khi SW cài lỗi thì lỗi hiện rõ trong console và app tự thử lại. Có kiểm tự động chạy ngay sau mỗi lần deploy: SW activated, cắt mạng thật, app mở được, gõ được việc, việc còn sau khi tải lại.

## Vì sao
Lúc chụp ảnh cho thư mục phần mềm (18 và 19/11), SW nhiều lần không cài được. Điều tra ra **hai lỗi khác nhau**, cùng biểu hiện "SW không bao giờ activated":

### Lỗi 1, thật, ảnh hưởng khách: `sw.js` cũ ở cache biên Cloudflare sau deploy
- Cloudflare mặc định cache file `.js` ở biên, không cache HTML ("The Cloudflare CDN does not cache HTML or JSON by default", bảng đuôi file mặc định có JS). Đo thực tế: `/sw.js` trả `cf-cache-status: HIT` và `Cache-Control: max-age=14400` (Browser Cache TTL mặc định của zone là 4 giờ, đè `max-age=600` của GitHub Pages); `/`, `/index.html`, `/en/` trả `DYNAMIC`.
- Sau deploy, HTML và các chunk mới có ngay, chunk cũ bị GitHub Pages xóa (404), nhưng `sw.js` ở biên vẫn là bản cũ cho tới khi biên lấy lại (đo sau deploy A17 lúc 07:06 UTC: biên lấy bản mới khoảng 07:17 UTC). Manifest precache cũ trỏ tới chunk đã xóa nên Workbox dừng ở 404 và SW thành `redundant`.
- Bằng chứng: Phiên 2 thấy trên production lúc 07:10 đến 07:13 UTC ngày 19/11 cache dừng ở 13/27 mục, trong đó có `index.html?__WB_REVISION__=c28ac5ea1b28181c8e019e8acaa88a55` (revision cũ); 07:21 UTC thì đạt. Tái hiện có kiểm soát: `sw.js` production trước A17 (tải ngày 18/11) chạy trên bản build mới, máy chủ tĩnh trả 404 như GitHub Pages: đúng 13 lượt `put` thành công (mục thứ 13 chính là revision `c28ac5ea…`), rồi `bad-precaching-response :: [{"url":".../assets/index-NzPnd5zG.js","status":404}]`. Lượt thử lại 10 giây sau của B11 lỗi y hệt vì biên vẫn cũ.
- Khách thật có gặp không: **có**. Ai mở app lần đầu (hoặc đúng lúc SW tự cập nhật) trong khoảng biên còn giữ `sw.js` cũ sau mỗi lần deploy (đo được khoảng 11 phút) thì không có chế độ ngoại tuyến cho tới lần mở sau, khi biên đã có bản mới. Khách đã có SW active thì vẫn chạy bản cũ, không hỏng, cập nhật muộn hơn.
- Lưu ý: `vite preview` trả `index.html` (200) cho file thiếu nên **không** tái hiện được lỗi này ở local; cần máy chủ trả 404 như GitHub Pages.

### Lỗi 2, chỉ trong môi trường kiểm, khách không gặp: hồ sơ Chrome quá sâu trên Windows
- Lỗi `InvalidAccessError: Failed to execute 'put' on 'Cache': Entry already exists.` và `UnknownError: Failed to execute 'open' on 'CacheStorage': Unexpected internal error.` đều đến từ Cache Storage của Chrome khi đường dẫn file vượt MAX_PATH của Windows (259 ký tự).
- Đo trên Chrome 157: file Cache Storage sâu nhất nằm dưới thư mục hồ sơ thêm 139 ký tự (`\Default\Service Worker\CacheStorage\<40 ký tự>\<36 ký tự>\index-dir\the-real-index`), file mục cache thêm 133.
- Kiểm có kiểm soát trên ổ D với bản build local: hồ sơ 120 và 126 ký tự đạt; 127 và 130 ký tự lỗi "Entry already exists". Toàn bộ khoảng 40 lượt chạy trước đó: mọi hồ sơ từ 126 ký tự trở xuống đều đạt, gần như mọi lượt lỗi có hồ sơ 127 đến 147 ký tự (nằm sâu trong thư mục tạm của phiên AI). Một lượt 140 ký tự lại đạt, nên phía trên ngưỡng không đều; phía dưới ngưỡng thì luôn đạt.
- Các "đợt lỗi theo giờ" ghi nhận trước đây thật ra là lúc chạy script có hồ sơ nằm sâu. Lỗi này không liên quan CDN hay deploy.
- Khách thật có gặp không: **không**, trên thực tế. Hồ sơ Chrome thật nằm ở `C:\Users\<tên>\AppData\Local\Google\Chrome\User Data`, khoảng 60 ký tự, còn xa ngưỡng 127 (tên người dùng Windows tối đa 20 ký tự).

### Đã loại trừ
- Đăng ký SW hai lần: chỉ có một lệnh `register` (`src/main.tsx`), `injectRegister: false`.
- Manifest precache hỏng ở bản hiện tại: 27 mục, không trùng URL, đều 200, không chuyển hướng (kể cả có `?__WB_REVISION__`).
- CSP chặn trong SW: header của `sw.js` chỉ có `frame-ancestors`. App tự ghi Cache API: không có.
- "Hai bản SW cài chồng lên nhau lúc deploy": cơ chế thật là `sw.js` cũ ở biên trỏ tới chunk đã xóa, kéo dài sau deploy chứ không chỉ trong lúc deploy.

## Phạm vi
- Trong phạm vi:
  - `src/utils/registerServiceWorker.ts` (lưới an toàn, không phải cách sửa gốc): không nuốt lỗi (`register` bị từ chối thì `console.warn` kèm lỗi). (a) Lần cài đầu thất bại, chưa có worker active: `console.error`, gọi lại `register()` đúng một lần sau 10 giây. (b) Bản cập nhật cài thất bại khi đã có worker active: bản cũ vẫn phục vụ; `console.warn`, gọi `registration.update()` đúng một lần. Test đơn vị cho cả hai nhánh, cho việc không đếm trùng một worker và cho lỗi bị từ chối.
  - `scripts/offline-check.mjs`, `npm run check:offline`: Chrome hồ sơ tạm qua giao thức DevTools, không cần thư viện; pha 1 chờ SW activated, điều khiển trang, precache có mục; pha 2 mở lại qua proxy chết (kể cả localhost), app mở do SW phục vụ, yêu cầu mạng thất bại, gõ phím thật một việc, tải lại vẫn còn, mở hộp Daily Focus (chunk tải lười). Dừng sớm với thông báo rõ nếu đường dẫn hồ sơ tạm quá dài (lỗi 2).
  - `health-check.yml`: job `offline` chạy mỗi 6 giờ và **ngay sau mỗi lần deploy thành công** (`workflow_run`).
  - Tài liệu: hướng dẫn Cache Rule cho Phúc (bên dưới và runbook triển khai), đề xuất purge sau deploy.
- Ngoài phạm vi (không tự làm): đổi cài đặt Cloudflare, tạo API token, đổi cấu hình Workbox hay `cacheId`.

## Đối chiếu spec (đọc ngày 2026-11-19)

Nguồn: W3C Service Workers, Editor's Draft, 17 November 2026, https://w3c.github.io/ServiceWorker/

- Install, bước 2: "Let newestWorker be the result of running Get Newest Worker algorithm passing registration as its argument." Bước này chạy trước khi gán worker đang cài, nên với lần cài đầu newestWorker là null.
- Install, bước 12 (installFailed): 12.1 đưa worker đang cài sang "redundant"; 12.2 "Run the Update Registration State algorithm passing registration, "installing" and null as the arguments."; 12.3 "If newestWorker is null, then remove registration map[...]".
- `update()`, bước 3: "If newestWorker is null, return a promise rejected with an "InvalidStateError" DOMException and abort these steps."
- Get Newest Worker trả về installing, rồi waiting, rồi active, nếu không có thì null.

Suy ra: lần cài đầu thất bại thì registration bị gỡ, `update()` bị từ chối, nên nhánh (a) gọi lại `register()`. Khi đã có worker active thì `update()` hợp lệ, nên nhánh (b) dùng `update()`.

## Cách sửa gốc lỗi 1 (Phúc tự làm trên Cloudflare)

Tài liệu chính thức (đọc ngày 2026-11-19): https://developers.cloudflare.com/cache/how-to/cache-rules/create-dashboard/ , https://developers.cloudflare.com/cache/how-to/cache-rules/settings/ , https://developers.cloudflare.com/cache/concepts/default-cache-behavior/ , https://developers.cloudflare.com/cache/how-to/purge-cache/purge-by-single-file/

**Lớp 1, bắt buộc: Cache Rule bỏ qua cache biên cho `/sw.js`**
1. Trong dashboard Cloudflare, mở zone `nexuspulsetech.xyz`, vào trang **Cache Rules**, chọn **Create rule**.
2. **Rule name**: `Bypass cache: tasks sw.js`.
3. **When incoming requests match**: chọn **Custom filter expression**, rồi **Edit expression** và dán:
   ```
   (http.host eq "tasks.nexuspulsetech.xyz" and http.request.uri.path eq "/sw.js")
   ```
4. **Then**, mục **Cache eligibility**: chọn **Bypass cache**.
5. Chọn **Deploy**.
6. Xóa bản `sw.js` đang nằm ở biên một lần: **Purge Cache**, **Custom Purge**, **Purge by** **URL**, nhập `https://tasks.nexuspulsetech.xyz/sw.js`, chọn **Purge**.
7. Kiểm: `curl -sI https://tasks.nexuspulsetech.xyz/sw.js` không còn `cf-cache-status: HIT` (tài liệu ghi rule Bypass có thể hiện `DYNAMIC`). Sau lần deploy kế tiếp, job `offline` chạy ngay sau deploy phải đạt.

Chỉ cần `/sw.js`: `workbox-<hash>.js` và mọi chunk trong `assets/` có hash trong tên nên cache lâu vẫn đúng; HTML vốn không bị cache. Tài liệu Cloudflare không nói rõ Browser Cache TTL của zone (4 giờ) có còn ghi đè `Cache-Control` cho phản hồi bị Bypass hay không; điều này không chặn việc sửa vì trình duyệt mặc định không dùng HTTP cache cho chính file SW khi kiểm tra cập nhật (`updateViaCache` mặc định `imports`).

**Lớp 2, tùy chọn: purge `sw.js` trong workflow deploy**
- Gọi `POST https://api.cloudflare.com/client/v4/zones/{zone_id}/purge_cache` với thân `{"files": ["https://tasks.nexuspulsetech.xyz/sw.js"]}` sau bước deploy Pages. Token cần quyền **Cache Purge** (Phúc tạo, lưu ở GitHub Secrets). Tài liệu lưu ý: phản hồi 200 chỉ nghĩa là Cloudflare đã nhận yêu cầu; kiểm lại bằng `CF-Cache-Status: MISS`.
- Chưa làm: lớp 1 đã đủ; lớp 2 chỉ thêm khi Phúc muốn phòng hờ.

## Các bước
1. Viết tài liệu này.
2. Lớp phục hồi `registerServiceWorker.ts`, test, gọi từ `main.tsx`.
3. `scripts/offline-check.mjs`, script npm, job `offline` (6 giờ và ngay sau deploy), runbook.
4. Tái hiện có kiểm soát cả hai lỗi, ghi điều kiện và mức ảnh hưởng tới khách.
5. Lint, test app, test Worker, quét bí mật; commit trên `fix/sw-precache`. Stride Phiên 2 (phiên deploy duy nhất) duyệt, gộp, deploy sau khi Phúc đồng ý.
6. Phúc thêm Cache Rule (mục trên). Sau lần deploy kế tiếp, xác nhận job `offline` chạy ngay sau deploy đạt.

## Trạng thái và bước tiếp theo
- 2026-11-19: xong toàn bộ phần code và tài liệu trên nhánh `fix/sw-precache` (chưa push, chưa gộp).
  - Gốc lỗi đã xác định và tái hiện có kiểm soát: lỗi 1 (`sw.js` cũ ở biên Cloudflare sau deploy, khách gặp) và lỗi 2 (hồ sơ Chrome sâu quá MAX_PATH, chỉ môi trường kiểm).
  - Ảnh 04 ngoại tuyến đã chụp trên production lúc khoảng 01:55 (SW active, 27 mục, cắt mạng thật).
- Việc của Phúc: thêm Cache Rule và purge `/sw.js` một lần theo mục "Cách sửa gốc lỗi 1". Lớp 2 (purge tự động) chỉ khi muốn.
- Việc của Stride Phiên 2: duyệt, gộp, deploy; sau deploy xem job `offline` (tự chạy). Trước khi Phúc thêm Cache Rule, job này có thể **trượt ngay sau deploy**: đó là lỗi 1 thật, không phải báo động giả.
- Nếu trang đích cần nói "works offline" trước khi Cache Rule có hiệu lực: câu đó đúng với khách đã mở app một lần ngoài khoảng khoảng 11 phút sau mỗi lần deploy.

## Tiêu chí nghiệm thu
- [x] Không còn `.catch(() => {})` nuốt lỗi đăng ký SW; lỗi đăng ký và lỗi cài SW hiện trong console với tiền tố `[sw]`.
- [x] Cài lỗi lần đầu thì tự đăng ký lại đúng một lần; cập nhật lỗi thì `update()` đúng một lần; không lặp (test đơn vị và Chrome thật).
- [x] `npm run check:offline` đạt trên bản build local và trên production, và **trượt** đúng khi SW hỏng.
- [x] Hai lỗi được tái hiện có kiểm soát, có điều kiện gây lỗi và câu trả lời "khách có gặp không".
- [ ] Cache Rule bỏ qua cache cho `/sw.js` đã bật (Phúc), `curl -sI` không còn `HIT`.
- [ ] Job `offline` chạy ngay sau một lần deploy và đạt.

## Xác minh
```
npm test -- registerServiceWorker
npm run build
npx vite preview --port 4317 --strictPort --host 127.0.0.1
npm run check:offline -- http://127.0.0.1:4317/
npm run check:offline
curl -sI https://tasks.nexuspulsetech.xyz/sw.js
```

Kết quả ngày 2026-11-19 (Chrome 157, Windows):
- Production (05:18 UTC, ngoài khung sau deploy): đạt đủ các bước (pha 1: SW activated, 27 mục precache; pha 2: app mở do SW phục vụ, yêu cầu mạng thất bại, gõ "Offline check …" bằng phím thật, còn sau khi tải lại, hộp Daily Focus mở).
- Bản build local: đạt; yêu cầu mạng tới localhost cũng thất bại nên proxy chết chặn được cả localhost.
- Kiểm âm 1, xóa `dist/sw.js`: trượt mã 1, in `[sw] Service worker registration failed … unsupported MIME type ('text/html')` (lỗi này trước đây bị nuốt).
- Kiểm âm 2, `sw.js` luôn cài lỗi: trượt mã 1, in `[sw] … install failed … Retrying once in 10s.` rồi `[sw] … install failed again …`; lần gọi lại `register()` có tạo lượt cài mới.
- Nhánh (b) trong Chrome thật: SW tốt active, thay bằng bản cài lỗi rồi tải lại: `[sw] A service worker update failed to install … Checking for the update once more.` rồi `… update failed again …`; worker cũ vẫn `activated` và điều khiển trang.
- Lỗi 1 tái hiện: `sw.js` trước A17 trên bản build mới, máy chủ trả 404: 13 `put` rồi `bad-precaching-response` 404 `assets/index-NzPnd5zG.js`.
- Lỗi 2 tái hiện: hồ sơ trên ổ D dài 120 và 126 ký tự đạt; 127 và 130 ký tự lỗi "Entry already exists"; cùng harness đó với hồ sơ `D:\sw-test-profiles\bb` (22 ký tự) thì đạt.

## Rủi ro & rollback
- Trước khi có Cache Rule, job `offline` sau deploy sẽ trượt trong khoảng biên còn `sw.js` cũ và GitHub gửi email: đúng tín hiệu của lỗi 1.
- Job chạy Chrome trên runner Ubuntu (`--no-sandbox` chỉ khi `CI` và Linux), chưa chạy thật trước khi gộp: nếu lỗi do môi trường runner thì sửa job hoặc tạm tắt riêng job đó.
- Cache Rule chỉ khớp đúng `/sw.js` của host `tasks`, không ảnh hưởng trang đích, Worker hay host khác. Gỡ rule là quay lại như cũ.
- Rollback code: revert các commit B11; đăng ký SW quay về như cũ.

## Tham chiếu
- `vite.config.ts` (VitePWA, `generateSW`, `skipWaiting`, `clientsClaim`, `cleanupOutdatedCaches`)
- Bộ ảnh thư mục: `D:\NguyenVinhPhuc\Video\Stride\store-shots\README.md`
- Runbook triển khai: [`docs/09-operations/01-deployment-runbook.md`](../09-operations/01-deployment-runbook.md)
- [B04](./B04-error-boundary-and-csp.md)
