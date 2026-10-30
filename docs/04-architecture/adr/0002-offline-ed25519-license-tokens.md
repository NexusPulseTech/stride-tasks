# ADR-0002: Bản quyền bằng token Ed25519 xác minh offline

- **Trạng thái**: Accepted (v3.0.0)
- **Ngày**: 2026-10-30
- **Liên quan**: `src/utils/licenseCrypto.ts`, `src/hooks/useProLicense.ts`, [../../06-security-privacy/04-license-abuse-controls.md](../../06-security-privacy/04-license-abuse-controls.md)

## Bối cảnh

App không có tài khoản (ADR-0001) và phải chạy offline, nên không thể hỏi server "người này có PRO không" mỗi lần mở app.

## Các phương án

1. **Kiểm tra online mỗi lần khởi động** — chặn được chia sẻ, nhưng hỏng trải nghiệm offline.
2. **Token ký số, xác minh offline bằng public key nhúng trong app** — offline hoàn toàn; không thu hồi được ở phía client.
3. **Mã kích hoạt kèm tài khoản** — trái ADR-0001.

## Quyết định

Token dạng `STRIDE1.<base64url payload>.<base64url chữ ký Ed25519>`; payload gồm `licenseKeyOrAddonId`, `activatedAt`, `pricePaidUsd`, `regionLabel` (không chứa email). App xác minh bằng WebCrypto (fallback `@noble/ed25519`) khi khởi động; sửa payload → mất PRO. Khóa riêng chỉ ở `.env.local` và secret của Worker.

## Hệ quả

- Tích cực: PRO hoạt động offline; không lưu dữ liệu cá nhân trong token.
- Tiêu cực: **không thu hồi được tính năng offline** khi hoàn tiền/chia sẻ token. Giảm thiểu: tính năng phụ thuộc server (sync) kiểm tra danh sách thu hồi; hạn mức kho đồng bộ theo bản quyền.
- Việc tiếp: quy trình xoay khóa (rotation) nếu khóa riêng bị lộ — xem [../../06-security-privacy/02-secrets-and-key-management.md](../../06-security-privacy/02-secrets-and-key-management.md).
