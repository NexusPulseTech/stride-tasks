# TÀI LIỆU NGHIÊN CỨU & LỘ TRÌNH PHÁT TRIỂN (RESEARCH & ROADMAP BLUEPRINT)
## Dự án: Stride Tasks (stride-tasks)
**Tác giả:** NexusPulseTech  
**Triết lý:** Tối giản (Minimalist), Cục bộ ưu tiên (Local-First), Chuẩn công nghiệp (Best-Practice), Không tạo bánh xe hỏng.

---

## 1. TỔNG QUAN VÀ NGUYÊN TẮC THIẾT KẾ CỐT LÕI
1. **Chống "Hội chứng Notion" (Anti-Notion Overwhelm):** 
   - Notion thất bại với nhóm người dùng cần tập trung vì cung cấp quá nhiều tính năng, khối (blocks) và nút bấm không cần thiết, gây tê liệt quyết định (decision fatigue).
   - Stride Tasks tuân thủ nguyên lý **Progressive Disclosure** (Tiết lộ tăng dần) của Apple Human Interface Guidelines: Mặc định tối giản, các công cụ nâng cao chỉ xuất hiện khi người dùng muốn.
2. **Học tập từ các sản phẩm thành công đã chứng minh:**
   - **Linear:** Hệ thống tìm kiếm Omni-Search nhanh như điện, phím tắt trực quan, phân cấp trạng thái tinh gọn.
   - **Things 3 & Apple Reminders:** Trải nghiệm danh sách công việc thuần khiết, nhịp điệu hoàn thành rõ ràng, không màu mè.
   - **Obsidian:** Cơ chế lưu trữ offline 100%, bảo mật riêng tư, giao diện có thể tùy biến ẩn/hiện mọi nút bấm.

---

## 2. NGHIÊN CỨU CHUYÊN SÂU & GIẢI PHÁP CHO TỪNG HẠNG MỤC

### HẠNG MỤC 0: SỬA LỖI XÓA & TÍNH TOÁN DỮ LIỆU "NHỊP ĐỘ & LỊCH SỬ HOÀN THÀNH"
#### 1. Vấn đề thực tế
- Bảng lịch sử `CompletedTasksTable` trước đây là tĩnh, không có nút xóa dòng lịch sử (read-only).
- Bộ seed ban đầu (18 việc mẫu) khiến người dùng cảm thấy dữ liệu không thuộc về mình và không thể dọn dẹp.
- Khi người dùng đánh dấu xong hoặc bỏ đánh dấu việc, thống kê chưa phản ánh tức thời hoặc dữ liệu lưu trữ bị phân mảnh giữa `completedLogs` và `projects`.
#### 2. Best-Practice áp dụng
- **Single Source of Truth + Reactive Computation:**
  - Mỗi bản ghi lịch sử có cấu trúc rõ ràng: `{ id, taskId, taskTitle, projectId, projectName, completedAt, dateKey }`.
  - Cung cấp hành động `deleteLog(logId)`: Xóa một mục lịch sử cụ thể.
  - Cung cấp hành động `clearAllLogs()`: Xóa sạch toàn bộ lịch sử để người dùng bắt đầu lại từ con số 0.
  - Sau khi xóa, lập tức tính lại: `todayCount`, `weekCount`, `currentStreak`, `totalCompleted` và cập nhật lại mảng màu trên `ContributionHeatmap`.

---

### HẠNG MỤC 1: HỆ THỐNG TÌM KIẾM THÔNG MINH (OMNI-SEARCH & DEEP SEARCH)
#### 1. Nghiên cứu hành vi người dùng
- Người dùng không chỉ tìm theo tên đầu việc cha, mà thường nhớ các chi tiết nhỏ nằm trong **bước con (Subtasks)** hoặc **tên dự án**.
- Khi gõ tìm kiếm, nếu giao diện vẫn đóng các danh mục công việc thì người dùng không thể thấy kết quả, gây ức chế và tưởng tính năng bị hỏng.
#### 2. Best-Practice áp dụng (Học từ Linear & VS Code)
- **Deep Recursive Search (Tìm kiếm đệ quy toàn diện):**
  - Quét qua: Tên dự án -> Tên công việc -> Tất cả các tầng việc con (Subtasks).
- **Auto-Expansion (Tự động mở rộng khi tìm kiếm):**
  - Khi `search.trim() !== ''`, tự động mở (`isExpanded = true`) toàn bộ các dự án và các task có chứa kết quả khớp.
  - Khi xóa tìm kiếm (`Esc` hoặc bấm `X`), khôi phục lại trạng thái mở/đóng ban đầu của người dùng.
- **Fuzzy Token Matching & Highlight:**
  - Chuẩn hóa chuỗi tìm kiếm (loại bỏ dấu tiếng Việt hoặc tìm không phân biệt hoa thường) để người dùng gõ không dấu vẫn tìm ra từ có dấu.
  - Component `HighlightedText`: Bôi sáng cụm từ khớp với màu nền vàng/cam nhẹ (`bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 px-0.5 rounded`).
