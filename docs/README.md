# Stride Tasks: Documentation Hub

> **Cập nhật**: 2026-10-30 · **Phiên bản sản phẩm**: v3.1.0 · **Chủ sở hữu tài liệu**: Founder (NexusPulse)
> **Mục tiêu số 1 hiện tại**: có **khách hàng trả tiền đầu tiên**: mọi kế hoạch khác xếp hàng sau mục tiêu này.

Thư mục `docs/` được chia theo **miền trách nhiệm** (giống cách các công ty lớn tách tài liệu theo bounded context):
mỗi thư mục đặc tả một chức năng, mỗi file giải quyết **một** chủ đề. Khi code, tài liệu là "hợp đồng", code phải khớp tài liệu,
nếu đổi thiết kế thì cập nhật tài liệu (hoặc ADR) trong cùng commit.

---

## Tóm tắt điều hành (trả lời nhanh 5 câu hỏi lớn)

| Câu hỏi | Trả lời ngắn | Đọc chi tiết |
| :--- | :--- | :--- |
| Kiếm tiền toàn cầu bằng cách nào? | Freemium local-first: lõi miễn phí, **PRO trọn đời** (đồng bộ E2E + không giới hạn dự án + báo cáo) với giá theo sức mua (PPP). Bán trực tiếp trên web qua **Merchant of Record** (lo thuế VAT toàn cầu) + VietQR cho Việt Nam. | [01-business/](./01-business/README.md) |
| Bán ở đâu chuẩn nhất? | Thứ tự: **Web trực tiếp** (0% phí store) → **Microsoft Store** (đăng ký miễn phí, MS ký số MSIX miễn phí, app không phải game dùng cổng thanh toán riêng giữ 100%) → Google Play (TWA, cần Play Billing) → Apple (đánh giá sau). | [01-business/05-distribution-channels.md](./01-business/05-distribution-channels.md) |
| SEO / nội dung thế nào để người ta biết? | Sửa ngay lỗi thương hiệu SEO ("TaskTodo" ≠ Stride Tasks), tách **trang marketing tĩnh EN/VI** khỏi SPA, xây cụm nội dung quanh 3 điểm khác biệt: *Pomodoro + ôn tập ngắt quãng SM-2 + offline/riêng tư*. | [02-growth/](./02-growth/README.md) |
| Sản phẩm đã hoàn tất chưa? | **Đủ tốt để bán (MVP+) nhưng CHƯA thu tiền được**: paywall tắt, chưa nạp secret thanh toán, LemonSqueezy có rủi ro không chi trả về Việt Nam, thiếu Điều khoản/Chính sách hoàn tiền, chưa có analytics. | [03-product/01-readiness-audit.md](./03-product/01-readiness-audit.md) |
| Backend ↔ frontend đã khớp, nền móng vững chưa? | **Khớp ở mức hành vi** (mã lỗi sync/claim ánh xạ đúng, test 14/14 trên production) nhưng **nền móng chưa vững**: hợp đồng API chỉ nằm ngầm trong code, Worker là JS không kiểm tra kiểu, không có test/CI cho logic, TS chưa `strict`, `/claim` chỉ bảo vệ bằng mã 30-bit, chưa xử lý hoàn tiền/thu hồi. | [05-api-contracts/02-fe-be-alignment-audit.md](./05-api-contracts/02-fe-be-alignment-audit.md) |

**Kế hoạch hành động từng bước** (mỗi file một nhiệm vụ, có tiêu chí nghiệm thu): [10-execution-plan/](./10-execution-plan/README.md).

---

## Bản đồ thư mục

