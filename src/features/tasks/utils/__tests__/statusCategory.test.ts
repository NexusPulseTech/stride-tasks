import { describe, expect, it } from 'vitest';
import type { StatusDefinition } from '../../../../types';
import { isDoingStatus, isDoneStatus, isScheduledTask, taskMatchesListFilter, type TaskListFilter } from '../statusCategory';

const custom: StatusDefinition[] = [
  { id: 'qa', label: 'QA', category: 'doing', color: '#000' },
  { id: 'backlog', label: 'Backlog', category: 'todo', color: '#000' },
  { id: 'shipped', label: 'Shipped', category: 'done', color: '#000' },
];

describe('isDoingStatus', () => {
  it('chỉ gồm nhóm đang làm, giống cột In progress của Kanban', () => {
    for (const id of ['doing', 'review', 'testing', 'blocked', 'paused']) expect(isDoingStatus(id)).toBe(true);
    expect(isDoingStatus('todo')).toBe(false);
    expect(isDoingStatus('done')).toBe(false);
  });

  it('theo nhóm của trạng thái tùy chỉnh', () => {
    expect(isDoingStatus('qa', custom)).toBe(true);
    expect(isDoingStatus('backlog', custom)).toBe(false);
    expect(isDoingStatus('shipped', custom)).toBe(false);
    expect(isDoneStatus('shipped', custom)).toBe(true);
  });

  it('11 việc chưa xong trong đó 3 việc đang làm thì đếm ra 3', () => {
    const statuses = ['todo', 'todo', 'todo', 'todo', 'todo', 'todo', 'todo', 'todo', 'doing', 'review', 'blocked', 'done'];
    expect(statuses.filter((s) => isDoingStatus(s)).length).toBe(3);
    expect(statuses.filter((s) => !isDoneStatus(s)).length).toBe(11);
  });
});

describe('isScheduledTask', () => {
  it('có giờ nhắc hoặc hạn chót và chưa xong', () => {
    expect(isScheduledTask({ status: 'todo', reminderAt: '2026-11-20T09:00:00.000Z' })).toBe(true);
    expect(isScheduledTask({ status: 'doing', deadline: '2026-11-21' })).toBe(true);
    expect(isScheduledTask({ status: 'todo' })).toBe(false);
    expect(isScheduledTask({ status: 'done', reminderAt: '2026-11-20T09:00:00.000Z' })).toBe(false);
  });
});

describe('taskMatchesListFilter', () => {
  const tasks = {
    todoPlain: { status: 'todo' },
    todoScheduled: { status: 'todo', reminderAt: '2026-11-20T09:00:00.000Z' },
    doingPlain: { status: 'doing' },
    doneScheduled: { status: 'done', deadline: '2026-11-19' },
  };
  const view = (patch: Partial<TaskListFilter>): TaskListFilter => ({
    filter: 'all',
    isFocusMode: false,
    hideCompletedInAll: false,
    searching: false,
    ...patch,
  });
  const visible = (v: TaskListFilter) =>
    Object.entries(tasks)
      .filter(([, t]) => taskMatchesListFilter(t, v))
      .map(([name]) => name);

  it('tab Scheduled chỉ hiện việc có hẹn chưa xong (không hiện việc chưa hẹn hay đã xong)', () => {
    expect(visible(view({ filter: 'scheduled' }))).toEqual(['todoScheduled']);
  });

  it('tab Doing chỉ hiện việc đang làm', () => {
    expect(visible(view({ filter: 'doing' }))).toEqual(['doingPlain']);
  });

  it('tab Completed chỉ hiện việc đã xong', () => {
    expect(visible(view({ filter: 'completed' }))).toEqual(['doneScheduled']);
  });

  it('tab All hiện tất cả, hoặc bỏ việc đã xong khi bật ẩn', () => {
    expect(visible(view({}))).toEqual(['todoPlain', 'todoScheduled', 'doingPlain', 'doneScheduled']);
    expect(visible(view({ hideCompletedInAll: true }))).toEqual(['todoPlain', 'todoScheduled', 'doingPlain']);
  });

  it('chế độ Focus hiện mọi việc chưa xong, kể cả việc chưa bắt đầu', () => {
    expect(visible(view({ isFocusMode: true, filter: 'doing' }))).toEqual(['todoPlain', 'todoScheduled', 'doingPlain']);
  });

  it('đang tìm kiếm thì hiện tất cả', () => {
    expect(visible(view({ searching: true, filter: 'scheduled' }))).toHaveLength(4);
  });
});
