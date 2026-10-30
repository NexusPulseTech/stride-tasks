# A09: Mở bot AI tìm kiếm và trợ lý trên Cloudflare

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | A: First Dollar |
| Ưu tiên | P0 (thị trường quốc tế, AI search) |
| Ước lượng | 0,2 ngày |
| Phụ thuộc | Founder đăng nhập lại Cloudflare dashboard (phiên cũ đã hết hạn) |
| Trạng thái | ⏳ Chờ đăng nhập |
| Quyết định | [ADR-0010](../04-architecture/adr/0010-allow-ai-search-and-assistant-crawlers.md) |

## Mục tiêu
ChatGPT, Perplexity, Claude, Gemini đọc được `tasks.nexuspulsetech.xyz` để có thể trích dẫn và gợi ý Stride.

## Các bước
1. Cloudflare → zone `nexuspulsetech.xyz` → **Security Settings → Configure AI bot policies**: đặt Search, Agent, Training = **Allow**. (Cài đặt cũ "Block AI bots" đã được Cloudflare thay bằng mục này.)
2. Tắt **robots.txt do Cloudflare quản lý** (khối "Cloudflare Managed content") để `public/robots.txt` của dự án được phục vụ nguyên bản.
3. Kiểm tra (mục Xác minh). Ghi kết quả vào ADR-0010.

## Tiêu chí nghiệm thu
- [ ] `GPTBot`, `PerplexityBot`, `ClaudeBot` nhận HTTP 200 trên `/en/`.
- [ ] `robots.txt` không còn `Disallow` cho ChatGPT-User, Perplexity-User, Claude-User, Google-Extended.
- [ ] Googlebot, Bingbot vẫn 200 (không ảnh hưởng SEO thường).

## Xác minh
```bash
for ua in "GPTBot/1.1" "PerplexityBot/1.0" "ClaudeBot/1.0" "Googlebot/2.1"; do
  curl -s -o /dev/null -w "%{http_code} $ua\n" -A "$ua" https://tasks.nexuspulsetech.xyz/en/; done
curl -s https://tasks.nexuspulsetech.xyz/robots.txt | grep -c "Cloudflare Managed"   # mong đợi 0
```

## Rủi ro & rollback
Áp dụng cho cả `www` và `dinhhuong` (founder đã chấp nhận). Rollback: bật lại policy Block trong cùng màn hình.
