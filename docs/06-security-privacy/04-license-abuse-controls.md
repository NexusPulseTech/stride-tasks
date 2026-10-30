# Kiểm soát lạm dụng bản quyền

> **Thuộc**: 06-security-privacy · **Trạng thái**: Draft v1 · **Cập nhật**: 2026-10-30

## 1. Quan điểm

- Mục tiêu **không** phải chống sao chép tuyệt đối (bất khả thi với app offline + mã nguồn MIT công khai). Mục tiêu là: người trung thực mua dễ dàng; lạm dụng **không tốn tiền hạ tầng của mình**; dịch vụ có chi phí (đồng bộ) được bảo vệ.
- Không dùng DRM xâm phạm (định danh phần cứng, kiểm tra online bắt buộc) — đi ngược định vị riêng tư.

## 2. Biện pháp

| Biện pháp | Trạng thái | Bảo vệ cái gì |
| :--- | :--- | :--- |
| Token Ed25519 không sửa được | ✅ | Không tự "bật PRO" bằng cách sửa localStorage |
| Hạn mức `SYNC_MAX_VAULTS_PER_LICENSE = 3` | ✅ | Một token chia sẻ không tạo được vô hạn kho |
| `SYNC_REQUIRE_LICENSE = true` | ✅ | Không có token → không dùng hạ tầng đồng bộ |
| Danh sách thu hồi (`revocations`) khi hoàn tiền/chargeback | ❌ → A04 | Hoàn tiền không còn dùng sync |
| Claim cần `claimSecret` | ❌ → A04 | Không lấy được token của người khác |
| Rate limit theo IP + license | ❌ → B07 | Spam tạo kho, dò mã |
| Cảnh báo bất thường: một `license_id` tạo kho mới > 3 lần/24h hoặc hàng trăm IP khác nhau | ❌ → B07 | Phát hiện token bị phát tán công khai |
| `kid` trong token để xoay khóa | ❌ → khi cần | Phản ứng khi lộ khóa riêng |

## 3. Khi phát hiện token bị phát tán

1. Thu hồi `license_id` đó cho sync (thêm vào `revocations`).
2. Liên hệ người mua gốc (qua MoR) — cấp token mới nếu họ là nạn nhân.
3. Không chặn tính năng offline (không làm được và không đáng).

## 4. Liên quan giấy phép mã nguồn

Với MIT, một bản fork có thể gỡ paywall hợp pháp; dịch vụ đồng bộ của Stride vẫn yêu cầu token hợp lệ. Lựa chọn thay đổi giấy phép: [ADR-0008](../04-architecture/adr/0008-source-license-strategy.md).
