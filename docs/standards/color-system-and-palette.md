# Quy Chuẩn Thiết Kế Màu Sắc & Bảng Màu Tinh Gọn (Color System & Palette Standard)

> **Tài liệu nghiên cứu & chuẩn hóa từ các sản phẩm hàng đầu**: Notion Design System, Google Keep (Material 3 Expressive), Linear.app High-Contrast Minimalist, và Apple Human Interface Guidelines (Color & Contrast).

---

## 1. Nghiên Cứu: Tại Sao Notion, Google Keep & Linear Dùng Bảng Màu Cực Kỳ Đơn Giản?

### 1.1. Triết Lý "Content is King, UI Chrome is Invisible" (Nội Dung Là Tâm Điểm, Giao Diện Phải Vô Hình)
Trong các phần mềm ghi chú, quản lý công việc và tư duy sâu (Productivity & Deep Work Tools):
* **Mục đích của người dùng**: Tập trung toàn bộ tâm trí vào nội dung của họ (dự án, nhiệm vụ, ý tưởng cá nhân).
* **Nếu giao diện quá nhiều màu sắc (Rainbow / Candy UI)**:
  * Nút bấm màu vàng, viền màu cam, banner gradient rực rỡ, icon tím, thanh trạng thái xanh lá... sẽ liên tục tranh giành sự chú ý thị giác với nội dung công việc.
  * Hiện tượng này trong tâm lý học thiết kế gọi là **Cognitive Overload (Quá tải nhận thức)** và **Visual Fatigue (Mỏi mệt thị giác)**.
* **Cách các ông lớn giải quyết**:
  * **Notion**: Toàn bộ ứng dụng được xây dựng như một tờ giấy trắng cao cấp (Moleskine canvas). 95% diện tích là màu nền trung tính (`#FFFFFF` trên Light, `#2F3437` trên Dark), chữ xám đen than (`#37352F`), đường viền siêu mỏng (`#E9E9E8`). Màu sắc chỉ xuất hiện khi người dùng cố ý highlight hoặc gắn tag phân loại.
  * **Linear.app**: Ứng dụng quản lý dự án được đánh giá có UX đẹp nhất thế giới sử dụng bảng màu gần như đơn sắc (Near-Monochromatic Palette). Toàn bộ thanh công cụ, icon, filter đều dùng các sắc độ xám trung tính (Gray Ladder: `#08090A`, `#141516`, `#D0D6E0`). Linear chỉ dành duy nhất 1 màu nhấn (Brand Accent: Indigo `#5E6AD2`) cho tương tác trọng yếu (CTA / Active Ring).
  * **Google Keep**: Giao diện chính hoàn toàn trắng xám tối giản theo Material 3. Màu sắc chỉ xuất hiện ở các thẻ ghi chú và đều là các gam màu **Pastel khử bão hòa (Desaturated Pastels: Sand, Chalk, Mint, Fog, Coral)** với độ sáng cao để chữ màu đen luôn đạt độ tương phản chuẩn WCAG AA mà không gây chói mắt.

---

## 2. Quy Tắc Vàng 60 - 30 - 10 Trong Product Design

| Tỷ Lệ | Vai Trò | Triển Khai Trong Solo Checklist | Bảng Mã Màu |
|---|---|---|---|
| **60%** | **Bề mặt nền chủ đạo (Dominant Neutral Surface)** | Nền canvas trang, nền thẻ dự án, nền modal | Light: `#F8F9FA` / `#FFFFFF`<br>Dark: `#0B0F17` / `#161B22` |
| **30%** | **Cấu trúc phân tầng (Structural Hierarchy)** | Chữ chính, chữ phụ, viền mỏng hairline, thanh cuộn | Primary Text: `#0F172A` / `#F8FAFC`<br>Secondary Text: `#64748B` / `#94A3B8`<br>Borders: `#E2E8F0` / `#1E293B` |
| **10%** | **Màu tương tác & Nhấn có chủ đích (Intentional Accent)** | Checkbox khi hoàn thành, phím tắt active, trạng thái đang làm | Monochrome Active: `#0F172A` / `#F8FAFC`<br>Success: `#34C759` (Apple Green)<br>Status Active: Slate-900 / Slate-100 |

