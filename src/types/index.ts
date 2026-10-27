export interface StatusDefinition {
  id: string;
  label: string;
  category: 'todo' | 'doing' | 'done';
  color: string;
  isCustom?: boolean;
}

export type RecurrenceType = 'daily' | 'weekdays' | 'weekly' | null;

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  status?: string; // Hỗ trợ trạng thái mở rộng: 'todo' | 'doing' | 'review' | 'blocked' | 'done' | custom
  subtasks?: SubTask[]; // Đệ quy: Cho phép subtask chứa N tầng subtask con bên trong
  recurrence?: RecurrenceType;
  lastCompletedDate?: string; // 'YYYY-MM-DD'
  recurrenceStreak?: number;
  isPinned?: boolean;
  snoozeUntil?: string; // ISO string thời điểm hết hoãn / đếm ngược nhắc lại
  snoozeLevel?: number; // Cấp độ hoãn lũy tiến (1 = 1 ngày, 2 = 3 ngày, 3 = 9 ngày...)
  updatedAt?: string; // ISO — dự phòng cho cơ chế merge đồng bộ đa thiết bị theo từng mục
}

export interface Task {
  id: string;
  title: string;
  status: string; // 'todo' | 'doing' | 'review' | 'blocked' | 'done' | custom
  deadline?: string;
  reminderAt?: string; // ISO string hẹn giờ nhắc thông minh (ví dụ: "2026-10-09T09:00:00")
  notes?: string;
  subtasks: SubTask[];
  isPinned?: boolean; // Ghim việc ưu tiên cao nhất
  completedAt?: string; // Thời gian hoàn thành (ISO string hoặc YYYY-MM-DD)
  recurrence?: RecurrenceType;
  lastCompletedDate?: string; // 'YYYY-MM-DD'
  recurrenceStreak?: number;
  snoozeUntil?: string; // ISO string thời điểm hết hoãn / đếm ngược nhắc lại
  snoozeLevel?: number; // Cấp độ hoãn lũy tiến (1 = 1 ngày, 2 = 3 ngày, 3 = 9 ngày...)
  focusedMinutes?: number; // Số phút tập trung của chu kỳ hiện tại (reset khi việc lặp lại sang chu kỳ mới; lịch sử nằm ở focus log)
  pomodoroSessions?: number; // Số phiên Pomodoro hoàn thành của chu kỳ hiện tại
  estimatedMinutes?: number; // Quỹ thời gian dự kiến (Time Budget chuẩn Sunsama / Akiflow)
  updatedAt?: string; // ISO — dự phòng cho cơ chế merge đồng bộ đa thiết bị theo từng mục
}

export type WorkspaceViewMode = 'list' | 'board';

export interface Project {
  id: string;
  name: string;
  color?: string;
  isExpanded: boolean;
  tasks: Task[];
  updatedAt?: string; // ISO — dự phòng cho cơ chế merge đồng bộ đa thiết bị theo từng mục
}

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
}

export interface UndoAction {
  id: string;
  message: string;
  undo: () => void;
}

export type FilterType = 'all' | 'doing' | 'scheduled' | 'completed';
export type MobileGuideTab = 'ios' | 'android' | 'file';

export interface BatchPasteTarget {
  type: 'project' | 'task' | 'subtask';
  projectId: string;
  projectName: string;
  taskId?: string;
  taskTitle?: string;
  parentSubId?: string;
  subTitle?: string;
}

export interface AutoBackupData {
  timestamp: string;
  projectCount: number;
  taskCount: number;
  historyCount?: number;
  projects: Project[];
  completedLogs?: any[];
  customStatuses?: StatusDefinition[];
}

export interface StrideBackupPayload {
  version: string;
  schemaVersion: number;
  appName: string;
  exportedAt: string;
  summary: {
    projectCount: number;
    taskCount: number;
    historyLogCount: number;
    streakCount?: number;
  };
  data: {
    projects: Project[];
    completedLogs?: any[];
    customStatuses?: StatusDefinition[];
    streak?: { count: number; lastDate?: string } | number;
    completedLogsArchive?: Record<string, number>; // Bộ đếm hoàn thành theo ngày của log > 90 ngày
    proLicense?: unknown; // Bản ghi license chứa token Ed25519 — luôn được verify lại khi khôi phục
  };
}
