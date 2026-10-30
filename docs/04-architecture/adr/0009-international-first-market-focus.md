# ADR-0009: Thị trường quốc tế là mục tiêu chính

- **Trạng thái**: Accepted (founder quyết định 2026-10-30)
- **Ngày**: 2026-10-30
- **Người quyết định**: Founder
- **Liên quan**: [../../01-business/README.md](../../01-business/README.md), [../../01-business/07-first-paying-customer-playbook.md](../../01-business/07-first-paying-customer-playbook.md), [../../02-growth/marketing-kit/README.md](../../02-growth/marketing-kit/README.md)

## Bối cảnh

Bản kế hoạch đầu (2026-10-30 sáng) chọn Việt Nam làm mũi nhọn để có khách đầu tiên nhanh nhất (VietQR có sẵn, mạng lưới quen biết). Founder đánh giá thị trường Việt Nam quá nhỏ cho mục tiêu doanh thu, và giá trị mỗi đơn quốc tế cao hơn khoảng 3 lần (giá sáng lập $19 so với 149.000₫).

## Các phương án

1. **Việt Nam trước, quốc tế sau**: nhanh có đơn đầu, nhưng doanh thu thấp và kênh/nội dung phải làm lại bằng tiếng Anh.
2. **Quốc tế là chính, Việt Nam là thị trường phụ**: doanh thu mỗi đơn cao, thị trường lớn hơn nhiều; phụ thuộc Merchant of Record duyệt tài khoản (Polar có thể mất tới 14 ngày trước lần rút tiền đầu).
3. Chỉ quốc tế: bỏ lợi thế VietQR và người dùng Việt đã có.

## Quyết định

Chọn phương án 2.
- Mọi nội dung, kênh, SEO, store listing ưu tiên **tiếng Anh**; tiếng Việt duy trì nhưng không đầu tư mới.
- App mặc định tiếng Anh, tự chuyển tiếng Việt khi trình duyệt dùng tiếng Việt (đã làm, commit `e1de6b3`).
- Bậc giá toàn cầu hiển thị trước (đã làm, commit `ef16746`).
- Đường găng tới đơn đầu tiên: **Polar duyệt tài khoản** (đăng ký ngay) song song với xây hiện diện trên X, Reddit, Hacker News, Product Hunt, các thư mục phần mềm.
- VietQR vẫn bật như kênh phụ (chi phí thấp, đã có code) để không bỏ lỡ khách Việt.

## Hệ quả

- Tích cực: dư địa thị trường và doanh thu lớn hơn; nội dung tiếng Anh dùng lại được cho Product Hunt, Hacker News, Microsoft Store toàn cầu.
- Tiêu cực: đơn đầu tiên có thể đến chậm hơn (chờ MoR); cạnh tranh nội dung tiếng Anh gắt hơn; founder cần viết tiếng Anh đều đặn.
- Việc tiếp: cập nhật playbook, marketing kit, lịch nội dung, kế hoạch SEO theo hướng quốc tế (đã làm cùng ADR này).
