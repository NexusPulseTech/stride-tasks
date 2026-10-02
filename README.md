# Stride Tasks

<p align="left">
  <img src="https://img.shields.io/badge/Release-v1.0.3-emerald?style=flat-square" alt="Release v1.0.3" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="License MIT" />
  <img src="https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.7+-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/Architecture-Local--First-success?style=flat-square" alt="Local-First" />
</p>

> **Ứng dụng quản lý công việc và dự án cá nhân tối giản, 100% Local-First và hoạt động Offline.**
> Xây dựng theo nguyên lý thiết kế tối giản: cấu trúc việc con đệ quy (Recursive Subtask Tree), chu trình trạng thái dứt khoát (Linear Status Flow), bản đồ nhịp độ hoàn thành (Activity Rhythm Heatmap) và xuất báo cáo năng suất độ nét cao.

[Web App](https://nexuspulsetech.github.io/stride-tasks/) · [Windows Desktop Release v1.0.3](https://github.com/NexusPulseTech/stride-tasks/releases/tag/v1.0.3)

---

## Tính Năng Chính (Core Features)

### 1. Cấu Trúc Cây Việc Con Đệ Quy (Infinite Subtasks)
- **Phân rã đa tầng**: Hỗ trợ chia nhỏ mục tiêu thành các giai đoạn và đầu việc con lồng nhau không giới hạn.
- **Kéo thả độc lập**: Kéo thả sắp xếp thứ tự công việc con mượt mà với ngữ cảnh độc lập, không xung đột với công việc cha.
- **Chỉnh sửa trực tiếp (Inline Editing)**: Nhấp trực tiếp vào tiêu đề để đổi tên nhanh chóng, hỗ trợ phím tắt Enter để lưu và Escape để hủy.
- **Tính toán tiến độ tự động**: Đồng bộ tỷ lệ phần trăm hoàn thành theo mô hình hai chiều (Rollup và Cascade).

### 2. Bản Đồ Nhịp Độ & Lịch Sử Hoàn Thành (Activity Rhythm & Completion Log)
- **Biểu đồ nhịp độ (Rhythm Heatmap)**:
  - Phản ánh mật độ công việc hoàn thành theo ngày với 5 mức trực quan.
  - Phân tích chuỗi ngày duy trì liên tục (Current Streak) và kỷ lục ngày năng suất cao nhất.
- **Bảng nhật ký chi tiết**:
  - Tự động ghi nhận thời gian và dự án khi công việc được đánh dấu hoàn thành.
  - Bộ lọc thời gian: Tất cả, Hôm nay, Tuần này, Tháng này hoặc lọc chính xác theo ngày chọn trên Heatmap.

### 3. Chia Sẻ Báo Cáo Năng Suất (Productivity Share Card)
- **Xuất ảnh thẻ tổng kết**: Kết xuất thẻ thống kê số lượng công việc đã hoàn thành, tỷ lệ đạt được và chuỗi ngày streak ở độ phân giải 2x Retina (PNG).
- **Sao chép tức thì**: Hỗ trợ đưa ảnh trực tiếp vào Clipboard để dán vào tài liệu hoặc kênh trao đổi nội bộ.
- **Bản tóm tắt văn bản**: Tạo bản tóm tắt nhanh dạng Markdown/Plain text để chia sẻ tiến độ định kỳ.

### 4. Chu Trình Trạng Thái Tinh Gọn (Status Workflow)
- **3 Trạng thái dứt khoát**: Chờ làm (`todo`) ➔ Đang làm (`doing`) ➔ Đã xong (`done`).
- **Thao tác 1 chạm**: Chuyển trạng thái linh hoạt với chỉ báo màu sắc chuẩn mực.

### 5. Kiến Trúc Cục Bộ & Quyền Riêng Tư (Local-First & Offline)
- **Lưu trữ an toàn trên thiết bị**: Toàn bộ dữ liệu được lưu trên `localStorage` của trình duyệt, không gửi dữ liệu ra máy chủ bên ngoài.
- **Sao lưu và phục hồi JSON**: Xuất và nhập toàn bộ trạng thái hệ thống chỉ với một tệp tin.
- **Xuất bản dạng HTML đơn lẻ**: Tải tệp HTML độc lập để chạy mà không cần kết nối mạng hay cài đặt phần mềm phụ trợ.
- **Hỗ trợ PWA**: Có thể cài đặt trực tiếp lên thiết bị di động (iOS / Android) và máy tính để bàn.

### 6. Giao Diện Tối Giản & Chuẩn Mực Thiết Kế
- **Hệ thống màu sắc & Typography**: Tuân thủ nguyên tắc thị giác nghiêm ngặt, loại bỏ hoàn toàn các thành phần trang trí thừa thãi.
- **Header responsive tối giản**: Hiển thị gọn trên desktop và thiết bị di động, loại bỏ các biểu tượng trang trí không cần thiết.
- **Đa ngôn ngữ**: Chuyển đổi giao diện giữa Tiếng Việt và English.
- **Lịch sử hoàn thành**: Quản lý bản ghi lịch sử, bao gồm chỉnh sửa và xóa.
- **Bố cục ổn định**: Tránh dịch chuyển giao diện khi nội dung hoặc ngôn ngữ thay đổi.
- **Chế độ hiển thị**: Hỗ trợ Sáng (Light), Tối (Dark) và Tự động theo hệ điều hành (System).
- **Chế độ tập trung (Focus Mode)**: Lọc ẩn các mục đã hoàn thành để tối ưu hóa không gian làm việc cho các đầu việc ưu tiên.

---

## Ngăn Xếp Công Nghệ (Tech Stack)

| Công nghệ | Phiên bản | Mục đích sử dụng |
| :--- | :--- | :--- |
| **React** | `19` | Thư viện UI nền tảng |
| **TypeScript** | `7.0+` | Hệ thống kiểm soát kiểu tĩnh nghiêm ngặt |
| **Tailwind CSS** | `4` | Khung styling Atomic CSS hiệu năng cao |
| **Vite** | `8` | Công cụ đóng gói và máy chủ phát triển |
| **Lucide React** | `0.546+` | Hệ thống biểu tượng đồ họa tối giản |

---

## Cài Đặt & Khởi Chạy (Getting Started)

### Yêu cầu hệ thống
- **Node.js**: Phiên bản `>= 18.0.0`
- **npm**, **pnpm**, **yarn** hoặc **bun**

### Các bước thực hiện

```bash
# 1. Sao chép mã nguồn về máy
git clone https://github.com/NexusPulseTech/stride-tasks.git
cd stride-tasks

# 2. Cài đặt các gói phụ thuộc
npm install --legacy-peer-deps

# 3. Khởi chạy máy chủ phát triển
npm run dev

# 4. Kiểm tra kiểu dữ liệu và cú pháp
npm run lint

# 5. Đóng gói bản phát hành sản phẩm
npm run build
```

---

## Danh Mục Phím Tắt (Keyboard Shortcuts)

| Phím tắt | Chức năng thực hiện |
| :--- | :--- |
| `/` | Mở nhanh ô tìm kiếm công việc |
| `Alt` + `F` | Bật / tắt Chế độ tập trung (Focus Mode) |
| `Alt` + `T` | Chuyển đổi giao diện (Sáng / Tối / Tự động) |
| `Alt` + `B` | Mở hộp thoại Sao lưu & Phục hồi dữ liệu |
| `Alt` + `N` | Thêm công việc mới nhanh (giao diện di động) |
| `Escape` | Đóng menu, đóng modal hoặc hủy chỉnh sửa tiêu đề |
| `Enter` | Xác nhận và lưu tiêu đề đang chỉnh sửa |

---

## Cấu Trúc Thư Mục (Project Structure)

```text
├── public/                 # Tệp tĩnh, Web Manifest, standalone HTML
├── docs/                   # Thư mục tài liệu kiến trúc và hướng dẫn
├── src/
│   ├── components/         # Các thành phần giao diện dùng chung (Header, Footer, UI)
│   ├── features/
│   │   ├── analytics/      # Bản đồ nhịp độ (Activity Heatmap) & thống kê số liệu
│   │   ├── focus/          # Chế độ tập trung (Focus Banner)
│   │   ├── modals/         # Hộp thoại hướng dẫn, sao lưu, phản hồi
│   │   └── tasks/          # Cây công việc, việc con, kéo thả, thao tác CRUD
│   ├── hooks/              # Custom hooks (Theme, phím tắt, tương tác)
│   ├── types/              # Định nghĩa kiểu dữ liệu TypeScript
│   ├── utils/              # Tiện ích âm thanh, haptic feedback, clipboard
│   ├── App.tsx             # Giao diện chính của ứng dụng
│   └── main.tsx            # Điểm khởi chạy React DOM
├── ARCHITECTURE.md         # Tài liệu kiến trúc hệ thống
└── package.json            # Cấu hình dự án và danh sách phụ thuộc
```

---

## Tài Liệu Kỹ Thuật (Documentation)

Tham khảo thêm các tài liệu thiết kế chi tiết:
- [Sổ tay kiến trúc hệ thống (`ARCHITECTURE.md`)](./ARCHITECTURE.md)
- [Cẩm nang sử dụng chi tiết (`docs/guides/user-guide.md`)](./docs/guides/user-guide.md)
- [Quy chuẩn mô đun hóa mã nguồn (`docs/standards/file-size-and-modularity.md`)](./docs/standards/file-size-and-modularity.md)

---

## Bản Quyền (License)

Dự án được phân phối theo giấy phép [MIT License](./LICENSE). Hoàn toàn tự do sử dụng cho mục đích cá nhân và thương mại.
