import React from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle, X } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GuideModal({ isOpen, onClose }: GuideModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[99999] bg-slate-950/40 dark:bg-black/70 backdrop-blur-[3px] flex items-center justify-center p-3.5 sm:p-4 animate-in fade-in duration-100"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#161b22] rounded-2xl max-w-[480px] w-[calc(100vw-32px)] shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden max-h-[85vh] flex flex-col animate-in zoom-in-[0.98] duration-100"
      >
        {/* Header */}
        <div className="px-4.5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0">
              <HelpCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[13px] sm:text-[13.5px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                Cách Dùng & Cơ Chế Phân Cấp Thông Minh
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-normal truncate mt-0.5">
                Tối giản · Chạy offline 100% · Tự động hoàn thành theo cấp bậc
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
        <div className="p-4 sm:p-5 space-y-2.5 overflow-y-auto overflow-x-hidden text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <div className="p-3 bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 rounded-xl space-y-1">
            <div className="font-semibold text-slate-900 dark:text-slate-100 text-[12px] flex items-center gap-1.5">
              <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">01.</span>
              <span>Việc con lồng nhau & Tự động hoàn thành (Cascade & Rollup)</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              Mỗi bước con có thể chứa các bước con cấp 2, cấp 3 lồng nhau không giới hạn.
            </p>
            <ul className="list-disc pl-4 space-y-0.5 text-[11.5px] text-slate-500 dark:text-slate-400 pt-0.5">
              <li>
                <strong>Bọt khí nổi (Bubble up)</strong>: Khi tick xong toàn bộ bước con ở tầng trong cùng, bước cha tự động chuyển sang hoàn thành. Khi xong hết các bước, Task gốc tự động chuyển sang <strong>&quot;Xong&quot;</strong> và tính chuỗi Streak!
              </li>
              <li>
                <strong>Thác đổ (Cascade down)</strong>: Khi bạn tick chọn việc cha, toàn bộ các việc con/cháu bên trong tự động hoàn thành theo.
              </li>
              <li>
                <strong>Tạo việc con nhanh</strong>: Di chuột vào bước bất kỳ và bấm biểu tượng <strong>(+)</strong> để mở ô nhập trực tiếp bước con cho nhánh đó. Bấm mũi tên <strong>(&gt;)</strong> để gập/mở nhánh việc.
              </li>
            </ul>
          </div>

          <div className="p-3 bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 rounded-xl space-y-1">
            <div className="font-semibold text-slate-900 dark:text-slate-100 text-[12px] flex items-center gap-1.5">
              <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">02.</span>
              <span>Chạy trên bất kỳ máy nào (100% Offline)</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              Tải file{' '}
              <code className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-800 dark:text-slate-200">
                quan-ly-cong-viec.html
              </code>{' '}
              nặng chỉ vài chục KB. Cất ở USB hay Desktop (Windows, Mac, Linux), nhấp đúp chuột là mở lên dùng ngay mà không cần cài đặt phần mềm nào.
            </p>
          </div>

          <div className="p-3 bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 rounded-xl space-y-1">
            <div className="font-semibold text-slate-900 dark:text-slate-100 text-[12px] flex items-center gap-1.5">
              <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">03.</span>
              <span>Dữ liệu lưu ở đâu?</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300">
              Dữ liệu được lưu trong bộ nhớ máy (LocalStorage) của trình duyệt. Bạn có thể bấm nút <strong>Sao lưu dữ liệu</strong> ở thanh trên để tải file JSON cất giữ hoặc chuyển sang máy khác.
            </p>
          </div>

          <div className="p-3 bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 rounded-xl space-y-1">
            <div className="font-semibold text-slate-900 dark:text-slate-100 text-[12px] flex items-center gap-1.5">
              <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">04.</span>
              <span>Phím tắt năng suất cao (Power User)</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1">
              <div>
                <kbd className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-mono text-[10px]">
                  /
                </kbd>{' '}
                Tìm kiếm việc
              </div>
              <div>
                <kbd className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-mono text-[10px]">
                  F
                </kbd>{' '}
                Bật/tắt Tập trung
              </div>
              <div>
                <kbd className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-mono text-[10px]">
                  D
                </kbd>{' '}
                Đổi giao diện Sáng/Tối
              </div>
              <div>
                <kbd className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-mono text-[10px]">
                  Ctrl + Z
                </kbd>{' '}
                Hoàn tác việc xóa
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4.5 py-2.5 sm:py-3 bg-slate-50/70 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end shrink-0">
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
