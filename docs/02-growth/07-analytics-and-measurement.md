# Đo lường & analytics (tôn trọng quyền riêng tư)

> **Thuộc**: 02-growth · **Trạng thái**: Draft v1 · **Cập nhật**: 2026-10-30
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

- Sự kiện cố định, không tham số tự do: `activated`, `retained_d7`, `paywall_view`, `checkout_click`, `sync_enabled`.
- Client gửi `POST /v1/metrics {event, day, locale, channel}`: **không** có ID người dùng/thiết bị, không nội dung công việc.
- Worker chỉ tăng bộ đếm theo ngày (D1 hoặc Workers Analytics Engine), **không lưu IP**.
- Mỗi sự kiện gửi tối đa 1 lần/thiết bị/ngày (cờ trong localStorage).
- Có công tắc tắt trong Cài đặt; mô tả rõ trong `privacy.html` trước khi bật.

## 4. Quy ước chiến dịch (UTM)

`?utm_source=<nơi đăng>&utm_medium=<community|social|email|store>&utm_campaign=<launch-2026-11|founding>`
Ví dụ: `?utm_source=reddit-sideproject&utm_medium=community&utm_campaign=launch-2026-11`.
Nếu công cụ không ghi nhận query string, dùng **đường dẫn trang đích riêng** cho chiến dịch lớn (VD `/en/?ref=hn` → xem trong báo cáo referrer).

## 5. Không làm

- Không dùng Google Analytics/Meta Pixel trong app (cookie, chia sẻ dữ liệu với bên thứ ba, mâu thuẫn định vị riêng tư).
- Không ghi nhận nội dung việc, tên dự án, email trong analytics.
