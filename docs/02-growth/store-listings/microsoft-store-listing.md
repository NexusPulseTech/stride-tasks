# Microsoft Store: hồ sơ đăng ứng dụng Stride Tasks

## 1. Chuẩn bị (miễn phí cho cá nhân từ 09/2025)

1. Đăng ký tài khoản nhà phát triển cá nhân tại <https://storedeveloper.microsoft.com> (cần tài khoản Microsoft + xác minh giấy tờ tùy thân).
2. Partner Center → **Apps and games → New product → MSIX or PWA app** → đặt tên `Stride Tasks` để giữ chỗ tên.
3. Ghi lại 3 giá trị ở **Product management → Product identity**: *Package/Identity/Name*, *Publisher*, *Publisher display name*.

## 2. Đóng gói bằng PWABuilder

1. Mở <https://www.pwabuilder.com>, nhập `https://tasks.nexuspulsetech.xyz/` → **Start**.
2. Kiểm tra báo cáo: manifest (tên, mô tả, icon 512, screenshots, shortcuts) và service worker đã có sẵn.
3. **Package For Stores → Windows** → điền 3 giá trị ở bước 1.3 → tải gói `.msixbundle`.
4. Partner Center → **Packages** → tải gói lên → **Submit**.

> Lưu ý: bản Store chạy trong WebView của Edge với bộ nhớ riêng, tách khỏi trình duyệt. Người dùng chuyển dữ liệu bằng **Đồng bộ thiết bị** (PRO) hoặc Sao lưu/Khôi phục JSON.

## 3. Nội dung listing

**Tên**: Stride Tasks

**Mô tả ngắn (VI)**: Quản lý công việc tốc độ cao, chạy offline: nhập nhanh 1 dòng, Kanban, Pomodoro, ôn tập ngắt quãng SM-2.

**Mô tả ngắn (EN)**: Fast offline task manager: one-line quick capture, Kanban, Pomodoro and SM-2 spaced repetition.

**Mô tả đầy đủ (VI)**:

Stride Tasks giúp bạn làm xong việc mỗi ngày, không cần tài khoản, dữ liệu nằm trên máy bạn.

• Nhập nhanh 1 dòng bằng ngôn ngữ tự nhiên: `Ôn chương 3 ~45m @daily !pin`
• Việc con nhiều cấp, kéo thả, trạng thái rõ ràng (Chờ → Đang làm → Duyệt → Xong)
• Bảng Kanban 4 cột và đồng hồ Pomodoro có nhật ký Deep Work
• Ôn tập ngắt quãng SM-2 cho công việc, không bỏ sót việc quan trọng
• Heatmap nhịp độ, chuỗi ngày liên tục, báo cáo Markdown cho Obsidian/Notion
• Chạy offline 100%, sao lưu JSON bất kỳ lúc nào
• PRO trọn đời: đồng bộ đa thiết bị mã hóa đầu-cuối, không giới hạn dự án, báo cáo không giới hạn

**Full description (EN)**:

Stride Tasks helps you get today's work done, no account needed, your data stays on your device.

• One-line natural-language capture: `Review chapter 3 ~45m @daily !pin`
• Nested subtasks, drag & drop, clear statuses (To do → In progress → Review → Done)
• 4-column Kanban and a Pomodoro timer with a Deep Work log
• SM-2 spaced repetition for tasks, important work never slips
• Activity heatmap, streaks, Markdown reports for Obsidian/Notion
• 100% offline, JSON backup anytime
• Lifetime PRO: end-to-end encrypted multi-device sync, unlimited projects, unlimited reports

**Từ khóa (tối đa 7)**: quản lý công việc · todo list · task manager · pomodoro · kanban · spaced repetition · offline

**Danh mục**: Productivity · **Độ tuổi**: 3+ · **Privacy policy URL**: `https://tasks.nexuspulsetech.xyz/privacy.html`

**Ảnh chụp màn hình** (PNG, tối đa 10, khuyến nghị 4): `public/screenshots/wide-list.png`, `wide-kanban.png`, `wide-daily-focus.png`, `narrow-list.png`.

## 4. Thanh toán trong bản Store

Ứng dụng không phải game được dùng cổng thanh toán riêng và giữ 100% doanh thu (theo công bố của Microsoft, kiểm tra lại mục chính sách 10.8 trong Partner Center trước khi nộp). Bản Store dùng cùng luồng VietQR / LemonSqueezy và kích hoạt bằng link/tệp chứng chỉ như bản web.
