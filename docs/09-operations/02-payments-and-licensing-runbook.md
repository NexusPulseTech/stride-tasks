# Runbook thanh toán & bản quyền

> **Thuộc**: 09-operations · **Trạng thái**: Draft v1 · **Cập nhật**: 2026-10-30
> **Liên quan**: task [A05](../10-execution-plan/A05-enable-payments-in-production.md), [../01-business/04-payments-and-merchant-of-record.md](../01-business/04-payments-and-merchant-of-record.md).

## 1. Bật thanh toán lần đầu (tóm tắt: chi tiết trong A05)

1. **Worker secret**: `STRIDE_ED25519_PRIVATE_KEY` (đọc từ `.env.local`, không in ra), `SEPAY_API_KEY`, secret của Polar.
2. **SePay**: tạo webhook → URL `https://tasks-api.nexuspulsetech.xyz/webhook/sepay`, sự kiện *tiền vào*, xác thực **API Key** (giá trị trùng `SEPAY_API_KEY`).
3. **GitHub → Settings → Secrets and variables → Actions → Variables**:
   `VITE_ENABLE_PAYWALL=true` · `VITE_VIETQR_IMAGE_URL=<mẫu img.vietqr.io có {amount} và {orderCode}>` · `VITE_LICENSE_CLAIM_URL=https://tasks-api.nexuspulsetech.xyz` · `VITE_SYNC_API_URL=https://tasks-api.nexuspulsetech.xyz` · `VITE_SUPPORT_EMAIL` · biến checkout của MoR.
4. Chạy lại workflow Deploy → mua thử thật cả hai kênh → kích hoạt → hoàn tiền thử.

## 1b. Cấu hình Polar (sandbox trước, production sau)

1. **Products** → tạo "Stride Tasks PRO Lifetime": thanh toán một lần **$19** (toàn cầu); tạo thêm bản **$9.95** (thị trường mới nổi).
2. **Checkout Links** → mỗi sản phẩm một link; **Success URL**: `https://tasks-api.nexuspulsetech.xyz/checkout/success?checkout_id={CHECKOUT_ID}` (Worker đổi `checkout_id` thành link kích hoạt, A04c); **Return URL**: `https://tasks.nexuspulsetech.xyz/`; tắt **Allow discount codes**.
3. **Settings → Webhooks → Add endpoint**: URL `https://tasks-api.nexuspulsetech.xyz/webhooks/polar`, định dạng Raw, **API version = bản Current** (2026-10 tính tới 2026-10-31; không chọn bản Next vì cấu trúc có thể đổi bất kỳ lúc nào), chỉ chọn `order.paid` và `order.refunded`, lưu rồi sao chép secret.
4. Founder tự nạp secret (không dán vào chat) bằng một lệnh ở thư mục gốc repo: `npm run worker:secrets`. Script kiểm tra khóa trong `.env.local` khớp app, nạp khóa ký mà không in ra, rồi để wrangler hỏi secret webhook. Chỉ nạp lại secret webhook: `npm run worker:secrets -- --webhook-only`. Script in danh sách tên secret ở cuối (không có giá trị). Account ID lấy từ `cloudflare-worker/wrangler.toml` (đã gitignore).
5. Thử sandbox ở máy cục bộ: tạo `.env.development.local` (bị gitignore, build production không đọc) với `VITE_ENABLE_PAYWALL=true`, `VITE_POLAR_CHECKOUT_URL` và `VITE_POLAR_CHECKOUT_URL_EMERGING` (link sandbox), `VITE_LICENSE_CLAIM_URL=http://localhost:3000/__worker`, `VITE_SYNC_API_URL=http://localhost:3000/__worker`. Dev server chuyển `/__worker` tới Worker production nên không cần mở CORS cho localhost. Chạy `npm run dev`, mua bằng thẻ test của Polar, kiểm tra PRO được kích hoạt và hoàn tiền thu hồi được.
6. **Không** đặt link sandbox vào GitHub Variables (người lạ có thể nhận PRO bằng thẻ test). Khi tài khoản production được duyệt: tạo lại sản phẩm, link, webhook ở polar.sh, thay secret, rồi mới đặt `VITE_POLAR_CHECKOUT_URL`, `VITE_POLAR_CHECKOUT_URL_EMERGING` trong GitHub Variables.

