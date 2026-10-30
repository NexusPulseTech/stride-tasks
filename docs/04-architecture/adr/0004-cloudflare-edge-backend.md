# ADR-0004: Backend trên Cloudflare Workers + D1 + KV

- **Trạng thái**: Accepted (triển khai production 2026-10-30)
- **Ngày**: 2026-10-30
- **Liên quan**: [../04-backend-services-cloudflare.md](../04-backend-services-cloudflare.md), [../../09-operations/01-deployment-runbook.md](../../09-operations/01-deployment-runbook.md)

## Bối cảnh

Backend chỉ cần: nhận webhook thanh toán, phát hành token, lưu kho bản mã. Founder không muốn quản lý máy chủ. Domain `nexuspulsetech.xyz` đã nằm trên Cloudflare.

## Các phương án

1. **VPS/container (Node + Postgres)** — linh hoạt, nhưng phải vá lỗi, sao lưu, giám sát, trả phí cố định.
2. **Firebase/Supabase** — nhanh, nhưng khóa vào nhà cung cấp, mô hình dữ liệu cloud-first.
3. **Cloudflare Workers + D1 (SQLite, nhất quán mạnh trong một vị trí) + KV** — serverless, gói Free đủ cho giai đoạn đầu, custom domain + SSL tự động, cùng nhà cung cấp DNS.

## Quyết định

Chọn phương án 3. Custom Domain `tasks-api.nexuspulsetech.xyz`; tắt `workers.dev` và preview URL để chỉ có một điểm vào; D1 đặt ở APAC; deploy bằng `wrangler` ghim phiên bản.

## Hệ quả

- Tích cực: chi phí $0 tới khi vượt giới hạn Free; độ trễ thấp; không quản lý máy chủ.
- Tiêu cực: giới hạn runtime Workers (CPU time, kích thước hàng D1 ~2 MB → bản mã ≤ 1,9 MB); phụ thuộc nhà cung cấp — giảm thiểu bằng kiến trúc lục giác (adapter D1/KV thay được).
- Việc tiếp: CI/CD + staging (task B07); chuyển sang Workers Paid ($5/tháng) khi lưu lượng vượt Free.
