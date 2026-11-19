# B10: Chuỗi cung ứng CI và khóa ký bản quyền

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | B: Foundation |
| Ưu tiên | P1 |
| Ước lượng | 0,5 ngày |
| Phụ thuộc | - (làm trước một phần của B03) |
| Nguồn | Đợt kiểm bảo mật 2026-11-18, các mục 1, 2, 12, 13 trong danh sách sửa nội bộ |
| Trạng thái | ◐ 2026-11-19: xong trên nhánh `fix/supply-chain`, chờ gộp `main` và chờ founder làm phần của mình |

## Trạng thái và bước tiếp theo
Cập nhật 2026-11-19, nhánh `fix/supply-chain` (worktree `stride-wt-supply`, chưa push, không deploy).
- Đã xong và đã kiểm: bước 1 đến 5 (workflow ghim SHA, quyền theo job, Dependabot, `npm ci`, phụ thuộc build sang dev). Module khóa `scripts/lib/signing-key.mjs` có 20 test, kiểm đột biến 3 lần (đường dẫn `..`, symlink, BOM) đều bị test bắt. `keygen.mjs` đã dùng module.
- Đang làm: `worker-secrets.mjs` dùng chung module; chạy thử đầu cuối hai script trên bản sao tạm của repo (không đụng `licenseCrypto.ts` thật); cập nhật tài liệu bước 7.
- Tiếp theo: lint, test, test Worker, build, quét bí mật; commit; báo phiên deploy (Phiên 2) và Cố vấn kèm mã commit và việc của founder.

## Mục tiêu
1. Workflow GitHub Actions chỉ chạy đúng mã đã được xem: mọi action ghim theo SHA commit, quyền token tối thiểu theo từng job, không còn công cụ thừa trong pipeline.
2. Khóa ký bản quyền Ed25519 không cần nằm trong thư mục repo nữa: script đọc khóa từ stdin hoặc từ tệp ngoài repo.
3. Phụ thuộc chỉ dùng lúc build nằm đúng nhóm `devDependencies`; cài đặt trong CI thống nhất bằng `npm ci`.

Chuẩn đối chiếu: hướng dẫn "Security hardening for GitHub Actions" của GitHub (ghim SHA đầy đủ, `GITHUB_TOKEN` quyền tối thiểu), các kiểm tra Pinned-Dependencies, Token-Permissions, Dependency-Update-Tool của OpenSSF Scorecard; cách đưa bí mật qua stdin hoặc tệp như `docker login --password-stdin`, `gh auth login --with-token`, `wrangler secret put`.

## Các bước

### 1. Ghim action theo SHA (mục 1)
SHA lấy ngày 2026-11-19 bằng `gh api repos/<owner>/<repo>/commits/<tag>`, đối chiếu lại qua `git/ref/tags/<tag>` (tag có chú thích thì đọc tiếp `git/tags/<sha>`); cả hai cách cho cùng một commit. Tag major đang dùng (`v7`, `v6`, `v5`, `v0`) trỏ đúng commit của tag đầy đủ bên dưới, nên `deploy.yml` và `worker-tests.yml` chạy y như trước.

| Action | Phiên bản | Commit |
| :--- | :--- | :--- |
| `actions/checkout` | v7.0.1 | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| `actions/setup-node` | v7.1.0 | `949feb2413d6458794dcd2491c4babbbce0c15c1` |
| `actions/configure-pages` | v6.0.0 | `45bfe0192ca1faeb007ade9deae92b16b8254a0d` |
| `actions/upload-pages-artifact` | v5.0.0 | `fc324d3547104276b827a68afc52ff2a11cc49c9` |
| `actions/deploy-pages` | v5.0.1 | `368f82528645a54fb793d4d04e342629a3f51346` |
| `tauri-apps/tauri-action` | v0.6.2 | `84b9d35b5fc46c1e45415bdb6144030364f7ebc5` |
| `dtolnay/rust-toolchain` | nhánh `stable` (commit 2026-11-15) | `39008827e6b4319a349e9a42dfc90579dd25f1ca` |

