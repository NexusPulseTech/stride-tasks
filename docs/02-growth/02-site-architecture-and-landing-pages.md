# Kiến trúc site & trang đích (Landing pages)

> **Thuộc**: 02-growth · **Trạng thái**: Draft v1, *quyết định kỹ thuật ở ADR-0007* · **Cập nhật**: 2026-10-30
> **Mục đích**: tách **trang marketing tĩnh** (cho người lạ & bot) khỏi **app SPA** (cho người dùng), mà không làm mất dữ liệu người dùng hiện có.

## 1. Ràng buộc

- Dữ liệu người dùng nằm trong localStorage theo **origin** `https://tasks.nexuspulsetech.xyz` → **không được đổi host của app** khi chưa có cách chuyển dữ liệu (đồng bộ/xuất JSON). Đổi *đường dẫn* trên cùng origin thì an toàn với dữ liệu, nhưng PWA đã cài có `start_url`/`scope` = `/` → giữ app ở `/`.
- Trang marketing phải là **HTML đầy đủ không cần JS** (SSG), nhẹ (< 50 kB JS), có `hreflang`.

## 2. Sơ đồ URL

| URL | Loại | Ngôn ngữ | Mục tiêu |
| :--- | :--- | :--- | :--- |
| `/` | App (SPA), metadata thương hiệu EN | EN mặc định, app tự chọn ngôn ngữ | Truy vấn thương hiệu "Stride Tasks" |
| `/en/`, `/vi/` | Trang đích chính | EN / VI | Truy vấn danh mục ("offline task manager", "app quản lý công việc") |
| `/{lang}/pricing/` | Trang giá | EN / VI | Chuyển đổi |
| `/{lang}/features/{spaced-repetition, pomodoro, offline-private, e2e-sync, quick-capture, kanban}/` | Trang tính năng | EN / VI | Từ khóa tính năng |
| `/{lang}/compare/{todoist, ticktick, focus-to-do}-alternative/` | Trang so sánh | EN / VI | Người đang tìm thay thế (ý định mua cao) |
| `/{lang}/use-cases/{study-planner, exam-revision, deep-work}/` | Trang tình huống | EN / VI | Phân khúc A |
| `/{lang}/templates/{slug}/` | Mẫu kế hoạch dán nhanh (Quick Paste) | EN / VI | Nội dung hữu ích, dễ chia sẻ |
| `/{lang}/blog/{slug}/` | Bài viết | EN / VI | Trụ cột nội dung |
| `/quan-ly-cong-viec.html` | Giữ URL cũ, viết lại thành trang đích VI, canonical → `/vi/` | VI | Bảo toàn thứ hạng cũ (nếu có) |
| `/privacy.html`, `/terms.html`, `/refund.html` | Pháp lý | EN (+ VI) | Bắt buộc |

Quy tắc: slug giống nhau giữa các ngôn ngữ (đơn giản hóa `hreflang`); mỗi trang có canonical tự tham chiếu và `hreflang` đủ cặp + `x-default` → bản EN.

## 3. Cấu trúc trang đích (chuẩn chuyển đổi)

1. **Hero**: tiêu đề = kết quả người dùng nhận được; phụ đề = cách làm; CTA chính "Mở app, miễn phí, không cần tài khoản"; CTA phụ "Xem bảng giá"; GIF/video demo 45-60 giây.
2. **3 điểm khác biệt** (SM-2 cho việc · Offline không tài khoản · Đồng bộ E2E).
3. **Cách hoạt động**: 3 bước: *Nhập một dòng → Tập trung bằng Pomodoro → Ôn lại đúng lúc*.
4. **Lưới tính năng** (Kanban, việc con nhiều cấp, heatmap, báo cáo Markdown, phím tắt).
5. **Quyền riêng tư**: dữ liệu ở đâu, máy chủ thấy gì (chỉ bản mã), mã nguồn công khai.
6. **Bằng chứng xã hội** (khi có testimonial thật).
7. **Bảng giá rút gọn** + cam kết hoàn tiền 14 ngày.
8. **FAQ** (dữ liệu, offline, hoàn tiền, thiết bị hỗ trợ, khác gì Todoist).
9. **CTA cuối**.

## 4. Nội dung hero đề xuất

| | English | Tiếng Việt |
| :--- | :--- | :--- |
| H1 | **Plan it. Focus on it. Remember it.** | **Lên kế hoạch. Tập trung. Không quên.** |
| Phụ đề | The offline-first task manager with Pomodoro and spaced repetition, no account, your data stays on your device. | Ứng dụng quản lý công việc chạy offline, có Pomodoro và nhắc ôn lại thông minh (SM-2), không cần tài khoản, dữ liệu nằm trên máy bạn. |
| CTA | Open the app, free | Mở app miễn phí |

## 5. Lựa chọn kỹ thuật (tóm tắt ADR-0007)

- **Astro** (SSG, i18n routing có sẵn, mặc định 0 JS) trong thư mục `site/` → build ra `dist/` cạnh app. Không tự viết bộ sinh trang tĩnh.
- Thứ tự build: `vite build` (app + Service Worker) → `astro build` vào `dist/{en,vi}/…` → sinh `sitemap.xml`.
- Workbox: thêm `/^\/(en|vi)\//` vào `navigateFallbackDenylist` và loại trừ khỏi precache.
- Dùng lại design token của app (xem [../08-design-system/02-design-tokens.md](../08-design-system/02-design-tokens.md)) để trang marketing và app cùng một ngôn ngữ thiết kế.

## 6. Tiêu chí hoàn thành

- HTML thô của `/en/` và `/vi/` chứa H1, mô tả, giá, FAQ (kiểm bằng `curl`).
- Lighthouse Performance/SEO/Accessibility ≥ 95 trên mobile.
- Mở `/en/` khi đã cài PWA vẫn thấy trang marketing (không bị Service Worker thay bằng app).
