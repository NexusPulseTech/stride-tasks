# Quản lý bí mật & khóa

> **Thuộc**: 06-security-privacy · **Trạng thái**: Accepted · **Cập nhật**: 2026-10-30
> **Bối cảnh**: repo `NexusPulseTech/stride-tasks` là **public** — một bí mật lọt vào commit coi như đã lộ vĩnh viễn (lịch sử git, bản fork, bộ nhớ đệm).

## 1. Danh mục bí mật

| Bí mật | Nơi lưu hợp lệ | Ai dùng | Hậu quả nếu lộ | Xoay vòng |
| :--- | :--- | :--- | :--- | :--- |
| `STRIDE_ED25519_PRIVATE_KEY` | `.env.local` (máy founder, gitignore) · Worker secret (khi bật bán) · bản sao offline trong trình quản lý mật khẩu | Ký token PRO | Kẻ xấu tự phát hành PRO không giới hạn, tạo kho đồng bộ tùy ý | Khi nghi lộ (quy trình mục 3) |
| `SEPAY_API_KEY` | Worker secret · cấu hình webhook SePay | Xác thực webhook | Giả giao dịch → nhận PRO miễn phí | 6–12 tháng hoặc khi nghi lộ |
| `POLAR_WEBHOOK_SECRET`, `POLAR_ACCESS_TOKEN` | Worker secret | Xác thực webhook, tạo checkout | Giả đơn / thao tác tài khoản Polar | Theo khuyến nghị Polar |
| `LEMONSQUEEZY_SIGNING_SECRET` | Worker secret (sẽ gỡ) | Webhook cũ | Giả đơn | Gỡ khi bỏ kênh |
| `RESEND_API_KEY` | Worker secret | Gửi email | Gửi thư mạo danh từ domain | 12 tháng |
| `CLOUDFLARE_API_TOKEN` (CI) | GitHub Actions secret | Deploy Worker | Sửa/xóa Worker, đọc D1 | 90 ngày; quyền tối thiểu |
| OAuth Wrangler (máy founder) | `%APPDATA%/xdg.config/.wrangler` | Deploy thủ công | Như trên | `wrangler logout` khi không dùng; thu hồi tại *My Profile → Access Management → Connected Applications* |

**Không phải bí mật**: `LICENSE_PUBLIC_KEY` (nhúng trong app), ID KV/D1 (nhưng vẫn để trong `wrangler.toml` gitignore để không lộ cấu trúc tài khoản), URL Worker.

## 2. Quy tắc bắt buộc

1. Không bao giờ in bí mật ra terminal, log, issue, PR, chat. Script cần khóa phải **đọc từ file** và không in giá trị.
2. Trước mỗi commit chạm cấu hình: quét diff đã stage tìm mảnh khóa (đã làm thủ công ở v3.1.0; tự động hóa trong CI — task B03).
3. Bật **GitHub secret scanning + push protection** cho repo.
4. Nạp secret vào Worker bằng `npx wrangler secret put <NAME>` (nhập qua stdin), không đặt trong `[vars]`.
5. CI dùng token API riêng, quyền tối thiểu (*Account → Workers Scripts: Edit, D1: Edit, Workers KV: Edit* — chỉ account 54a0…), không dùng OAuth cá nhân.
6. Bí mật khác nhau cho `staging` và `production`.

## 3. Quy trình khi khóa riêng Ed25519 bị lộ

1. Sao lưu khóa cũ, rồi sinh cặp khóa mới bằng `npm run keygen -- init --force` — lệnh này **ghi đè** private key trong `.env.local` và public key trong `src/utils/licenseCrypto.ts`; kiểm tra lại bằng `npm run keygen -- check`.
2. Phát hành bản app nhận **cả hai** public key (cũ + mới) để token hợp lệ không bị khóa nhầm; thêm `kid` (key id) vào payload token mới.
3. Worker: chuyển sang ký bằng khóa mới; với sync, từ chối token ký bằng khóa cũ có `activatedAt` sau thời điểm lộ.
4. Phát lại token mới cho khách hàng hợp lệ (dựa vào sổ cái đơn hàng) qua email/link kích hoạt.
5. Sau một chu kỳ phát hành, bỏ public key cũ khỏi app.
6. Ghi sự cố vào [../09-operations/03-incident-response.md](../09-operations/03-incident-response.md).

## 4. Sao lưu

Khóa riêng có **một** bản sao offline (trình quản lý mật khẩu có mã hóa). Mất khóa = không phát hành được token mới cho khách hàng cũ cùng chữ ký → phải xoay khóa như mục 3.
