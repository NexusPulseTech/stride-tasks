import React, { useState } from 'react';
import {
  Target,
  X,
  CheckCircle2,
  Clock,
  Pin,
  ChevronRight,
  RotateCcw,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  ActionableItem,
  getSpacedSnoozeOptions,
  calculateSnoozeTarget,
  formatSnoozeCountdown,
} from '../utils/spacedSnooze';
import { useLanguage } from '../../../i18n';
import { triggerHaptic } from '../../../utils';

export interface DailyFocusModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ActionableItem[];
  onToggleTaskDone: (projectId: string, taskId: string, completed: boolean) => void;
  onToggleSubTask: (projectId: string, taskId: string, subId: string, completed: boolean) => void;
  onTogglePinTask: (projectId: string, taskId: string) => void;
  onTogglePinSubTask: (projectId: string, taskId: string, subId: string) => void;
  onSnoozeTask: (projectId: string, taskId: string, snoozeUntil: string | null, snoozeLevel?: number) => void;
  onSnoozeSubTask: (
    projectId: string,
    taskId: string,
    subId: string,
    snoozeUntil: string | null,
    snoozeLevel?: number
  ) => void;
  onOpenDetail?: (taskId: string, projectId: string) => void;
}

export function DailyFocusModal({
  isOpen,
  onClose,
  items,
  onToggleTaskDone,
  onToggleSubTask,
  onTogglePinTask,
  onTogglePinSubTask,
  onSnoozeTask,
  onSnoozeSubTask,
  onOpenDetail,
}: DailyFocusModalProps) {
  const { t, language } = useLanguage();
  const [activeSnoozeItemId, setActiveSnoozeItemId] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#151a23] rounded-2xl max-w-lg w-full border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                {t.dailyFocus.modalTitle}
              </h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                {t.dailyFocus.subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
            title={t.common.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
          {items.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="font-medium text-xs text-slate-800 dark:text-slate-200">
                {t.dailyFocus.emptyQueue}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                {language === 'vi'
                  ? 'Tất cả công việc đã được xử lý hoặc đang trong thời gian hoãn đếm ngược an tâm.'
                  : 'All tasks are either finished or peacefully resting in spaced snooze.'}
              </p>
            </div>
          ) : (
            items.map((item, index) => {
              const countdown = formatSnoozeCountdown(item.snoozeUntil, language);
              const snoozePresets = getSpacedSnoozeOptions(item.snoozeLevel || 0);
              const isSnoozeOpen = activeSnoozeItemId === item.id;

              return (
                <div
                  key={`${item.projectId}_${item.taskId}_${item.id}`}
                  className="p-3.5 sm:p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-2.5"
                >
                  {/* Category & Breadcrumbs */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 dark:text-slate-400 overflow-hidden truncate">
                      <span className="font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                        {item.projectName}
                      </span>
                      {item.parentPath && item.parentPath.length > 1 && (
                        <>
                          <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate text-slate-400">
                            {item.parentPath.slice(0, -1).join(' > ')}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {item.isSubtask && (
                        <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/50 flex items-center gap-1">
                          <Layers className="w-2.5 h-2.5" />
                          <span>{t.dailyFocus.nextActionBadge}</span>
                        </span>
                      )}
                      {item.isPinned && (
                        <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/50 flex items-center gap-1">
                          <Pin className="w-2.5 h-2.5" />
                          <span>{t.dailyFocus.pinTop}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Task title */}
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10.5px] font-bold flex items-center justify-center shrink-0 mt-0.5 font-mono">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        onClick={() => onOpenDetail?.(item.taskId, item.projectId)}
                        className="text-xs sm:text-[13px] font-semibold text-slate-900 dark:text-slate-100 leading-snug cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {item.title}
                      </h3>
                      {countdown && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className={`inline-flex items-center gap-1 text-[10.5px] px-2 py-0.5 rounded font-medium ${
                              countdown.isDue
                                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/50'
                                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            <span>{countdown.text}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic();
                              if (item.isSubtask && item.subtaskId) {
                                onSnoozeSubTask(item.projectId, item.taskId, item.subtaskId, null);
                              } else {
                                onSnoozeTask(item.projectId, item.taskId, null);
                              }
                            }}
                            className="text-[10px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer underline"
                          >
                            {t.dailyFocus.cancelSnooze}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="pt-1 flex items-center justify-between gap-1.5 flex-wrap border-t border-slate-100 dark:border-slate-800/60">
                    <div className="flex items-center gap-1.5">
                      {/* Mark Done button */}
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic();
                          if (item.isSubtask && item.subtaskId) {
                            onToggleSubTask(item.projectId, item.taskId, item.subtaskId, true);
                          } else {
                            onToggleTaskDone(item.projectId, item.taskId, true);
                          }
                        }}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{t.dailyFocus.markDone}</span>
                      </button>

                      {/* Pin button */}
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic();
                          if (item.isSubtask && item.subtaskId) {
                            onTogglePinSubTask(item.projectId, item.taskId, item.subtaskId);
                          } else {
                            onTogglePinTask(item.projectId, item.taskId);
                          }
                        }}
                        className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                          item.isPinned
                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:text-slate-900'
                        }`}
                        title={item.isPinned ? t.dailyFocus.unpin : t.dailyFocus.pinTop}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Spaced Snooze Trigger Button */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSnoozeItemId(isSnoozeOpen ? null : item.id);
                        }}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{t.dailyFocus.snoozeTitle}</span>
                      </button>

                      {/* Spaced Snooze Popover Menu */}
                      {isSnoozeOpen && (
                        <div
                          className="absolute right-0 bottom-full mb-1.5 z-30 w-56 bg-white dark:bg-[#1a212d] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-2 animate-in fade-in zoom-in-95 duration-100 space-y-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 px-2 py-0.5 uppercase tracking-wider">
                            {t.dailyFocus.snoozePresetsTitle}
                          </div>
                          {snoozePresets.map((opt) => (
                            <button
                              key={opt.days}
                              type="button"
                              onClick={() => {
                                triggerHaptic();
                                const targetIso = calculateSnoozeTarget(opt.days);
                                if (item.isSubtask && item.subtaskId) {
                                  onSnoozeSubTask(
                                    item.projectId,
                                    item.taskId,
                                    item.subtaskId,
                                    targetIso,
                                    opt.nextLevel
                                  );
                                } else {
                                  onSnoozeTask(
                                    item.projectId,
                                    item.taskId,
                                    targetIso,
                                    opt.nextLevel
                                  );
                                }
                                setActiveSnoozeItemId(null);
                              }}
                              className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium flex items-center justify-between cursor-pointer"
                            >
                              <span>{language === 'vi' ? opt.labelVi : opt.labelEn}</span>
                              <span className="text-[10px] font-mono text-slate-400">+{opt.days}d</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>GTD Next Action & Spaced Repetition</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-950 font-medium text-xs rounded-lg transition-colors cursor-pointer"
          >
            {t.common.close}
          </button>
        </div>
      </div>
    </div>
  );
}