```
docs/
├── README.md                 # (file này) Hub điều hướng + tóm tắt điều hành + quy ước tài liệu
├── 01-business/              # Chiến lược kinh doanh: thị trường, khách hàng, giá, thanh toán, kênh bán, pháp lý, KPI
├── 02-growth/                # Tăng trưởng: SEO kỹ thuật, trang đích, nội dung, cộng đồng/launch, ASO, AI search, analytics
│   └── store-listings/       # Hồ sơ đăng store (Microsoft Store, …)
├── 03-product/               # Sản phẩm: đánh giá độ hoàn thiện, danh mục tính năng Free/PRO, roadmap, onboarding, user guide
├── 04-architecture/          # Kiến trúc: C4, nguyên lý SOLID/DDD/microservices, frontend, backend services, dữ liệu, cấu trúc repo
│   └── adr/                  # Architecture Decision Records, mọi quyết định kiến trúc lớn được ghi tại đây
├── 05-api-contracts/         # Hợp đồng API (OpenAPI 3.1), mô hình lỗi, webhook/event, báo cáo khớp FE↔BE
├── 06-security-privacy/      # Mô hình mối đe dọa, quản lý khóa bí mật, quyền riêng tư & tuân thủ, chống lạm dụng bản quyền
├── 07-engineering/           # Chuẩn kỹ thuật: coding standard, test, CI/CD, quan sát hệ thống, ngân sách hiệu năng, git
├── 08-design-system/         # Hệ thiết kế: nguyên lý, design token, component, accessibility, giọng văn & i18n
├── 09-operations/            # Vận hành: runbook triển khai, thanh toán & bản quyền, sự cố, hỗ trợ khách hàng
├── 10-execution-plan/        # Kế hoạch thực thi: mỗi file = 1 nhiệm vụ (Phase A → D), bảng trạng thái tổng
├── Release/                  # Nhật ký phát hành (giữ nguyên vị trí vì quy trình AI audit đang tham chiếu)
└── assets/                   # Hình ảnh dùng trong tài liệu
```

## Lộ trình đọc theo vai trò

| Vai trò | Đọc theo thứ tự |
| :--- | :--- |
| Founder (kinh doanh) | `01-business/07-first-paying-customer-playbook.md` → `01-business/03-pricing-and-packaging.md` → `10-execution-plan/README.md` |
| Kỹ sư mới | `04-architecture/README.md` → `04-architecture/02-principles-solid-ddd-microservices.md` → `07-engineering/01-coding-standards.md` → `05-api-contracts/README.md` |
| Marketing / nội dung | `02-growth/README.md` → `02-growth/03-keyword-and-content-strategy.md` → `08-design-system/05-content-and-voice.md` |
| AI agent làm task | `10-execution-plan/README.md` → file task được giao → các file "Tham chiếu" ghi trong task |

---

## Quy ước tài liệu (bắt buộc)

1. **Một file = một chủ đề.** Quá 300 dòng → tách file (cùng nguyên tắc với code, xem [07-engineering/file-size-and-modularity.md](./07-engineering/file-size-and-modularity.md)).
2. **Tên file**: `kebab-case`, có tiền tố số khi thứ tự đọc quan trọng (`01-…`). Thư mục miền dùng tiền tố `NN-`.
3. **Đầu mỗi file**: khối trích dẫn ghi *Thuộc / Trạng thái / Cập nhật / Mục đích*. Trạng thái: `Draft` → `Reviewed` → `Accepted` → `Deprecated`.
4. **Sự thật có nguồn**: số liệu thị trường, phí, chính sách store phải kèm link nguồn và ngày xác minh. Thông tin từ blog bên thứ ba ghi rõ *"cần xác minh"*.
5. **Quyết định kiến trúc** → viết ADR trong `04-architecture/adr/` (mẫu Michael Nygard). Không sửa ADR đã `Accepted`; tạo ADR mới *supersede*.
6. **Hợp đồng API** → sửa `05-api-contracts/openapi.yaml` **trước** khi sửa code (contract-first).
7. **Không chép trùng**: nếu nội dung đã có ở file khác, liên kết tới đó.
8. **Link tương đối** giữa các tài liệu; khi di chuyển file phải cập nhật mọi link (dùng `git mv` để giữ lịch sử).

## Bất biến của dự án (không được phá khi refactor)

- Khóa localStorage: `SOLO_CORE_TASKS_V4`, `SOLO_CORE_STREAK_V4`, `SOLO_MUTED_V1`, `SOLO_REMINDER_V1`, `SOLO_CHECKLIST_ACTIVITY_LOG_V1`, `SOLO_COMPLETED_LOGS_V2`, `STRIDE_AUTO_BACKUP_DATA` (và các khóa `STRIDE_*_V1` khác), xem [04-architecture/05-data-model-and-storage.md](./04-architecture/05-data-model-and-storage.md).
- Tauri identifier `com.phucnguyen.stridetasks`; alias `@` → `./src`; cài đặt bằng `npm install --legacy-peer-deps`.
- Khóa bí mật `STRIDE_ED25519_PRIVATE_KEY` **chỉ** nằm trong `.env.local` (gitignored) và Worker secret; repo là **public**.
- `.aistudio/` không bao giờ được commit; `cloudflare-worker/wrangler.toml` (chứa ID thật) được gitignore.
