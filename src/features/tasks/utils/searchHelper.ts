import { Task, SubTask } from '../../../types';

/**
 * Kiểm tra xem một Subtask (hoặc các nhánh con của nó) có chứa từ khóa hay không
 */
export function matchSubtaskRecursive(sub: SubTask, query: string): boolean {
  if (sub.title.toLowerCase().includes(query)) return true;
  if (sub.subtasks && sub.subtasks.length > 0) {
    return sub.subtasks.some((child: SubTask) => matchSubtaskRecursive(child, query));
  }
  return false;
}

/**
 * Kiểm tra xem một Task có khớp tìm kiếm (bởi tiêu đề của nó hoặc bất kỳ bước con nào)
 */
export function matchTaskDeep(task: Task, query: string): boolean {
  if (!query || !query.trim()) return true;
  const q = query.trim().toLowerCase();
  if (task.title.toLowerCase().includes(q)) return true;
  if (task.subtasks && task.subtasks.length > 0) {
    return task.subtasks.some((sub: SubTask) => matchSubtaskRecursive(sub, q));
  }
  return false;
}
