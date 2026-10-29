import type { Project, Task, SubTask, StatusDefinition } from '../../types';
import type { CompletedItemLog } from '../analytics/hooks/useActivityLog';
import { TombstoneMap, mergeTombstones, pruneTombstones } from './tombstones';

/** Toàn bộ dữ liệu được đồng bộ (đã mã hóa đầu-cuối trước khi rời thiết bị) */
export interface SyncSnapshot {
  v: 1;
  projects: Project[];
  logs: CompletedItemLog[];
  archivedDailyCounts: Record<string, number>;
  customStatuses: StatusDefinition[];
  tombstones: TombstoneMap;
}

type Kind = 'p' | 't' | 's';
type AnyNode = Project | Task | SubTask;

const CHILD_KEY: Record<Kind, 'tasks' | 'subtasks'> = { p: 'tasks', t: 'subtasks', s: 'subtasks' };
const CHILD_KIND: Record<Kind, Kind> = { p: 't', t: 's', s: 's' };

const time = (iso?: string): number => {
  if (!iso) return 0;
  const parsed = Date.parse(iso);
  return Number.isNaN(parsed) ? 0 : parsed;
};

/** Last-Writer-Wins theo updatedAt; hòa thì phá thế bằng nội dung để mọi thiết bị chọn cùng một kết quả */
function pickLocal(local: AnyNode, remote: AnyNode): boolean {
  const l = time(local.updatedAt);
  const r = time(remote.updatedAt);
  if (l !== r) return l > r;
  return JSON.stringify(local) >= JSON.stringify(remote);
}

function isDeleted(kind: Kind, node: AnyNode, tombstones: TombstoneMap): boolean {
  const deletedAt = tombstones[`${kind}:${node.id}`];
  // Xóa thắng khi thời điểm xóa không cũ hơn lần sửa cuối cùng của mục đó
  return Boolean(deletedAt) && time(deletedAt) >= time(node.updatedAt);
}

function mergeLevel<T extends AnyNode>(
  kind: Kind,
  local: T[] | undefined,
  remote: T[] | undefined,
  localOrderFirst: boolean,
  tombstones: TombstoneMap
): T[] | undefined {
  if (local === undefined && remote === undefined) return undefined;
  const l = local || [];
  const r = remote || [];
  const byIdLocal = new Map(l.map((n) => [n.id, n]));
  const byIdRemote = new Map(r.map((n) => [n.id, n]));
  // Thứ tự: theo bên có cha mới hơn, mục chỉ có ở bên kia được nối vào cuối theo thứ tự của bên đó
  const order = localOrderFirst ? [...l, ...r] : [...r, ...l];
  const seen = new Set<string>();
  const out: T[] = [];
  for (const node of order) {
    if (seen.has(node.id)) continue;
    seen.add(node.id);
    const merged = mergeNode(kind, byIdLocal.get(node.id), byIdRemote.get(node.id), tombstones);
    if (merged) out.push(merged as T);
  }
  return out;
}

function mergeNode(kind: Kind, local: AnyNode | undefined, remote: AnyNode | undefined, tombstones: TombstoneMap): AnyNode | null {
  const childKey = CHILD_KEY[kind];
  const childKind = CHILD_KIND[kind];
  if (local && remote) {
    const useLocal = pickLocal(local, remote);
    const winner = useLocal ? local : remote;
    if (isDeleted(kind, winner, tombstones)) return null;
    const lChildren = (local as unknown as Record<string, AnyNode[] | undefined>)[childKey];
    const rChildren = (remote as unknown as Record<string, AnyNode[] | undefined>)[childKey];
    const children = mergeLevel(childKind, lChildren, rChildren, useLocal, tombstones);
    return children === undefined ? winner : ({ ...winner, [childKey]: children } as AnyNode);
  }
  const only = (local || remote) as AnyNode;
  if (isDeleted(kind, only, tombstones)) return null;
  const onlyChildren = (only as unknown as Record<string, AnyNode[] | undefined>)[childKey];
  const children = mergeLevel(childKind, onlyChildren, undefined, true, tombstones);
  return children === undefined ? only : ({ ...only, [childKey]: children } as AnyNode);
}

/** Một việc được kéo sang dự án khác sẽ xuất hiện ở cả 2 nơi sau khi hợp nhất → giữ bản có updatedAt mới nhất */
function dedupeTasksAcrossProjects(projects: Project[]): Project[] {
  const best = new Map<string, { projectId: string; updatedAt: number }>();
  for (const p of projects) {
    for (const t of p.tasks) {
      const current = best.get(t.id);
      if (!current || time(t.updatedAt) > current.updatedAt) best.set(t.id, { projectId: p.id, updatedAt: time(t.updatedAt) });
    }
  }
  const kept = new Set<string>();
  return projects.map((p) => {
    const tasks = p.tasks.filter((t) => {
      if (best.get(t.id)?.projectId !== p.id || kept.has(t.id)) return false;
      kept.add(t.id);
      return true;
    });
    return tasks.length === p.tasks.length ? p : { ...p, tasks };
  });
}