- `desktop-release.yml` đang dùng checkout và setup-node v4 (runtime Node cũ, có cảnh báo): nâng lên cùng commit v7 như `deploy.yml`. `tauri-action` giữ dòng v0 (đã có v1): đổi major để Dependabot đề xuất và thử cùng D02, vì workflow desktop chỉ chạy tay.
- `dtolnay/rust-toolchain` không phát hành tag phiên bản nên ghim commit đầu nhánh `stable`. Khi gọi bằng SHA, action không còn đọc toolchain từ tên ref, nên thêm `toolchain: stable`. Theo tài liệu GitHub, commit không gắn tag sẽ được Dependabot nâng lên commit mới nhất của nhánh mặc định; nhờ khai báo `toolchain: stable` nên hành vi vẫn đúng.
- Bun bị bỏ hẳn thay cho việc ghim `bun-version`: `bun.lock` là file thừa từ mẫu ban đầu (tên gói khác, liệt kê thư viện dự án không dùng). Mã của `tauri-action` v0.6.2 chọn `bun tauri` chỉ vì thấy file này. Xóa `bun.lock`, bỏ bước `setup-bun`, đặt `tauriScript: npx tauri` để dùng Tauri CLI cài từ `devDependencies` bằng `npm ci`.

### 2. Quyền token theo job (mục 1)
- Cấp workflow: `permissions: {}` (không cấp gì mặc định).
- `deploy`: `contents: read`, `pages: write`, `id-token: write` (đúng yêu cầu của `deploy-pages`).
- `build-tauri`: `contents: write`, chỉ để `tauri-action` tạo bản phát hành.
- `test` (Worker): `contents: read`.
- `health-check.yml`: chỉ gọi `curl` tới production, không đọc repo, nên để `permissions: {}` và job không cần quyền nào.
- `actions/checkout` thêm `persist-credentials: false`: không job nào cần `git push`, nên token không nằm lại trong `.git/config` của runner.

### 3. Dependabot cho GitHub Actions (mục 1)
`.github/dependabot.yml`: hệ `github-actions`, hằng tuần, gộp một nhóm, `cooldown` 7 ngày (chỉ áp cho cập nhật phiên bản, không chặn cập nhật bảo mật). Tài liệu GitHub: Dependabot sửa luôn chú thích phiên bản khi chú thích nằm cùng dòng với SHA, nên mọi dòng `uses:` giữ dạng `@<sha> # vX.Y.Z`. Đánh đổi: Dependabot không tạo cảnh báo lỗ hổng cho action ghim SHA, nên lịch nâng hằng tuần là thứ giữ action luôn mới. Hệ `npm` để lại cho B03 (cập nhật bảo mật npm của Dependabot đã bật từ 2026-11-10).

### 4. `npm ci` thống nhất (mục 13)
`deploy.yml` và `desktop-release.yml` đổi `npm install --legacy-peer-deps` thành `npm ci --legacy-peer-deps` (B03 bước 4). `worker-tests.yml` đã dùng `npm ci`.

### 5. Phụ thuộc build sang `devDependencies` (mục 12)
- Chuyển `vite`, `@vitejs/plugin-react`, `@tailwindcss/vite`; `package-lock.json` chỉ đổi cờ `dev`, không đổi phiên bản nào.
- `picomatch` 4.0.7 đã là bản mới nhất, không có cảnh báo.
- `minimatch` 10.2.6 và `glob` 11.1.0 (cảnh báo mức trung bình, chỉ lúc build qua `vite-plugin-pwa` → `workbox-build`): chưa có bản sửa tương thích. `workbox-build` 7.4.1 mới nhất vẫn đòi `glob@^11`, còn 11.1.0 và 10.2.6 là bản cuối của hai dòng đó. Không ép `overrides` sang major khác; chờ upstream, Dependabot theo dõi. `npm audit --omit=dev` vẫn 0.

### 6. Khóa ký đọc từ stdin hoặc tệp ngoài repo (mục 2)
- Module chung `scripts/lib/signing-key.mjs`, dùng cho cả `keygen.mjs` và `worker-secrets.mjs`. Nguồn khóa theo thứ tự:
  1. `--key-stdin`: đọc từ ống (VD: lệnh đọc của trình quản lý mật khẩu), hoặc dán khi được hỏi, chữ không hiện.
  2. `--key-file <đường dẫn>`, hoặc biến môi trường `STRIDE_ED25519_PRIVATE_KEY_FILE`.
  3. Biến môi trường `STRIDE_ED25519_PRIVATE_KEY` (giữ như cũ).
  4. `.env.local`: chỉ để chuyển tiếp, mỗi lần dùng đều in cảnh báo nhắc chuyển khóa ra ngoài.
