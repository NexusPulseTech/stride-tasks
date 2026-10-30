# ADR-0003: Đồng bộ mã hóa đầu-cuối, hợp nhất LWW + tombstone

- **Trạng thái**: Accepted (v3.1.0)
- **Ngày**: 2026-10-30
- **Liên quan**: `src/features/sync/*`, `cloudflare-worker/src/index.js` (`handleVault`), [../05-data-model-and-storage.md](../05-data-model-and-storage.md)

## Bối cảnh

Người dùng PRO cần dùng nhiều thiết bị mà vẫn giữ lời hứa riêng tư. Server không được đọc dữ liệu. Nhiều thiết bị có thể sửa cùng lúc khi offline.

## Các phương án

1. **CRDT đầy đủ (Automerge/Yjs)** — hợp nhất mạnh, nhưng thay đổi toàn bộ mô hình dữ liệu, bundle lớn, phức tạp.
2. **Snapshot mã hóa + hợp nhất LWW theo từng entity + tombstone, ghi bằng CAS theo version** — đơn giản, đủ cho dữ liệu cá nhân, server chỉ là kho bản mã.
3. **Server giữ dữ liệu rõ và hợp nhất** — trái lời hứa riêng tư.

## Quyết định

Chọn phương án 2. Mã đồng bộ 128-bit (Crockford Base32, 26 ký tự) → `vaultId = SHA-256("stride-vault-v1:" ‖ code)`; khóa HKDF-SHA256 → AES-256-GCM (AAD = vaultId); gzip trước khi mã hóa. Hợp nhất LWW theo `updatedAt` với tiebreak xác định; tombstone `p:/t:/s:/l:` có TTL 90 ngày. Ghi bằng `PUT` kèm `expectedVersion`; `409` → kéo bản mới, hợp nhất lại, thử lại.

## Hệ quả

- Tích cực: server không đọc được dữ liệu; hội tụ đã được kiểm thử (merge đối xứng, idempotent); chi phí thấp trên D1.
- Tiêu cực: xung đột cùng một trường → bản mới hơn thắng (mất sửa đổi cũ hơn); phụ thuộc đồng hồ thiết bị (đã cảnh báo lệch giờ qua `serverTime`); thiết bị offline > 90 ngày có thể làm sống lại mục đã xóa.
- Việc tiếp: đồng bộ thời gian thực (Durable Objects) chỉ khi có nhu cầu đo được.
