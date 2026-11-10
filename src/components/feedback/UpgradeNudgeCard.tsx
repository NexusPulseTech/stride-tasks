import React from 'react';
import { Heart } from 'lucide-react';
import { useLanguage, formatMessage } from '../../i18n';

interface UpgradeNudgeCardProps {
  completions: number;
  price: string;
  hasSync: boolean;
  onSeePlans: () => void;
  onDismiss: () => void;
  onOptOut: () => void;
}

/** Thẻ cảm ơn kèm lời mời PRO, chỉ hiện khi upgradeNudge cho phép (A13). Luôn có "Để sau" và "Không hiện lại". */
export function UpgradeNudgeCard({ completions, price, hasSync, onSeePlans, onDismiss, onOptOut }: UpgradeNudgeCardProps) {
  const { t } = useLanguage();
  const n = t.nudge;

  return (
    <section
      aria-label={n.title}
      className="bg-white dark:bg-[#161b22] rounded-xl border border-slate-200/80 dark:border-slate-800 p-3.5 sm:p-4 text-xs shadow-2xs"
    >
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
          <Heart className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="text-[12.5px] font-semibold text-slate-900 dark:text-slate-100">{n.title}</h2>
          <p className="leading-relaxed text-slate-600 dark:text-slate-300">
            {formatMessage(hasSync ? n.body : n.bodyNoSync, { count: completions, price })}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1.5">
            <button
              type="button"
              onClick={onSeePlans}
              className="h-7 px-3 rounded-lg bg-[#B20015] hover:bg-[#9C0012] text-white font-semibold cursor-pointer transition-colors"
            >
              {t.store.seePlans}
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="h-7 px-2 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            >
              {t.store.notNow}
            </button>
            <button
              type="button"
              onClick={onOptOut}
              className="text-[11px] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 underline underline-offset-2 cursor-pointer"
            >
              {n.dontShow}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