- Tệp khóa phải nằm ngoài thư mục repo: script từ chối nếu đường dẫn (sau khi giải symlink) nằm trong repo. Tệp chứa một dòng base64, hoặc dòng `STRIDE_ED25519_PRIVATE_KEY=...` để chép nguyên dòng cũ.
- `keygen init` ghi khóa mới ra `--out <tệp ngoài repo>` (không ghi đè nếu thiếu `--force`, quyền 600 trên hệ Unix), không còn ghi vào `.env.local`.
- `worker-secrets` đọc khóa một lần, tự so với public key trong app ngay trong tiến trình, rồi chuyển cho `wrangler secret put` qua stdin. Không in giá trị khóa ở bất kỳ nhánh nào.
- Test `scripts/lib/signing-key.test.mjs` dùng khóa tạm và thư mục tạm, không đọc `.env.local` thật.

### 7. Tài liệu
Cập nhật `docs/06-security-privacy/02-secrets-and-key-management.md`, `docs/09-operations/02-payments-and-licensing-runbook.md`, `docs/07-engineering/03-ci-cd-and-environments.md`, `docs/README.md`, `cloudflare-worker/README.md`, ghi chú ở B03.

## Việc của founder
1. **Chuyển khóa ra khỏi repo** (máy founder, không qua chat): tạo tệp ngoài repo hoặc mục trong trình quản lý mật khẩu như hướng dẫn ở `02-secrets-and-key-management.md` mục 5; chạy `npm run keygen -- check --key-file <tệp>` thấy "Khớp"; rồi xóa dòng `STRIDE_ED25519_PRIVATE_KEY` khỏi `.env.local`.
2. **Sau khi nhánh này đã gộp `main` và `deploy` chạy xanh**, bật yêu cầu ghim SHA (bật sớm hơn thì workflow cũ trên `main` sẽ bị chặn). Trường API là `sha_pinning_required` (tài liệu REST "Set GitHub Actions permissions for a repository"; `enabled` là trường bắt buộc), hoặc tùy chọn tương ứng ở Settings → Actions → General:
   ```bash
   gh api -X PUT repos/NexusPulseTech/stride-tasks/actions/permissions -F enabled=true -f allowed_actions=all -F sha_pinning_required=true
   gh api repos/NexusPulseTech/stride-tasks/actions/permissions   # kiểm tra: sha_pinning_required true
   ```
3. **Ruleset cho `main`**: chặn xóa nhánh và chặn force push. Không bắt buộc PR, để các phiên vẫn đẩy thẳng `main` như hiện nay; thêm "required status checks" khi B03 có workflow `ci`.
   ```bash
   gh api -X POST repos/NexusPulseTech/stride-tasks/rulesets --input - <<'EOF'
   {"name":"protect-main","target":"branch","enforcement":"active",
    "conditions":{"ref_name":{"include":["~DEFAULT_BRANCH"],"exclude":[]}},
    "rules":[{"type":"deletion"},{"type":"non_fast_forward"}]}
   EOF
   ```
   Hiện trạng đọc qua API ngày 2026-11-19: `sha_pinning_required: false`, chưa có ruleset, `main` chưa được bảo vệ, quyền mặc định của `GITHUB_TOKEN` là `read`.

## Tiêu chí nghiệm thu
- [x] Mọi `uses:` trong `.github/workflows` trỏ SHA 40 ký tự kèm chú thích phiên bản.
- [x] Không còn `bun.lock` hay bước Bun; `tauriScript` khai báo rõ.
- [x] Workflow để `permissions: {}`, mỗi job khai báo quyền riêng.
- [x] `npm ci --legacy-peer-deps` sạch; lint, test app, test Worker, build và quét bí mật qua.
- [x] Test nguồn khóa (stdin, tệp ngoài repo, từ chối tệp trong repo, biến môi trường, `.env.local` kèm cảnh báo) qua với khóa tạm.
- [ ] `deploy.yml` chạy xanh sau khi gộp `main`.
- [ ] Desktop Release chạy thử bằng "Run workflow" (cùng D02).
- [ ] Founder: chuyển khóa ra ngoài repo, bật yêu cầu ghim SHA, tạo ruleset `main`.
