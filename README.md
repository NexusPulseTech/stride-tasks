# 🎯 Solo Tasks - Minimalist Personal Project & Task Manager

> **Ứng dụng quản lý công việc và dự án cá nhân tối giản, hiệu suất cao, 100% Local-First & Hoạt động Offline.**  
> Kết hợp tinh hoa thiết kế của **Notion** (Cây việc con đa tầng đệ quy), **Linear** (Chu trình trạng thái tinh gọn), **Apple Reminders** (Typography & Zero-pill discipline) cùng **Bản đồ nhịp độ năng suất & Khoe thành tích làm việc**.

---

## ✨ Điểm Nổi Bật (Key Features)

### 1. 🌲 Việc Con Vô Hạn Tầng (Notion-style Infinite Subtask Tree)
- **Phân rã công việc đa cấp**: Chia nhỏ mục tiêu lớn thành các giai đoạn, mỗi giai đoạn chứa các việc nhỏ và các bước thực thi lồng nhau không giới hạn.
- **Kéo thả sắp xếp việc con độc lập**: Hỗ trợ kéo thả reorder việc con mượt mà, cô lập ngữ cảnh kéo thả, không xung đột với việc cha.
- **Chỉnh sửa trực tiếp 1 chạm (Click-to-Edit)**: Nhấp trực tiếp vào bất kỳ tiêu đề việc hoặc việc con để chỉnh sửa ngay lập tức, không cần icon thừa.
- **Tính toán tiến độ tự động**: Tự động tính tỷ lệ hoàn thành (Bubble Up Rollup & Cascade Down).

### 2. 📊 Bản Đồ Nhịp Độ Năng Suất & Nhật Ký Việc Đã Xong (Productivity Rhythm & Log)
- **Bản đồ nhiệt độ làm việc (Rhythm Heatmap)**:
  - `0 việc`: Ô trung tính không màu.
  - `1 việc`: Xanh nhẹ (`level 1`).
  - `2 việc`: Xanh vừa (`level 2`).
  - `3 việc`: Xanh sáng (`level 3`).
  - `4+ việc`: Xanh đậm (`level 4`).
- **Bảng danh sách công việc đã hoàn thành**:
  - Xem bảng chi tiết tất cả việc đã làm, phân loại theo ngày, tuần này, tháng này.
  - Lọc việc theo ngày tương ứng chỉ bằng 1 chạm trên bản đồ nhịp độ.
- **Theo dõi chuỗi ngày liên tục (Streak)** và kỷ lục ngày hoàn thành nhiều việc nhất.

### 3. 🚀 Khoe Thành Tích & Chia Sẻ Năng Suất (Share & Flex Card)
- **Tạo thẻ ảnh Flex thành tích tự động**: Thiết kế tối giản, sang trọng, tổng hợp số việc đã hoàn thành trong tuần/tháng, chuỗi ngày streak và danh sách việc tiêu biểu.
- **Xuất ảnh PNG 2x Retina & Sao chép nhanh**: 1-click tải ảnh thẻ về máy hoặc sao chép thẳng vào Clipboard để dán ngay vào Zalo, Facebook, Slack, Discord.
- **Nội dung bài viết ngắn**: Tự động sinh văn bản tóm tắt sẵn sàng đăng mạng xã hội.

### 4. ⚡ Trạng Thái Tinh Gọn (Linear-style Status Flow)
- Chuyển đổi trạng thái 1-click qua 3 nấc: **Chờ làm** (`todo`) ➔ **Đang làm** (`doing`) ➔ **Đã xong** (`done`).
- Phím tắt bàn phím tiện lợi, thanh điều hướng nhanh.

### 5. 🔒 Quyền Riêng Tư & Hoạt Động Offline (100% Local-First)
- Toàn bộ dữ liệu được lưu cục bộ trên trình duyệt (`LocalStorage`).
- **Sao lưu & Phục hồi JSON**: Xuất/nhập dữ liệu chỉ trong 1 giây.
- **Xuất tệp HTML Offline**: Tải file HTML duy nhất chạy hoàn toàn độc lập mà không cần máy chủ hay internet.
- Hỗ trợ PWA (Progressive Web App), cài đặt lên màn hình chính điện thoại (iOS & Android).

