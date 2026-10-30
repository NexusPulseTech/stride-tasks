# Trạng thái SEO & kế hoạch SEO quốc tế

> **Thuộc**: 02-growth · **Trạng thái**: Active · **Cập nhật**: 2026-10-30
> **Thị trường ưu tiên**: quốc tế, tiếng Anh (ADR-0009). Tiếng Việt duy trì.

## 1. Hiện trạng (đọc trực tiếp từ Google Search Console ngày 2026-10-30)

| Hạng mục | Kết quả |
| :--- | :--- |
| Property | Domain property `nexuspulsetech.xyz` đã xác minh |
| Hiệu suất 3 tháng của `tasks.nexuspulsetech.xyz/` | **5 lượt nhấp, 10 lượt hiển thị**, chỉ đến từ truy vấn thương hiệu "nexuspulse" |
| `/en/`, `/vi/` | Google chưa biết URL (trang mới đăng ngày 2026-10-30) |
| `/` | "Đã thu thập dữ liệu, hiện chưa được lập chỉ mục" (bản cũ là SPA ít chữ, tên "TaskTodo") |
| Sitemap | Gửi từ 2026-10-04 nhưng trạng thái **"Không thể tìm nạp", 0 trang**; sitemap `www` và `dinhhuong` cùng lỗi |
| Việc đã làm hôm nay | Gửi lại sitemap (Google báo gửi thành công); yêu cầu lập chỉ mục `/en/`, `/vi/`, `/` |
| Bot AI | Đã mở (A09, ADR-0010): GPTBot, PerplexityBot, ClaudeBot, ChatGPT-User nhận 200. Trước đó Cloudflare chặn 403 ở cấp zone |
| Bing | Đã nhập từ Search Console (A10): sitemap đang xử lý; đã gửi `/en/`, `/vi/`, `/`; IndexNow bật, lần gửi đầu HTTP 202 |
| `llms.txt` | Đã đăng tại `/llms.txt` theo đề xuất llmstxt.org. Google Search không dùng file này để xếp hạng; Lighthouse có audit thử nghiệm cho trình duyệt agent. Giữ vì chi phí gần 0, không kỳ vọng tăng hạng |

Google nói rõ: thu thập dữ liệu mất **"từ vài ngày đến vài tuần"**, yêu cầu lập chỉ mục nhiều lần cho cùng URL **không** nhanh hơn, và **"không ai có thể đảm bảo vị trí số 1"**.

## 2. Rủi ro đã phát hiện

| Rủi ro | Ảnh hưởng | Xử lý |
| :--- | :--- | :--- |
| Trùng tên "Stride": app mã nguồn mở `org.stridetasks.stride` trên F-Droid, "Stride: Plan & Achieve" (iOS, offline), "Daily Stride" | Truy vấn thương hiệu dễ ra app khác; tên tài khoản mạng xã hội có thể đã bị lấy | Luôn dùng đủ "Stride Tasks"; thêm `sameAs` (GitHub, X, Product Hunt) vào JSON-LD khi có tài khoản; tra cứu nhãn hiệu trước khi chi tiền quảng cáo |
| Đối thủ trực tiếp StudyTodo (iOS: nhắc ôn SRS + task + Pomodoro) | Cạnh tranh từ khóa "study planner spaced repetition" | Nhấn khác biệt: đa nền tảng, offline không tài khoản, đồng bộ mã hóa, mã nguồn mở |
| Từ khóa chung ("todo app", "task manager") do Todoist, Microsoft và bài tổng hợp lớn chiếm | Không thể lên top trong vài tháng | Không đua; nhắm từ khóa ngách (mục 4) |

## 3. Kế hoạch theo thứ tự

| # | Việc | Khi nào | Chỉ số đạt |
| :---: | :--- | :--- | :--- |
| 1 | Kiểm tra lại Search Console: sitemap "Thành công", `/en/` đã lập chỉ mục | Sau 3-7 ngày | `/en/` có trên Google |
| 2 | ✅ Bing Webmaster Tools: nhập site từ Search Console, gửi sitemap, bật IndexNow (task A10) | Xong 2026-10-30 | Site xuất hiện trong Bing |
| 3 | ✅ Mở bot AI theo ADR-0010 (task A09) | Xong 2026-10-30 | GPTBot nhận 200 |
| 4 | Trang nội dung tiếng Anh (task C01, C02): tính năng, so sánh, use case, template | Tuần 2-6 | 10+ trang EN được lập chỉ mục |
| 5 | Thư mục và danh sách (task C07): AlternativeTo, SaaSHub, Product Hunt, Indie Hackers, các bài "best offline to-do apps" | Tuần 1-4 | 5+ liên kết trỏ về |
| 6 | Trả lời hữu ích trên Reddit/HN ở các thread hỏi app offline, không tài khoản, có SRS (ghi rõ mình là người làm) | Liên tục | Lượt truy cập nguồn `reddit` |
| 7 | Đo hằng tuần (Search Console theo trang/truy vấn) và hằng tháng (15 câu hỏi AI search, xem [06-ai-search-geo.md](./06-ai-search-geo.md)) | Liên tục | Xu hướng tăng |

## 4. Từ khóa tiếng Anh mục tiêu (giả thuyết, kiểm chứng bằng Search Console sau khi được lập chỉ mục)

| Cụm | Ví dụ | Trang đích |
| :--- | :--- | :--- |
| Offline, riêng tư | offline todo app no account · private task manager no account | `/en/features/offline-private/` |
| Ôn tập ngắt quãng | todo app with spaced repetition · study planner spaced repetition | `/en/features/spaced-repetition/` |
| Pomodoro + task | pomodoro todo app offline · pomodoro task manager free | `/en/features/pomodoro/` |
| Thay thế | todoist alternative offline · ticktick alternative no account · super productivity alternative | `/en/compare/…` |
| Học tập | exam study plan template · revision timetable app | `/en/use-cases/…`, `/en/templates/…` |

Kết quả tìm kiếm thử cho "best offline todo app no account spaced repetition pomodoro" cho thấy chưa có app nào gộp đủ bốn yếu tố, đây là khoảng trống của Stride.

## 5. Mẫu thư xin được thêm vào bài tổng hợp (tiếng Anh)

```
Subject: An offline task app for your "best offline to-do apps" list

Hi [name],

I read your article "[title]" and found it genuinely useful. I'm the solo developer of Stride Tasks, a free, offline-first task manager that needs no account. It combines one-line capture, a Pomodoro timer and spaced-repetition reviews (SM-2) for tasks, with optional end-to-end encrypted sync.

If it fits your readers, I'd be grateful if you considered it for the list. Happy to answer any questions or give you PRO for free to test it.

https://tasks.nexuspulsetech.xyz/en/

Thanks,
[Your name]
```

Gửi tối đa vài thư mỗi ngày, cá nhân hóa từng thư, không gửi hàng loạt.

## Nguồn

- Google, Ask Google to recrawl: <https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl>
- Google, Do you need an SEO?: <https://developers.google.com/search/docs/fundamentals/do-i-need-seo>
- Stride trên F-Droid: <https://f-droid.org/packages/org.stridetasks.stride/> · Stride: Plan & Achieve: <https://apps.apple.com/us/app/id6477325236> · StudyTodo: <https://mwm.ai/apps/studytodo/6759635529>
