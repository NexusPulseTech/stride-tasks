# Mô hình dữ liệu & lưu trữ

> **Thuộc**: 04-architecture · **Trạng thái**: Reviewed (khớp code v3.1.0) · **Cập nhật**: 2026-10-30
> **Bảng khóa localStorage đầy đủ của v3.0.0**: [state-persistence.md](./state-persistence.md). File này bổ sung phần v3.1, dữ liệu server, quy tắc đặt tên và migration.

## 1. Bất biến (không được phá)

1. **Không đổi tên / xóa** khóa lưu trữ đang có. Thay đổi định dạng → tạo khóa phiên bản mới (`…_V5`) + code migration đọc khóa cũ, ghi khóa mới, giữ bản cũ ít nhất một phiên bản phát hành.
2. Dữ liệu người dùng **không bao giờ** rời thiết bị ở dạng rõ, đồng bộ chỉ gửi bản mã AES-256-GCM.
3. Mọi entity tham gia đồng bộ phải có `id` ổn định và `updatedAt` (ISO 8601), điều kiện của hợp nhất LWW.

## 2. Khóa client bổ sung từ v3.1.0 (chưa có trong state-persistence.md)

| Khóa | Module sở hữu | Nội dung |
| :--- | :--- | :--- |
| `STRIDE_SYNC_CONFIG_V1` | `features/sync/tombstones.ts` | Cấu hình đồng bộ (mã đồng bộ, trạng thái); có mặt ⇒ bật theo dõi tombstone |
| `STRIDE_SYNC_TOMBSTONES_V1` | `features/sync/tombstones.ts` | Bản đồ `"p:|t:|s:|l:" + id → ISO thời điểm xóa`, TTL **90 ngày** |
| `stride_tasks_language` | `i18n` | Ngôn ngữ giao diện |
| `stride_tasks_reminder_enabled`, `stride_tasks_reminder_interval` | nhắc việc | Bật/tắt & chu kỳ nhắc |
| `stride_tasks_view_preferences_v1` | tasks UI | Tùy chọn hiển thị |

**Quy ước đặt tên cho khóa mới**: `STRIDE_<CONTEXT>_<NAME>_V<n>` (chữ in hoa). Ba kiểu cũ (`SOLO_*`, `STRIDE_*`, `stride_tasks_*`) giữ nguyên vì bất biến 1. Mỗi khóa khai báo **một lần** dưới dạng hằng số trong module sở hữu.

## 3. Snapshot đồng bộ (định dạng phiên bản 1)

```ts
interface SyncSnapshotV1 {
  v: 1;
  projects: Project[];                       // cây project → task → subtask, mỗi nút có id + updatedAt
  logs: CompletedLog[];                      // log hoàn thành, hợp nhất theo id
  archivedDailyCounts: Record<string, number>;
  customStatuses: CustomStatus[];
  tombstones: Record<string, string>;        // "t:<id>" → ISO deletedAt
}
```

- Hợp nhất: LWW theo `updatedAt` với tiebreak xác định; tombstone thắng bản ghi cũ hơn thời điểm xóa; khử trùng lặp khi việc bị kéo sang dự án khác.
- Mã hóa: `vaultId = SHA-256("stride-vault-v1:" ‖ code)`; khóa HKDF-SHA256 → AES-256-GCM, AAD = vaultId; gzip trước khi mã hóa.
- Thay đổi định dạng → `v: 2` + bộ chuyển đổi `v1 → v2` ở client; server không cần biết (chỉ giữ bản mã).

## 4. Dữ liệu server (hiện tại)

**D1 `stride-sync`**: `cloudflare-worker/schema.sql`:

| Cột | Kiểu | Ý nghĩa |
| :--- | :--- | :--- |
| `id` | TEXT PK | vaultId (64 hex), không suy ngược ra mã đồng bộ |
| `version` | INTEGER | tăng 1 mỗi lần ghi; PUT phải gửi đúng `expectedVersion` (CAS) |
| `iv`, `ciphertext` | TEXT | IV AES-GCM (base64, 16 ký tự) và bản mã base64 (≤ 1.900.000 ký tự) |
| `size` | INTEGER | độ dài bản mã |
| `license_id` | TEXT, index | bản quyền tạo kho, giới hạn `SYNC_MAX_VAULTS_PER_LICENSE` |
| `created_at`, `updated_at` | TEXT | ISO 8601 |

**KV `LICENSES`** (TTL 90 ngày): `order:{STRxxxxxx}` → `{token, channel, …}` · `sepay:{txId}` → trạng thái xử lý · `lsorder:{id}` → đơn LemonSqueezy không có mã tham chiếu.

## 5. Dữ liệu server (mục tiêu)

| Dịch vụ | Bảng / khóa mới | Mục đích |
| :--- | :--- | :--- |
| billing | `orders(id, order_code, provider, status, amount_minor, currency, country, created_at)` · `payment_events(provider, event_id PK, received_at)` | Sổ cái + idempotency |
| licensing | `claims(order_code PK, claim_hash, token, expires_at)` · `revocations(license_id PK, reason, revoked_at)` | Claim an toàn + thu hồi khi hoàn tiền |
| sync | `vaults` (giữ nguyên) | - |

## 6. Quy tắc migration

- D1: dùng **`wrangler d1 migrations create/apply`** với file đánh số trong `migrations/` (thay cho `schema.sql` đơn lẻ), có lịch sử, áp dụng lặp lại an toàn.
- Mọi migration theo kiểu *expand → backfill → contract*; không `DROP` trong cùng bản phát hành với thay đổi code.
- Trước migration production: xuất bản sao (`wrangler d1 export`), D1 cũng có Time Travel để khôi phục theo thời điểm (kiểm tra thời hạn lưu theo gói).
- Client: migration chạy khi khởi động, idempotent, có test với dữ liệu mẫu của từng phiên bản cũ.
