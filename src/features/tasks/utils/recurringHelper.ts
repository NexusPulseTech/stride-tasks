import { Project, Task, SubTask, RecurrenceType, StreakUndo } from '../../../types';

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

type RecurringFields = {
  recurrence?: RecurrenceType;
  lastCompletedDate?: string;
  recurrenceStreak?: number;
  streakUndo?: StreakUndo;
};

/** Số ngày giữa hai ngày dạng YYYY-MM-DD (b trừ a), không lệch vì giờ mùa hè */
function daysBetween(a: string, b: string): number {
  const toUtc = (key: string) => {
    const [y, m, d] = key.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtc(b) - toUtc(a)) / 86_400_000);
}

/**
 * Làm xong vào ngày `today` thì chuỗi có liền với lần làm xong `last` không (không lỡ chu kỳ nào ở giữa).
 * Hằng ngày: cách nhau tối đa 1 ngày. Ngày thường: không có thứ Hai đến thứ Sáu nào bị bỏ qua ở giữa.
 * Hằng tuần: việc làm mới sau 7 ngày và có 7 ngày để làm, nên cách nhau tối đa 13 ngày.
 */
export function streakContinues(recurrence: RecurrenceType | undefined, last: string, today: string): boolean {
  const gap = daysBetween(last, today);
  if (gap <= 1) return true;
  if (recurrence === 'weekly') return gap <= 13;
  if (recurrence === 'weekdays') {
    if (gap > 7) return false;
    const [y, m, d] = last.split('-').map(Number);
    for (let i = 1; i < gap; i++) {
      const day = new Date(y, m - 1, d + i).getDay();
      if (day >= 1 && day <= 5) return false;
    }
    return true;
  }
  return false;
}

/**
 * Nơi duy nhất ghi nhận một việc lặp lại (việc chính hoặc việc con) vừa được làm xong: ngày làm xong theo giờ máy
 * và chuỗi ngày. Chỉ gọi khi việc chuyển từ chưa xong sang xong, dù bằng vòng tròn, ô trạng thái, Kanban hay
 * việc con xong hết. Thiếu ngày làm xong thì `shouldResetRecurrence` không bao giờ làm mới việc (B12 F01).
 * B12 F02: mỗi ngày cộng tối đa 1; lỡ một chu kỳ thì bắt đầu lại từ 1; giữ giá trị cũ trong `streakUndo` để bỏ tích
 * thì trả lại. Việc chưa có ngày làm xong (dữ liệu cũ, việc mẫu) thì cộng tiếp vì không biết lịch sử.
 */
export function markRecurringDone<T extends RecurringFields>(item: T): T {
  if (!item.recurrence) return item;
  const today = getTodayDateString();
  if (item.lastCompletedDate === today) return item;
  const continues = !item.lastCompletedDate || streakContinues(item.recurrence, item.lastCompletedDate, today);
  return {
    ...item,
    lastCompletedDate: today,
    recurrenceStreak: continues ? (item.recurrenceStreak || 0) + 1 : 1,
    streakUndo: { lastCompletedDate: item.lastCompletedDate, recurrenceStreak: item.recurrenceStreak },
  };
}

/** Bỏ tích việc lặp lại vừa làm xong: trả ngày làm xong và chuỗi về trước lần làm xong đó (B12 F02). */
export function unmarkRecurringDone<T extends RecurringFields>(item: T): T {
  if (!item.recurrence || !item.streakUndo) return item;
  return {
    ...item,
    lastCompletedDate: item.streakUndo.lastCompletedDate,
    recurrenceStreak: item.streakUndo.recurrenceStreak,
    streakUndo: undefined,
  };
}

/** Chuỗi về 0 khi đã lỡ một chu kỳ tính tới hôm nay (B12 F02: trước đây chuỗi không bao giờ bị ngắt). */
export function breakStaleStreak<T extends RecurringFields>(item: T, today: string = getTodayDateString()): T {
  if (!item.recurrence || !item.recurrenceStreak || !item.lastCompletedDate) return item;
  if (item.lastCompletedDate >= today || streakContinues(item.recurrence, item.lastCompletedDate, today)) return item;
  return { ...item, recurrenceStreak: 0, streakUndo: undefined };
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
function resetSubtasksForNewDay(subtasks: SubTask[], today: string = getTodayDateString()): SubTask[] {
  if (!Array.isArray(subtasks)) return [];
  return subtasks.map((s) => ({
    ...breakStaleStreak(s, today),
    completed: false,
    status: 'todo',
    streakUndo: undefined,
    subtasks: s.subtasks ? resetSubtasksForNewDay(s.subtasks, today) : [],
  }));
}

/**
 * Quét toàn bộ hệ thống và tự động làm mới các việc lặp lại khi sang ngày mới (Auto-Rollover).
 * B12 F02: giữ ngày làm xong gần nhất (để biết chuỗi có liền không) và đặt chuỗi về 0 khi đã lỡ một chu kỳ.
 * Mục nào không đổi thì giữ nguyên tham chiếu, để không ghi lại dữ liệu khi không có gì mới.
 */
export function processDailyRecurrenceRollover(projects: Project[]): {
  updatedProjects: Project[];
  resetCount: number;
} {
  let resetCount = 0;
  const today = getTodayDateString();

  const rollSubtask = (s: SubTask): SubTask => {
    let next = breakStaleStreak(s, today);
    const isSubDone = s.completed || s.status === 'done';
    if (s.recurrence && isSubDone && shouldResetRecurrence(s.recurrence, s.lastCompletedDate)) {
      next = { ...next, completed: false, status: 'todo', streakUndo: undefined };
      resetCount++;
    }
    if (s.subtasks && s.subtasks.length > 0) {
      const children = s.subtasks.map(rollSubtask);
      if (children.some((c, i) => c !== s.subtasks![i])) next = { ...next, subtasks: children };
    }
    return next;
  };

  const rollTask = (t: Task): Task => {
    const next = breakStaleStreak(t, today);
    // Chỉ làm mới việc đang ở trạng thái đã xong (done) hoặc có đánh dấu hoàn thành
    const isTaskDone = t.status === 'done' || Boolean(t.completedAt);
    if (t.recurrence && isTaskDone && shouldResetRecurrence(t.recurrence, t.lastCompletedDate)) {
      resetCount++;
      return {
        ...next,
        status: 'todo',
        completedAt: undefined,
        streakUndo: undefined,
        subtasks: resetSubtasksForNewDay(t.subtasks, today),
        // Chu kỳ mới: quỹ thời gian tính lại từ 0 (lịch sử Deep Work đã nằm trong focus log)
        focusedMinutes: undefined,
        pomodoroSessions: undefined,
      };
    }
    if (t.subtasks && t.subtasks.length > 0) {
      const subs = t.subtasks.map(rollSubtask);
      if (subs.some((sub, i) => sub !== t.subtasks[i])) return { ...next, subtasks: subs };
    }
    return next;
  };

  const updatedProjects = projects.map((p) => {
    const newTasks = p.tasks.map(rollTask);
    return newTasks.some((t, i) => t !== p.tasks[i]) ? { ...p, tasks: newTasks } : p;
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
          // B12 F02: giữ ngày làm xong để tích lại trong ngày không cộng chuỗi lần nữa
          streakUndo: undefined,
          subtasks: resetSubtasksForNewDay(t.subtasks),
          focusedMinutes: undefined,
          pomodoroSessions: undefined,
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
          streakUndo: undefined,
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