---

## 3. Chống Lỗi Thiết Kế "Rainbow Slop" (Kẹo Ngọt Lòe Loẹt)

### ❌ Các lỗi đã được loại bỏ triệt để:
1. **Bỏ nút Focus màu vàng chanh chói lóa**:
   - *Trước đây*: Nút "Tập trung" dùng nền `bg-amber-400 text-slate-950` gây cảm giác như nút cảnh báo nguy hiểm.
   - *Chuẩn Notion/Linear*: Chuyển sang nút tương phản cao `bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950`, biểu tượng Target xám thanh lịch.
2. **Bỏ Banner Zen Mode có Gradient Vàng-Cam**:
   - *Trước đây*: Gradient `from-amber-500/10 via-amber-400/15 to-orange-500/10` phá vỡ sự tĩnh lặng cần có của chế độ tập trung.
   - *Chuẩn Notion/Linear*: Banner Zen Mode có bề mặt trắng/đen trung tính, viền hairline thanh mảnh, số việc dở dang đặt trong nhãn xám dịu mắt.
3. **Bỏ chân trang (Footer) mỗi nút một màu**:
   - *Trước đây*: Nút Sáng màu vàng, nút Tối màu tím chàm.
   - *Chuẩn Apple HIG*: Cụm Segmented Switcher đơn sắc đồng nhất; nút đang chọn có nền trắng/xám đậm nổi khối nhẹ `shadow-2xs`.
4. **Bỏ bảng thống kê đa sắc (Stats Panel)**:
   - *Trước đây*: Ô "Đang làm" màu vàng, ô "Xong" màu xanh lá, ô "Dự án" màu xám.
   - *Chuẩn Linear*: Cả 4 ô dùng chung phong cách thẻ trung tính với con số to rõ, nhãn xám tinh tế.
5. **Bỏ nền vàng của Tiêu điểm ưu tiên (Pinned Section)**:
   - Chuyển thành section header chuẩn Notion ("Tiêu điểm ưu tiên") với thẻ công việc đồng nhất về chất liệu.

---

## 4. Bảng Tra Cứu Mã Màu Chuẩn Trong Solo Checklist

### 4.1. Bảng Màu Bề Mặt & Nền (Surfaces & Canvas)
* **Light Mode**:
  * Canvas chính: `#F8F9FA` (`bg-slate-50`)
  * Thẻ dự án / Modal: `#FFFFFF` (`bg-white`)
  * Bề mặt cấp 2 (Input, Khung con): `#F1F5F9` (`bg-slate-100`)
* **Dark Mode**:
  * Canvas chính: `#0B0F17` (Deep Midnight)
  * Thẻ dự án / Modal: `#161B22` (GitHub / Linear Dark Surface)
  * Bề mặt cấp 2 (Input, Khung con): `#1F2937` (`bg-slate-800`)

### 4.2. Bảng Màu Văn Bản (Typography Contrast)
* **Primary Text (Tiêu đề, tên việc)**:
  * Light: `text-slate-900` (`#0F172A`) — Độ tương phản 15:1 với nền trắng (vượt chuẩn WCAG AAA).
  * Dark: `text-slate-100` (`#F1F5F9`) — Dịu mắt, không dùng màu trắng tuyệt đối `#FFFFFF` để tránh chói trong bóng tối.
* **Secondary Text (Metadata, đếm số việc)**:
  * Light: `text-slate-500` (`#64748B`)
  * Dark: `text-slate-400` (`#94A3B8`)

### 4.3. Đường Kẻ Phân Cách (Hairline Dividers)
* Light: `border-slate-200/90` (`#E2E8F0`) độ dày 1px.
* Dark: `border-slate-800` (`#1E293B`) độ dày 1px.
