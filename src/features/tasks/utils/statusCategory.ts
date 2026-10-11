import { StatusDefinition } from '../../../types';
import { DEFAULT_STATUSES } from '../hooks/useStatusManager';

/**
 * Phân loại trạng thái thành 3 dạng chính theo kiến trúc Linear / ClickUp:
 * 1. 'all': Tất cả
 * 2. 'doing': Quá trình đang làm (gồm doing, todo, review, testing, blocked, paused, và bất kỳ custom status nào chưa hoàn thành)
 * 3. 'done': Đã xong (gồm done và custom done)
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
 * Kiểm tra xem một trạng thái có thuộc quá trình đang làm hay không.
 * Mọi trạng thái chưa hoàn thành (doing, review, testing, blocked, paused, todo, custom in-progress)
 * đều thuộc tiến trình thực hiện công việc (In-Progress Process).
 */
export function isDoingStatus(
  statusId: string,
  customStatuses: StatusDefinition[] = []
): boolean {
  return !isDoneStatus(statusId, customStatuses);
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
