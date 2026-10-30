# Nguyên lý kiến trúc: Bounded Context · SOLID · Microservices

> **Thuộc**: 04-architecture · **Trạng thái**: Accepted (chuẩn bắt buộc khi code) · **Cập nhật**: 2026-10-30
> **Áp dụng cho**: mọi PR thay đổi `src/`, `cloudflare-worker/` (sau này `apps/`, `services/`, `packages/`).

## 1. Triết lý: "ranh giới của microservices, chi phí của monolith"

Các công ty lớn không bắt đầu bằng hàng chục dịch vụ: Shopify vận hành *modular monolith* ở quy mô rất lớn; Martin Fowler khuyến nghị **Monolith First**: hiểu rõ ranh giới trước, tách sau. Với một sản phẩm một người phát triển, tách dịch vụ sớm tạo ra *distributed monolith* (mọi thứ phải deploy cùng nhau nhưng lại gọi nhau qua mạng), đúng loại "bánh xe hỏng" cần tránh.

Do đó Stride áp dụng:

1. **Thiết kế như microservices**: mỗi bounded context có API công khai, dữ liệu riêng, không ai chạm vào nội bộ của ai.
2. **Triển khai theo nhu cầu**: các context chạy chung một bundle/Worker cho tới khi một **điều kiện tách** (mục 6) xuất hiện; khi tách chỉ cần đổi *adapter*, không viết lại *domain*.

## 2. Bounded contexts của Stride

| Context | Trách nhiệm | Chạy ở | Dữ liệu sở hữu |
| :--- | :--- | :--- | :--- |
| **Task Management** (core domain) | Dự án, việc, việc con, trạng thái, parser nhập nhanh, rollup | Client | `SOLO_CORE_TASKS_V4`, `STRIDE_CUSTOM_STATUSES_V1` |
| **Focus** | Pomodoro, nhật ký Deep Work | Client | `STRIDE_FOCUS_*` |
| **Review** | Lịch SM-2, hàng đợi Daily Focus, hoãn thông minh | Client | thuộc tính SRS trong task |
| **Insights** | Activity log, heatmap, streak, báo cáo Markdown | Client | `SOLO_CHECKLIST_ACTIVITY_LOG_V1`, `SOLO_COMPLETED_LOGS_*`, `SOLO_CORE_STREAK_V4` |
| **Sync** | Snapshot, hợp nhất LWW, tombstone, mã hóa, vận chuyển | Client + server | `STRIDE_SYNC_*` (client), bảng `vaults` (server) |
| **Entitlements & Licensing** | Xác minh token, dùng thử, hạn mức Free; ký/thu hồi token (server) | Client + server | `STRIDE_PRO_*` (client), KV `LICENSES` (server) |
| **Billing** | Đơn hàng, cổng thanh toán, webhook, sổ cái | Server | KV/D1 billing |
| **Notifications** | Email kích hoạt, nhắc việc | Client + server | - |
| **Platform/Shell** | i18n, theme, lưu trữ, PWA, Tauri, design system | Client | `task_manager_theme_mode`, `stride_tasks_*` |

**Context map**: Task Management là *upstream* của Focus/Review/Insights (họ đọc qua API công khai của tasks). Entitlements là *policy* mà các context khác hỏi (`can('createProject')`), không ai tự đọc token. Billing phát sự kiện `order.paid` → Licensing phát hành token (quan hệ *publisher/subscriber*).

## 3. SOLID áp vào code thật của Stride

| Nguyên lý | Vi phạm hiện tại (bằng chứng) | Cách làm đúng |
| :--- | :--- | :--- |
| **S**: Single Responsibility | `useTaskManager.ts` (1.002 dòng) gộp CRUD, lưu trữ, snapshot đồng bộ, undo, trạng thái UI; `App.tsx` (869 dòng) vừa là composition root vừa xử lý logic | Mỗi hook/module một lý do thay đổi: `useTaskStore` (state), `taskCommands` (use case), `syncSnapshotAdapter`, `undoBuffer`; `App.tsx` chỉ ráp nối |
| **O**: Open/Closed | Thêm cổng thanh toán phải sửa thẳng `index.js` Worker và `commerceConfig.ts` | Interface `PaymentProvider` (`createCheckout`, `verifyWebhook`, `parseEvent`); thêm Polar = thêm một adapter, không sửa lõi. Parser nhập nhanh dùng **registry** token (`~`, `@`, `!`) |
| **L**: Liskov Substitution | Lưu trữ gọi trực tiếp `localStorage` rải rác | Port `KeyValueStore` với `LocalStorageStore`, `IndexedDbStore`, `MemoryStore`: **cùng hợp đồng**, test chạy trên `MemoryStore` cho kết quả như thật |
| **I**: Interface Segregation | Component nhận rất nhiều props từ `useTaskManager` (một "God object") | Tách interface theo vai trò: `TaskQueries`, `TaskCommands`, `SelectionState`; component chỉ nhận thứ nó dùng |
| **D**: Dependency Inversion | Logic miền gọi `Date.now()`, `crypto.randomUUID()`, `fetch` trực tiếp | Domain phụ thuộc abstraction `Clock`, `IdGenerator`, `HttpClient`, `CryptoPort`; adapter thật được *inject* ở composition root → test xác định (deterministic) |

