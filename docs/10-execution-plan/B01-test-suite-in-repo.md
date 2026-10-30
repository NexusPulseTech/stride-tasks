# B01: Bộ test trong repo

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | B: Foundation |
| Ưu tiên | P1 |
| Ước lượng | 2 ngày |
| Phụ thuộc | - |
| Trạng thái | ◐ Đang làm (B01a xong) |

## Mục tiêu
`npm test` chạy unit + Worker integration test; các bộ test đã có (sync 17, Worker 17) nằm trong repo; khung Playwright cho E2E.

## Vì sao
Repo không có test tự động; test v3.1.0 nằm ngoài repo → không bảo vệ được thay đổi sau.

## Các bước
1. devDependencies: `vitest`, `@vitest/coverage-v8`, `@testing-library/react`, `@testing-library/user-event`, `jsdom` (ghim phiên bản).
2. `vitest.config.ts` dùng lại alias `@` → `./src`; môi trường `jsdom` cho component, `node` cho domain.
3. Chuyển test sync sang `src/features/sync/__tests__/` (`syncMerge`, `syncCrypto`, `tombstones`: gồm ca TTL 90 ngày).
4. Characterization test cho: parser nhập nhanh (`~45m @daily !pin`), rollup việc con (`subtaskTree.ts`), SM-2/hoãn thông minh (`spacedSnooze.ts`), policy hạn mức Free (`FREE_PROJECT_LIMIT`, dự án mẫu, grandfathering), xác minh token (`licenseCrypto.ts`, dùng cặp khóa **test** sinh trong test, không dùng khóa thật).
5. Worker: `@cloudflare/vitest-pool-workers` với cấu hình test riêng (`cloudflare-worker/wrangler.test.toml`, binding cục bộ, không ID thật); chuyển 17 ca vault.
6. Smoke test production → `cloudflare-worker/test/smoke/` chạy thủ công với token test đọc từ biến môi trường.
7. Playwright: cài, 1 test hành trình #1 (mở app → nhập nhanh → hoàn thành).
8. Script: `test`, `test:watch`, `test:coverage`, `test:e2e`.

## Tiến độ
- **B01a (2026-10-31)**: Vitest 4.1.12 và `@vitest/coverage-v8` (ghim chính xác; `@cloudflare/vitest-pool-workers` 0.23.0 yêu cầu `vitest ^4.1.0`). `vitest.config.ts` riêng, alias `@` như app. 35 ca: hợp nhất đồng bộ, mã hóa, tombstone, claim polling, xác minh token bằng cặp khóa test (thêm tham số khóa tùy chọn cho `verifyLicenseToken`, mặc định vẫn là khóa nhúng). Coverage dòng: `syncMerge` 95%, `syncCrypto` 97,6%, `licenseCrypto` 87%. `npm test` chạy trong workflow deploy.
- **Còn lại**: B01b test Worker bằng `vitest-pool-workers` (vault, orders, claim, webhook Polar, thu hồi); B01c jsdom + Testing Library, characterization test (parser, `subtaskTree`, `spacedSnooze`, hạn mức Free), `tombstones` phần localStorage, `syncClient`; B01d Playwright và smoke production.

## Tiêu chí nghiệm thu
- [ ] `npm test` xanh, ≥ 50 ca; coverage domain sync/licensing ≥ 80%.
- [ ] Không file test nào đọc `.env.local`.
- [ ] Hướng dẫn chạy test trong [../07-engineering/getting-started.md](../07-engineering/getting-started.md).

## Tham chiếu
- [../07-engineering/02-testing-strategy.md](../07-engineering/02-testing-strategy.md)
