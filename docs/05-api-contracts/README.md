# 05: API Contracts

> **Thuộc**: 05-api-contracts · **Trạng thái**: Accepted (quy trình) · **Cập nhật**: 2026-10-30
> **Nguyên tắc**: **contract-first**: hợp đồng là nguồn sự thật; code client và Worker phải khớp hợp đồng, không ngược lại.

## Nội dung

| File | Nội dung |
| :--- | :--- |
| [openapi.yaml](./openapi.yaml) | OpenAPI 3.1 của API công khai `https://tasks-api.nexuspulsetech.xyz` (khớp code v3.1.0, đã lint bằng Redocly CLI 2.64.1, hợp lệ) |
| [01-error-model.md](./01-error-model.md) | Mã lỗi hiện tại, ánh xạ phía client, mô hình lỗi mục tiêu RFC 9457 |
| [02-fe-be-alignment-audit.md](./02-fe-be-alignment-audit.md) | **Báo cáo khớp frontend ↔ backend**: từng endpoint, từng mã trạng thái, khoảng trống |
| [03-webhooks-and-events.md](./03-webhooks-and-events.md) | Webhook vào (SePay, Polar), sự kiện nội bộ có phiên bản, idempotency |

## Quy trình thay đổi hợp đồng

1. Sửa `openapi.yaml` (và schema `zod` trong gói `contracts` khi có, task B06).
2. Chạy lint: `npx @redocly/cli@2.64.1 lint docs/05-api-contracts/openapi.yaml`.
3. Phân loại thay đổi:
   - **Tương thích** (thêm trường tùy chọn, thêm endpoint, thêm mã lỗi mới mà client cũ coi như lỗi chung) → tăng *minor* của `info.version`.
   - **Phá vỡ** (đổi/xóa trường, đổi ý nghĩa mã trạng thái) → **đường dẫn phiên bản mới** (`/sync/v2/…`), giữ v1 chạy song song tới khi client cũ hết lưu hành.
4. Cập nhật code Worker + client + test hợp đồng trong cùng PR.
5. Cập nhật [02-fe-be-alignment-audit.md](./02-fe-be-alignment-audit.md).

## Quy ước

- Đường dẫn có phiên bản theo tài nguyên: `/sync/v1/…`; endpoint mới dùng `/v1/<resource>`.
- JSON `camelCase`; thời gian ISO 8601 UTC; tiền tệ dùng **đơn vị nhỏ nhất** (`amountMinor`) + mã ISO 4217.
- Mọi phản hồi lỗi có trường `code` ổn định để client ánh xạ (mục tiêu RFC 9457).
- Không đặt dữ liệu cá nhân trong URL/query string.
