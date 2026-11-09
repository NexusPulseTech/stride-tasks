# A04: Đơn hàng, webhook Polar, claim an toàn, hoàn tiền → thu hồi, backoff

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | A: First Dollar |
| Ưu tiên | P0 (chặn bán, lỗ hổng bảo mật & DoS) |
| Ước lượng | 2 ngày |
| Phụ thuộc |, (có thể làm song song A03; cần ID sandbox để test cuối) |
| Trạng thái | ☑ Xong (2026-11-09): A04a, A04b, A04c đã deploy, mua thử sandbox end-to-end đạt |

## Mục tiêu
Luồng thanh toán an toàn: chỉ người mua nhận được token; hoàn tiền thu hồi được đồng bộ; app không thể làm cạn hạn mức Worker.

## Vì sao
Báo cáo [../05-api-contracts/02-fe-be-alignment-audit.md](../05-api-contracts/02-fe-be-alignment-audit.md) khoảng trống #1-#3, #10: `/claim` chỉ cần mã đơn 30-bit; poll 6 giây × 72 giờ (~14.400 request/ngày/tab); không có webhook hoàn tiền; giá VN cố định trong code.

## Phạm vi
- Trong: Worker (`cloudflare-worker/src/index.js`), client (`src/hooks/useProLicense.ts`, `src/config/commerceConfig.ts`, `StoreCommercialModal`), `openapi.yaml`, test.
- Ngoài: chuyển Worker sang TypeScript (B05), giữ JS nhưng tách hàm rõ ràng để B05 dễ chuyển.

## Các bước
1. **Hợp đồng trước**: cập nhật `docs/05-api-contracts/openapi.yaml`:
   - `POST /v1/orders` `{orderCode, claimHash (hex SHA-256 của claimSecret), tier, provider}` → `{checkoutUrl?}`.
   - `GET /claim` yêu cầu header `X-Claim-Secret`; sai → `403 claim_secret_mismatch`.
   - `POST /webhooks/polar`.
   - Mã lỗi mới `license_revoked` (402), `rate_limited` (429 + `Retry-After`).
2. **Client**: sinh `claimSecret` 128-bit (`crypto.getRandomValues`), lưu cùng đơn chờ (`STRIDE_PENDING_ORDER_V1`: mở rộng trường, giữ tương thích), gửi `POST /v1/orders` trước khi mở checkout/hiện VietQR.
3. **Worker `POST /v1/orders`**: lưu `pending:{orderCode}` = `{claimHash, tier, provider, createdAt}` (TTL 7 ngày); với Polar gọi API tạo checkout session, `metadata.stride_ref = orderCode`, trả `checkoutUrl`.
4. **Webhook Polar** (`/webhooks/polar`): xác thực Standard Webhooks (HMAC, chống replay > 5 phút), idempotent theo `webhook-id`; `order.paid` → ký token (giá lấy từ đơn, không cố định) → lưu `order:{code}` kèm `claimHash`; `order.refunded` → `revoked:{licenseId}`.
5. **SePay**: `pricePaidUsd`/`regionLabel` đọc từ `[vars]` thay vì hằng số `7.95`.
6. **`/claim`**: so `sha256(X-Claim-Secret)` với `claimHash` (thời gian hằng); không khớp → 403.
7. **Thu hồi**: `authorizeSync` kiểm tra `revoked:{licenseId}` → `402 license_revoked`; client hạ PRO cho tính năng sync và hiện thông báo.
8. **Rate limit**: Workers Rate Limiting binding, `/claim` 30 req/phút/IP, `/v1/orders` 10 req/phút/IP, `PUT /sync` 60 req/phút/license.
9. **Backoff poll** (client): 6 giây trong 10 phút đầu → 60 giây tới phút 30 → dừng, hiện nút "Kiểm tra lại"; tiếp tục khi tab focus lại.
10. Giữ đường LemonSqueezy sau cờ `CHECKOUT_PROVIDER` (mặc định `polar`).

## A04c: nhận bản quyền bằng `checkout_id` (2026-11-02)

