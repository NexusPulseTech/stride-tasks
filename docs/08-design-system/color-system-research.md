# Quy Chuẩn Hệ Màu Tinh Gọn (Notion & Google Keep Minimal Color System)

> **Triết lý tham chiếu**: Notion Design System, Google Keep, Linear Ergonomics, và Apple Human Interface Guidelines.

---

## 1. Tại Sao Các "Ông Lớn" (Notion, Google Keep, Things 3) Lại Dùng Rất Ít Màu?

Trong thiết kế công cụ gia tăng năng suất (Productivity & Thought Tools), **màu sắc bừa bãi là kẻ thù số 1 của sự tập trung (Visual Clutter)**:

### 3 Lý Do Cốt Lõi:
1. **Nội dung của người dùng là trung tâm (Content is King)**: Khung giao diện (UI Shell) phải "vô hình" để tôn vinh suy nghĩ và nhiệm vụ của người dùng, không tranh giành sự chú ý thị giác.
2. **Quy tắc 60 - 30 - 10 trong UI chuyên nghiệp**:
   - **60% Nền trung tính (Dominant Neutral)**: Trắng giấy `#ffffff` / xám ấm `#fbfbfa` (Light) hoặc đen than `#0b0f17` / `#161b22` (Dark).
   - **30% Cấu trúc phụ (Secondary Neutral)**: Viền thẻ `#e2e8f0` / `#30363d`, bề mặt hover, thanh trượt cuộn.
   - **10% (hoặc ít hơn) Màu ngữ nghĩa (Semantic Accent Only)**: Màu sắc **chỉ** được phép xuất hiện khi mang ý nghĩa logic rõ ràng (Xong = Xanh lá, Đang làm = Vàng ấm, Bỏ tick/Xóa = Đỏ nhẹ).
3. **Chống "AI Slop" & Màu trang trí thừa thãi**:
   - Notion và Google Keep **không bao giờ** dùng nút bấm tím/indigo lòe loẹt, viền form phát sáng xanh lam, hay icon cầu vồng.
   - Nút hành động chính luôn là **Đen/Trắng nguyên bản (Ink & Paper)**.

---

## 2. Bảng Mã Màu Chuẩn Hóa (Standardized Palette Tokens)

### 2.1. Nền & Chữ (Canvas & Typography)
| Thành phần | Light Mode | Dark Mode | Ý nghĩa |
|---|---|---|---|
| **Nền ứng dụng** | `#f8f9fa` (Muted canvas) | `#0b0f17` (Deep slate) | Giảm mỏi mắt khi làm việc ban đêm |
| **Nền Thẻ / Item** | `#ffffff` (Pure white) | `#161b22` (GitHub slate) | Phân tách phân tầng nội dung |
| **Chữ chính** | `#212529` / `#1e293b` | `#f1f5f9` (Crisp light) | Độ tương phản cao chuẩn WCAG AAA |
| **Chữ phụ / Icon** | `#64748b` (Slate-500) | `#94a3b8` (Slate-400) | Thông tin metadata, icon điều hướng |
| **Đường viền (Borders)** | `#e2e8f0` (Slate-200) | `#30363d` (GitHub border) | Định hình cấu trúc không gây rối mắt |

### 2.2. Màu Ngữ Nghĩa Duy Nhất (Semantic Accents Only)
| Trạng thái | Mã Màu Chuẩn | Token Tailwind | Ứng Dụng |
|---|---|---|---|
| **Hoàn thành (Done)** | `#34c759` / `#548164` | `text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40` | Checkbox tích xanh, badge 100% hoàn thành |
| **Đang làm (Doing)** | `#c29343` / `#d97706` | `text-amber-800 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/40` | Nút trạng thái Đang làm |
| **Chờ xử lý (Todo)** | `#64748b` (Neutral) | `text-slate-600 bg-slate-100 dark:text-slate-400 dark:bg-slate-800` | Nút trạng thái Chờ |
| **Ưu tiên (Pinned)** | `#976d57` (Notion Brown) | `text-amber-800 bg-amber-50/80 dark:text-amber-300 dark:bg-amber-950/30` | Thẻ ghim việc quan trọng |
| **Xóa / Nguy hiểm** | `#e11d48` (Rose-600) | `text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30` | Thao tác xóa việc/dự án |

---

## 3. Các Quy Tắc Cấm Kỵ (Anti-Patterns To Avoid)
❌ **Không dùng Indigo/Tím/Xanh ngọc cho các nút bấm phụ hoặc hover**.  
❌ **Không tô viền input bằng màu tím/xanh neon khi người dùng đang nhập liệu**.  
❌ **Không dùng quá 1 màu accent trên cùng 1 dòng công việc**.  
✅ **Luôn dùng màu đen trắng (Slate-900 / Slate-100) cho toàn bộ các nút bấm chính (Primary Action Buttons)**.
