import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Project, SubTask, Task } from '../../../../types';
import { processDailyRecurrenceRollover } from '../recurringHelper';
import {
  changeSubtaskStatusTransition,
  changeTaskStatusTransition,
  toggleSubtaskTransition,
  toggleTaskDoneTransition,
  withSubtasks,
} from '../taskTransitions';

// Giờ máy cố định để ngày "hôm nay" và ngày theo UTC khác nhau trước 7 giờ sáng
const ORIGINAL_TZ = process.env.TZ;
beforeAll(() => {
  process.env.TZ = 'Asia/Ho_Chi_Minh';
});
afterAll(() => {
  process.env.TZ = ORIGINAL_TZ;
});

// 19/11/2026 10:00 giờ máy
const DAY1 = new Date(2026, 10, 19, 10, 0, 0);
const DAY1_KEY = '2026-11-19';
const DAY2_MORNING = new Date(2026, 10, 20, 8, 0, 0);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(DAY1);
});
afterEach(() => {
  vi.useRealTimers();
});

const sub = (patch: Partial<SubTask> = {}): SubTask => ({ id: 's1', title: 'Step', completed: false, status: 'todo', ...patch });

const dailyTask = (patch: Partial<Task> = {}): Task => ({
  id: 't1',
  title: 'Plan your day',
  status: 'todo',
  subtasks: [],
  recurrence: 'daily',
  recurrenceStreak: 3,
  lastCompletedDate: '2026-11-18',
  ...patch,
});

const rollover = (task: Task): Task => {
  const projects: Project[] = [{ id: 'p1', name: 'P', tasks: [task] } as Project];
  return processDailyRecurrenceRollover(projects).updatedProjects[0].tasks[0];
};

describe('F01: mọi đường đánh dấu xong đều ghi nhận việc lặp lại', () => {
  it('ô trạng thái hoặc cột Done của Kanban: ghi ngày làm xong và tăng chuỗi như vòng tròn', () => {
    const viaCircle = toggleTaskDoneTransition(dailyTask(), true);
    const viaStatus = changeTaskStatusTransition(dailyTask(), 'done', true);
    expect(viaCircle.lastCompletedDate).toBe(DAY1_KEY);
    expect(viaCircle.recurrenceStreak).toBe(4);
    expect(viaStatus.lastCompletedDate).toBe(DAY1_KEY);
    expect(viaStatus.recurrenceStreak).toBe(4);
    expect(viaStatus.completedAt).toBeTruthy();
  });

  it('trạng thái tùy chỉnh thuộc nhóm done cũng được ghi nhận', () => {
    const next = changeTaskStatusTransition(dailyTask(), 'shipped', true);
    expect(next.status).toBe('shipped');
    expect(next.lastCompletedDate).toBe(DAY1_KEY);
    expect(next.recurrenceStreak).toBe(4);
  });

  it('sáng hôm sau việc xong qua ô trạng thái quay về Todo (việc mẫu chưa từng có ngày làm xong)', () => {
    const done = changeTaskStatusTransition(dailyTask({ lastCompletedDate: undefined }), 'done', true);
    vi.setSystemTime(DAY2_MORNING);
    const next = rollover(done);
    expect(next.status).toBe('todo');
    expect(next.completedAt).toBeUndefined();
  });

  it('mở lại app ngay trong ngày thì việc vừa xong qua ô trạng thái vẫn là Done', () => {
    const done = changeTaskStatusTransition(dailyTask(), 'done', true);
    expect(rollover(done).status).toBe('done');
  });

  it('đổi giữa hai trạng thái cùng nhóm done không cộng chuỗi lần nữa', () => {
    const done = changeTaskStatusTransition(dailyTask(), 'done', true);
    const moved = changeTaskStatusTransition(done, 'shipped', true);
    expect(moved.recurrenceStreak).toBe(4);
    const again = toggleTaskDoneTransition(moved, true);
    expect(again.recurrenceStreak).toBe(4);
  });

  it('tích việc con cuối cùng đẩy việc cha lặp lại lên Done thì việc cha được ghi nhận', () => {
    const parent = dailyTask({ subtasks: [sub()] });
    const next = toggleSubtaskTransition(parent, 's1', true);
    expect(next.status).toBe('done');
    expect(next.lastCompletedDate).toBe(DAY1_KEY);
    expect(next.recurrenceStreak).toBe(4);
  });

  it('đổi việc con cuối cùng sang Done bằng ô trạng thái cũng ghi nhận việc cha', () => {
    const parent = dailyTask({ subtasks: [sub()] });
    const next = changeSubtaskStatusTransition(parent, 's1', 'done', true);
    expect(next.status).toBe('done');
    expect(next.lastCompletedDate).toBe(DAY1_KEY);
  });

  it('việc con lặp lại đổi sang Done bằng ô trạng thái ghi ngày làm xong', () => {
    const task: Task = { id: 't2', title: 'Habits', status: 'todo', subtasks: [sub({ recurrence: 'daily', recurrenceStreak: 2 }), sub({ id: 's2' })] };
    const next = changeSubtaskStatusTransition(task, 's1', 'done', true);
    expect(next.subtasks[0].completed).toBe(true);
    expect(next.subtasks[0].lastCompletedDate).toBe(DAY1_KEY);
    expect(next.subtasks[0].recurrenceStreak).toBe(3);
  });

  it('việc con ghi ngày theo giờ máy, không theo UTC (0:30 sáng giờ Việt Nam vẫn là ngày mới)', () => {
    vi.setSystemTime(new Date(2026, 10, 20, 0, 30, 0));
    const task: Task = { id: 't2', title: 'Habits', status: 'todo', subtasks: [sub({ recurrence: 'daily' }), sub({ id: 's2' })] };
    const next = toggleSubtaskTransition(task, 's1', true);
    expect(next.subtasks[0].lastCompletedDate).toBe('2026-11-20');
  });

  it('xóa việc con chưa xong cuối cùng làm việc cha lên Done thì việc cha được ghi nhận, thêm việc con mới thì việc cha bỏ Done', () => {
    const parent = dailyTask({ subtasks: [sub({ completed: true, status: 'done' }), sub({ id: 's2' })] });
    const afterDelete = withSubtasks(parent, [parent.subtasks[0]]);
    expect(afterDelete.status).toBe('done');
    expect(afterDelete.completedAt).toBeTruthy();
    expect(afterDelete.lastCompletedDate).toBe(DAY1_KEY);
    const afterAdd = withSubtasks(afterDelete, [...afterDelete.subtasks, sub({ id: 's3' })]);
    expect(afterAdd.status).toBe('doing');
    expect(afterAdd.completedAt).toBeUndefined();
  });

  it('việc không lặp lại không có chuỗi', () => {
    const plain: Task = { id: 't3', title: 'Once', status: 'todo', subtasks: [] };
    const next = changeTaskStatusTransition(plain, 'done', true);
    expect(next.lastCompletedDate).toBeUndefined();
    expect(next.recurrenceStreak).toBeUndefined();
  });
});
