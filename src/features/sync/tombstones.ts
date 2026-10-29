import type { Project, SubTask } from '../../types';

/**
 * Tombstone = dấu vết "đã xóa lúc …" của một mục, để khi hợp nhất với thiết bị khác mục đó không bị hồi sinh.
 * Khóa có tiền tố loại: "p:" dự án · "t:" công việc · "s:" việc con · "l:" log hoàn thành.
 * Chỉ ghi khi đồng bộ đang bật (thiết bị không đồng bộ không cần và không tốn chỗ).
 */
export const TOMBSTONES_KEY = 'STRIDE_SYNC_TOMBSTONES_V1';
export const SYNC_CONFIG_KEY = 'STRIDE_SYNC_CONFIG_V1';
const TOMBSTONE_TTL_DAYS = 90;

export type TombstoneMap = Record<string, string>;

function syncConfigured(): boolean {
  try {
    return Boolean(localStorage.getItem(SYNC_CONFIG_KEY));
  } catch {
    return false;
  }
}

let trackingEnabled = typeof window !== 'undefined' && syncConfigured();

export function setTombstoneTracking(enabled: boolean): void {
  trackingEnabled = enabled;
}

export function readTombstones(): TombstoneMap {
  try {
    const raw = localStorage.getItem(TOMBSTONES_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as TombstoneMap) : {};
  } catch {
    return {};
  }
}

export function writeTombstones(map: TombstoneMap): void {
  try {
    localStorage.setItem(TOMBSTONES_KEY, JSON.stringify(map));
  } catch {
    // Hết quota: tombstone là dữ liệu phụ trợ, lần đồng bộ sau sẽ ghi lại
  }
}

export function clearTombstones(): void {
  try {
    localStorage.removeItem(TOMBSTONES_KEY);
  } catch {
    // ignore
  }
}

function collectSubtaskKeys(subs: SubTask[] | undefined, into: Set<string>): void {
  if (!subs) return;
  for (const s of subs) {
    into.add(`s:${s.id}`);
    collectSubtaskKeys(s.subtasks, into);
  }
}

export function collectProjectEntityKeys(projects: Project[]): Set<string> {
  const keys = new Set<string>();
  for (const p of projects || []) {
    keys.add(`p:${p.id}`);
    for (const t of p.tasks || []) {
      keys.add(`t:${t.id}`);
      collectSubtaskKeys(t.subtasks, keys);
    }
  }
  return keys;
}

/**
 * So sánh trạng thái trước/sau một thao tác: mục biến mất khỏi TOÀN BỘ cây → ghi tombstone;
 * mục xuất hiện lại (Undo, kéo sang dự án khác) → gỡ tombstone. Idempotent (an toàn khi StrictMode gọi 2 lần).
 */
export function trackProjectDeletions(prev: Project[], next: Project[], now: string = new Date().toISOString()): void {
  if (!trackingEnabled || prev === next) return;
  const before = collectProjectEntityKeys(prev);
  const after = collectProjectEntityKeys(next);
  const map = readTombstones();
  let changed = false;
  for (const key of before) {
    if (!after.has(key) && !map[key]) {
      map[key] = now;
      changed = true;
    }
  }
  for (const key of after) {
    if (map[key]) {
      delete map[key];
      changed = true;
    }
  }
  if (changed) writeTombstones(map);
}

export function trackLogDeletions(logIds: string[], now: string = new Date().toISOString()): void {
  if (!trackingEnabled || logIds.length === 0) return;
  const map = readTombstones();
  for (const id of logIds) map[`l:${id}`] = map[`l:${id}`] || now;
  writeTombstones(map);
}

export function mergeTombstones(a: TombstoneMap, b: TombstoneMap): TombstoneMap {
  const out: TombstoneMap = { ...a };
  for (const [key, at] of Object.entries(b)) {
    if (!out[key] || at > out[key]) out[key] = at;
  }
  return out;
}

export function pruneTombstones(map: TombstoneMap, now: Date = new Date()): TombstoneMap {
  const cutoff = new Date(now.getTime() - TOMBSTONE_TTL_DAYS * 86400000).toISOString();
  const out: TombstoneMap = {};
  for (const [key, at] of Object.entries(map)) if (at >= cutoff) out[key] = at;
  return out;
}
