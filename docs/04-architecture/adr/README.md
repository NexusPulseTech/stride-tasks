# Architecture Decision Records (ADR)

> **Thuộc**: 04-architecture/adr · **Cập nhật**: 2026-10-30
> **Chuẩn**: mẫu ADR của Michael Nygard. Mỗi quyết định kiến trúc có ảnh hưởng lâu dài = 1 file, đánh số tăng dần, **không sửa nội dung ADR đã Accepted**: tạo ADR mới với trạng thái *Supersedes ADR-xxxx*.

## Vòng đời

`Proposed` → (chủ sản phẩm duyệt) → `Accepted` → (khi bị thay) `Superseded by ADR-yyyy` · hoặc `Rejected`.

## Danh mục

| # | Quyết định | Trạng thái |
| :---: | :--- | :--- |
| [0001](./0001-local-first-no-account.md) | Local-first, không bắt buộc tài khoản | Accepted |
| [0002](./0002-offline-ed25519-license-tokens.md) | Bản quyền bằng token Ed25519 xác minh offline | Accepted |
| [0003](./0003-e2e-encrypted-sync-lww.md) | Đồng bộ mã hóa đầu-cuối, hợp nhất LWW + tombstone | Accepted |
| [0004](./0004-cloudflare-edge-backend.md) | Backend trên Cloudflare Workers + D1 + KV | Accepted |
| [0005](./0005-modular-monolith-first.md) | Thiết kế microservices-ready, tách dịch vụ khi đạt điều kiện | Proposed |
| [0006](./0006-polar-as-international-mor.md) | Polar thay LemonSqueezy làm MoR quốc tế | Proposed |
| [0007](./0007-static-marketing-site-same-origin.md) | Trang marketing tĩnh (Astro) cùng origin với app | Proposed |
| [0008](./0008-source-license-strategy.md) | Chiến lược giấy phép mã nguồn (MIT hay thay đổi) | Accepted 2026-10-31: `FSL-1.1-MIT` |
| [0009](./0009-international-first-market-focus.md) | Thị trường quốc tế là mục tiêu chính | Accepted |
| [0010](./0010-allow-ai-search-and-assistant-crawlers.md) | Cho phép bot AI tìm kiếm và trợ lý đọc site | Accepted (chờ thực thi) |

Mẫu cho ADR mới: [0000-template.md](./0000-template.md).
