# Stride Tasks: Cloudflare Worker (bản quyền + đồng bộ)

Một Worker duy nhất phục vụ 2 việc:

| Route | Chức năng |
| :--- | :--- |
| `POST /webhook/sepay` | Nhận biến động số dư VietQR → ký bản quyền Ed25519 → lưu KV theo mã đơn |
| `POST /webhook/lemonsqueezy` | Nhận `order_created` → ký bản quyền → lưu KV (+ email link kích hoạt nếu có Resend) |
| `GET /claim?order=STRxxxxxx` | App hỏi định kỳ để tự kích hoạt PRO sau khi thanh toán |
| `GET/PUT/DELETE /sync/v1/vaults/<vaultId>` | Kho đồng bộ **mã hóa đầu-cuối** (chỉ lưu bản mã), yêu cầu token PRO |

## Triển khai (≈ 15 phút)

```bash
cd cloudflare-worker
cp wrangler.example.toml wrangler.toml
npx wrangler login
npx wrangler kv namespace create LICENSES          # dán id vào wrangler.toml
npx wrangler d1 create stride-sync                 # dán database_id vào wrangler.toml
npx wrangler d1 execute stride-sync --remote --file=schema.sql
npx wrangler secret put STRIDE_ED25519_PRIVATE_KEY # giá trị trong ../.env.local
npx wrangler secret put SEPAY_API_KEY
npx wrangler secret put LEMONSQUEEZY_SIGNING_SECRET
npx wrangler deploy
```

Worker chạy ở domain riêng `https://tasks-api.nexuspulsetech.xyz` (khai báo trong `routes`, Cloudflare tự tạo DNS + SSL). Khai báo URL này vào GitHub
**Settings → Secrets and variables → Actions → Variables**:

- `VITE_LICENSE_CLAIM_URL`: tự kích hoạt sau thanh toán
- `VITE_SYNC_API_URL`: bật mục "Đồng bộ thiết bị" trong app

rồi push / chạy lại workflow Deploy.

## Bảo mật & quyền riêng tư

- Mã đồng bộ (128 bit) **không bao giờ rời thiết bị**. Máy chủ chỉ nhận `vaultId = SHA-256(mã)` và bản mã AES-256-GCM.
- Ghi đè an toàn bằng khóa lạc quan: `PUT` phải gửi `expectedVersion` đúng version hiện tại, sai → `409`, app tự kéo lại và hợp nhất.
- Mỗi request đồng bộ phải có `Authorization: Bearer <token PRO>`; Worker xác minh chữ ký Ed25519 bằng public key và giới hạn `SYNC_MAX_VAULTS_PER_LICENSE` kho cho mỗi bản quyền.
- D1 Free plan giới hạn số dòng đọc/ghi mỗi ngày (áp dụng cứng từ 01/09/2026). Mỗi lần đẩy dữ liệu = 1 lượt ghi, mỗi lần kiểm tra = 1 lượt đọc, dư dùng cho vài nghìn người dùng; kiểm tra số liệu trong dashboard Cloudflare.

## Kiểm thử cục bộ

Logic Worker được kiểm thử bằng Node + `node:sqlite` (SQLite thật đóng vai D1), xem phần kiểm thử trong tài liệu phát hành.
Có thể chạy thử với `npx wrangler dev` (cần `wrangler.toml` và `--local` để dùng D1/KV cục bộ).
