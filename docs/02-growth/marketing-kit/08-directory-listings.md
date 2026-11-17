# Bộ nội dung đăng thư mục phần mềm (tiếng Anh)

> **Thuộc**: 02-growth/marketing-kit · **Trạng thái**: Ready · **Cập nhật**: 2026-11-17
> **Dùng cho**: task [C07](../../10-execution-plan/C07-directories-and-listicle-outreach.md) (và C04 khi launch Product Hunt).
> **Ai làm**: founder tạo tài khoản bằng tên thật, xác minh email. Khi đã đăng nhập, AI có thể điền form theo nội dung dưới đây; founder bấm gửi.

## 0. Dữ kiện dùng chung

| Trường | Giá trị |
| :--- | :--- |
| Tên | Stride Tasks (luôn ghi đủ hai chữ, tránh trùng các app "Stride" khác) |
| Website | `https://tasks.nexuspulsetech.xyz/en/?utm_source=<tên-trang>&utm_medium=directory&utm_campaign=listing` |
| Mã nguồn | Không điền (founder chốt 2026-11-10: không đưa GitHub ra trước khách). Thư mục nào bắt buộc link mã nguồn thì hỏi founder trước khi gửi |
| Email hỗ trợ | `support@nexuspulsetech.xyz` (dùng được để xác minh domain) |
| Giá | Freemium. PRO trọn đời $19 cho 100 bản quyền sáng lập, sau đó $29. Việt Nam và các nước thu nhập thấp, trung bình (World Bank) tự thấy $9.95, sau đó $14.95 |
| Nền tảng | Web, PWA cài được trên Windows, macOS, Linux, Android, iOS |
| Logo | `public/icon-512.png` (512x512) |
| Ảnh chụp | `public/screenshots/wide-list.png`, `wide-kanban.png`, `wide-daily-focus.png` (1280x800), `narrow-list.png` (di động) |
| "Alternative to" | Todoist, TickTick, Microsoft To Do, Super Productivity, Focus To-Do, Things |

Quy tắc chung (theo [01-brand-messaging.md](./01-brand-messaging.md) mục 5): không ghi số người dùng, không "best", "#1", không nhắc AI. Khi một thư mục từ chối, ghi lý do vào bảng theo dõi ở mục 6, không gửi lại ngay.

## 1. AlternativeTo