- **Phím tắt chuẩn công nghiệp:**
  - Nhấn phím `/` hoặc `Ctrl + K` (trên Mac là `Cmd + K`) ở bất cứ đâu để nhảy vào ô tìm kiếm.
  - Nhấn `Esc` để xóa chữ và thoát chế độ tìm kiếm.

---

### HẠNG MỤC 2: HỖ TRỢ ĐA NGÔN NGỮ (TIẾNG VIỆT & TIẾNG ANH) — CHỐNG NHẢY GIAO DIỆN (ZERO LAYOUT SHIFT)
#### 1. Nghiên cứu vấn đề Layout Shift khi đổi ngôn ngữ
- Tiếng Anh và Tiếng Việt có độ dài từ khác biệt lớn:
  - *"Đang làm"* (8 ký tự) vs *"In Progress"* (11 ký tự).
  - *"Bản đồ nhịp độ"* (14 ký tự) vs *"Rhythm Heatmap"* (14 ký tự).
  - *"Công việc"* (9 ký tự) vs *"Tasks"* (5 ký tự).
- Nếu layout sử dụng flexbox không có ràng buộc kích thước tối thiểu (`min-w`), khi chuyển ngôn ngữ các nút sẽ co giật, đẩy lệch vị trí logo và các nút bên cạnh, vi phạm tiêu chuẩn **Cumulative Layout Shift (CLS)** của Google Core Web Vitals.
#### 2. Best-Practice áp dụng
- **Kiến trúc Type-Safe i18n siêu nhẹ (Zero Dependency):**
  - Tạo `src/i18n/types.ts`, `src/i18n/vi.ts`, `src/i18n/en.ts`.
  - Hook `useLanguage()` lưu trạng thái vào `localStorage` (`stride_tasks_language`).
- **Kỹ thuật thiết kế chống nhảy giao diện:**
  - Header và các tab điều khiển dùng `min-w-[...]` và `justify-center` hoặc `grid` cân bằng để khi từ ngữ thay đổi độ dài, khung bao ngoài vẫn giữ nguyên vị trí pixel cố định.
  - Số liệu luôn dùng font monospace định dạng `font-mono tabular-nums` để số 1 không hẹp hơn số 8.
  - Nút chuyển nhanh `EN | VI` thiết kế nhỏ gọn, tinh tế ngay trên Header hoặc trong Menu Tuỳ biến.

---

### HẠNG MỤC 3: HỆ THỐNG NHẮC VIỆC LIÊN TỤC (SMART ACTIVITY REMINDER)
#### 1. Nghiên cứu hành vi & Vấn đề Notification Fatigue
- Nếu thông báo quá dồn dập, người dùng sẽ chặn (Block) thông báo vĩnh viễn.
- Nếu chỉ dùng Web Notification API, khi người dùng dùng trên trình duyệt di động (như Safari iOS) hoặc tắt quyền thông báo, tính năng hoàn toàn vô dụng.
- Bug cũ trong code: `useTaskManager.ts` truyền mảng rỗng `[]` vào hook `useCelebrationAndStreak([])` nên bộ đếm công việc tồn đọng luôn bằng 0.
#### 2. Best-Practice áp dụng
- **Sửa dứt điểm bug:** Truyền đúng `crud.projects` vào hook để theo dõi thời gian thực danh sách việc chưa xong.
- **Hệ thống thông báo 2 tầng (Dual-Layer Reminder):**
  1. **Tầng 1 - Web Notifications (Khi tab chạy ngầm/chuyển cửa sổ khác):**
     - Gửi thông báo hệ thống: *"🎯 Stride Tasks: Bạn còn X công việc chưa hoàn thành. Ưu tiên tiếp theo: [Tên việc]"*.
  2. **Tầng 2 - In-App Ambient Reminder Banner (Khi đang mở app):**
     - Một thanh thông báo nhỏ ghim nhẹ nhàng, nhắc nhở: *"Còn X việc cần giải quyết hôm nay"*.
- **Tùy chỉnh tần suất nhắc nhở:**
  - Cho phép người dùng chọn chu kỳ: **15 phút**, **30 phút**, **1 giờ**, hoặc **Tắt**.
  - Tự động ghi nhớ thời điểm đã thông báo lần cuối để không spam lặp lại.

---

### HẠNG MỤC 4: BẢNG TÙY BIẾN HIỂN THỊ — CHẾ ĐỘ ZEN MODE (PROGRESSIVE DISCLOSURE)
#### 1. Nghiên cứu hành vi: Giải quyết cảm giác "ngợp nút"
- Người dùng khi mới vào trang thường bị choáng ngợp bởi hàng loạt nút bấm:
  - *Focus Mode, Reminder, Stats Panel, Backup, Guide, Mute, Theme, Add Project Bar, Filter Tabs, Search, Batch Paste...*
- Mỗi người dùng có một sở thích khác nhau:
  - Nhóm thích **Zen/Minimal**: Chỉ muốn thấy danh sách việc cần làm và ô nhập việc, không muốn thấy biểu đồ hay nút chức năng thừa.
  - Nhóm thích **Power User**: Muốn bật hết cả bản đồ Heatmap, chuỗi Streak, chế độ tập trung.
