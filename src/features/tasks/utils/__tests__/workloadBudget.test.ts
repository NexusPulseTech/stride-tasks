import { describe, expect, it } from 'vitest';
import type { Project, Task } from '../../../../types';
import type { ActionableItem } from '../spacedSnooze';
import { computeWorkloadBudget } from '../workloadBudget';

const task = (id: string, patch: Partial<Task> = {}): Task => ({ id, title: id, status: 'todo', subtasks: [], ...patch });
const item = (taskId: string, patch: Partial<ActionableItem> = {}): ActionableItem => ({
  id: taskId,
  title: taskId,
  projectId: 'p1',
  projectName: 'P',
  taskId,
  taskTitle: taskId,
  isSubtask: false,
  parentPath: [taskId],
  depth: 0,
  status: 'todo',
  ...patch,
});

describe('F08: Workload Budget là tải của hôm nay', () => {
  const projects: Project[] = [
    {
      id: 'p1',
      name: 'P',
      tasks: [
        task('today1', { estimatedMinutes: 30, focusedMinutes: 10 }),
        task('today2'),
        task('backlogNextWeek', { estimatedMinutes: 240 }),
        task('backlogSnoozed', { estimatedMinutes: 180, snoozeUntil: '2099-01-01T00:00:00.000Z' }),
        task('doneLongAgo', { status: 'done', estimatedMinutes: 60, focusedMinutes: 500 }),
      ],
    } as Project,
  ];
  const dueToday = [item('today1'), item('today2')];

  it('chỉ cộng ước tính của việc trong Due Today, đếm riêng việc chưa ước tính', () => {
    const b = computeWorkloadBudget(projects, dueToday, 25);
    expect(b.estimatedMinutes).toBe(30);
    expect(b.unestimatedCount).toBe(1);
  });

  it('phút Focus là phút của hôm nay trong nhật ký tập trung, không cộng dồn từ trước tới nay', () => {
    expect(computeWorkloadBudget(projects, dueToday, 25).focusedMinutes).toBe(25);
  });

  it('backlog lớn nhưng hôm nay nhẹ thì không báo quá tải', () => {
    expect(computeWorkloadBudget(projects, dueToday, 0).isOverloaded).toBe(false);
  });

  it('bước con trong Due Today tính theo ước tính của việc cha, mỗi việc một lần', () => {
    const steps = [item('today1', { id: 's1', isSubtask: true, subtaskId: 's1' }), item('today1', { id: 's2', isSubtask: true, subtaskId: 's2' })];
    expect(computeWorkloadBudget(projects, steps, 0).estimatedMinutes).toBe(30);
  });

  it('hôm nay quá 6 giờ thì báo quá tải', () => {
    const heavy: Project[] = [{ id: 'p1', name: 'P', tasks: [task('a', { estimatedMinutes: 200 }), task('b', { estimatedMinutes: 200 })] } as Project];
    expect(computeWorkloadBudget(heavy, [item('a'), item('b')], 0).isOverloaded).toBe(true);
  });
});
