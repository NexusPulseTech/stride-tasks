export interface StatusDefinition {
  id: string;
  label: string;
  category: 'todo' | 'doing' | 'done';
  color: string;
  isCustom?: boolean;
}

export interface CompletedItemLog {
  id: string;
  taskId: string;
  taskTitle: string;
  projectId: string;
  projectName: string;
  completedAt: string;
  dateKey: string;
  subtasksCompleted?: number;
  subtasksTotal?: number;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  status?: string;
  subtasks?: SubTask[]; // Đệ quy: Cho phép subtask chứa N tầng subtask con bên trong
}

export interface Task {
  id: string;
  title: string;
  status: string;
  deadline?: string;
  notes?: string;
  subtasks: SubTask[];
  isPinned?: boolean; // Ghim việc ưu tiên cao nhất
  completedAt?: string; // Thời gian hoàn thành (ISO string hoặc YYYY-MM-DD)
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

export interface AutoBackupData {
  timestamp: string;
  projectCount: number;
  taskCount: number;
  historyCount?: number;
  projects: Project[];
  completedLogs?: CompletedItemLog[];
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
    completedLogs?: CompletedItemLog[];
    customStatuses?: StatusDefinition[];
    streak?: { count: number; lastDate?: string } | number;
  };
}

export interface BatchPasteTarget {
  type: 'project' | 'task' | 'subtask';
  projectId: string;
  projectName: string;
  taskId?: string;
  taskTitle?: string;
  parentSubId?: string;
  subTitle?: string;
}

export interface UndoAction {
  id: string;
  message: string;
  undo: () => void;
}

export type FilterType = 'all' | 'doing' | 'completed';
export type MobileGuideTab = 'ios' | 'android' | 'file';
