# A14: Sửa nhỏ trước đợt bán thử (bài đăng, nhãn ôn tập, giá trên trang đích)

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | A: First Dollar |
| Ưu tiên | P0 (bài đăng sắp dán lên Reddit, X, Show HN, thư mục) và P1 |
| Ước lượng | 0,5 ngày |
| Phụ thuộc | A13 |
| Trạng thái | ☑ 2026-11-17 (web 3ed5793, kiểm trên production) |

## Mục tiêu
Trước khi đi bán (đợt thử 2026-11-16 đến 2026-12-27), mọi câu chữ người lạ đọc phải đúng với sản phẩm đang chạy, và trang đích không làm tốn hạn mức Worker khi có đợt khách lớn (Show HN khoảng 2026-12-08).

## Vì sao (rà soát 2026-11-17)
1. Bộ bài đăng trong `docs/02-growth/marketing-kit/` còn nhắc link GitHub (founder đã chốt không đưa GitHub ra trước khách) và giá 149.000₫ qua VietQR, trong khi VietQR chưa bật: khách Việt Nam đang trả $9.95 bằng thẻ qua Polar.
2. Bài đăng gọi lịch ôn là "SM-2, thuật toán của Anki". Code (`src/features/tasks/utils/spacedSnooze.ts`) dùng thang cố định 1, 3, 7, 16, 35 ngày rồi nhân 2,2 mỗi bậc, tối đa 365 ngày, với 3 lựa chọn (nhắc ngay, Good lên 1 bậc, Easy lên 2 bậc). Đó không phải SM-2 (SM-2 có hệ số dễ riêng cho từng mục, đổi theo điểm nhớ).
3. Nút Good ghi "×2.3" nhưng hệ số trong code là 2,2.
4. `public/site-pricing.js` gọi `GET /v1/pricing` ở mọi lượt xem trang đích, kể cả khi người xem không kéo tới bảng giá. Gói Workers miễn phí có 100.000 request mỗi ngày; nếu chạm trần thì webhook Polar và claim PRO cũng lỗi tới 0h UTC. Đợt thử dùng 0 đồng tiền mới (quyết định founder 2026-11-15) nên chọn cách giảm lượt gọi thay vì nâng gói trả phí.
5. Workflow `Production health check` báo lỗi 2026-11-16 22:05 và 2026-11-17 07:56 dù production vẫn chạy: bước `curl ... | grep -q` làm curl lỗi 23 khi grep thoát sớm (báo động giả). Workflow chưa kiểm `/v1/pricing`.
6. Sitemap: `/` vẫn ghi lastmod 2026-10-30 dù 2026-11-10 đã đổi chân trang. Giá đối thủ trong `docs/01-business/` đã cũ (TickTick tăng lên $49.99/năm, Todoist Pro $60/năm).

## Quyết định
1. Bộ bài đăng: bỏ mọi link và câu "mã nguồn công khai trên GitHub"; giá ghi $19 (sau 100 bản quyền $29) và $9.95 (sau đó $14.95) cho Việt Nam cùng các nước thu nhập thấp và trung bình theo World Bank, thanh toán bằng thẻ; mô tả lịch ôn đúng như code, không gọi là SM-2.
2. Nhãn Good đổi thành ×2.2 (cả tiếng Việt và tiếng Anh). Không đổi thuật toán.
3. Trang đích nhớ kết quả `/v1/pricing` 24 giờ trong localStorage (khóa mới `STRIDE_SITE_PRICING_V1`, không đụng khóa cũ của app) và chỉ hỏi máy chủ khi bảng giá sắp vào màn hình. Không hỏi được thì vẫn hiện giá tĩnh như trước.
4. Sitemap cập nhật lastmod cho `/`, `/en/`, `/vi/`. Giá đối thủ cập nhật kèm nguồn và ngày kiểm.
5. Workflow kiểm sức khỏe: đọc hết trang rồi mới grep; thêm kiểm `GET /v1/pricing` trả 200.
6. Ngoài phạm vi, chờ founder: đổi chữ "SM-2" trên trang đích và trong app (ảnh hưởng từ khóa SEO), bộ đếm sử dụng ẩn danh (trang đích đang hứa không theo dõi).

## Các bước
1. Sửa `01`, `02`, `03`, `05`, `07`, `08` trong marketing kit.
2. Sửa nhãn trong `spacedSnooze.ts`.
3. Sửa `public/site-pricing.js`, tăng `?v=` trong `public/en/index.html` và `public/vi/index.html`.
4. Sửa `public/sitemap.xml`, `docs/01-business/01-market-and-competitors.md`, `docs/01-business/03-pricing-and-packaging.md`.
5. Sửa `.github/workflows/health-check.yml`.
6. Lint, test app, test Worker, quét bí mật; commit; deploy; kiểm trên production (trang đích hiện đúng giá, lần tải thứ hai không gọi `/v1/pricing`).

## Tiêu chí nghiệm thu
- [x] Không còn "github" và "149.000₫" trong các bài sẽ dán ra ngoài; không còn câu gọi lịch ôn là SM-2 trong marketing kit.
- [x] Nút Good hiện ×2.2.
- [x] Trang đích: lượt xem đầu không gọi `/v1/pricing` khi chưa kéo tới bảng giá; khi tới bảng giá thì hiện đúng giá theo nước; tải lại trong 24 giờ không gọi lại. Production 2026-11-17 từ IP Việt Nam: `/en/` lúc tải 0 lượt gọi, kéo tới bảng giá 1 lượt, hiện "$9.95, Price for Vietnam." và lưu bậc vn-ppp; mở tiếp `/vi/` 0 lượt gọi, hiện $9.95. Trên máy: giá đã nhớ quá 24 giờ thì hỏi lại. Chặn localStorage: mọi lần đọc ghi đều nằm trong try/catch (chưa thử trên trình duyệt chặn bộ nhớ).
- [x] Bundle production có nhãn "Exponential ×2.2"; sitemap production có lastmod 2026-11-17 cho 3 trang.
- [x] Workflow kiểm sức khỏe chạy tay sau khi sửa (fbad604): xanh.
- [x] Test `src/config/__tests__/sitePricing.test.ts` vẫn qua (81 test app, 45 test Worker).

## Rủi ro & rollback
- Người dùng đổi nước (hoặc VPN) trong 24 giờ thấy giá cũ trên trang đích; app vẫn tự hỏi giá riêng nên giá lúc thanh toán do app quyết định. Chấp nhận.
- Rollback: revert commit.

## Tham chiếu
- Quyết định founder 2026-11-15 (đợt bán thử, 0 đồng tiền mới).
- Cloudflare Workers limits: https://developers.cloudflare.com/workers/platform/limits/
- TickTick $49.99/năm: Toolradar (kiểm 2026-11-12) https://toolradar.com/tools/ticktick/pricing ; Activepieces (2026-10-30) https://www.activepieces.com/blog/ticktick-pricing-in-2026-for-free-and-premium-plans
- Todoist Pro $60/năm hoặc $7/tháng: Todoist Help Center https://www.todoist.com/help/articles/todoist-pro-pricing-update-in-2025-bxBvHZuJZ
