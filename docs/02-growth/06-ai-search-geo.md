# AI search (Generative Engine Optimization — GEO)

> **Thuộc**: 02-growth · **Trạng thái**: Draft v1 · **Cập nhật**: 2026-10-30
> **Mục đích**: tăng khả năng Stride được ChatGPT, Perplexity, Gemini, Google AI Overviews **nhắc tới** khi người dùng hỏi về app quản lý công việc offline / học bằng ôn tập ngắt quãng.

## 1. Thực tế cần biết

- AI search không có "vị trí số 1"; thứ đo được là **tần suất được nhắc**.
- Mô hình học và trích dẫn từ: trang của bạn **và** nguồn bên thứ ba (Reddit, thư mục như AlternativeTo, bài review, GitHub).
- `llms.txt` là đề xuất còn sớm, chưa có bằng chứng các công cụ lớn dùng nó cho đề xuất sản phẩm → làm vì rẻ, không kỳ vọng.

## 2. Việc làm

| # | Việc | Ghi chú |
| :---: | :--- | :--- |
| 1 | **Không chặn** bot AI trong `robots.txt` (GPTBot, ClaudeBot, PerplexityBot, Google-Extended) | `robots.txt` hiện cho phép tất cả — giữ nguyên |
| 2 | Trang "sự thật" rõ ràng: *Stride là gì, giá bao nhiêu, chạy trên nền tảng nào, khác gì đối thủ* | Trang đích + trang giá + trang so sánh, viết câu khẳng định ngắn, dễ trích |
| 3 | Thông tin thực thể **nhất quán** ở mọi nơi (tên, mô tả một câu, URL) | Website, Microsoft Store, GitHub repo, AlternativeTo, Product Hunt |
| 4 | JSON-LD `SoftwareApplication` đúng | Xem [01-technical-seo-audit.md](./01-technical-seo-audit.md) |
| 5 | Có mặt ở nguồn bên thứ ba có uy tín | Thư mục, bài cộng đồng, bài so sánh của người khác |
| 6 | `llms.txt` ở gốc site: mô tả sản phẩm + liên kết trang chính | Chi phí ~15 phút |

## 3. Đo hằng tháng

Hỏi 15 câu cố định trên ChatGPT (có tìm kiếm), Perplexity và Google, ví dụ:
*"best offline todo app without account"*, *"spaced repetition planner for exam revision"*, *"Todoist alternative that works offline"*, *"app quản lý công việc offline tốt nhất"*.
Ghi vào bảng: có được nhắc không, đối thủ nào được nhắc, nguồn được trích dẫn — để biết cần có mặt ở nguồn nào.

## Nguồn (nguồn thứ ba, mang tính định hướng)

- <https://llmrefs.com/generative-engine-optimization>
- <https://asisteclick.com/en/blog/aparecer-en-chatgpt-perplexity-empresas/>
