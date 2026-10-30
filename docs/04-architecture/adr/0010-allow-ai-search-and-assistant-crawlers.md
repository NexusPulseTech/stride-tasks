# ADR-0010: Cho phép bot AI tìm kiếm và trợ lý đọc site

- **Trạng thái**: Accepted (founder duyệt 2026-10-30); đã thực thi 2026-10-30 qua task [A09](../../10-execution-plan/A09-allow-ai-crawlers.md), bot AI nhận HTTP 200
- **Ngày**: 2026-10-30
- **Liên quan**: [../../02-growth/06-ai-search-geo.md](../../02-growth/06-ai-search-geo.md), [../../02-growth/08-seo-status-and-plan.md](../../02-growth/08-seo-status-and-plan.md)

## Bối cảnh

Kiểm tra ngày 2026-10-30 trên zone `nexuspulsetech.xyz`:
- Cloudflare trả **403** cho GPTBot, PerplexityBot, ClaudeBot (cài đặt chặn bot AI ở cấp zone).
- `robots.txt` do Cloudflare quản lý chèn `Disallow` cho hơn 40 bot, gồm ChatGPT-User, Perplexity-User, Claude-User, Google-Extended, GoogleOther, Applebot-Extended, Baiduspider, PetalBot.
- Googlebot, Bingbot, OAI-SearchBot vẫn truy cập được (200).

Với thị trường quốc tế (ADR-0009), người dùng ngày càng hỏi ChatGPT/Perplexity/Claude để tìm app. Bị chặn đồng nghĩa với việc các công cụ này không đọc và không trích dẫn được Stride. Trang chỉ chứa nội dung marketing; dữ liệu công việc nằm trên thiết bị người dùng, không có rủi ro lộ dữ liệu.

## Các phương án

1. Mở cho mọi bot AI (tìm kiếm, trợ lý, huấn luyện).
2. Mở cho bot tìm kiếm và trợ lý, giữ chặn bot huấn luyện.
3. Giữ nguyên.

## Quyết định

Chọn phương án 1 cho zone (founder chọn): trong Cloudflare, mục **Security Settings → Configure AI bot policies**, đặt Search, Agent, Training là **Allow**, và tắt **robots.txt do Cloudflare quản lý** để `public/robots.txt` của dự án (cho phép tất cả, có `Sitemap:`) được phục vụ nguyên bản.

## Hệ quả

- Tích cực: Stride có thể được AI search đọc, trích dẫn và học tên thương hiệu.
- Tiêu cực: áp dụng cho cả `www` và `dinhhuong` cùng zone (founder đã chấp nhận); nội dung marketing có thể được dùng để huấn luyện mô hình.
- Xác minh sau khi đổi: `curl -A "GPTBot/1.1" https://tasks.nexuspulsetech.xyz/en/` trả 200; `robots.txt` không còn khối "Cloudflare Managed content".
- Xem lại khi: có nội dung trả phí hoặc nội dung người dùng tạo trên site.
