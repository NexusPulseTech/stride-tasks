# B05 — Worker TypeScript + kiến trúc lục giác + timeout phía client

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | B — Foundation |
| Ưu tiên | P1 |
| Ước lượng | 3 ngày |
| Phụ thuộc | B01, A04 |
| Trạng thái | ☐ Todo |

## Mục tiêu
Worker chuyển sang TypeScript, tách module theo context (sync, licensing, billing) với port/adapter, **route và hành vi không đổi**; lỗi theo RFC 9457 (giữ trường `error`).

## Các bước
1. Cấu trúc `cloudflare-worker/src/` theo [../04-architecture/04-backend-services-cloudflare.md](../04-architecture/04-backend-services-cloudflare.md) mục 3: `domain/`, `application/`, `adapters/{http,d1,kv,providers,crypto}`, `index.ts`.
2. Port: `VaultRepository`, `OrderRepository`, `ClaimRepository`, `RevocationList`, `TokenSigner`, `TokenVerifier`, `PaymentProvider` (SePay, Polar, LemonSqueezy cũ), `Clock`.
3. Validate input bằng `zod`; lỗi `application/problem+json` với `code` + `error` (tương thích client cũ) + `requestId`.
4. `x-request-id` + log JSON một dòng; `[observability] enabled = true`.
5. Migration D1 chuyển sang `migrations/0001_init.sql` (giữ nguyên schema hiện tại).
6. Client: `AbortSignal.timeout(15000)` cho mọi `fetch` trong `syncClient.ts` và claim; xử lý `rate_limited` theo `Retry-After`.
7. Chạy toàn bộ test B01 + smoke test production trước/sau deploy.

## Tiêu chí nghiệm thu
- [ ] `tsc` strict cho Worker xanh; coverage Worker ≥ 80%.
- [ ] Smoke test production 14/14 trước và sau deploy.
- [ ] Không file > 300 dòng trong Worker.
- [ ] `openapi.yaml` + [../05-api-contracts/01-error-model.md](../05-api-contracts/01-error-model.md) cập nhật.
