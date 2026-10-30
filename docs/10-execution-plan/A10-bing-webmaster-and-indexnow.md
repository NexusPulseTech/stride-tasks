# A10: Bing Webmaster Tools + IndexNow

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | A: First Dollar |
| Ưu tiên | P1 |
| Ước lượng | 0,2 ngày |
| Phụ thuộc | Founder đăng nhập Bing Webmaster Tools (tài khoản Microsoft hoặc Google) |
| Trạng thái | ☑ Xong (2026-10-30) |

## Mục tiêu
Site có mặt trong chỉ mục Bing. Bing cung cấp kết quả cho Microsoft Copilot và một phần câu trả lời của các công cụ AI search, quan trọng với người dùng quốc tế và Microsoft Store.

## Các bước
1. Bing Webmaster Tools → **Import from Google Search Console** (cấp quyền đọc Search Console khi Bing hỏi) → chọn property `nexuspulsetech.xyz`.
2. Kiểm tra sitemap `https://tasks.nexuspulsetech.xyz/sitemap.xml` đã có trong Bing; nếu chưa, gửi thủ công.
3. **URL Submission**: gửi `/en/`, `/vi/`, `/`.
4. IndexNow: tạo khóa (`npm run indexnow -- init`), deploy, kiểm tra file khóa (`check`), gửi URL (`submit`) mỗi lần thêm hoặc sửa trang, theo [đặc tả IndexNow](https://www.indexnow.org/documentation).

## Tiêu chí nghiệm thu
- [x] Site `tasks.nexuspulsetech.xyz` (hoặc domain property) hiện trong Bing Webmaster Tools.
- [x] Sitemap đã gửi (Bing đang xử lý, xem lại sau 48 giờ).
- [x] 3 URL đã gửi.

## Kết quả (2026-10-30)
- Nhập từ Search Console: `tasks.nexuspulsetech.xyz`, `dinhhuong.nexuspulsetech.xyz`, `nexuspulsetech.xyz` (không nhập `tingnect.com` theo yêu cầu founder).
- Sitemap `https://tasks.nexuspulsetech.xyz/sitemap.xml`: Bing đã nhận, trạng thái "Processing"; Bing báo số liệu có thể mất tới 48 giờ.
- URL Submission: `/en/`, `/vi/`, `/` (hạn mức 100 URL/ngày).
- IndexNow: file khóa ở gốc site (khóa công khai theo thiết kế của giao thức), script `scripts/indexnow.mjs`. Lần gửi đầu 6 URL trong sitemap: HTTP 202 (đã nhận, khóa đang chờ xác minh).
- Khi nào gửi lại: [../09-operations/01-deployment-runbook.md](../09-operations/01-deployment-runbook.md) mục 1a.

## Rủi ro
Cấp quyền cho Bing đọc dữ liệu Search Console: chỉ đọc, thu hồi được trong tài khoản Google (Bảo mật → Ứng dụng bên thứ ba).
