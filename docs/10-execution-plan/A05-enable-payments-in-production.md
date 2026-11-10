# A05: Bật thanh toán trên production

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | A: First Dollar |
| Ưu tiên | P0 |
| Ước lượng | 0,5 ngày làm + chờ Polar duyệt (tối đa 14 ngày, không chặn việc bán) |
| Phụ thuộc | A01, A02, A04 (☑); A03 phần tạo organization production |
| Trạng thái | ◐ Đã bật bán và mua thử $0 thành công trên production 2026-11-10; chờ founder bấm Submit for review |
| Người làm | Founder: danh tính, KYC, tài khoản nhận tiền, nạp secret. Claude: sản phẩm, link, webhook, mã giảm giá qua API; biến GitHub; kiểm tra |

## Mục tiêu
Khách quốc tế mua được PRO bằng thẻ qua Polar và nhận PRO tự động; website công khai trỏ tới checkout để Polar duyệt nhanh. VietQR (SePay) là kênh phụ cho Việt Nam, bật sau.

## Nguyên tắc (từ tài liệu duyệt của Polar và lần thử sandbox 2026-11-09)
- **"Build first, submit second"**: dựng xong sản phẩm, link, webhook và website trỏ tới checkout rồi mới nộp duyệt. Polar duyệt trước **lần rút tiền đầu tiên**, tối đa 14 ngày.
- **Không thử bằng thẻ thật trên production**: Polar coi là card testing, có thể khóa tài khoản. Thử bằng mã giảm giá 100%.
- Secret webhook thuộc từng org: production dùng secret của webhook production, thay secret sandbox.

## Các bước
1. **Founder**: trên polar.sh hoàn tất thông tin cá nhân (Country = Việt Nam) và tạo organization production. Đăng nhập polar.sh trong Chrome đang kết nối với Claude.
2. **Claude (qua API, chỉ trả về trường không bí mật)**: giống sandbox ([../09-operations/02-payments-and-licensing-runbook.md](../09-operations/02-payments-and-licensing-runbook.md) mục 1b):
   - 2 sản phẩm thanh toán một lần: $19 (công khai), $9.95 (Private, giá vùng).
   - 2 Checkout Link: Success URL `https://tasks-api.nexuspulsetech.xyz/checkout/success?checkout_id={CHECKOUT_ID}`, Return URL `https://tasks.nexuspulsetech.xyz/`, tắt ô mã giảm giá.
   - Webhook: Raw, API version bản Current, chỉ `order.paid` và `order.refunded`.
   - Mã giảm giá 100%, giới hạn 3 lượt, có hạn: dùng để tự kiểm tra và đưa người duyệt Polar khi được hỏi.
   - Thông tin org: website, email hỗ trợ `support@nexuspulsetech.xyz`, logo.
3. **Founder**: `npm run worker:secrets -- --webhook-only`, dán secret của webhook **production**. Khóa ký bản quyền đã nạp ngày 2026-11-09.
4. **Claude**: đặt GitHub Variables bằng `gh variable set` (founder đồng ý trước):

   | Biến | Giá trị |
   | :--- | :--- |
   | `VITE_ENABLE_PAYWALL` | `true` |
   | `VITE_POLAR_CHECKOUT_URL` | link $19 production |
   | `VITE_POLAR_CHECKOUT_URL_EMERGING` | link $9.95 production |
   | `VITE_LICENSE_CLAIM_URL` | `https://tasks-api.nexuspulsetech.xyz` |
   | `VITE_SYNC_API_URL` | `https://tasks-api.nexuspulsetech.xyz` |
   | `VITE_SUPPORT_EMAIL` | `support@nexuspulsetech.xyz` |

5. **Claude**: chạy lại Deploy, quét bundle production, smoke test Worker.
6. **Kiểm tra trên production bằng mã 100%** (không thẻ thật): mua từ app, PRO tự kích hoạt qua claim và qua Success URL, đồng bộ giữa 2 thiết bị. Đơn $0 không hoàn tiền được; phần thu hồi đã kiểm chứng trên sandbox.
7. **Founder**: nộp duyệt ở Polar → Finance → Account: thông tin doanh nghiệp, KYC (CCCD hoặc hộ chiếu kèm selfie qua Stripe Identity), tài khoản nhận tiền Stripe Connect Express. Nếu được hỏi, gửi người duyệt mã 100%.
8. Ghi nhật ký deploy ([../09-operations/01-deployment-runbook.md](../09-operations/01-deployment-runbook.md)).
9. **Sau đó, tùy chọn**: VietQR qua SePay cho Việt Nam (founder liên kết ngân hàng, đặt `VITE_VIETQR_IMAGE_URL`, nạp `SEPAY_API_KEY`); email link kích hoạt qua Resend (gói miễn phí, cần bản ghi DNS cho domain và `RESEND_API_KEY`).

