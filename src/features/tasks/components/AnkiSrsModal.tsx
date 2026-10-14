import React, { useEffect } from 'react';
import {
  RotateCcw,
  X,
  CheckCircle2,
  Clock,
  Pin,
  Layers,
  CalendarCheck,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import {
  AnkiSrsOption,
  getAnkiSrs3Options,
  calculateSnoozeTarget,
  formatSnoozeCountdown,
} from '../utils/spacedSnooze';
import { useLanguage } from '../../../i18n';
import { triggerHaptic } from '../../../utils';

export interface AnkiSrsTargetItem {
  projectId: string;
  projectName?: string;
  taskId: string;
  subId?: string;
  title: string;
  currentLevel?: number;
  snoozeUntil?: string;
  isPinned?: boolean;
  isDone?: boolean;
  isNewTask?: boolean;
  path?: string[];
}

export interface AnkiSrsModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: AnkiSrsTargetItem | null;
  onSelectSrsOption: (
    target: AnkiSrsTargetItem,
    option: AnkiSrsOption,
    targetIso: string | null
  ) => void;
  onMarkTaskDone?: (target: AnkiSrsTargetItem) => void;
}

export function AnkiSrsModal({
  isOpen,
  onClose,
  target,
  onSelectSrsOption,
  onMarkTaskDone,
}: AnkiSrsModalProps) {
  const { language } = useLanguage();

  const currentLevel = target?.currentLevel || 1;
  const options = getAnkiSrs3Options(currentLevel);
  const countdown = formatSnoozeCountdown(target?.snoozeUntil, language);

  // Phím tắt chuẩn Anki SRS: 1, 2, 3 để chọn option, Space/Enter chọn Good (Option 2), Escape để đóng
  useEffect(() => {
    if (!isOpen || !target) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === '1') {
        e.preventDefault();
        handleChoose(options[0]);
      } else if (e.key === '2' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleChoose(options[1]);
      } else if (e.key === '3') {
        e.preventDefault();
        handleChoose(options[2]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, target, options]);

  if (!isOpen || !target) return null;

  const handleChoose = (opt: AnkiSrsOption) => {
    triggerHaptic();
    const targetIso = opt.days > 0 ? calculateSnoozeTarget(opt.days) : null;
    onSelectSrsOption(target, opt, targetIso);
    onClose();
  };

  const handleDone = () => {
    triggerHaptic();
    if (onMarkTaskDone) {
      onMarkTaskDone(target);
    }
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#151921] rounded-2xl max-w-lg w-full border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Thiết kế chuẩn Anki SRS chuyên nghiệp, tinh tế */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/40 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/50 dark:border-blue-900/40">
              <RotateCcw className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-nowrap">
                <h2 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                  {language === 'vi' ? 'Nhắc lặp thông minh (Anki SRS)' : 'Spaced Repetition (Anki SRS)'}
                </h2>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-100/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/40 shrink-0">
                  {language === 'vi' ? `Mức ${currentLevel}` : `Lvl ${currentLevel}`}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                {target.isNewTask
                  ? (language === 'vi' ? 'Thiết lập chu kỳ nhắc cho công việc vừa tạo' : 'Initial review interval for new task')
                  : (language === 'vi' ? 'Mô hình Spaced Repetition (AnkiWeb/SM-2) tối ưu chu kỳ nhắc' : 'Spaced review intervals (Anki model)')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0 transition-colors"
            title="Đóng (Esc)"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Task Info Preview */}
        <div className="px-4 sm:px-5 pt-3 pb-2 space-y-1.5">
          {target.projectName && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {target.projectName}
              </span>
              {target.path && target.path.length > 0 && (
                <span className="text-slate-400 truncate">
                  › {target.path.join(' › ')}
                </span>
              )}
              {target.subId && (
                <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 flex items-center gap-0.5">
                  <Layers className="w-2.5 h-2.5" />
                  <span>Việc con</span>
                </span>
              )}
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 break-words leading-snug">
                {target.title}
              </p>
              {countdown && (
                <div className="mt-1 flex items-center gap-1.5 text-[10.5px]">
                  <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                  <span className="text-amber-700 dark:text-amber-300 font-medium">
                    {countdown.text}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Done button if completed */}
            {onMarkTaskDone && (
              <button
                type="button"
                onClick={handleDone}
                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs shrink-0 cursor-pointer"
                title="Đánh dấu đã hoàn thành việc này"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Đã xong</span>
              </button>
            )}
          </div>
        </div>

        {/* Anki 3-Option Segmented Review Deck (Chuẩn AnkiWeb: Gọn, ngang, phím 1-2-3) */}
        <div className="px-4 sm:px-5 py-2.5 space-y-2 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-0.5">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {language === 'vi'
                ? 'Chọn 1 trong 3 chu kỳ ngắt quãng (Phím 1, 2, 3):'
                : 'Select 1 of 3 spaced intervals (Keys 1, 2, 3):'}
            </span>
            <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400 dark:text-slate-500">
              <kbd className="px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold">1</kbd>
              <kbd className="px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold">2</kbd>
              <kbd className="px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold">3</kbd>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
            {/* Option 1: Again (Làm ngay / Nhắc ngay & Ghim) */}
            <button
              type="button"
              onClick={() => handleChoose(options[0])}
              className="text-left p-2.5 sm:p-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 hover:bg-rose-100/70 hover:border-rose-300 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 transition-all cursor-pointer group shadow-2xs flex flex-col justify-between relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-rose-500/50"
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <span className="px-1.5 py-0.5 rounded-md bg-rose-500 text-white font-mono font-bold text-[10.5px] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                  1
                </span>
                <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-100/80 dark:bg-rose-900/50 px-1.5 py-0.5 rounded border border-rose-200/50">
                  <Pin className="w-2.5 h-2.5 fill-current" />
                  <span>Ghim</span>
                </span>
              </div>
              <div>
                <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 tracking-tight leading-none mb-1 uppercase">
                  {language === 'vi' ? options[0].ankiRatingVi : options[0].ankiRatingEn}
                </div>
                <div className="text-sm font-bold text-rose-950 dark:text-rose-100 leading-snug">
                  {language === 'vi' ? options[0].labelVi : options[0].labelEn}
                </div>
                <div className="text-[10px] text-rose-700/80 dark:text-rose-300/80 mt-1 leading-tight flex items-center gap-1">
                  <RotateCcw className="w-2.5 h-2.5 shrink-0" />
                  <span>{language === 'vi' ? options[0].subLabelVi : options[0].subLabelEn}</span>
                </div>
              </div>
            </button>

            {/* Option 2: Good (Hoãn vừa theo cấp độ) */}
            <button
              type="button"
              onClick={() => handleChoose(options[1])}
              className="text-left p-2.5 sm:p-3 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 hover:bg-blue-100/70 hover:border-blue-300 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 transition-all cursor-pointer group shadow-2xs flex flex-col justify-between relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500/50 ring-1 ring-blue-500/10"
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <span className="px-1.5 py-0.5 rounded-md bg-blue-600 text-white font-mono font-bold text-[10.5px] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                  2
                </span>
                <span className="inline-flex items-center text-[9.5px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-100/80 dark:bg-blue-900/50 px-1.5 py-0.5 rounded border border-blue-200/50">
                  Mức {options[1].nextLevel}
                </span>
              </div>
              <div>
                <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 tracking-tight leading-none mb-1 uppercase">
                  {language === 'vi' ? options[1].ankiRatingVi : options[1].ankiRatingEn}
                </div>
                <div className="text-sm font-bold text-blue-950 dark:text-blue-100 leading-snug">
                  {language === 'vi' ? options[1].labelVi : options[1].labelEn}
                </div>
                <div className="text-[10px] text-blue-700/80 dark:text-blue-300/80 mt-1 leading-tight flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5 shrink-0" />
                  <span>{language === 'vi' ? options[1].subLabelVi : options[1].subLabelEn}</span>
                </div>
              </div>
            </button>

            {/* Option 3: Easy (Dãn cách xa) */}
            <button
              type="button"
              onClick={() => handleChoose(options[2])}
              className="text-left p-2.5 sm:p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 hover:bg-emerald-100/70 hover:border-emerald-300 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 transition-all cursor-pointer group shadow-2xs flex flex-col justify-between relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-600 text-white font-mono font-bold text-[10.5px] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                  3
                </span>
                <span className="inline-flex items-center text-[9.5px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/50 px-1.5 py-0.5 rounded border border-emerald-200/50">
                  Mức {options[2].nextLevel}
                </span>
              </div>
              <div>
                <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 tracking-tight leading-none mb-1 uppercase">
                  {language === 'vi' ? options[2].ankiRatingVi : options[2].ankiRatingEn}
                </div>
                <div className="text-sm font-bold text-emerald-950 dark:text-emerald-100 leading-snug">
                  {language === 'vi' ? options[2].labelVi : options[2].labelEn}
                </div>
                <div className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80 mt-1 leading-tight flex items-center gap-1">
                  <CalendarCheck className="w-2.5 h-2.5 shrink-0" />
                  <span>{language === 'vi' ? options[2].subLabelVi : options[2].subLabelEn}</span>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer info & Dismiss */}
        <div className="px-4 sm:px-5 py-2.5 bg-slate-50/90 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="font-medium text-slate-600 dark:text-slate-300">
              {language === 'vi' ? 'Nhấn 1, 2, 3 hoặc Space (Vừa phải)' : 'Press 1, 2, 3 or Space (Normal)'}
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-400">Esc {language === 'vi' ? 'bỏ qua' : 'skip'}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 bg-slate-200/90 hover:bg-slate-300/90 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs rounded-lg transition-colors cursor-pointer"
          >
            {language === 'vi' ? 'Để sau' : 'Skip / Later'}
          </button>
        </div>
      </div>
    </div>
  );
}
