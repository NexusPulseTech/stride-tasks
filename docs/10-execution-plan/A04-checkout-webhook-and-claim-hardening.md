# A04: Đơn hàng, webhook Polar, claim an toàn, hoàn tiền → thu hồi, backoff

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | A: First Dollar |
| Ưu tiên | P0 (chặn bán, lỗ hổng bảo mật & DoS) |
| Ước lượng | 2 ngày |
| Phụ thuộc |, (có thể làm song song A03; cần ID sandbox để test cuối) |
| Trạng thái | ☐ Todo |

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

## Tiêu chí nghiệm thu
- [ ] Test Worker: claim đúng secret → token; sai/thiếu → 403; webhook chữ ký sai → 401; webhook trùng → không phát hành 2 lần; refund → sync trả 402 `license_revoked`; vượt rate limit → 429.
- [ ] Test client: lịch poll đúng backoff (fake timer); tổng request trong 72 giờ ≤ 100 khi tab mở liên tục.
- [ ] `openapi.yaml` lint hợp lệ; [../05-api-contracts/02-fe-be-alignment-audit.md](../05-api-contracts/02-fe-be-alignment-audit.md) cập nhật (#1-#3, #10 → ✅).
- [ ] Mua thử sandbox Polar end-to-end: thanh toán → app nhận PRO ≤ 60 giây → hoàn tiền → sync bị thu hồi.

## Rủi ro & rollback
Lỗi ở webhook làm khách trả tiền mà không nhận token → giữ quy trình cấp thủ công ([../09-operations/02-payments-and-licensing-runbook.md](../09-operations/02-payments-and-licensing-runbook.md)); rollback Worker bằng `wrangler rollback`.

## Tham chiếu
- [../01-business/04-payments-and-merchant-of-record.md](../01-business/04-payments-and-merchant-of-record.md) mục 6 · [../05-api-contracts/03-webhooks-and-events.md](../05-api-contracts/03-webhooks-and-events.md) · [../06-security-privacy/01-threat-model.md](../06-security-privacy/01-threat-model.md)
