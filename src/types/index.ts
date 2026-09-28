export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  subtasks?: SubTask[]; // Đệ quy: Cho phép subtask chứa N tầng subtask con bên trong
}

export interface Task {
  id: string;
  title: string;
  status: 'todo' | 'doing' | 'done';
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

export interface UndoAction {
  id: string;
  message: string;
  undo: () => void;
}

export type FilterType = 'all' | 'doing' | 'completed';
export type MobileGuideTab = 'ios' | 'android' | 'file';
