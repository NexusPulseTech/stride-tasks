import { describe, expect, it } from 'vitest';
import { mergeSnapshots, snapshotsEqual, SyncSnapshot } from '../syncMerge';

const T0 = '2026-10-28T08:00:00.000Z';
const T1 = '2026-10-28T09:00:00.000Z';
const T2 = '2026-10-28T10:00:00.000Z';
const T3 = '2026-10-28T11:00:00.000Z';

// Dựng dữ liệu tối thiểu; ép kiểu vì test chỉ cần các trường mà thuật toán hợp nhất đọc
const snap = (projects: unknown[], extra: Record<string, unknown> = {}) =>
  ({ v: 1, projects, logs: [], archivedDailyCounts: {}, customStatuses: [], tombstones: {}, ...extra }) as unknown as SyncSnapshot;
const task = (id: string, title: string, updatedAt: string, extra: Record<string, unknown> = {}) => ({
  id,
  title,
  status: 'todo',
  subtasks: [],
  updatedAt,
  ...extra,
});
const proj = (id: string, tasks: unknown[], updatedAt = T0) => ({ id, name: id, isExpanded: true, tasks, updatedAt });
const sub = (id: string, title: string, updatedAt: string, completed = false) => ({ id, title, completed, updatedAt });
const log = (id: string, completedAt: string) => ({
  id,
  taskId: 't',
  taskTitle: 't',
  projectId: 'p',
  projectName: 'p',
  completedAt,
  dateKey: completedAt.slice(0, 10),
});
const titles = (s: SyncSnapshot) => s.projects.flatMap((p) => p.tasks.map((t) => `${p.id}/${t.title}`));

describe('mergeSnapshots', () => {
  it('giữ cả hai thay đổi khi hai máy sửa hai việc khác nhau, và hợp nhất đối xứng', () => {
    const A = snap([proj('p1', [task('t1', 'A-edit', T2), task('t2', 'orig', T0)], T2)]);
    const B = snap([proj('p1', [task('t1', 'orig', T0), task('t2', 'B-edit', T3)], T3)]);
    const merged = mergeSnapshots(A, B);
    expect(titles(merged)).toEqual(['p1/A-edit', 'p1/B-edit']);
    expect(snapshotsEqual(merged, mergeSnapshots(B, A))).toBe(true);
  });

  it('chọn bản có updatedAt mới hơn khi cùng sửa một việc', () => {
    const A = snap([proj('p1', [task('t1', 'A', T2)], T2)]);
    const B = snap([proj('p1', [task('t1', 'B', T1)], T1)]);
    expect(titles(mergeSnapshots(A, B))[0]).toBe('p1/A');
  });

  it('giữ việc mới được thêm trên mỗi máy', () => {
    const A = snap([proj('p1', [task('t1', 'x', T0), task('tA', 'newA', T2)], T2)]);
    const B = snap([proj('p1', [task('t1', 'x', T0), task('tB', 'newB', T3)], T3)]);
    const result = titles(mergeSnapshots(A, B));
    expect(result).toHaveLength(3);
    expect(result).toEqual(expect.arrayContaining(['p1/newA', 'p1/newB']));
  });

  it('không hồi sinh việc đã xóa (tombstone) từ máy còn bản cũ', () => {
    const A = snap([proj('p1', [], T2)], { tombstones: { 't:t1': T2 } });
    const B = snap([proj('p1', [task('t1', 'old', T0)], T0)]);
    expect(titles(mergeSnapshots(A, B))).toHaveLength(0);
  });

  it('giữ bản sửa khi máy kia sửa sau thời điểm xóa', () => {
    const A = snap([proj('p1', [], T1)], { tombstones: { 't:t1': T1 } });
    const B = snap([proj('p1', [task('t1', 'edited-later', T3)], T3)]);
    expect(titles(mergeSnapshots(A, B))[0]).toBe('p1/edited-later');
  });

  it('không nhân đôi việc được kéo sang dự án khác', () => {
    const A = snap([proj('p1', [], T2), proj('p2', [task('t1', 'moved', T2)], T2)]);
    const B = snap([proj('p1', [task('t1', 'moved', T0)], T0), proj('p2', [], T0)]);
    expect(titles(mergeSnapshots(A, B))).toEqual(['p2/moved']);
  });

  it('giữ cả đổi tên và tick xong khi việc con được sửa song song', () => {
    const A = snap([proj('p1', [task('t1', 'x', T2, { subtasks: [sub('s1', 'A-sub', T2), sub('s2', 's2', T0)] })], T2)]);
    const B = snap([proj('p1', [task('t1', 'x', T3, { subtasks: [sub('s1', 's1', T0), sub('s2', 's2', T3, true)] })], T3)]);
    const subs = mergeSnapshots(A, B).projects[0].tasks[0].subtasks;
    expect(subs[0].title).toBe('A-sub');
    expect(subs[1].completed).toBe(true);
  });

  it('xóa dự án trên một máy thì dự án biến mất sau hợp nhất', () => {
    const A = snap([proj('p1', [task('t1', 'x', T0)], T0), proj('p2', [], T0)]);
    const B = snap([proj('p2', [], T0)], { tombstones: { 'p:p1': T2, 't:t1': T2 } });
    expect(mergeSnapshots(A, B).projects.map((p) => p.id)).toEqual(['p2']);
  });

  it('hợp nhất log theo id và không đưa lại log đã xóa', () => {
    const A = snap([], { logs: [log('l1', T1), log('l2', T2)], tombstones: { 'l:l3': T3 } });
    const B = snap([], { logs: [log('l2', T2), log('l3', T0), log('l4', T3)] });
    expect(mergeSnapshots(A, B).logs.map((l) => l.id)).toEqual(['l4', 'l2', 'l1']);
  });

  it('hội tụ: hợp nhất lại lần nữa không thay đổi gì', () => {
    const A = snap([proj('p1', [task('t1', 'A', T2)], T2)]);
    const B = snap([proj('p1', [task('t2', 'B', T3)], T3)]);
    const merged = mergeSnapshots(A, B);
    expect(snapshotsEqual(mergeSnapshots(merged, B), merged)).toBe(true);
    expect(snapshotsEqual(mergeSnapshots(B, merged), merged)).toBe(true);
  });
});
