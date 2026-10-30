# Mô hình lỗi

> **Thuộc**: 05-api-contracts · **Trạng thái**: Reviewed (hiện tại) / Draft (mục tiêu) · **Cập nhật**: 2026-10-30

## 1. Hiện tại: `{ "error": "<code>" }`

| HTTP | `error` | Khi nào | Client (`syncClient.ts` → `SyncErrorCode`) |
| :---: | :--- | :--- | :--- |
| 400 | `invalid_json`, `invalid_version`, `invalid_iv`, `invalid_ciphertext` | Body PUT sai | `server_error` (lỗi lập trình, không phải lỗi người dùng) |
| 401 | `license_required` | Thiếu Bearer token | `license_required` |
| 402 | `license_invalid` | Token sai chữ ký | `license_required` |
| 403 | `vault_limit` | Vượt số kho/bản quyền | `vault_limit` |
| 404 | `not_found` | Kho chưa có | không phải lỗi: `vault = null` (join → `vault_not_found`) |
| 409 | `conflict` | Version không khớp / tạo trùng | không phải lỗi: vòng lặp kéo-hợp nhất-ghi, hết lượt → `conflict_retry_exhausted` |
| 413 | `too_large` | Bản mã > 1,9 MB | `too_large` |
| 503 | `sync_not_configured` | Thiếu binding D1 | `server_error` |
| — | (mạng lỗi) | fetch throw | `offline` |
| — | (giải mã lỗi) | Sai mã đồng bộ / dữ liệu bị sửa | `decrypt_failed` |

Webhook dùng dạng khác: `{ "success": false, "error": "unauthorized" | "missing_transaction_id" }` (SePay) và `{ "error": "invalid_signature" }` (LemonSqueezy). Claim dùng `{ "status": "invalid" }`.
⇒ **Ba hình dạng lỗi khác nhau** — mục tiêu là thống nhất.

## 2. Mục tiêu: RFC 9457 Problem Details

`Content-Type: application/problem+json`

```json
{
  "type": "https://tasks-api.nexuspulsetech.xyz/problems/vault-limit",
  "title": "Vault limit reached",
  "status": 403,
  "code": "vault_limit",
  "detail": "This license already owns 3 sync vaults.",
  "instance": "/sync/v1/vaults/9f…",
  "requestId": "6b1f…",
  "serverTime": "2026-10-30T08:00:00.000Z"
}
```

Quy tắc:

1. `code` là **hợp đồng** (ổn định, snake_case); `title`/`detail` chỉ để người đọc, có thể đổi.
2. Giữ trường `error` = `code` trong thời gian chuyển tiếp để client cũ không vỡ (expand → contract).
3. `429 rate_limited` kèm header `Retry-After` (giây) — client hiện coi 429 là `server_error`; cần thêm `rate_limited` vào `SyncErrorCode` và chờ theo `Retry-After`.
4. `402 license_revoked` (mới, khi hoàn tiền) — client hạ PRO và hiển thị thông báo lịch sự.
5. Không lộ chi tiết nội bộ (stack trace, câu SQL) trong `detail`.

## 3. Bảng mã lỗi chuẩn (mục tiêu)

| `code` | HTTP | Thử lại? | Thông điệp người dùng (i18n key gợi ý) |
| :--- | :---: | :---: | :--- |
| `validation_failed` | 400 | Không | `errors.generic` |
| `license_required` | 401 | Không | `sync.errors.licenseRequired` |
| `license_invalid` | 402 | Không | `sync.errors.licenseRequired` |
| `license_revoked` | 402 | Không | `sync.errors.licenseRevoked` |
| `vault_limit` | 403 | Không | `sync.errors.vaultLimit` |
| `not_found` | 404 | — | — |
| `conflict` | 409 | Có (tự động) | — |
| `too_large` | 413 | Không | `sync.errors.tooLarge` |
| `rate_limited` | 429 | Có, sau `Retry-After` | `errors.rateLimited` |
| `claim_secret_mismatch` | 403 | Không | `license.errors.claimMismatch` |
| `internal_error` | 500 | Có (backoff) | `errors.server` |
| `service_unavailable` | 503 | Có (backoff) | `errors.server` |

## Nguồn

- RFC 9457 — Problem Details for HTTP APIs: <https://www.rfc-editor.org/rfc/rfc9457>
