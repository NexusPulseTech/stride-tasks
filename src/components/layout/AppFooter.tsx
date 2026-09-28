import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { ThemeMode } from '../../hooks';

interface AppFooterProps {
  onOpenMobileGuide: () => void;
  onOpenGuide: () => void;
  onOpenBackup: () => void;
  onOpenFeedback: () => void;
  themeMode: ThemeMode;
  onSetThemeMode: (mode: ThemeMode) => void;
}

export function AppFooter({
  onOpenMobileGuide,
  onOpenGuide,
  onOpenBackup,
  onOpenFeedback,
  themeMode,
  onSetThemeMode,
}: AppFooterProps) {
  return (
    <footer className="text-center text-[11px] text-slate-400 dark:text-slate-500 pt-6 pb-4 space-y-2.5">
      <p>Tối giản như checklist · Tự động lưu trực tiếp trên máy của bạn (localStorage)</p>
      
      {/* Quick Theme Switcher in Footer */}
      <div className="flex items-center justify-center gap-1 text-[11px] pt-0.5">
        <span className="text-slate-400 dark:text-slate-500 mr-1 select-none">Giao diện:</span>
        <div className="inline-flex items-center bg-slate-200/60 dark:bg-slate-800/80 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => onSetThemeMode('system')}
            className={`px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer transition-all ${
              themeMode === 'system'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-medium shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            title="Tự động thay đổi theo hệ điều hành (OS)"
            aria-label="Giao diện theo hệ thống"
          >
            <Monitor className="w-3 h-3 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            <span>Hệ thống</span>
          </button>
          <button
            type="button"
            onClick={() => onSetThemeMode('light')}
            className={`px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer transition-all ${
              themeMode === 'light'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-medium shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            title="Giao diện Sáng (Light)"
            aria-label="Giao diện sáng"
          >
            <Sun className="w-3 h-3 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            <span>Sáng</span>
          </button>
          <button
            type="button"
            onClick={() => onSetThemeMode('dark')}
            className={`px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer transition-all ${
              themeMode === 'dark'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-medium shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            title="Giao diện Tối (Dark)"
            aria-label="Giao diện tối"
          >
            <Moon className="w-3 h-3 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            <span>Tối</span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 pt-1 text-slate-500 dark:text-slate-400 flex-wrap">
        <button
          type="button"
          onClick={onOpenMobileGuide}
          className="hover:underline hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
        >
          Dùng trên điện thoại (PWA)
        </button>
        <span aria-hidden="true">·</span>
        <button
          type="button"
          onClick={onOpenGuide}
          className="hover:underline hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
        >
          Hướng dẫn offline
        </button>
        <span aria-hidden="true">·</span>
        <button
          type="button"
          onClick={onOpenBackup}
          className="hover:underline hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
        >
          Sao lưu dữ liệu
        </button>
        <span aria-hidden="true">·</span>
        <button
          type="button"
          onClick={onOpenFeedback}
          className="hover:underline hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
        >
          Góp ý & Báo lỗi
        </button>
      </div>
    </footer>
  );
}
