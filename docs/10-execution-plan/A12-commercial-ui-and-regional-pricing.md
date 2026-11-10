# A12: Giao diện thương mại chuẩn và giá theo vùng do máy chủ quyết định

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | A: First Dollar |
| Ưu tiên | P0 (đang bán thật, ảnh hưởng trực tiếp tỉ lệ chuyển đổi) |
| Ước lượng | 1 ngày (A12a) + 2 ngày (A12b) |
| Phụ thuộc | A05, A11 |
| Trạng thái | ◐ A12a: code xong và đã lên web (c3baeed); chờ founder deploy Worker, gỡ link GitHub trên hồ sơ Polar. A12b chưa làm |

## Vấn đề (founder rà ngày 2026-11-10)
1. Hộp nâng cấp PRO luôn tối, dùng sky/indigo/emerald/amber, lệch hẳn với phần còn lại của app (nền trắng hoặc tối theo giao diện, màu thương hiệu đỏ `#B20015`). Nhìn như giao diện sinh tự động.
2. Hai nút "🌎 Global · $19" và "🌏 Emerging markets · $9.95" để **người mua tự chọn**, ai cũng bấm được giá rẻ. Cờ emoji thiếu chuyên nghiệp.
3. Link GitHub ở footer, menu, modal góp ý, trang đích, `llms.txt`: kéo người dùng khỏi sản phẩm thương mại.
4. Dữ liệu mẫu là một bộ tiếng Việt duy nhất ("Làm Game Kiếm Tiền YouTube", "Kênh TikTok triệu view") hiện với cả người dùng tiếng Anh, nội dung không phải ví dụ minh họa tính năng.
5. Kiểm kê thêm: **596 dòng tiếng Việt viết cứng** trong khoảng 40 component (Backup, Guide, Feedback, Command palette, Daily Focus, Kanban, Stats...), banner dữ liệu mẫu cũng tiếng Việt cứng; 34 dòng có emoji (cờ, báo cáo Markdown).

## Chuẩn tham chiếu
- **Giá theo sức mua (PPP)**: Paddle, ParityDeals, Netflix, Spotify xác định giá theo **quốc gia của người mua phía máy chủ** (IP, sau đó đối chiếu quốc gia thanh toán). Người mua thấy một giá, không có nút tự chọn giá rẻ. Rò rỉ qua VPN được chấp nhận, đo bằng log thay vì chặn.
- **Danh sách nước**: dùng phân loại thu nhập của World Bank (cập nhật mỗi tháng 7). Thu nhập thấp, trung bình thấp, trung bình cao (131 nước, gồm Việt Nam, Ấn Độ, Indonesia, Brazil, Mexico) nhận giá thị trường mới nổi; thu nhập cao (86 nước) và nước không xác định nhận giá quốc tế. Tỉ lệ $9.95 / $19 ≈ 0,52 khớp mức giá so với sức mua của nhóm này.
- **Dữ liệu mẫu**: Todoist, Things, Notion cài sẵn một dự án "Getting started" theo ngôn ngữ người dùng, mỗi việc dạy một tính năng.

