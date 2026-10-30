# Webhook & sự kiện

> **Thuộc**: 05-api-contracts · **Trạng thái**: Reviewed (webhook hiện tại) / Draft (sự kiện mục tiêu) · **Cập nhật**: 2026-10-30

## 1. Webhook vào hiện tại

| Nguồn | Endpoint | Xác thực | Idempotency | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| SePay (VietQR) | `POST /webhook/sepay` | Header `Authorization: Apikey <SEPAY_API_KEY>`, so sánh thời gian hằng; **thiếu secret → 401** | Khóa `sepay:{txId}` (KV, 90 ngày) | Chỉ xử lý `transferType = in`; tìm mã `STR…` trong `code/content/description`; số tiền phải ≥ `PRICE_VND`; không khớp vẫn trả 200 + ghi `unmatched` để đối soát thủ công |
| LemonSqueezy | `POST /webhook/lemonsqueezy` | `X-Signature` = HMAC-SHA256 hex của raw body; **thiếu secret → 401** | Khóa `order:{ref}` hoặc `lsorder:{id}` | Chỉ `order_created` + `status = paid`; **deprecated** (ADR-0006) |

SePay coi phản hồi ngoài 2xx là thất bại và tự gửi lại → handler phải nhanh và idempotent (đã đúng).

## 2. Webhook mục tiêu: Polar

- Endpoint: `POST /webhooks/polar` (dịch vụ billing).
- Xác thực theo chuẩn **Standard Webhooks** (header `webhook-id`, `webhook-timestamp`, `webhook-signature`; HMAC-SHA256 với secret; từ chối timestamp lệch quá 5 phút để chống replay).
- Sự kiện xử lý: `order.paid` → phát hành bản quyền; `order.refunded` → thu hồi. (Kiểm tra tên sự kiện chính xác trong tài liệu Polar khi tích hợp.)
- Idempotency: bảng `payment_events(provider, event_id)`; trùng → trả 200 ngay.
- Liên kết đơn: `metadata.stride_ref = orderCode` khi tạo checkout.

## 3. Sự kiện nội bộ (khi tách dịch vụ — ADR-0005)

Định dạng phong bì (envelope) theo tinh thần CloudEvents:

```json
{
  "specversion": "1.0",
  "id": "evt_01J…",
  "type": "billing.order-paid.v1",
  "source": "stride/billing",
  "time": "2026-10-30T08:00:00Z",
  "data": {
    "orderCode": "STRK7P2QX",
    "provider": "polar",
    "amountMinor": 2595,
    "currency": "USD",
    "country": "DE",
    "licenseHint": { "tier": "global-us" }
  }
}
```

| Sự kiện | Phát bởi | Tiêu thụ bởi | Hành động |
| :--- | :--- | :--- | :--- |
| `billing.order-paid.v1` | billing | licensing | Ký token, lưu claim (kèm `claim_hash`) |
| `billing.order-refunded.v1` | billing | licensing | Ghi `revocations` |
| `licensing.license-issued.v1` | licensing | notifications | Gửi email link kích hoạt (nếu có email người mua) |

Quy tắc: tên sự kiện có hậu tố phiên bản; consumer **idempotent** theo `id`; thay đổi phá vỡ → phiên bản mới (`.v2`) chạy song song; payload không chứa dữ liệu cá nhân trừ khi consumer bắt buộc cần (email chỉ đi tới notifications).

## Nguồn

- Standard Webhooks: <https://www.standardwebhooks.com/>
- CloudEvents: <https://cloudevents.io/>
- SePay webhooks: <https://developer.sepay.vn/en/sepay-webhooks>
