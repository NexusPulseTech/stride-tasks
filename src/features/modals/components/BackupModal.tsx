import React from 'react';
import { createPortal } from 'react-dom';
import { Upload, Download, X, ShieldCheck, RotateCcw, Trash2 } from 'lucide-react';
import { Project } from '../../../types';

interface AutoBackupData {
  timestamp: string;
  projectCount: number;
  taskCount: number;
  projects: Project[];
}

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
  onTriggerImport: () => void;
  onResetSample: () => void;
  autoBackupData?: AutoBackupData | null;
  onRestoreAutoBackup?: () => void;
  onClearAllData?: () => void;
}

export function BackupModal({
  isOpen,
  onClose,
  onExport,
  onTriggerImport,
  onResetSample,
  autoBackupData,
  onRestoreAutoBackup,
  onClearAllData,
}: BackupModalProps) {
  if (!isOpen) return null;

  const formattedAutoDate = autoBackupData?.timestamp
    ? new Date(autoBackupData.timestamp).toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[99999] bg-slate-950/40 dark:bg-black/70 backdrop-blur-[3px] flex items-center justify-center p-3.5 sm:p-4 animate-in fade-in duration-100"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#161b22] rounded-2xl max-w-[440px] w-[calc(100vw-32px)] shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden max-h-[88vh] flex flex-col animate-in zoom-in-[0.98] duration-100"
      >
        {/* Header */}
        <div className="px-4.5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0">
              <Upload className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[13px] sm:text-[13.5px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                Sao Lưu & Khôi Phục Dữ Liệu
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-normal truncate mt-0.5">
                Bảo vệ an toàn dữ liệu công việc của bạn
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
          {/* Mục 1: Tự động sao lưu dữ liệu mới của User */}
          <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/60 rounded-xl space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                  <span>Tự động sao lưu an toàn</span>
                </div>
                <p className="text-[11px] text-emerald-800/80 dark:text-emerald-400/80 mt-1 leading-snug">
                  {autoBackupData ? (
                    <>
                      Đã lưu bản sao tự động lúc <span className="font-semibold">{formattedAutoDate}</span> ({autoBackupData.projectCount} danh mục · {autoBackupData.taskCount} việc).
                    </>
                  ) : (
                    <>
                      Hệ thống tự động sao lưu dữ liệu mới của bạn liên tục vào bộ nhớ an toàn (ngoại trừ dữ liệu template mẫu).
                    </>
                  )}
                </p>
              </div>
              {autoBackupData && onRestoreAutoBackup && (
                <button
                  type="button"
                  onClick={onRestoreAutoBackup}
                  className="h-7 px-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-medium rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-2xs active:scale-[0.98] shrink-0"
                  title="Khôi phục lại bản tự động sao lưu gần nhất"
                >
                  <RotateCcw className="w-3 h-3 shrink-0" />
                  <span>Khôi phục bản này</span>
                </button>
              )}
            </div>
          </div>

          {/* Mục 2: Xuất file JSON */}
          <div className="p-3 bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 shrink-0 text-slate-700 dark:text-slate-300" strokeWidth={1.5} aria-hidden="true" />
                <span>Xuất file dữ liệu (.JSON)</span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Lưu file sao lưu về máy để lưu trữ hoặc chuyển sang máy khác
              </p>
            </div>
            <button
              type="button"
              onClick={onExport}
              className="h-7.5 px-3 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-950 text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-xs active:scale-[0.98] shrink-0"
              aria-label="Tải về file dữ liệu sao lưu"
            >
              <Download className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
              <span>Tải file .json</span>
            </button>
          </div>

          {/* Mục 3: Khôi phục từ file JSON */}
          <div className="p-3 bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 shrink-0 text-slate-700 dark:text-slate-300" strokeWidth={1.5} aria-hidden="true" />
                <span>Khôi phục từ file (.JSON)</span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Nhập từ file sao lưu (sẽ yêu cầu xác nhận trước khi áp dụng)
              </p>
            </div>
            <button
              type="button"
              onClick={onTriggerImport}
              className="h-7.5 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs active:scale-[0.98] shrink-0"
              aria-label="Chọn file dữ liệu để khôi phục"
            >
              <Upload className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
              <span>Chọn file...</span>
            </button>
          </div>

          {/* Mục 4: Đặt lại & Xóa toàn bộ */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">Dữ liệu mẫu chuẩn:</span>
              <button
                type="button"
                onClick={onResetSample}
                className="text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 underline cursor-pointer transition-colors"
              >
                Khôi phục dữ liệu mẫu ban đầu
              </button>
            </div>

            {onClearAllData && (
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 dark:text-slate-500">Làm mới hoàn toàn:</span>
                <button
                  type="button"
                  onClick={onClearAllData}
                  className="text-rose-500 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3 h-3 shrink-0" />
                  <span>Xóa toàn bộ dự án & việc</span>
                </button>
              </div>
            )}
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
