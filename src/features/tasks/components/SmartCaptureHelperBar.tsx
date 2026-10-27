import React from 'react';
import { parseSmartTaskInput, hasParsedMetadata } from '../utils/smartTaskParser';
import { useLanguage, formatMessage, Translations } from '../../../i18n';

interface SmartCaptureHelperBarProps {
  value: string;
  onChange: (nextValue: string) => void;
  compact?: boolean;
}

type TokenCategory = 'time' | 'pin' | 'status' | 'schedule' | 'recurrence';

interface QuickTokenOption {
  token: string;
  hintKey: keyof Pick<
    Translations['smartCapture'],
    'hint15' | 'hint30' | 'hint60' | 'hintPin' | 'hintDoing' | 'hintToday' | 'hintDaily'
  >;
  category: TokenCategory;
}

const QUICK_TOKEN_OPTIONS: QuickTokenOption[] = [
  { token: '~15m', hintKey: 'hint15', category: 'time' },
  { token: '~30m', hintKey: 'hint30', category: 'time' },
  { token: '~1h', hintKey: 'hint60', category: 'time' },
  { token: '!pin', hintKey: 'hintPin', category: 'pin' },
  { token: '#doing', hintKey: 'hintDoing', category: 'status' },
  { token: '@today', hintKey: 'hintToday', category: 'schedule' },
  { token: '@daily', hintKey: 'hintDaily', category: 'recurrence' },
];

// Cùng ranh giới token Unicode với smartTaskParser (JS `\b` không hiểu ký tự có dấu)
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const tokenRegex = (token: string) => new RegExp(`(^|\\s)${escapeRegex(token)}(?=\\s|$)`, 'iu');
const CATEGORY_CLEANERS: Partial<Record<TokenCategory, RegExp>> = {
  time: /(^|\s)~\d+(?:[.,]\d+)?\s?(?:giờ|gio|g|hrs|hr|h|phút|phut|ph|p|mins|min|m)(?=\s|$)/giu,
  status: /(^|\s)#(?:todo|backlog|doing|danglam|wip|review|cho|done|xong)(?=\s|$)/giu,
  schedule: /(^|\s)@(?:today|homnay|tomorrow|ngaymai)(?=\s|$)/giu,
  recurrence: /(^|\s)@(?:daily|hangngay|weekdays|ngaythuong|weekly|hangtuan)(?=\s|$)/giu,
};

export const SmartCaptureHelperBar: React.FC<SmartCaptureHelperBarProps> = ({ value, onChange, compact = false }) => {
  const { t, language } = useLanguage();
  const sc = t.smartCapture;
  const parsed = parseSmartTaskInput(value);
  const showPreview = hasParsedMetadata(parsed);

  const handleToggleToken = (option: QuickTokenOption) => {
    const trimmed = value.trimEnd();
    const regex = tokenRegex(option.token);

    if (regex.test(trimmed)) {
      onChange(trimmed.replace(regex, ' ').replace(/\s{2,}/g, ' ').trimStart());
      return;
    }

    let cleaned = trimmed;
    const cleaner = CATEGORY_CLEANERS[option.category];
    if (cleaner) cleaned = cleaned.replace(cleaner, ' ');
    cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();
    onChange(cleaned ? `${cleaned} ${option.token} ` : `${option.token} `);
  };

  const statusLabels: Record<string, string> = {
    todo: sc.statusTodo,
    doing: sc.statusDoing,
    review: sc.statusReview,
    done: sc.statusDone,
  };

  const recurrenceLabels: Record<string, string> = {
    daily: sc.recurrenceDaily,
    weekdays: sc.recurrenceWeekdays,
    weekly: sc.recurrenceWeekly,
  };

  const formatReminder = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });
  };

  return (
    <div
      className={`flex flex-col gap-1.5 rounded-lg border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/90 dark:bg-slate-900/70 px-2.5 py-1.5 transition-all ${
        compact ? 'text-[10px]' : 'text-[11px]'
      }`}
    >
      {/* Chip gắn token 1 chạm */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1 select-none">
          {sc.quickTags}
        </span>
        {QUICK_TOKEN_OPTIONS.map((opt) => {
          const isActive = tokenRegex(opt.token).test(value);
          return (
            <button
              key={opt.token}
              type="button"
              onMouseDown={(e) => {
                // Giữ focus trong ô nhập khi bấm chip
                e.preventDefault();
                handleToggleToken(opt);
              }}
              title={sc[opt.hintKey]}
              aria-pressed={isActive}
              className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold transition-colors cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-400 dark:hover:border-indigo-500/60 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              + {opt.token}
            </button>
          );
        })}
      </div>

      {/* Xem trước kết quả phân tích */}
      {showPreview && (
        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-200/60 dark:border-slate-800/70 text-[10px] text-slate-600 dark:text-slate-300">
          <span className="font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">{sc.recognized}</span>
          {parsed.cleanTitle ? (
            <span className="font-medium text-slate-800 dark:text-slate-100 truncate max-w-[200px]">“{parsed.cleanTitle}”</span>
          ) : (
            <span className="font-semibold text-rose-600 dark:text-rose-400">⚠ {sc.emptyTitleWarning}</span>
          )}
          {parsed.estimatedMinutes !== undefined && (
            <span className="font-mono tabular-nums font-semibold text-indigo-600 dark:text-indigo-400">
              · {formatMessage(sc.estimate, { minutes: parsed.estimatedMinutes })}
            </span>
          )}
          {parsed.isPinned && <span className="font-semibold text-amber-600 dark:text-amber-400">· {sc.pinned}</span>}
          {parsed.status && (
            <span className="font-semibold text-sky-600 dark:text-sky-400">· ⚡ {statusLabels[parsed.status] || parsed.status}</span>
          )}
          {parsed.reminderAt && (
            <span className="font-mono tabular-nums text-violet-600 dark:text-violet-400">
              · {formatMessage(sc.reminder, { date: formatReminder(parsed.reminderAt) })}
            </span>
          )}
          {parsed.recurrence && (
            <span className="font-semibold text-teal-600 dark:text-teal-400">
              · ↻ {recurrenceLabels[parsed.recurrence] || parsed.recurrence}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
