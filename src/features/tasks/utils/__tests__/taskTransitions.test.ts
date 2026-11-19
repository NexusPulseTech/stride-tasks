import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Project, SubTask, Task } from '../../../../types';
import { manuallyResetRecurringTask, processDailyRecurrenceRollover } from '../recurringHelper';
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

describe('F02: chuỗi ngày cộng tối đa 1 lần mỗi chu kỳ, bỏ lỡ thì về 0', () => {
  const projectsOf = (task: Task): Project[] => [{ id: 'p1', name: 'P', tasks: [task] } as Project];

  it('tích, bỏ tích, tích lại trong cùng ngày chỉ cộng 1; bỏ tích trả lại ngày làm xong trước đó', () => {
    const done = toggleTaskDoneTransition(dailyTask(), true);
    expect(done.recurrenceStreak).toBe(4);
    const undone = toggleTaskDoneTransition(done, false);
    expect(undone.recurrenceStreak).toBe(3);
    expect(undone.lastCompletedDate).toBe('2026-11-18');
    const again = toggleTaskDoneTransition(undone, true);
    expect(again.recurrenceStreak).toBe(4);
    expect(again.lastCompletedDate).toBe(DAY1_KEY);
  });

  it('qua ô trạng thái: Done, về Todo, Done lại vẫn chỉ cộng 1', () => {
    const a = changeTaskStatusTransition(dailyTask(), 'done', true);
    const b = changeTaskStatusTransition(a, 'todo', false);
    const c = changeTaskStatusTransition(b, 'done', true);
    expect([a.recurrenceStreak, b.recurrenceStreak, c.recurrenceStreak]).toEqual([4, 3, 4]);
  });

  it('làm mới thủ công rồi tích lại trong cùng ngày không cộng thêm', () => {
    const done = toggleTaskDoneTransition(dailyTask(), true);
    const reset = manuallyResetRecurringTask(projectsOf(done), 'p1', 't1')[0].tasks[0];
    expect(reset.status).toBe('todo');
    expect(toggleTaskDoneTransition(reset, true).recurrenceStreak).toBe(4);
  });

  it('hôm sau chuỗi còn nguyên và làm tiếp thì cộng 1', () => {
    const done = toggleTaskDoneTransition(dailyTask(), true);
    vi.setSystemTime(DAY2_MORNING);
    const next = rollover(done);
    expect(next.status).toBe('todo');
    expect(next.recurrenceStreak).toBe(4);
    expect(toggleTaskDoneTransition(next, true).recurrenceStreak).toBe(5);
  });

  it('bỏ 5 ngày không làm thì khi mở app chuỗi về 0', () => {
    const done = toggleTaskDoneTransition(dailyTask(), true);
    vi.setSystemTime(new Date(2026, 10, 25, 8, 0, 0));
    const next = rollover(done);
    expect(next.status).toBe('todo');
    expect(next.recurrenceStreak).toBe(0);
  });

  it('việc chưa tích hôm qua mà lỡ cả hôm qua thì chuỗi cũng về 0 khi mở app', () => {
    // Làm lần cuối 17/11, hôm nay 19/11: đã lỡ 18/11
    const stale = dailyTask({ lastCompletedDate: '2026-11-17', recurrenceStreak: 6 });
    expect(rollover(stale).recurrenceStreak).toBe(0);
    expect(toggleTaskDoneTransition(stale, true).recurrenceStreak).toBe(1);
  });

  it('ngày thường: làm thứ Sáu, thứ Hai làm tiếp vẫn liền chuỗi; lỡ thứ Hai thì thứ Ba về 1', () => {
    vi.setSystemTime(new Date(2026, 10, 20, 10, 0, 0)); // thứ Sáu
    const fri = toggleTaskDoneTransition(dailyTask({ recurrence: 'weekdays', lastCompletedDate: '2026-11-19' }), true);
    expect(fri.recurrenceStreak).toBe(4);
    vi.setSystemTime(new Date(2026, 10, 23, 10, 0, 0)); // thứ Hai
    expect(toggleTaskDoneTransition(rollover(fri), true).recurrenceStreak).toBe(5);
    vi.setSystemTime(new Date(2026, 10, 24, 10, 0, 0)); // thứ Ba, đã lỡ thứ Hai
    expect(toggleTaskDoneTransition(rollover(fri), true).recurrenceStreak).toBe(1);
  });

  it('hằng tuần: làm lại trong tuần kế tiếp thì liền chuỗi, quá 2 tuần thì về 1', () => {
    const wk = toggleTaskDoneTransition(dailyTask({ recurrence: 'weekly', lastCompletedDate: '2026-11-12' }), true);
    expect(wk.recurrenceStreak).toBe(4);
    vi.setSystemTime(new Date(2026, 10, 30, 10, 0, 0)); // 11 ngày sau
    expect(toggleTaskDoneTransition(rollover(wk), true).recurrenceStreak).toBe(5);
    vi.setSystemTime(new Date(2026, 11, 4, 10, 0, 0)); // 15 ngày sau
    expect(toggleTaskDoneTransition(rollover(wk), true).recurrenceStreak).toBe(1);
  });

  it('việc mẫu có chuỗi nhưng chưa có ngày làm xong: lần đầu làm thì cộng tiếp', () => {
    expect(toggleTaskDoneTransition(dailyTask({ lastCompletedDate: undefined }), true).recurrenceStreak).toBe(4);
  });

  it('việc con lặp lại: tích, bỏ tích, tích lại chỉ cộng 1', () => {
    const task: Task = { id: 't2', title: 'Habits', status: 'todo', subtasks: [sub({ recurrence: 'daily', recurrenceStreak: 2, lastCompletedDate: '2026-11-18' }), sub({ id: 's2' })] };
    const a = toggleSubtaskTransition(task, 's1', true);
    const b = toggleSubtaskTransition(a, 's1', false);
    const c = toggleSubtaskTransition(b, 's1', true);
    expect([a.subtasks[0].recurrenceStreak, b.subtasks[0].recurrenceStreak, c.subtasks[0].recurrenceStreak]).toEqual([3, 2, 3]);
    expect(b.subtasks[0].lastCompletedDate).toBe('2026-11-18');
  });
});

