# B06: Gói `contracts` + `sync-core` dùng chung

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | B: Foundation |
| Ưu tiên | P1 |
| Ước lượng | 2 ngày |
| Phụ thuộc | B05 |
| Trạng thái | ☐ Todo |

## Mục tiêu
Một nguồn sự thật cho hợp đồng FE↔BE: regex mã đơn, mã lỗi, giới hạn kích thước, schema request/response, client và Worker cùng import; CI phát hiện lệch.

## Các bước
1. `package.json` gốc: `"workspaces": ["packages/*", "cloudflare-worker"]` (bước 0-1 của [../04-architecture/06-target-repository-structure.md](../04-architecture/06-target-repository-structure.md)).
2. `packages/contracts`: schema `zod` cho `PutVaultRequest`, `VaultEnvelope`, `PutVaultResponse`, `Claim*`, `CreateOrder*`, `Problem`; hằng số `ORDER_CODE_PATTERN`, `MAX_CIPHERTEXT_CHARS`, danh sách `ErrorCode`.
3. Sinh OpenAPI từ zod (`@asteasolutions/zod-to-openapi`) ra `docs/05-api-contracts/openapi.yaml`; CI chạy lại sinh và **fail nếu có diff** (spec luôn khớp code). Phần mô tả/ví dụ giữ trong định nghĩa schema.
4. `packages/sync-core`: chuyển `syncMerge.ts`, `tombstones.ts`, `syncCrypto.ts` (thuần TS) + test; app import qua tên gói.
5. Contract test: Worker test kiểm mọi phản hồi bằng schema `contracts`.
6. Xóa khai báo trùng (`ORDER_EXACT` trong Worker, `ORDER_CODE_PATTERN` trong `commerceConfig.ts`).

## Tiêu chí nghiệm thu
- [ ] Không còn hằng số hợp đồng khai báo ở 2 nơi (grep).
- [ ] Sửa một schema mà không cập nhật bên kia → CI đỏ.
- [ ] `npm install --legacy-peer-deps` & build ở gốc vẫn xanh; Tauri build không đổi.
