import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar,
  Clock,
  Check,
  X,
  Trash2,
  CalendarCheck,
  ChevronRight,
  Sun,
  Sunset,
  Moon,
  Zap,
  RotateCcw,
  Pin,
} from 'lucide-react';
import { Task, Project } from '../../../types';
import {
  generateSchedulePresets,
  analyzeWorkload,
  toDateInputValue,
  toTimeInputValue,
  formatScheduleBadge,
} from '../utils/scheduleHelper';
import {
  AnkiSrsOption,
  getAnkiSrs3Options,
  calculateSnoozeTarget,
  formatSnoozeCountdown,
} from '../utils/spacedSnooze';
import { useLanguage } from '../../../i18n';
import { triggerHaptic } from '../../../utils';

interface SmartScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  projectName?: string;
  allProjects?: Project[];
  onSaveSchedule: (schedule: { reminderAt?: string | null; deadline?: string | null }) => void;
  onSelectAnkiSrs?: (option: AnkiSrsOption, targetIso: string | null) => void;
}

export function SmartScheduleModal({
  isOpen,
  onClose,
  task,
  projectName,
  allProjects = [],
  onSaveSchedule,
  onSelectAnkiSrs,
}: SmartScheduleModalProps) {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');

  const currentLevel = task?.snoozeLevel || 1;
  const ankiOptions = useMemo(() => getAnkiSrs3Options(currentLevel), [currentLevel]);
  const snoozeCountdown = useMemo(
    () => formatSnoozeCountdown(task?.snoozeUntil, language),
    [task?.snoozeUntil, language]
  );

  // Custom date & time state
  const [customDate, setCustomDate] = useState(() => {
    if (task?.reminderAt) {
      return toDateInputValue(new Date(task.reminderAt));
    }
    return toDateInputValue(new Date());
  });

  const [customTime, setCustomTime] = useState(() => {
    if (task?.reminderAt && task.reminderAt.includes('T')) {
      return toTimeInputValue(new Date(task.reminderAt));
    }
    return '09:00';
  });

  const [enableDeadline, setEnableDeadline] = useState(Boolean(task?.deadline));

  useEffect(() => {
    if (!isOpen || !task) return;
    if (task.reminderAt) {
      const d = new Date(task.reminderAt);
      if (!isNaN(d.getTime())) {
        setCustomDate(toDateInputValue(d));
        if (task.reminderAt.includes('T')) {
          setCustomTime(toTimeInputValue(d));
        }
      }
    } else {
      setCustomDate(toDateInputValue(new Date()));
      setCustomTime('09:00');
    }
    setEnableDeadline(Boolean(task.deadline));
  }, [isOpen, task]);

  const handleChooseAnkiOption = (opt: AnkiSrsOption) => {
    triggerHaptic();
    const targetIso = opt.days > 0 ? calculateSnoozeTarget(opt.days) : null;
    if (onSelectAnkiSrs) {
      onSelectAnkiSrs(opt, targetIso);
    } else {
      onSaveSchedule({
        reminderAt: targetIso,
        deadline: enableDeadline && targetIso ? targetIso.split('T')[0] : undefined,
      });
    }
    onClose();
  };

  // Phím tắt chuẩn AnkiWeb: 1, 2, 3 chọn nhanh cấp số nhân, Esc để đóng
  useEffect(() => {
    if (!isOpen || !task) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (activeTab === 'presets') {
        if (e.key === '1') {
          e.preventDefault();
          handleChooseAnkiOption(ankiOptions[0]);
        } else if (e.key === '2') {
          e.preventDefault();
          handleChooseAnkiOption(ankiOptions[1]);
        } else if (e.key === '3') {
          e.preventDefault();
          handleChooseAnkiOption(ankiOptions[2]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, task, activeTab, ankiOptions]);

  const presets = useMemo(() => generateSchedulePresets(new Date(), language), [language]);
  const workload = useMemo(() => analyzeWorkload(allProjects, new Date(), language), [allProjects, language]);

  if (!isOpen || !task) return null;

  const currentSchedule = formatScheduleBadge(task.reminderAt, task.deadline, new Date(), language);

  const handleApplyPreset = (isoString: string) => {
    onSaveSchedule({
      reminderAt: isoString,
      deadline: enableDeadline ? isoString.split('T')[0] : undefined,
    });
    onClose();
  };

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDate) return;

    // Ghép ngày & giờ theo chuẩn ISO local
    const [year, month, day] = customDate.split('-').map(Number);
    const [hours, minutes] = customTime.split(':').map(Number);
    const scheduledDate = new Date(year, month - 1, day, hours || 9, minutes || 0, 0);

    onSaveSchedule({
      reminderAt: scheduledDate.toISOString(),
      deadline: enableDeadline ? customDate : undefined,
    });
    onClose();
  };

  const handleClearSchedule = () => {
    onSaveSchedule({
      reminderAt: null,
      deadline: null,
    });
    onClose();
  };

  const getPresetIcon = (presetId: string) => {
    if (presetId.includes('morning')) return <Sun className="w-4 h-4 text-amber-500" strokeWidth={1.5} />;
    if (presetId.includes('afternoon')) return <Sunset className="w-4 h-4 text-orange-500" strokeWidth={1.5} />;
    if (presetId.includes('evening')) return <Moon className="w-4 h-4 text-indigo-500" strokeWidth={1.5} />;
    if (presetId.includes('hour')) return <Zap className="w-4 h-4 text-emerald-500" strokeWidth={1.5} />;
    return <Calendar className="w-4 h-4 text-slate-500" strokeWidth={1.5} />;
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.schedule.modalTitle}
      onClick={onClose}
      className="fixed inset-0 z-[99999] bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg bg-white dark:bg-[#161b22] border-t sm:border border-slate-200/90 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] sm:max-h-[85vh] animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200"
      >
        {/* Mobile Drag Indicator Bar */}
        <div className="w-full pt-3 pb-1 flex justify-center sm:hidden shrink-0">
          <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-[#12161f]/80 shrink-0 min-h-[52px]">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/60 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400">
              <CalendarCheck className="w-4 h-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-nowrap">
                <h2 className="text-[13.5px] sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {t.schedule.modalTitle}
                </h2>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-100/80 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/40 shrink-0">
                  {language === 'vi' ? `Anki Mức ${currentLevel}` : `Anki Lvl ${currentLevel}`}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {projectName ? `${projectName} · ` : ''}{task.title}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title={`${t.common.close} (Esc)`}
            aria-label={t.common.close}
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Current Scheduled or Snoozed Status Indicator */}
        {(currentSchedule.status !== 'none' || snoozeCountdown) && (
          <div className="px-5 py-2 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs shrink-0">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 min-w-0 truncate">
              <Clock className="w-3.5 h-3.5 shrink-0 text-slate-400" strokeWidth={1.5} />
              <span className="truncate">
                {snoozeCountdown ? (
                  <>
                    {language === 'vi' ? 'Chu kỳ Anki SRS:' : 'Anki SRS:'}{' '}
                    <strong className="text-amber-600 dark:text-amber-400">{snoozeCountdown.text}</strong>
                  </>
                ) : (
                  <>
                    {t.schedule.currentlyScheduled}{' '}
                    <strong
                      className={
                        currentSchedule.isOverdue
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }
                    >
                      {currentSchedule.label}
                    </strong>
                  </>
                )}
              </span>
            </div>
            <button
              type="button"
              onClick={handleClearSchedule}
              className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline cursor-pointer flex items-center gap-1 shrink-0"
            >
              <Trash2 className="w-3 h-3" strokeWidth={1.5} />
              <span>{t.schedule.clearSchedule}</span>
            </button>
          </div>
        )}

        {/* Segmented Control Tabs */}
        <div className="px-4 pt-3 pb-1 shrink-0">
          <div className="p-1 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer text-center ${
                activeTab === 'presets'
                  ? 'bg-white dark:bg-[#161b22] text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {t.schedule.tabPresets}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('custom')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer text-center ${
                activeTab === 'custom'
                  ? 'bg-white dark:bg-[#161b22] text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              {t.schedule.tabCustom}
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'presets' ? (
            <div className="space-y-3.5">
              {/* ANKIWEB EXPONENTIAL SPACED REPETITION (KEYS 1, 2, 3) */}
              <div className="p-3 rounded-xl bg-slate-50/90 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" strokeWidth={2} />
                    <span>
                      {language === 'vi'
                        ? 'Nhắc lặp cấp số nhân AnkiWeb (Phím 1, 2, 3):'
                        : 'Select 1 of 3 spaced intervals (Keys 1, 2, 3):'}
                    </span>
                  </span>
                  <div className="flex items-center gap-1 font-mono text-[10px] shrink-0">
                    <kbd className="px-1 py-0.2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold">1</kbd>
                    <kbd className="px-1 py-0.2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold">2</kbd>
                    <kbd className="px-1 py-0.2 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold">3</kbd>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  {/* Option 1: Again */}
                  <button
                    type="button"
                    onClick={() => handleChooseAnkiOption(ankiOptions[0])}
                    className="p-2 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 hover:bg-rose-100/80 dark:bg-rose-950/25 dark:hover:bg-rose-950/45 text-left transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="w-4 h-4 rounded bg-rose-500 text-white font-mono font-bold text-[10px] flex items-center justify-center">
                        1
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-rose-700 dark:text-rose-300">
                        <Pin className="w-2.5 h-2.5 fill-current" />
                        <span>Mức 1</span>
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-rose-950 dark:text-rose-100 truncate">
                      {language === 'vi' ? 'Làm ngay' : 'Again (Now)'}
                    </div>
                    <div className="text-[9.5px] text-rose-700/80 dark:text-rose-300/80 truncate">
                      {language === 'vi' ? 'Reset & Ghim đầu' : 'Reset & Pin'}
                    </div>
                  </button>

                  {/* Option 2: Good (Exponential x2.3) */}
                  <button
                    type="button"
                    onClick={() => handleChooseAnkiOption(ankiOptions[1])}
                    className="p-2 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 hover:bg-blue-100/80 dark:bg-blue-950/25 dark:hover:bg-blue-950/45 text-left transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="w-4 h-4 rounded bg-blue-600 text-white font-mono font-bold text-[10px] flex items-center justify-center">
                        2
                      </span>
                      <span className="text-[9px] font-mono font-semibold text-blue-700 dark:text-blue-300">
                        Mức {ankiOptions[1].nextLevel}
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-blue-950 dark:text-blue-100 truncate">
                      {language === 'vi' ? ankiOptions[1].intervalTagVi : ankiOptions[1].intervalTagEn}
                    </div>
                    <div className="text-[9.5px] text-blue-700/80 dark:text-blue-300/80 truncate">
                      {language === 'vi' ? 'Chuẩn cấp số nhân' : 'Good (×2.3)'}
                    </div>
                  </button>

                  {/* Option 3: Easy (Skip 2 levels) */}
                  <button
                    type="button"
                    onClick={() => handleChooseAnkiOption(ankiOptions[2])}
                    className="p-2 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/70 hover:bg-emerald-100/80 dark:bg-emerald-950/25 dark:hover:bg-emerald-950/45 text-left transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="w-4 h-4 rounded bg-emerald-600 text-white font-mono font-bold text-[10px] flex items-center justify-center">
                        3
                      </span>
                      <span className="text-[9px] font-mono font-semibold text-emerald-700 dark:text-emerald-300">
                        Mức {ankiOptions[2].nextLevel}
                      </span>
                    </div>
                    <div className="text-[11px] font-bold text-emerald-950 dark:text-emerald-100 truncate">
                      {language === 'vi' ? ankiOptions[2].intervalTagVi : ankiOptions[2].intervalTagEn}
                    </div>
                    <div className="text-[9.5px] text-emerald-700/80 dark:text-emerald-300/80 truncate">
                      {language === 'vi' ? 'Dãn xa vượt cấp' : 'Easy Bonus'}
                    </div>
                  </button>
                </div>
              </div>

              {/* Grid presets với touch target tối thiểu 44px trên mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {presets.map((preset) => {
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      disabled={preset.isPast}
                      onClick={() => handleApplyPreset(preset.isoString)}
                      className={`h-11 sm:h-12 px-3.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                        preset.isPast
                          ? 'opacity-40 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 cursor-not-allowed'
                          : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#161b22] hover:border-amber-400 dark:hover:border-amber-600 hover:bg-amber-50/30 dark:hover:bg-amber-950/20 cursor-pointer shadow-2xs active:scale-[0.98]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="shrink-0">{getPresetIcon(preset.id)}</div>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block truncate">
                            {preset.label}
                          </span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono block">
                            {preset.sublabel}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" strokeWidth={1.5} />
                    </button>
                  );
                })}
              </div>

              {/* Tùy chọn chốt Hạn chót (Deadline) đi kèm */}
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={enableDeadline}
                  onChange={(e) => setEnableDeadline(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <span>{t.schedule.deadlineCheckbox}</span>
              </label>
            </div>
          ) : (
            <form onSubmit={handleSaveCustom} className="space-y-4">
              {/* Chọn Ngày */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.schedule.selectDate}</span>
                </label>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-500 font-mono cursor-pointer"
                  required
                />
              </div>

              {/* Chọn Giờ */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{t.schedule.selectTime}</span>
                </label>

                {/* Quick time slots buttons */}
                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  {[
                    { label: '09:00', text: t.schedule.morning },
                    { label: '14:00', text: t.schedule.afternoon },
                    { label: '17:00', text: t.schedule.endOfDay },
                    { label: '20:00', text: t.schedule.evening },
                  ].map((slot) => (
                    <button
                      key={slot.label}
                      type="button"
                      onClick={() => setCustomTime(slot.label)}
                      className={`h-9 rounded-lg border text-xs font-mono transition-colors cursor-pointer ${
                        customTime === slot.label
                          ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-700 dark:text-amber-300 font-semibold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>

                <input
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="w-full h-11 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-amber-500 font-mono cursor-pointer"
                  required
                />
              </div>

              {/* Tùy chọn Deadline */}
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={enableDeadline}
                  onChange={(e) => setEnableDeadline(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <span>{t.schedule.deadlineCheckbox}</span>
              </label>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full h-11 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm"
                >
                  <Check className="w-4 h-4" strokeWidth={2} />
                  <span>{t.schedule.apply}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3 bg-slate-50/80 dark:bg-[#12161f]/90 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          {currentSchedule.status !== 'none' ? (
            <button
              type="button"
              onClick={handleClearSchedule}
              className="h-9 px-3 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.schedule.removeSchedule}</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              {t.schedule.footerHint}
            </span>
          )}

          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            {t.schedule.close}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
