# A03: Đăng ký & cấu hình Merchant of Record (Polar)

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | A: First Dollar |
| Ưu tiên | P0 |
| Ước lượng | 1-3 ngày (phần lớn là chờ duyệt) |
| Phụ thuộc | A02 (trang pháp lý phải có trước khi nộp hồ sơ) |
| Trạng thái | ◐ Đang làm |
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
   - Kiểm tra 2026-10-30: Việt Nam có trong [danh sách payout chính thức của Polar](https://polar.sh/docs/merchant-of-record/supported-countries). Loại hình cá nhân chỉ biết chắc ở bước xác minh Stripe.
3. Tạo sản phẩm theo [runbook mục 1b](../09-operations/02-payments-and-licensing-runbook.md): *Stride Tasks PRO Lifetime*, thanh toán một lần, giá sáng lập **$19** (`global-us`) và **$9.95** (`emerging-ppp`). Hết 100 bản quyền sáng lập thì đổi sang $29 và $14.95.
4. Không cần mã giảm giá cho đợt sáng lập: giá sáng lập là giá niêm yết riêng ([../01-business/03-pricing-and-packaging.md](../01-business/03-pricing-and-packaging.md) mục 3b). Chỉ tạo mã khi có chiến dịch cụ thể.
5. Cấu hình trang checkout: tên, logo, link Terms/Refund/Privacy, email hỗ trợ sản phẩm.
6. Tạo tài khoản **sandbox** để test end-to-end trước production.
7. Ghi lại (không phải bí mật): product/price ID → biến `[vars]` của Worker; (bí mật) access token & webhook secret → để dành cho A05 (`wrangler secret put`).
8. Cập nhật ADR-0006 → `Accepted` (hoặc ghi phương án thay thế đã chọn).

## Tiêu chí nghiệm thu
- [ ] Payout onboarding hoàn tất (trạng thái "verified"/"active").
- [ ] Mua thử trong sandbox bằng thẻ test: webhook `order.paid` tới Worker, app nhận PRO; hoàn tiền thử thì bản quyền bị thu hồi.
- [ ] Trang checkout hiển thị đúng giá, thuế, link pháp lý.

## Tiến độ
- Sandbox (2026-10-31): organization **NexusPulse Studio** (`sandbox.polar.sh/dashboard/nexuspulse-studio`, đăng nhập Google của founder; slug `nexuspulse` thuộc một lần đăng nhập khác nên không dùng). Đã tạo 2 sản phẩm một lần ($19 công khai, $9.95 Private) và 2 Checkout Link (Success URL `https://tasks.nexuspulsetech.xyz/?checkout_id={CHECKOUT_ID}`, Return URL về app, tắt ô mã giảm giá). Còn: founder tạo webhook và nạp `POLAR_WEBHOOK_SECRET`, rồi mua thử bằng thẻ test.
- Production (2026-10-30): đang ở bước "Let's get to know you". Founder tự điền họ tên, quốc gia, ngày sinh và tự đồng ý điều khoản; AI không nhập dữ liệu danh tính.

## Rủi ro & rollback
Bị từ chối vì loại hình cá nhân → dùng Creem/Paddle; trong lúc chờ vẫn bán được ở Việt Nam bằng VietQR (A05).

## Tham chiếu
- [../01-business/04-payments-and-merchant-of-record.md](../01-business/04-payments-and-merchant-of-record.md) · [../04-architecture/adr/0006-polar-as-international-mor.md](../04-architecture/adr/0006-polar-as-international-mor.md)
