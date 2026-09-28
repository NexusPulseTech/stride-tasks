import React from 'react';
import { Copy, Pin, Plus, ArrowUp, ArrowDown, Trash2, Pencil } from 'lucide-react';
import { Task } from '../../../types';
import { PortalMenu } from '../../../components/ui/PortalMenu';

export interface TaskMoreMenuProps {
  task: Task;
  projectId: string;
  taskIndex: number;
  totalProjectTasks: number;
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  onStartEdit: () => void;
  onCopyTask: (title: string) => void;
  onTogglePinTask: (projId: string, taskId: string, e: React.MouseEvent) => void;
  onOpenAddSubtask: (taskId: string) => void;
  onMoveTask: (projId: string, index: number, dir: 'up' | 'down', e: React.MouseEvent) => void;
  onDeleteTask: (projId: string, taskId: string) => void;
}

export function TaskMoreMenu({
  task,
  projectId,
  taskIndex,
  totalProjectTasks,
  isOpen,
  onClose,
  triggerRef,
  onStartEdit,
  onCopyTask,
  onTogglePinTask,
  onOpenAddSubtask,
  onMoveTask,
  onDeleteTask,
}: TaskMoreMenuProps) {
  return (
    <PortalMenu isOpen={isOpen} onClose={onClose} triggerRef={triggerRef} widthClass="w-44">
      {/* Chỉnh sửa tên việc */}
      <button
        type="button"
        onClick={() => {
          onStartEdit();
          onClose();
        }}
        className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
      >
        <Pencil className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-slate-400" strokeWidth={1.5} aria-hidden="true" />
        <span>Chỉnh sửa tên</span>
      </button>

      {/* Sao chép việc */}
      <button
        type="button"
        onClick={() => {
          onCopyTask(task.title);
          onClose();
        }}
        className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
      >
        <Copy className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-slate-400" strokeWidth={1.5} aria-hidden="true" />
        <span>Sao chép việc</span>
      </button>

      {/* Ghim / Bỏ ghim */}
      <button
        type="button"
        onClick={(e) => {
          onTogglePinTask(projectId, task.id, e);
          onClose();
        }}
        className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
      >
        <Pin
          className={`w-3.5 h-3.5 shrink-0 ${
            task.isPinned
              ? 'fill-amber-500 text-amber-600 dark:text-amber-400'
              : 'text-slate-400 dark:text-slate-400'
          }`}
          strokeWidth={1.5}
          aria-hidden="true"
        />
        <span>{task.isPinned ? 'Bỏ ghim ưu tiên' : 'Ghim lên đầu'}</span>
      </button>

      {/* Thêm việc con */}
      <button
        type="button"
        onClick={() => {
          onOpenAddSubtask(task.id);
          onClose();
        }}
        className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
      >
        <Plus className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-slate-400" strokeWidth={1.75} aria-hidden="true" />
        <span>Thêm việc con</span>
      </button>

      {/* Di chuyển lên */}
      <button
        type="button"
        disabled={taskIndex === 0}
        onClick={(e) => {
          onMoveTask(projectId, taskIndex, 'up', e);
          onClose();
        }}
        className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 disabled:opacity-30 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
      >
        <ArrowUp className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-slate-400" strokeWidth={1.75} aria-hidden="true" />
        <span>Di chuyển lên</span>
      </button>

      {/* Di chuyển xuống */}
      <button
        type="button"
        disabled={taskIndex === totalProjectTasks - 1}
        onClick={(e) => {
          onMoveTask(projectId, taskIndex, 'down', e);
          onClose();
        }}
        className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 disabled:opacity-30 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
      >
        <ArrowDown className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-slate-400" strokeWidth={1.75} aria-hidden="true" />
        <span>Di chuyển xuống</span>
      </button>

      <div className="border-t border-slate-100 dark:border-slate-700/80 my-0.5" />

      {/* Xóa việc */}
      <button
        type="button"
        onClick={() => {
          onDeleteTask(projectId, task.id);
          onClose();
        }}
        className="w-full text-left px-2.5 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
        <span>Xóa việc</span>
      </button>
    </PortalMenu>
  );
}
