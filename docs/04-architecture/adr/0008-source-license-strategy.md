# ADR-0008: Chiến lược giấy phép mã nguồn

- **Trạng thái**: Proposed — **cần founder quyết định** (ảnh hưởng kinh doanh, không thuần kỹ thuật)
- **Ngày**: 2026-10-30
- **Liên quan**: `LICENSE` (MIT), [../../01-business/06-legal-tax-compliance.md](../../01-business/06-legal-tax-compliance.md), task D05

## Bối cảnh

Repo `NexusPulseTech/stride-tasks` **public** với giấy phép **MIT**. MIT cho phép bất kỳ ai sao chép, sửa (kể cả gỡ paywall), và **bán lại** sản phẩm phái sinh. Đồng thời, mã nguồn công khai là lợi thế niềm tin (kiểm chứng được mã hóa E2E) và thu hút cộng đồng kỹ thuật (Show HN).

## Các phương án

| Phương án | Ưu | Nhược |
| :--- | :--- | :--- |
| 1. Giữ MIT | Thân thiện cộng đồng tối đa | Đối thủ có thể clone & bán; không ngăn được |
| 2. **AGPL-3.0** cho phiên bản mới | Vẫn là mã nguồn mở; bản phái sinh chạy dịch vụ phải công bố mã → khó đóng gói bán kín | Một số doanh nghiệp tránh AGPL |
| 3. **Source-available có thời hạn** (VD Functional Source License — tự chuyển sang Apache/MIT sau 2 năm) | Chặn cạnh tranh thương mại trực tiếp, vẫn minh bạch | Không còn "open source" theo định nghĩa OSI |
| 4. Đóng mã (private repo) | Bảo vệ tối đa | Mất lợi thế niềm tin, phải xử lý lịch sử đã public |

## Lưu ý pháp lý

Mã đã phát hành dưới MIT **vẫn mãi là MIT** với các bản đó; thay đổi chỉ áp dụng cho mã mới từ thời điểm đổi. Người đóng góp bên ngoài (nếu có) cần đồng ý.

## Đề xuất (chờ quyết)

Phương án 2 hoặc 3 cho các phiên bản từ v3.2, giữ minh bạch phần mã hóa. Giá trị PRO nằm ở **dịch vụ đồng bộ đang vận hành + cập nhật + hỗ trợ**, không ở việc giấu mã.
