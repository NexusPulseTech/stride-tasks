import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Project, Task } from '../../../../types';
import { getDailyFocusQueue, getSnoozedItemsQueue } from '../spacedSnooze';

const ORIGINAL_TZ = process.env.TZ;
beforeAll(() => {
  process.env.TZ = 'Asia/Ho_Chi_Minh';
});
afterAll(() => {
  process.env.TZ = ORIGINAL_TZ;
});

// 19/11/2026 10:00 giờ máy
const NOW = new Date(2026, 10, 19, 10, 0, 0);
const at = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m - 1, d, h, min).toISOString();

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});
afterEach(() => {
  vi.useRealTimers();
});

const task = (id: string, patch: Partial<Task> = {}): Task => ({ id, title: id, status: 'todo', subtasks: [], ...patch });
const project = (tasks: Task[]): Project => ({ id: 'p1', name: 'P', tasks } as Project);
const titles = (items: { title: string }[]) => items.map((i) => i.title);

describe('F06: Due Today chỉ gồm việc đến hạn hôm nay, quá hạn hoặc chưa hẹn', () => {
  const projects = [
    project([
      task('undated'),
      task('doing', { status: 'doing' }),
      task('callBankTomorrow', { reminderAt: at(2026, 11, 20, 9) }),
      task('nextYear', { deadline: '2027-11-19' }),
      task('todayEvening', { reminderAt: at(2026, 11, 19, 17) }),
      task('overdue', { reminderAt: at(2026, 11, 18, 9) }),
      task('deadlineToday', { deadline: '2026-11-19' }),
    ]),
  ];

  it('việc hẹn ngày mai hoặc năm sau không nằm trong Due Today', () => {
    const due = titles(getDailyFocusQueue(projects, []));
    expect(due).not.toContain('callBankTomorrow');
    expect(due).not.toContain('nextYear');
  });

  it('việc đến hạn xếp theo thời điểm sớm nhất, trước việc đang làm và việc chưa hẹn', () => {
    expect(titles(getDailyFocusQueue(projects, []))).toEqual(['overdue', 'todayEvening', 'deadlineToday', 'doing', 'undated']);
  });

  it('việc hẹn ngày sau nằm ở tab Snoozed, đếm ngược tới đầu ngày hẹn', () => {
    const snoozed = getSnoozedItemsQueue(projects, []);
    expect(titles(snoozed)).toEqual(['callBankTomorrow', 'nextYear']);
    expect(snoozed[0].wakeAt).toBe(at(2026, 11, 20));
  });

  it('việc hẹn ngày sau mà người dùng đã ghim ("1 · Remind Now") vẫn ở Due Today', () => {
    const pinned = [project([task('undated'), task('pinnedTomorrow', { reminderAt: at(2026, 11, 20, 9), isPinned: true })])];
    expect(titles(getDailyFocusQueue(pinned, []))).toEqual(['pinnedTomorrow', 'undated']);
    expect(getSnoozedItemsQueue(pinned, [])).toHaveLength(0);
  });

  it('sáng hôm sau việc hẹn hôm đó quay lại Due Today', () => {
    vi.setSystemTime(new Date(2026, 10, 20, 7, 0, 0));
    expect(titles(getDailyFocusQueue(projects, []))).toContain('callBankTomorrow');
  });
});

describe('F07: hoãn và ghim ở việc cha có việc con được Daily Focus tôn trọng', () => {
  const steps = [
    { id: 's1', title: 'Pick a domain', completed: true, status: 'done' },
    { id: 's2', title: 'Write the About page', completed: false, status: 'todo' },
  ];
  const website = (patch: Partial<Task> = {}) => task('Launch a personal website', { status: 'doing', subtasks: steps, ...patch });

  it('việc cha đang hoãn (Smart schedule, Good +1d) thì cả việc rời Due Today, sang Snoozed', () => {
    const projects = [project([task('undated'), website({ snoozeUntil: at(2026, 11, 20, 9), snoozeLevel: 2 })])];
    expect(titles(getDailyFocusQueue(projects, []))).toEqual(['undated']);
    const snoozed = getSnoozedItemsQueue(projects, []);
    expect(titles(snoozed)).toEqual(['Launch a personal website']);
    // Mục ở tab Snoozed là việc cha, để "Remind Now" gỡ đúng lần hoãn của việc cha
    expect(snoozed[0].isSubtask).toBe(false);
    expect(snoozed[0].snoozeLevel).toBe(2);
  });

  it('việc cha hết hoãn thì bước con tiếp theo quay lại Due Today', () => {
    const projects = [project([website({ snoozeUntil: at(2026, 11, 19, 9), snoozeLevel: 2 })])];
    const due = getDailyFocusQueue(projects, []);
    expect(titles(due)).toEqual(['Write the About page']);
    expect(due[0].snoozeLevel).toBe(2);
  });

  it('việc cha đang ghim thì bước con của nó được xếp như việc ghim', () => {
    const projects = [project([task('pinnedPlain', { isPinned: false, deadline: '2026-11-19' }), website({ isPinned: true })])];
    const due = getDailyFocusQueue(projects, []);
    expect(titles(due)).toEqual(['Write the About page', 'pinnedPlain']);
    expect(due[0].isPinned).toBe(true);
    expect(due[0].pinSource).toBe('task');
  });
});
