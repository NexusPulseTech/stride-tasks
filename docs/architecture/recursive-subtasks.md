# 2. Recursive Subtasks & Hierarchical Rollup Engine

## 2.1. Cấu Trúc Dữ Liệu Đệ Quy Vô Hạn (Infinite Nested Tree)

Một nhiệm vụ con (`SubTask`) trong Solo Checklist là một cấu trúc dữ liệu đệ quy nguyên tử (Atomic Recursive Node):

```typescript
export interface SubTask {
  id: string;               // Unique ID: 's_' + timestamp + '_' + randomHash
  title: string;            // Tiêu đề việc con
  completed: boolean;       // Trạng thái hoàn thành
  subtasks?: SubTask[];     // ĐỆ QUY: Danh sách các việc con lồng bên trong (vô hạn tầng)
}
```

Nhờ mô hình này, việc con có thể lồng nhau ở bất kỳ tầng nào:
`Task (Gốc) ➔ Tầng 1 ➔ Tầng 2 ➔ Tầng 3 ➔ Tầng 4 ... ➔ Tầng N`

---

## 2.2. Toán Học & Quy Luật Giải Thuật (Rollup Mathematics)

### 1. Thác đổ (Cascade Down)
Khi đánh dấu hoàn thành một nút cha (dù là Task gốc hay một SubTask ở tầng giữa), trạng thái `completed = true` được truyền xuống toàn bộ cây con cháu bên dưới:
$$\forall c \in \text{Descendants}(node): c.\text{completed} = \text{newCompleted}$$

### 2. Bọt khí nổi (Bubble Up Rollup)
Một nút cha chỉ được coi là hoàn thành (`completed = true`) khi và chỉ khi **toàn bộ** các nút con trực tiếp của nó đã hoàn thành:
$$node.\text{completed} = \begin{cases} 
node.\text{completed}, & \text{nếu } |node.\text{children}| = 0 \\
\bigwedge_{c \in node.\text{children}} c.\text{completed}, & \text{nếu } |node.\text{children}| > 0 
\end{cases}$$

### 3. Đảo ngược trạng thái tổ tiên (Incomplete Rollup)
Khi bất kỳ một nút lá sâu nhất nào bị bỏ tick (`completed = false`):
- Mọi nút tổ tiên (Ancestors) từ cha, ông, cố đến Task gốc **bắt buộc** phải tự động chuyển thành chưa hoàn thành (`completed = false`).
- Task gốc tự động chuyển trạng thái từ `done` sang `doing` (Đang làm).

### 4. Thêm / Xóa nút động (Dynamic Add / Remove Rollup)
- Khi thêm một bước con mới (`completed = false`) vào một nút đã hoàn thành, nút cha và toàn bộ tổ tiên sẽ tự động trả về `completed = false`.
- Khi xóa một nút con chưa xong, nếu tất cả các anh chị em còn lại đều đã xong, nút cha sẽ tự động chuyển thành hoàn thành (`completed = true`).

---

## 2.3. Hiện Thực Kỹ Thuật (Implementation in `src/features/tasks/utils/subtaskTree.ts`)

### Thêm nút con vô hạn tầng:
```typescript
export function addNestedSubtask(
  subtasks: SubTask[],
  parentSubId: string | null,
  newSub: SubTask
): SubTask[] {
  if (!parentSubId) {
    return [...subtasks, newSub];
  }

  function traverse(list: SubTask[]): SubTask[] {
    return list.map((item) => {
      if (item.id === parentSubId) {
        const existingSubs = item.subtasks || [];
        return {
          ...item,
          completed: false, // Vì thêm việc chưa xong nên cha thành chưa xong
          subtasks: [...existingSubs, newSub],
        };
      }

      if (item.subtasks && item.subtasks.length > 0) {
        const updatedChildren = traverse(item.subtasks);
        const allDone = updatedChildren.length > 0 && updatedChildren.every((c) => c.completed);
        return {
          ...item,
          completed: allDone,
          subtasks: updatedChildren,
        };
      }

      return item;
    });
  }

  return traverse(subtasks);
}
```

### Xử lý giao diện cho cây lồng vô hạn (Indentation Clamp):
Để tránh vỡ layout khi người dùng lồng sâu đến tầng 5 - 10 trên thiết bị di động:
- Mỗi tầng thụt lề bằng đường dẫn thị giác thanh mảnh (`ml-2 sm:ml-2.5 pl-2 sm:pl-2.5 border-l`).
- Giới hạn độ dịch chuyển ngang tối đa, giúp toàn bộ nội dung luôn hiển thị sắc nét trong khung nhìn.
- Nút thêm việc con (`+ New sub-item`) có sẵn ở mọi cấp và tự động kích hoạt mở rộng nút cha (`forceExpand: true`).
