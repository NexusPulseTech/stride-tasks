# Mô hình mối đe dọa (STRIDE)

> **Thuộc**: 06-security-privacy · **Trạng thái**: Reviewed · **Cập nhật**: 2026-10-30
> **Tài sản cần bảo vệ**: (1) dữ liệu công việc người dùng, (2) khóa riêng Ed25519, (3) secret thanh toán, (4) doanh thu (token PRO), (5) hạn mức Cloudflare (tính sẵn sàng).

## 1. Bảng mối đe dọa

| Loại | Mối đe dọa | Thành phần | Hiện trạng | Biện pháp / task |
| :--- | :--- | :--- | :--- | :--- |
| **S**poofing | Giả token PRO | App, sync API | ✅ Chữ ký Ed25519, xác minh offline & trên server | Giữ khóa riêng an toàn (file 02) |
| S | Giả webhook thanh toán | `/webhook/*` | ✅ API key / HMAC, fail-closed khi thiếu secret | Polar: Standard Webhooks + chống replay theo timestamp (A04) |
| S | Mạo danh người mua để nhận token (đoán mã đơn) | `/claim` | ❌ Chỉ cần biết mã 30-bit | `claimSecret` 128-bit + rate limit (A04) |
| **T**ampering | Sửa bản mã trên server | D1 | ✅ AES-GCM xác thực toàn vẹn, AAD = vaultId | — |
| T | Sửa token/trạng thái PRO cục bộ | localStorage | ✅ Xác minh lại khi khởi động, sai → reset | — |
| T | Chuỗi cung ứng: dependency/action độc hại | Build, CI | ⚠️ Dependency dạng `^`, CI dùng `npm install` (không `npm ci`), `bun-version: latest`, action chưa ghim | `npm ci`, Dependabot, ghim phiên bản action, CodeQL (B03) |
| **R**epudiation | Không chứng minh được đã phát hành token cho đơn nào | Worker | ⚠️ Bản ghi KV hết hạn sau 90 ngày | Sổ cái `orders` + `payment_events` lâu dài (A04/B05) |
| **I**nformation disclosure | Server đọc dữ liệu người dùng | Sync | ✅ Chỉ bản mã; vaultId là hash, không suy ra mã | — |
| I | XSS đánh cắp token PRO / mã đồng bộ trong localStorage | App web & Tauri | ⚠️ Không có CSP (GitHub Pages không đặt header; Tauri `csp: null`) | CSP qua `<meta http-equiv>` cho web + CSP trong `tauri.conf.json` (B04) |
| I | Lộ khóa riêng qua repo public | Repo | ✅ `.env.local` gitignore, đã quét diff & bundle | Secret scanning + push protection của GitHub (B03) |
| **D**enial of service | Cạn 100k request/ngày do poll claim | Worker | ❌ Poll 6s × 72h | Backoff + dừng (A04) |
| D | Spam tạo kho / ghi 1,9 MB liên tục | Sync | ⚠️ Cần token PRO, hạn mức 3 kho/bản quyền, chưa rate limit | Rate limit theo IP + license (B07) |
| D | Cấu hình sai `SYNC_REQUIRE_LICENSE=false` trên production | Worker | ⚠️ Chỉ là biến | Kiểm tra cấu hình khi khởi động + cảnh báo (B07) |
| **E**levation of privilege | Công cụ dev "simulate PRO" lọt production | App | ✅ Chỉ trong `import.meta.env.DEV`, đã xác nhận không có trong bundle production | Giữ test kiểm tra bundle (B03) |
| E | Token Cloudflare/GitHub quyền quá rộng | CI | ⚠️ Wrangler OAuth trên máy founder có nhiều scope | Token API riêng cho CI, quyền tối thiểu theo account (B07) |

## 2. Ưu tiên xử lý

1. 🔴 Claim yếu + poll gây DoS + thiếu thu hồi → **A04** (trước khi bật bán).
2. 🟠 CSP web/Tauri → **B04**.
3. 🟠 Chuỗi cung ứng CI (npm ci, Dependabot, ghim action, CodeQL) → **B03**.
4. 🟡 Rate limit, kiểm tra cấu hình, token CI quyền tối thiểu → **B07**.

## 3. Rà soát lại khi

- Thêm endpoint/webhook/cổng thanh toán mới.
- Thêm loại dữ liệu cá nhân (email, analytics).
- Tách dịch vụ (ADR-0005).
