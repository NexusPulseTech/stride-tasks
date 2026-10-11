import { Project, Task, SubTask, RecurrenceType } from '../../../types';

/**
 * Trả về chuỗi ngày hôm nay theo giờ địa phương: YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Kiểm tra xem công việc lặp lại có cần làm mới khi sang ngày mới hay không
 */
export function shouldResetRecurrence(recurrence?: RecurrenceType, lastCompletedDate?: string): boolean {
  if (!recurrence || !lastCompletedDate) return false;
  const today = getTodayDateString();
  if (lastCompletedDate >= today) return false; // Đã làm hôm nay rồi

  if (recurrence === 'daily') {
    return true; // Qua ngày mới thì reset
  }

  if (recurrence === 'weekdays') {
    const dayOfWeek = new Date().getDay(); // 0: CN, 1: T2, ..., 5: T6, 6: T7
    return dayOfWeek >= 1 && dayOfWeek <= 5;
  }

  if (recurrence === 'weekly') {
    const last = new Date(lastCompletedDate).getTime();
    const now = new Date(today).getTime();
    const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
    return diffDays >= 7;
  }

  return false;
}

/**
 * Kiểm tra xem công việc lặp lại đã được tích hoàn thành trong ngày hôm nay chưa
 */
export function isRecurringDoneToday(taskOrSub: { recurrence?: RecurrenceType; lastCompletedDate?: string }): boolean {
  if (!taskOrSub.recurrence || !taskOrSub.lastCompletedDate) return false;
  return taskOrSub.lastCompletedDate === getTodayDateString();
}

/**
 * Reset đệ quy các việc con khi việc cha lặp lại được reset cho ngày mới
 */
function resetSubtasksForNewDay(subtasks: SubTask[]): SubTask[] {
  if (!Array.isArray(subtasks)) return [];
  return subtasks.map((s) => ({
    ...s,
    completed: false,
    status: 'todo',
    subtasks: s.subtasks ? resetSubtasksForNewDay(s.subtasks) : [],
  }));
}

/**
 * Quét toàn bộ hệ thống và tự động làm mới các việc lặp lại khi sang ngày mới (Auto-Rollover)
 */
export function processDailyRecurrenceRollover(projects: Project[]): {
  updatedProjects: Project[];
  resetCount: number;
} {
  let resetCount = 0;

  const updatedProjects = projects.map((p) => {
    let projectChanged = false;

    const newTasks = p.tasks.map((t) => {
      let taskChanged = false;
      let nextStatus = t.status;
      let nextSubs = t.subtasks;
      let nextLastCompletedDate = t.lastCompletedDate;

      // 1. Kiểm tra task cha có recurrence: chỉ làm mới nếu task đang ở trạng thái đã xong (done) hoặc có đánh dấu hoàn thành
      const isTaskDone = t.status === 'done' || Boolean(t.completedAt);
      if (t.recurrence && isTaskDone && shouldResetRecurrence(t.recurrence, t.lastCompletedDate)) {
        nextStatus = 'todo';
        nextSubs = resetSubtasksForNewDay(t.subtasks);
        nextLastCompletedDate = undefined;
        taskChanged = true;
        projectChanged = true;
        resetCount++;
      } else {
        // 2. Kiểm tra các subtask riêng lẻ có recurrence
        const updateSubsRecursive = (subs: SubTask[]): { updated: SubTask[]; changed: boolean } => {
          let subsChanged = false;
          const next = subs.map((s) => {
            let sChanged = false;
            let nextCompleted = s.completed;
            let nextSStatus = s.status;
            let nextSLastCompletedDate = s.lastCompletedDate;

            const isSubDone = s.completed || s.status === 'done';
            if (s.recurrence && isSubDone && shouldResetRecurrence(s.recurrence, s.lastCompletedDate)) {
              nextCompleted = false;
              nextSStatus = 'todo';
              nextSLastCompletedDate = undefined;
              sChanged = true;
              subsChanged = true;
              resetCount++;
            }

            let nestedSubs = s.subtasks;
            if (s.subtasks && s.subtasks.length > 0) {
              const res = updateSubsRecursive(s.subtasks);
              if (res.changed) {
                nestedSubs = res.updated;
                sChanged = true;
                subsChanged = true;
              }
            }

            return sChanged
              ? {
                  ...s,
                  completed: nextCompleted,
                  status: nextSStatus,
                  lastCompletedDate: nextSLastCompletedDate,
                  subtasks: nestedSubs,
                }
              : s;
          });
          return { updated: next, changed: subsChanged };
        };

        if (t.subtasks && t.subtasks.length > 0) {
          const res = updateSubsRecursive(t.subtasks);
          if (res.changed) {
            nextSubs = res.updated;
            taskChanged = true;
            projectChanged = true;
          }
        }
      }

      return taskChanged
        ? {
            ...t,
            status: nextStatus,
            completedAt: undefined,
            lastCompletedDate: nextLastCompletedDate,
            subtasks: nextSubs,
          }
        : t;
    });

    return projectChanged ? { ...p, tasks: newTasks } : p;
  });

  return { updatedProjects, resetCount };
}

