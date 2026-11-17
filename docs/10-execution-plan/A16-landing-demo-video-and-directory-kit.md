# A16: Video demo trên trang đích và bộ ảnh cho thư mục phần mềm

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | A: First Dollar |
| Ưu tiên | P1 (đợt bán thử; thư mục phần mềm tuần 2 đến 3) |
| Ước lượng | 2 giờ |
| Phụ thuộc | A15 |
| Trạng thái | ◐ 2026-11-18 (video xong, phiên Cố vấn nghiệm thu đạt 2026-11-18: 724fb76, d64068a, 9bd31fb; chữ bộ thư mục xong; còn ảnh từ phiên chụp ảnh, đọc số lần 1, bản YouTube) |

## Mục tiêu
Người xem trang đích thấy app chạy thật trong chưa đầy 40 giây mà không làm trang chậm hay xô lệch; bộ đăng thư mục (AlternativeTo, SaaSHub, Product Hunt) có sẵn ảnh đúng kích thước và câu chữ đúng trạng thái hiện tại.

## Quyết định
1. Video `public/media/stride-demo-web-720_2026-11-18.mp4` (720×1280, 38,7 giây, H.264 và AAC, moov đặt trước mdat để phát ngay) và ảnh bìa `stride-demo-poster-720_2026-11-18.jpg`, do phiên Cố vấn Life OS dựng từ hình quay app thật, giọng đọc AI. Tên file có ngày nên không cần tham số `?v=`.
2. Ảnh bìa không gắn thẳng trong HTML (`data-poster`): `public/site-pricing.js` gắn sau sự kiện load, khi video sắp vào màn hình. Đo production: gắn thẳng làm LCP tăng khoảng 240 ms vì ảnh bìa tranh băng thông với ảnh hero.
3. Đặt ngay sau phần hero của `/en/` và `/vi/`: nút CTA chính không bị đẩy xuống. Thẻ `<video controls playsinline preload="none" data-poster=…>`, không tự phát; `width`/`height` và `aspect-ratio: 9 / 16` giữ chỗ để không xô lệch; rộng tối đa 360 px.
4. Dòng chú thích: EN "AI voiceover · real app footage"; VI "Video tiếng Anh · giọng đọc AI · hình quay app thật".
5. Không đưa video vào bộ nhớ đệm PWA (mẫu precache chỉ gồm js, css, html, svg, png, json).
6. Không thêm `<track kind="captions">`: video có phụ đề in sẵn (open captions), WCAG 1.2.2 chấp nhận; thêm track sẽ hiện chữ trùng. Lighthouse không trừ điểm. Đối chiếu mã nguồn video (ngoài repo, 2026-11-18): lời đọc gồm 6 câu; câu 0 hiện nguyên văn ở màn mở đầu (cũng là ảnh bìa), câu 1, 2, 4 hiện từng câu nguyên văn theo mốc thời gian của giọng đọc, câu 3 nguyên văn trừ đoạn cuối "One day, three, seven, sixteen." hiện bằng các nút trên dòng thời gian "1 day / 3 days / 7 days / 16 days / 35 days" (cùng nghĩa, không nguyên văn), câu 5 hiện ở màn kết.

## Các bước
1. Chép video và ảnh bìa vào `public/media/`; thêm khối video và CSS; tăng `?v=` của `site.css`.
2. Kiểm trên máy: bố cục điện thoại và desktop, video phát được, không tải video khi mở trang.
3. Lint, test, quét bí mật; deploy; kiểm production: file trả 200 `video/mp4`, yêu cầu Range trả 206 (Safari trên iPhone cần), LCP và CLS không xấu đi so với trước.
4. Bộ thư mục: rà `08-directory-listings.md` và `05-community-posts.md`, thêm link video; xuất 4 ảnh app thật 1270×760 và icon 240×240.

## Tiêu chí nghiệm thu
- [x] Trước khi sửa (production `/en/`, giả lập điện thoại, 4G chậm, CPU chậm 4 lần): LCP 1985 ms và 1976 ms, CLS 0,00; Lighthouse trợ năng, thực hành tốt, SEO đều 100.
- [x] Trên máy: video 360×640 trên điện thoại, nút CTA vẫn cách đỉnh 383 px; không tải mp4 khi mở trang; phát được (38,70 giây, 720×1280); Lighthouse trợ năng 100, SEO 100 (thực hành tốt 96 chỉ do lỗi CORS của bộ đếm Cloudflare trên localhost).
- [x] Production: file 200 `video/mp4`, `Accept-Ranges: bytes`, yêu cầu `Range: bytes=0-1023` trả 206 với `content-range`; ảnh bìa 200 `image/jpeg`; sitemap lastmod `/en/`, `/vi/` là 2026-11-18.
- [x] LCP/CLS (giả lập điện thoại, 4G chậm, CPU chậm 4 lần; phần tử LCP luôn là ảnh hero, không phải video): trước 1985 và 1976 ms; bản đầu (poster trong HTML) 2222 và 2195 ms; sau khi hoãn poster 2054, 2065, 2058 ms; A/B trên máy cùng điều kiện: trang cũ 1956 ms, trang mới 1985 ms (chênh trong sai số). CLS 0,00 ở mọi lần. Lighthouse production sau: `/en/` 100/100/100/100; `/vi/` trợ năng, thực hành tốt, SEO 100, mục thử nghiệm Agentic Browsing 75 vì thiếu `/.well-known/ard.json` (không liên quan video).
- [x] Chữ bộ thư mục: `05-community-posts.md` và `08-directory-listings.md` không còn SM-2, giá đúng, không có GitHub; thêm link video (`/en/#demo-title`), ghi rõ giọng đọc AI.
- [ ] Ảnh cho thư mục (5 ảnh 1270x760, icon 240x240): phiên chụp ảnh làm, lưu ngoài repo; nhận khi phiên đó báo xong.

## Còn lại (roadmap)
- Đọc số lần 1 (Workers Logs: `/v1/pricing`, `POST /v1/orders`, PUT sync; Polar: checkout, bỏ dở, đơn): chưa đọc được 2026-11-18 vì tiện ích Claude in Chrome mất kết nối. Phiên Cố vấn đọc Chủ nhật 2026-11-22 khi founder kết nối lại. Không dùng token của wrangler để đọc số.
- Bản YouTube công khai của video để dùng cho Product Hunt: chờ founder quyết việc mở kênh YouTube.

## Rủi ro & rollback
- Video nặng 2,27 MB chỉ tải khi người xem bấm phát. Rollback: bỏ khối `section.demo` hoặc revert commit.