**Vấn đề**: bản quyền chỉ tự kích hoạt khi khách bắt đầu mua từ trong app (mã đơn + bí mật claim). Khách mở thẳng Checkout Link (trang đích, người duyệt Polar, link chia sẻ) hoặc trả tiền trên thiết bị khác thì không nhận được PRO, vì chưa có email kích hoạt. Polar có thể xin mã giảm 100% để tự đi hết hành trình từ chưa trả tiền tới nhận PRO tự động ([account reviews](https://polar.sh/docs/merchant-of-record/account-reviews)).

**Thiết kế**:
1. Success URL của mọi Checkout Link: `https://tasks-api.nexuspulsetech.xyz/checkout/success?checkout_id={CHECKOUT_ID}`. Polar thay `{CHECKOUT_ID}` bằng ID phiên (UUID ngẫu nhiên, chỉ người mua thấy).
2. Webhook `order.paid` lưu thêm `plcheckout:{checkout_id}` trỏ tới bản ghi đơn (`Order.checkout_id` có trong schema API 2026-10).
3. `GET /checkout/success`: giới hạn tần suất theo IP (`CLAIM_LIMITER`); ID sai định dạng → trang lỗi 400; đã có bản quyền → `302` về `https://tasks.nexuspulsetech.xyz/#activate=<token>` (luồng kích hoạt sẵn có, app xóa token khỏi thanh địa chỉ); chưa có (webhook chưa tới) → trang "đang xác nhận" tự tải lại mỗi 3 giây, tối đa 40 lần (2 phút); quá hạn → hướng dẫn gửi mã cho `support@` để cấp thủ công.
4. Mọi phản hồi `no-store`, `noindex`, `Referrer-Policy: no-referrer`. Token chỉ nằm trong fragment `#` nên không gửi lên máy chủ nào.
5. Khách mua từ app vẫn được kích hoạt bằng claim polling như cũ; hai đường cùng ra một token nên kích hoạt hai lần không sao.

**Đánh đổi**: ai có `checkout_id` thì nhận được token, giống người có link kích hoạt trong email. ID là UUID ngẫu nhiên 122 bit, chỉ xuất hiện trong URL chuyển hướng của người mua, và endpoint có giới hạn tần suất.

**Kết quả (2026-11-02)**: deploy Worker `e22adac1`, 5 test mới (31/31), OpenAPI có `/checkout/success` (Redocly hợp lệ), Success URL của Checkout Link sandbox đã đổi sang endpoint này.

## Mua thử sandbox end-to-end (2026-11-09)

App chạy ở `localhost` (proxy `/__worker`), org `nexuspulse-studio`, đơn `STR9RRPMC`, thẻ test của Stripe.

| Bước | Kết quả |
| :--- | :--- |
| App đăng ký đơn (`POST /v1/orders`) rồi mở Checkout Link kèm `reference_id` | ✅ `registered: true` |
| Checkout | ✅ $19, thuế đã gồm $1.73 (địa chỉ Việt Nam), mô tả sản phẩm đúng |
| Webhook `order.paid` | Lần gửi đầu 0,8 giây sau khi tạo đơn. 5 lần đầu bị 403 `invalid_signature` vì secret nạp nhầm org; nạp lại đúng thì lần thử lại kế tiếp (194 giây) nhận 202. `redeliver` thêm lần nữa nhận 202 `duplicate`: không phát hành hai lần |
| App ở localhost | ✅ tự nhận bản quyền `PL-<đơn>`, "Global (Polar)", $19, xóa đơn chờ |
| Success URL `/checkout/success` | ✅ 302 về `#activate=<token>`; khi webhook lỗi, sau 40 lần chờ hiện hướng dẫn liên hệ hỗ trợ |
| Đồng bộ với token mới | ✅ được chấp nhận (kho chưa có trả 404) |
| Hoàn tiền toàn bộ qua API | ✅ Polar hoàn 1727 + thuế 173; webhook `order.refunded` nhận 202 `revoked` |
| Đồng bộ sau hoàn tiền | ✅ 402 `license_revoked` |

**Lỗi tìm ra và đã sửa**: Polar tính `refunded_amount` không gồm thuế, nên điều kiện dự phòng "đã hoàn đủ" phải cộng `refunded_tax_amount` (deploy `1b545fdb`, thêm ca test, thử đột biến bắt được). Lần này vẫn thu hồi được nhờ `status = refunded`.

**Độ trễ**: chưa đo trọn vòng vì lần đầu secret sai. Webhook đến sau 0,8 giây, trang chờ tải lại mỗi 3 giây, app hỏi mỗi 6 giây, nên ước tính PRO kích hoạt trong vài giây, dưới ngưỡng 60 giây.

## Tiêu chí nghiệm thu
- [x] Test Worker: claim đúng secret → token; sai/thiếu → 401/403; webhook chữ ký sai → 403 (Polar coi mọi mã khác 2xx là lỗi nên không cần 401); webhook trùng → không phát hành 2 lần; refund → sync trả 402 `license_revoked`; vượt rate limit → 429.
- [x] Test client: lịch poll đúng backoff (mô phỏng bằng hàm thuần `nextClaimDelay`); một cửa sổ hỏi dưới 100 request.
- [x] `openapi.yaml` lint hợp lệ; [../05-api-contracts/02-fe-be-alignment-audit.md](../05-api-contracts/02-fe-be-alignment-audit.md) cập nhật (#1-#3, #10 → ✅).
- [x] Mua thử sandbox Polar end-to-end: thanh toán → app nhận PRO → hoàn tiền → sync bị thu hồi (mục "Mua thử sandbox end-to-end"; độ trễ ước tính vài giây).

## Rủi ro & rollback
Lỗi ở webhook làm khách trả tiền mà không nhận token → giữ quy trình cấp thủ công ([../09-operations/02-payments-and-licensing-runbook.md](../09-operations/02-payments-and-licensing-runbook.md)); rollback Worker bằng `wrangler rollback`.

## Tham chiếu
- [../01-business/04-payments-and-merchant-of-record.md](../01-business/04-payments-and-merchant-of-record.md) mục 6 · [../05-api-contracts/03-webhooks-and-events.md](../05-api-contracts/03-webhooks-and-events.md) · [../06-security-privacy/01-threat-model.md](../06-security-privacy/01-threat-model.md)
