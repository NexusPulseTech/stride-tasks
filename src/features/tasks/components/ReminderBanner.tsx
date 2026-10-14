import React from 'react';
import { Bell, X, RotateCcw } from 'lucide-react';
import { useLanguage } from '../../../i18n';

interface ReminderBannerProps {
  banner: {
    visible: boolean;
    pendingCount: number;
    topTaskTitle: string;
    projectId?: string;
    taskId?: string;
  } | null;
  onDismiss: () => void;
  onReviewTask?: (projectId: string, taskId: string) => void;
}

export function ReminderBanner({ banner, onDismiss, onReviewTask }: ReminderBannerProps) {
  const { t, language } = useLanguage();

  if (!banner || !banner.visible) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40 max-w-sm w-[calc(100vw-2.5rem)] bg-white dark:bg-[#161b24] border border-slate-200/90 dark:border-slate-700/80 rounded-xl shadow-lg p-3.5 animate-in slide-in-from-bottom-3 duration-200 flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
        <Bell className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
            {t.reminder.inAppBannerTitle.replace('{count}', String(banner.pendingCount))}
          </h4>
          <button
            type="button"
            onClick={onDismiss}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer shrink-0"
            title={t.common.cancel}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <p
          onClick={() => {
            if (banner.projectId && banner.taskId && onReviewTask) {
              onReviewTask(banner.projectId, banner.taskId);
              onDismiss();
            }
          }}
          className="text-[11.5px] text-slate-700 dark:text-slate-200 truncate mt-0.5 font-medium cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          title="Nhấp để chọn chu kỳ nhắc cấp số nhân (1, 2, 3)"
        >
          "{banner.topTaskTitle}"
        </p>

        <div className="flex items-center justify-between pt-2 gap-2">
          {banner.projectId && banner.taskId && onReviewTask ? (
            <button
              type="button"
              onClick={() => {
                onReviewTask(banner.projectId!, banner.taskId!);
                onDismiss();
              }}
              className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{language === 'vi' ? 'Hoãn cấp số nhân (1-2-3)' : 'Anki Snooze (1-2-3)'}</span>
            </button>
          ) : (
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              Stride Focus Nudge
            </span>
          )}
          <button
            type="button"
            onClick={onDismiss}
            className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
          >
            <span>{t.reminder.dismiss}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