## Kết quả 2026-11-10
- Founder tạo org production `nexuspulse-studio` (Using Polar as: Individual, USD) và khai Product details (Software / SaaS, One-time purchase, URL trang `/en/`, email hỗ trợ).
- Claude tạo qua API, chỉ đọc lại các trường không bí mật:
  - 2 sản phẩm thanh toán một lần: "Stride Tasks PRO Lifetime" $19 (công khai) và bản giá vùng $9.95 (Private).
  - 2 Checkout Link, Success URL về Worker, Return URL về app, tắt ô mã giảm giá: $19 `https://buy.polar.sh/polar_cl_BX78oCD5M4TjNKGFllhJOULVrhPNatqOOZWhX0Snl5c`, $9.95 `https://buy.polar.sh/polar_cl_mQj28IMIexBBwUL7OXzxgcNVkKc8M4orDxN4I3Mg3kY`.
  - Webhook "Stride Worker": Raw, API 2026-10, chỉ `order.paid` và `order.refunded`.
  - Mã giảm 100% cho cả hai sản phẩm, tối đa 3 lượt, hết hạn 2026-12-10. Mã không ghi vào repo; xem ở Polar, Products, Discounts.
  - Hồ sơ org: logo tải lên kho của Polar, link GitHub công khai.
- Org mới ở **chế độ test**: `capabilities.checkout_payments = false`, trang checkout ghi "NexusPulse Studio is in test mode" và chỉ nhận đơn $0 (mã 100%) cho tới khi Polar duyệt và go live. Thuế ở Việt Nam đã gồm trong giá ($1,73 trên $19).
- Checklist Account Review của Polar: tạo sản phẩm ✅, checkout ✅, mô tả sản phẩm ✅, email hỗ trợ ✅, link mạng xã hội ✅; còn xác minh danh tính, tài khoản nhận tiền (founder) và xác minh tên miền bằng bản ghi TXT `_polar-challenge.tasks.nexuspulsetech.xyz` (tùy chọn, cần sửa DNS Cloudflare).
- App nhận `?upgrade=pro` để mở bảng giá PRO; nút trên `/en/` đổi thành "Get PRO for $19" trỏ vào link này cùng lúc bật `VITE_ENABLE_PAYWALL`. Trang `/vi/` giữ nút giữ suất vì giá 149.000₫ cần VietQR (bước 9).
- Founder hoàn tất xác minh danh tính, tài khoản nhận tiền (MB, mã CITAD của chi nhánh quản lý tài khoản) và nạp secret webhook production (Worker ghi nhận đổi secret lúc 06:25 UTC).
- Xác minh tên miền với Polar: bản ghi TXT `_polar-challenge.tasks` trên Cloudflare DNS (founder duyệt), Polar báo Verified. **Giữ nguyên bản ghi này**, Polar kiểm tra lại khi duyệt.
- Đặt 6 GitHub Variables ở bảng bước 4 (founder duyệt). Bản build thử với các biến này: bundle có link production, không có chuỗi sandbox, CSP `connect-src` gồm `tasks-api`.
- Người dùng ở Việt Nam mặc định thấy giá thị trường mới nổi $9.95 khi VietQR chưa bật (trước đó rơi về $19), qua hàm `resolveActiveTier` có test.

## Mua thử $0 trên production (2026-11-10, founder duyệt)
- Trình duyệt sạch mở `/?lang=en&upgrade=pro`: bảng giá tự mở, bấm "Buy PRO ($19)". App đăng ký đơn `STRP6TDX8` (`POST /v1/orders` 201) rồi hỏi `/claim`.
- Checkout tạm bật ô mã giảm giá trên link $19, nhập mã 100%: tổng $0, nút "Get for free", chỉ hỏi email (support@nexuspulsetech.xyz), không cần thẻ. Đơn `a3e89602` trạng thái paid, `reference_id` đúng. Thử xong tắt lại ô mã giảm giá; mã còn 2/3 lượt.
- Webhook production `order.paid` trả 202 ngay lần gửi đầu (secret khớp).
- Success URL chuyển về app kèm `#activate=`, app bật PRO "Global (Polar)" và xóa token khỏi thanh địa chỉ. **Thời gian từ lúc trả tiền tới lúc bật PRO: khoảng 43 giây**, do KV lưu đệm cả kết quả "chưa có" (xem [A11](./A11-instant-activation-strong-consistency.md)).
- Đồng bộ: thiết bị A bật đồng bộ có việc thử; thiết bị B (trình duyệt tách biệt) kích hoạt bằng link `#activate=`, nối bằng link `#sync=` (mã điền sẵn) và nhận đúng việc thử. Xóa kho thử sau khi xong.

## Tiêu chí nghiệm thu
- [x] Trang đích và app trên production hiện nút mua trỏ tới checkout Polar production.
- [x] Đơn production dùng mã 100% → PRO tự kích hoạt ≤ 60 giây (đo được khoảng 43 giây; A11 rút xuống vài giây), đồng bộ chạy giữa 2 thiết bị.
- [x] Lịch sử gửi webhook production trả 202.
- [x] Không có bí mật trong bundle hay diff; `secret list` có đủ `POLAR_WEBHOOK_SECRET` và `STRIDE_ED25519_PRIVATE_KEY`.
- [ ] Đã nộp duyệt Polar; trạng thái tài khoản nhận tiền được ghi vào A03.

## Rủi ro & rollback
Lỗi thanh toán sau khi bật: xóa giá trị `VITE_ENABLE_PAYWALL` rồi deploy lại (quay về chế độ miễn phí), cấp bản quyền thủ công cho khách đã trả (runbook mục 2).

## Tham chiếu
- [../09-operations/02-payments-and-licensing-runbook.md](../09-operations/02-payments-and-licensing-runbook.md) · [../06-security-privacy/02-secrets-and-key-management.md](../06-security-privacy/02-secrets-and-key-management.md) · [Polar account reviews](https://polar.sh/docs/merchant-of-record/account-reviews)
