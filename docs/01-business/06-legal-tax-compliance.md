# Pháp lý, thuế & tuân thủ

> **Thuộc**: 01-business · **Trạng thái**: Draft v1 · **Cập nhật**: 2026-10-30
> ⚠️ **Không phải tư vấn pháp lý/thuế.** Tài liệu liệt kê việc cần làm và rủi ro đã biết; nghĩa vụ thuế cá nhân tại Việt Nam phải hỏi kế toán/luật sư hoặc cơ quan thuế.

## 1. Trang công khai bắt buộc trước khi thu tiền

| Trang | Hiện trạng | Vì sao bắt buộc |
| :--- | :--- | :--- |
| Chính sách quyền riêng tư (`/privacy.html`) | ✅ Có (v3.1.0) — cần cập nhật khi thêm email/analytics | Luật dữ liệu cá nhân, yêu cầu của store & MoR |
| **Điều khoản sử dụng / EULA** (`/terms.html`) | ❌ Chưa có | MoR (Polar/Paddle) và store yêu cầu; xác định phạm vi giấy phép PRO trọn đời |
| **Chính sách hoàn tiền** (`/refund.html`) | ❌ Chưa có | MoR yêu cầu; giảm lo lắng của người mua (đề xuất 14 ngày) |
| Liên hệ / hỗ trợ | ⚠️ Chỉ có email trong cấu hình | Người mua cần kênh hỗ trợ rõ ràng |

Nội dung tối thiểu của **Điều khoản**: định nghĩa "PRO trọn đời" (trọn đời *sản phẩm*, gồm các bản cập nhật của dòng 3.x trở đi theo cam kết bạn chọn), giới hạn số kho đồng bộ/bản quyền (`SYNC_MAX_VAULTS_PER_LICENSE`), cấm chia sẻ bản quyền, miễn trừ trách nhiệm mất dữ liệu (khuyến nghị sao lưu), luật áp dụng.

## 2. Quyền của người tiêu dùng

- **EU/UK**: người mua nội dung số có quyền rút lại trong 14 ngày, trừ khi đồng ý nhận ngay và xác nhận mất quyền rút. MoR thường xử lý ở bước checkout; cam kết hoàn tiền 14 ngày tự nguyện giúp đơn giản hóa.
- Không tự động gia hạn khi bán lifetime → tránh được phần lớn quy định về thuê bao.

## 3. Quyền riêng tư & dữ liệu cá nhân

| Luật | Áp dụng | Việc cần làm |
| :--- | :--- | :--- |
| **Luật Bảo vệ dữ liệu cá nhân Việt Nam số 91/2025/QH15** (hiệu lực **01/01/2026**) + Nghị định 356/2025/NĐ-CP | Có người dùng Việt Nam | Thông báo mục đích xử lý, quyền chủ thể dữ liệu, kênh yêu cầu xóa; đánh giá chuyển dữ liệu ra nước ngoài nếu có |
| GDPR (EU/UK) | Có người dùng EU | Cơ sở pháp lý, quyền truy cập/xóa, danh sách bên xử lý (Cloudflare, MoR, email) |
| CCPA/CPRA (California) | Nhiều khả năng dưới ngưỡng | Áp dụng nguyên tắc minh bạch |

**Lợi thế thiết kế**: dữ liệu công việc nằm trên máy người dùng; máy chủ chỉ giữ **bản mã** + `license_id`; thông tin thẻ/người mua do MoR giữ. Khi dùng analytics **không cookie** (Cloudflare Web Analytics) thì không cần banner cookie.

> ⚠️ Cần xác minh: một nguồn nêu **Luật An ninh mạng 116/2025/QH15** (hiệu lực 01/07/2026) có yêu cầu lưu trữ dữ liệu trong nước đối với một số nhà cung cấp dịch vụ trực tuyến. Kiểm tra văn bản gốc trước khi mở rộng tính năng thu thập dữ liệu người dùng Việt Nam.

## 4. Thuế (Việt Nam) — danh sách cần hỏi chuyên gia

1. Thu nhập từ MoR nước ngoài (Polar/Creem/Paddle chi trả về tài khoản cá nhân) được kê khai theo diện nào? Có cần đăng ký **hộ kinh doanh** không?
2. Doanh thu VietQR trong nước (bán trực tiếp) phải kê khai/nộp thuế GTGT và TNCN thế nào, ngưỡng miễn thuế hiện hành là bao nhiêu?
3. Quy định khấu trừ thuế với hoạt động kinh doanh trên nền tảng số: **Nghị định 117/2025/NĐ-CP** (hiệu lực 01/07/2025); một nguồn cho biết đã được thay bằng **Nghị định 252/2026/NĐ-CP** từ 01/07/2026 — **cần xác minh**.
4. Thời điểm nên chuyển sang công ty (chi phí kế toán vs lợi ích).

Trong lúc chờ: **ghi sổ mọi giao dịch** (xem [04-payments-and-merchant-of-record.md](./04-payments-and-merchant-of-record.md) mục 7) và lưu chứng từ payout.

## 5. Yêu cầu của store với người bán cá nhân

- Google Play và Apple (khi phân phối tại EU theo DSA) hiển thị **thông tin trader** (tên, địa chỉ, email/điện thoại) công khai → cân nhắc dùng địa chỉ/điện thoại dành cho kinh doanh.
- Microsoft Store: cần chính sách quyền riêng tư công khai (đã có URL).

## 6. Thương hiệu & tên miền

- Tra cứu xung đột tên **"Stride Tasks"** (USPTO, WIPO Global Brand Database, Cục Sở hữu trí tuệ Việt Nam) trước khi chi tiền marketing.
- Cân nhắc tên miền thương hiệu riêng (VD `stridetasks.app`) cho trang marketing ở giai đoạn sau (xem ADR-0007).

## 7. Giấy phép mã nguồn

Repo đang **public** với giấy phép **MIT** → người khác được phép sao chép, gỡ paywall và bán lại hợp pháp. Đây là quyết định chiến lược cần chủ sản phẩm chọn — xem [../04-architecture/adr/0008-source-license-strategy.md](../04-architecture/adr/0008-source-license-strategy.md).

## Nguồn (xác minh 2026-10-30)

- Luật 91/2025/QH15 (bản tiếng Anh): <https://english.luatvietnam.vn/dan-su/law-on-personal-data-protection-law-no-91-2025-qh15-405135-d1.html>
- Tổng quan PDPL: <https://tilleke.com/insights/vietnams-new-personal-data-protection-law-a-closer-look>
- Nghị định 117/2025 (EY tax alert): <https://www.ey.com/content/dam/ey-unified-site/ey-com/vi-vn/technical/tax/documents/people-advisory-services-tax-alert-june-2025-decree-117-on-management-for-business-activities-on-e-commerce-and-digital-platforms-vn.pdf>
- Bài viết nêu Nghị định 252/2026 (**cần xác minh**): <https://thuehaiquan.tapchikinhtetaichinh.vn/bai-3-khi-nen-tang-thuong-mai-so-tro-thanh-mat-xich-thu-thue-168533.html>