## 2. Cấp bản quyền thủ công (khi tự động lỗi)

```bash
npm run keygen -- issue --id VN-STRXXXXXX --region vn-ppp --out STRXXXXXX.stride-license.json   # giá, nhãn lấy từ preset giá sáng lập; khách trả giá khác thì thêm --price, --label
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

## 5b. Bài học từ lần mua thử sandbox (2026-11-09)

- **Secret webhook thuộc từng org.** Hai org có webhook cùng tên rất dễ copy nhầm; dấu hiệu là webhook nhận 403 `invalid_signature`. Nạp lại bằng `npm run worker:secrets -- --webhook-only` với secret của đúng org đang dùng. Polar tắt endpoint sau 10 lần lỗi liên tiếp.
- **Sau mỗi lần nạp secret**, mua thử trong sandbox rồi xem lịch sử gửi: `GET /v1/webhooks/deliveries?endpoint_id=<id>` phải trả `http_code` 202. Đơn bị lỡ thì gửi lại bằng `POST /v1/webhooks/events/<event_id>/redeliver` (Worker chống trùng nên an toàn).
- **Hoàn tiền tính không gồm thuế.** Số tiền hoàn tối đa là `refundable_amount` của đơn (VD đơn $19 tại Việt Nam: 1727 + thuế 173 tự hoàn theo); gửi 1900 sẽ bị 422.
- Polar tự gắn `customer_session_token` vào Success URL; Worker bỏ qua tham số này.
- Lịch Polar thử lại quan sát được: 0,8s, 7s, 18s, 49s, 82s, 194s... sau khi tạo đơn.

## 5c. Bài học khi dựng production (2026-11-10)

- **Org mới ở chế độ test.** `capabilities.checkout_payments` là `false`, trang checkout ghi "in test mode" và chỉ nhận đơn $0 bằng mã giảm 100% cho tới khi Polar duyệt hồ sơ và go live. Không cần đổi gì ở app khi được duyệt.
- **Logo org phải tải lên qua Settings, General.** CSP của trang checkout chỉ cho ảnh từ kho của Polar và vài host cố định; đặt `avatar_url` trỏ về tên miền của mình thì checkout chỉ hiện chữ viết tắt.
- **Thử bằng mã 100% khi link tắt ô mã giảm giá**: tham số `discount_code` chỉ điền sẵn ô nhập, nên tạm bật `allow_discount_codes` trên link, thử xong tắt lại ngay (hoặc tạo link thử riêng gắn sẵn mã, xóa sau khi thử). Mã có giới hạn lượt dùng nên lộ cũng chỉ mất tối đa số lượt đó.
- **Mỗi lần mở Checkout Link tạo một phiên checkout mới** và tính vào tỉ lệ chuyển đổi trên dashboard, nên chỉ mở khi cần kiểm tra.
- **Đơn $0 bằng mã 100% không cần thẻ**: checkout chỉ hỏi email, nút đổi thành "Get for free".
- **Kích hoạt chậm tới khoảng 60 giây** khi trang chờ hoặc app đọc KV trước lúc webhook ghi (KV lưu đệm cả kết quả "chưa có" ở từng edge). Đo được 43 giây ngày 2026-11-10; sửa ở A11. Trong lúc chờ: khách cứ để trang chờ chạy, app vẫn tự claim.

## 6. Kiểm tra định kỳ (hằng tuần khi đang bán)

- Đối soát số đơn MoR/SePay với số bản ghi `order:*` đã phát hành.
- Xem các giao dịch `unmatched`.
- Xem log lỗi webhook.
