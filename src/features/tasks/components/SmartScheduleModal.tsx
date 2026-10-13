import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar,
  Clock,
  Sparkles,
  Check,
  X,
  Trash2,
  CalendarCheck,
  ChevronRight,
  Sun,
  Sunset,
  Moon,
  Zap,
} from 'lucide-react';
import { Task, Project } from '../../../types';
import {
  generateSchedulePresets,
  analyzeWorkload,
  toDateInputValue,
  toTimeInputValue,
  formatScheduleBadge,
} from '../utils/scheduleHelper';
import { useLanguage } from '../../../i18n';

interface SmartScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  projectName?: string;
  allProjects?: Project[];
  onSaveSchedule: (schedule: { reminderAt?: string | null; deadline?: string | null }) => void;
}

export function SmartScheduleModal({
  isOpen,
  onClose,
  task,
  projectName,
  allProjects = [],
  onSaveSchedule,
}: SmartScheduleModalProps) {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');

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

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
              <h2 className="text-[13.5px] sm:text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                {t.schedule.modalTitle}
              </h2>
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

        {/* Current Scheduled Status Indicator (if already set) */}
        {currentSchedule.status !== 'none' && (
          <div className="px-5 py-2 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs shrink-0">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 min-w-0 truncate">
              <Clock className="w-3.5 h-3.5 shrink-0 text-slate-400" strokeWidth={1.5} />
              <span className="truncate">
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

        {/* Workload Insight & Smart Assistant Bar */}
        <div className="p-3.5 mx-4 mt-3 bg-blue-50/60 dark:bg-blue-950/25 border border-blue-200/60 dark:border-blue-900/40 rounded-xl text-xs text-blue-900 dark:text-blue-300 space-y-1 shrink-0">
          <div className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" strokeWidth={1.75} />
            <span>{t.schedule.workloadTitle}</span>
          </div>
          <p className="text-[11.5px] leading-relaxed text-blue-800/90 dark:text-blue-300/90">
            {workload.adviceMessage}
          </p>
          <div className="flex items-center gap-3 pt-0.5 text-[10.5px] text-blue-700 dark:text-blue-400 font-mono">
            <span>{t.schedule.todayTasks}: {workload.todayCount}</span>
            <span>·</span>
            <span>{t.schedule.tomorrowTasks}: {workload.tomorrowCount}</span>
            {workload.overdueCount > 0 && (
              <>
                <span>·</span>
                <span className="text-rose-600 dark:text-rose-400 font-semibold">
                  {t.schedule.overdueTasks}: {workload.overdueCount}
                </span>
              </>
            )}
          </div>
        </div>

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
            <div className="space-y-3">
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