describe('B15: việc con nhiều tầng tự chuyển sang xong được tính vào chuỗi', () => {
  // "Habits" có việc con lặp lại "Morning routine" gồm 2 bước con; tích bước cuối thì "Morning routine" tự xong
  const routine = (patch: Partial<SubTask> = {}): SubTask =>
    sub({
      id: 'r',
      title: 'Morning routine',
      recurrence: 'daily',
      recurrenceStreak: 2,
      lastCompletedDate: '2026-11-18',
      subtasks: [sub({ id: 'r1', completed: true, status: 'done' }), sub({ id: 'r2' })],
      ...patch,
    });
  const habits = (): Task => ({ id: 't9', title: 'Habits', status: 'doing', subtasks: [routine(), sub({ id: 'x' })] });

  it('tích bước con cuối cùng: việc con lặp lại tự xong và được cộng chuỗi', () => {
    const next = toggleSubtaskTransition(habits(), 'r2', true).subtasks[0];
    expect(next.completed).toBe(true);
    expect(next.lastCompletedDate).toBe(DAY1_KEY);
    expect(next.recurrenceStreak).toBe(3);
  });

  it('bỏ tích lại thì trả chuỗi như trước', () => {
    const done = toggleSubtaskTransition(habits(), 'r2', true);
    const undone = toggleSubtaskTransition(done, 'r2', false).subtasks[0];
    expect(undone.completed).toBe(false);
    expect(undone.recurrenceStreak).toBe(2);
    expect(undone.lastCompletedDate).toBe('2026-11-18');
  });

  it('đổi bước con cuối sang Done bằng ô trạng thái cũng được tính', () => {
    const next = changeSubtaskStatusTransition(habits(), 'r2', 'done', true).subtasks[0];
    expect(next.completed).toBe(true);
    expect(next.recurrenceStreak).toBe(3);
  });
});
