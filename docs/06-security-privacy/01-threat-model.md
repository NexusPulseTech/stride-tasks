# Mô hình mối đe dọa (STRIDE)

> **Thuộc**: 06-security-privacy · **Trạng thái**: Reviewed · **Cập nhật**: 2026-11-09
> **Tài sản cần bảo vệ**: (1) dữ liệu công việc người dùng, (2) khóa riêng Ed25519, (3) secret thanh toán, (4) doanh thu (token PRO), (5) hạn mức Cloudflare (tính sẵn sàng).

## 1. Bảng mối đe dọa

| Loại | Mối đe dọa | Thành phần | Hiện trạng | Biện pháp / task |
| :--- | :--- | :--- | :--- | :--- |
| **S**poofing | Giả token PRO | App, sync API | ✅ Chữ ký Ed25519, xác minh offline & trên server | Giữ khóa riêng an toàn (file 02) |
| S | Giả webhook thanh toán | `/webhook/*` | ✅ API key / HMAC, fail-closed khi thiếu secret | Polar: Standard Webhooks + chống replay theo timestamp (A04) |
| S | Mạo danh người mua để nhận token | `/claim`, `/checkout/success` | ✅ Claim cần bí mật 128 bit chỉ thiết bị mua giữ; Success URL dùng ID phiên checkout ngẫu nhiên của Polar; có rate limit | A04, A04c |
| **T**ampering | Sửa bản mã trên server | D1 | ✅ AES-GCM xác thực toàn vẹn, AAD = vaultId | - |
| T | Sửa token/trạng thái PRO cục bộ | localStorage | ✅ Xác minh lại khi khởi động, sai → reset | - |
| T | Clickjacking: trang lạ nhúng app vào khung để lừa người dùng bấm (xóa dữ liệu, kích hoạt) | App web | ✅ Header `frame-ancestors 'none'` và `X-Frame-Options: DENY` qua Cloudflare (2026-11-10); dự phòng: app tự ẩn khi bị nhúng; trình duyệt hiện đại còn tách bộ nhớ của khung nhúng | Runbook 01 mục 1b, B04 |
| T | Chuỗi cung ứng: dependency/action độc hại | Build, CI | ⚠️ Đang siết: Dependabot alerts và security updates đã bật (2026-11-10) | Ghim phiên bản, `npm ci`, cấu hình Dependabot, CodeQL (B03) |
| **R**epudiation | Không chứng minh được đã phát hành token cho đơn nào | Worker | ⚠️ Bản ghi KV hết hạn sau 90 ngày | Sổ cái `orders` + `payment_events` lâu dài (A04/B05) |
| **I**nformation disclosure | Server đọc dữ liệu người dùng | Sync | ✅ Chỉ bản mã; vaultId là hash, không suy ra mã | - |
| I | XSS đánh cắp token PRO / mã đồng bộ trong localStorage | App web & Tauri | ✅ Web: CSP chặt (không script inline lạ, chỉ gọi API của mình); không dùng `dangerouslySetInnerHTML` hay `eval`. Tauri: làm cùng D02 | CSP qua `<meta http-equiv>` cho web + CSP trong `tauri.conf.json` (B04) |
| I | Lộ khóa riêng qua repo public | Repo | ✅ `.env.local` gitignore, quét diff và bundle trước mỗi commit; secret scanning + push protection của GitHub bật 2026-11-10 | B03 |
| **D**enial of service | Cạn hạn mức request do app hỏi claim liên tục | Worker | ✅ Hỏi thưa dần và dừng sau 30 phút; rate limit theo IP | A04 |
| D | Spam tạo kho hoặc ghi dữ liệu lớn liên tục | Sync | ✅ Cần token PRO, hạn mức 3 kho mỗi bản quyền, rate limit ghi theo bản quyền | A04 |
| D | Cấu hình sai biến môi trường trên production | Worker | ⚠️ Đang bổ sung kiểm tra cấu hình | B07 |
| **E**levation of privilege | Công cụ dev "simulate PRO" lọt production | App | ✅ Chỉ trong `import.meta.env.DEV`, đã xác nhận không có trong bundle production | Giữ test kiểm tra bundle (B03) |
| E | Token Cloudflare/GitHub quyền quá rộng | CI | ⚠️ Đang chuyển sang token quyền tối thiểu | B07 |
| E | Dùng tiếp đồng bộ PRO sau khi hoàn tiền | Sync | ✅ Danh sách thu hồi, đồng bộ trả 402 `license_revoked` (kiểm chứng end-to-end trên sandbox 2026-11-09) | A04 |

## 2. Ưu tiên xử lý

1. ✅ Claim, poll và thu hồi: xong ở **A04**, kiểm chứng end-to-end trên sandbox ngày 2026-11-09.
2. 🟠 CSP web/Tauri → **B04**.
3. 🟠 Chuỗi cung ứng CI (npm ci, Dependabot, ghim action, CodeQL) → **B03**.
4. 🟡 Rate limit, kiểm tra cấu hình, token CI quyền tối thiểu → **B07**.

## 3. Rà soát lại khi

- Thêm endpoint/webhook/cổng thanh toán mới.
- Thêm loại dữ liệu cá nhân (email, analytics).
- Tách dịch vụ (ADR-0005).
