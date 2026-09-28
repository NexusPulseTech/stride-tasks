import React from 'react';
import { createPortal } from 'react-dom';
import { Smartphone, Check, X, FileCode } from 'lucide-react';
import { MobileGuideTab } from '../../../types';

interface MobileGuideModalProps {
  isOpen: boolean;
  activeTab: MobileGuideTab;
  onTabChange: (tab: MobileGuideTab) => void;
  onClose: () => void;
}

export function MobileGuideModal({
  isOpen,
  activeTab,
  onTabChange,
  onClose,
}: MobileGuideModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[99999] bg-slate-950/40 dark:bg-black/70 backdrop-blur-[3px] flex items-center justify-center p-3.5 sm:p-4 animate-in fade-in duration-100"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#161b22] rounded-2xl max-w-[460px] w-[calc(100vw-32px)] shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden max-h-[85vh] flex flex-col animate-in zoom-in-[0.98] duration-100"
      >
        {/* Header */}
        <div className="px-4.5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0">
              <Smartphone className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[13px] sm:text-[13.5px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                Dùng Trên Điện Thoại
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-normal truncate mt-0.5">
                Cài làm web app toàn màn hình · Chạy offline mượt mà
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

        {/* Segmented Tab Switch */}
        <div className="px-4.5 pt-3">
          <div className="flex bg-slate-100/90 dark:bg-slate-800/80 p-0.5 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => onTabChange('ios')}
              className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer text-center ${
                activeTab === 'ios'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-semibold shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              iPhone / iPad
            </button>
            <button
              type="button"
              onClick={() => onTabChange('android')}
              className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer text-center ${
                activeTab === 'android'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-semibold shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Android
            </button>
            <button
              type="button"
              onClick={() => onTabChange('file')}
              className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer text-center ${
                activeTab === 'file'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-semibold shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              File HTML
            </button>
          </div>
        </div>

        {/* Body Guide */}
        <div className="p-4 sm:p-5 overflow-y-auto overflow-x-hidden text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {activeTab === 'ios' && (
            <div className="space-y-2">
              <div className="flex gap-2.5 items-start">
                <span className="w-4.5 h-4.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center font-semibold text-[10.5px] shrink-0 mt-0.5">
                  1
                </span>
                <p>
                  Mở đường link ứng dụng này trong trình duyệt <strong>Safari</strong> trên iPhone.
                </p>
              </div>
              <div className="flex gap-2.5 items-start">
                <span className="w-4.5 h-4.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center font-semibold text-[10.5px] shrink-0 mt-0.5">
                  2
                </span>
                <p>
                  Chạm vào biểu tượng <strong>Chia sẻ (Share)</strong> ở thanh công cụ dưới cùng.
                </p>
              </div>
              <div className="flex gap-2.5 items-start">
                <span className="w-4.5 h-4.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center font-semibold text-[10.5px] shrink-0 mt-0.5">
                  3
                </span>
                <p>
                  Chọn <strong>&quot;Thêm vào Màn hình chính&quot; (Add to Home Screen)</strong>.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[11px] border border-emerald-100 dark:border-emerald-900/60 flex items-center gap-1.5 mt-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={2.25} aria-hidden="true" />
                <span>
                  Xong! Biểu tượng app sẽ nằm trên màn hình chính, mở toàn màn hình và lưu dữ liệu offline 100%.
                </span>
              </div>
            </div>
          )}

          {activeTab === 'android' && (
            <div className="space-y-2">
              <div className="flex gap-2.5 items-start">
                <span className="w-4.5 h-4.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center font-semibold text-[10.5px] shrink-0 mt-0.5">
                  1
                </span>
                <p>
                  Mở đường dẫn ứng dụng bằng trình duyệt <strong>Chrome</strong> hoặc <strong>Brave</strong>.
                </p>
              </div>
              <div className="flex gap-2.5 items-start">
                <span className="w-4.5 h-4.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center font-semibold text-[10.5px] shrink-0 mt-0.5">
                  2
                </span>
                <p>
                  Chạm biểu tượng <strong>Menu 3 chấm (⋮)</strong> ở góc trên bên phải.
                </p>
              </div>
              <div className="flex gap-2.5 items-start">
                <span className="w-4.5 h-4.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center font-semibold text-[10.5px] shrink-0 mt-0.5">
                  3
                </span>
                <p>
                  Chọn <strong>&quot;Cài đặt ứng dụng&quot;</strong> hoặc <strong>&quot;Thêm vào Màn hình chính&quot;</strong>.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[11px] border border-emerald-100 dark:border-emerald-900/60 flex items-center gap-1.5 mt-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={2.25} aria-hidden="true" />
                <span>
                  Ứng dụng chạy mượt mà như app gốc tải từ CH Play, không cần mạng vẫn dùng bình thường.
                </span>
              </div>
            </div>
          )}

          {activeTab === 'file' && (
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
                <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 shrink-0 text-indigo-500" strokeWidth={1.5} aria-hidden="true" />
                  <span>Dùng offline không cần internet</span>
                </div>
                <p className="text-[11.5px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Bấm nút tải file HTML trên thanh công cụ desktop để tải toàn bộ mã nguồn đóng gói gọn trong 1 file duy nhất. Chép file vào điện thoại hoặc máy tính và mở bằng bất kỳ trình duyệt nào.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4.5 py-2.5 sm:py-3 bg-slate-50/70 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-7.5 px-3.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-950 rounded-lg text-xs font-medium cursor-pointer shadow-xs active:scale-[0.98] transition-all"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