function dedupeSubtasks(projects: Project[]): Project[] {
  const best = new Map<string, number>();
  const visit = (subs: SubTask[] | undefined) => {
    for (const s of subs || []) {
      best.set(s.id, Math.max(best.get(s.id) ?? -1, time(s.updatedAt)));
      visit(s.subtasks);
    }
  };
  for (const p of projects) for (const t of p.tasks) visit(t.subtasks);
  const kept = new Set<string>();
  const filter = (subs: SubTask[] | undefined): SubTask[] | undefined => {
    if (!subs) return subs;
    let changed = false;
    const out: SubTask[] = [];
    for (const s of subs) {
      if (kept.has(s.id) || time(s.updatedAt) < (best.get(s.id) ?? 0)) {
        changed = true;
        continue;
      }
      kept.add(s.id);
      const children = filter(s.subtasks);
      if (children !== s.subtasks) changed = true;
      out.push(children === s.subtasks ? s : { ...s, subtasks: children });
    }
    return changed ? out : subs;
  };
  return projects.map((p) => {
    let changed = false;
    const tasks = p.tasks.map((t) => {
      const subtasks = filter(t.subtasks);
      if (subtasks === t.subtasks) return t;
      changed = true;
      return { ...t, subtasks: subtasks ?? [] };
    });
    return changed ? { ...p, tasks } : p;
  });
}

export function mergeProjects(local: Project[], remote: Project[], tombstones: TombstoneMap): Project[] {
  const merged = mergeLevel('p', local, remote, true, tombstones) as Project[];
  return dedupeSubtasks(dedupeTasksAcrossProjects(merged));
}

function mergeLogs(local: CompletedItemLog[], remote: CompletedItemLog[], tombstones: TombstoneMap): CompletedItemLog[] {
  const byId = new Map<string, CompletedItemLog>();
  for (const log of [...local, ...remote]) {
    if (tombstones[`l:${log.id}`] || byId.has(log.id)) continue;
    byId.set(log.id, log);
  }
  return [...byId.values()].sort((a, b) => (a.completedAt < b.completedAt ? 1 : a.completedAt > b.completedAt ? -1 : a.id < b.id ? 1 : -1));
}

function mergeDailyCounts(a: Record<string, number>, b: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = { ...a };
  for (const [day, count] of Object.entries(b)) out[day] = Math.max(out[day] || 0, count);
  return out;
}

function mergeStatuses(local: StatusDefinition[], remote: StatusDefinition[]): StatusDefinition[] {
  const byId = new Map<string, StatusDefinition>();
  for (const s of [...local, ...remote]) if (!byId.has(s.id)) byId.set(s.id, s);
  return [...byId.values()];
}

export function mergeSnapshots(local: SyncSnapshot, remote: SyncSnapshot, now: Date = new Date()): SyncSnapshot {
  const tombstones = pruneTombstones(mergeTombstones(local.tombstones || {}, remote.tombstones || {}), now);
  return normalizeSnapshot({
    v: 1,
    projects: mergeProjects(local.projects || [], remote.projects || [], tombstones),
    logs: mergeLogs(local.logs || [], remote.logs || [], tombstones),
    archivedDailyCounts: mergeDailyCounts(local.archivedDailyCounts || {}, remote.archivedDailyCounts || {}),
    customStatuses: mergeStatuses(local.customStatuses || [], remote.customStatuses || []),
    tombstones,
  });
}

function sortRecord<T>(record: Record<string, T>): Record<string, T> {
  return Object.fromEntries(Object.entries(record).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

/** Chuẩn hóa thứ tự các phần không mang ý nghĩa thứ tự để phép so sánh "có thay đổi không" ổn định */
export function normalizeSnapshot(s: SyncSnapshot): SyncSnapshot {
  return {
    v: 1,
    projects: s.projects || [],
    logs: [...(s.logs || [])].sort((a, b) => (a.completedAt < b.completedAt ? 1 : a.completedAt > b.completedAt ? -1 : a.id < b.id ? 1 : -1)),
    archivedDailyCounts: sortRecord(s.archivedDailyCounts || {}),
    customStatuses: [...(s.customStatuses || [])].sort((a, b) => (a.id < b.id ? -1 : 1)),
    tombstones: sortRecord(s.tombstones || {}),
  };
}

export function snapshotsEqual(a: SyncSnapshot, b: SyncSnapshot): boolean {
  return JSON.stringify(normalizeSnapshot(a)) === JSON.stringify(normalizeSnapshot(b));
}
