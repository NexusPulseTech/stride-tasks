# Master Prompt: Đồng Bộ Hóa, Rà Soát Lỗi & Chất Vấn Ngược (Dành Cho AI Local / Cursor / Claude Code)

Sao chép toàn bộ khối Prompt bên dưới và gửi cho AI trong IDE của bạn (Cursor, Windsurf, Claude Code, GitHub Copilot...) sau khi mở thư mục mã nguồn:

---

```markdown
# ROLE & MINDSET
Bạn là Principal Software Architect, Staff Frontend Engineer và Product Strategist.
Tôi vừa mở mã nguồn mới nhất của dự án **Stride Tasks (`v3.0.0` — phát hành ngày 10/27/2026)**.

Trước khi viết bất kỳ dòng code nào, bạn BẮT BUỘC phải thực hiện quy trình **3 Bước: Đồng Bộ Hóa Ngữ Cảnh -> Kiểm Toán Kỹ Thuật (Bug & Edge-Case Audit) -> Chất Vấn Ngược (Reverse Critique)**.

---

## BƯỚC 1: ĐỒNG BỘ HÓA NGỮ CẢNH
Đọc và đối chiếu trực tiếp tài liệu với mã nguồn (mã nguồn là sự thật; tài liệu nào lệch phải được báo cáo):
1. **Tài liệu**: `docs/Release/2026-10-27-v3.0.0-omni-channel-and-execution-engine.md`, `docs/Release/README.md`, `docs/architecture/state-persistence.md`, `README.md`, `ARCHITECTURE.md`, `.env.example`.
2. **Execution Engine**:
   - `src/features/tasks/utils/smartTaskParser.ts` (cú pháp `~15m`, `~1giờ`, `!pin`/`!ghim`, `#doing`/`#danglam`, `@today`/`@ngaymai`, `@daily`/`@hangngay`; chặn tiêu đề rỗng)
   - `src/features/tasks/components/SmartCaptureHelperBar.tsx`, `KanbanBoardView.tsx`, `ProjectCardHeader.tsx`
   - `src/features/focus/hooks/useFocusTimer.ts`, `useFocusLog.ts`, `src/features/focus/utils/focusLog.ts`
   - `src/features/analytics/components/StatsPanel.tsx`, `src/features/analytics/hooks/useActivityLog.ts` (auto-archive > 90 ngày)
3. **Bản quyền & Thương mại**:
   - `src/utils/licenseCrypto.ts` (token `STRIDE1.<payload>.<chữ ký Ed25519>`, chỉ chứa public key)
   - `src/hooks/useProLicense.ts` (verify khi khởi động, chống sửa dữ liệu, claim đơn tự động, soft-gate theo giá trị, grandfathering)
   - `src/config/commerceConfig.ts` (cờ `VITE_ENABLE_PAYWALL`, VietQR + LemonSqueezy, vùng giá)
   - `src/features/modals/components/StoreCommercialModal.tsx`
   - `scripts/keygen.mjs`, `cloudflare-worker/src/index.js`

---

## BƯỚC 2: KIỂM TOÁN KỸ THUẬT
1. **Đồng bộ Code ↔ Docs ↔ i18n**: còn chuỗi giao diện nào chưa qua `src/i18n`? Còn tài liệu nào mô tả phiên bản/khóa lưu trữ/cú pháp khác với code?
2. **NLP edge cases**: tiêu đề tiếng Việt có dấu, nhiều token cùng loại, toàn token không tên, token dính chữ (`#doingđi`), tên người trùng token.
3. **Toàn vẹn Time-Budget & Deep Work**: xóa/Undo việc, việc lặp lại sang chu kỳ mới, đóng tab giữa phiên Pomodoro, đổi preset giữa chừng — phút có bị ghi trùng hoặc mất không?
4. **Bảo mật bản quyền**: thử sửa `STRIDE_PRO_LICENSE_V2` trong DevTools, nhập `.stride-license.json` hỏng/bị sửa, chèn license qua file backup, chế độ ẩn danh / `QuotaExceededError`. Quét `dist/` sau `npm run build` để chắc chắn không có private key hay công cụ DEV.
5. **Build & Type-Safety**: `npm run lint` (`tsc --noEmit`), `npm run build` (mọi chunk < 500 kB), `npm audit`.

---

## BƯỚC 3: CHẤT VẤN NGƯỢC (REVERSE CRITIQUE)
Đóng vai Tech Lead / Giám đốc Sản phẩm khắt khe, chất vấn 5 vấn đề sắc bén nhất có thể gây thất thoát doanh thu hoặc giảm trải nghiệm khi mở bán thật (VietQR + LemonSqueezy), ví dụ:
1. Rủi ro vận hành private key Ed25519 (sao lưu, xoay khóa, lộ secret của Worker).
2. Độ tin cậy luồng webhook SePay / LemonSqueezy → Worker → claim (giao dịch sai nội dung, thiếu tiền, hoàn tiền).
3. Đồng bộ đa thiết bị khi Task mới chỉ có `updatedAt?` (chưa có merge theo từng mục).
4. Giới hạn `localStorage` và rủi ro trình duyệt tự xóa dữ liệu.
5. Tỷ lệ chuyển đổi tại điểm chạm dùng thử và trang mua hàng.

---

## ĐỊNH DẠNG PHẢN HỒI
- Trình bày bằng **Tiếng Việt** rõ ràng, trực diện, súc tích; giữ nguyên tên biến, hàm và thuật ngữ kỹ thuật bằng **Tiếng Anh**.
- Báo cáo rõ: **(1) Kết quả đồng bộ & kiểm toán**, **(2) Danh sách điểm cần tinh chỉnh (kèm giải pháp)**, **(3) 5 câu hỏi chất vấn ngược kèm đề xuất Best-Practice**.
```
