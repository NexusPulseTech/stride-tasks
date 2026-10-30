# Cấu trúc repository mục tiêu (monorepo)

> **Thuộc**: 04-architecture · **Trạng thái**: Draft v1, *thực hiện ở task D01, từng bước nhỏ* · **Cập nhật**: 2026-10-30
> **Ràng buộc giữ nguyên**: `npm` + `--legacy-peer-deps`; alias `@` trỏ tới thư mục `src` của web app; Tauri identifier `com.phucnguyen.stridetasks`; mọi khóa localStorage.

## 1. Bố cục mục tiêu

```
stride-tasks/
├── apps/
│   ├── web/                  # PWA (Vite + React), hiện là gốc repo
│   └── desktop/              # cấu hình Tauri (src-tauri/) dùng dist của apps/web
├── site/                     # trang marketing tĩnh (Astro), task C01
├── services/
│   ├── gateway/              # Worker điểm vào
│   ├── licensing/            # ký/thu hồi token
│   ├── billing/              # đơn hàng & webhook thanh toán
│   ├── sync/                 # kho bản mã
│   └── notifications/        # email
├── packages/
│   ├── contracts/            # zod schema + kiểu + OpenAPI sinh ra, nguồn sự thật hợp đồng
│   ├── sync-core/            # merge LWW, tombstone, snapshot (thuần TS, chạy cả client & test)
│   ├── crypto/               # mã hóa kho đồng bộ, xác minh token Ed25519 (WebCrypto + fallback)
│   ├── design-tokens/        # token thiết kế dùng chung app & site
│   └── config/               # preset tsconfig, ESLint, Prettier
├── docs/
└── package.json              # npm workspaces
```

## 2. Quy tắc giữa các package

- `packages/*` **không** phụ thuộc `apps/*` hay `services/*`.
- `services/*` không import lẫn nhau, chỉ qua `packages/contracts` (kiểu RPC/sự kiện) và Service Binding lúc chạy.
- Mỗi package có `package.json` riêng, `exports` rõ ràng, test riêng, ngưỡng coverage riêng.
- Phụ thuộc nội bộ khai báo `"*"` (npm workspaces tự liên kết; giao thức `workspace:` chỉ có ở pnpm/Yarn); không publish lên npm.

## 3. Lộ trình di chuyển (không "big bang")

| Bước | Thay đổi | Rủi ro | Task |
| :---: | :--- | :--- | :--- |
| 0 | Giữ app ở gốc; thêm `"workspaces": ["packages/*", "cloudflare-worker"]` vào `package.json` gốc | Thấp | B06 |
| 1 | Tạo `packages/contracts`, `packages/sync-core` (chuyển `syncMerge.ts`, `tombstones.ts`, `syncCrypto.ts`); app import qua tên gói | Thấp, có test bao | B06 |
| 2 | Đổi tên `cloudflare-worker/` → `services/api/` (TypeScript, module theo context) | Thấp | B05/B07 |
| 3 | Chuyển app vào `apps/web/` (giữ alias `@` → `apps/web/src`), `src-tauri/` → `apps/desktop/` | Trung bình, cập nhật CI, Tauri `frontendDist`, Vite config | D01 |
| 4 | Tách `services/api` thành `gateway`, `licensing`, `billing`, `sync` | Trung bình | D01 |
| 5 | Thêm công cụ điều phối build (Turborepo/Nx) **chỉ khi** thời gian CI > 10 phút | - | - |

## 4. Điều kiện hoàn thành mỗi bước

- `npm install --legacy-peer-deps`, `npm run lint`, `npm test`, `npm run build` xanh ở gốc.
- Workflow deploy web & Worker xanh; smoke test production 14/14.
- Không đổi URL công khai, không đổi origin của app, không mất dữ liệu người dùng.
