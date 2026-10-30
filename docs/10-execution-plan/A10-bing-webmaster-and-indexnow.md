# A10: Bing Webmaster Tools + IndexNow

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | A: First Dollar |
| Ưu tiên | P1 |
| Ước lượng | 0,2 ngày |
| Phụ thuộc | Founder đăng nhập Bing Webmaster Tools (tài khoản Microsoft hoặc Google) |
| Trạng thái | ⏳ Chờ đăng nhập |

## Mục tiêu
Site có mặt trong chỉ mục Bing. Bing cung cấp kết quả cho Microsoft Copilot và một phần câu trả lời của các công cụ AI search, quan trọng với người dùng quốc tế và Microsoft Store.

## Các bước
1. Bing Webmaster Tools → **Import from Google Search Console** (cấp quyền đọc Search Console khi Bing hỏi) → chọn property `nexuspulsetech.xyz`.
2. Kiểm tra sitemap `https://tasks.nexuspulsetech.xyz/sitemap.xml` đã có trong Bing; nếu chưa, gửi thủ công.
3. **URL Submission**: gửi `/en/`, `/vi/`, `/`.
4. IndexNow (giai đoạn sau, khi có nhiều trang nội dung): tạo khóa IndexNow, đặt file khóa ở gốc site, gửi danh sách URL mỗi lần deploy trang mới (theo hướng dẫn chính thức của IndexNow/Bing).

## Tiêu chí nghiệm thu
- [ ] Site `tasks.nexuspulsetech.xyz` (hoặc domain property) hiện trong Bing Webmaster Tools.
- [ ] Sitemap trạng thái thành công.
- [ ] 3 URL đã gửi.

## Rủi ro
Cấp quyền cho Bing đọc dữ liệu Search Console: chỉ đọc, thu hồi được trong tài khoản Google (Bảo mật → Ứng dụng bên thứ ba).
