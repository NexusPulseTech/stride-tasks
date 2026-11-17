# Đo lường & analytics (tôn trọng quyền riêng tư)

> **Thuộc**: 02-growth · **Trạng thái**: Draft v1 · **Cập nhật**: 2026-11-18
> **Mục đích**: đo phễu ở [../01-business/08-kpis-and-unit-economics.md](../01-business/08-kpis-and-unit-economics.md) mà **không** theo dõi cá nhân, nhất quán với lời hứa "dữ liệu ở trên máy bạn".

## 1. Hiện trạng

Không có công cụ analytics nào trong `index.html`/`src` → hiện **không biết** có bao nhiêu người truy cập, từ đâu, chuyển đổi ra sao.

## 2. Bộ công cụ đề xuất

| Lớp | Công cụ | Lý do |
| :--- | :--- | :--- |
| Lượt xem trang, nguồn truy cập | **Cloudflare Web Analytics** | Miễn phí, không cookie, domain đã proxy qua Cloudflare |
| Tìm kiếm tự nhiên | Google Search Console + Bing Webmaster Tools | Truy vấn, impressions, lỗi index |
| Doanh thu | Dashboard MoR (Polar), SePay, sổ cái Worker | Nguồn sự thật về đơn |
| Hành vi trong app (giai đoạn 2) | **Bộ đếm ẩn danh tự xây trên Worker** | Chỉ đếm sự kiện tổng hợp, không định danh |

## 3. Thiết kế bộ đếm ẩn danh (giai đoạn 2, task `A07`)

> Founder quyết 2026-11-17: **chưa làm trong đợt bán thử** (là tính năng mới; trang đích đang hứa "no tracking"). Xét lại sau 2026-12-27. Trong đợt thử dùng mục 6.

- Sự kiện cố định, không tham số tự do: `activated`, `retained_d7`, `paywall_view`, `checkout_click`, `sync_enabled`.
- Client gửi `POST /v1/metrics {event, day, locale, channel}`: **không** có ID người dùng/thiết bị, không nội dung công việc.
- Worker chỉ tăng bộ đếm theo ngày (D1 hoặc Workers Analytics Engine), **không lưu IP**.
- Mỗi sự kiện gửi tối đa 1 lần/thiết bị/ngày (cờ trong localStorage).
- Có công tắc tắt trong Cài đặt; mô tả rõ trong `privacy.html` trước khi bật.

## 4. Quy ước chiến dịch (UTM)

`?utm_source=<nơi đăng>&utm_medium=<community|social|email|store|directory>&utm_campaign=<launch-2026-11|founding|listing>`
Ví dụ: `?utm_source=reddit-sideproject&utm_medium=community&utm_campaign=launch-2026-11`.
Nếu công cụ không ghi nhận query string, dùng **đường dẫn trang đích riêng** cho chiến dịch lớn (VD `/en/?ref=hn` → xem trong báo cáo referrer).

## 5. Không làm

- Không dùng Google Analytics/Meta Pixel trong app (cookie, chia sẻ dữ liệu với bên thứ ba, mâu thuẫn định vị riêng tư).
- Không ghi nhận nội dung việc, tên dự án, email trong analytics.

## 6. Đợt bán thử (2026-11-16 đến 2026-12-27): đọc số mỗi tuần, không viết code

Chỉ dùng công cụ đã có. Ghi số vào một bảng mỗi Chủ nhật (Cố vấn Life OS tổng hợp nếu nhận ảnh chụp).

| Câu hỏi | Xem ở đâu | Đọc số thế nào |
| :--- | :--- | :--- |
| Bao nhiêu người vào trang đích, từ đâu, nước nào | Cloudflare dashboard, Web Analytics, site `tasks.nexuspulsetech.xyz`, lọc đường dẫn `/en/`, `/vi/` | Lượt truy cập (visits), nguồn giới thiệu (referrers), quốc gia. Không cookie, không theo dõi cá nhân |
| Bao nhiêu lượt mở app | Cùng chỗ, đường dẫn `/` | Một người mở nhiều lần thì đếm nhiều lần; app đã cài mở lúc offline thì không được đếm |
| Bao nhiêu người xem giá | Workers Logs của Worker `stride-license`, lọc `/v1/pricing` | Gần đúng số người lần đầu xem giá: từ A14 trang đích chỉ hỏi khi bảng giá sắp vào màn hình và nhớ 24 giờ, app nhớ 7 ngày |
| Bao nhiêu lần bấm mua | Workers Logs, lọc `POST /v1/orders` | App đăng ký mã đơn ngay trước khi mở trang thanh toán Polar |
| Phiên thanh toán và đơn | Polar dashboard, mục bán hàng: Checkouts (gồm cả bỏ dở) và Orders (đã trả) | So với số bấm mua để thấy chỗ rơi |
| PRO có dùng đồng bộ không | Workers Logs, lọc `/sync/v1/vaults/` phương thức PUT | Số lượt đồng bộ, không phải số người |
| Google tìm thấy chưa | Search Console (tài khoản sở hữu property), Hiệu suất và Trang | Lượt hiển thị, lượt nhấp, trang đã lập chỉ mục |

Lưu ý:
- Workers Logs ở gói miễn phí chỉ giữ vài ngày (theo trang giá Workers Logs của Cloudflare là 3 ngày: https://developers.cloudflare.com/workers/observability/logs/workers-logs/), nên đọc 2 lần mỗi tuần (Thứ Tư và Chủ nhật) để không mất số.
- Không gộp số các nguồn thành một "số người dùng": mỗi nguồn đếm một thứ khác nhau. Ghi riêng từng cột.
- Số dùng cho quyết định 2026-12-27 là số đơn của người lạ và số ghi chú từ các cuộc trò chuyện (quyết định founder 2026-11-15); các số trên chỉ để biết khách rơi ở đâu.
