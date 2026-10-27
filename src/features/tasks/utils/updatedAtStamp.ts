import type { Project, Task, SubTask } from '../../../types';

/**
 * Gắn `updatedAt` tự động cho mọi Project / Task / SubTask thực sự thay đổi giữa 2 trạng thái.
 *
 * Được gọi tập trung tại setter `setProjects` của useTaskCRUD nên MỌI thao tác (thêm, sửa, đổi trạng thái,
 * ghim, hoãn, lặp lại, subtask, kéo thả, Undo, rollover…) đều được ghi dấu mà không phải sửa từng hàm.
 *
 * Quy tắc:
 * - So sánh theo GIÁ TRỊ (không chỉ theo tham chiếu): bản sao giống hệt (VD: đồng bộ đa tab nạp lại từ storage,
 *   `prev.map(p => ({ ...p }))`) không bị coi là thay đổi.
 * - Thay đổi ở con (subtask / task) hoặc thứ tự / số lượng con làm cha cũng được ghi dấu.
 * - `isExpanded` của Project là trạng thái giao diện nên không tính là thay đổi nội dung.
 * - Nếu nơi gọi đã tự đặt `updatedAt` (VD: tạo việc bằng NLP, khôi phục backup) thì giữ nguyên giá trị đó.
 * - Đối tượng không đổi giữ nguyên tham chiếu (không phá memo của React).
 */

const PROJECT_IGNORED: ReadonlySet<string> = new Set(['tasks', 'updatedAt', 'isExpanded']);
const TASK_IGNORED: ReadonlySet<string> = new Set(['subtasks', 'updatedAt']);
const SUBTASK_IGNORED: ReadonlySet<string> = new Set(['subtasks', 'updatedAt']);

interface StampResult<T> {
  value: T;
  changed: boolean;
}

function sameValue(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

function ownFieldsChanged(prev: object, next: object, ignored: ReadonlySet<string>): boolean {
  const p = prev as Record<string, unknown>;
  const n = next as Record<string, unknown>;
  for (const key of new Set([...Object.keys(p), ...Object.keys(n)])) {
    if (ignored.has(key)) continue;
    if (!sameValue(p[key], n[key])) return true;
  }
  return false;
}

function callerSetUpdatedAt(prev: { updatedAt?: string } | undefined, next: { updatedAt?: string }): boolean {
  return next.updatedAt !== undefined && next.updatedAt !== prev?.updatedAt;
}

/** Ghi dấu một danh sách theo id; `stampOne` xử lý từng phần tử */
function stampList<T extends { id: string }>(
  prevList: T[] | undefined,
  nextList: T[] | undefined,
  stampOne: (prev: T | undefined, next: T) => StampResult<T>
): StampResult<T[] | undefined> {
  if (prevList === nextList) return { value: nextList, changed: false };
  const prevArr = prevList || [];
  if (!nextList) return { value: nextList, changed: prevArr.length > 0 };

  const prevById = new Map(prevArr.map((item) => [item.id, item]));
  let changed = prevArr.length !== nextList.length;
  let replaced = false;
  const stamped = nextList.map((item, index) => {
    if (prevArr[index]?.id !== item.id) changed = true; // thêm / xóa / đổi thứ tự
    const result = stampOne(prevById.get(item.id), item);
    if (result.changed) changed = true;
    if (result.value !== item) replaced = true;
    return result.value;
  });
  return { value: replaced ? stamped : nextList, changed };
}

function stampSubtask(prev: SubTask | undefined, next: SubTask, now: string): StampResult<SubTask> {
  if (prev === next) return { value: next, changed: false };
  const children = stampList(prev?.subtasks, next.subtasks, (p, n) => stampSubtask(p, n, now));
  const changed = !prev || ownFieldsChanged(prev, next, SUBTASK_IGNORED) || children.changed;
  let value = children.value !== next.subtasks ? { ...next, subtasks: children.value } : next;
  if (changed && !callerSetUpdatedAt(prev, next)) value = { ...value, updatedAt: now };
  return { value, changed };
}

function stampTask(prev: Task | undefined, next: Task, now: string): StampResult<Task> {
  if (prev === next) return { value: next, changed: false };
  const children = stampList(prev?.subtasks, next.subtasks, (p, n) => stampSubtask(p, n, now));
  const changed = !prev || ownFieldsChanged(prev, next, TASK_IGNORED) || children.changed;
  let value = children.value !== next.subtasks ? { ...next, subtasks: children.value ?? [] } : next;
  if (changed && !callerSetUpdatedAt(prev, next)) value = { ...value, updatedAt: now };
  return { value, changed };
}

function stampProject(prev: Project | undefined, next: Project, now: string): StampResult<Project> {
  if (prev === next) return { value: next, changed: false };
  const children = stampList(prev?.tasks, next.tasks, (p, n) => stampTask(p, n, now));
  const changed = !prev || ownFieldsChanged(prev, next, PROJECT_IGNORED) || children.changed;
  let value = children.value !== next.tasks ? { ...next, tasks: children.value ?? [] } : next;
  if (changed && !callerSetUpdatedAt(prev, next)) value = { ...value, updatedAt: now };
  return { value, changed };
}

export function stampProjectsUpdatedAt(prev: Project[], next: Project[], now: string = new Date().toISOString()): Project[] {
  if (prev === next || !Array.isArray(next)) return next;
  const result = stampList(prev, next, (p, n) => stampProject(p, n, now));
  return result.value ?? next;
}
