import React from 'react';
import { Repeat, RotateCw, Check } from 'lucide-react';
import { RecurrenceType } from '../../../types';
import { useLanguage, formatMessage } from '../../../i18n';

interface RecurrenceBadgeProps {
  recurrence?: RecurrenceType;
  recurrenceStreak?: number;
  isDone?: boolean;
  onReset?: () => void;
  className?: string;
}

export function RecurrenceBadge({
  recurrence,
  recurrenceStreak,
  isDone,
  onReset,
  className = '',
}: RecurrenceBadgeProps) {
  const { t } = useLanguage();
  const r = t.taskRow;
  if (!recurrence) return null;

  const cadenceLabel =
    recurrence === 'daily'
      ? r.daily
      : recurrence === 'weekdays'
      ? r.weekdays
      : r.weekly;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10.5px] px-2 py-0.5 rounded-md font-medium shrink-0 whitespace-nowrap transition-colors border select-none ${
        isDone
          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800/60'
          : 'bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/80'
      } ${className}`}
      title={`${formatMessage(r.repeatsTitle, { cadence: cadenceLabel })}${recurrenceStreak ? formatMessage(r.streakSuffix, { count: recurrenceStreak }) : ''}`}
    >
      <Repeat className="w-3 h-3 shrink-0 text-slate-500 dark:text-slate-400" strokeWidth={1.75} />
      <span>{cadenceLabel}</span>

      {/* Streak counter: phong cách chuyên nghiệp (Linear / Things 3), không icon lửa */}
      {recurrenceStreak && recurrenceStreak > 0 ? (
        <span
          className="inline-flex items-center px-1.5 py-0.2 rounded font-mono text-[9.5px] font-semibold tabular-nums bg-slate-200/80 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300/60 dark:border-slate-600/60"
          title={formatMessage(r.streakTitle, { count: recurrenceStreak })}
        >
          {recurrenceStreak}d
        </span>
      ) : null}

      {/* Nút làm mới lại việc lặp lại khi đã xong trong ngày */}
      {isDone && onReset && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onReset();
          }}
          className="ml-1 text-[9.5px] text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 hover:underline inline-flex items-center gap-0.5 cursor-pointer font-medium"
          title={r.redoTitle}
        >
          <RotateCw className="w-2.5 h-2.5 shrink-0" />
          <span>{r.redo}</span>
        </button>
      )}
    </span>
  );
}
