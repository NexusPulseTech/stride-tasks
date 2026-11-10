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

## 1a. Báo công cụ tìm kiếm khi thêm hoặc sửa trang (IndexNow)

Chỉ làm khi trang tĩnh (trang đích, pháp lý, trang nội dung) được thêm, đổi nội dung hoặc xóa, sau khi deploy xong. Deploy code app thì không cần. Cập nhật `<lastmod>` trong `public/sitemap.xml` cùng lúc.

```bash
npm run indexnow -- check                                         # site thật trả đúng file khóa
npm run indexnow -- submit https://tasks.nexuspulsetech.xyz/en/   # chỉ URL đã đổi; bỏ trống thì gửi cả sitemap
```

HTTP 200 hoặc 202 là đạt. Một lần gửi tới `api.indexnow.org` được chia sẻ cho mọi công cụ tham gia (Bing, Yandex, Seznam, Naver...). Google không dùng IndexNow: với Google, dựa vào sitemap và Search Console.

## 1a-bis. Kiểm tra sống tự động

Workflow `Production health check` (`.github/workflows/health-check.yml`) chạy mỗi 6 giờ: app có thẻ CSP và script chống nhúng, header bảo mật ở edge, trang đích, trang pháp lý, sitemap, service worker, và Worker trả đúng 400/403/204/404. Chỉ dùng curl, không tạo đơn hay phiên checkout. Bước lỗi thì GitHub gửi email cho người sửa workflow gần nhất; chạy tay bằng `gh workflow run "Production health check"`. GitHub tự tắt lịch sau 60 ngày repo không có commit.

## 1b. Header bảo mật (Cloudflare)

GitHub Pages không cho đặt header, nhưng tên miền đi qua proxy Cloudflare nên đặt được bằng Transform Rule (gói Free có sẵn). Thẻ meta CSP của app không nhận `frame-ancestors`, nên chống nhúng trang đầy đủ cần header này; script chống nhúng trong bản build chỉ là lớp dự phòng (B04).

- Vị trí: Cloudflare, zone `nexuspulsetech.xyz` → Rules → Transform Rules → Modify Response Header.
- Điều kiện: `http.host eq "tasks.nexuspulsetech.xyz"`.
- Đặt giá trị tĩnh (Set static):

| Header | Giá trị |
| :--- | :--- |
| `Content-Security-Policy` | `frame-ancestors 'none'` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |
| `Strict-Transport-Security` | `max-age=31536000` |

Header CSP ở đây chỉ có `frame-ancestors`. Trình duyệt áp dụng đồng thời mọi chính sách (header và thẻ meta), nên header này không nới lỏng gì. HSTS không kèm `includeSubDomains` để không ràng buộc các tên miền con khác. App không dùng camera, micro hay vị trí; clipboard không bị ảnh hưởng.

Kiểm tra sau khi bật: `curl -sI https://tasks.nexuspulsetech.xyz/ | grep -iE "frame|content-security|nosniff|strict-transport"`.

Trạng thái: **đã bật 2026-11-10** (founder duyệt), rule tên "Security headers: tasks.nexuspulsetech.xyz", là rule duy nhất trong mục Response Header Transform Rules của zone. Kiểm chứng: curl thấy đủ 6 header trên `/`, `/en/` và `/sw.js`, host `tasks-api` không bị ảnh hưởng; trang lạ nhúng `/en/` bị Chrome chặn với lỗi `frame-ancestors 'none'`; app vẫn tải CSS, service worker và manifest bình thường với `nosniff`, 0 vi phạm CSP.

## 2. Worker (`stride-license`)

Thực hiện trong `cloudflare-worker/` (cho tới khi có `worker.yml`: task B07). Chạy `npm test` trước, đỏ thì không deploy:

```bash
export WRANGLER_SEND_METRICS=false   # account_id nằm trong wrangler.toml (đã gitignore)
W="npx --yes wrangler@4.151.0"
$W whoami                       # đúng tài khoản Cloudflare của dự án
$W deploy --dry-run --outdir /tmp/stride-dryrun   # kiểm bundle + bindings
$W deploy                       # in "Current Version ID: …", ghi lại
```

Kiểm tra sau deploy: chạy smoke test production (14 bước: CORS, 401/402, tạo-đọc-giải mã-xóa kho, webhook fail-closed, route lạ 404) và xác nhận D1 còn 0 dòng rác.

**Rollback**: `$W deployments list` → `$W rollback <version-id>` (quay về phiên bản trước), rồi chạy lại smoke test.

## 3. D1

- Áp schema/migration: `$W d1 execute stride-sync --remote --file=schema.sql` (hiện tại) → sau B05 dùng `$W d1 migrations apply stride-sync --remote`.
- Sao lưu trước thay đổi lớn: `$W d1 export stride-sync --remote --output=backup-YYYYMMDD.sql` (lưu ngoài repo).
- Đếm dữ liệu: `$W d1 execute stride-sync --remote --command "SELECT COUNT(*) FROM vaults"`.
- Bảng: `vaults` (kho đồng bộ), `orders` và `checkouts` (bản ghi đơn đã thanh toán, A11). Dọn đơn quá hạn giữ: `$W d1 execute stride-sync --remote --command "DELETE FROM orders WHERE expires_at < strftime('%Y-%m-%dT%H:%M:%fZ','now')"` (đọc đã tự bỏ qua hàng quá hạn, dọn chỉ để gọn).

