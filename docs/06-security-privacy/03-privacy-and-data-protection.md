# Quyền riêng tư & bảo vệ dữ liệu cá nhân

> **Thuộc**: 06-security-privacy · **Trạng thái**: Draft v1 · **Cập nhật**: 2026-10-30
> **Luật liên quan**: Luật BVDLCN Việt Nam 91/2025/QH15 (hiệu lực 01/01/2026), GDPR, CCPA — chi tiết pháp lý ở [../01-business/06-legal-tax-compliance.md](../01-business/06-legal-tax-compliance.md). Trang công khai: `public/privacy.html`.

## 1. Kiểm kê dữ liệu

| Dữ liệu | Nơi lưu | Mục đích | Thời hạn | Ai truy cập được |
| :--- | :--- | :--- | :--- | :--- |
| Công việc, dự án, log, cài đặt | Thiết bị người dùng (localStorage/IndexedDB) | Chức năng app | Do người dùng quyết định | Chỉ người dùng |
| Bản mã đồng bộ + `license_id` + thời điểm | D1 (Cloudflare, APAC) | Đồng bộ PRO | Tới khi người dùng xóa bản sao đám mây | Không ai đọc được nội dung |
| Mã đơn, token, kênh thanh toán | KV (TTL 90 ngày) | Giao token sau thanh toán | 90 ngày | Founder (qua dashboard) |
| Nội dung chuyển khoản không khớp (≤ 200 ký tự) | KV (TTL 90 ngày) | Đối soát thủ công | 90 ngày | Founder |
| Email, tên, quốc gia, thông tin thanh toán người mua | **MoR** (Polar/SePay/ngân hàng) | Xử lý thanh toán, hóa đơn, thuế | Theo chính sách MoR | MoR; founder xem trong dashboard |
| Email người mua (nếu gửi link kích hoạt) | Dịch vụ email (Resend) | Gửi link kích hoạt/khôi phục | Theo chính sách nhà cung cấp | Nhà cung cấp email |
| Lượt xem trang (tổng hợp) | Cloudflare Web Analytics | Đo lường | Theo Cloudflare | Founder |
| Log kỹ thuật Worker | Cloudflare Workers Logs | Gỡ lỗi | Theo gói Cloudflare | Founder — **không log body, token, IP đầy đủ** |

## 2. Nguyên tắc

1. **Tối thiểu hóa**: không thu thập thứ không dùng. Token không chứa email.
2. **Minh bạch**: mọi bên xử lý dữ liệu (Cloudflare, MoR, email) liệt kê trong `privacy.html`.
3. **Không bán, không chia sẻ dữ liệu cho quảng cáo**; không dùng cookie theo dõi → không cần banner cookie.
4. **Thay đổi → cập nhật `privacy.html` trước khi phát hành** tính năng thu thập mới (email, bộ đếm analytics).

## 3. Yêu cầu của chủ thể dữ liệu

| Yêu cầu | Cách đáp ứng |
| :--- | :--- |
| Xem/xuất dữ liệu | Trong app: Sao lưu → xuất JSON |
| Xóa dữ liệu trên thiết bị | Xóa dữ liệu trang/gỡ app |
| Xóa bản sao đám mây | Trong app: Đồng bộ → "Xóa bản sao trên đám mây" (`DELETE /sync/v1/vaults/{id}`) |
| Xóa dữ liệu thanh toán | Chuyển tới MoR; founder xóa bản ghi KV liên quan theo mã đơn |
| Liên hệ | Email hỗ trợ ghi trong `privacy.html`; phản hồi trong 30 ngày |

## 4. Việc cần làm

- [ ] Cập nhật `privacy.html` khi bật Polar (bên xử lý mới), email kích hoạt, bộ đếm analytics.
- [ ] Thêm bản tiếng Việt của chính sách (người dùng VN chiếm phần lớn).
- [ ] Ghi chú chuyển dữ liệu ra nước ngoài (Cloudflare, MoR đặt ngoài Việt Nam) theo yêu cầu PDPL.
- [ ] Nhãn quyền riêng tư cho Microsoft Store / Google Play (Data safety) khớp bảng mục 1.
