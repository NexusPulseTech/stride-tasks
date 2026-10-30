# D01: Tách dịch vụ + monorepo

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | D: Scale |
| Ưu tiên | P2 (chỉ khi đạt điều kiện tách, ADR-0005) |
| Ước lượng | 1-2 tuần, nhiều PR |
| Phụ thuộc | B06, B07 |
| Trạng thái | ☐ Todo |

## Mục tiêu
Cấu trúc repo và dịch vụ như [../04-architecture/06-target-repository-structure.md](../04-architecture/06-target-repository-structure.md) và [../04-architecture/04-backend-services-cloudflare.md](../04-architecture/04-backend-services-cloudflare.md), không downtime, không đổi URL công khai.

## Các bước (Strangler Fig)
1. Viết ADR mới: điều kiện tách nào đã thỏa (ưu tiên: cô lập khóa ký + secret thanh toán).
2. Chuyển app vào `apps/web/` (alias `@` → `apps/web/src`), `src-tauri/` → `apps/desktop/`; cập nhật Vite, Tauri `frontendDist`, CI. Giữ `com.phucnguyen.stridetasks`.
3. Tách `services/billing` + `services/licensing` (khóa ký chỉ ở licensing); `services/gateway` định tuyến qua **Service Binding** RPC.
4. D1 riêng cho billing/licensing; di chuyển bản ghi KV `order:*` (script idempotent, chạy staging trước).
5. Sự kiện `billing.order-paid.v1` qua Queue (kiểm tra điều kiện gói) hoặc RPC + idempotency key.
6. Tách `services/sync` sau cùng.
7. Contract test + smoke test ở mọi bước; nhật ký deploy.

## Tiêu chí nghiệm thu
- [ ] Route công khai giữ nguyên; smoke test 14/14 (+ ca mới) xanh.
- [ ] Worker sync không còn binding/secret thanh toán hay khóa riêng.
- [ ] Mỗi dịch vụ có test, `wrangler.toml` riêng, pipeline riêng.
