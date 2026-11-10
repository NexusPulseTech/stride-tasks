# B03: CI quality gates & chuỗi cung ứng

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | B: Foundation |
| Ưu tiên | P1 |
| Ước lượng | 1 ngày |
| Phụ thuộc | B01, B02 |
| Trạng thái | ◐ Cài đặt bảo mật repo đã bật 2026-11-10 (bước 7); còn workflow `ci`, Dependabot cấu hình, CodeQL, branch protection |

## Mục tiêu
Mọi PR và push `main` bị chặn khi type/lint/test/build/ngân sách/quét bí mật lỗi.

## Các bước
1. `.github/workflows/ci.yml` (PR + push): checkout, setup-node (`.nvmrc`, cache npm), `npm ci --legacy-peer-deps`, `typecheck`, `lint`, `test:coverage`, `build`, `scripts/ci/check-bundle-budget.mjs`, `scripts/ci/secret-scan.mjs`, lint OpenAPI (`@redocly/cli@2.64.1`).
2. `check-bundle-budget.mjs`: đọc `dist/assets/*`, so với [../07-engineering/05-performance-budgets.md](../07-engineering/05-performance-budgets.md), thoát 1 khi vượt.
3. `secret-scan.mjs` (bản CI, không cần `.env.local`): tìm khối PEM `BEGIN … PRIVATE KEY`, tiền tố DER chuẩn của khóa PKCS#8 Ed25519 (RFC 8410) ở dạng base64, và biến `STRIDE_ED25519_PRIVATE_KEY` có gán giá trị, trong diff và `dist/`. *Không ghi nguyên văn các chuỗi mẫu này vào tài liệu* (sẽ làm chính bộ quét báo động nhầm); khai báo chúng trong script.
   Script phải **thoát mã lỗi ≠ 0** khi phát hiện, và CI không được nối output qua pipe làm mất mã thoát.
4. `deploy.yml`: chỉ chạy sau `ci` thành công (`workflow_run` hoặc gộp job), đổi `npm install` → `npm ci`.
5. `.github/dependabot.yml`: `npm` + `github-actions`, hằng tuần, gộp nhóm.
6. CodeQL workflow (JavaScript/TypeScript).
7. **Founder tự bật** (thay đổi cài đặt bảo mật repo, Claude không được làm thay): secret scanning + push protection, Dependabot alerts + security updates, private vulnerability reporting; branch protection `main` yêu cầu `ci`. **Đã bật cả năm tính năng ngày 2026-11-10** (founder chạy các lệnh dưới đây; Claude đọc lại qua API: alerts 204, security updates bật, secret scanning và push protection `enabled`, private reporting `enabled`; lúc bật chưa có cảnh báo mở). Branch protection làm sau khi có workflow `ci`. Bật trong Settings, Advanced Security (hoặc Code security), hoặc chạy từ máy founder:

   ```bash
   gh api -X PUT repos/NexusPulseTech/stride-tasks/vulnerability-alerts
   gh api -X PUT repos/NexusPulseTech/stride-tasks/automated-security-fixes
   gh api -X PUT repos/NexusPulseTech/stride-tasks/private-vulnerability-reporting
   gh api -X PATCH repos/NexusPulseTech/stride-tasks -F "security_and_analysis[secret_scanning][status]=enabled" -F "security_and_analysis[secret_scanning_push_protection][status]=enabled"
   gh api repos/NexusPulseTech/stride-tasks --jq .security_and_analysis   # kiểm tra lại
   ```

## Tiêu chí nghiệm thu
## Phân loại cảnh báo Dependabot đầu tiên (2026-11-10)
Ngay khi bật, GitHub báo 13 cảnh báo (8 mở, 5 tự đóng). `npm audit --omit=dev` ở gốc repo và ở `cloudflare-worker` đều 0: **bundle web và Worker production không dính cảnh báo nào** (Worker chạy không có dependency npm). Secret scanning: 0 cảnh báo trên toàn lịch sử.

| Cảnh báo | Nằm ở | Bản vá | Xử lý |
| :--- | :--- | :--- | :--- |
| undici (5, có 4 high), zod | Bộ chạy test Worker (`@cloudflare/vitest-plugin` → miniflare) | undici 7.30.1, zod 4.6.6 | **Đã sửa**: nâng `@cloudflare/vitest-plugin` 1.4.4 → 1.5.0 (bản đã vá cũ nhất); `npm audit` của Worker còn 0, 38/38 test qua |
| wrangler ≤ 4.152.0 (qua miniflare) | Lệnh deploy và nạp secret chạy bằng `npx` | 4.153.0 | **Đã sửa**: ghim `wrangler@4.153.0` (phát hành 26/10, đủ 2 tuần) trong `scripts/worker-secrets.mjs` và runbook |
| minimatch 10.2.6 | Chỉ lúc build: `vite-plugin-pwa` → `workbox-build` → `glob@11` | 11.0.1, nhưng `glob@11` chỉ nhận minimatch 10.x | Chờ `workbox-build` nâng glob; mẫu glob là của chính dự án, không có đầu vào lạ |
| deepmerge 4.3.1 | Chỉ lúc build: `workbox-build` → `@rollup/plugin-node-resolve` | Chưa có | Chấp nhận: chỉ trộn cấu hình build của dự án |
| glib 0.18 (Rust) | Bản desktop Tauri, chỉ khi build cho Linux (GTK) | 0.20, cần nâng Tauri | Làm cùng D02 (desktop đang tạm dừng, bản Windows không dùng glib) |

`npm audit fix` ở gốc repo đề xuất hạ `vite-plugin-pwa` về 1.1.0: **không làm** (hạ cấp và đổi major chỉ để né cảnh báo build). Ba cảnh báo còn lại founder có thể Dismiss trên GitHub với lý do "Risk is tolerable to this project" và ghi chú như bảng trên, hoặc để mở tới khi upstream có bản vá.

- [ ] PR cố tình làm lỗi test/budget bị chặn.
- [ ] Dependabot tạo PR đầu tiên.
- [ ] Workflow không còn cảnh báo deprecation.
