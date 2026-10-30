# ADR-0007: Trang marketing tĩnh (Astro) cùng origin với app

- **Trạng thái**: Proposed
- **Ngày**: 2026-10-30
- **Liên quan**: [../../02-growth/02-site-architecture-and-landing-pages.md](../../02-growth/02-site-architecture-and-landing-pages.md), tasks A06, C01

## Bối cảnh

App là SPA render phía client ở `/`; bot tìm kiếm thấy giao diện app thay vì nội dung giới thiệu. Dữ liệu người dùng gắn với origin `tasks.nexuspulsetech.xyz` (localStorage), PWA đã cài có scope `/`. Hosting là GitHub Pages (không có header tùy chỉnh, không 301).

## Các phương án

1. **Marketing ở domain gốc, app chuyển sang `app.` subdomain** (chuẩn của Todoist/Linear) — đổi origin ⇒ người dùng hiện tại mất dữ liệu nếu không có công cụ chuyển.
2. **Prerender toàn bộ SPA** — phức tạp, nội dung app vẫn không phải nội dung marketing.
3. **Trang tĩnh sinh bằng Astro ở các đường dẫn `/en/`, `/vi/`, … trên cùng origin; app giữ ở `/`** — không đổi origin, không phá PWA, SEO tốt.

## Quyết định

Chọn phương án 3 cho giai đoạn hiện tại. Workbox phải loại các đường dẫn marketing khỏi `navigateFallback` và precache. Xem lại phương án 1 khi đã có tên miền thương hiệu riêng **và** đồng bộ đã bật (người dùng chuyển dữ liệu dễ dàng).

## Hệ quả

- Tích cực: an toàn dữ liệu; trang marketing nhẹ, index tốt; dùng lại design token.
- Tiêu cực: `/` (URL mạnh nhất) vẫn là app → trang đích chính là `/en/`, `/vi/`; build có thêm bước Astro.
- Việc tiếp: cân nhắc chuyển hosting sang Cloudflare Workers Static Assets để đặt header bảo mật & redirect thật (ADR riêng khi làm).
