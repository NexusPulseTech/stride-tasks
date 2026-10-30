# Backend: dịch vụ trên Cloudflare Workers

> **Thuộc**: 04-architecture · **Trạng thái**: Reviewed (hiện tại) / Draft (mục tiêu) · **Cập nhật**: 2026-10-30
> **Liên quan**: hợp đồng API [../05-api-contracts/](../05-api-contracts/README.md), vận hành [../09-operations/01-deployment-runbook.md](../09-operations/01-deployment-runbook.md).

## 1. Hiện trạng (production từ 2026-10-30)

| Thành phần | Giá trị |
| :--- | :--- |
| Worker | `stride-license` — `cloudflare-worker/src/index.js` (374 dòng JavaScript, không kiểm tra kiểu) |
| Domain | `https://tasks-api.nexuspulsetech.xyz` (Custom Domain; `workers_dev = false`, `preview_urls = false`) |
| Bindings | KV `LICENSES`, D1 `stride-sync` (APAC) |
| Biến | `APP_URL`, `ALLOWED_ORIGINS`, `PRICE_VND`, `MAIL_FROM`, `LICENSE_PUBLIC_KEY`, `SYNC_MAX_VAULTS_PER_LICENSE=3`, `SYNC_REQUIRE_LICENSE=true` |
| Secret | **Chưa nạp** (cố ý, chờ bật thanh toán): `STRIDE_ED25519_PRIVATE_KEY`, `SEPAY_API_KEY`, `LEMONSQUEEZY_SIGNING_SECRET`, `RESEND_API_KEY` |
| Route | `POST /webhook/sepay`, `POST /webhook/lemonsqueezy`, `GET /claim`, `GET/PUT/DELETE /sync/v1/vaults/{id}`, `OPTIONS *` |
| Deploy | Thủ công bằng `wrangler@4.151.0` từ máy founder |

## 2. Dịch vụ mục tiêu

| Dịch vụ | Trách nhiệm | API | Dữ liệu sở hữu | Secret |
| :--- | :--- | :--- | :--- | :--- |
| **gateway** | Điểm vào duy nhất: CORS allowlist, rate limit, `x-request-id`, chuẩn hóa lỗi RFC 9457, định tuyến theo path | HTTP công khai | — | — |
| **licensing** | Ký token Ed25519, xác minh, **thu hồi**, claim | RPC nội bộ + `GET /v1/claims/{order}` | KV/D1 `licensing` (claims, revocations) | `STRIDE_ED25519_PRIVATE_KEY` |
| **billing** | Tạo đơn/checkout, nhận webhook SePay/Polar, sổ cái, phát `order.paid` / `order.refunded` | `POST /v1/orders`, `POST /webhooks/{provider}` | D1 `billing` (orders, payments, events) | `SEPAY_API_KEY`, `POLAR_WEBHOOK_SECRET`, `POLAR_ACCESS_TOKEN` |
| **sync** | Kho bản mã theo vaultId, CAS theo version, hạn mức kho/bản quyền | `GET/PUT/DELETE /sync/v1/vaults/{id}` | D1 `sync` (vaults) | — (chỉ public key) |
| **notifications** | Gửi email kích hoạt/khôi phục | Consumer sự kiện | — | `RESEND_API_KEY` (hoặc Cloudflare Email) |

### Giao tiếp

- **Bên ngoài → gateway**: HTTPS, hợp đồng OpenAPI 3.1.
- **gateway → dịch vụ**: **Service Bindings** (RPC qua `WorkerEntrypoint`) — gọi trong cùng hạ tầng Cloudflare, không đi qua Internet công cộng.
- **billing → licensing → notifications**: sự kiện bất đồng bộ qua **Cloudflare Queues** (`billing.order-paid.v1`, `billing.order-refunded.v1`); *kiểm tra điều kiện gói Free trước khi dùng*, nếu không có thì gọi RPC đồng bộ kèm idempotency key.

## 3. Cấu trúc bên trong mỗi dịch vụ (Hexagonal)

```
services/<name>/
├── src/
│   ├── domain/          # quy tắc nghiệp vụ thuần (VD: tính hạn mức kho, kiểm tra trạng thái đơn)
│   ├── application/     # use case + port (OrderRepository, TokenSigner, PaymentProvider, Clock)
│   ├── adapters/
│   │   ├── http/        # router, validate (zod), map lỗi → problem+json
│   │   ├── d1/ kv/      # repository hiện thực port
│   │   └── providers/   # polar.ts, sepay.ts (hiện thực PaymentProvider)
│   └── index.ts         # composition root: tạo adapter từ env, export fetch/RPC entrypoint
├── migrations/          # D1 migrations có đánh số (wrangler d1 migrations)
├── test/                # unit (domain) + integration (Miniflare / adapter node:sqlite)
└── wrangler.toml        # bindings riêng, [env.staging], [env.production]
```

`PaymentProvider` (port) — mở rộng cổng không sửa lõi (Open/Closed):

```ts
export interface PaymentProvider {
  readonly id: 'sepay' | 'polar' | 'paddle' | 'creem';
  createCheckout(order: Order): Promise<CheckoutSession>;      // SePay: trả dữ liệu VietQR
  verifyWebhook(req: Request): Promise<boolean>;               // chữ ký / API key, so sánh thời gian hằng
  parseEvent(req: Request): Promise<PaymentEvent | null>;      // chuẩn hóa về order.paid / order.refunded
}
```

## 4. Yêu cầu xuyên suốt (cross-cutting)

| Yêu cầu | Cách làm chuẩn |
| :--- | :--- |
| Kiểm tra đầu vào | `zod` schema dùng chung từ gói `contracts` |
| Lỗi | `application/problem+json` (RFC 9457) + `code` ổn định cho client — xem [../05-api-contracts/01-error-model.md](../05-api-contracts/01-error-model.md) |
| Rate limit | Workers Rate Limiting binding theo IP + route (claim, webhook, sync PUT) |
| Log | JSON một dòng: `ts, service, route, status, duration_ms, request_id`; bật `[observability] enabled = true` |
| Cấu hình | Biến trong `wrangler.toml` theo môi trường; secret bằng `wrangler secret put`; **không** để secret trong repo |
| Môi trường | `staging` (domain `tasks-api-staging…`, D1/KV riêng) và `production` |
| Idempotency | Khóa theo `provider:event_id` lưu trong `billing.events` |
| Thời gian | Trả `serverTime` (đã có) để client phát hiện lệch đồng hồ |

## 5. Lộ trình di chuyển (Strangler Fig, không downtime)

| Bước | Việc | Task |
| :---: | :--- | :--- |
| 1 | Chuyển `index.js` → TypeScript, tách module theo context **trong cùng một Worker**, giữ nguyên route & hành vi; thêm test | B05 |
| 2 | Gói `contracts` (zod + OpenAPI) dùng chung client/Worker; contract test trong CI | B06 |
| 3 | CI/CD Worker + staging + rate limit + log | B07 |
| 4 | Tách **billing + licensing** ra Worker riêng (cô lập khóa ký & secret thanh toán), gateway định tuyến qua Service Binding | D01 |
| 5 | Tách **sync** khi lưu lượng/giới hạn D1 đòi hỏi; cân nhắc Durable Objects cho đồng bộ thời gian thực | D01+ |

Mỗi bước: route công khai **không đổi**; smoke test production (`prod-smoke`) phải xanh trước và sau.
