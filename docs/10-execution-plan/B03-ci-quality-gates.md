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
- [ ] PR cố tình làm lỗi test/budget bị chặn.
- [ ] Dependabot tạo PR đầu tiên.
- [ ] Workflow không còn cảnh báo deprecation.