/**
 * Cho phép người dùng bấm "Làm mới ngay bây giờ" một việc lặp lại trong ngày (cho cả Task và Subtask)
 */
export function manuallyResetRecurringTask(projects: Project[], projId: string, taskId: string): Project[] {
  return projects.map((p) => {
    if (p.id !== projId) return p;
    return {
      ...p,
      tasks: p.tasks.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          status: 'todo',
          completedAt: undefined,
          lastCompletedDate: undefined,
          subtasks: resetSubtasksForNewDay(t.subtasks),
        };
      }),
    };
  });
}

/**
 * Làm mới thủ công 1 việc con lặp lại cụ thể trong ngày
 */
export function manuallyResetRecurringSubTask(
  projects: Project[],
  projId: string,
  taskId: string,
  subId: string
): Project[] {
  const resetSubInTree = (subs: SubTask[]): SubTask[] => {
    return subs.map((s) => {
      if (s.id === subId) {
        return {
          ...s,
          completed: false,
          status: 'todo',
          lastCompletedDate: undefined,
          subtasks: s.subtasks ? resetSubtasksForNewDay(s.subtasks) : [],
        };
      }
      if (s.subtasks && s.subtasks.length > 0) {
        return {
          ...s,
          subtasks: resetSubInTree(s.subtasks),
        };
      }
      return s;
    });
  };

  return projects.map((p) => {
    if (p.id !== projId) return p;
    return {
      ...p,
      tasks: p.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const nextSubs = resetSubInTree(t.subtasks);
        return {
          ...t,
          status: t.status === 'done' ? 'doing' : t.status,
          subtasks: nextSubs,
        };
      }),
    };
  });
}

/**
 * Cập nhật chu kỳ lặp lại cho một task
 */
export function updateTaskRecurrenceRule(
  projects: Project[],
  projId: string,
  taskId: string,
  recurrence: RecurrenceType
): Project[] {
  return projects.map((p) => {
    if (p.id !== projId) return p;
    return {
      ...p,
      tasks: p.tasks.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          recurrence,
        };
      }),
    };
  });
}

/**
 * Cập nhật chu kỳ lặp lại cho một subtask đệ quy
 */
export function updateSubTaskRecurrenceRule(
  projects: Project[],
  projId: string,
  taskId: string,
  subId: string,
  recurrence: RecurrenceType
): Project[] {
  const updateTree = (subs: SubTask[]): SubTask[] => {
    return subs.map((s) => {
      if (s.id === subId) {
        return { ...s, recurrence };
      }
      if (s.subtasks && s.subtasks.length > 0) {
        return { ...s, subtasks: updateTree(s.subtasks) };
      }
      return s;
    });
  };

  return projects.map((p) => {
    if (p.id !== projId) return p;
    return {
      ...p,
      tasks: p.tasks.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          subtasks: updateTree(t.subtasks),
        };
      }),
    };
  });
}
