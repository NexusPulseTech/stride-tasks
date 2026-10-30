# C01: Site marketing đầy đủ (tính năng, so sánh, use case, blog)

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | C: Growth engine |
| Ưu tiên | P1 |
| Ước lượng | 3 ngày |
| Phụ thuộc | A06 |
| Trạng thái | ☐ Todo |

## Mục tiêu
Mở rộng `site/` (Astro) thành đủ sơ đồ URL ở [../02-growth/02-site-architecture-and-landing-pages.md](../02-growth/02-site-architecture-and-landing-pages.md) mục 2, mỗi loại trang có template chuẩn SEO.

## Các bước
1. Template: `FeaturePage`, `ComparePage`, `UseCasePage`, `TemplatePage`, `BlogPost` (Astro content collections, frontmatter có kiểu: `title`, `description`, `lang`, `translationKey`, `updated`).
2. Helper `hreflang` tự ghép cặp theo `translationKey`; trang chưa dịch không xuất `hreflang` sai.
3. Trang khởi đầu: 6 trang tính năng, 3 trang so sánh (Todoist, TickTick, Focus To-Do, nêu trung thực điểm đối thủ hơn), 2 use case, 3 template Quick Paste; mỗi trang EN + VI.
4. JSON-LD theo loại trang: `SoftwareApplication` (trang chủ), `FAQPage` chỉ khi có FAQ thật hiển thị, `Article` cho blog, `BreadcrumbList`.
5. OG image tự sinh theo tiêu đề (build-time).
6. Dùng chung design token với app ([../08-design-system/02-design-tokens.md](../08-design-system/02-design-tokens.md)).
7. Lighthouse CI cho 5 trang mẫu trong `ci.yml`.

## Tiêu chí nghiệm thu
- [ ] ≥ 28 trang (14 × 2 ngôn ngữ) có trong sitemap, HTML thô đủ nội dung.
- [ ] Lighthouse ≥ 95 (Performance/SEO/A11y) trên trang mẫu; JS mỗi trang ≤ 10 kB.
- [ ] Search Console không báo lỗi `hreflang`/canonical sau 2 tuần.
