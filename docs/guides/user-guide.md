# Hướng Dẫn Sử Dụng & Cơ Chế Lưu Trữ (User Guide & Storage Architecture)

Tài liệu này cung cấp hướng dẫn chi tiết về các thao tác, cơ chế lưu trữ dữ liệu an toàn trên thiết bị và cách cài đặt Stride Tasks trên mọi nền tảng.

---

## 1. Dữ Liệu Được Lưu Ở Đâu? (Cơ Chế Local-First & Storage)

### 1.1. Ứng dụng có cần máy chủ (Server) hay Database trên Cloud không?
- **Không.** Stride Tasks hoạt động theo kiến trúc **100% Local-First & Zero-Knowledge**. Toàn bộ dữ liệu của bạn không gửi đến bất kỳ máy chủ nào.
- Ứng dụng lưu trữ trực tiếp vào **phân vùng ổ cứng của thiết bị** thông qua cơ chế `LocalStorage` (dưới dạng SQLite / LevelDB do trình duyệt quản lý).

### 1.2. Vị trí thực tế của tệp dữ liệu trên ổ cứng máy:
- **Windows (Chrome / Edge / Desktop App)**:
  `C:\Users\<Tên_bạn>\AppData\Local\Google\Chrome\User Data\Default\Local Storage\leveldb\`
- **macOS (Chrome / Safari)**:
  `~/Library/Application Support/Google/Chrome/Default/Local Storage/leveldb/`
- **Android (Chrome / PWA)**:
  Thư mục Private Data của Chrome trong chip nhớ của máy (`/data/data/com.android.chrome/app_chrome/Default/Local Storage/`).
- **iOS (iPhone / iPad Safari PWA)**:
  Phân vùng bộ nhớ Sandbox bảo mật riêng biệt của Safari trên chip nhớ iPhone.

### 1.3. Dữ liệu có bị mất khi tắt máy hoặc mất mạng không?
- **Hoàn toàn không.** Dữ liệu đã được ghi vĩnh viễn vào chip nhớ/ổ cứng máy. Bạn có thể rút mạng, bật chế độ máy bay hoặc khởi động lại máy, dữ liệu vẫn nguyên vẹn 100%.

### 1.4. Cách sao lưu và chuyển dữ liệu sang thiết bị khác:
- Bấm nút **"Sao lưu dữ liệu"** (biểu tượng đám mây/mũi tên hoặc phím `Alt + B`).
- Chọn **"Tải file JSON dự phòng"**: Tệp chứa toàn bộ dự án, công việc và lịch sử hoàn thành sẽ được tải về.
- Ở thiết bị mới, mở Stride Tasks, vào mục Sao lưu và chọn **"Khôi phục từ file JSON"**.

---

## 2. Hướng Dẫn Cài Đặt Trên Các Thiết Bị (Installation Guide)

### 2.1. Cài đặt trên Điện thoại iPhone (iOS)
1. Mở liên kết ứng dụng trên trình duyệt **Safari**.
2. Bấm nút **Chia sẻ** (biểu tượng ô vuông có mũi tên hướng lên ở thanh điều hướng).
3. Cuộn xuống và chọn **"Thêm vào Màn hình chính" (Add to Home Screen)**.
4. Đặt tên hiển thị (mặc định là *Stride Tasks*) và bấm **Thêm (Add)**.
5. **Trải nghiệm**: Biểu tượng app xuất hiện ngoài màn hình chính. Khi mở, toàn bộ thanh địa chỉ Safari biến mất, app chạy toàn màn hình, mượt mà và hoạt động offline như ứng dụng tải từ App Store.

### 2.2. Cài đặt trên Điện thoại Android
1. Mở liên kết ứng dụng trên trình duyệt **Google Chrome**.
2. Bấm thông báo **"Cài đặt Stride Tasks"** xuất hiện ở chân trang, hoặc bấm menu 3 chấm góc trên bên phải và chọn **"Cài đặt ứng dụng"** (Install App).
3. Bấm xác nhận **Cài đặt**.
4. **Trải nghiệm**: App được cài đặt vào hệ thống, có icon riêng trong danh sách ứng dụng, khởi chạy độc lập và không phụ thuộc kết nối Internet.

### 2.3. Cài đặt trên Máy Tính (Windows / macOS / Linux)
- **Cách 1: Cài dạng Desktop App qua Chrome hoặc Microsoft Edge (Khuyên dùng)**:
  1. Mở ứng dụng trên Chrome hoặc Edge.
  2. Bấm vào biểu tượng **Cài đặt** (hình máy tính nhỏ có mũi tên xuống ở góc phải thanh địa chỉ URL).
  3. Chọn **Cài đặt**. Ứng dụng sẽ trở thành một cửa sổ Desktop riêng biệt, có icon ở thanh Taskbar/Dock, không có thanh tab duyệt web xao nhãng.
- **Cách 2: Sử dụng bản Portable HTML (Không cần cài đặt)**:
  1. Bấm nút **Tải 1 file HTML duy nhất** ở góc trên thanh công cụ Header.
  2. Lưu file `stride-tasks-offline.html` vào máy tính hoặc USB.
  3. Nhấp đúp chuột là mở ứng dụng dùng vĩnh viễn không cần mạng.

---

## 3. Các Thao Tác Quản Lý Công Việc & Dự Án

1. **Thêm dự án mới**: Nhập tên dự án vào ô tạo nhanh ở đầu trang hoặc bấm `+ Tạo dự án`.
2. **Thêm công việc**: Gõ tiêu đề công việc vào ô nhập dưới dự án, nhấn `Enter` để lưu và tự động chuyển sang dòng tiếp theo.
3. **Mở rộng / Thu gọn việc con (Notion Navigation)**:
   - Bấm vào mũi tên Caret (`▶`) trên dòng công việc để mở danh sách bước con.
   - Bấm lại (`▼`) để thu gọn.
4. **Tạo cây việc con đệ quy (Recursive Subtasks)**:
   - Di chuột vào công việc bất kỳ và bấm biểu tượng `+` để thêm bước con.
   - Hỗ trợ phân rã việc con đa tầng không giới hạn.
5. **Cơ chế hoàn thành thông minh (Cascade & Rollup)**:
   - **Bọt khí nổi (Rollup)**: Khi hoàn thành 100% các bước con bên trong, bước cha và công việc gốc sẽ tự động chuyển sang trạng thái **Đã xong** và ghi nhận vào lịch sử nhịp độ.
   - **Thác đổ (Cascade)**: Khi đánh dấu việc cha đã xong, toàn bộ việc con bên trong tự động hoàn thành theo.
6. **Nhập hàng loạt (Batch Paste)**:
   - Bấm nút `Dán việc` trên thanh công cụ dự án.
   - Dán danh sách công việc thô hoặc Markdown (`- [ ]`, `1.`, `2.`), hệ thống tự động bóc tách thành các đầu việc riêng biệt.

---

## 4. Hệ Thống Phím Tắt Tiện Lợi (Keyboard Shortcuts)

| Phím tắt | Tác dụng |
| :--- | :--- |
| `/` | Đặt con trỏ chuột vào ô tìm kiếm nhanh công việc |
| `Alt` + `F` | Bật / Tắt Chế độ tập trung (Focus Mode) |
| `Alt` + `T` | Chuyển đổi giao diện (Sáng / Tối / Tự động) |
| `Alt` + `B` | Mở hộp thoại Sao lưu & Phục hồi dữ liệu |
| `Alt` + `N` | Mở nhanh hộp thoại thêm công việc mới (Mobile) |
| `Enter` | Lưu tiêu đề đang chỉnh sửa inline |
| `Escape` | Hủy chỉnh sửa, đóng menu ngữ cảnh hoặc đóng hộp thoại |