## Quyết định
- Thay quyết định cũ "gợi ý vùng nhưng vẫn cho tự chọn" (01-business/03 mục 3b.4): **máy chủ quyết định**.
- Worker thêm `GET /v1/pricing` → `{ country, tier, regionalCheckoutUrl }` từ `request.cf.country`. Link checkout giá vùng nằm ở biến Worker `POLAR_CHECKOUT_URL_EMERGING`, chỉ trả cho nước đủ điều kiện, nên không còn nằm trong bundle công khai sau khi xóa biến GitHub tương ứng.
- App gọi endpoint khi mở hộp nâng cấp, nhớ kết quả 7 ngày; không gọi được thì dùng kết quả nhớ, rồi tới suy đoán múi giờ/ngôn ngữ như trước (không làm hỏng việc mua khi Worker chưa deploy).
- Webhook ghi log `ppp_country_mismatch` khi đơn giá vùng có quốc gia thanh toán thuộc nhóm thu nhập cao (đo rò rỉ, không chặn khách).
- Hộp nâng cấp dùng đúng hệ màu của app (sáng/tối theo giao diện, nút chính đỏ thương hiệu), một giá duy nhất, không emoji, chữ ngắn và không thuật ngữ kỹ thuật ("Ed25519").
- Bỏ mọi link GitHub khỏi bề mặt sản phẩm và marketing. Repo vẫn public theo FSL; chỉ không quảng bá.
- Dữ liệu mẫu: bộ "Getting started" tiếng Anh và tiếng Việt, ví dụ minh họa trung tính, mỗi việc dạy một tính năng; giữ ID dự án `p1`, `p2` để quy tắc không tính dự án mẫu vào giới hạn Free vẫn đúng; bộ mẫu cũ vẫn được nhận diện là mẫu với người dùng hiện có.

## Các bước
**A12a (làm ngay)**
1. Worker: `src/pricing.js` (danh sách nước, hàm chọn bậc), route `GET /v1/pricing`, log lệch quốc gia ở webhook; test; OpenAPI.
2. App: bỏ chọn vùng thủ công, bỏ cờ emoji; hook lấy giá theo vùng; thiết kế lại hộp nâng cấp; chuỗi i18n mới.
3. Dữ liệu mẫu EN/VI, banner mẫu song ngữ, khôi phục mẫu theo ngôn ngữ hiện tại.
4. Bỏ GitHub: footer, menu, modal góp ý, trang đích EN/VI, `llms.txt`, link mạng xã hội trên Polar.
5. Trang đích: giá quốc tế làm mốc, ghi rõ giá tự điều chỉnh theo quốc gia; trang tiếng Việt bán ngay giá khu vực.
6. Founder: thêm `POLAR_CHECKOUT_URL_EMERGING` vào `[vars]` của `wrangler.toml`, deploy Worker. Sau đó xóa biến GitHub `VITE_POLAR_CHECKOUT_URL_EMERGING` và deploy lại web.

**A12b (tiếp theo)**
7. Chuyển 596 dòng tiếng Việt viết cứng vào i18n, theo thứ tự màn hình người dùng gặp nhiều nhất: màn hình chính, Kanban, Daily Focus, Backup, Feedback, Guide, Command palette, Stats.
8. Bỏ emoji trong báo cáo Markdown và nhãn nhập nhanh, dùng icon của bộ icon chung.

## Tiêu chí nghiệm thu
- [x] `/v1/pricing`: VN → `vn-ppp`, IN → `emerging-ppp`, US → `global-us`, không rõ → `global-us`; link giá vùng chỉ trả cho nước đủ điều kiện (6 test Worker, tổng 45/45). Còn đợi deploy Worker để chạy thật.
- [x] Hộp nâng cấp hiện đúng một giá, không có nút đổi vùng, không emoji, đúng màu ở cả giao diện sáng và tối (chụp kiểm tra trên bản build 2026-11-10).
- [x] Người dùng tiếng Anh mới thấy dữ liệu ví dụ tiếng Anh ("Getting started", "Learning"); bộ mẫu cũ vẫn được nhận diện (test). Màn hình chính tiếng Anh không còn chữ tiếng Việt hiển thị (kiểm bằng script trên trình duyệt mới).
- [x] Không còn link GitHub trên app, trang đích, `llms.txt` (kiểm trên production). Còn link mạng xã hội GitHub trên hồ sơ Polar: gỡ khi extension Chrome kết nối lại hoặc founder tự gỡ ở Settings.
- [ ] Bundle production không chứa link checkout giá vùng (sau bước 6).

## Rủi ro & rollback
VPN lách giá: chấp nhận, đo bằng log. Worker lỗi: app dùng kết quả nhớ hoặc suy đoán, vẫn bán được. Rollback app bằng revert; rollback Worker bằng `wrangler rollback`.
