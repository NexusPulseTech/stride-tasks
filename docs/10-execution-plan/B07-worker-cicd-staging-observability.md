# B07 — CI/CD Worker, staging, quan sát, rate limit

| Thuộc tính | Giá trị |
| :--- | :--- |
| Phase | B — Foundation |
| Ưu tiên | P1 |
| Ước lượng | 1,5 ngày |
| Phụ thuộc | B05 |
| Trạng thái | ☐ Todo |

## Mục tiêu
Deploy Worker tự động qua staging → duyệt → production, có smoke test; không còn phụ thuộc máy founder.

## Các bước
1. **Founder tạo** Cloudflare API token quyền tối thiểu (Workers Scripts Edit, D1 Edit, Workers KV Edit — chỉ account `54a0…`) → GitHub secret `CLOUDFLARE_API_TOKEN`; `CLOUDFLARE_ACCOUNT_ID` là variable.
2. `wrangler.toml`: `[env.staging]` với D1/KV staging riêng; **xin phép** tạo domain staging (VD `tasks-api-staging.nexuspulsetech.xyz`) hoặc dùng workers.dev cho staging.
3. Cấu hình được commit: tách phần không bí mật của `wrangler.toml` sang file mẫu có biến; ID thật đưa vào GitHub variables và sinh `wrangler.toml` trong CI.
4. `.github/workflows/worker.yml`: trigger khi đổi `cloudflare-worker/**`; test → `wrangler d1 migrations apply --env staging --remote` → deploy staging → smoke staging → environment `production` (duyệt thủ công) → migrate + deploy production → smoke production. Dùng `cloudflare/wrangler-action` ghim phiên bản.
5. Rate limiting binding (theo A04) cấu hình theo môi trường.
6. Kiểm tra cấu hình khi khởi động: production thiếu `LICENSE_PUBLIC_KEY` hoặc `SYNC_REQUIRE_LICENSE != "true"` → log lỗi + trả 503 cho sync.
7. Cloudflare Notifications: cảnh báo gần giới hạn gói.

## Tiêu chí nghiệm thu
- [ ] Một thay đổi nhỏ đi hết pipeline staging → production không thao tác tay ngoài nút duyệt.
- [ ] Rollback bằng `wrangler rollback` được ghi trong runbook và đã thử trên staging.
- [ ] Log có `request_id`, không chứa token/body.
