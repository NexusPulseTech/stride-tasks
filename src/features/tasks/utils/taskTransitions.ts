import type { SubTask, Task } from '../../../types';
import { markRecurringDone } from './recurringHelper';
import {
  cascadeSubtaskCompleted,
  determineTaskStatusFromSubtasks,
  toggleSubtaskInTree,
  updateSubtaskStatusInTree,
} from './subtaskTree';

/**
 * Các bước đổi trạng thái của một việc, tách khỏi hook để mọi đường (vòng tròn, ô trạng thái, Kanban, việc con)
 * dùng chung một quy tắc và test được không cần giao diện.
 */

/** Việc đang ở trạng thái xong (gồm trạng thái tùy chỉnh nhóm done: chúng luôn có completedAt). */
export function isTaskMarkedDone(t: Pick<Task, 'status' | 'completedAt'>): boolean {
  return t.status === 'done' || Boolean(t.completedAt);
}

/**
 * Gán trạng thái mới cho việc chính. Khi việc chuyển từ chưa xong sang xong thì ghi nhận việc lặp lại
 * (B12 F01: trước đây chỉ vòng tròn ghi, ô trạng thái và Kanban thì không, nên việc nằm ở Done mãi).
 */
function withTaskStatus(t: Task, status: string, isDone: boolean): Task {
  const next: Task = {
    ...t,
    status,
    completedAt: isDone ? t.completedAt || new Date().toISOString() : undefined,
    snoozeUntil: isDone ? undefined : t.snoozeUntil,
  };
  return isDone && !isTaskMarkedDone(t) ? markRecurringDone(next) : next;
}

/** Vòng tròn "Mark done" của một việc. */
export function toggleTaskDoneTransition(t: Task, isChecked: boolean): Task {
  const next = withTaskStatus(t, isChecked ? 'done' : 'todo', isChecked);
  return isChecked ? { ...next, subtasks: t.subtasks.map((s) => cascadeSubtaskCompleted(s, true)) } : next;
}

/** Ô trạng thái, cột Kanban, bước tiếp theo trên thẻ Kanban. */
export function changeTaskStatusTransition(t: Task, status: string, isDoneCategory: boolean): Task {
  let nextSubs = t.subtasks;
  if (isDoneCategory) {
    // Sang Đã xong: hoàn thành toàn bộ việc con
    nextSubs = t.subtasks.map((s) => cascadeSubtaskCompleted(s, true));
  } else if (status === 'todo' || t.status === 'done') {
    // Về Chờ, hoặc từ Đã xong sang Đang làm/Duyệt/Nghẽn/tùy chỉnh: mở lại việc con để việc cha không bị đẩy ngược về Done
    nextSubs = t.subtasks.map((s) => cascadeSubtaskCompleted(s, false));
  }
  return { ...withTaskStatus(t, status, isDoneCategory), subtasks: nextSubs };
}

/** Ô trạng thái của một việc con; việc con xong hết thì việc cha lên Done. */
export function changeSubtaskStatusTransition(t: Task, subId: string, status: string, isDoneCategory: boolean): Task {
  const updatedSubs = updateSubtaskStatusInTree(t.subtasks, subId, status, isDoneCategory);
  const nextTaskStatus = determineTaskStatusFromSubtasks(
    t.status === 'done' || isDoneCategory ? (t.status === 'done' ? 'done' : 'doing') : t.status,
    updatedSubs
  );
  return { ...withTaskStatus(t, nextTaskStatus, nextTaskStatus === 'done'), subtasks: updatedSubs };
}

/**
 * Thay cây việc con rồi tính lại trạng thái việc cha (tích, thêm, xóa, sắp xếp việc con).
 * Trạng thái không đổi thì giữ nguyên các trường khác.
 */
export function withSubtasks(t: Task, subtasks: SubTask[]): Task {
  const nextStatus = determineTaskStatusFromSubtasks(t.status, subtasks);
  if (nextStatus === t.status) return { ...t, subtasks };
  return { ...withTaskStatus(t, nextStatus, nextStatus === 'done'), subtasks };
}

/** Ô tích của một việc con; việc con xong hết thì việc cha lên Done. */
export function toggleSubtaskTransition(t: Task, subId: string, isChecked: boolean): Task {
  return withSubtasks(t, toggleSubtaskInTree(t.subtasks, subId, isChecked).updatedSubtasks);
}
