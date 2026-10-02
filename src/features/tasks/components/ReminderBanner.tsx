import React from 'react';
import { Bell, X, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../../i18n';

interface ReminderBannerProps {
  banner: {
    visible: boolean;
    pendingCount: number;
    topTaskTitle: string;
  } | null;
  onDismiss: () => void;
}

export function ReminderBanner({ banner, onDismiss }: ReminderBannerProps) {
  const { t } = useLanguage();

  if (!banner || !banner.visible) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40 max-w-sm w-[calc(100vw-2.5rem)] bg-white dark:bg-[#161b24] border border-slate-200/90 dark:border-slate-700/80 rounded-xl shadow-lg p-3.5 animate-in slide-in-from-bottom-3 duration-200 flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
        <Bell className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
            {t.reminder.inAppBannerTitle.replace('{count}', String(banner.pendingCount))}
          </h4>
          <button
            type="button"
            onClick={onDismiss}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
            title={t.common.cancel}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-[11.5px] text-slate-600 dark:text-slate-300 truncate mt-0.5 font-medium">
          "{banner.topTaskTitle}"
        </p>

        <div className="flex items-center justify-between pt-2">
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            Stride Focus Nudge
          </span>
          <button
            type="button"
            onClick={onDismiss}
            className="text-[11px] font-medium text-slate-800 dark:text-slate-200 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{t.reminder.dismiss}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