#### 2. Best-Practice áp dụng (Học từ Apple HIG & Obsidian Settings)
- Xây dựng **Menu Tùy Biến Giao Diện (Customize View & Zen Mode)**:
  - Công tắc **Chế độ Zen Mode**: Một chạm biến toàn bộ giao diện thành trang giấy trắng tinh khiết chỉ có danh sách việc.
  - Các công tắc tùy chọn hiển thị chi tiết (Toggles):
    - [x] Hiện/Ẩn Bản đồ nhịp độ & Thống kê (Analytics Panel)
    - [x] Hiện/Ẩn Nút Chế độ tập trung (Focus Mode)
    - [x] Hiện/Ẩn Nút Nhắc nhở định kỳ (Reminder)
    - [x] Hiện/Ẩn Huy hiệu chuỗi ngày liên tục (Streak Flame)
    - [x] Hiện/Ẩn Thanh tạo nhanh dự án (Add Project Bar)
    - [x] Hiện/Ẩn Bộ lọc trạng thái (All / Doing / Completed)
    - [x] Hiện/Ẩn Nút âm thanh & trợ giúp
  - Toàn bộ tùy chọn được lưu tự động vào `localStorage` (`stride_tasks_view_settings`).

---

## 3. CHECKLIST CÁC BƯỚC TRIỂN KHAI (TODO EXECUTION ROADMAP)

- [ ] **PHẦN 1: Quản lý & Tính toán Lịch sử Hoàn thành (Activity Log CRUD)**
  - [ ] Thêm hàm `deleteLog(logId)` và `clearAllLogs()` trong `useActivityLog.ts`.
  - [ ] Thêm nút icon thùng rác nhỏ ở mỗi hàng trong `CompletedTasksTable.tsx` với tooltip xác nhận.
  - [ ] Thêm nút "Dọn sạch lịch sử" kèm hộp thoại xác nhận an toàn.
  - [ ] Kiểm tra phản ứng tức thì của Heatmap và các thẻ chỉ số (Tuần này, Hôm nay, Tổng).

- [ ] **PHẦN 2: Hệ thống Song ngữ i18n (Tiếng Việt & Tiếng Anh)**
  - [ ] Tạo `src/i18n/types.ts` định nghĩa từ điển ngôn ngữ.
  - [ ] Tạo `src/i18n/vi.ts` và `src/i18n/en.ts` với thuật ngữ chuẩn xác, thanh thoát.
  - [ ] Tạo hook `useLanguage.ts` quản lý chuyển đổi ngôn ngữ và lưu `localStorage`.
  - [ ] Áp dụng vào Header, Action Bar, Stats Panel, Project Cards và Modals.
  - [ ] Kiểm tra CSS để đảm bảo 0% Layout Shift khi đổi qua lại giữa EN và VI.

- [ ] **PHẦN 3: Nâng cấp Tìm kiếm Sâu (Deep Omni-Search)**
  - [ ] Nâng cấp logic lọc: Quét cả Project Name, Task Title, và tất cả Subtasks đệ quy.
  - [ ] Bổ sung cơ chế `auto-expand`: Tự động mở bung các cây công việc có chứa kết quả tìm kiếm.
  - [ ] Tạo component `HighlightedText` bôi sáng từ khóa tìm kiếm.
  - [ ] Gắn phím tắt `/` hoặc `Ctrl+K` để focus nhanh vào ô tìm kiếm, phím `Esc` để xóa tìm kiếm.

- [ ] **PHẦN 4: Hệ thống Nhắc nhở Thông minh (Smart Reminder)**
  - [ ] Sửa lỗi truyền mảng rỗng: Nối đúng dữ liệu `crud.projects` vào logic reminder.
  - [ ] Cung cấp tùy chọn tần suất nhắc: 15 phút, 30 phút, 1 giờ.
  - [ ] Xây dựng In-App Ambient Reminder Toast/Banner khi người dùng không dùng Web Notification.
  - [ ] Gửi thông báo kèm số lượng việc đang dở và tên công việc ưu tiên hàng đầu.

- [ ] **PHẦN 5: Bảng Tùy biến Hiển thị & Chế độ Zen Mode**
  - [ ] Tạo hook `useViewPreferences.ts` lưu trạng thái các thành phần giao diện.
  - [ ] Tạo Modal/Popover "Tùy biến hiển thị" (View Settings) với các nút bật/tắt trực quan.
  - [ ] Thêm chế độ "Zen Mode" (1 click chuyển sang giao diện siêu tối giản).
  - [ ] Kết nối trạng thái hiển thị vào Header, Main và Action Bar.

- [ ] **PHẦN 6: Kiểm thử, Tối ưu & Đóng gói Production**
  - [ ] Chạy `npm run lint` (`tsc --noEmit`) kiểm tra toàn bộ kiểu dữ liệu TypeScript.
  - [ ] Chạy `npm run build` kiểm tra bundle Vite.
  - [ ] Kiểm tra hiển thị thực tế trên cả giao diện Desktop và Mobile.
  - [ ] Cập nhật tài liệu `README.md` và `ARCHITECTURE.md`.
