import React from 'react';
import { Plus, Pencil, Copy, Trash2, ClipboardPaste } from 'lucide-react';
import { PortalMenu } from '../../../components/ui/PortalMenu';

interface SubTaskMoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  onStartAddChild: () => void;
  onStartEditTitle: () => void;
  onCopyTitle: () => void;
  onDelete: () => void;
  onBatchPasteChild?: () => void;
}

export function SubTaskMoreMenu({
  isOpen,
  onClose,
  triggerRef,
  onStartAddChild,
  onStartEditTitle,
  onCopyTitle,
  onDelete,
  onBatchPasteChild,
}: SubTaskMoreMenuProps) {
  return (
    <PortalMenu isOpen={isOpen} onClose={onClose} triggerRef={triggerRef} widthClass="w-40">
      <button
        type="button"
        onClick={onStartAddChild}
        className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
      >
        <Plus className="w-3.5 h-3.5 shrink-0 text-slate-400" strokeWidth={1.75} aria-hidden="true" />
        <span>Thêm việc con</span>
      </button>

      {onBatchPasteChild && (
        <button
          type="button"
          onClick={onBatchPasteChild}
          className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
        >
          <ClipboardPaste className="w-3.5 h-3.5 shrink-0 text-slate-400" strokeWidth={1.5} aria-hidden="true" />
          <span>Dán danh sách việc con</span>
        </button>
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
