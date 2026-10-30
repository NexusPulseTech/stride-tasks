# A05: Bật thanh toán trên production

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | A: First Dollar |
| Ưu tiên | P0 |
| Ước lượng | 0,5 ngày |
| Phụ thuộc | A01, A02, A03, A04 |
| Trạng thái | ☐ Todo |
| Người làm | Founder (tài khoản SePay/ngân hàng) + kỹ sư (secret, biến, deploy) |

## Mục tiêu
Người dùng thật mua được PRO bằng **VietQR** và **thẻ quốc tế**, nhận PRO tự động; đồng bộ hiện trong app.

## Các bước
1. **Worker secret** (chạy trong `cloudflare-worker/`, không in giá trị):
   ```bash
   W="npx --yes wrangler@4.151.0"
   grep '^STRIDE_ED25519_PRIVATE_KEY=' ../.env.local | cut -d= -f2- | tr -d '\r\n' | $W secret put STRIDE_ED25519_PRIVATE_KEY
   $W secret put SEPAY_API_KEY            # nhập tay, giá trị tự đặt (chuỗi ngẫu nhiên ≥ 32 ký tự)
   $W secret put POLAR_ACCESS_TOKEN
   $W secret put POLAR_WEBHOOK_SECRET
   $W secret list                          # chỉ hiện tên
   ```
2. **SePay**: liên kết tài khoản ngân hàng nhận tiền; tạo webhook *tiền vào* → `https://tasks-api.nexuspulsetech.xyz/webhook/sepay`, xác thực **API Key** = giá trị `SEPAY_API_KEY`.
3. **Polar**: tạo webhook → `https://tasks-api.nexuspulsetech.xyz/webhooks/polar`, sự kiện `order.paid`, `order.refunded`.
4. **GitHub Variables** (Settings → Secrets and variables → Actions → Variables):

   | Biến | Giá trị |
   | :--- | :--- |
   | `VITE_ENABLE_PAYWALL` | `true` |
   | `VITE_VIETQR_IMAGE_URL` | `https://img.vietqr.io/image/<BANK>-<SỐ_TK>-compact2.png?amount={amount}&addInfo={orderCode}&accountName=<TÊN>` |
   | `VITE_LICENSE_CLAIM_URL` | `https://tasks-api.nexuspulsetech.xyz` |
   | `VITE_SYNC_API_URL` | `https://tasks-api.nexuspulsetech.xyz` |
   | `VITE_SUPPORT_EMAIL` | email hỗ trợ của sản phẩm |
   | biến checkout Polar | theo A04 |

5. Chạy lại workflow Deploy; kiểm tra bundle production không chứa khóa riêng (script quét).
6. **Mua thật bằng tiền của chính mình**: (a) VietQR 199.000₫; (b) thẻ quốc tế qua Polar (có thể dùng `FOUNDER30`). Kiểm tra PRO kích hoạt, đồng bộ giữa 2 thiết bị, rồi **hoàn tiền** cả hai.
7. Smoke test production + ghi nhật ký deploy ([../09-operations/01-deployment-runbook.md](../09-operations/01-deployment-runbook.md)).

## Tiêu chí nghiệm thu
- [ ] 2 giao dịch thật → PRO tự động ≤ 60 giây (khi app mở).
- [ ] Đồng bộ hoạt động giữa 2 thiết bị bằng token thật.
- [ ] Hoàn tiền → sync bị thu hồi (402 `license_revoked`).
- [ ] Không có bí mật trong bundle/diff; `secret list` đủ tên.
- [ ] Sổ cái có 2 dòng đơn + 2 dòng hoàn tiền.

## Rủi ro & rollback
Lỗi thanh toán sau khi bật → đặt `VITE_ENABLE_PAYWALL` về rỗng & redeploy (quay về chế độ miễn phí), cấp thủ công cho khách đã trả.

## Tham chiếu
- [../09-operations/02-payments-and-licensing-runbook.md](../09-operations/02-payments-and-licensing-runbook.md) · [../06-security-privacy/02-secrets-and-key-management.md](../06-security-privacy/02-secrets-and-key-management.md)