## 4. Secret & cấu hình

- Nạp secret: `printf '%s' "<giá trị>" | $W secret put <NAME>` hoặc nhập tương tác; **không** in giá trị ra màn hình, không lưu trong lịch sử shell (đọc từ file `.env.local` bằng script).
- Liệt kê (chỉ tên): `$W secret list`.
- Biến công khai: sửa `[vars]` trong `wrangler.toml` (gitignore) **và** `wrangler.example.toml` (trong repo) cho khớp.

## 5. Desktop

Tạm ngừng phát hành bản desktop qua tag cho tới khi task D02 hiện đại hóa workflow (ký số, đồng bộ phiên bản). Người dùng Windows được hướng tới PWA/Microsoft Store. Từ 2026-11-09 workflow "Desktop Release" bị tắt (Disabled) trong tab Actions và chỉ còn trigger chạy tay; bật lại khi làm D02.

## 6. Nhật ký deploy

Ghi mỗi lần deploy Worker vào bảng dưới (hoặc GitHub Release notes):

| Ngày | Version ID | Thay đổi | Smoke test |
| :--- | :--- | :--- | :--- |
| 2026-10-30 | `53082fcc-d571-4f7d-aad2-fa8a9ff61f4c` | Deploy đầu tiên, custom domain `tasks-api`, chưa có secret | 14/14 ✅ |
| 2026-10-30 | `396e79ac-0392-404b-b73b-9a96c232102f` | A04a: `/v1/orders`, claim có bí mật, thu hồi khi hoàn tiền, 3 rate limit binding, giá sáng lập `PRICE_VND=149000` | 14/14 ✅ + kiểm tra A04 trực tiếp |
| 2026-10-30 | `c1e2c388-79d2-462c-8322-1d4a7fea4548` | A04b: `POST /webhooks/polar` (Standard Webhooks, idempotent, thu hồi khi hoàn toàn bộ) | 14/14 ✅, webhook không chữ ký → 403 |
| 2026-11-02 | `e22adac1-5d0d-414b-bd72-0d7e899fbea5` | A04c: `GET /checkout/success` (Success URL của Polar, đổi `checkout_id` thành link kích hoạt) | 31/31 test Worker ✅; production: trang chờ 200, ID sai 400, header no-store/no-referrer/noindex/CSP; claim 401, webhook không chữ ký 403, sync 401 |
| 2026-11-09 | `6b0abc60-3a51-4f46-8235-bb1f966981de` | Secret webhook Polar được `trim()` trước khi dùng (dán qua pipe hay dính ký tự xuống dòng) | 32/32 test Worker ✅ |
| 2026-11-09 | `1b545fdb-48d4-4962-857f-c8d3e16587a9` | Điều kiện "đã hoàn đủ" cộng cả `refunded_tax_amount` (Polar tính tiền hoàn không gồm thuế) | 33/33 test Worker ✅; mua thử sandbox end-to-end đạt; webhook không chữ ký 403, claim 401, trang chờ 200, đơn đã trả 302 |
| 2026-11-09 | `94d3ccab-e3d1-42ef-91f5-2ff17fb8ffae` | Bật Workers Logs (`[observability]`, gói Free 200.000 sự kiện/ngày, giữ 3 ngày) | 33/33 test Worker ✅; webhook không chữ ký 403, claim 401, đơn đã trả 302 |

## 7. Phát hành phiên bản (Release)

Chuẩn: [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html) và [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/). `CHANGELOG.md` là nguồn sự thật; ghi chú trên GitHub Release chép từ mục tương ứng.

1. Ghi thay đổi vào mục `[Unreleased]` của `CHANGELOG.md` ngay trong commit làm thay đổi đó.
2. Khi phát hành: đổi `[Unreleased]` thành `[X.Y.Z] - YYYY-MM-DD`, thêm link so sánh ở cuối file, viết báo cáo chi tiết `docs/Release/YYYY-MM-DD-vX.Y.Z-ten.md` và thêm dòng vào `docs/Release/README.md`.
3. Nâng số phiên bản ở đủ 6 nơi: `npm version X.Y.Z --no-git-tag-version` (package.json, package-lock.json), `APP_VERSION` trong `src/constants/index.ts`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`, mục `name = "app"` trong `src-tauri/Cargo.lock`, badge trong `README.md`.
4. Chạy `npm run lint`, `npm test`, test Worker và quét bí mật; commit `chore(release): vX.Y.Z`, push, chờ deploy xanh.
5. Gắn tag annotated vào đúng commit đó và đẩy riêng tag: `git tag -a vX.Y.Z <commit> -m "Stride Tasks vX.Y.Z"` rồi `git push origin vX.Y.Z`.
6. Tạo release: `gh release create vX.Y.Z --verify-tag --title "Stride Tasks vX.Y.Z" --notes-file <mục CHANGELOG> --latest`.

Bản desktop không còn tự dựng theo tag. Workflow cũ trong các commit trước 3.2.0 vẫn có trigger `push: tags`, nên đẩy tag cho commit cũ sẽ kích hoạt dựng desktop từ code cũ. Tắt workflow "Desktop Release" trước khi gắn tag lùi về quá khứ. Đã gắn tag và tạo release cho mọi bản từ v1.0.0 tới v3.2.0 (2026-11-09); tag gắn bù mang đúng ngày của commit phát hành.
