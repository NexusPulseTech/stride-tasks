import React from 'react';
import { createPortal } from 'react-dom';
import { Trash2, HelpCircle, X } from 'lucide-react';
import { ConfirmDialogState } from '../../../types';

interface ConfirmDialogProps {
  confirmDialog: ConfirmDialogState | null;
  onClose: () => void;
}

export function ConfirmDialog({ confirmDialog, onClose }: ConfirmDialogProps) {
  if (!confirmDialog?.isOpen) return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[99999] bg-slate-950/40 dark:bg-black/70 backdrop-blur-[3px] flex items-center justify-center p-3.5 sm:p-4 animate-in fade-in duration-100"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#161b22] rounded-2xl max-w-[400px] w-[calc(100vw-32px)] shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden max-h-[85vh] flex flex-col animate-in zoom-in-[0.98] duration-100"
      >
        {/* Header */}
        <div className="px-4.5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                confirmDialog.isDestructive
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {confirmDialog.isDestructive ? (
                <Trash2 className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
              ) : (
                <HelpCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-[13px] sm:text-[13.5px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                {confirmDialog.title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Đóng (Esc)"
            aria-label="Đóng"
          >
            <X className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto overflow-x-hidden text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>{confirmDialog.message}</p>
        </div>

        {/* Footer */}
        <div className="px-4.5 py-2.5 sm:py-3 bg-slate-50/70 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-7.5 px-3 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
          >
            {confirmDialog.cancelText || 'Hủy'}
          </button>
          <button
            type="button"
            onClick={() => {
              confirmDialog.onConfirm();
            }}
            className={`h-7.5 px-3.5 text-xs font-medium rounded-lg cursor-pointer shadow-xs active:scale-[0.98] transition-all flex items-center gap-1.5 ${
              confirmDialog.isDestructive
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-950'
            }`}
          >
            {confirmDialog.isDestructive && (
              <Trash2 className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            )}
            <span>{confirmDialog.confirmText || 'Xác nhận'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
