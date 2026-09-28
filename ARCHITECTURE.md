# HỆ THỐNG TÀI LIỆU KIẾN TRÚC & HƯỚNG DẪN KỸ THUẬT (SYSTEM ARCHITECTURE & ENGINEERING MANUAL)

> **Ứng dụng**: Quản Lý Công Việc & Dự Án Tối Giản (Solo Tasks Core)  
> **Phiên bản kiến trúc**: v4.6.0 (Notion Caret Navigation, Infinite Subtasks & Enterprise Docs Hub)  
> **Công nghệ chủ đạo**: React 19, TypeScript 5, Tailwind CSS v4, Vite, Local-First Architecture  
> **Quy chuẩn thiết kế**: Phỏng theo triết lý của **Notion, Linear, Apple Human Interface Guidelines (HIG), và GitHub Primer**.

---

## 📚 THƯ VIỆN TÀI LIỆU CHUYÊN SÂU (`/docs`)
Hệ thống tài liệu đã được tổ chức phân tầng chuyên nghiệp theo tiêu chuẩn các tập đoàn công nghệ lớn:

- **[Bản Đồ Tài Liệu & Trung Tâm Điều Hướng (`docs/README.md`)](./docs/README.md)**
- **Kiến trúc Kỹ thuật (`docs/architecture/`)**:
  - [Tổng quan hệ thống & Luồng dữ liệu](./docs/architecture/system-overview.md)
  - [Giải thuật Đệ quy Việc con vô hạn tầng](./docs/architecture/recursive-subtasks.md)
  - [Lưu trữ LocalStorage, Undo & Audio Synth Engine](./docs/architecture/state-persistence.md)
- **Hệ thống Thiết kế (`docs/design-system/`)**:
  - [Notion Sub-items Tree & Caret Navigation UX](./docs/design-system/notion-hierarchy-ux.md)
  - [React Portal & Quản lý Stacking Context Z-index](./docs/design-system/portal-layering.md)
- **Quy chuẩn Phát triển & Chất lượng Code (`docs/development/` & `docs/standards/`)**:
  - [Hướng dẫn cài đặt & Khởi chạy](./docs/development/getting-started.md)
  - [Quy chuẩn Git Conventional Commits v1.0.0](./docs/development/contributing.md)
  - [Quy chuẩn Kích thước file <= 300 dòng (SLOC) & Module hóa](./docs/standards/file-size-and-modularity.md)
  - [Quy chuẩn Thiết kế Màu sắc (Color System) & Bảng màu Notion/Linear](./docs/standards/color-system-and-palette.md)
- **Hướng dẫn Vận hành (`docs/guides/`)**:
  - [Cẩm nang người dùng & Phím tắt](./docs/guides/user-guide.md)
  - [Tài liệu kế thừa cho kỹ sư kế tiếp](./docs/guides/maintenance-and-inheritance.md)

---

