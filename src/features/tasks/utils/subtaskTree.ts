import { SubTask, Task } from '../../../types';

/**
 * UTILITIES & ALGORITHMS FOR RECURSIVE HIERARCHICAL SUBTASKS
 * Quản lý Cascade Down, Bubble Up Rollup và cập nhật cây việc con đệ quy.
 */

/**
 * Đếm số lượng bước lá (leaf subtasks) ở mọi độ sâu
 */
export function countLeafSubtasks(sub: SubTask): { total: number; completed: number } {
  if (!sub.subtasks || sub.subtasks.length === 0) {
    return {
      total: 1,
      completed: sub.completed ? 1 : 0,
    };
  }

  let total = 0;
  let completed = 0;

  for (const child of sub.subtasks) {
    const res = countLeafSubtasks(child);
    total += res.total;
    completed += res.completed;
  }

  return { total, completed };
}

/**
 * Thống kê tổng hợp số lượng việc con của một Task gốc
 */
export function getTaskSubtaskStats(task: Task) {
  const directTotal = task.subtasks ? task.subtasks.length : 0;
  const directDone = task.subtasks ? task.subtasks.filter((s) => s.completed).length : 0;

  let leafTotal = 0;
  let leafDone = 0;

  if (task.subtasks) {
    for (const sub of task.subtasks) {
      const res = countLeafSubtasks(sub);
      leafTotal += res.total;
      leafDone += res.completed;
    }
  }

  const isAllLeafsDone = leafTotal > 0 && leafDone === leafTotal;
  const hasSomeDone = leafDone > 0;

  return {
    directTotal,
    directDone,
    leafTotal,
    leafDone,
    isAllLeafsDone,
    hasSomeDone,
  };
}

/**
 * Thác đổ (Cascade down): Đặt trạng thái completed cho toàn bộ cây con bên dưới
 */
export function cascadeSubtaskCompleted(sub: SubTask, completed: boolean): SubTask {
  return {
    ...sub,
    completed,
    subtasks: sub.subtasks
      ? sub.subtasks.map((child) => cascadeSubtaskCompleted(child, completed))
      : undefined,
  };
}

/**
 * Thác đổ cho toàn bộ Task gốc
 */
export function cascadeTaskAllSubtasks(task: Task, completed: boolean): Task {
  return {
    ...task,
    status: completed ? 'done' : 'todo',
    subtasks: task.subtasks.map((child) => cascadeSubtaskCompleted(child, completed)),
  };
}

/**
 * Bọt khí nổi (Bubble up): Đệ quy cập nhật trạng thái completed dựa trên các con
 */
function recalculateSubtaskNode(sub: SubTask): SubTask {
  if (!sub.subtasks || sub.subtasks.length === 0) {
    return sub;
  }

  const updatedChildren = sub.subtasks.map(recalculateSubtaskNode);
  const allChildrenDone =
    updatedChildren.length > 0 && updatedChildren.every((c) => c.completed);

  return {
    ...sub,
    completed: allChildrenDone,
    subtasks: updatedChildren,
  };
}

/**
 * Tìm và toggle trạng thái hoàn thành của 1 subtask ở bất kỳ độ sâu nào
 * Đồng thời tự động Cascade Down xuống các con và Bubble Up lên các cha
 */
export function toggleSubtaskInTree(
  subtasks: SubTask[],
  targetSubId: string,
  newCompleted: boolean
): { updatedSubtasks: SubTask[]; wasFound: boolean } {
  let wasFound = false;

  function traverse(list: SubTask[]): SubTask[] {
    return list.map((item) => {
      if (item.id === targetSubId) {
        wasFound = true;
        // Áp dụng cascade down cho chính item này và tất cả con cháu của nó
        return cascadeSubtaskCompleted(item, newCompleted);
      }

      if (item.subtasks && item.subtasks.length > 0) {
        const nextChildren = traverse(item.subtasks);
        if (wasFound) {
          // Bubble up: Tính lại trạng thái của item cha dựa trên các con
          const allDone =
            nextChildren.length > 0 && nextChildren.every((c) => c.completed);
          return {
            ...item,
            completed: allDone,
            subtasks: nextChildren,
          };
        }
      }

      return item;
    });
  }

  const updated = traverse(subtasks);
  return { updatedSubtasks: updated, wasFound };
}

