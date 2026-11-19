import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Project, SubTask, Task } from '../../../../types';
import { toggleSubtaskTransition, toggleTaskDoneTransition } from '../taskTransitions';
import { restoreTaskSnapshot } from '../taskSnapshot';

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 20, 10, 0, 0));
});
afterEach(() => {
  vi.useRealTimers();
});

const step = (id: string, patch: Partial<SubTask> = {}): SubTask => ({ id, title: id, completed: false, status: 'todo', ...patch });
const projectsWith = (task: Task, other?: Task): Project[] => [{ id: 'p1', name: 'P', tasks: other ? [task, other] : [task] } as Project];
const apply = (projects: Project[], fn: (t: Task) => Task): Project[] =>
  projects.map((p) => ({ ...p, tasks: p.tasks.map((t) => (t.id === 't1' ? fn(t) : t)) }));

describe('F10: Done trong Daily Focus hoàn tác được', () => {
  it('hoàn tác trả việc về đúng trạng thái trước (Doing, chuỗi, việc con), không phải về Todo', () => {
    const before: Task = {
      id: 't1',
      title: 'Plan your day',
      status: 'doing',
      recurrence: 'daily',
      recurrenceStreak: 3,
      lastCompletedDate: '2026-11-19',
      subtasks: [step('s1', { completed: true, status: 'done' }), step('s2')],
      updatedAt: '2026-11-19T08:00:00.000Z',
    };
    const done = apply(projectsWith(before), (t) => toggleTaskDoneTransition(t, true));
    expect(done[0].tasks[0].recurrenceStreak).toBe(4);
    const restored = restoreTaskSnapshot(done, 'p1', before)[0].tasks[0];
    expect(restored.status).toBe('doing');
    expect(restored.recurrenceStreak).toBe(3);
    expect(restored.lastCompletedDate).toBe('2026-11-19');
    expect(restored.subtasks.map((s) => s.completed)).toEqual([true, false]);
    expect(restored.completedAt).toBeUndefined();
    // Dấu thời gian để trống để lần khôi phục được đóng dấu mới (đồng bộ không chọn nhầm bản đã xong)
    expect(restored.updatedAt).toBeUndefined();
  });

  it('hoàn tác bước con cuối cùng: việc cha rời Done, bước con mở lại', () => {
    const before: Task = { id: 't1', title: 'Launch', status: 'doing', subtasks: [step('s1', { completed: true, status: 'done' }), step('s2')] };
    const done = apply(projectsWith(before), (t) => toggleSubtaskTransition(t, 's2', true));
    expect(done[0].tasks[0].status).toBe('done');
    const restored = restoreTaskSnapshot(done, 'p1', before)[0].tasks[0];
    expect(restored.status).toBe('doing');
    expect(restored.subtasks[1].completed).toBe(false);
  });

  it('giữ nguyên các việc khác và việc đã bị xóa thì không hồi sinh', () => {
    const before: Task = { id: 't1', title: 'A', status: 'todo', subtasks: [] };
    const other: Task = { id: 't2', title: 'B', status: 'todo', subtasks: [] };
    const projects = projectsWith(toggleTaskDoneTransition(before, true), other);
    const restored = restoreTaskSnapshot(projects, 'p1', before);
    expect(restored[0].tasks[1]).toBe(other);
    const deleted: Project[] = [{ id: 'p1', name: 'P', tasks: [other] } as Project];
    expect(restoreTaskSnapshot(deleted, 'p1', before)).toBe(deleted);
  });
});
