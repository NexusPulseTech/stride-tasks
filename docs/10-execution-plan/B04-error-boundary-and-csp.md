# B04 — Error Boundary + CSP web/Tauri

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | B — Foundation |
| Ưu tiên | P1 |
| Ước lượng | 1 ngày |
| Phụ thuộc | — |
| Trạng thái | ☐ Todo |

## Mục tiêu
Lỗi render không làm trắng màn hình (người dùng vẫn xuất được sao lưu); app có Content Security Policy chống XSS đánh cắp token/mã đồng bộ.

## Các bước
1. `ErrorBoundary` toàn cục ở composition root: màn hình "Có lỗi xảy ra — dữ liệu của bạn vẫn an toàn" + nút *Tải lại* + nút *Xuất sao lưu JSON* (đọc trực tiếp từ lưu trữ, không phụ thuộc UI lỗi) + lưu 20 lỗi gần nhất cục bộ.
2. Boundary nhỏ quanh mỗi `Suspense`/vùng lazy (Kanban, Stats, các modal).
3. CSP web qua `<meta http-equiv="Content-Security-Policy">` trong `index.html` và layout Astro, khởi điểm:
   `default-src 'self'; script-src 'self' 'sha256-<hash script theme inline>' https://static.cloudflareinsights.com; connect-src 'self' https://tasks-api.nexuspulsetech.xyz https://cloudflareinsights.com; img-src 'self' data: blob: https://img.vietqr.io; style-src 'self' 'unsafe-inline'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self' <domain checkout MoR>`.
   (Hoặc chuyển script theme inline ra file riêng để bỏ hash.)
4. Tauri: đặt `app.security.csp` tương đương trong `src-tauri/tauri.conf.json` (thay `null`).
5. Kiểm tra mọi luồng: SW đăng ký, đồng bộ, ảnh VietQR, chuyển hướng checkout, analytics, link `#activate=`/`#sync=`.

## Tiêu chí nghiệm thu
- [ ] Test component: component ném lỗi → hiện màn hình khôi phục, nút xuất sao lưu tải được file.
- [ ] Console không có vi phạm CSP trong 5 hành trình E2E.
- [ ] Bản Tauri chạy được với CSP mới.

## Rủi ro & rollback
CSP quá chặt chặn tính năng → bật trước ở chế độ thử trên bản dev, kiểm từng luồng; rollback bằng revert.
