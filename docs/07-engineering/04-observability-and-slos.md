# Quan sát hệ thống & SLO

> **Thuộc**: 07-engineering · **Trạng thái**: Draft v1 · **Cập nhật**: 2026-10-30
> **Ràng buộc**: quan sát hệ thống **không được** vi phạm quyền riêng tư (không gửi nội dung công việc, token, mã đồng bộ).

## 1. Worker (server)

| Tín hiệu | Cách làm |
| :--- | :--- |
| Log | Bật `[observability] enabled = true` trong `wrangler.toml` (Workers Logs). Log JSON một dòng: `ts, level, service, route, method, status, duration_ms, request_id, error_code`. **Không** log body, header `Authorization`, IP đầy đủ |
| Request ID | Đọc `cf-ray`, sinh `x-request-id` trả về client, đưa vào mọi log và phản hồi lỗi |
| Chỉ số | Workers Analytics Engine (hoặc bảng đếm D1): số claim `ready`, webhook thành công/thất bại theo provider, 409/413/429 theo route |
| Cảnh báo | Cloudflare Notifications khi gần giới hạn gói; kiểm tra hằng ngày trong tuần launch |
| Truy vết sự cố | `wrangler tail` trong lúc điều tra |

## 2. Client

- **Error Boundary** ghi lỗi vào bộ nhớ cục bộ (vòng 20 lỗi gần nhất) + nút "Gửi báo cáo lỗi" mở email/biểu mẫu với stack đã lược bỏ dữ liệu người dùng, **không tự động gửi**.
- Nếu sau này dùng dịch vụ theo dõi lỗi (VD Sentry): chỉ khi người dùng **đồng ý (opt-in)**, bật lọc dữ liệu (scrub), cập nhật `privacy.html`.
- Bộ đếm sản phẩm ẩn danh: xem [../02-growth/07-analytics-and-measurement.md](../02-growth/07-analytics-and-measurement.md).

## 3. SLO (mục tiêu mức dịch vụ)

| Dịch vụ | SLI | SLO (tháng) |
| :--- | :--- | :--- |
| Sync API | Tỉ lệ request không lỗi 5xx | ≥ 99,5% |
| Sync API | Độ trễ p95 `GET/PUT` | ≤ 500 ms |
| Webhook thanh toán | Tỉ lệ xử lý thành công (2xx) | ≥ 99,9% |
| Giao token | Thời gian từ webhook `paid` → app nhận token | p95 ≤ 60 giây (khi app đang mở) |
| Web app | Trang tải được (GitHub Pages) | theo GitHub Pages |

**Error budget**: 0,5% của Sync ≈ 3,6 giờ/tháng. Vượt ngân sách → dừng tính năng mới, ưu tiên độ ổn định.

## 4. Rà soát

Sau mỗi sự cố: postmortem không đổ lỗi theo mẫu ở [../09-operations/03-incident-response.md](../09-operations/03-incident-response.md); cập nhật SLO nếu không thực tế.
