import type { Project, StatusDefinition, SubTask, Task } from '../../../types';
import { isDoingStatus } from './statusCategory';
import { withFreshStamp } from './taskSnapshot';

export interface ShutdownPlan {
  projects: Project[];
  movedCount: number;
  /** Bản trước khi dời của từng việc đã đổi, khóa `${projectId}/${taskId}` */
  before: Map<string, Task>;
}

/** Trạng thái người dùng chủ động gác lại: Shutdown Ritual không đụng tới */
const PARKED_STATUSES: ReadonlySet<string> = new Set(['blocked', 'paused']);

function isActiveDoing(status: string | undefined, statuses: StatusDefinition[]): boolean {
  return Boolean(status) && !PARKED_STATUSES.has(status!) && isDoingStatus(status!, statuses);
}

/** Đưa việc con đang làm (chưa xong) về Todo; trả nguyên tham chiếu khi không có gì đổi */
function resetDoingSubtasks(subs: SubTask[] | undefined, statuses: StatusDefinition[]): SubTask[] | undefined {
  if (!subs || subs.length === 0) return subs;
  let changed = false;
  const next = subs.map((s) => {
    const children = resetDoingSubtasks(s.subtasks, statuses);
    const resetSelf = !s.completed && isActiveDoing(s.status, statuses);
    if (!resetSelf && children === s.subtasks) return s;
    changed = true;
    return { ...s, status: resetSelf ? 'todo' : s.status, subtasks: children };
  });
  return changed ? next : subs;
}

/**
 * Shutdown Ritual cuối ngày, tính trên dữ liệu trước khi cập nhật state (B12 F04: trước đây số việc đã dời được cộng
 * bên trong hàm cập nhật của React, nên thông báo phụ thuộc lúc React chạy hàm đó).
 * B12 F05: dời mọi việc thuộc nhóm "đang làm" (kể cả trạng thái tùy chỉnh và việc con đang làm), trừ Blocked và Paused;
 * nhắc chưa có hoặc đã quá hạn thì đặt 9:00 sáng mai, nhắc trong tương lai giữ nguyên; giữ bản cũ để hoàn tác.
 */
export function planShutdownRitual(projects: Project[], statuses: StatusDefinition[] = [], now: Date = new Date()): ShutdownPlan {
  const tomorrowMorning = new Date(now);
  tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);
  tomorrowMorning.setHours(9, 0, 0, 0);
  const tomorrowIso = tomorrowMorning.toISOString();
  const nowMs = now.getTime();

  const before = new Map<string, Task>();
  let movedCount = 0;

  const next = projects.map((p) => {
    let projectChanged = false;
    const tasks = p.tasks.map((t) => {
      const taskDoing = isActiveDoing(t.status, statuses);
      const subtasks = resetDoingSubtasks(t.subtasks, statuses) ?? t.subtasks;
      if (!taskDoing && subtasks === t.subtasks) return t;

      const reminderMs = t.reminderAt ? new Date(t.reminderAt).getTime() : NaN;
      const keepReminder = !isNaN(reminderMs) && reminderMs >= nowMs;
      movedCount += 1;
      projectChanged = true;
      before.set(`${p.id}/${t.id}`, t);
      return {
        ...t,
        status: taskDoing ? 'todo' : t.status,
        reminderAt: keepReminder ? t.reminderAt : tomorrowIso,
        subtasks,
      };
    });
    return projectChanged ? { ...p, tasks } : p;
  });

  return { projects: next, movedCount, before };
}

/** Hoàn tác Shutdown Ritual: trả lại đúng các việc đã dời, giữ nguyên mọi việc khác (kể cả thay đổi làm sau đó) */
export function undoShutdownRitual(projects: Project[], before: Map<string, Task>): Project[] {
  if (before.size === 0) return projects;
  return projects.map((p) => {
    let changed = false;
    const tasks = p.tasks.map((t) => {
      const original = before.get(`${p.id}/${t.id}`);
      if (!original) return t;
      changed = true;
      return withFreshStamp(original, t);
    });
    return changed ? { ...p, tasks } : p;
  });
}