Quy định chính trong [FAQ chính thức](https://alternativeto.net/faq):
- Cần tài khoản đã xác minh email. Gửi qua menu người dùng → **Suggest new application**.
- Mô tả chỉ bằng tiếng Anh, **không được chứa link, email, địa chỉ, số điện thoại**; link đặt vào các ô URL riêng.
- Chỉ nhận app đã phát hành (bản miễn phí của Stride đã chạy thật nên đạt). Không nhận "coming soon", beta kín.
- Không dùng hồ sơ cá nhân để quảng cáo; không tặng quà đổi lượt thích.
- Hàng đợi miễn phí rất dài, không có hạn. Có gói duyệt ưu tiên trả phí: **chưa dùng** (ưu tiên miễn phí).
- Sau khi được duyệt: xin **Developer access** để tự sửa trang không cần chờ duyệt.

| Ô trong form | Nội dung |
| :--- | :--- |
| Name | `Stride Tasks` |
| Website | link mục 0 với `utm_source=alternativeto` |
| Source code | bỏ trống |
| Platforms | Online, Progressive Web App, Windows, Mac, Linux, Android, iPhone, iPad |
| License | Không chọn Open Source vì FSL không phải giấy phép OSI. Nếu form bắt chọn, chọn Proprietary |
| Pricing | Freemium |
| Tags / features | Works offline, No registration required, Privacy focused, End-to-end encryption, Pomodoro, Spaced repetition, Kanban board, Subtasks, Dark mode, Markdown support |
| Alternative to | 6 app ở mục 0 |
| Screenshots | 3 ảnh `wide-*.png` |

**Short description**
```
Offline-first task manager with Pomodoro and spaced repetition. No account needed.
```

**Description** (không chứa link)
```
Stride Tasks is an offline-first task manager for people who study and do deep work. It brings together three things that usually live in separate apps: a to-do list, a Pomodoro timer and spaced-repetition reviews.

Type one line such as "Review chapter 3 ~45m @daily !pin" and Stride creates a pinned, daily, 45-minute task. Start a Pomodoro next to your list, and every session is logged to a deep-work history. When a study topic is due, tell Stride how well you remembered it and the next review moves out on an expanding schedule: 1, 3, 7, 16 and 35 days, then about 2.2 times longer each step, up to a year.

There is no account and no sign-up. Your data stays in your browser or desktop app storage, the app works offline after the first visit, and you can export a JSON backup at any time. It installs as a Progressive Web App on Windows, macOS, Linux, Android and iOS.

Free features: natural-language quick capture, nested subtasks, a 4-column Kanban board, Pomodoro timer and deep-work log, spaced-repetition reviews, activity heatmap and streaks, 3 Markdown reports, command palette, light and dark themes, English and Vietnamese.

The optional PRO lifetime license adds end-to-end encrypted sync across devices (AES-256-GCM, the server only stores ciphertext), unlimited projects and unlimited Markdown reports.
```

## 2. SaaSHub

- Gửi tại `saashub.com/services/submit` (kiểm tra lại đường dẫn khi đăng nhập). Miễn phí; thời gian duyệt không công bố.
- Xác minh quyền sở hữu: email trên domain (`support@nexuspulsetech.xyz` đã chuyển về Gmail của founder) hoặc thẻ meta.

| Ô | Nội dung |
| :--- | :--- |
| URL | link mục 0 với `utm_source=saashub` |
| Tagline | `Offline-first task manager with Pomodoro and spaced repetition` |
| Description | dùng bản AlternativeTo ở mục 1 |
| Categories | chọn mục gần nhất đang có: Task Management, To-Do List, Pomodoro, Personal Productivity |
| Competitors | 6 app ở mục 0 |

## 3. OpenAlternative (không đủ điều kiện)

Thư mục này chỉ nhận phần mềm mã nguồn mở. Từ 2026-10-31 Stride dùng FSL-1.1-MIT ([ADR-0008](../../04-architecture/adr/0008-source-license-strategy.md)) nên không gửi. Xem lại khi có phiên bản đã chuyển sang MIT.

## 4. Product Hunt (task C04, khi PRO đã mở bán)

Thông số theo [hướng dẫn launch chính thức](https://www.producthunt.com/launch/preparing-for-launch): tagline tối đa 60 ký tự; mô tả tối đa 500 ký tự; thumbnail vuông, khuyến nghị 240x240; gallery ít nhất 2 ảnh, khuyến nghị 1270x760; mọi ảnh dưới 3MB; video chỉ nhận link YouTube công khai. Product Hunt không còn trang "coming soon" riêng: có thể lên lịch launch trước tối đa 1 tháng. Giờ khuyến nghị 12:01 sáng giờ Thái Bình Dương. Lời mời trong comment là xin góp ý, không xin upvote.

Trước ngày launch: tạo thumbnail 240x240 từ `icon-512.png` và 3 ảnh gallery 1270x760 từ ảnh chụp `wide-*.png` (việc của C04).

**Tagline** (56 ký tự)
```
Offline task manager with Pomodoro and spaced repetition
```

**Description** (dưới 500 ký tự)
```
Stride Tasks is an offline-first task manager for people who study and do deep work. Type one line to create a task, focus with the built-in Pomodoro timer, and get spaced-repetition reviews so you keep what you learn. No account, your data stays on your device, and it installs as an app on any platform. Optional PRO adds end-to-end encrypted sync for a one-time payment.
```

**Maker first comment** (founder sửa theo giọng mình trước khi đăng)
```
Hi Product Hunt 👋

I built Stride Tasks because I kept forgetting what I had studied a week earlier, and my tasks, timer and review cards lived in three different apps.

Stride puts them in one place:
• One-line capture: "Review chapter 3 ~45m @daily !pin"
• A Pomodoro timer and deep-work log right next to your tasks
• Spaced repetition for tasks and study topics, not just flashcards
• No account, works offline, data stays on your device
• Optional PRO: end-to-end encrypted sync, pay once

I'd love your feedback: what would make you switch from the to-do app you use today?
```

## 5. Indie Hackers

Chưa xác minh được Indie Hackers hiện còn mục tạo trang sản phẩm hay không. Khi đăng nhập: nếu có mục Products thì tạo trang với tagline và mô tả ở mục 4; nếu không, chỉ đăng bài theo [05-community-posts.md](./05-community-posts.md).

## 6. Bảng theo dõi

| Thư mục | Ngày gửi | Trạng thái | Link trang | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| AlternativeTo | | | | |
| SaaSHub | | | | |
| Product Hunt | | | | Theo C04 |
| Indie Hackers | | | | |
