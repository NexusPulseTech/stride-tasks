# Báo cáo khớp Frontend ↔ Backend

> **Thuộc**: 05-api-contracts · **Trạng thái**: Reviewed · **Cập nhật**: 2026-10-30
> **Phạm vi**: client `src/features/sync/syncClient.ts`, `src/hooks/useProLicense.ts`, `src/config/commerceConfig.ts` ↔ Worker `cloudflare-worker/src/index.js` (production `tasks-api.nexuspulsetech.xyz`).
> **Bằng chứng chạy thật**: test hợp nhất 17/17, test Worker (D1 giả lập bằng `node:sqlite`) 17/17, smoke test production 14/14 (mã hóa thật → PUT → GET → giải mã → DELETE; CORS; webhook fail-closed).

## 1. Kết luận

| Câu hỏi | Trả lời |
| :--- | :--- |
| Hành vi có khớp không? | **Có.** Mọi mã trạng thái Worker trả về đều được client xử lý đúng ý nghĩa (bảng mục 2). |
| Nền móng có vững không? | **Chưa.** Hợp đồng chỉ tồn tại *ngầm* trong hai codebase; không có kiểu dùng chung, không có test hợp đồng trong CI, Worker là JS không kiểm tra kiểu, deploy Worker thủ công. Bất kỳ ai sửa một bên đều có thể làm vỡ bên kia mà không biết. |

## 2. Ma trận khớp từng endpoint

| Endpoint | Worker trả | Client xử lý | Khớp |
| :--- | :--- | :--- | :---: |
| `GET /sync/v1/vaults/{id}` | 200 `{version, iv, ciphertext, updatedAt, serverTime}` | Giải mã, đo lệch giờ từ `serverTime` (fallback header `Date`) | ✅ |
| | 404 `{error:not_found, serverTime}` | `vault = null`; chế độ *join* → `vault_not_found` | ✅ |
| | 401 / 402 | `license_required` | ✅ |
| `PUT /sync/v1/vaults/{id}` | 200 `{version, serverTime}` | Lưu version mới | ✅ |
| | 409 `conflict` | Kéo lại → hợp nhất → ghi lại (giới hạn số lượt) | ✅ |
| | 403 `vault_limit` · 413 `too_large` | Mã lỗi riêng → thông báo i18n | ✅ |
| | 400 `invalid_*` | `server_error` | ✅ (lỗi lập trình) |
| `DELETE /sync/v1/vaults/{id}` | 204 | Xóa bản sao đám mây | ✅ |
| `GET /claim?order=` | 200 `pending` / `ready + token` · 400 `invalid` | Poll mỗi **6 giây** khi tab hiển thị, tối đa **72 giờ**; `ready` → kích hoạt | ✅ hành vi / ⚠️ tải (mục 3) |
| Mã đơn | `ORDER_EXACT = /^STR[A-HJ-NP-Z2-9]{6}$/` | `ORDER_CODE_PATTERN` cùng regex | ✅ (nhưng **khai báo trùng ở 2 nơi**) |
| LemonSqueezy custom data | đọc `meta.custom_data.stride_ref` | gửi `checkout[custom][stride_ref]` | ✅ (kênh sắp thay — ADR-0006) |
| CORS | cho phép `GET, PUT, DELETE` + `Authorization, Content-Type` cho origin trong `ALLOWED_ORIGINS` | gửi đúng header | ✅ (smoke test) |

## 3. Khoảng trống (xếp theo mức độ)

| # | Mức | Khoảng trống | Hậu quả | Sửa ở |
| :---: | :---: | :--- | :--- | :--- |
| 1 | 🔴 | `/claim` trả token cho **bất kỳ ai biết mã đơn** (≈ 2³⁰ khả năng), không rate limit | Có thể dò & lấy token của người khác khi lượng đơn tăng | A04 |
| 2 | 🔴 | Claim poll 6 giây × tối đa 72 giờ: một tab mở liên tục ≈ **14.400 request/ngày** | ~7 tab treo là cạn **100k request/ngày** của gói Free → toàn bộ API (kể cả sync) ngừng | A04 (backoff: 6s trong 10 phút → 60s → dừng sau 30 phút + nút "Kiểm tra lại") |
| 3 | 🔴 | Không xử lý **hoàn tiền**: không có webhook refund, không danh sách thu hồi | Hoàn tiền xong vẫn dùng sync miễn phí | A04 |
| 4 | 🟠 | Không có kiểu/schema dùng chung; regex mã đơn, tên mã lỗi, giới hạn 1,9 MB khai báo **hai lần** | Lệch hợp đồng khi sửa một bên | B06 |
| 5 | 🟠 | Worker JavaScript không type-check, không có test trong repo/CI (test đang nằm ngoài repo) | Lỗi lọt production | B01, B05 |
| 6 | 🟠 | `fetch` phía client không có timeout (`AbortSignal.timeout`) | Mạng chập chờn → trạng thái "đang đồng bộ" treo | B05 (client) |
| 7 | 🟡 | 3 hình dạng lỗi khác nhau (sync / webhook / claim) | Client phải xử lý đặc thù | B06 (RFC 9457) |
| 8 | 🟡 | Không có `x-request-id`, không log có cấu trúc | Khó điều tra khi khách báo lỗi | B07 |
| 9 | 🟡 | Không có môi trường staging; deploy Worker thủ công | Thử nghiệm trên production | B07 |
| 10 | 🟡 | `pricePaidUsd: 7.95` cố định trong webhook SePay, không đọc từ cấu hình giá | Lệch khi đổi giá VN | A04 |

## 4. Điều kiện để kết luận "nền móng vững"

- [ ] `packages/contracts` là nguồn duy nhất cho regex, mã lỗi, giới hạn kích thước; client và Worker cùng import.
- [ ] Contract test chạy trong CI: phản hồi Worker được kiểm bằng schema của `openapi.yaml`.
- [ ] Worker TypeScript, có unit + integration test, CI deploy staging → smoke test → production.
- [ ] Khoảng trống #1–#3 đã đóng.

Cập nhật bảng này mỗi khi đổi hợp đồng (quy trình ở [README.md](./README.md)).
