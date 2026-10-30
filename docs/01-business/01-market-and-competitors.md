# Thị trường & đối thủ

> **Thuộc**: 01-business · **Trạng thái**: Draft v1 · **Cập nhật**: 2026-10-30
> **Mục đích**: biết mình đứng ở đâu so với đối thủ để chọn chỗ thắng được, không cạnh tranh "nhiều tính năng hơn Todoist".

## 1. Bối cảnh

- Ứng dụng to-do/productivity là thị trường **đông đúc**: người dùng đã có Todoist, TickTick, Microsoft To Do miễn phí. Muốn có khách trả tiền phải thắng ở **một ngách rõ ràng**, không phải ở độ phủ tính năng.
- Ba xu hướng có lợi cho Stride: (1) **local-first / quyền riêng tư** (người dùng mệt mỏi vì bắt buộc tài khoản & dữ liệu trên cloud của người khác); (2) **mua một lần** được ưa chuộng trong cộng đồng indie (Things 3, Focus To-Do lifetime); (3) **giá theo sức mua (PPP)** mở được thị trường mới nổi mà đối thủ Mỹ bỏ qua.

## 2. Bảng đối thủ (giá tham khảo, cần xác minh trên trang chính chủ trước khi trích dẫn công khai)

| Sản phẩm | Mô hình & giá | Điểm mạnh | Điểm yếu so với Stride |
| :--- | :--- | :--- | :--- |
| Todoist | Thuê bao, Pro ≈ $60/năm (tăng từ $48 vào 12/2025 theo nguồn thứ ba) | NLP nhập nhanh tốt, đa nền tảng, tích hợp nhiều | Bắt buộc tài khoản cloud, không có SRS, Pomodoro không có sẵn |
| TickTick | Thuê bao ≈ $35.99/năm | Có Pomodoro, lịch, habit | Bắt buộc tài khoản, dữ liệu trên cloud, không SRS |
| Things 3 | Mua một lần: $49.99 (Mac), $19.99 (iPad), $9.99 (iPhone) | Thiết kế đẹp, mua một lần | Chỉ Apple, không Windows/Android/web |
| Microsoft To Do | Miễn phí | Sẵn trên Windows, đồng bộ Microsoft | Đơn giản, không Pomodoro/SRS/Kanban, cần tài khoản Microsoft |
| **Focus To-Do** | Freemium: Premium $1.99/tháng, **lifetime $11.99** (App Store) | Pomodoro + task; **trả tiền chủ yếu để đồng bộ** | Không SRS, không local-first E2E, *đây là đối thủ có mô hình giống Stride nhất* |
| Super Productivity | Miễn phí, mã nguồn mở | Offline, time-tracking, cộng đồng dev | Không bán; UX thiên kỹ thuật |
| Obsidian (tham chiếu mô hình) | App miễn phí, Sync ≈ $4/tháng (năm) | Chứng minh "local-first miễn phí + trả tiền cho sync" bán được | Không phải task manager |
| Anki | Miễn phí (desktop/Android) | Thuật toán SRS chuẩn mực | Là flashcard, không quản lý công việc |
| Revu / Synapse / Reviser | Ứng dụng di động "revision planner" mới | Cho thấy **có nhu cầu lập lịch ôn tập** | Chủ yếu iOS/Android, không có Kanban/Pomodoro/offline E2E |

## 3. Định vị khác biệt của Stride

**Câu định vị (đề xuất):**
> *Stride Tasks là trình quản lý công việc offline-first cho người cần tập trung và ghi nhớ: lên kế hoạch bằng một dòng, làm bằng Pomodoro, ôn lại đúng lúc bằng SM-2, dữ liệu ở trên máy bạn, đồng bộ mã hóa đầu-cuối khi cần.*

| Thuộc tính | Stride | Todoist | TickTick | Focus To-Do | Things 3 |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Dùng không cần tài khoản | ✅ | ❌ | ❌ | ✅ (1 thiết bị) | ✅ |
| Đồng bộ mã hóa đầu-cuối | ✅ PRO | ❌ | ❌ | ❌ | ❌ |
| Ôn tập ngắt quãng SM-2 cho việc | ✅ | ❌ | ❌ | ❌ | ❌ |
| Pomodoro + nhật ký Deep Work | ✅ | ❌ | ✅ | ✅ | ❌ |
| Nhập nhanh ngôn ngữ tự nhiên | ✅ (`~45m @daily !pin`) | ✅ | ✅ | ❌ | ✅ |
| Windows + Web + PWA | ✅ | ✅ | ✅ | ✅ | ❌ |
| Mua một lần, giá PPP | ✅ | ❌ | ❌ | ✅ (không PPP) | ✅ |

## 4. Điểm yếu cần nói thật (và cách xử lý)

| Điểm yếu | Ảnh hưởng | Hướng xử lý |
| :--- | :--- | :--- |
| Chưa có app di động native | Người dùng điện thoại chỉ dùng PWA | PWA cài được trên Android/iOS; Google Play qua TWA ở Phase C |
| Thông báo nhắc việc khi app đóng còn hạn chế (giới hạn của web) | Người dùng có thể quên lịch ôn | Microsoft Store/TWA cải thiện; cân nhắc Web Push khi có backend phù hợp |
| Không cộng tác nhóm, không tích hợp lịch | Mất nhóm khách cần làm việc nhóm | **Chủ động không nhắm** nhóm này (anti-ICP) |
| Chỉ có tiếng Việt & tiếng Anh | Hạn chế SEO đa quốc gia | Đợt bản địa hóa 1 ở Phase C (xem `02-growth/`) |
| Thương hiệu mới, chưa có review | Khó tạo niềm tin | Founder-led, minh bạch (repo public, chính sách riêng tư rõ), xin testimonial từ khách đầu |

## 5. Hệ quả chiến lược

1. Không đua tính năng với Todoist/TickTick. **Đua ở ngách**: "học + tập trung + riêng tư".
2. Thông điệp chính luôn xoay quanh 3 điểm khác biệt mà đối thủ lớn **không có**: SM-2 cho việc, offline không tài khoản, đồng bộ E2E.
3. Giá PRO lifetime $19 (sáng lập), $29 sau đó, rẻ hơn **1 năm** TickTick/Todoist → lập luận bán hàng mạnh; Focus To-Do $11.99 là mốc thấp nhất người dùng đã quen trả.

## Nguồn (xác minh 2026-10-30)

- Focus To-Do (App Store, mục In-App Purchases): <https://apple.co/2Txpjcq>; review 2026: <https://goalsandprogress.com/focus-to-do-review-2026/>
- Todoist/TickTick/Things (nguồn thứ ba, **cần xác minh**): <https://www.asianefficiency.com/task-management/todoist-vs-ticktick/>, <https://toolradar.com/tools/things-3/pricing>, <https://aicores.io/pricing/ticktick>
- Obsidian Standard plan: <https://obsidian.md/fr/blog/standard-plan/>
- Ứng dụng revision planner: <https://apps.apple.com/us/app/-/id6748602127>, <https://mwm.ai/apps/spaced-repetition-synapse/6672094098>
