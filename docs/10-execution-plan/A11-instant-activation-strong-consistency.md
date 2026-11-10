# A11: Kích hoạt PRO ngay sau khi trả tiền (đọc ngay sau ghi)

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | A: First Dollar |
| Ưu tiên | P1 (làm trong lúc Polar duyệt hồ sơ, trước khi có khách thật) |
| Ước lượng | 0,5 ngày |
| Phụ thuộc | A04, A05 |
| Trạng thái | ◐ Code và test xong 2026-11-10; chờ founder áp schema D1 và deploy Worker (hai lệnh ở mục Triển khai) |

## Vấn đề (đo trên production 2026-11-10)
Đơn $0 bằng mã 100%: Polar gửi `order.paid` lúc 06:55:15 và Worker trả 202, nhưng trang chờ của Success URL chỉ chuyển về app lúc 06:55:57 (khoảng 43 giây). Lần `/claim` lúc 06:55:53 vẫn trả `pending`.

Nguyên nhân: Cloudflare KV nhất quán sau (eventual consistency). Thay đổi "có thể mất tới 60 giây hoặc hơn" mới thấy ở location khác, và **kết quả không tìm thấy cũng được lưu đệm**. Trang chờ và `/claim` đọc `plcheckout:*` và `order:*` ở edge Singapore trước khi webhook (đi từ Mỹ) ghi, nên edge giữ kết quả "chưa có" tới khi hết hạn đệm.

Hệ quả: người vừa trả tiền nhìn trang "Đang xác nhận" tới khoảng 60 giây. Không mất đơn (trang chờ thử 40 lần trong 120 giây, app vẫn tiếp tục claim), nhưng đây là khoảnh khắc nhạy cảm nhất của hành trình mua.

## Phương án
| Phương án | Nhất quán | Chi phí, độ phức tạp | Kết luận |
| :--- | :--- | :--- | :--- |
| Giữ KV, giảm `cacheTtl` | Vẫn trễ tới mức tối thiểu của KV | Thấp | Không giải quyết tận gốc |
| **D1 cho bản ghi đơn và ánh xạ checkout** | Mạnh: mọi truy vấn vào bản chính khi chưa bật read replication | Thấp: Worker đã gắn D1 `stride-sync` cho đồng bộ, đã có schema và test chạy trong runtime Workers | **Chọn** |
| Durable Object cho mỗi đơn | Mạnh | Thêm lớp, binding và migration mới | Thừa cho lưu lượng hiện tại |

## Các bước
1. `schema.sql`: thêm bảng `orders` (khóa `record_key` như `order:STR...`, `plorder:<id>`; cột `record` JSON, `created_at`, `expires_at`) và `checkouts` (`checkout_id` → `record_key`). `CREATE TABLE IF NOT EXISTS`, chỉ thêm, không đổi bảng đồng bộ.
2. Worker: ghi và đọc bản ghi đơn, ánh xạ checkout qua D1; idempotent bằng `INSERT ... ON CONFLICT DO NOTHING` (webhook gửi lại hay chạy song song đều ra đúng một token). Đơn chờ (`pending:*`), sự kiện webhook đã xử lý và danh sách thu hồi giữ ở KV (không bị đọc trước khi ghi theo kiểu polling).
3. Đọc dự phòng: không thấy trong D1 thì đọc KV, để các đơn cũ vẫn nhận được.
4. Test Worker: webhook rồi claim ngay, webhook rồi Success URL ngay, webhook gửi lại hai lần, đơn cũ chỉ có trong KV.
5. Áp schema lên D1 production (`wrangler d1 execute stride-sync --remote --file=schema.sql`, chỉ thêm bảng), deploy Worker, mua thử lại bằng mã 100% (còn 2 lượt) và đo thời gian kích hoạt.

## Cách làm (2026-11-10)
- `schema.sql`: thêm bảng `orders` (`record_key` là khóa chính, `record` JSON, `expires_at` 90 ngày) và `checkouts`; chỉ `CREATE TABLE IF NOT EXISTS`, không đụng bảng `vaults`.
- Worker: bốn hàm `putOrderRecord`, `getOrderRecord`, `linkCheckout`, `recordKeyForCheckout`. Ghi D1 bằng `INSERT ... ON CONFLICT DO NOTHING`: webhook gửi lại hay hai webhook chạy song song chỉ giữ đúng một token (bản ký sau bị bỏ, không gửi email lần hai). Đọc D1 trước, KV sau. KV vẫn được ghi kèm (dự phòng, rollback về bản Worker cũ vẫn đọc được). D1 lỗi hay thiếu binding thì rơi về KV và `console.error` để Workers Logs báo. Cả ba kênh SePay, LemonSqueezy, Polar dùng chung.
- 5 test mới trong `test/polar.test.js`: bản ghi và ánh xạ checkout nằm trong D1 kèm bản chép KV; bản ghi cũ chỉ có ở KV vẫn claim và chuyển hướng được; hai webhook song song chỉ giữ một token; không có binding D1 vẫn cấp được; hàng D1 quá hạn không cấp. Tổng 38/38.

## Triển khai (founder chạy, Claude không được deploy production)
```bash
cd cloudflare-worker
npx wrangler@4.151.0 d1 execute stride-sync --remote --file=schema.sql -y   # chỉ thêm 2 bảng, bảng cũ giữ nguyên
npx wrangler@4.151.0 deploy                                                 # ghi lại Version ID vào runbook 01 mục 6
```
Thứ tự bắt buộc: schema trước, deploy sau. Sau đó Claude mua thử bằng mã 100% (còn 2 lượt) và đo lại thời gian kích hoạt.

## Tiêu chí nghiệm thu
- [ ] Đơn production bằng mã 100%: Success URL chuyển về app trong vòng 10 giây sau khi webhook trả 202.
- [ ] `/claim` trả token ngay lần hỏi đầu tiên sau webhook.
- [ ] Test Worker cho cả bốn tình huống ở bước 4 đều qua; test cũ vẫn qua.

## Rủi ro & rollback
D1 lỗi hoặc chậm: Worker vẫn đọc dự phòng KV; rollback bằng deploy bản Worker trước (bảng mới để nguyên, không ảnh hưởng).

## Tham chiếu
- [Cloudflare KV: How KV works](https://developers.cloudflare.com/kv/concepts/how-kv-works/)
- [A05](./A05-enable-payments-in-production.md) · [runbook thanh toán mục 5c](../09-operations/02-payments-and-licensing-runbook.md)