## 4. Quy tắc phụ thuộc (Clean / Hexagonal Architecture)

```
ui (React)  ──►  application (use cases, ports)  ──►  domain (thuần TypeScript)
     ▲                       ▲
infrastructure (adapters: storage, http, crypto)  ── implements ports
```

- `domain/` **không** import React, DOM, `localStorage`, `fetch`, thư viện UI.
- `application/` định nghĩa *port* (interface) và use case; không biết adapter cụ thể.
- `infrastructure/` hiện thực port; chỉ composition root (`app/`) chọn adapter.
- Module khác chỉ được import qua `features/<context>/index.ts` (public API), cấm import sâu `features/tasks/hooks/...` từ context khác.
- Ràng buộc được kiểm tra tự động bằng ESLint (`eslint-plugin-boundaries` hoặc `import/no-restricted-paths`) trong CI, task `B02`.

## 5. Luật microservices (áp dụng ngay cả khi chưa tách)

1. **Database-per-service**: mỗi context sở hữu khóa lưu trữ/bảng của mình; context khác đọc qua API, không đọc thẳng.
2. **Contract-first**: API công khai mô tả trong `05-api-contracts/openapi.yaml` trước khi code; RPC nội bộ có interface TypeScript trong gói `contracts`; sự kiện có schema & phiên bản (`order.paid.v1`).
3. **Tương thích ngược**: thay đổi theo kiểu *expand → migrate → contract*; không xóa trường đang có client dùng.
4. **Idempotency**: mọi webhook/consumer xử lý trùng lặp an toàn (khóa theo event id/order id), Worker hiện đã làm với SePay/LemonSqueezy.
5. **Thất bại an toàn**: thiếu cấu hình/secret → từ chối (fail-closed), như webhook hiện tại.
6. **Quan sát được**: mỗi request có `x-request-id`; log JSON có `service`, `route`, `status`, `duration_ms`.
7. **Bảo mật theo đặc quyền tối thiểu**: chỉ dịch vụ cần khóa mới được binding/secret đó.

## 6. Điều kiện tách một context thành dịch vụ triển khai riêng

Tách khi **ít nhất một** điều kiện đúng (ghi ADR khi tách):

| Điều kiện | Ví dụ ở Stride |
| :--- | :--- |
| Ranh giới bảo mật khác nhau | Khóa ký Ed25519 + secret thanh toán không nên nằm chung Worker với API đồng bộ công khai → **lý do mạnh nhất, nên tách billing/licensing đầu tiên** |
| Nhịp deploy khác nhau, lỗi lan truyền | Sửa sync hằng tuần không được làm hỏng webhook thanh toán |
| Nhu cầu tài nguyên/giới hạn khác | Sync tốn D1 nhiều hơn hẳn webhook |
| Có người/nhóm sở hữu riêng | Khi có thêm kỹ sư |

## 7. Anti-pattern bị cấm

- *God hook/God component* > 300 dòng (xem [../07-engineering/file-size-and-modularity.md](../07-engineering/file-size-and-modularity.md)).
- Thư mục `utils/` chứa logic nghiệp vụ không thuộc context nào.
- Chuỗi khóa localStorage viết tay rải rác, mọi khóa khai báo một lần trong module sở hữu.
- Dịch vụ dùng chung database / đọc KV của dịch vụ khác.
- Gọi đồng bộ chuỗi dài giữa dịch vụ (A→B→C→D) cho một request người dùng.
- Tự viết lại thứ đã có chuẩn: crypto (dùng WebCrypto), validate (dùng `zod`), SSG (dùng Astro), lint (ESLint), "không tạo bánh xe hỏng".

## Nguồn

- Martin Fowler, MonolithFirst: <https://martinfowler.com/bliki/MonolithFirst.html>
- Shopify Engineering, Deconstructing the Monolith: <https://shopify.engineering/deconstructing-monolith-designing-software-maximizes-developer-productivity>
- Alistair Cockburn, Hexagonal Architecture: <https://alistair.cockburn.us/hexagonal-architecture/>
- C4 model: <https://c4model.com/>
