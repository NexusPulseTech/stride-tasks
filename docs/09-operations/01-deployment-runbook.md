# Runbook triển khai

> **Thuộc**: 09-operations · **Trạng thái**: Reviewed · **Cập nhật**: 2026-10-30

## 1. Web app (GitHub Pages)

1. Merge vào `main` → workflow **Deploy to GitHub Pages** tự chạy (type check → build → Pages).
2. Theo dõi: `gh run watch <run-id> --exit-status`.
3. Kiểm tra sau deploy:
   ```bash
   B=https://tasks.nexuspulsetech.xyz
   for p in / /manifest.json /sw.js /privacy.html /og-image.png /sitemap.xml; do
     curl -s -o /dev/null -w "%{http_code} $p\n" "$B$p?cb=$RANDOM"; done
   ```
4. Quét bundle production tìm mảnh khóa riêng (script quét bí mật, tự động hóa ở B03).
5. **Rollback**: `git revert <commit>` → push `main` (Service Worker `autoUpdate` sẽ kéo bản mới ở lần mở tiếp theo).

## 2. Worker (`stride-license`)

Thực hiện trong `cloudflare-worker/` (cho tới khi có `worker.yml`: task B07):

```bash
export WRANGLER_SEND_METRICS=false CLOUDFLARE_ACCOUNT_ID=54a0a2e6fd9115d32f9cf767f9ab4764
W="npx --yes wrangler@4.151.0"
$W whoami                       # đúng tài khoản Nguyenhoangphuc7077@gmail.com's Account
$W deploy --dry-run --outdir /tmp/stride-dryrun   # kiểm bundle + bindings
$W deploy                       # in "Current Version ID: …", ghi lại
```

Kiểm tra sau deploy: chạy smoke test production (14 bước: CORS, 401/402, tạo-đọc-giải mã-xóa kho, webhook fail-closed, route lạ 404) và xác nhận D1 còn 0 dòng rác.

**Rollback**: `$W deployments list` → `$W rollback <version-id>` (quay về phiên bản trước), rồi chạy lại smoke test.

## 3. D1

- Áp schema/migration: `$W d1 execute stride-sync --remote --file=schema.sql` (hiện tại) → sau B05 dùng `$W d1 migrations apply stride-sync --remote`.
- Sao lưu trước thay đổi lớn: `$W d1 export stride-sync --remote --output=backup-YYYYMMDD.sql` (lưu ngoài repo).
- Đếm dữ liệu: `$W d1 execute stride-sync --remote --command "SELECT COUNT(*) FROM vaults"`.

## 4. Secret & cấu hình

- Nạp secret: `printf '%s' "<giá trị>" | $W secret put <NAME>` hoặc nhập tương tác; **không** in giá trị ra màn hình, không lưu trong lịch sử shell (đọc từ file `.env.local` bằng script).
- Liệt kê (chỉ tên): `$W secret list`.
- Biến công khai: sửa `[vars]` trong `wrangler.toml` (gitignore) **và** `wrangler.example.toml` (trong repo) cho khớp.

## 5. Desktop

Tạm ngừng phát hành bản desktop qua tag cho tới khi task D02 hiện đại hóa workflow (ký số, đồng bộ phiên bản). Người dùng Windows được hướng tới PWA/Microsoft Store.

## 6. Nhật ký deploy

Ghi mỗi lần deploy Worker vào bảng dưới (hoặc GitHub Release notes):

| Ngày | Version ID | Thay đổi | Smoke test |
| :--- | :--- | :--- | :--- |
| 2026-10-30 | `53082fcc-d571-4f7d-aad2-fa8a9ff61f4c` | Deploy đầu tiên, custom domain `tasks-api`, chưa có secret | 14/14 ✅ |
