# Chuẩn viết code

> **Thuộc**: 07-engineering · **Trạng thái**: Accepted · **Cập nhật**: 2026-10-30
> **Áp dụng**: TypeScript/React ở client, TypeScript ở Worker (sau B05). Quy tắc được **máy kiểm tra** (ESLint, tsc, CI) — không dựa vào trí nhớ.

## 1. TypeScript

Hiện trạng `tsconfig.json`: **không** bật `strict`; còn `experimentalDecorators`, `useDefineForClassFields: false`, `allowJs`; `paths` `@/*` → `./*` **lệch** với alias Vite `@` → `./src` (hiện chưa file nào dùng `@/` nên chưa lỗi).

Mục tiêu (task B02, bật dần theo từng thư mục nếu số lỗi lớn):

```jsonc
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "verbatimModuleSyntax": true,
    "paths": { "@/*": ["./src/*"] }      // khớp alias Vite
  }
}
```

- Cấm `any` (dùng `unknown` + thu hẹp kiểu); cấm `@ts-ignore` (chỉ `@ts-expect-error` kèm lý do).
- Dữ liệu từ bên ngoài (localStorage, JSON nhập, response API, webhook) **phải** đi qua schema (`zod`) trước khi dùng.
- Kiểu hợp đồng API lấy từ gói `contracts` (B06), không khai báo lại.

## 2. Công cụ (chuẩn ngành, không tự chế)

| Công cụ | Cấu hình |
| :--- | :--- |
| ESLint (flat config) | `typescript-eslint` (strict-type-checked), `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`, quy tắc ranh giới import (`eslint-plugin-boundaries` hoặc `import/no-restricted-paths`) |
| Prettier | Định dạng duy nhất; không tranh luận style trong review |
| EditorConfig | UTF-8, LF, 2 dấu cách |
| Git hook | `lint-staged` chạy ESLint/Prettier trên file đã stage |

Script chuẩn: `npm run typecheck` (tsc), `npm run lint` (ESLint), `npm run format`, `npm test`. *(Hiện `lint` đang là `tsc --noEmit`; khi đổi phải cập nhật bước "Type check" trong `deploy.yml`.)*

## 3. Đặt tên & tổ chức

| Loại | Quy ước | Ví dụ |
| :--- | :--- | :--- |
| Component | `PascalCase.tsx`, một component chính/file | `TaskItem.tsx` |
| Hook | `useCamelCase.ts` | `useFocusTimer.ts` |
| Module thuần | `camelCase.ts` | `subtaskTree.ts` |
| Hằng số | `UPPER_SNAKE_CASE` | `FREE_PROJECT_LIMIT` |
| Kiểu/interface | `PascalCase`, không tiền tố `I` | `SyncSnapshot` |
| Boolean | `is/has/can/should…` | `isPro`, `canAutoClaim` |
| Handler | prop `onX`, hàm nội bộ `handleX` | `onComplete`, `handleDrop` |
| Khóa lưu trữ | `STRIDE_<CONTEXT>_<NAME>_V<n>` (khóa cũ giữ nguyên) | `STRIDE_SYNC_CONFIG_V1` |

- Ưu tiên **named export** (an toàn khi refactor); `React.lazy` dùng `import('./X').then(m => ({ default: m.X }))` nếu cần.
- Tối đa **300 dòng**/file ([file-size-and-modularity.md](./file-size-and-modularity.md)); hàm > 50 dòng là tín hiệu cần tách.
- Cấu trúc thư mục theo [../04-architecture/03-frontend-architecture.md](../04-architecture/03-frontend-architecture.md).

## 4. Xử lý lỗi

- Lỗi **dự kiến** (mạng, xung đột, dữ liệu sai) → giá trị trả về có kiểu (`Result`/mã lỗi union như `SyncErrorCode`), hiển thị thông báo i18n.
- Lỗi **lập trình** → `throw`, để Error Boundary bắt.
- Không nuốt lỗi im lặng; `catch {}` chỉ chấp nhận khi có chú thích lý do (VD hết quota cho dữ liệu phụ trợ — như `tombstones.ts`).
- Mọi `fetch` có timeout (`AbortSignal.timeout`) và xử lý offline.

## 5. React

- Function component + hooks; tuân thủ rules-of-hooks (lint bắt buộc).
- Effect phải dọn dẹp (interval, listener, `AbortController`).
- Không lưu state suy ra được; dùng `useMemo` chỉ khi đo thấy cần.
- Key ổn định (id), không dùng index cho danh sách thay đổi thứ tự.
- Modal/menu nổi dùng `PortalMenu`/portal chuẩn ([../08-design-system/portal-layering.md](../08-design-system/portal-layering.md)).
- Mọi chuỗi hiển thị qua i18n; không ghép chuỗi bằng tay — dùng `formatMessage`.

## 6. Bảo mật trong code

- Không `dangerouslySetInnerHTML` với dữ liệu người dùng (nếu bắt buộc: sanitize).
- Không `eval`/`new Function`.
- Không log token, mã đồng bộ, nội dung công việc.
- So sánh bí mật bằng hàm thời gian hằng (Worker đã có `timingSafeEqual`).

## 7. Phụ thuộc

- Thêm thư viện mới cần nêu trong PR: lý do, kích thước gzip, tình trạng bảo trì, giấy phép.
- Ưu tiên nền tảng có sẵn (WebCrypto, `Intl`, `structuredClone`) trước thư viện.
- `vite`, `@vitejs/plugin-react`, `@tailwindcss/vite` đang nằm ở `dependencies` → chuyển sang `devDependencies` (chỉ dùng lúc build).
- Một trình quản lý gói duy nhất: **npm** (`package-lock.json`); xóa `bun.lock` khỏi repo để tránh lệch lockfile.
- Cài trong CI bằng `npm ci --legacy-peer-deps` (tái lập chính xác lockfile).

## 8. Comment & ngôn ngữ

- Comment giải thích **vì sao**, không lặp lại code làm gì; giữ mật độ comment như code xung quanh (code hiện dùng tiếng Việt — giữ nhất quán).
- Tên biến/hàm bằng tiếng Anh.
