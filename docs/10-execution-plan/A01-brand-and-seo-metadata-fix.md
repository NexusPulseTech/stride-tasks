# A01 — Sửa thương hiệu & SEO metadata

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | A — First Dollar |
| Ưu tiên | P0 (chặn bán) |
| Ước lượng | 0,5 ngày |
| Phụ thuộc | — |
| Trạng thái | ☐ Todo |

## Mục tiêu
Mọi metadata công khai mang đúng tên **Stride Tasks**, mô tả đúng tính năng v3.1, không chặn phóng to, JSON-LD hợp lệ.

## Vì sao
`index.html` đang dùng "TaskTodo"/"NexusPulse TaskTodo" (title, OG, Twitter, Apple title, JSON-LD, noscript) trong khi sản phẩm, manifest, store listing là Stride Tasks; `user-scalable=no` vi phạm WCAG 1.4.4. Xem [../02-growth/01-technical-seo-audit.md](../02-growth/01-technical-seo-audit.md).

## Phạm vi
- Trong: `index.html`, `public/quan-ly-cong-viec.html` (chỉ viewport), `public/sitemap.xml`.
- Ngoài: đổi ngôn ngữ gốc sang EN và `hreflang` (làm ở A06 khi đã có `/vi/` — tránh mất thứ hạng tiếng Việt trước khi có trang thay thế).

## Các bước
1. `index.html`: thay "TaskTodo" ở `<title>`, `meta[name=title]`, `description`, `og:*`, `twitter:*`, `apple-mobile-web-app-title` (→ `Stride Tasks`), `og:site_name` (→ `Stride Tasks`).
   Title đề xuất (giai đoạn còn `lang="vi"`): `Stride Tasks — Quản lý công việc offline, Pomodoro & ôn tập ngắt quãng`.
2. Viewport → `width=device-width, initial-scale=1, viewport-fit=cover` (cả `quan-ly-cong-viec.html`); kiểm tra input trên iOS có `font-size ≥ 16px` để không tự zoom.
3. Xóa `<meta name="keywords">`.
4. JSON-LD → `@type: ["SoftwareApplication", "WebApplication"]`, `name: "Stride Tasks"`, `applicationCategory: "ProductivityApplication"`, `operatingSystem: "Web, Windows, Android, iOS (PWA)"`, `inLanguage: ["vi", "en"]`, `offers`: Free (`price: "0"`, `USD`) và PRO (`price: "25.95"`, `USD`), `featureList` đúng v3.1 (nhập nhanh NLP, Kanban, Pomodoro + Deep Work, SM-2, đồng bộ E2E). **Không** thêm `aggregateRating` khi chưa có đánh giá thật.
5. `<noscript>`: nội dung mô tả đúng tính năng hiện tại (song ngữ ngắn).
6. `sitemap.xml`: thêm `privacy.html`; `lastmod` = ngày deploy.

## Tiêu chí nghiệm thu
- [ ] `grep -ri "tasktodo" index.html public/` → không còn kết quả.
- [ ] Google Rich Results Test / Schema Validator: JSON-LD không lỗi.
- [ ] Lighthouse (mobile) trên `/`: SEO ≥ 95, Accessibility không còn lỗi viewport.
- [ ] Phóng to bằng hai ngón trên điện thoại hoạt động.
- [ ] `npm run lint` + `npm run build` xanh.

## Xác minh
`curl -s https://tasks.nexuspulsetech.xyz/ | grep -iE "<title>|og:site_name|apple-mobile-web-app-title"` sau deploy.

## Rủi ro & rollback
Thấp. Revert commit nếu bố cục mobile bị ảnh hưởng do bỏ khóa zoom (sửa bằng cỡ chữ input, không khóa lại zoom).

## Tham chiếu
- [../02-growth/01-technical-seo-audit.md](../02-growth/01-technical-seo-audit.md) · [../08-design-system/04-accessibility.md](../08-design-system/04-accessibility.md)
