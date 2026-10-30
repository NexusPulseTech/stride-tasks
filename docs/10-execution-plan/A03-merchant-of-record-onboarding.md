# A03: Đăng ký & cấu hình Merchant of Record (Polar)

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | A: First Dollar |
| Ưu tiên | P0 |
| Ước lượng | 1-3 ngày (phần lớn là chờ duyệt) |
| Phụ thuộc | A02 (trang pháp lý phải có trước khi nộp hồ sơ) |
| Trạng thái | ☐ Todo |
| Người làm | **Founder** (tạo tài khoản, xác minh danh tính, nhập thông tin ngân hàng, AI không làm thay) |

## Mục tiêu
Có tài khoản MoR **nhận được tiền về Việt Nam**, sản phẩm PRO với 2 bậc giá quốc tế, mã giảm giá Founding, môi trường sandbox để test.

## Vì sao
LemonSqueezy chuyển sang Stripe Managed Payments (không hỗ trợ người bán ở Việt Nam). Polar chi trả về Việt Nam qua Stripe Connect Express, ADR-0006.

## Các bước
1. Đăng ký Polar, tạo organization "NexusPulse" (hoặc tên thương mại).
2. **Kiểm tra sớm nhất**: bước payout (Stripe Connect Express) có chấp nhận *cá nhân* tại Việt Nam không.
   - Được → tiếp tục.
   - Không → chuyển sang **Creem** (payout ngân hàng VN), rồi Paddle; ghi kết quả vào ADR-0006 và đổi tên task.
3. Tạo sản phẩm *Stride Tasks PRO, Lifetime*, thanh toán một lần: bậc `global-us` **$25.95**, bậc `emerging-ppp` **$14.95** (2 sản phẩm hoặc 2 mức giá).
4. Tạo mã giảm giá `FOUNDER30` (−30%, giới hạn 100 lượt, hạn 30 ngày).
5. Cấu hình trang checkout: tên, logo, link Terms/Refund/Privacy, email hỗ trợ sản phẩm.
6. Tạo tài khoản **sandbox** để test end-to-end trước production.
7. Ghi lại (không phải bí mật): product/price ID → biến `[vars]` của Worker; (bí mật) access token & webhook secret → để dành cho A05 (`wrangler secret put`).
8. Cập nhật ADR-0006 → `Accepted` (hoặc ghi phương án thay thế đã chọn).

## Tiêu chí nghiệm thu
- [ ] Payout onboarding hoàn tất (trạng thái "verified"/"active").
- [ ] Mua thử trong sandbox thành công bằng thẻ test, áp được `FOUNDER30`.
- [ ] Trang checkout hiển thị đúng giá, thuế, link pháp lý.

## Rủi ro & rollback
Bị từ chối vì loại hình cá nhân → dùng Creem/Paddle; trong lúc chờ vẫn bán được ở Việt Nam bằng VietQR (A05).

## Tham chiếu
- [../01-business/04-payments-and-merchant-of-record.md](../01-business/04-payments-and-merchant-of-record.md) · [../04-architecture/adr/0006-polar-as-international-mor.md](../04-architecture/adr/0006-polar-as-international-mor.md)
