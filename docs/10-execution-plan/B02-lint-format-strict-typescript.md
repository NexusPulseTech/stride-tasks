# B02 — ESLint, Prettier, TypeScript strict, dọn phụ thuộc

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | B — Foundation |
| Ưu tiên | P1 |
| Ước lượng | 2–3 ngày |
| Phụ thuộc | B01 (cần test để sửa lỗi kiểu an toàn) |
| Trạng thái | ☐ Todo |

## Mục tiêu
Code được máy kiểm tra theo chuẩn: `strict` bật, ESLint với quy tắc ranh giới, định dạng thống nhất.

## Các bước
1. Đo trước: `npx tsc --noEmit --strict 2>&1 | grep -c "error TS"` → ghi số lỗi vào PR.
2. `tsconfig.json`: sửa `paths` `@/*` → `./src/*`; bỏ `experimentalDecorators`, `useDefineForClassFields`; bật `strict` + các cờ trong [../07-engineering/01-coding-standards.md](../07-engineering/01-coding-standards.md). Nếu > 200 lỗi: bật theo thư mục (sync, licensing trước) bằng `tsconfig` con, không dùng `any` để lấp.
3. ESLint flat config: `typescript-eslint` (strict-type-checked), `react-hooks`, `jsx-a11y`, ranh giới import theo [../04-architecture/03-frontend-architecture.md](../04-architecture/03-frontend-architecture.md) mục 3 (ban đầu mức `warn` cho code cũ, `error` cho code mới).
4. Prettier + `.editorconfig`; chạy định dạng toàn repo trong **một commit riêng** (`style: format`).
5. `lint-staged` + `simple-git-hooks` cho pre-commit.
6. Scripts: `typecheck` (tsc), `lint` (eslint), `format`; cập nhật `deploy.yml` bước "Type check" → `npm run typecheck`.
7. Chuyển `vite`, `@vitejs/plugin-react`, `@tailwindcss/vite` sang `devDependencies`; xóa `bun.lock`; thêm `.nvmrc` + `engines`.

## Tiêu chí nghiệm thu
- [ ] `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` xanh.
- [ ] Không còn `any` mới; số `@ts-expect-error` ghi lý do.
- [ ] Bundle production không đổi hành vi (smoke test thủ công 5 hành trình).

## Rủi ro & rollback
Bật strict có thể lộ lỗi runtime tiềm ẩn → sửa kèm test; chia nhiều PR theo thư mục.
