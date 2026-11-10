import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { COMPLETED_LOGS_KEY } from '../../../constants';
import { safeSetItem, idbGet, idbSet } from '../../../utils/persistentStorage';
import { trackLogDeletions } from '../../sync/tombstones';
import { getSampleActivity } from '../../../constants/sampleProjects';
import { detectInitialLanguage } from '../../../i18n/detectLanguage';
import type { Language } from '../../../i18n/types';

export interface CompletedItemLog {
  id: string;
  taskId: string;
  taskTitle: string;
  projectId: string;
  projectName: string;
  completedAt: string; // ISO 8601 string
  dateKey: string;     // YYYY-MM-DD
  subtasksCompleted?: number;
  subtasksTotal?: number;
}

export function getTodayKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateToKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getLevelFromCount(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 2) return 2;
  if (count === 3) return 3;
  return 4; // 4+ tasks
}

/** Lịch sử hoàn thành ví dụ (heatmap, bảng việc đã xong) cùng ngôn ngữ với bộ dự án ví dụ */
function generateInitialSeedLogs(language: Language = detectInitialLanguage()): CompletedItemLog[] {
  const today = new Date();
  return getSampleActivity(language).map((item, index) => {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() - item.daysAgo);
    const [hh, mm] = item.time.split(':');
    targetDate.setHours(parseInt(hh, 10), parseInt(mm, 10), 0, 0);

    return {
      id: `clog_seed_${index}_${item.daysAgo}`,
      taskId: `t_seed_${index}`,
      taskTitle: item.title,
      projectId: item.projectId,
      projectName: item.projectName,
      completedAt: targetDate.toISOString(),
      dateKey: formatDateToKey(targetDate),
      subtasksCompleted: item.subsDone,
      subtasksTotal: item.subsTotal,
    };
  });
}

// ----------------------------------------------------------------------------
// Auto-Archive: log cũ hơn LOG_ARCHIVE_AFTER_DAYS được gộp thành số đếm theo ngày (đủ cho Heatmap 365 ngày)
// để mảng log trong localStorage không phình theo năm tháng; bản ghi gốc được chuyển sang IndexedDB.
// ----------------------------------------------------------------------------
export const COMPLETED_LOGS_ARCHIVE_KEY = 'SOLO_COMPLETED_LOGS_ARCHIVE_V1';
const COMPLETED_LOGS_ARCHIVE_RAW_IDB_KEY = 'SOLO_COMPLETED_LOGS_ARCHIVE_RAW_V1';
export const LOG_ARCHIVE_AFTER_DAYS = 90;

interface LogArchiveState {
  archivedDailyCounts: Record<string, number>;
}

function readArchivedCounts(): Record<string, number> {
  try {
    const raw = localStorage.getItem(COMPLETED_LOGS_ARCHIVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<LogArchiveState>;
      if (parsed.archivedDailyCounts && typeof parsed.archivedDailyCounts === 'object') {
        return parsed.archivedDailyCounts;
      }
    }
  } catch (e) {}
  return {};
}

function archiveCutoffKey(now: Date = new Date()): string {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - LOG_ARCHIVE_AFTER_DAYS);
  return formatDateToKey(cutoff);
}

/** Tách log thành phần còn giữ chi tiết và phần gộp vào bộ đếm theo ngày (hàm thuần, không ghi storage) */
export function splitLogsForArchive(
  logs: CompletedItemLog[],
  archivedDailyCounts: Record<string, number>,
  now: Date = new Date()
): { recent: CompletedItemLog[]; archived: CompletedItemLog[]; counts: Record<string, number> } {
  const cutoffKey = archiveCutoffKey(now);
  const recent: CompletedItemLog[] = [];
  const archived: CompletedItemLog[] = [];
  const counts = { ...archivedDailyCounts };
  for (const log of logs) {
    if (log.dateKey && log.dateKey < cutoffKey) {
      archived.push(log);
      counts[log.dateKey] = (counts[log.dateKey] || 0) + 1;
    } else {
      recent.push(log);
    }
  }
  return { recent, archived, counts };
}

