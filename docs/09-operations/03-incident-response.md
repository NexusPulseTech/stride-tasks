# Xử lý sự cố

> **Thuộc**: 09-operations · **Trạng thái**: Draft v1 · **Cập nhật**: 2026-10-30

## 1. Mức độ

| Mức | Định nghĩa | Phản hồi |
| :--- | :--- | :--- |
| **SEV1** | Nguy cơ mất dữ liệu người dùng; lộ khóa/secret; thanh toán nhận tiền nhưng không giao token hàng loạt; app trắng màn hình với mọi người | Ngay lập tức, ưu tiên trên mọi việc |
| **SEV2** | Đồng bộ hoặc claim ngừng hoạt động; Worker hết hạn mức gói Free | Trong vài giờ |
| **SEV3** | Lỗi giao diện, lỗi một tính năng phụ | Theo lịch sửa lỗi thường |

## 2. Quy trình chung

1. **Phát hiện** (khách báo, smoke test, cảnh báo Cloudflare) → ghi thời điểm.
2. **Giảm thiểu trước, tìm nguyên nhân sau**: rollback web (`git revert`) hoặc Worker (`wrangler rollback`); tắt tính năng bằng cấu hình nếu cần.
3. **Thông báo** người dùng bị ảnh hưởng (email/bài ghim) bằng giọng bình tĩnh, nêu việc họ nên làm.
4. **Khắc phục** triệt để + test tái hiện.
5. **Postmortem** trong 48 giờ (mẫu mục 4).

## 3. Kịch bản cụ thể

| Sự cố | Hành động |
| :--- | :--- |
| Hết 100k request/ngày (Worker trả lỗi) | Xem route gây tải trên dashboard; nếu do poll claim → phát hành bản backoff (A04); tạm thời nâng Workers Paid ($5/tháng) |
| Nghi lộ khóa riêng Ed25519 | Theo quy trình xoay khóa: [../06-security-privacy/02-secrets-and-key-management.md](../06-security-privacy/02-secrets-and-key-management.md) mục 3 |
| Webhook thanh toán lỗi liên tục | Kiểm tra secret đã nạp, chữ ký, log `wrangler tail`; cấp thủ công cho đơn bị ảnh hưởng; SePay có thống kê/thử lại webhook |
| Người dùng báo mất dữ liệu | Hướng dẫn tìm bản sao IndexedDB/sao lưu tự động (banner khôi phục khẩn cấp), xuất JSON ngay; **không** yêu cầu họ gửi mã đồng bộ |
| Bản web lỗi làm app trắng | Revert ngay; sau B04 Error Boundary cho phép người dùng xuất sao lưu dù UI lỗi |
| `SYNC_REQUIRE_LICENSE` bị đặt nhầm `false` | Đặt lại `true`, deploy, kiểm tra số kho có `license_id IS NULL` |

## 4. Mẫu postmortem (không đổ lỗi)

```
# Postmortem: <tiêu đề> — <ngày>
Mức: SEV? · Thời gian ảnh hưởng: <bắt đầu> → <kết thúc> · Người dùng ảnh hưởng: <ước tính>
## Tóm tắt
## Dòng thời gian
## Nguyên nhân gốc (5 Whys)
## Điều đã làm tốt / chưa tốt
## Hành động phòng ngừa (owner, hạn) — mỗi hành động thành một task
```