## MỤC LỤC TỔNG QUAN TẠI ĐÂY
1. [Giới Thiệu & Triết Lý Sản Phẩm (Product Vision & Philosophy)](#1-giới-thiệu--triết-lý-sản-phẩm)
2. [Sơ Đồ Kiến Trúc Hệ Thống (System Architecture & Topology)](#2-sơ-đồ-kiến-trúc-hệ-thống)
3. [Bộ Máy Xử Lý Việc Con Đa Tầng (Hierarchical Subtask Engine)](#3-bộ-máy-xử-lý-việc-con-đa-tầng)
4. [Kiến Trúc Lớp Nổi & Portal (Portal Layer & Stacking Context Engine)](#4-kiến-trúc-lớp-nổi--portal)
5. [Quy Chuẩn Thiết Kế Giao Diện & Icon (Design Constitution)](#5-quy-chuẩn-thiết-kế-giao-diện--icon)
6. [Hướng Dẫn Sử Dụng Toàn Diện Cho Người Dùng (End-User Guide)](#6-hướng-dẫn-sử-dụng-toàn-diện)
7. [Quy Chuẩn Git Commit Quốc Tế (Conventional Commits Standard)](#7-quy-chuẩn-git-commit-quốc-tế)
8. [Hướng Dẫn Kỹ Sư & Kế Thừa Phát Triển (Developer & Extensibility Guide)](#8-hướng-dẫn-kỹ-sư--kế-thừa-phát-triển)

---

## 1. Giới Thiệu & Triết Lý Sản Phẩm

### 1.1 Sứ mệnh (Mission)
Ứng dụng được thiết kế nhằm giải phóng con người khỏi sự cồng kềnh, nặng nề của các phần mềm quản lý dự án doanh nghiệp truyền thống (Jira, ClickUp). Mục tiêu là tạo ra một công cụ **nhẹ như giấy, tốc độ phản hồi 0ms, không phụ thuộc internet và cực kỳ thông minh trong việc phân rã công việc**.

### 1.2 Bốn trụ cột triết lý (Core Tenets)
1. **Local-First & Quyền riêng tư tuyệt đối (100% Offline)**: Toàn bộ dữ liệu nằm trên thiết bị người dùng (LocalStorage), không gửi về máy chủ trung gian, không theo dõi telemetries.
2. **Không có độ trễ (Zero-Latency Interaction)**: Mọi thao tác tick chọn, tạo việc, gập mở đều phản hồi tức thời dưới 16ms (chuẩn 60fps), hỗ trợ rung phản hồi cảm ứng (Haptic Vibration) và âm thanh chúc mừng dịu tai (Audio Chime).
3. **Chia việc nguyên tử (Atomic Decomposition - Notion Style)**: Một công việc lớn có thể chia thành nhiều giai đoạn, mỗi giai đoạn chứa các việc nhỏ hơn, và mỗi việc nhỏ lại chứa các bước thực thi cụ thể lồng nhau không giới hạn.
4. **Chống thiết kế "AI Slop" (Anti-Slop Discipline)**: Không dùng gradient tím lòe loẹt, không dùng icon trang trí bừa bãi, không dùng các badge pill thừa thãi; tôn vinh sự tinh tế của Typography và phân cấp thị giác chuẩn mực.

---

## 2. Sơ Đồ Kiến Trúc Hệ Thống

### 2.1 Luồng dữ liệu một chiều (Unidirectional Data Flow)

```
┌────────────────────────────────────────────────────────┐
│                   Trình Duyệt (Browser)                │
│                                                        │
│  ┌───────────────────┐        ┌─────────────────────┐  │
│  │ LocalStorage (V4) │ <────> │ useTaskManager Hook │  │
│  │ (Data Persistence)│        │ (Central State Bus) │  │
│  └───────────────────┘        └──────────┬──────────┘  │
│                                          │             │
│            ┌─────────────────────────────┼────────┐    │
│            ▼                             ▼        ▼    │
│  ┌───────────────────┐        ┌──────────────┐ ┌─────┐ │
│  │ ProjectCard List  │        │ FocusBanner  │ │Toast│ │
│  │  ├─ TaskItem      │        │ (Zen Mode)   │ └─────┘ │
│  │  │   └─SubtaskList│        └──────────────┘         │
│  └─────────┬─────────┘                                 │
│            │                                           │
│            ▼                                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │ PortalMenu (Mounted to document.body, z-[99999]) │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### 2.2 Phân tách trách nhiệm (Separation of Concerns)
- **`src/types/index.ts`**: Nơi khai báo cấu trúc dữ liệu hợp đồng (Contract Types), tuyệt đối không chứa logic phụ thuộc.
- **`src/features/tasks/utils/subtaskTree.ts`**: Module chứa các hàm thuần túy (Pure Functions) xử lý cây đệ quy, không phụ thuộc vào React Component hay DOM. Dễ dàng viết Unit Test độc lập.
- **`src/features/tasks/hooks/useTaskManager.ts`**: Máy trạng thái trung tâm (State Machine), quản lý CRUD, lịch sử hoàn tác (Undo/Redo), chuỗi Streak, âm thanh và lưu trữ.
- **`src/components/ui/PortalMenu.tsx`**: Đóng gói giải pháp hiển thị lớp nổi (Floating Layer) độc lập với cây phân cấp DOM của thẻ công việc.

---

## 3. Bộ Máy Xử Lý Việc Con Đa Tầng (Hierarchical Subtask Engine)

### 3.1 Cấu trúc dữ liệu cây N-phân (N-ary Tree Model)

```typescript
export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  subtasks?: SubTask[]; // Đệ quy: Cho phép chứa N tầng con/cháu vô hạn
}

export interface Task {
  id: string;
  title: string;
  status: 'todo' | 'doing' | 'done';
  deadline?: string;
  notes?: string;
  subtasks: SubTask[];
  isPinned?: boolean;
}
```

### 3.2 Bốn bất biến trạng thái (The 4 State Invariants)

#### Invariant 1: Thác đổ từ trên xuống (Cascade-Down)
Khi người dùng bấm hoàn thành một nút cha (dù là Task gốc hay Subtask trung gian), toàn bộ cây con bên dưới nó bắt buộc phải chuyển sang `completed = true`.
$$\forall \text{ node } \in \text{Subtree}(\text{parent}), \quad \text{parent.completed} = \text{true} \implies \text{node.completed} = \text{true}$$

#### Invariant 2: Bọt khí nổi từ dưới lên (Bubble-Up / Rollup)
Một nút cha chỉ được coi là hoàn thành nếu và chỉ nếu toàn bộ các nút con trực tiếp của nó đã hoàn thành:
$$\text{parent.completed} \iff \bigwedge_{i=1}^{k} \text{child}_i.\text{completed} = \text{true}$$
Khi toàn bộ các nút lá (leaf nodes) ở mọi độ sâu của Task gốc hoàn thành:
$$\text{Task.status} \leftarrow \text{'done'}$$
Hệ thống sẽ kích hoạt âm thanh hoàn thành (`playChime`), hiệu ứng ăn mừng (`ConfettiEffect`) và ghi nhận vào chuỗi Streak.

#### Invariant 3: Đảo ngược khi bỏ chọn (Incomplete Rollup)
Khi bất kỳ một nút lá nào bị bỏ tick (`completed = false`), toàn bộ chuỗi tổ tiên trực tiếp từ nó đến Task gốc lập tức bị đảo trạng thái:
- Nút cha trực tiếp: `completed = false`.
- Task gốc: `status = 'doing'` (nếu trước đó đang là `'done'`).

#### Invariant 4: Bất biến khi thêm / xóa nút (Add/Delete Invariance)
- **Thêm việc con mới**: Một nút mới sinh ra mặc định có `completed = false`. Khi thêm nó vào một nhánh đã xong, nhánh đó và Task gốc lập tức chuyển sang trạng thái đang làm (`doing`).
- **Xóa việc con**: Xóa nút chưa hoàn thành cuối cùng trong một nhánh sẽ kích hoạt tái tính toán; nếu tất cả các nút còn lại đều đã xong, nhánh cha sẽ tự động hoàn thành.

---

## 4. Kiến Trúc Lớp Nổi & Portal (Portal Layer & Stacking Context Engine)

### 4.1 Vấn đề kinh điển của CSS (The CSS Clipping Bug)
Trong các danh sách công việc phức tạp, phần tử bao bọc (`TaskItem` hoặc `ProjectCard`) bắt buộc phải có thuộc tính `overflow-hidden` để bo góc mềm mại (`rounded-xl`) và tránh tràn chữ (`truncate`).  
Tuy nhiên, điều này tạo ra hiệu ứng phụ nghiêm trọng: **Bất kỳ menu dropdown hay popover nào sử dụng `absolute top-full` sẽ bị cắt đứt hoặc che khuất bởi đáy của thẻ cha!**

### 4.2 Giải pháp chuẩn công nghiệp: `PortalMenu`
Ứng dụng sử dụng giải pháp **React Portal** kết hợp thuật toán tính tọa độ Viewport (tương tự như Radix UI / Floating UI):

```typescript
// 1. Đo lường tọa độ thực tế của nút bấm kích hoạt
const rect = triggerRef.current.getBoundingClientRect();

// 2. Tính toán điểm gắn cố định trên Viewport
let top = rect.bottom + 6;
let right = window.innerWidth - rect.right;

// 3. Tự động lật lên trên (Auto-Flip) nếu gần sát đáy màn hình
if (top + estimatedHeight > window.innerHeight && rect.top - estimatedHeight > 0) {
  top = rect.top - estimatedHeight - 6;
}

// 4. Render trực tiếp vào document.body với z-index cao nhất
return createPortal(
  <div style={{ position: 'fixed', top, right, zIndex: 99999 }}>
    {children}
  </div>,
  document.body
);
```

### 4.3 Quy chuẩn lớp phủ toàn cục cho Dialog & Modal
Không chỉ riêng dropdown menu, toàn bộ các hộp thoại xác nhận và modal (`ConfirmDialog`, `BatchPasteModal`, `GuideModal`, `BackupModal`, `MobileAddModal`, `MobileGuideModal`) đều được gắn qua **React `createPortal(..., document.body)`** với chỉ số tầng `z-[99999]`:
- **Loại bỏ hiện tượng Stacking Context Trap**: Đảm bảo dialog không bao giờ bị chi phối bởi các thẻ cha có `overflow: hidden`, `transform`, `filter`, hay `opacity`.
- **Ưu tiên lớp hiển thị tối cao**: Dialog luôn luôn che phủ toàn bộ màn hình, backdrop mờ sắc nét (`backdrop-blur-[3px]`), không bị bất kỳ thẻ công việc hay header nào che khuất.
- **Tương tác chuẩn mực**: Lắng nghe phím `Escape`, nhấp ra ngoài để đóng, và khóa cuộn nền hợp lý.

---

## 5. Quy Chuẩn Thiết Kế Giao Diện & Icon (Design Constitution)

Được tài liệu hóa trong `src/components/ui/icon-system.ts`:

| Tiêu chuẩn | Quy định | Mục đích |
| :--- | :--- | :--- |
| **Độ dày nét chính** | `strokeWidth={1.5}` | Chuẩn xác, thanh mảnh theo phong cách Linear / Raycast. |
| **Độ dày nét phụ** | `strokeWidth={1.75}` | Dành riêng cho icon nhỏ (12px–14px) như liên kết ngoài, đóng modal. |
| **Độ dày nét nhấn** | `strokeWidth={2.0 - 2.5}` | Dành riêng cho Checkbox hoàn thành và icon nút Tạo việc chính. |
| **Xoay chuyển trạng thái** | `rotate-90 transition-transform` | Không hoán đổi thẻ DOM icon mà chỉ xoay `<ChevronRight>` bằng GPU CSS. |
| **Giao diện Hệ thống** | `<Monitor>` | Chuẩn quốc tế thay cho `<Laptop>`. |
| **Loại bỏ ký tự thô** | Cấm dùng `✕` hay `📁` emoji | Bắt buộc dùng SVG chuẩn: `<X>` và `<Folder>`. |

---

## 6. Hướng Dẫn Sử Dụng Toàn Diện (End-User Guide)

### 6.1 Quy trình làm việc với việc con chuẩn Notion (Notion Sub-items)
1. **Mở rộng danh sách việc con**: Chạm vào nút badge tiến độ (ví dụ: `2 cần làm · 1/3 xong`) hoặc nút mũi tên `(▶)`. Danh sách sẽ mở ra **toàn bộ các đầu việc (cả việc đã xong và việc chưa xong)** theo đúng thứ tự thời gian.
2. **Thêm việc con nhanh (+ New sub-item)**:
   - Dưới đáy danh sách việc con luôn có hàng chữ bấm `+ Thêm việc con mới (New sub-item)`.
   - Bấm vào sẽ xuất hiện ô gõ trực tiếp. Nhập tên xong bấm `Enter` để lưu ngay và tiếp tục gõ việc kế tiếp.
   - Để thêm bước con cấp 2, cấp 3 cho một bước cụ thể: Di chuột vào bước đó, bấm nút `(+)` bên phải.
3. **Gập/Mở từng nhánh**: Mỗi bước có việc con đều có mũi tên `(▶ / ▼)`. Bạn có thể gập bớt các giai đoạn đã hoàn thành để tập trung vào giai đoạn đang làm.

### 6.2 Bảng phím tắt năng suất cao (Power User Shortcuts)
| Phím tắt | Tác dụng |
| :--- | :--- |
| `/` | Đưa con trỏ ngay lập tức vào ô tìm kiếm nhanh việc |
| `F` | Bật / Tắt Chế độ Tập trung (Zen Mode) |
| `D` | Chuyển đổi nhanh giao diện Sáng / Tối / Theo hệ điều hành |
| `Ctrl + Z` | Hoàn tác ngay lập tức việc vừa xóa nhầm |
| `Esc` | Đóng toàn bộ popup, modal, menu tùy chọn đang mở |
| `Enter` | Lưu việc mới và giữ con trỏ để gõ tiếp việc sau |

---

## 7. Quy Chuẩn Git Commit Quốc Tế (Conventional Commits Standard)

Ứng dụng tuân thủ nghiêm ngặt đặc tả **Conventional Commits v1.0.0** nhằm phục vụ việc tạo changelog tự động và kế thừa dự án chuyên nghiệp.

### 7.1 Cấu trúc chuẩn của một Commit
```
<type>(<scope>): <subject>

[optional body: giải thích nguyên nhân và cách giải quyết]

[optional footer: mã issue tham chiếu]
```

### 7.2 Các Type được phép sử dụng
- **`feat`**: Bổ sung tính năng mới cho người dùng.
- **`fix`**: Sửa lỗi trong mã nguồn.
- **`docs`**: Thay đổi tài liệu hướng dẫn, README, ARCHITECTURE.
- **`style`**: Định dạng mã nguồn (khoảng trắng, dấu chấm phẩy, không ảnh hưởng logic).
- **`refactor`**: Cấu trúc lại mã nguồn mà không thêm tính năng hay sửa lỗi.
- **`perf`**: Cải thiện hiệu năng xử lý (tối ưu render, memoization, thuật toán).
- **`test`**: Thêm hoặc cập nhật test case.
- **`chore`**: Cập nhật build script, cấu hình package, dependencies.

### 7.3 Các Scope hợp lệ trong dự án
- `(tasks)`: Liên quan đến danh sách công việc chính và dự án.
- `(subtasks)`: Liên quan đến cây việc con đệ quy và giải thuật rollup.
- `(portal)`: Liên quan đến lớp menu nổi, tọa độ và z-index.
- `(ui)`: Cập nhật icon, CSS Tailwind, theme dark/light.
- `(storage)`: Lưu trữ LocalStorage, sao lưu JSON và xuất HTML.
- `(shortcuts)`: Xử lý sự kiện bàn phím.

### 7.4 Ví dụ Commit mẫu chuẩn mực
✅ **Hợp lệ**:
- `feat(subtasks): support infinite atomic nesting with bottom-up rollup`
- `fix(portal): resolve popover clipping by mounting to document body`
- `docs(architecture): add comprehensive user guide and conventional commits standard`
- `refactor(subtaskTree): simplify leaf node counting with memoized traversal`

❌ **Không hợp lệ (Cấm)**:
- `update code` (Không có type, không có scope, mô tả vô nghĩa)
- `fixed bug` (Không rõ sửa bug gì, ở module nào)
- `WIP` (Không commit mã chưa hoàn thiện lên nhánh chính)

---

## 8. Hướng Dẫn Kỹ Sư & Kế Thừa Phát Triển (Developer & Extensibility Guide)

### 8.1 Thiết lập môi trường phát triển cục bộ
```bash
# 1. Cài đặt các gói phụ thuộc
npm install

# 2. Khởi chạy máy chủ phát triển
npm run dev

# 3. Kiểm tra cú pháp và kiểu dữ liệu TypeScript
npm run lint

# 4. Kiểm tra biên dịch bản build đóng gói
npm run build
```

### 8.2 Hướng dẫn mở rộng tính năng (Extensibility Recipes)

#### Recipe 1: Bổ sung trường ngày hết hạn (Deadline) cho việc con
1. Mở `src/types/index.ts`, cập nhật interface:
   ```typescript
   export interface SubTask {
     id: string;
     title: string;
     completed: boolean;
     dueDate?: string; // Bổ sung trường mới
     subtasks?: SubTask[];
   }
   ```
2. Mở `src/features/tasks/utils/subtaskTree.ts`, kiểm tra hàm `cascadeSubtaskCompleted`:
   Vì hàm đã dùng toán tử spread `{ ...sub, completed }`, trường `dueDate` sẽ tự động được bảo lưu nguyên vẹn mà không bị mất dữ liệu.
3. Cập nhật `SubTaskRow` trong `SubtaskList.tsx` để render badge ngày cạnh tiêu đề nếu `sub.dueDate` tồn tại.

#### Recipe 2: Thêm một Menu Action mới trong Portal
1. Mở `src/features/tasks/components/TaskItem.tsx`.
2. Tìm đến khối `<PortalMenu triggerRef={moreButtonRef} ...>`.
3. Bổ sung nút bấm với icon chuẩn nét `1.5`:
   ```tsx
   <button
     type="button"
     onClick={handleCustomAction}
     className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
   >
     <CustomIcon className="w-3.5 h-3.5 shrink-0 text-slate-400" strokeWidth={1.5} aria-hidden="true" />
     <span>Hành động mới</span>
   </button>
   ```

#### Recipe 3: Tích hợp đồng bộ hóa đám mây (Cloud Sync)
Hiện tại máy trạng thái trung tâm nằm trọn vẹn trong `useTaskManager.ts`. Để tích hợp thêm cơ sở dữ liệu từ xa (Firebase Firestore hoặc Cloud SQL):
- Không thay đổi các component giao diện.
- Chỉ cần chèn thêm trigger đồng bộ bên trong `saveProjects`:
  ```typescript
  const saveProjects = (newProjects: Project[]) => {
    setProjects(newProjects);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProjects));
    // Chèn lời gọi API debounce gửi newProjects lên máy chủ ở đây
  };
  ```

---
*Tài liệu này được biên soạn để đảm bảo tính kế thừa cao nhất cho mọi thành viên trong đội ngũ phát triển.*
