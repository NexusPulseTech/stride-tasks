# 09: Operations

> **Thuộc**: 09-operations · **Trạng thái**: Draft v1 · **Cập nhật**: 2026-10-30
> **Mục đích**: làm đúng các việc vận hành lặp lại (deploy, bật thanh toán, xử lý sự cố, hỗ trợ khách) mà không cần nhớ.

| File | Nội dung |
| :--- | :--- |
| [01-deployment-runbook.md](./01-deployment-runbook.md) | Deploy web, Worker, D1; kiểm tra sau deploy; rollback |
| [02-payments-and-licensing-runbook.md](./02-payments-and-licensing-runbook.md) | Bật thanh toán, cấp bản quyền thủ công, hoàn tiền, khôi phục bản quyền |
| [03-incident-response.md](./03-incident-response.md) | Mức độ sự cố, kịch bản xử lý, mẫu postmortem |
| [04-customer-support-playbook.md](./04-customer-support-playbook.md) | Kênh hỗ trợ, thời gian phản hồi, mẫu trả lời VI/EN |
| [maintenance-and-inheritance.md](./maintenance-and-inheritance.md) | Hướng dẫn bàn giao cho kỹ sư kế tiếp (đã có) |

**Tài nguyên production** (không phải bí mật): web `https://tasks.nexuspulsetech.xyz` · API `https://tasks-api.nexuspulsetech.xyz` · Cloudflare account `54a0a2e6fd9115d32f9cf767f9ab4764` · Worker `stride-license` · D1 `stride-sync` · KV `LICENSES`. ID KV/D1 thật chỉ nằm trong `cloudflare-worker/wrangler.toml` (gitignore).
