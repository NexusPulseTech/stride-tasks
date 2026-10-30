# C06 — Google Play (TWA) + Play Billing

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | C — Growth engine |
| Ưu tiên | P2 |
| Ước lượng | 1–2 tuần (gồm 14 ngày closed test bắt buộc) |
| Phụ thuộc | C05, B05 (billing-service xác minh purchase token) |
| Trạng thái | ☐ Todo |

## Mục tiêu
Stride trên Google Play dưới dạng TWA, bán PRO **tuân thủ** chính sách Play Billing.

## Các bước
1. Founder đăng ký Play Console ($25, xác minh danh tính); **xác minh lại** chính sách phí và chương trình thanh toán thay thế hiện hành (2026 đang thay đổi).
2. Tuyển ≥ 12 tester (khách hàng/cộng đồng) cho closed test **14 ngày liên tục** (tài khoản cá nhân mới).
3. Đóng gói AAB bằng PWABuilder/Bubblewrap; khóa ký upload lưu an toàn (không commit).
4. `/.well-known/assetlinks.json` khớp SHA-256 của khóa ký Play App Signing; kiểm tra GitHub Pages phục vụ đúng thư mục `.well-known` (artifact không qua Jekyll); xác minh bằng Digital Asset Links verifier.
5. Play Billing qua **Digital Goods API** trong TWA: sản phẩm `pro_lifetime` (một lần); app phát hiện chạy trong TWA → dùng Play Billing thay cho checkout web.
6. Billing-service: xác minh purchase token bằng Google Play Developer API (service account — secret) → phát hành token Ed25519 như các kênh khác; xử lý hoàn tiền (voided purchases).
7. Data safety form khớp [../06-security-privacy/03-privacy-and-data-protection.md](../06-security-privacy/03-privacy-and-data-protection.md); listing theo [../02-growth/05-app-store-optimization.md](../02-growth/05-app-store-optimization.md).

## Tiêu chí nghiệm thu
- [ ] Ẩn thanh URL trong TWA (Digital Asset Links hợp lệ).
- [ ] Mua PRO qua Play trong môi trường test → nhận PRO; hoàn tiền → thu hồi sync.
- [ ] Production access được cấp sau closed test.
