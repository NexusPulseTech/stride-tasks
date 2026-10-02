import React from 'react';
import { Target } from 'lucide-react';
import { useLanguage } from '../../../i18n';

interface FocusBannerProps {
  isFocusMode: boolean;
  uncompletedCount: number;
  onExitFocusMode: () => void;
}

export function FocusBanner({
  isFocusMode,
  uncompletedCount,
  onExitFocusMode,
}: FocusBannerProps) {
  const { t, language } = useLanguage();

  if (!isFocusMode) return null;

  return (
    <div className="bg-white dark:bg-[#161b22] border border-slate-200/90 dark:border-slate-800 rounded-xl p-3 sm:p-3.5 shadow-2xs flex items-center justify-between gap-3 animate-in fade-in duration-200">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 flex items-center justify-center shrink-0 font-medium shadow-2xs">
          <Target className="w-4 h-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
            <span>{t.header.focusing}</span>
            <span className="text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md tabular-nums font-mono">
              {uncompletedCount} {language === 'vi' ? 'việc dở dang' : 'tasks left'}
            </span>
          </div>
          <p className="text-[11.5px] text-slate-500 dark:text-slate-400 truncate">
            {language === 'vi'
              ? 'Đã ẩn việc đã xong · Tập trung giải quyết công việc cốt lõi'
              : 'Hidden completed tasks · Focusing solely on open priorities'}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onExitFocusMode}
        className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-medium shrink-0 cursor-pointer shadow-2xs transition-colors flex items-center gap-1.5"
        title="Esc / F"
        aria-label="Exit Focus"
      >
        <span>{language === 'vi' ? 'Thoát' : 'Exit'}</span>
        <kbd className="hidden sm:inline text-[9px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-1 py-0.5 rounded font-mono">
          Esc
        </kbd>
      </button>
    </div>
  );
}
