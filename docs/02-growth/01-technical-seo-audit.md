# Audit SEO kỹ thuật (hiện trạng v3.1.0)

> **Thuộc**: 02-growth · **Trạng thái**: Draft v1 · **Cập nhật**: 2026-10-30
> **Phạm vi**: `index.html`, `public/sitemap.xml`, `public/robots.txt`, `public/quan-ly-cong-viec.html`, `vite.config.ts` (Service Worker).

## 1. Phát hiện (sắp theo mức nghiêm trọng)

| # | Mức | Phát hiện (bằng chứng) | Hậu quả |
| :---: | :---: | :--- | :--- |
| 1 | 🔴 | **Sai thương hiệu**: `<title>`, `og:site_name`, `apple-mobile-web-app-title`, JSON-LD `name` đều là **"TaskTodo" / "NexusPulse TaskTodo"**, trong khi sản phẩm, manifest, store listing là **Stride Tasks** | Google/AI search hiểu sai tên sản phẩm; người tìm "Stride Tasks" không thấy trang; mất niềm tin |
| 2 | 🔴 | Metadata gốc **chỉ tiếng Việt** (`og:locale=vi_VN`, `inLanguage: vi`), không có `hreflang` | Gần như vô hình với truy vấn tiếng Anh/toàn cầu |
| 3 | 🔴 | SPA client-rendered: nội dung Google thấy là **giao diện app**, không phải nội dung giới thiệu; `<noscript>` mô tả tính năng cũ ("3 trạng thái") | Không có trang nào xếp hạng cho từ khóa tính năng |
| 4 | 🟠 | `viewport` có `maximum-scale=1.0, user-scalable=no` (cả trong `quan-ly-cong-viec.html`) | Vi phạm WCAG 1.4.4 (không phóng to được), bị Lighthouse trừ điểm Accessibility |
| 5 | 🟠 | `quan-ly-cong-viec.html` là một **mini-app cũ** độc lập ("Công Việc - Tối Giản…") | Nội dung trùng/mỏng, lẫn thương hiệu |
| 6 | 🟠 | `sitemap.xml` chỉ có 1 URL, `lastmod` 2026-10-03; thiếu `privacy.html` và trang mới | Bot chậm phát hiện trang |
| 7 | 🟡 | JSON-LD `WebApplication` giá 0 VND, `featureList` lỗi thời, không có `aggregateRating`/`review` | Không đủ điều kiện rich result (Google yêu cầu `name`, `offers.price` và một trong `aggregateRating`/`review`) |
| 8 | 🟡 | `<meta name="keywords">` | Google bỏ qua, chỉ là nhiễu |
| 9 | 🟡 | GitHub Pages không cho đặt header (CSP, HSTS) và không có 301 thật | Hạn chế bảo mật & điều hướng, xử lý qua Cloudflare (đang proxy) hoặc chuyển hosting (ADR-0007) |
| 10 | ⚠️ | Workbox `navigateFallback: 'index.html'` chỉ loại trừ đường dẫn `*.html` | Khi thêm trang tĩnh dạng `/en/`, `/vi/`, **Service Worker sẽ trả app shell thay cho trang marketing**: phải thêm vào `navigateFallbackDenylist` |

Điểm tốt: có `canonical`, OG image 1200×630, file xác minh Google Search Console, `robots.txt` cho phép tất cả + khai báo sitemap.

## 2. Danh sách sửa

### Đợt 1: trước khi outreach (task `A01`)

- [ ] Đổi toàn bộ "TaskTodo" → **Stride Tasks** (title, description, OG, Twitter, Apple title, JSON-LD, noscript).
- [ ] Title gốc (EN): `Stride Tasks, Offline Task Manager with Pomodoro & Spaced Repetition`.
- [ ] Description (≤ 155 ký tự): `Plan in one line, focus with Pomodoro, review on time with SM-2. Offline-first, no account, optional end-to-end encrypted sync.`
- [ ] Viewport: `width=device-width, initial-scale=1, viewport-fit=cover` (chống zoom input iOS bằng font ≥ 16px thay vì khóa zoom).
- [ ] Xóa `meta keywords`.
- [ ] JSON-LD `SoftwareApplication` (đồng loại `WebApplication`): `offers` chỉ gồm Free (`price: 0`) cho tới khi PRO mở bán thật, khi đó thêm PRO (`price: 19`, `priceCurrency: USD`), `inLanguage: ["en","vi"]`, `operatingSystem`, `applicationCategory: ProductivityApplication`. **Chỉ thêm `aggregateRating` khi có đánh giá thật.**
- [ ] `<noscript>` cập nhật đúng tính năng v3.1.

### Đợt 2: trang đích tĩnh (task `A06`, `C01`)

- [ ] `/en/` và `/vi/` (HTML tĩnh), `hreflang` hai chiều + `x-default`, canonical tự tham chiếu.
- [ ] `quan-ly-cong-viec.html` → viết lại thành trang đích tiếng Việt có canonical về `/vi/` (giữ URL vì có thể đã có thứ hạng cho "quản lý công việc").
- [ ] Thêm đường dẫn marketing vào `navigateFallbackDenylist` và `globIgnores` của Workbox.
- [ ] Sitemap sinh tự động lúc build, gồm mọi trang + `lastmod` thật.
- [ ] Đăng ký **Bing Webmaster Tools** + bật IndexNow; gửi sitemap lên cả Google & Bing.

### Đợt 3: nền tảng

- [ ] Header bảo mật (CSP, HSTS, X-Content-Type-Options) qua Cloudflare Transform Rules hoặc khi chuyển sang Workers Static Assets.
- [ ] OG image riêng cho từng ngôn ngữ/trang chính.

## 3. Kiểm tra sau mỗi đợt

- Google Rich Results Test + Schema Markup Validator cho JSON-LD.
- Lighthouse (SEO ≥ 95, Accessibility ≥ 95) cho `/`, `/en/`, `/vi/`.
- `curl -s https://tasks.nexuspulsetech.xyz/en/ | grep -i "<h1"`: nội dung phải có trong HTML thô (không cần JS).
- Search Console: URL Inspection → "View crawled page".

## Nguồn

- Google, SoftwareApplication structured data: <https://developers.google.com/search/docs/appearance/structured-data/software-app>
- Rủi ro SEO của SPA chỉ render phía client (tổng hợp): <https://www.weweb.io/blog/seo-single-page-application-ultimate-guide>
- WCAG 2.2, 1.4.4 Resize Text: <https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html>
