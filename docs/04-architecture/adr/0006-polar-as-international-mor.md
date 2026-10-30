# ADR-0006: Polar thay LemonSqueezy làm Merchant of Record quốc tế

- **Trạng thái**: Proposed, *cần kiểm tra onboarding cá nhân ở Việt Nam trước khi Accepted*
- **Ngày**: 2026-10-30
- **Liên quan**: [../../01-business/04-payments-and-merchant-of-record.md](../../01-business/04-payments-and-merchant-of-record.md), tasks A03, A04

## Bối cảnh

Code hiện dùng LemonSqueezy (checkout URL + webhook `order_created`). LemonSqueezy đang chuyển sang Stripe Managed Payments, dịch vụ chỉ hỗ trợ người bán ở ~35+ quốc gia, không gồm Việt Nam. Founder là cá nhân tại Việt Nam.

## Các phương án

1. **Giữ LemonSqueezy**: rủi ro không chi trả/không onboard được.
2. **Polar**: MoR, chi trả về Việt Nam qua Stripe Connect Express, 5% + 50¢ (+1,5% thẻ ngoài Mỹ), không phí tháng, webhook theo chuẩn Standard Webhooks, API checkout, mã giảm giá.
3. **Creem**: MoR, 3,9% + 40¢, chi trả ngân hàng VN nhưng phí payout tối thiểu $7.
4. **Paddle**: MoR lâu năm, hỗ trợ VN, duyệt chặt hơn.

## Quyết định

Chọn **Polar** làm MoR quốc tế chính; **Creem** dự phòng nếu Polar không chấp nhận loại hình cá nhân ở VN; **Paddle** cân nhắc khi doanh thu lớn. Code tích hợp qua port `PaymentProvider` để đổi cổng không sửa lõi. Giữ nhánh LemonSqueezy sau cờ cấu hình tới khi gỡ.

## Hệ quả

- Tích cực: nhận được tiền về Việt Nam; thuế VAT/GST quốc tế do MoR xử lý.
- Tiêu cực: phí ~8,5% với thẻ ngoài Mỹ ở mức giá thấp; phụ thuộc Stripe Connect cho payout.
- Việc tiếp: A03 (onboarding), A04 (webhook + claim an toàn), cập nhật `openapi.yaml`.
