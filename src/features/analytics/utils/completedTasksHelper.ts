import { CompletedItemLog, getTodayKey } from '../hooks/useActivityLog';

export interface CompletedTaskItem {
  id: string;
  taskId: string;
  title: string;
  projectId: string;
  projectName: string;
  completedAt: string;
  dateKey: string; // YYYY-MM-DD
  formattedDate: string;
  subtasksCompleted: number;
  subtasksTotal: number;
}

export function formatCompletedTime(isoOrDate: string): string {
  try {
    const d = new Date(isoOrDate);
    if (isNaN(d.getTime())) return isoOrDate;

    const today = new Date();
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;

    if (isToday) return `Hôm nay, ${timeStr}`;
    if (isYesterday) return `Hôm qua, ${timeStr}`;
    return `${timeStr} · ${dateStr}`;
  } catch (e) {
    return isoOrDate;
  }
}

export function formatLogsToTaskItems(logs: CompletedItemLog[]): CompletedTaskItem[] {
  return logs.map((log) => ({
    id: log.id,
    taskId: log.taskId,
    title: log.taskTitle,
    projectId: log.projectId,
    projectName: log.projectName,
    completedAt: log.completedAt,
    dateKey: log.dateKey,
    formattedDate: formatCompletedTime(log.completedAt),
    subtasksCompleted: log.subtasksCompleted || 0,
    subtasksTotal: log.subtasksTotal || 0,
  }));
}

export type TimeFilterRange = 'all' | 'today' | 'week' | 'month' | 'date';

export function filterCompletedTasks(
  tasks: CompletedTaskItem[],
  range: TimeFilterRange,
  selectedDateKey?: string | null,
  searchQuery?: string
): CompletedTaskItem[] {
  const today = new Date();
  const todayKey = getTodayKey();

  // Tính đầu tuần (Thứ Hai)
  const dayOfWeek = today.getDay(); // 0 = CN, 1 = T2
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  // Đầu tháng
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  startOfMonth.setHours(0, 0, 0, 0);

  return tasks.filter((item) => {
    // Lọc theo từ khóa tìm kiếm
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const match =
        item.title.toLowerCase().includes(q) ||
        item.projectName.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (range === 'date' && selectedDateKey) {
      return item.dateKey === selectedDateKey;
    }

    if (range === 'today') {
      return item.dateKey === todayKey;
    }

    if (range === 'week') {
      const itemDate = new Date(item.completedAt);
      return itemDate.getTime() >= startOfWeek.getTime();
    }

    if (range === 'month') {
      const itemDate = new Date(item.completedAt);
      return itemDate.getTime() >= startOfMonth.getTime();
    }

    return true; // 'all'
  });
}
