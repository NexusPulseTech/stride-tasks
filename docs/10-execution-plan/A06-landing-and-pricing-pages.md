# A06: Trang đích + bảng giá EN/VI (Astro)

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | A: First Dollar |
| Ưu tiên | P0 |
| Ước lượng | 1,5 ngày |
| Phụ thuộc | A01 |
| Trạng thái | ☐ Todo |

## Mục tiêu
`/en/` và `/vi/` là HTML tĩnh hoàn chỉnh (hero, 3 điểm khác biệt, cách hoạt động, giá, FAQ, CTA), `hreflang` hai chiều; gốc `/` chuyển metadata sang EN.

## Vì sao
SPA không có nội dung cho bot; người lạ cần hiểu sản phẩm và giá trước khi mở app. ADR-0007.

## Phạm vi
- Trong: thư mục `site/` (Astro, i18n routing), 2 trang đích có bảng giá + FAQ, tích hợp build, cập nhật Workbox, `quan-ly-cong-viec.html` → canonical về `/vi/`.
- Ngoài: trang tính năng/so sánh/blog (C01).

## Các bước
1. Tạo `site/` với Astro (ghim phiên bản phát hành ≥ 2 tuần), `output: 'static'`, `i18n: { locales: ['en','vi'], defaultLocale: 'en', routing: { prefixDefaultLocale: true } }`.
2. Layout chung: `<html lang>`, title/description theo trang, canonical tự tham chiếu, `hreflang` en/vi + `x-default` → `/en/`, OG.
3. Nội dung theo [../02-growth/02-site-architecture-and-landing-pages.md](../02-growth/02-site-architecture-and-landing-pages.md) mục 3-4; ảnh từ `public/screenshots/`; giá hiển thị 3 bậc PPP + ưu đãi Founding + hoàn tiền 14 ngày.
4. CTA "Mở app" → `/?utm_source=landing&utm_medium=site`; "Xem giá" → `#pricing`.
5. Build: script `build:site` → xuất vào `dist/en`, `dist/vi`; `npm run build` chạy app rồi site; `deploy.yml` không đổi ngoài lệnh build.
6. `vite.config.ts`: thêm `/^\/(en|vi)\//` vào `navigateFallbackDenylist`; `globIgnores` thêm `**/en/**`, `**/vi/**`.
7. `index.html`: `lang="en"`, title/description EN, thêm `hreflang` trỏ `/en/` & `/vi/`.
8. `sitemap.xml`: sinh bởi `@astrojs/sitemap` + gộp URL app.

## Tiêu chí nghiệm thu
- [ ] `curl -s .../en/ | grep "<h1"` có nội dung (không cần JS); tương tự `/vi/`.
- [ ] Lighthouse mobile `/en/`, `/vi/`: Performance/SEO/Accessibility ≥ 95.
- [ ] Trên trình duyệt đã cài PWA, mở `/en/` vẫn thấy trang marketing.
- [ ] Bundle app không đổi kích thước đáng kể; ngân sách vẫn đạt.

## Rủi ro & rollback
SW cũ có thể cache `navigateFallback` → người dùng cũ thấy app ở `/en/` cho tới khi SW cập nhật (autoUpdate). Rollback: revert, trang `/en/` biến mất, app không ảnh hưởng.

## Tham chiếu
- [../04-architecture/adr/0007-static-marketing-site-same-origin.md](../04-architecture/adr/0007-static-marketing-site-same-origin.md)
