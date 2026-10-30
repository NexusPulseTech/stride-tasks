# Giá & đóng gói (Pricing & Packaging)

> **Thuộc**: 01-business · **Trạng thái**: Draft v1 · **Cập nhật**: 2026-10-30
> **Mục đích**: định nghĩa gói Free/PRO, mức giá và *khoảnh khắc* hiện lời mời nâng cấp. Code nguồn sự thật: `src/config/commerceConfig.ts`, `src/hooks/useProLicense.ts`.

## 1. Hiện trạng trong code (v3.1.0)

| Gói | Bao gồm |
| :--- | :--- |
| **Free** | Toàn bộ lõi: nhập nhanh NLP, việc con nhiều cấp, Kanban, Pomodoro + Deep Work log, SM-2, heatmap, sao lưu JSON; **tối đa 5 dự án** (không tính dự án mẫu, người dùng cũ được giữ nguyên); **3 lượt** báo cáo Markdown |
| **PRO trọn đời** | Đồng bộ đa thiết bị mã hóa đầu-cuối + không giới hạn dự án + báo cáo Markdown không giới hạn |

| Bậc giá (PPP) | Giá | Ghi chú |
| :--- | :--- | :--- |
| `vn-ppp` | **199.000₫** (~$7.95) | VietQR |
| `emerging-ppp` | **$14.95** | Thị trường mới nổi |
| `global-us` | **$25.95** | Mặc định quốc tế |

Paywall đang **tắt** (`VITE_ENABLE_PAYWALL` chưa đặt) → hiện chưa thu được đồng nào.

## 2. Đối chiếu thị trường

| Đối thủ | Giá | Stride rẻ/đắt hơn? |
| :--- | :--- | :--- |
| TickTick | ≈ $35.99/năm | PRO lifetime $25.95 **rẻ hơn 1 năm** TickTick |
| Todoist Pro | ≈ $60/năm | Rẻ hơn ~2,3 lần chỉ riêng năm đầu |
| Things 3 (Mac) | $49.99 một lần | Rẻ hơn, lại đa nền tảng |
| Focus To-Do lifetime | $11.99 | Đắt hơn ở bậc global; bậc emerging/VN tương đương hoặc rẻ hơn |

Kết luận: mức giá hiện tại **hợp lý, không cần đổi** trước khi có dữ liệu bán hàng thật.

## 3. Quyết định đề xuất cho giai đoạn mở bán

1. **Giữ mô hình lifetime** trong giai đoạn đầu: giảm ma sát mua lần đầu, hợp văn hóa indie, có tiền lệ (Focus To-Do, Things).
2. **Founding Member −30%** cho **100 khách đầu tiên** *hoặc* 30 ngày (cái nào đến trước), triển khai bằng mã giảm giá của Merchant of Record (VD `FOUNDER30`). Hiển thị số suất còn lại **thật** — không tạo khan hiếm giả.
3. **Hoàn tiền 14 ngày không cần lý do** → giảm lo lắng khi mua; MoR cũng yêu cầu có chính sách hoàn tiền.
4. **PPP**: giữ 3 bậc. Gợi ý bậc theo quốc gia (header `CF-IPCountry` qua một endpoint nhỏ của Worker) nhưng vẫn cho người dùng tự chọn; chấp nhận rò rỉ nhỏ — chi phí chống gian lận lớn hơn doanh thu mất.
5. **Không** thêm thuê bao trước 50 khách trả tiền. Sau đó đánh giá gói "Sync hằng năm" hoặc "lifetime + cập nhật theo năm" (task `D04`).

## 4. Khoảnh khắc hiện lời mời nâng cấp (paywall moments)

Nguyên tắc: **không chặn vòng lặp cốt lõi** (thêm việc → làm → hoàn thành). Chỉ mời khi người dùng đã nhận giá trị và muốn *nhiều hơn*.

| Khoảnh khắc | Thông điệp | Mức chặn |
| :--- | :--- | :--- |
| Tạo dự án thứ 6 | "Bạn đang dùng Stride cho nhiều mảng — PRO mở không giới hạn dự án" | Chặn tạo (dữ liệu cũ không bị ảnh hưởng) |
| Bấm "Đồng bộ thiết bị" | "Đồng bộ mã hóa đầu-cuối giữa các thiết bị" | Chặn bật đồng bộ |
| Báo cáo Markdown lần thứ 4 | "Bạn đã dùng hết 3 lượt thử" | Chặn xuất |
| Ngày thứ 7 dùng liên tục (đề xuất mới) | Lời cảm ơn + giới thiệu PRO một lần, đóng được | Không chặn |

## 5. Những điều không làm

- Không khóa dữ liệu người dùng sau paywall; luôn xuất JSON được.
- Không dùng "dark pattern" (đếm ngược giả, nút từ chối ẩn).
- Không tăng giá cho khách đã mua lifetime; quyền lợi đã bán là cam kết.

## Tham chiếu

- Cổng thanh toán & phí thực nhận: [04-payments-and-merchant-of-record.md](./04-payments-and-merchant-of-record.md)
- Danh mục tính năng Free/PRO chi tiết: [../03-product/02-feature-catalog-free-vs-pro.md](../03-product/02-feature-catalog-free-vs-pro.md)
- Task triển khai: [../10-execution-plan/A03-merchant-of-record-onboarding.md](../10-execution-plan/A03-merchant-of-record-onboarding.md), [../10-execution-plan/A05-enable-payments-in-production.md](../10-execution-plan/A05-enable-payments-in-production.md)
