import React from 'react';
import { createPortal } from 'react-dom';
import { Plus, Pin, X } from 'lucide-react';
import { Project } from '../../../types';

interface MobileAddModalProps {
  isOpen: boolean;
  projects: Project[];
  selectedProjId: string;
  onSelectedProjIdChange: (id: string) => void;
  taskTitle: string;
  onTaskTitleChange: (title: string) => void;
  isPinned: boolean;
  onIsPinnedChange: (pinned: boolean) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function MobileAddModal({
  isOpen,
  projects,
  selectedProjId,
  onSelectedProjIdChange,
  taskTitle,
  onTaskTitleChange,
  isPinned,
  onIsPinnedChange,
  onClose,
  onSubmit,
}: MobileAddModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[99999] bg-slate-950/40 dark:bg-black/70 backdrop-blur-[3px] flex items-center justify-center p-3.5 sm:p-4 animate-in fade-in duration-100"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#161b22] rounded-2xl max-w-[420px] w-[calc(100vw-32px)] shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden max-h-[85vh] flex flex-col animate-in zoom-in-[0.98] duration-100"
      >
        {/* Header */}
        <div className="px-4.5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0">
              <Plus className="w-3.5 h-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[13px] sm:text-[13.5px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                Thêm Việc Nhanh
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-normal truncate mt-0.5">
                Tạo việc mới hoặc dán kèm liên kết web
              </p>
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

        {/* Form Body */}
        <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto overflow-x-hidden text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Dự án tiếp nhận
              </label>
              <select
                value={selectedProjId}
                onChange={(e) => onSelectedProjIdChange(e.target.value)}
                className="w-full h-9 px-3 bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 font-medium outline-none focus:border-slate-400 dark:focus:border-slate-600 cursor-pointer transition-all"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-white dark:bg-[#161b22] text-slate-900 dark:text-slate-100">
                    {p.name} ({p.tasks.length} việc)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Nội dung công việc
              </label>
              <textarea
                value={taskTitle}
                onChange={(e) => onTaskTitleChange(e.target.value)}
                placeholder="Nhập tên việc hoặc dán link web..."
                rows={3}
                className="w-full p-3 bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-slate-400 dark:focus:border-slate-600 focus:bg-white dark:focus:bg-[#161b22] leading-relaxed transition-all resize-none"
                autoFocus
              />
            </div>

            <div className="pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => onIsPinnedChange(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-0 cursor-pointer w-4 h-4"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-medium">
                  <Pin className="w-3.5 h-3.5 shrink-0 text-amber-500 fill-amber-500" strokeWidth={1.5} aria-hidden="true" />
                  <span>Ghim lên Tiêu điểm ưu tiên</span>
                </span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4.5 py-2.5 sm:py-3 bg-slate-50/70 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="h-7.5 px-3 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!taskTitle.trim()}
              className="h-7.5 px-3.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white disabled:opacity-40 text-white dark:text-slate-950 rounded-lg text-xs font-medium cursor-pointer shadow-xs active:scale-[0.98] transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
              <span>Tạo việc</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