### 6. 🎨 Giao Diện Tối Giản Chuẩn Apple HIG & Chống "AI Slop"
- Hỗ trợ chế độ Sáng / Tối / Tự động theo hệ thống (`Light`, `Dark`, `System`).
- Âm thanh chúc mừng nhẹ nhàng (Web Audio Synth Chime) và hiệu ứng pháo hoa khi hoàn thành toàn bộ dự án.
- Chế độ tập trung (Focus Mode): Ẩn toàn bộ việc đã xong để tập trung 100% vào việc còn dở.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

| Công nghệ | Phiên bản | Vai trò |
| :--- | :--- | :--- |
| **React** | `v19` | Thư viện UI hiện đại, hiệu năng cao |
| **TypeScript** | `v5.7+` | Kiểm soát kiểu tĩnh chặt chẽ |
| **Tailwind CSS** | `v4` | Hệ thống styling Atomic CSS thế hệ mới |
| **Vite** | `v6` | Bộ công cụ build & dev server siêu tốc |
| **Lucide React** | `v0.546+` | Bộ icon SVG tối giản, thanh mảnh |

---

## 🚀 Khởi Chạy Nhanh (Quick Start)

### Yêu cầu môi trường
- **Node.js**: phiên bản `>= 18.0.0`
- **npm** hoặc **bun** / **pnpm** / **yarn**

### Cài đặt và chạy ứng dụng

```bash
# 1. Clone repository
git clone https://github.com/your-username/solo-tasks-manager.git
cd solo-tasks-manager

# 2. Cài đặt các gói phụ thuộc
npm install

# 3. Chạy môi trường phát triển (Development)
npm run dev

# 4. Kiểm tra kiểu và linter
npm run lint

# 5. Build bản Production
npm run build
```

---

## ⌨️ Phím Tắt Tiện Dụng (Keyboard Shortcuts)

| Phím tắt | Thao tác |
| :--- | :--- |
| `/` | Mở nhanh ô tìm kiếm công việc |
| `Alt` + `F` | Bật / tắt chế độ Tập trung (Focus Mode) |
| `Alt` + `T` | Đổi giao diện Sáng / Tối / Hệ thống |
| `Alt` + `B` | Mở hộp thoại Sao lưu & Phục hồi dữ liệu |
| `Alt` + `N` | Thêm công việc mới nhanh (trên Mobile) |
| `Escape` | Đóng menu, đóng modal hoặc hủy chỉnh sửa |
| `Enter` | Lưu tiêu đề đang chỉnh sửa inline |

---

## 📁 Cấu Trúc Dự Án (Project Structure)

```text
├── public/                 # Tệp tĩnh, Web Manifest, standalone HTML
├── docs/                   # Thư viện tài liệu kỹ thuật chi tiết
├── src/
│   ├── components/         # Các thành phần dùng chung (Header, Footer, Menu, UI)
│   ├── features/
│   │   ├── analytics/      # Bản đồ nhịp độ (Activity Heatmap) & thống kê số liệu
│   │   ├── focus/          # Chế độ tập trung Focus Banner
│   │   ├── modals/         # Hộp thoại hướng dẫn, sao lưu, feedback
│   │   └── tasks/          # Quản lý dự án, TaskItem, SubTaskRow, Drag&Drop
│   ├── hooks/              # Custom React hooks (theme, keyboard shortcuts)
│   ├── types/              # Định nghĩa kiểu dữ liệu TypeScript
│   ├── utils/              # Tiện ích âm thanh, haptic, clipboard
│   ├── App.tsx             # Giao diện chính của ứng dụng
│   └── main.tsx            # Entry point của React
├── ARCHITECTURE.md         # Sổ tay kiến trúc hệ thống chuyên sâu
└── package.json
```

---

## 📖 Tài Liệu Chi Tiết (Full Documentation)

Để tìm hiểu sâu hơn về kiến trúc giải thuật và quy chuẩn phát triển:
- [Sổ tay kiến trúc hệ thống (`ARCHITECTURE.md`)](./ARCHITECTURE.md)
- [Cẩm nang người dùng & hướng dẫn chi tiết (`docs/guides/user-guide.md`)](./docs/guides/user-guide.md)
- [Quy chuẩn kích thước tệp $\le$ 300 dòng (`docs/standards/file-size-and-modularity.md`)](./docs/standards/file-size-and-modularity.md)

---

## 📄 Bản Quyền (License)

Dự án phát hành theo giấy phép [MIT License](./LICENSE). Hoàn toàn tự do sử dụng cho mục đích cá nhân và thương mại.
