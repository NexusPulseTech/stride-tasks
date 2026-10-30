# Quy Chuẩn Kích Thước Tệp & Tính Module Hóa (File Size & Modularity Standard)

> **Tiêu chuẩn áp dụng**: Google Engineering Practices, Airbnb JavaScript/TypeScript Style Guide, Martin Fowler's Refactoring (Code Smells), và ESLint Core Rules (`max-lines: 300`).

---

## 1. Nguyên Tắc Cốt Lõi: Giới Hạn 300 Dòng Mã Nguồn (SLOC Rule)

Trong kỹ nghệ phần mềm hiện đại, tệp mã nguồn quá lớn (Monolithic File) là một **Code Smell** nghiêm trọng (Large Class / God Object). Nó dẫn đến:
- Tăng độ phức tạp chu kỳ (Cognitive Load).
- Khó kiểm thử đơn vị (Hard to Unit Test).
- Tăng xung đột khi gộp mã (Git Merge Conflicts).
- Vi phạm nguyên lý trách nhiệm duy nhất (Single Responsibility Principle - SRP).

### 🎯 Quy Tắc Cứng (Hard Rule):
> **Một tệp mã nguồn không được vượt quá 300 dòng mã thực thi (Source Lines of Code - SLOC)**  
> *(Không tính dòng trống và chú thích giải thích thuật toán/JSDoc)*.  
> **Ngưỡng lý tưởng khuyến nghị (Ideal Range)**: 100 - 250 dòng cho mỗi tệp.

---

## 2. Tiêu Chuẩn Kích Thước Từ Các Tập Đoàn Công Nghệ Lớn

| Chỉ Số Đo Lường | Tiêu Chuẩn Quốc Tế | Ngưỡng Khuyến Nghị | Biện Pháp Khi Vượt Ngưỡng |
|---|---|---|---|
| **Độ dài tệp (Lines per File)** | ESLint `max-lines` (default: 300) | $\le 250$ dòng SLOC | Tách thành các sub-components hoặc sub-hooks độc lập. |
| **Độ dài hàm (Lines per Function)** | Clean Code / Martin Fowler | $\le 30 - 50$ dòng | Tách hàm con, trích xuất Pure Utility Functions. |
| **Số lượng tham số (Parameters)** | Airbnb Style Guide / Clean Code | $\le 3$ tham số rời | Gom vào Typed Props / Options Object (`{ projId, taskId, ... }`). |
| **Độ phức tạp chu kỳ (Cyclomatic Complexity)** | ESLint `complexity` | $\le 10$ | Giảm câu lệnh lồng nhau (`if/else`), dùng Early Return / Guard Clauses. |
| **Độ sâu lồng mã (Nesting Depth)** | Google Style Guide | $\le 3 - 4$ tầng tab | Tránh Callback Hell; tách logic điều kiện phức tạp. |

---

## 3. Kiến Trúc Phân Tách Cho React & TypeScript

### 3.1. Phân Tách Custom Hook Lớn (Hook Composition Pattern)
Khi một Custom Hook quản lý quá nhiều trạng thái (như `useTaskManager` > 500 dòng), kỹ thuật chuẩn của các cty lớn là **Composition Hook**:
```
useTaskManager (Orchestrator Hook < 150 dòng)
  ├── useTaskCRUD (Tạo, xóa, sửa task & project)
  ├── useSubtaskOperations (Toán học đệ quy, cascade down, rollup)
  ├── useTaskDnd (Xử lý kéo thả HTML5 Drag and Drop)
  └── useCelebrationStreak (Theo dõi streak, âm thanh pentatonic, haptics)
```

### 3.2. Phân Tách Component (Presenter & Sub-Components)
Khi một component React chứa cả danh sách lồng và logic hiển thị từng phần tử con:
- **Tách Row Component**: Trích xuất `SubTaskRow.tsx` ra khỏi `SubtaskList.tsx`.
- **Tách Menu / Action Popover**: Trích xuất `TaskMoreMenu.tsx` ra khỏi `TaskItem.tsx`.
- Mỗi tệp component con tập trung trọn vẹn vào 1 trách nhiệm, code ngắn gọn, tái sử dụng cao.
