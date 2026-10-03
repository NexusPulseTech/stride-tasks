import { StatusDefinition, SubTask } from '../../../types';
import { DEFAULT_STATUSES } from '../hooks/useStatusManager';

export function getStatusCategory(
  statusId: string,
  customStatuses: StatusDefinition[] = []
): 'todo' | 'doing' | 'done' {
  const status = customStatuses.find((item) => item.id === statusId)
    || DEFAULT_STATUSES.find((item) => item.id === statusId);
  if (status) return status.category;
  if (statusId === 'done') return 'done';
  if (['doing', 'review', 'testing', 'blocked', 'paused'].includes(statusId)) return 'doing';
  return 'todo';
}

export function isDoneStatus(statusId: string, statuses: StatusDefinition[] = []): boolean {
  return getStatusCategory(statusId, statuses) === 'done';
}

export function isDoingStatus(statusId: string, statuses: StatusDefinition[] = []): boolean {
  return !isDoneStatus(statusId, statuses);
}

export function countSubtaskLeaves(
  subtask: SubTask,
  statuses: StatusDefinition[] = []
): { total: number; completed: number } {
  if (!subtask.subtasks?.length) {
    return {
      total: 1,
      completed: Number(subtask.completed || (subtask.status ? isDoneStatus(subtask.status, statuses) : false)),
    };
  }

  return subtask.subtasks.reduce(
    (counts, child) => {
      const childCounts = countSubtaskLeaves(child, statuses);
      return { total: counts.total + childCounts.total, completed: counts.completed + childCounts.completed };
    },
    { total: 0, completed: 0 }
  );
}