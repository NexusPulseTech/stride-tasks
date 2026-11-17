# A16: Video demo trên trang đích và bộ ảnh cho thư mục phần mềm

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | A: First Dollar |
| Ưu tiên | P1 (đợt bán thử; thư mục phần mềm tuần 2 đến 3) |
| Ước lượng | 2 giờ |
| Phụ thuộc | A15 |
| Trạng thái | ◐ 2026-11-18 |

## Mục tiêu
Người xem trang đích thấy app chạy thật trong chưa đầy 40 giây mà không làm trang chậm hay xô lệch; bộ đăng thư mục (AlternativeTo, SaaSHub, Product Hunt) có sẵn ảnh đúng kích thước và câu chữ đúng trạng thái hiện tại.

## Quyết định
1. Video `public/media/stride-demo-web-720_2026-11-18.mp4` (720×1280, 38,7 giây, H.264 và AAC, moov đặt trước mdat để phát ngay) và ảnh bìa `stride-demo-poster-720_2026-11-18.jpg`, do phiên Cố vấn Life OS dựng từ hình quay app thật, giọng đọc AI. Tên file có ngày nên không cần tham số `?v=`.
2. Đặt ngay sau phần hero của `/en/` và `/vi/`: nút CTA chính không bị đẩy xuống. Thẻ `<video controls playsinline preload="none" poster=…>`, không tự phát; `width`/`height` và `aspect-ratio: 9 / 16` giữ chỗ để không xô lệch; rộng tối đa 360 px.
3. Dòng chú thích: EN "AI voiceover · real app footage"; VI "Video tiếng Anh · giọng đọc AI · hình quay app thật".
4. Không đưa video vào bộ nhớ đệm PWA (mẫu precache chỉ gồm js, css, html, svg, png, json).
5. Chưa có phụ đề vì chưa có bản lời thoại; Lighthouse không trừ điểm (`video-caption` chỉ mang tính thông tin). Thêm `<track kind="captions">` khi có lời thoại.

## Các bước
1. Chép video và ảnh bìa vào `public/media/`; thêm khối video và CSS; tăng `?v=` của `site.css`.
2. Kiểm trên máy: bố cục điện thoại và desktop, video phát được, không tải video khi mở trang.
3. Lint, test, quét bí mật; deploy; kiểm production: file trả 200 `video/mp4`, yêu cầu Range trả 206 (Safari trên iPhone cần), LCP và CLS không xấu đi so với trước.
4. Bộ thư mục: rà `08-directory-listings.md` và `05-community-posts.md`, thêm link video; xuất 4 ảnh app thật 1270×760 và icon 240×240.

## Tiêu chí nghiệm thu
- [x] Trước khi sửa (production `/en/`, giả lập điện thoại, 4G chậm, CPU chậm 4 lần): LCP 1985 ms và 1976 ms, CLS 0,00; Lighthouse trợ năng, thực hành tốt, SEO đều 100.
- [x] Trên máy: video 360×640 trên điện thoại, nút CTA vẫn cách đỉnh 383 px; không tải mp4 khi mở trang; phát được (38,70 giây, 720×1280); Lighthouse trợ năng 100, SEO 100 (thực hành tốt 96 chỉ do lỗi CORS của bộ đếm Cloudflare trên localhost).
- [ ] Production: 200 `video/mp4`, Range 206, LCP và CLS không xấu đi.
- [ ] Bộ thư mục: ảnh và icon xuất xong, tài liệu cập nhật.

## Rủi ro & rollback
- Video nặng 2,27 MB chỉ tải khi người xem bấm phát. Rollback: bỏ khối `section.demo` hoặc revert commit.
