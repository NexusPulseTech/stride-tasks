import { FilterType, StatusDefinition, Task } from '../../../types';
import { DEFAULT_STATUSES } from '../hooks/useStatusManager';

/**
 * Phân loại trạng thái thành 3 nhóm, khớp với 3 cột Kanban:
 * 1. 'todo': chưa bắt đầu (todo và trạng thái tùy chỉnh thuộc nhóm todo)
 * 2. 'doing': đang làm (doing, review, testing, blocked, paused và trạng thái tùy chỉnh thuộc nhóm doing)
 * 3. 'done': đã xong (done và trạng thái tùy chỉnh thuộc nhóm done)
 */
export function getStatusCategory(
  statusId: string,
  customStatuses: StatusDefinition[] = []
): 'todo' | 'doing' | 'done' {
  const match =
    customStatuses.find((s) => s.id === statusId) ||
    DEFAULT_STATUSES.find((s) => s.id === statusId);

  if (match) return match.category;
  if (statusId === 'done') return 'done';
  if (['doing', 'review', 'testing', 'blocked', 'paused'].includes(statusId)) return 'doing';
  return 'todo';
}

/**
 * Trạng thái thuộc nhóm "đang làm" (cột In progress của Kanban). KHÔNG gồm việc chưa bắt đầu.
 * A17: trước đây hàm này trả true cho mọi việc chưa xong, nên tab "Doing" và số WIP của báo cáo đếm cả việc Todo
 * (ví dụ "Doing 11" trong khi Kanban ghi In progress 3). Chỗ nào cần "chưa xong" thì dùng !isDoneStatus.
 */
export function isDoingStatus(
  statusId: string,
  customStatuses: StatusDefinition[] = []
): boolean {
  return getStatusCategory(statusId, customStatuses) === 'doing';
}

/**
 * Kiểm tra xem một trạng thái có phải là Đã xong (Done) hay không.
 */
export function isDoneStatus(
  statusId: string,
  customStatuses: StatusDefinition[] = []
): boolean {
  return getStatusCategory(statusId, customStatuses) === 'done';
}

/** Việc có hẹn (giờ nhắc hoặc hạn chót) và chưa xong: dùng chung cho tab Scheduled, số đếm và danh sách. */
export function isScheduledTask(task: Pick<Task, 'status' | 'reminderAt' | 'deadline'>, customStatuses: StatusDefinition[] = []): boolean {
  return Boolean(task.reminderAt || task.deadline) && !isDoneStatus(task.status, customStatuses);
}

export interface TaskListFilter {
  filter: FilterType;
  isFocusMode: boolean;
  hideCompletedInAll: boolean;
  searching: boolean;
}

/**
 * Việc nào hiện trong danh sách của một dự án (A17: trước đây tab Scheduled chỉ lọc dự án, không lọc từng việc,
 * nên vẫn hiện việc chưa hẹn và việc đã xong).
 * - Đang tìm kiếm: hiện tất cả (đã lọc sâu theo từ khóa ở bước lọc dự án).
 * - Chế độ Focus: mọi việc chưa xong. Tab Doing: chỉ việc đang làm. Tab Scheduled: việc có hẹn chưa xong.
 * - Tab Completed: việc đã xong. Tab All: tất cả, hoặc chỉ việc chưa xong khi bật ẩn việc xong.
 */
export function taskMatchesListFilter(
  task: Pick<Task, 'status' | 'reminderAt' | 'deadline'>,
  view: TaskListFilter,
  customStatuses: StatusDefinition[] = []
): boolean {
  if (view.searching) return true;
  if (view.isFocusMode) return !isDoneStatus(task.status, customStatuses);
  switch (view.filter) {
    case 'doing':
      return isDoingStatus(task.status, customStatuses);
    case 'scheduled':
      return isScheduledTask(task, customStatuses);
    case 'completed':
      return isDoneStatus(task.status, customStatuses);
    default:
      return view.hideCompletedInAll ? !isDoneStatus(task.status, customStatuses) : true;
  }
}
