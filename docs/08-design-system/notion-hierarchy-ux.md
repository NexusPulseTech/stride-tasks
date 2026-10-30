# 4. Notion Hierarchy UX & Compact Layout Specs

## 4.1. Triết Lý Notion Sub-items Tree & Caret Navigation

Theo nghiên cứu từ **Notion Database Sub-items UX** và **Linear Hierarchical Issues**:
1. **Phân biệt rạch ròi giữa Hành Động Hoàn Thành và Điều Hướng Cây**:
   - **Nút Caret Điều Hướng (`ChevronRight` rotated 90°)**: Chuyên trách mở rộng hoặc thu gọn cây việc con.
   - **Checkbox (`Circle` / `Check`)**: Chuyên trách đánh dấu hoàn thành.
   - Không gộp chung 2 hành động này để tránh việc người dùng muốn xem việc con lại vô tình tích hoàn thành cả việc lớn!
2. **Cơ chế Toggle Tức Thời**:
   - Khi có việc con: Nút mũi tên `▶` luôn hiển thị rõ ràng. Bấm vào mũi tên sẽ xoay thành `▼` và sổ ra các việc con ngay dưới dòng việc cha. Bấm lại sẽ thu gọn lập tức.
   - Khi chưa có việc con: Rê chuột hiển thị nút `+` tinh gọn, bấm vào sẽ mở ngay ô nhập việc con đầu tiên.

---

## 4.2. Tối Ưu Hóa Khoảng Cách (Compact 4pt/8pt Spacing Grid)

Tuân thủ nghiêm ngặt chuẩn **Apple Human Interface Guidelines** và **Linear Design**:
- **Không tạo khoảng trắng rác (Zero Wasted Space)**: Loại bỏ các tiêu đề chiếm dụng chiều cao không cần thiết như `"DANH SÁCH VIỆC CON"`.
- **Tỷ lệ chiều cao dòng (Leading)**: Sử dụng `leading-tight` hoặc `leading-snug` cho tiêu đề và việc con, tránh khoảng trống thừa giữa các dòng chữ.
- **Lưới Padding**:
  - Hàng Task cha: `py-1.5 px-2 sm:px-2.5`
  - Hàng Subtask con: `py-0.5 px-1` (chiều cao tối thiểu 26px cho vùng chạm ngón tay).
  - Khoảng cách giữa các hàng con: `space-y-0.5`.

---

## 4.3. Hiển Thị Đầy Đủ & Bộ Lọc Nhanh (Inclusive Historical View)

- Mặc định ở chế độ **Tất cả (All)**: Danh sách luôn hiển thị đầy đủ mọi đầu việc con (cả việc đã xong và chưa xong).
  - Việc đã xong: Có gạch ngang (`line-through`) và làm mờ tinh tế (`text-slate-400 dark:text-slate-500`).
  - Việc chưa xong: Nổi bật rõ ràng (`text-slate-800 dark:text-slate-200`).
- Bộ lọc Micro 3 tab (`Tất cả` · `Cần làm` · `Đã xong`) chỉ xuất hiện khi số lượng việc con $> 1$, đặt gọn gàng ở góc phải không chiếm dụng chiều dọc.
