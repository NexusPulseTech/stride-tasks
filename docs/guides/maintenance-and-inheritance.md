# 9. Maintenance & Engineering Inheritance Guide

## 9.1. Dành Cho Kỹ Sư Kế Thừa (For Successor Engineers)

Chào bạn, người đồng nghiệp tiếp nối dự án Solo Checklist! Khi bạn mở codebase này, đây là những điểm mấu chốt bạn cần ghi nhớ để duy trì chất lượng phần mềm cao nhất:

### 1. Luồng truyền tham số Subtask (`onAddSubTask`)
Trong quá khứ, từng xảy ra lỗi mất tham số `parentSubId` tại `App.tsx`. Khi mở rộng hoặc bọc thêm component cha:
- **Luôn đảm bảo chữ ký hàm đầy đủ**:
  `(projId: string, taskId: string, title?: string, parentSubId?: string | null) => void`
- Không được lược bỏ tham số khi chuyển tiếp props từ `ProjectCard` qua `TaskItem` xuống `SubtaskList`.

### 2. Thuật toán Đệ quy Cây (`subtaskTree.ts`)
- Mọi hàm trong `subtaskTree.ts` (`cascadeSubtaskCompleted`, `toggleSubtaskInTree`, `addNestedSubtask`, `deleteNestedSubtask`) đều là **Pure Functions** (Hàm thuần túy), không làm biến dị (mutate) trực tiếp đối tượng cũ mà luôn trả về mảng/đối tượng mới.
- Luôn giữ nguyên tính bất biến (Immutability) này để đảm bảo React re-render chính xác và không gây rò rỉ bộ nhớ.

### 3. Nguyên tắc Hiển thị Menu & Dialogs (`PortalMenu`)
- **Tuyệt đối không** nhúng các popover menu trực tiếp vào bên trong các thẻ `div` có `overflow-hidden` hoặc các hàng bị co rút.
- Luôn sử dụng `PortalMenu` để DOM Node được đẩy ra `document.body` với `z-[99999]`.

---

## 9.2. Kế Hoạch Mở Rộng Trong Tương Lai (Roadmap & Extension Points)
1. **Đồng bộ Đám mây (Cloud Sync)**: Khi tích hợp backend (Firebase hoặc Supabase), cấu trúc dữ liệu `Project[]` đã sẵn sàng để serialize thành JSON document hoặc relational tables.
2. **Kéo thả lồng cấp (Tree Drag & Drop)**: Có thể tích hợp `@hello-pangea/dnd` hoặc `@dnd-kit` để cho phép kéo thả việc con từ tầng này sang tầng khác.
3. **Phím tắt bàn phím toàn cục (Global Hotkeys)**: Mở modal thêm việc nhanh với `Cmd + K` hoặc `Ctrl + Space`.
