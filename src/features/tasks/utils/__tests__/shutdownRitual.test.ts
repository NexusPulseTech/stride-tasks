import { describe, expect, it } from 'vitest';
import type { Project, StatusDefinition, SubTask, Task } from '../../../../types';
import { planShutdownRitual, undoShutdownRitual } from '../shutdownRitual';

// 19/11/2026 18:00 giờ máy
const NOW = new Date(2026, 10, 19, 18, 0, 0);
const TOMORROW_9 = new Date(2026, 10, 20, 9, 0, 0).toISOString();
const custom: StatusDefinition[] = [{ id: 'qa', label: 'QA', category: 'doing', color: '#000' }];

const task = (id: string, patch: Partial<Task> = {}): Task => ({ id, title: id, status: 'doing', subtasks: [], ...patch });
const projectsOf = (tasks: Task[]): Project[] => [{ id: 'p1', name: 'P', tasks } as Project];
const byId = (projects: Project[]) => Object.fromEntries(projects[0].tasks.map((t) => [t.id, t]));

describe('F04: số việc đã dời tính trên dữ liệu, không phụ thuộc lúc React chạy hàm cập nhật', () => {
  it('2 việc đang làm thì báo đã dời 2', () => {
    expect(planShutdownRitual(projectsOf([task('a'), task('b'), task('c', { status: 'todo' })]), [], NOW).movedCount).toBe(2);
  });
});

describe('F05: Shutdown Ritual dời đủ việc, dời cả nhắc đã quá hạn, hoàn tác được', () => {
  it('việc có nhắc đã quá hạn được dời sang 9:00 mai; nhắc trong tương lai giữ nguyên', () => {
    const overdue = new Date(2026, 10, 18, 9, 0, 0).toISOString();
    const future = new Date(2026, 10, 22, 14, 0, 0).toISOString();
    const out = byId(planShutdownRitual(projectsOf([task('late', { reminderAt: overdue }), task('later', { reminderAt: future }), task('none')]), [], NOW).projects);
    expect(out.late.reminderAt).toBe(TOMORROW_9);
    expect(out.later.reminderAt).toBe(future);
    expect(out.none.reminderAt).toBe(TOMORROW_9);
  });

  it('theo nhóm trạng thái: Testing và trạng thái tùy chỉnh nhóm đang làm cũng được dời', () => {
    const plan = planShutdownRitual(projectsOf([task('testing', { status: 'testing' }), task('qa', { status: 'qa' })]), custom, NOW);
    expect(plan.movedCount).toBe(2);
    const out = byId(plan.projects);
    expect(out.testing.status).toBe('todo');
    expect(out.qa.status).toBe('todo');
  });

  it('việc Blocked và Paused là việc người dùng chủ động gác lại nên giữ nguyên', () => {
    const plan = planShutdownRitual(projectsOf([task('blocked', { status: 'blocked' }), task('paused', { status: 'paused' })]), [], NOW);
    expect(plan.movedCount).toBe(0);
    expect(byId(plan.projects).blocked.status).toBe('blocked');
  });

  it('việc con đang làm trong việc chưa bắt đầu cũng được đưa về Todo và việc cha được nhắc 9:00 mai', () => {
    const step: SubTask = { id: 's1', title: 'Draft', completed: false, status: 'doing' };
    const plan = planShutdownRitual(projectsOf([task('parent', { status: 'todo', subtasks: [step] })]), [], NOW);
    expect(plan.movedCount).toBe(1);
    const parent = byId(plan.projects).parent;
    expect(parent.subtasks[0].status).toBe('todo');
    expect(parent.reminderAt).toBe(TOMORROW_9);
  });

  it('hoàn tác trả lại đúng các việc đã dời, giữ các thay đổi khác làm sau đó', () => {
    const original = projectsOf([task('a', { reminderAt: undefined }), task('b', { status: 'todo' })]);
    const plan = planShutdownRitual(original, [], NOW);
    const editedAfter = plan.projects.map((p) => ({ ...p, tasks: p.tasks.map((t) => (t.id === 'b' ? { ...t, title: 'b renamed' } : t)) }));
    const restored = byId(undoShutdownRitual(editedAfter, plan.before));
    expect(restored.a.status).toBe('doing');
    expect(restored.a.reminderAt).toBeUndefined();
    expect(restored.b.title).toBe('b renamed');
  });

  it('bản khôi phục được đóng dấu thời gian mới để không thua bản đã dời khi đồng bộ', () => {
    const step: SubTask = { id: 's1', title: 'Draft', completed: false, status: 'doing', updatedAt: '2026-11-01T00:00:00.000Z' };
    const keep: SubTask = { id: 's2', title: 'Keep', completed: false, status: 'todo', updatedAt: '2026-11-02T00:00:00.000Z' };
    const original = projectsOf([task('a', { updatedAt: '2026-11-01T00:00:00.000Z', subtasks: [step, keep] })]);
    const plan = planShutdownRitual(original, [], NOW);
    const restored = byId(undoShutdownRitual(plan.projects, plan.before)).a;
    expect(restored.updatedAt).toBeUndefined();
    expect(restored.subtasks[0].status).toBe('doing');
    expect(restored.subtasks[0].updatedAt).toBeUndefined();
    expect(restored.subtasks[1].updatedAt).toBe('2026-11-02T00:00:00.000Z');
  });
});
