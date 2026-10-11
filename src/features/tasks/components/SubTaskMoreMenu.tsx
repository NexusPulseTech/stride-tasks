import React from 'react';
import {
  Plus,
  Pencil,
  Copy,
  Trash2,
  ClipboardPaste,
  Repeat,
  RotateCw,
  Check,
  Pin,
  Eye,
  Briefcase,
  Calendar,
} from 'lucide-react';
import { SubTask, RecurrenceType } from '../../../types';
import { PortalMenu } from '../../../components/ui/PortalMenu';

interface SubTaskMoreMenuProps {
  sub: SubTask;
  projectId: string;
  taskId: string;
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  onStartAddChild: () => void;
  onStartEditTitle: () => void;
  onCopyTitle: () => void;
  onDelete: () => void;
  onBatchPasteChild?: () => void;
  onSetSubTaskRecurrence?: (projId: string, taskId: string, subId: string, recurrence: RecurrenceType) => void;
  onManuallyResetRecurringSubTask?: (projId: string, taskId: string, subId: string) => void;
  onTogglePinSubTask?: (projId: string, taskId: string, subId: string) => void;
  onOpenParentDetail?: () => void;
}

export function SubTaskMoreMenu({
  sub,
  projectId,
  taskId,
  isOpen,
  onClose,
  triggerRef,
  onStartAddChild,
  onStartEditTitle,
  onCopyTitle,
  onDelete,
  onBatchPasteChild,
  onSetSubTaskRecurrence,
  onManuallyResetRecurringSubTask,
  onTogglePinSubTask,
  onOpenParentDetail,
}: SubTaskMoreMenuProps) {
  return (
    <PortalMenu isOpen={isOpen} onClose={onClose} triggerRef={triggerRef} widthClass="w-48">
      {onOpenParentDetail && (
        <button
          type="button"
          onClick={() => {
            onOpenParentDetail();
            onClose();
          }}
          className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
        >
          <Eye className="w-3.5 h-3.5 shrink-0 text-slate-400" strokeWidth={1.5} />
          <span>Xem chi tiết công việc</span>
        </button>
      )}

      <button
        type="button"
        onClick={onStartAddChild}
        className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
      >
        <Plus className="w-3.5 h-3.5 shrink-0 text-slate-400" strokeWidth={1.75} aria-hidden="true" />
        <span>Thêm việc con</span>
      </button>

      {/* Ghim / Bỏ ghim bước con */}
      {onTogglePinSubTask && (
        <button
          type="button"
          onClick={() => {
            onTogglePinSubTask(projectId, taskId, sub.id);
            onClose();
          }}
          className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
        >
          <Pin
            className={`w-3.5 h-3.5 shrink-0 ${
              sub.isPinned
                ? 'fill-amber-500 text-amber-600 dark:text-amber-400'
                : 'text-slate-400 dark:text-slate-400'
            }`}
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <span>{sub.isPinned ? 'Bỏ ghim ưu tiên' : 'Ghim lên tiêu điểm ưu tiên'}</span>
        </button>
      )}

      {onBatchPasteChild && (
        <button
          type="button"
          onClick={() => {
            onBatchPasteChild();
            onClose();
          }}
          className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
        >
          <ClipboardPaste className="w-3.5 h-3.5 shrink-0 text-slate-400" strokeWidth={1.5} aria-hidden="true" />
          <span>Dán danh sách việc con</span>
        </button>
      )}

      {/* Chu kỳ lặp lại (Hàng ngày, v.v.) cho việc con */}
      {onSetSubTaskRecurrence && (
        <div className="py-1 my-1 border-y border-slate-100 dark:border-slate-800">
          <div className="px-2.5 py-0.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Lặp lại định kỳ</span>
            <Repeat className="w-3 h-3 text-slate-400" />
          </div>
          <button
            type="button"
            onClick={() => {
              onSetSubTaskRecurrence(projectId, taskId, sub.id, sub.recurrence === 'daily' ? null : 'daily');
              onClose();
            }}
            className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
              sub.recurrence === 'daily'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-medium'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80'
            }`}
          >
            <span className="flex items-center gap-2">
              <Repeat className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.5} />
              <span>Hàng ngày</span>
            </span>
            {sub.recurrence === 'daily' && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
          </button>
          <button
            type="button"
            onClick={() => {
              onSetSubTaskRecurrence(projectId, taskId, sub.id, sub.recurrence === 'weekdays' ? null : 'weekdays');
              onClose();
            }}
            className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
              sub.recurrence === 'weekdays'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-medium'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80'
            }`}
          >
            <span className="flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.5} />
              <span>Ngày làm việc (T2 - T6)</span>
            </span>
            {sub.recurrence === 'weekdays' && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
          </button>
          <button
            type="button"
            onClick={() => {
              onSetSubTaskRecurrence(projectId, taskId, sub.id, sub.recurrence === 'weekly' ? null : 'weekly');
              onClose();
            }}
            className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
              sub.recurrence === 'weekly'
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-medium'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80'
            }`}
          >
            <span className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.5} />
              <span>Hàng tuần</span>
            </span>
            {sub.recurrence === 'weekly' && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
          </button>

          {sub.recurrence && onManuallyResetRecurringSubTask && (
            <button
              type="button"
              onClick={() => {
                onManuallyResetRecurringSubTask(projectId, taskId, sub.id);
                onClose();
              }}
              className="w-full text-left px-2.5 py-1 text-xs text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors mt-0.5"
            >
              <RotateCw className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span>Làm mới việc hôm nay</span>
            </button>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onStartEditTitle}
        className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
      >
        <Pencil className="w-3.5 h-3.5 shrink-0 text-slate-400" strokeWidth={1.5} aria-hidden="true" />
        <span>Chỉnh sửa tên</span>
      </button>

      <button
        type="button"
        onClick={onCopyTitle}
        className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
      >
        <Copy className="w-3.5 h-3.5 shrink-0 text-slate-400" strokeWidth={1.5} aria-hidden="true" />
        <span>Sao chép tên</span>
      </button>

      <div className="border-t border-slate-100 dark:border-slate-700/80 my-0.5" />

      <button
        type="button"
        onClick={onDelete}
        className="w-full text-left px-2.5 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
        <span>Xóa việc con</span>
      </button>
    </PortalMenu>
  );
}
