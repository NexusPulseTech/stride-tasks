# KPI & kinh tế đơn vị (Unit Economics)

> **Thuộc**: 01-business · **Trạng thái**: Draft v1 · **Cập nhật**: 2026-10-30
> **Mục đích**: đo đúng vài con số quyết định doanh thu, tôn trọng quyền riêng tư (không theo dõi cá nhân).

## 1. Phễu chuyển đổi & định nghĩa

| Bước | Định nghĩa | Nguồn đo (giai đoạn đầu) |
| :--- | :--- | :--- |
| 1. Visitor | Lượt xem trang đích `/`, `/en/`, `/vi/` | Cloudflare Web Analytics (không cookie) |
| 2. App open | Lượt mở app lần đầu (khác landing nếu tách trang) | Cloudflare Web Analytics |
| 3. Activated | Tạo ≥ 3 việc **và** hoàn thành ≥ 1 việc trong 24h đầu | Bộ đếm ẩn danh tùy chọn (task `A07`) — trước đó dùng phỏng vấn |
| 4. Retained D7 | Quay lại trong ngày thứ 7 | Bộ đếm ẩn danh tùy chọn |
| 5. Paywall view | Mở Trung tâm bản quyền / trang `/pricing` | Web Analytics (trang) |
| 6. Checkout started | Bấm thanh toán | Dashboard MoR (số checkout tạo) + Worker `/orders` |
| 7. **Paid** | Đơn thành công | Dashboard MoR, sổ cái Worker, SePay |

**North Star giai đoạn này**: số **đơn thành công**/tuần. Sau 50 đơn: chuyển sang "người dùng hoạt động hằng tuần hoàn thành ≥ 3 việc".

## 2. Giả định ban đầu (thay bằng số thật sau 2 tuần)

Giả định heuristic cho sản phẩm freemium mới (không phải số liệu đã kiểm chứng):

| Chuyển đổi | Giả định |
| :--- | :--- |
| Visitor → App open | 25% |
| App open → Activated | 40% |
| Activated → Paywall view | 30% |
| Paywall view → Checkout | 15% |
| Checkout → Paid | 65% |

⇒ 1.000 visitor có mục tiêu ≈ 1.000 × 0,25 × 0,40 × 0,30 × 0,15 × 0,65 ≈ **3 đơn**.
**Hệ quả**: để có khách đầu tiên cần đưa **~500–1.000 người đúng phân khúc** tới trang đích trong 14 ngày — khả thi bằng outreach cá nhân + 5–8 bài đăng cộng đồng.

## 3. Chi phí vận hành

| Hạng mục | Chi phí | Ghi chú |
| :--- | :--- | :--- |
| Hosting web (GitHub Pages + Cloudflare proxy) | $0 | |
| Cloudflare Workers/KV/D1 (Free) | $0 | Free: 100k request/ngày; KV 100k đọc & 1k ghi/ngày; D1 5M dòng đọc, 100k dòng ghi/ngày, 5 GB |
| Cloudflare Workers Paid (khi vượt free) | $5/tháng | Bỏ giới hạn ngày |
| Microsoft Store | $0 | Tài khoản cá nhân miễn phí |
| Google Play | $25 một lần | Phase C |
| Apple Developer | $99/năm | Phase D, chưa cần |
| SePay | Theo gói (kiểm tra bảng giá hiện hành) | |
| Tên miền | ~ vài USD/tháng | |

**Điểm hòa vốn**: với hạ tầng free tier, **1 đơn/tháng** đã đủ trả chi phí cố định; mọi đơn sau là lợi nhuận gộp (~90% sau phí MoR).

## 4. Doanh thu theo nấc

| Nấc | Điều kiện | Ý nghĩa |
| :--- | :--- | :--- |
| $1 | Đơn đầu tiên | Xác nhận có người trả tiền |
| $100 | ~5–10 đơn | Xác nhận kênh lặp lại được |
| $1.000/tháng | ~50–70 đơn/tháng | Đủ lý do đầu tư Google Play, bản địa hóa, scale hạ tầng |

## 5. Nhịp xem số

- **Hằng ngày** (trong sprint 14 ngày): phễu mục 1, nguồn truy cập.
- **Hằng tuần**: đơn, hoàn tiền, phản hồi định tính (bảng phỏng vấn).
- **Hằng tháng**: payout, chi phí, biên lợi nhuận; cập nhật lại mục 2 bằng số thật.

## Nguồn (xác minh 2026-10-30)

- Giới hạn Cloudflare free (tổng hợp từ blog + trang limits, **xác minh lại trên docs chính thức**): <https://eastondev.com/blog/en/posts/dev/20260526-cloudflare-free-limits/>
