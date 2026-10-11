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
}

export interface Project {
  id: string;
  name: string;
  color?: string;
  isExpanded: boolean;
  tasks: Task[];
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
  };
}
