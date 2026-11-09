# Stride Tasks: hướng dẫn cho agent

**CODEGRAPH:** mọi phiên và mọi đề giao cho agent con đều dùng CodeGraph trước khi grep hay đọc file (index ở `.codegraph/` tại gốc repo, chỉ nằm trên máy; MCP `codegraph_explore` với `projectPath` là thư mục repo, hoặc CLI `codegraph explore "<symbol hoặc câu hỏi>"`). Kết quả trả về là mã nguồn hiện tại kèm đường gọi, coi như đã đọc file. Sau khi sửa nhiều file thì chạy `codegraph sync`.

## Quy tắc không được phá
- Tài liệu trước, code sau: mỗi việc có file trong `docs/10-execution-plan/`; cập nhật trạng thái trong cùng commit.
- Không dùng dấu gạch dài hay gạch ngang dài trong code, tài liệu, commit và câu trả lời.
- Secret (`STRIDE_ED25519_PRIVATE_KEY`, webhook secret, token) không bao giờ vào repo, chat hay log. Founder tự nạp bằng `npm run worker:secrets`. Repo là public.
- Trước mỗi commit: `npm run lint`, `npm test`, test Worker (`cd cloudflare-worker && npm test`) và trình quét bí mật.
- Giữ nguyên các khóa localStorage hiện có, alias `@` trỏ `./src`, cài bằng `npm install --legacy-peer-deps`.

## Bản đồ nhanh
- App: `src/` (React, Vite). Bản quyền: `src/hooks/useProLicense.ts`, `src/utils/licenseCrypto.ts`. Đồng bộ: `src/features/sync/`.
- Worker: `cloudflare-worker/src/index.js` (đơn hàng, claim, webhook, đồng bộ). Hợp đồng API: `docs/05-api-contracts/openapi.yaml`.
- Trang tĩnh và SEO: `public/en/`, `public/vi/`, `public/sitemap.xml`, `npm run indexnow`.
- Vận hành: `docs/09-operations/`. Kế hoạch: `docs/10-execution-plan/README.md`.
