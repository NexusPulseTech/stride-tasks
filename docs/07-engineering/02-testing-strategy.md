# Chiến lược kiểm thử

> **Thuộc**: 07-engineering · **Trạng thái**: Accepted · **Cập nhật**: 2026-10-30
> **Hiện trạng**: repo **không có test tự động** nào. Các bộ test đã chạy ở v3.1.0 (hợp nhất sync 17, Worker 17, smoke production 14) nằm ngoài repo → task B01 đưa vào repo và CI.

## 1. Kim tự tháp

| Tầng | Công cụ | Đối tượng | Tỉ trọng |
| :--- | :--- | :--- | :---: |
| Unit | **Vitest** | Hàm thuần: parser nhập nhanh, rollup việc con, SM-2/hoãn thông minh, merge LWW + tombstone, mã hóa sync, xác minh token, policy hạn mức | ~70% |
| Component | Vitest + **Testing Library** + jsdom | Nhập nhanh, hoàn thành việc, paywall chặn đúng lúc, modal đồng bộ | ~15% |
| Integration (Worker) | **`@cloudflare/vitest-plugin`** (kế nhiệm `vitest-pool-workers`; chạy trong runtime Workers thật, D1/KV cục bộ) | Route sync/claim/webhook, CAS 409, hạn mức kho, fail-closed | ~10% |
| Contract | Schema từ `openapi.yaml` / gói `contracts` | Mọi phản hồi Worker khớp hợp đồng; client parse đúng | bắt buộc cho mỗi endpoint |
| E2E | **Playwright** | 5 hành trình quan trọng (mục 3) | ~5% |
| Smoke production | Script `prod-smoke` (đã có, 14 bước) | Sau mỗi deploy Worker | mỗi lần deploy |

## 2. Chuyển test hiện có vào repo (B01)

| Test cũ (ngoài repo) | Vị trí mới |
| :--- | :--- |
| `sync-merge.test.mjs` (17 ca: hợp nhất, mã hóa, TTL tombstone) | `src/features/sync/__tests__/syncMerge.test.ts`, `syncCrypto.test.ts`, `tombstones.test.ts` |
| `worker-sync.test.mjs` + adapter `node:sqlite` (43 kiểm tra) | `cloudflare-worker/test/vault.test.js`, `orders-claim.test.js`, `polar.test.js` (26 ca, `@cloudflare/vitest-plugin`) |
| `prod-smoke.test.mjs` (14 ca) | `cloudflare-worker/test/smoke/prod-smoke.ts`: chạy tay hoặc sau deploy, đọc token test từ secret CI, **không** commit khóa |

Tiến độ (2026-10-31, B01a): phần app đã vào repo (`syncMerge`, `syncCrypto`, `tombstones`, `claimPolling`, `licenseCrypto`), 35 ca, chạy bằng `npm test` và trong workflow deploy. B01b (2026-10-31): test Worker đã vào repo, 26 ca, chạy bằng `npm test` trong `cloudflare-worker/` và workflow `worker-tests.yml`. Chưa chuyển: smoke production.

## 3. Hành trình E2E bắt buộc

1. Lần đầu mở app → nhập một dòng có cú pháp → việc được tạo đúng → hoàn thành → streak tăng.
2. Sao lưu JSON → xóa dữ liệu → khôi phục → dữ liệu như cũ.
3. Hai trình duyệt (hai context) cùng mã đồng bộ → sửa khác nhau → cả hai hội tụ.
4. Free tạo dự án thứ 6 → thấy paywall; người dùng cũ (grandfathered) không bị chặn.
5. Kích hoạt bằng link `#activate=` → PRO; link `#sync=` biến mất khỏi thanh địa chỉ.

## 4. Quy tắc viết test

- Test **hành vi**, không test chi tiết cài đặt.
- Thời gian/ID/ngẫu nhiên đi qua `Clock`/`IdGenerator` để test xác định.
- Unit test không gọi mạng thật; Worker test dùng binding cục bộ.
- Mỗi lỗi sửa trong production đi kèm một test tái hiện (regression test).
- Trước khi refactor file lớn (B08): viết *characterization test* chốt hành vi hiện tại.
- Dữ liệu mẫu cho migration: giữ fixture JSON của từng định dạng lưu trữ cũ (`__fixtures__/storage-v4.json`…).

## 5. Ngưỡng coverage (tăng dần, không bao giờ giảm)

| Phạm vi | Bắt đầu | Mục tiêu |
| :--- | :---: | :---: |
| `features/*/domain`, `sync`, `licensing` | 80% | 95% |
| Worker | 80% | 90% |
| Toàn bộ client | 40% | 70% |