function persistArchivedCounts(counts: Record<string, number>): void {
  safeSetItem(COMPLETED_LOGS_ARCHIVE_KEY, JSON.stringify({ archivedDailyCounts: counts } satisfies LogArchiveState));
}

async function appendRawArchiveToIdb(archived: CompletedItemLog[]): Promise<void> {
  if (archived.length === 0) return;
  const existing = (await idbGet<CompletedItemLog[]>(COMPLETED_LOGS_ARCHIVE_RAW_IDB_KEY)) || [];
  const seen = new Set(existing.map((l) => l.id));
  await idbSet(COMPLETED_LOGS_ARCHIVE_RAW_IDB_KEY, [...existing, ...archived.filter((l) => !seen.has(l.id))]);
}

export function useActivityLog() {
  // Khởi tạo thuần (StrictMode có thể gọi 2 lần), việc ghi migration được thực hiện trong effect bên dưới
  const [initialState] = useState(() => {
    let stored: CompletedItemLog[] | null = null;
    try {
      const raw = localStorage.getItem(COMPLETED_LOGS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) stored = parsed;
      }
    } catch (e) {}
    const archivedCounts = readArchivedCounts();
    if (!stored) {
      return { logs: generateInitialSeedLogs(), counts: archivedCounts, archived: [] as CompletedItemLog[], needsWrite: true };
    }
    const split = splitLogsForArchive(stored, archivedCounts);
    return { logs: split.recent, counts: split.counts, archived: split.archived, needsWrite: split.archived.length > 0 };
  });

  const [completedLogs, setCompletedLogs] = useState<CompletedItemLog[]>(initialState.logs);
  const logsRef = useRef<CompletedItemLog[]>(initialState.logs);
  const [archivedDailyCounts, setArchivedDailyCounts] = useState<Record<string, number>>(initialState.counts);

  const didMigrateRef = useRef(false);
  useEffect(() => {
    if (didMigrateRef.current || !initialState.needsWrite) return;
    didMigrateRef.current = true;
    safeSetItem(COMPLETED_LOGS_KEY, JSON.stringify(initialState.logs));
    if (initialState.archived.length > 0) {
      persistArchivedCounts(initialState.counts);
      appendRawArchiveToIdb(initialState.archived);
    }
  }, [initialState]);

  const saveLogs = useCallback((newLogs: CompletedItemLog[], incomingArchivedCounts?: Record<string, number>) => {
    const baseCounts = incomingArchivedCounts ?? readArchivedCounts();
    const split = splitLogsForArchive(newLogs, baseCounts);
    setCompletedLogs(split.recent);
    setArchivedDailyCounts(split.counts);
    safeSetItem(COMPLETED_LOGS_KEY, JSON.stringify(split.recent));
    persistArchivedCounts(split.counts);
    appendRawArchiveToIdb(split.archived);
  }, []);

  // Ghi nhận hoàn thành công việc (SSOT: Thêm log hoàn thành thực tế)
  const recordTaskCompletion = useCallback(
    (
      task: { id: string; title: string; subtasks?: any[] },
      project?: { id: string; name: string }
    ) => {
      const now = new Date();
      const dateKey = formatDateToKey(now);
      const subs = task.subtasks || [];
      const subsDone = subs.filter((s: any) => s.completed).length;

      const newEntry: CompletedItemLog = {
        id: `clog_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        taskId: task.id,
        taskTitle: task.title,
        projectId: project?.id || 'default',
        projectName: project?.name || 'Chung',
        completedAt: now.toISOString(),
        dateKey,
        subtasksCompleted: subsDone,
        subtasksTotal: subs.length,
      };

      setCompletedLogs((prev) => {
        // Tránh trùng lặp nếu task này đã vừa được đánh dấu done hôm nay
        const replaced = prev.filter((item) => item.taskId === task.id && item.dateKey === dateKey);
        trackLogDeletions(replaced.map((item) => item.id));
        const filtered = prev.filter(
          (item) => !(item.taskId === task.id && item.dateKey === dateKey)
        );
        const updated = [newEntry, ...filtered];
        try {
          safeSetItem(COMPLETED_LOGS_KEY, JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    },
    []
  );

  // Xóa log khi người dùng bỏ tick hoàn thành (Uncheck)
  const removeTaskCompletion = useCallback((taskId: string) => {
    setCompletedLogs((prev) => {
      // Xóa log gần nhất của task này
      const index = prev.findIndex((item) => item.taskId === taskId);
      if (index === -1) return prev;
      trackLogDeletions([prev[index].id]);
      const updated = [...prev];
      updated.splice(index, 1);
      try {
        safeSetItem(COMPLETED_LOGS_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  // Xóa một dòng log cụ thể khỏi lịch sử hoàn thành
  const deleteActivityLog = useCallback((logId: string) => {
    trackLogDeletions([logId]);
    setCompletedLogs((prev) => {
      const updated = prev.filter((item) => item.id !== logId);
      try {
        safeSetItem(COMPLETED_LOGS_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, []);

  // Xóa sạch toàn bộ lịch sử hoàn thành (Clear all logs)
  const clearAllActivityLogs = useCallback(() => {
    trackLogDeletions(logsRef.current.map((item) => item.id));
    setCompletedLogs([]);
    setArchivedDailyCounts({});
    safeSetItem(COMPLETED_LOGS_KEY, JSON.stringify([]));
    persistArchivedCounts({});
  }, []);

  // Khôi phục lại dữ liệu mẫu nếu cần
  const resetSeedActivityLogs = useCallback((language?: Language) => {
    const seed = generateInitialSeedLogs(language);
    setCompletedLogs(seed);
    setArchivedDailyCounts({});
    safeSetItem(COMPLETED_LOGS_KEY, JSON.stringify(seed));
    persistArchivedCounts({});
  }, []);

  logsRef.current = completedLogs;

  // Bản đồ nhịp độ (Heatmap) = log chi tiết gần đây + bộ đếm theo ngày của log đã lưu trữ
  const activityMap = useMemo(() => {
    const map: Record<string, number> = { ...archivedDailyCounts };
    for (const log of completedLogs) {
      map[log.dateKey] = (map[log.dateKey] || 0) + 1;
    }
    return map;
  }, [completedLogs, archivedDailyCounts]);

  // Hôm nay: số việc đã xong đúng ngày hôm nay
  const todayKey = getTodayKey();
  const todayCount = useMemo(() => {
    return completedLogs.filter((item) => item.dateKey === todayKey).length;
  }, [completedLogs, todayKey]);

  // Tuần này: số việc đã xong từ Thứ Hai của tuần hiện tại
  const weekCount = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = CN, 1 = T2
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    return completedLogs.filter(
      (item) => new Date(item.completedAt).getTime() >= startOfWeek.getTime()
    ).length;
  }, [completedLogs]);

  // Chuỗi ngày liên tục (Streak): Đếm các ngày liên tiếp lùi từ hôm nay
  const currentStreak = useMemo(() => {
    let streak = 0;
    const d = new Date();
    const checkMap = activityMap;

    while (true) {
      const key = formatDateToKey(d);
      if ((checkMap[key] || 0) > 0) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        // Nếu hôm nay chưa làm việc nào, kiểm tra từ hôm qua
        if (streak === 0 && key === todayKey) {
          d.setDate(d.getDate() - 1);
          continue;
        }
        break;
      }
    }
    return streak;
  }, [activityMap, todayKey]);

  // Tổng số việc đã xong (bao gồm phần đã lưu trữ)
  const totalCompleted = useMemo(
    () => completedLogs.length + Object.values(archivedDailyCounts).reduce((sum, n) => sum + n, 0),
    [completedLogs, archivedDailyCounts]
  );

  return {
    completedLogs,
    archivedDailyCounts,
    activityMap,
    todayCount,
    weekCount,
    currentStreak,
    totalCompleted,
    recordTaskCompletion,
    removeTaskCompletion,
    deleteActivityLog,
    clearAllActivityLogs,
    resetSeedActivityLogs,
    saveLogs,
  };
}