/**
 * Thêm 1 subtask mới vào danh sách (ở gốc hoặc làm con của 1 subtask cụ thể)
 * Tự động tính lại bubble up (vì thêm việc mới chưa xong nên cha phải thành chưa xong)
 */
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
        const nextSubs = [...existingSubs, newSub];
        return {
          ...item,
          // Vì thêm 1 bước con chưa xong (completed: false), nên cha không thể còn là completed = true
          completed: false,
          subtasks: nextSubs,
        };
      }

      if (item.subtasks && item.subtasks.length > 0) {
        const updatedChildren = traverse(item.subtasks);
        const allDone =
          updatedChildren.length > 0 && updatedChildren.every((c) => c.completed);
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

/**
 * Xóa 1 subtask ở bất kỳ độ sâu nào và tự động Bubble Up tính lại cho cha
 */
export function deleteNestedSubtask(
  subtasks: SubTask[],
  targetSubId: string
): { updatedSubtasks: SubTask[]; deletedItem: SubTask | null } {
  let deletedItem: SubTask | null = null;

  function traverse(list: SubTask[]): SubTask[] {
    const filtered: SubTask[] = [];

    for (const item of list) {
      if (item.id === targetSubId) {
        deletedItem = item;
        continue; // Bỏ qua phần tử bị xóa
      }

      if (item.subtasks && item.subtasks.length > 0) {
        const nextChildren = traverse(item.subtasks);
        const allDone =
          nextChildren.length > 0 ? nextChildren.every((c) => c.completed) : item.completed;
        filtered.push({
          ...item,
          completed: allDone,
          subtasks: nextChildren,
        });
      } else {
        filtered.push(item);
      }
    }

    return filtered;
  }

  const updatedSubtasks = traverse(subtasks);
  return { updatedSubtasks, deletedItem };
}

/**
 * Xác định trạng thái tự động của Task gốc dựa trên cây subtasks
 * (Linear / ClickUp Best Practice: Tự động hoàn thành khi 100% con xong,
 * thoát khỏi done khi có con chưa xong, và giữ nguyên trạng thái đặc thù như review/blocked/custom)
 */
export function determineTaskStatusFromSubtasks(
  currentStatus: string,
  subtasks: SubTask[]
): string {
  if (!subtasks || subtasks.length === 0) {
    return currentStatus;
  }

  let totalLeafs = 0;
  let doneLeafs = 0;

  for (const s of subtasks) {
    const res = countLeafSubtasks(s);
    totalLeafs += res.total;
    doneLeafs += res.completed;
  }

  if (totalLeafs === 0) return currentStatus;

  // Nếu tất cả các bước con ở mọi cấp độ đều đã hoàn thành:
  if (doneLeafs === totalLeafs) {
    return 'done';
  }

  // Nếu trước đó đang là 'done' và giờ có bước chưa xong:
  if (currentStatus === 'done') {
    return doneLeafs > 0 ? 'doing' : 'todo';
  }

  // Nếu đang là 'todo' nhưng đã có ít nhất 1 việc con hoàn thành:
  if (currentStatus === 'todo' && doneLeafs > 0) {
    return 'doing';
  }

  // Giữ nguyên trạng thái hiện tại (bao gồm review, blocked, testing, paused, custom)
  return currentStatus;
}

/**
 * Cập nhật tên của một bước con (Subtask) ở bất kỳ tầng đệ quy nào
 */
export function updateSubtaskTitleInTree(
  subtasks: SubTask[],
  subId: string,
  newTitle: string
): SubTask[] {
  return subtasks.map((item) => {
    if (item.id === subId) {
      return { ...item, title: newTitle };
    }
    if (item.subtasks && item.subtasks.length > 0) {
      return {
        ...item,
        subtasks: updateSubtaskTitleInTree(item.subtasks, subId, newTitle),
      };
    }
    return item;
  });
}
/**
 * Cập nhật trạng thái của một bước con (Subtask) ở bất kỳ tầng đệ quy nào (bậc 1, bậc 2, bậc 3...)
 */
export function updateSubtaskStatusInTree(
  subtasks: SubTask[],
  subId: string,
  newStatus: string,
  isDoneCategory: boolean
): SubTask[] {
  return subtasks.map((item) => {
    if (item.id === subId) {
      const updatedItem = {
        ...item,
        status: newStatus,
        completed: isDoneCategory,
      };
      if (isDoneCategory && item.subtasks) {
        return cascadeSubtaskCompleted(updatedItem, true);
      }
      return updatedItem;
    }
    if (item.subtasks && item.subtasks.length > 0) {
      const updatedChildren = updateSubtaskStatusInTree(item.subtasks, subId, newStatus, isDoneCategory);
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
