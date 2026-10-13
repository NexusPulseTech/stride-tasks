import React from 'react';
import {
  Copy,
  Pin,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Pencil,
  ClipboardPaste,
  Repeat,
  RotateCw,
  Check,
  Eye,
  Calendar,
  Briefcase,
} from 'lucide-react';
import { Task, RecurrenceType } from '../../../types';
import { PortalMenu } from '../../../components/ui/PortalMenu';
import { useLanguage } from '../../../i18n';

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
  onOpenBatchPasteSubtasks?: () => void;
  onMoveTask: (projId: string, index: number, dir: 'up' | 'down', e: React.MouseEvent) => void;
  onDeleteTask: (projId: string, taskId: string) => void;
  onSetRecurrence?: (projId: string, taskId: string, recurrence: RecurrenceType) => void;
  onManuallyResetRecurring?: (projId: string, taskId: string) => void;
  onOpenDetail?: () => void;
  onOpenSchedule?: () => void;
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
  onOpenBatchPasteSubtasks,
  onMoveTask,
  onDeleteTask,
  onSetRecurrence,
  onManuallyResetRecurring,
  onOpenDetail,
  onOpenSchedule,
}: TaskMoreMenuProps) {
  const { t, language } = useLanguage();

  return (
    <PortalMenu isOpen={isOpen} onClose={onClose} triggerRef={triggerRef} widthClass="w-52">
      {/* Xem chi tiết việc */}
      {onOpenDetail && (
        <button
          type="button"
          onClick={() => {
            onOpenDetail();
            onClose();
          }}
          className="w-full text-left px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg flex items-center gap-2 cursor-pointer transition-colors font-medium"
        >
          <Eye className="w-3.5 h-3.5 shrink-0 text-slate-500 dark:text-slate-400" strokeWidth={1.5} aria-hidden="true" />
          <span>{t.taskMenu.viewDetail}</span>
        </button>
      )}

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
        <span>{t.taskMenu.editTitle}</span>
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
        <span>{t.taskMenu.copyTask}</span>
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
        <span>{task.isPinned ? t.taskMenu.unpinTask : t.taskMenu.pinTask}</span>
      </button>

      {/* Lên lịch nhắc thông minh */}
      {onOpenSchedule && (
        <button
          type="button"
          onClick={() => {
            onOpenSchedule();
            onClose();
          }}
          className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
        >
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.5} aria-hidden="true" />
          <span>{t.taskMenu.schedule}</span>
        </button>
      )}

      {/* Chu kỳ lặp lại (Hàng ngày, v.v.) */}
      {onSetRecurrence && (
        <div className="py-1 my-1 border-y border-slate-100 dark:border-slate-800">
          <div className="px-2.5 py-0.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>{t.taskDetail.repeatLabel}</span>
            <Repeat className="w-3 h-3 text-slate-400" />
          </div>
          <button
            type="button"
            onClick={() => {
              onSetRecurrence(projectId, task.id, task.recurrence === 'daily' ? null : 'daily');
              onClose();
            }}
            className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
              task.recurrence === 'daily'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-medium'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80'
            }`}
          >
            <span className="flex items-center gap-2">
              <Repeat className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.5} />
              <span>{t.taskDetail.daily}</span>
            </span>
            {task.recurrence === 'daily' && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
          </button>
          <button
            type="button"
            onClick={() => {
              onSetRecurrence(projectId, task.id, task.recurrence === 'weekdays' ? null : 'weekdays');
              onClose();
            }}
            className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
              task.recurrence === 'weekdays'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-medium'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80'
            }`}
          >
            <span className="flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.5} />
              <span>{t.taskDetail.weekdays}</span>
            </span>
            {task.recurrence === 'weekdays' && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
          </button>
          <button
            type="button"
            onClick={() => {
              onSetRecurrence(projectId, task.id, task.recurrence === 'weekly' ? null : 'weekly');
              onClose();
            }}
            className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
              task.recurrence === 'weekly'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-medium'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80'
            }`}
          >
            <span className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.5} />
              <span>{t.taskDetail.weekly}</span>
            </span>
            {task.recurrence === 'weekly' && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
          </button>

          {task.recurrence && onManuallyResetRecurring && (
            <button
              type="button"
              onClick={() => {
                onManuallyResetRecurring(projectId, task.id);
                onClose();
              }}
              className="w-full text-left px-2.5 py-1 text-xs text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors mt-0.5"
            >
              <RotateCw className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span>{language === 'vi' ? 'Làm mới việc hôm nay' : 'Reset task today'}</span>
            </button>
          )}
        </div>
      )}

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
        <span>{t.taskMenu.addSubtask}</span>
      </button>

      {/* Dán nhanh việc con */}
      {onOpenBatchPasteSubtasks && (
        <button
          type="button"
          onClick={() => {
            onOpenBatchPasteSubtasks();
            onClose();
          }}
          className="w-full text-left px-2.5 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg flex items-center gap-2 cursor-pointer transition-colors font-medium"
        >
          <ClipboardPaste className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          <span>{t.taskMenu.batchPasteSubtasks}</span>
        </button>
      )}

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
        <span>{t.taskMenu.moveUp}</span>
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
        <span>{t.taskMenu.moveDown}</span>
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
        <span>{t.taskMenu.deleteTask}</span>
      </button>
    </PortalMenu>
  );
}
