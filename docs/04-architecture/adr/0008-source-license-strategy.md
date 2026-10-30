# ADR-0008: Chiến lược giấy phép mã nguồn

- **Trạng thái**: **Accepted** (founder chọn ngày 2026-10-31): phương án 3, `FSL-1.1-MIT`
- **Ngày**: 2026-10-30
- **Liên quan**: `LICENSE.md` (FSL-1.1-MIT), [../../01-business/06-legal-tax-compliance.md](../../01-business/06-legal-tax-compliance.md), task D05

## Bối cảnh

Repo `NexusPulseTech/stride-tasks` **public** với giấy phép **MIT**. MIT cho phép bất kỳ ai sao chép, sửa (kể cả gỡ paywall), và **bán lại** sản phẩm phái sinh. Đồng thời, mã nguồn công khai là lợi thế niềm tin (kiểm chứng được mã hóa E2E) và thu hút cộng đồng kỹ thuật (Show HN).

## Các phương án

| Phương án | Ưu | Nhược |
| :--- | :--- | :--- |
| 1. Giữ MIT | Thân thiện cộng đồng tối đa | Đối thủ có thể clone & bán; không ngăn được |
| 2. **AGPL-3.0** cho phiên bản mới | Vẫn là mã nguồn mở; bản phái sinh chạy dịch vụ phải công bố mã → khó đóng gói bán kín | Một số doanh nghiệp tránh AGPL |
| 3. **Source-available có thời hạn** (VD Functional Source License, tự chuyển sang Apache/MIT sau 2 năm) | Chặn cạnh tranh thương mại trực tiếp, vẫn minh bạch | Không còn "open source" theo định nghĩa OSI |
| 4. Đóng mã (private repo) | Bảo vệ tối đa | Mất lợi thế niềm tin, phải xử lý lịch sử đã public |

## Lưu ý pháp lý

Mã đã phát hành dưới MIT **vẫn mãi là MIT** với các bản đó; thay đổi chỉ áp dụng cho mã mới từ thời điểm đổi. Người đóng góp bên ngoài (nếu có) cần đồng ý.

## Quyết định (2026-10-31)

Chọn phương án 3: **Functional Source License 1.1, MIT Future License** (`FSL-1.1-MIT`, văn bản gốc tại fsl.software, chỉ điền năm và tên chủ bản quyền "NexusPulse Studio").

- Áp dụng cho mã từ commit đổi giấy phép ngày 2026-10-31. Các phiên bản và commit trước đó (gồm v3.1.0) giữ MIT.
- Được dùng, sao chép, sửa, học từ mã cho mọi mục đích, trừ **Competing Use**: đưa phần mềm vào sản phẩm hoặc dịch vụ thương mại thay thế Stride hoặc có chức năng tương tự.
- Mỗi phiên bản tự chuyển sang MIT sau 2 năm kể từ ngày phát hành.
- Repo giữ public: GitHub Pages của org gói Free chỉ chạy với repo public, và mã công khai là bằng chứng cho lời hứa mã hóa đầu-cuối.
- Vì sao không chọn private: đóng repo trên gói Free làm GitHub tự gỡ site Pages; phải chuyển hosting hoặc trả phí, và mất lợi thế "tự kiểm chứng mã hóa". Bundle JS của web app vẫn công khai dù repo private.

## Hệ quả của quyết định

- Không gọi Stride là "open source" nữa: dùng "source available" / "mã nguồn công khai". FSL không phải giấy phép OSI.
- Thư mục chỉ nhận mã nguồn mở (OpenAlternative) không còn phù hợp; AlternativeTo không chọn nhãn Open Source.
- Khi có người đóng góp bên ngoài: cần thỏa thuận đóng góp (CLA hoặc DCO kèm điều khoản cấp quyền) trước khi nhận pull request.
- Bảo vệ pháp lý là răn đe, không phải rào kỹ thuật. Giá trị PRO vẫn nằm ở **dịch vụ đồng bộ đang vận hành, cập nhật và hỗ trợ**.
