import type { Project, SubTask, Task } from '../../../types';

/**
 * Bản cũ của một việc để khôi phục (Hoàn tác), bỏ `updatedAt` ở việc và ở việc con có trạng thái khác hiện tại, để lần
 * khôi phục được đóng dấu thời gian mới (bản mang dấu cũ sẽ thua bản vừa đổi khi đồng bộ giữa các thiết bị).
 */
export function withFreshStamp(snapshot: Task, current: Task): Task {
  const currentState = new Map<string, string>();
  const collect = (subs: SubTask[] | undefined) =>
    subs?.forEach((s) => {
      currentState.set(s.id, `${s.status ?? ''}|${s.completed}`);
      collect(s.subtasks);
    });
  collect(current.subtasks);
  const fix = (subs: SubTask[] | undefined): SubTask[] | undefined =>
    subs?.map((s) => {
      const children = fix(s.subtasks);
      const differs = currentState.has(s.id) && currentState.get(s.id) !== `${s.status ?? ''}|${s.completed}`;
      if (!differs && children === s.subtasks) return s;
      return { ...s, subtasks: children, ...(differs ? { updatedAt: undefined } : {}) };
    });
  return { ...snapshot, updatedAt: undefined, subtasks: fix(snapshot.subtasks) ?? [] };
}

/**
 * Trả một việc về bản đã chụp trước khi đổi (B15 F10: Hoàn tác Done trong Daily Focus). Việc đã bị xóa thì không hồi
 * sinh; các việc khác giữ nguyên tham chiếu.
 */
export function restoreTaskSnapshot(projects: Project[], projectId: string, snapshot: Task): Project[] {
  let found = false;
  const next = projects.map((p) => {
    if (p.id !== projectId) return p;
    const tasks = p.tasks.map((t) => {
      if (t.id !== snapshot.id) return t;
      found = true;
      return withFreshStamp(snapshot, t);
    });
    return found ? { ...p, tasks } : p;
  });
  return found ? next : projects;
}
