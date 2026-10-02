import React from 'react';
import { createPortal } from 'react-dom';
import { Upload, Download, X } from 'lucide-react';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
  onTriggerImport: () => void;
  onResetSample: () => void;
}

export function BackupModal({
  isOpen,
  onClose,
  onExport,
  onTriggerImport,
  onResetSample,
}: BackupModalProps) {
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
              <Upload className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[13px] sm:text-[13.5px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                Sao Lưu & Khôi Phục
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-normal truncate mt-0.5">
                Quản lý an toàn dữ liệu trên máy bạn
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

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-2.5 overflow-y-auto overflow-x-hidden text-xs text-slate-600 dark:text-slate-300">
          <div className="p-3 bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 shrink-0 text-slate-700 dark:text-slate-300" strokeWidth={1.5} aria-hidden="true" />
                <span>Xuất file dữ liệu</span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Lưu bản sao lưu định dạng .json
              </p>
            </div>
            <button
              type="button"
              onClick={onExport}
              className="h-7.5 px-3 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-950 text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-xs active:scale-[0.98] shrink-0"
              aria-label="Tải về file dữ liệu sao lưu"
            >
              <Download className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
              <span>Tải về</span>
            </button>
          </div>

          <div className="p-3 bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 shrink-0 text-slate-700 dark:text-slate-300" strokeWidth={1.5} aria-hidden="true" />
                <span>Khôi phục dữ liệu</span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Nhập từ file .json đã sao lưu
              </p>
            </div>
            <button
              type="button"
              onClick={onTriggerImport}
              className="h-7.5 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs active:scale-[0.98] shrink-0"
              aria-label="Chọn file dữ liệu để khôi phục"
            >
              <Upload className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
              <span>Chọn file</span>
            </button>
          </div>

          {/* Download Full Source Code for GitHub */}
          <div className="p-3 bg-slate-100/80 dark:bg-slate-800/60 border border-slate-300/80 dark:border-slate-700/80 rounded-xl flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 shrink-0 text-slate-800 dark:text-slate-200" strokeWidth={1.5} aria-hidden="true" />
                <span>Tải toàn bộ mã nguồn (.ZIP)</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Đầy đủ code sạch (React, TS, Vite) để đưa lên GitHub cá nhân
              </p>
            </div>
            <a
              href="/solo-tasks-manager.zip"
              download="solo-tasks-manager.zip"
              className="h-7.5 px-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-950 text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-xs active:scale-[0.98] shrink-0 no-underline"
              aria-label="Tải file zip mã nguồn"
            >
              <Download className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
              <span>Tải ZIP</span>
            </a>
          </div>

          <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
            <span>Dữ liệu mẫu ban đầu:</span>
            <button
              type="button"
              onClick={onResetSample}
              className="text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 underline cursor-pointer transition-colors"
            >
              Khôi phục dữ liệu mẫu
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4.5 py-2.5 sm:py-3 bg-slate-50/70 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-7.5 px-3.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-950 rounded-lg text-xs font-medium cursor-pointer shadow-xs active:scale-[0.98] transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
