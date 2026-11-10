# B04: Error Boundary + CSP web/Tauri

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | B: Foundation |
| Ưu tiên | P1 |
| Ước lượng | 1 ngày |
| Phụ thuộc | - |
| Trạng thái | ◐ B04a (web) xong 2026-11-10, gồm chống nhúng trang và `style-src 'self'`; B04b (Tauri) làm cùng D02 |

## Mục tiêu
Lỗi render không làm trắng màn hình (người dùng vẫn xuất được sao lưu); app có Content Security Policy chống XSS đánh cắp token/mã đồng bộ.

## Các bước
1. `ErrorBoundary` toàn cục ở composition root: màn hình "Có lỗi xảy ra, dữ liệu của bạn vẫn an toàn" + nút *Tải lại* + nút *Xuất sao lưu JSON* (đọc trực tiếp từ lưu trữ, không phụ thuộc UI lỗi) + lưu 20 lỗi gần nhất cục bộ.
2. Boundary nhỏ quanh mỗi `Suspense`/vùng lazy (Kanban, Stats, các modal).
3. CSP web qua `<meta http-equiv="Content-Security-Policy">` trong `index.html` và layout Astro, khởi điểm:
   `default-src 'self'; script-src 'self' 'sha256-<hash script theme inline>' https://static.cloudflareinsights.com; connect-src 'self' https://tasks-api.nexuspulsetech.xyz https://cloudflareinsights.com; img-src 'self' data: blob: https://img.vietqr.io; style-src 'self' 'unsafe-inline'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self' <domain checkout MoR>`.
   (Hoặc chuyển script theme inline ra file riêng để bỏ hash.)
4. Tauri: đặt `app.security.csp` tương đương trong `src-tauri/tauri.conf.json` (thay `null`).
5. Kiểm tra mọi luồng: SW đăng ký, đồng bộ, ảnh VietQR, chuyển hướng checkout, analytics, link `#activate=`/`#sync=`.

## Thiết kế đã chốt (2026-11-10)
- **Sao lưu khẩn cấp** là hàm thuần `buildEmergencyBackup` đọc thẳng `localStorage` (dự án, log hoàn thành, trạng thái tùy chỉnh, streak, bản quyền), ra đúng khuôn `{ data: { projects, ... } }` mà bộ nhập của app đọc được. Dự án hỏng thì lấy từ bản tự sao lưu `STRIDE_AUTO_BACKUP_DATA`.
- **Error Boundary** đặt ở `main.tsx`, ngoài cả `LanguageProvider`, nên chữ trên màn hình lỗi viết song ngữ cố định (không phụ thuộc i18n có thể đã hỏng). Lưu 20 lỗi gần nhất ở khóa mới `STRIDE_ERROR_LOG_V1`.
- **CSP** chèn bằng plugin Vite chỉ chạy khi build (dev server cần script inline của React refresh). Plugin tự băm SHA-256 mọi script inline thực thi (script chọn giao diện sáng tối), không phải sửa tay khi script đổi. `connect-src` lấy origin từ `VITE_LICENSE_CLAIM_URL` và `VITE_SYNC_API_URL` để hai đầu luôn khớp. Không dùng `upgrade-insecure-requests` (làm hỏng `vite preview` ở http; HTTPS đã do Cloudflare ép). Thẻ meta không nhận `frame-ancestors` và báo cáo vi phạm. Thiếu `<meta charset>` thì plugin dừng build, không bao giờ phát hành bản thiếu CSP.
- **Chống nhúng trang (clickjacking)**: plugin chèn thêm một script nhỏ ngay sau thẻ CSP (mã băm tự vào `script-src`): bị nhúng vào khung thì ẩn toàn bộ trang và thử thoát ra cửa sổ chính. Script không chạy thì trang vẫn hiện bình thường, nên lớp này không bao giờ làm app trắng. Đây là lớp dự phòng; lớp chính là header `frame-ancestors 'none'` đặt bằng Transform Rule của Cloudflare (runbook 01 mục 1b). Rủi ro còn lại thấp vì trình duyệt hiện đại tách bộ nhớ của khung nhúng bên thứ ba: khung nhúng không thấy dữ liệu thật của người dùng.
- **`style-src 'self'`** (bỏ `'unsafe-inline'`, 2026-11-10): React đặt style qua CSSOM, CSP không chặn; khối `<noscript>` chuyển từ thuộc tính `style` sang class Tailwind; mã nguồn không có `dangerouslySetInnerHTML`, `innerHTML`, `setAttribute('style')` hay thẻ `<style>` sinh động.
- Trang tĩnh `/en/`, `/vi/`, trang pháp lý và Tauri (B04b, cùng D02) làm sau.

## Tiêu chí nghiệm thu
- [ ] Test component: component ném lỗi → hiện màn hình khôi phục, nút xuất sao lưu tải được file. Đã có test cho hàm sao lưu khẩn cấp; test component cần jsdom (B01c).
- [x] Không có vi phạm CSP (2026-11-10, bản build production qua `vite preview`): `ReportingObserver` ở chế độ buffered ghi 0 vi phạm lúc tải trang; sự kiện `securitypolicyviolation` ghi 0 vi phạm khi mở sao lưu, góp ý, Daily Focus, bảng lệnh, hướng dẫn offline, cài trên điện thoại, Kanban. Script giao diện tối vẫn chạy (mã băm đúng). Đối chứng: script inline chèn vào bị chặn (`script-src-elem`), gọi tới domain lạ bị chặn. Lưu ý: bộ đọc console của công cụ không bắt thông báo CSP, phải đo bằng hai API trên.
- [x] `style-src 'self'` (2026-11-10, `vite preview`): 0 vi phạm lúc tải trang (`ReportingObserver` buffered) và qua Kanban, danh sách, Daily Focus, bảng lệnh, lịch thông minh, trạng thái, chi tiết việc, Pomodoro, menu cài đặt, sao lưu, góp ý, hướng dẫn offline, cài trên điện thoại, đổi giao diện 3 lần, đổi ngôn ngữ (sự kiện `securitypolicyviolation`).
- [x] Chống nhúng (2026-11-10): trang thử ở origin khác (`127.0.0.1:5175`) nhúng app thì cây truy cập của khung rỗng, không còn gì để bấm; đối chứng là trang `/en/` (không có lớp chống) trong cùng trang thử vẫn hiện đủ. Cửa sổ chính không bị đổi vì Chrome chặn khung khác origin chuyển hướng cửa sổ chính khi chưa có thao tác người dùng, nên lớp bảo vệ thực sự là việc ẩn trang.
- [ ] Header `frame-ancestors` qua Cloudflare (runbook 01 mục 1b): chờ founder duyệt thay đổi cấu hình.
- [ ] Bản Tauri chạy được với CSP mới. Lưu ý cho D02: thẻ meta CSP nằm trong `dist/` nên cũng vào bản Tauri; app hiện không gọi IPC của Tauri, nếu sau này gọi thì `connect-src` phải thêm `ipc:` và `http://ipc.localhost`.

## Rủi ro & rollback
CSP quá chặt chặn tính năng → bật trước ở chế độ thử trên bản dev, kiểm từng luồng; rollback bằng revert.
