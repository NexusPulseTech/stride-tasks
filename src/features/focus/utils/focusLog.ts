/**
 * Nhật ký tập trung append-only (Deep Work log).
 * Tách khỏi Task để lịch sử không mất khi xóa việc hoặc khi việc lặp lại sang chu kỳ mới.
 * Bản ghi cũ hơn ARCHIVE_AFTER_DAYS được gộp thành tổng phút theo ngày để không phình localStorage.
 */
export const FOCUS_LOG_KEY = 'STRIDE_FOCUS_LOG_V1';
const ARCHIVE_AFTER_DAYS = 90;

export interface FocusLogEntry {
  /** YYYY-MM-DD theo giờ địa phương */
  d: string;
  /** taskId */
  t: string;
  /** projectId */
  p: string;
  /** số phút */
  m: number;
  /** 1 = chạy hết chu kỳ */
  c: 0 | 1;
}

export interface FocusLogStore {
  entries: FocusLogEntry[];
  archivedDailyMinutes: Record<string, number>;
  archivedSessions: number;
}

export interface FocusSummary {
  todayMinutes: number;
  weekMinutes: number;
  totalMinutes: number;
  completedSessions: number;
}

const EMPTY_STORE: FocusLogStore = { entries: [], archivedDailyMinutes: {}, archivedSessions: 0 };

export function localDateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function readFocusLog(): FocusLogStore {
  try {
    const raw = localStorage.getItem(FOCUS_LOG_KEY);
    if (!raw) return EMPTY_STORE;
    const parsed = JSON.parse(raw) as Partial<FocusLogStore>;
    return {
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
      archivedDailyMinutes:
        parsed.archivedDailyMinutes && typeof parsed.archivedDailyMinutes === 'object' ? parsed.archivedDailyMinutes : {},
      archivedSessions: typeof parsed.archivedSessions === 'number' ? parsed.archivedSessions : 0,
    };
  } catch {
    return EMPTY_STORE;
  }
}

/** Gộp các bản ghi cũ hơn ngưỡng thành tổng theo ngày (giữ đủ dữ liệu cho thống kê dài hạn) */
export function archiveOldFocusEntries(store: FocusLogStore, now: Date = new Date()): FocusLogStore {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - ARCHIVE_AFTER_DAYS);
  const cutoffKey = localDateKey(cutoff);
  const keep: FocusLogEntry[] = [];
  const archived = { ...store.archivedDailyMinutes };
  let archivedSessions = store.archivedSessions;
  for (const e of store.entries) {
    if (e.d < cutoffKey) {
      archived[e.d] = (archived[e.d] || 0) + e.m;
      archivedSessions += e.c;
    } else {
      keep.push(e);
    }
  }
  if (keep.length === store.entries.length) return store;
  return { entries: keep, archivedDailyMinutes: archived, archivedSessions };
}

export function appendFocusLog(
  store: FocusLogStore,
  entry: { taskId: string; projectId: string; minutes: number; completedSession: boolean },
  now: Date = new Date()
): FocusLogStore {
  if (!(entry.minutes > 0)) return store;
  const next: FocusLogStore = {
    ...store,
    entries: [
      ...store.entries,
      { d: localDateKey(now), t: entry.taskId, p: entry.projectId, m: Math.round(entry.minutes), c: entry.completedSession ? 1 : 0 },
    ],
  };
  return archiveOldFocusEntries(next, now);
}

export function summarizeFocusLog(store: FocusLogStore, now: Date = new Date()): FocusSummary {
  const today = localDateKey(now);
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const mondayKey = localDateKey(monday);

  let todayMinutes = 0;
  let weekMinutes = 0;
  let totalMinutes = 0;
  let completedSessions = store.archivedSessions;
  for (const e of store.entries) {
    totalMinutes += e.m;
    completedSessions += e.c;
    if (e.d === today) todayMinutes += e.m;
    if (e.d >= mondayKey) weekMinutes += e.m;
  }
  for (const minutes of Object.values(store.archivedDailyMinutes)) totalMinutes += minutes;
  return { todayMinutes, weekMinutes, totalMinutes, completedSessions };
}
