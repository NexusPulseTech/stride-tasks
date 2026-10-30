# Runbook thanh toán & bản quyền

> **Thuộc**: 09-operations · **Trạng thái**: Draft v1 · **Cập nhật**: 2026-10-30
> **Liên quan**: task [A05](../10-execution-plan/A05-enable-payments-in-production.md), [../01-business/04-payments-and-merchant-of-record.md](../01-business/04-payments-and-merchant-of-record.md).

## 1. Bật thanh toán lần đầu (tóm tắt: chi tiết trong A05)

1. **Worker secret**: `STRIDE_ED25519_PRIVATE_KEY` (đọc từ `.env.local`, không in ra), `SEPAY_API_KEY`, secret của Polar.
2. **SePay**: tạo webhook → URL `https://tasks-api.nexuspulsetech.xyz/webhook/sepay`, sự kiện *tiền vào*, xác thực **API Key** (giá trị trùng `SEPAY_API_KEY`).
3. **GitHub → Settings → Secrets and variables → Actions → Variables**:
   `VITE_ENABLE_PAYWALL=true` · `VITE_VIETQR_IMAGE_URL=<mẫu img.vietqr.io có {amount} và {orderCode}>` · `VITE_LICENSE_CLAIM_URL=https://tasks-api.nexuspulsetech.xyz` · `VITE_SYNC_API_URL=https://tasks-api.nexuspulsetech.xyz` · `VITE_SUPPORT_EMAIL` · biến checkout của MoR.
4. Chạy lại workflow Deploy → mua thử thật cả hai kênh → kích hoạt → hoàn tiền thử.

## 2. Cấp bản quyền thủ công (khi tự động lỗi)

```bash
npm run keygen -- issue --id VN-STRXXXXXX --region vn-ppp --price 7.95 --label "Vietnam PPP (199.000₫)" --out STRXXXXXX.stride-license.json
npm run keygen -- verify <token>     # kiểm tra trước khi gửi
```

Gửi khách **link kích hoạt** `https://tasks.nexuspulsetech.xyz/#activate=<token>` hoặc file `.stride-license.json`. File chứng chỉ bị gitignore (`*.stride-license.json`), xóa khỏi máy sau khi gửi.

## 3. Chuyển khoản không khớp đơn (SePay)

Worker ghi `sepay:{txId}` với `status: "unmatched"` (giữ 90 ngày) khi nội dung không có mã `STR…` hoặc số tiền thiếu.
1. Tìm giao dịch trong dashboard SePay/ngân hàng theo thời gian & số tiền khách báo.
2. Đủ tiền → cấp thủ công (mục 2). Thiếu tiền → hướng dẫn chuyển bù hoặc hoàn lại.

## 4. Hoàn tiền

1. Thực hiện hoàn tiền trên MoR (Polar) hoặc chuyển khoản trả lại (VietQR).
2. Sau task A04: webhook `order.refunded` tự ghi thu hồi; với VietQR ghi thu hồi thủ công theo `license_id` (`VN-<mã đơn>`).
3. Ghi vào sổ cái (ngày, mã đơn, số tiền, lý do).

## 5. Khôi phục bản quyền bị mất

| Kênh mua | Cách xác minh | Cách cấp lại |
| :--- | :--- | :--- |
| VietQR | Ảnh/biên lai chuyển khoản: thời gian, số tiền, nội dung có mã `STR…` | Bản ghi `order:{mã}` còn hạn 90 ngày → gửi lại link; quá hạn → cấp thủ công cùng `--id VN-<mã>` |
| Polar / MoR | Email mua hàng → tra đơn trong dashboard MoR | Gửi lại link kích hoạt / cấp thủ công `--id <provider>-<orderId>` |

Khuyến nghị khách: sau khi kích hoạt, vào Trung tâm bản quyền → **xuất chứng chỉ** để tự lưu.

## 6. Kiểm tra định kỳ (hằng tuần khi đang bán)

- Đối soát số đơn MoR/SePay với số bản ghi `order:*` đã phát hành.
- Xem các giao dịch `unmatched`.
- Xem log lỗi webhook.
