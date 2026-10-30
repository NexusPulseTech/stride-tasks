import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Target,
  X,
  Check,
  CheckCircle2,
  Clock,
  Pin,
  ChevronRight,
  RotateCcw,
  Layers,
  Play,
  Moon,
  FileText,
} from 'lucide-react';
import {
  ActionableItem,
  AnkiSrsOption,
  getAnkiSrs3Options,
  calculateSnoozeTarget,
  formatSnoozeCountdown,
} from '../utils/spacedSnooze';
import { Project } from '../../../types';
import { isDoneStatus } from '../utils/statusCategory';
import { useLanguage } from '../../../i18n';
import { triggerHaptic } from '../../../utils';

export interface DailyFocusModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ActionableItem[];
  snoozedItems?: ActionableItem[];
  projects?: Project[];
  onToggleTaskDone: (projectId: string, taskId: string, completed: boolean) => void;
  onToggleSubTask: (projectId: string, taskId: string, subId: string, completed: boolean) => void;
  onTogglePinTask: (projectId: string, taskId: string) => void;
  onTogglePinSubTask: (projectId: string, taskId: string, subId: string) => void;
  onSnoozeTask: (projectId: string, taskId: string, snoozeUntil: string | null, snoozeLevel?: number, autoPin?: boolean) => void;
  onSnoozeSubTask: (
    projectId: string,
    taskId: string,
    subId: string,
    snoozeUntil: string | null,
    snoozeLevel?: number,
    autoPin?: boolean
  ) => void;
  onOpenDetail?: (taskId: string, projectId: string) => void;
  onStartFocusItem?: (item: ActionableItem) => void;
  onExecuteShutdownRitual?: () => void;
  onOpenMarkdownReport?: () => void;
}

export function DailyFocusModal({
  isOpen,
  onClose,
  items,
  snoozedItems = [],
  projects = [],
  onToggleTaskDone,
  onToggleSubTask,
  onTogglePinTask,
  onTogglePinSubTask,
  onSnoozeTask,
  onSnoozeSubTask,
  onOpenDetail,
  onStartFocusItem,
  onExecuteShutdownRitual,
  onOpenMarkdownReport,
}: DailyFocusModalProps) {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'due' | 'snoozed'>('due');
  const [reviewedNowKeys, setReviewedNowKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      setReviewedNowKeys(new Set());
    }
  }, [isOpen]);

  const getItemKey = (item: ActionableItem) => `${item.projectId}_${item.taskId}_${item.id}`;

  const currentList = useMemo(() => {
    if (activeTab === 'snoozed') return snoozedItems;
    const unreviewed: ActionableItem[] = [];
    const reviewedNow: ActionableItem[] = [];
    for (const it of items) {
      if (reviewedNowKeys.has(getItemKey(it))) {
        reviewedNow.push(it);
      } else {
        unreviewed.push(it);
      }
    }
    return [...unreviewed, ...reviewedNow];
  }, [activeTab, items, snoozedItems, reviewedNowKeys]);

  const handleApplyAnkiOption = useCallback(
    (item: ActionableItem, opt: AnkiSrsOption) => {
      triggerHaptic();
      const targetIso = opt.days > 0 ? calculateSnoozeTarget(opt.days) : null;
      const itemKey = `${item.projectId}_${item.taskId}_${item.id}`;

      if (opt.optionNumber === 1) {
        setReviewedNowKeys((prev) => {
          const next = new Set(prev);
          next.add(itemKey);
          return next;
        });
      } else {
        setReviewedNowKeys((prev) => {
          if (!prev.has(itemKey)) return prev;
          const next = new Set(prev);
          next.delete(itemKey);
          return next;
        });
      }

      if (item.isSubtask && item.subtaskId) {
        onSnoozeSubTask(item.projectId, item.taskId, item.subtaskId, targetIso, opt.nextLevel, opt.autoPin);
      } else {
        onSnoozeTask(item.projectId, item.taskId, targetIso, opt.nextLevel, opt.autoPin);
      }
    },
    [onSnoozeSubTask, onSnoozeTask]
  );

  // Phím tắt chuẩn AnkiWeb: Phím 1, 2, 3 áp dụng trực tiếp cho công việc đầu tiên (#1) trong danh sách đang xem
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      const firstItem = currentList[0];
      if (!firstItem) return;
      const options = getAnkiSrs3Options(firstItem.snoozeLevel || 1);
      if (e.key === '1') {
        e.preventDefault();
        handleApplyAnkiOption(firstItem, options[0]);
      } else if (e.key === '2') {
        e.preventDefault();
        handleApplyAnkiOption(firstItem, options[1]);
      } else if (e.key === '3') {
        e.preventDefault();
        handleApplyAnkiOption(firstItem, options[2]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentList, handleApplyAnkiOption, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      style={{ zIndex: 9990 }}
      className="fixed inset-0 z-[9990] bg-black/55 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#151a23] rounded-2xl max-w-lg w-full border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-5 pt-3.5 pb-3 border-b border-slate-100 dark:border-slate-800/80 shrink-0 space-y-2.5 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200/50 dark:border-amber-900/40">
                <Target className="w-4 h-4 shrink-0" />
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                  {t.dailyFocus.modalTitle}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {language === 'vi'
                    ? 'Kiểm tra công việc tồn đọng & chọn chu kỳ nhắc lặp chuẩn AnkiWeb (Phím 1, 2, 3)'
                    : 'Review pending tasks & select AnkiWeb spaced snooze intervals (Keys 1, 2, 3)'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0 transition-colors"
              title={t.common.close}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sunsama / Akiflow Workload Capacity & Burnout Guardrail Bar */}
          {(() => {
            let totalEstimatedMins = 0;
            let totalFocusedMins = 0;
            let activeDoingCount = 0;
            let unestimatedCount = 0;
            projects.forEach((p) => {
              p.tasks.forEach((t) => {
                totalFocusedMins += t.focusedMinutes || 0;
                if (!isDoneStatus(t.status)) {
                  // Chỉ cộng ước tính thật (đồng nhất với Thống kê & Báo cáo); việc chưa ước tính được đếm riêng
                  if (t.estimatedMinutes) totalEstimatedMins += t.estimatedMinutes;
                  else unestimatedCount += 1;
                  if (t.status === 'doing' || t.status === 'review') {
                    activeDoingCount += 1;
                  }
                }
              });
            });
            const isOverloaded = totalEstimatedMins > 360; // > 6 hours realistic deep work cap
            const estHours = Math.floor(totalEstimatedMins / 60);
            const estRemMins = totalEstimatedMins % 60;

            return (
              <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                    <span>
                      {language === 'vi' ? 'Quỹ tải công việc:' : 'Workload Budget:'}
                    </span>
                    <span
                      className={`font-mono tabular-nums ${
                        isOverloaded
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      ~{estHours > 0 ? `${estHours}h ` : ''}{estRemMins}m
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="font-mono tabular-nums text-amber-600 dark:text-amber-400">
                      {totalFocusedMins}m Focus
                    </span>
                    {unestimatedCount > 0 && (
                      <span className="text-[10px] font-normal text-slate-400">
                        · {language === 'vi' ? `+${unestimatedCount} việc chưa ước tính` : `+${unestimatedCount} unestimated`}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    {isOverloaded
                      ? language === 'vi'
                        ? 'Cảnh báo quá tải (>6h Deep Work): hãy dùng phím 2 hoặc 3 để giãn lịch Anki SM-2'
                        : 'Overbooked (>6h Deep Work): use keys 2 or 3 to space out tasks via Anki SM-2'
                      : language === 'vi'
                      ? 'Khối lượng công việc trong ngưỡng an toàn (Chuẩn Sunsama Anti-Burnout)'
                      : 'Workload within healthy daily capacity (Sunsama Anti-Burnout guardrail)'}
                  </p>
                </div>

                {onExecuteShutdownRitual && (
                  <button
                    type="button"
                    onClick={() => {
                      onExecuteShutdownRitual();
                      if (onOpenMarkdownReport && activeDoingCount >= 0) {
                        onClose();
                        onOpenMarkdownReport();
                      }
                    }}
                    className="h-7 px-2.5 rounded-lg bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
                    title={
                      language === 'vi'
                        ? 'Chốt ca cuối ngày (Sunsama Shutdown Ritual): Dời việc đang làm dở sang 9h sáng mai & mở Báo cáo tổng kết ngày'
                        : 'Daily Shutdown Ritual: Roll over unfinished tasks to tomorrow 9 AM & open Daily Standup report'
                    }
                  >
                    <Moon className="w-3 h-3 shrink-0" />
                    <span>{language === 'vi' ? 'Chốt ca cuối ngày' : 'Shutdown Ritual'}</span>
                    <FileText className="w-3 h-3 opacity-75 shrink-0" />
                  </button>
                )}
              </div>
            );
          })()}

          {/* Segmented Tabs: Cần xử lý ngay vs Đang hoãn đếm ngược (Cố định 2 cột bằng Grid) */}
          <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-200/75 dark:bg-slate-800/85 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('due')}
              className={`h-7 px-2 rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap overflow-hidden ${
                activeTab === 'due'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span className="truncate">
                {language === 'vi' ? 'Cần xử lý hôm nay' : 'Due Today'}
              </span>
              <span className="font-mono tabular-nums text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 shrink-0">
                {items.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('snoozed')}
              className={`h-7 px-2 rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap overflow-hidden ${
                activeTab === 'snoozed'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span className="truncate">
                {language === 'vi' ? 'Đang hoãn (Anki)' : 'Snoozed (Anki)'}
              </span>
              <span className="font-mono tabular-nums text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-300/70 dark:bg-slate-900/70 text-slate-700 dark:text-slate-300 shrink-0">
                {snoozedItems.length}
              </span>
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-2.5 flex-1">
          {currentList.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="font-medium text-xs text-slate-800 dark:text-slate-200">
                {activeTab === 'due'
                  ? t.dailyFocus.emptyQueue
                  : language === 'vi'
                  ? 'Chưa có công việc nào đang trong thời gian hoãn đếm ngược.'
                  : 'No tasks are currently snoozed.'}
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                {activeTab === 'due'
                  ? language === 'vi'
                    ? 'Tất cả công việc đã được hoàn thành hoặc đang hoãn theo cấp số nhân Anki.'
                    : 'All tasks are either completed or resting in Anki spaced snooze.'
                  : language === 'vi'
                  ? 'Chọn nút 2 (Tốt) hoặc 3 (Dễ) ở tab Cần xử lý để hoãn công việc theo cấp số nhân.'
                  : 'Choose option 2 (Good) or 3 (Easy) in Due Today to snooze tasks exponentially.'}
              </p>
            </div>
          ) : (
            currentList.map((item, index) => {
              const currentLevel = Math.max(1, item.snoozeLevel || 1);
              const ankiOptions = getAnkiSrs3Options(currentLevel);
              const countdown = formatSnoozeCountdown(item.snoozeUntil, language);
              const isReviewedNowInSession = reviewedNowKeys.has(getItemKey(item));

              const handleMarkDone = () => {
                triggerHaptic();
                if (item.isSubtask && item.subtaskId) {
                  onToggleSubTask(item.projectId, item.taskId, item.subtaskId, true);
                } else {
                  onToggleTaskDone(item.projectId, item.taskId, true);
                }
              };

              const handleTogglePin = () => {
                triggerHaptic();
                if (item.isSubtask && item.subtaskId) {
                  onTogglePinSubTask(item.projectId, item.taskId, item.subtaskId);
                } else {
                  onTogglePinTask(item.projectId, item.taskId);
                }
              };

              return (
                <div
                  key={getItemKey(item)}
                  className={`p-3 sm:p-3.5 rounded-xl border transition-colors space-y-2.5 ${
                    index === 0 && !isReviewedNowInSession
                      ? 'border-amber-300/90 dark:border-amber-700/70 bg-white dark:bg-slate-900/80 shadow-xs ring-1 ring-amber-500/15'
                      : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Row 1: Category Breadcrumbs & Anki Level + Status */}
                  <div className="flex items-center justify-between gap-2 flex-nowrap overflow-hidden">
                    <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 dark:text-slate-400 min-w-0 overflow-hidden">
                      <span
                        className={`w-4.5 h-4.5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 font-mono tabular-nums ${
                          index === 0 && !isReviewedNowInSession
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 shrink-0 truncate max-w-[120px] sm:max-w-[160px]">
                        {item.projectName}
                      </span>
                      {item.parentPath && item.parentPath.length > 1 && (
                        <>
                          <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate text-slate-400">
                            {item.parentPath.slice(0, -1).join(' › ')}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0 flex-nowrap">
                      {isReviewedNowInSession && (
                        <span className="text-[9.5px] font-semibold px-1.5 py-0.2 rounded bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/70 dark:border-rose-800/60 flex items-center gap-0.5 shrink-0">
                          <Check className="w-2.5 h-2.5 shrink-0" strokeWidth={2.5} />
                          <span>{language === 'vi' ? 'Đã ghim nhắc ngay' : 'Pinned for today'}</span>
                        </span>
                      )}
                      {item.isSubtask && (
                        <span className="text-[9.5px] font-medium px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-0.5 shrink-0">
                          <Layers className="w-2.5 h-2.5 shrink-0" />
                          <span className="hidden sm:inline">{language === 'vi' ? 'Việc con' : 'Step'}</span>
                        </span>
                      )}
                      <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50 shrink-0 tabular-nums">
                        {language === 'vi' ? `Mức ${currentLevel}` : `Lvl ${currentLevel}`}
                      </span>
                      {countdown && (
                        <span
                          className={`inline-flex items-center gap-0.5 text-[9.5px] px-1.5 py-0.2 rounded font-medium shrink-0 tabular-nums ${
                            countdown.isDue
                              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/50'
                              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50'
                          }`}
                        >
                          <Clock className="w-2.5 h-2.5 shrink-0" />
                          <span>{countdown.text}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Checkbox + Task Title + Quick Complete & Pin */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={handleMarkDone}
                        className="w-4.5 h-4.5 rounded-full border border-slate-300 dark:border-slate-600 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center justify-center shrink-0 cursor-pointer transition-colors group"
                        title={t.dailyFocus.markDone}
                        aria-label={t.dailyFocus.markDone}
                      >
                        <Check className="w-2.5 h-2.5 text-transparent group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" strokeWidth={2.5} />
                      </button>
                      <h3
                        onClick={() => onOpenDetail?.(item.taskId, item.projectId)}
                        className="text-xs sm:text-[13px] font-semibold text-slate-900 dark:text-slate-100 leading-snug cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
                        title={item.title}
                      >
                        {item.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {onStartFocusItem && (
                        <button
                          type="button"
                          onClick={() => onStartFocusItem(item)}
                          className="h-6.5 px-1.5 rounded-md border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-[10.5px] font-medium flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                          title={language === 'vi' ? 'Chạy đồng hồ Focus Pomodoro 25 phút' : 'Start 25m Focus Pomodoro'}
                        >
                          <Play className="w-2.5 h-2.5 text-amber-500 fill-current shrink-0" />
                          <span className="hidden xs:inline font-mono">25p</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleTogglePin}
                        className={`h-6.5 px-1.5 rounded-md border text-[10.5px] font-medium flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
                          item.isPinned
                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                        }`}
                        title={item.isPinned ? t.dailyFocus.unpin : t.dailyFocus.pinTop}
                      >
                        <Pin className={`w-3 h-3 shrink-0 ${item.isPinned ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        type="button"
                        onClick={handleMarkDone}
                        className="h-6.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer shrink-0 whitespace-nowrap"
                      >
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                        <span>{t.dailyFocus.markDone}</span>
                      </button>
                    </div>
                  </div>

                  {/* Row 3: Thanh 3 lựa chọn Snooze thông minh chuẩn AnkiWeb (Luôn có Option 1 mặc định = Nhắc lại ngay) */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/70">
                    <div className="grid grid-cols-3 gap-1.5">
                      {/* Option 1 (Mặc định): Nhắc lại ngay & Ghim ưu tiên (Reset Mức 1) */}
                      <button
                        type="button"
                        onClick={() => handleApplyAnkiOption(item, ankiOptions[0])}
                        className="px-2 py-1.5 rounded-lg border border-rose-200/90 dark:border-rose-900/60 bg-rose-50/60 hover:bg-rose-100/80 dark:bg-rose-950/25 dark:hover:bg-rose-950/45 transition-colors cursor-pointer text-left flex flex-col justify-between min-w-0 overflow-hidden"
                        title={language === 'vi' ? ankiOptions[0].subLabelVi : ankiOptions[0].subLabelEn}
                      >
                        <div className="flex items-center justify-between gap-1 w-full">
                          <span className="text-[9.5px] font-bold uppercase text-rose-600 dark:text-rose-400 truncate">
                            1 · {language === 'vi' ? 'Nhắc ngay' : 'Now'}
                          </span>
                          <RotateCcw className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                        </div>
                        <div className="text-[11px] sm:text-xs font-bold text-rose-950 dark:text-rose-100 truncate mt-0.5">
                          {language === 'vi' ? 'Nhắc lại ngay' : 'Remind Now'}
                        </div>
                        <div className="text-[9.5px] text-rose-700/80 dark:text-rose-300/80 truncate font-mono tabular-nums">
                          {language === 'vi' ? 'Mức 1 · Ghim' : 'Lvl 1 · Pin'}
                        </div>
                      </button>

                      {/* Option 2: Tốt / Good (Hoãn cấp số nhân chuẩn +1 mức) */}
                      <button
                        type="button"
                        onClick={() => handleApplyAnkiOption(item, ankiOptions[1])}
                        className="px-2 py-1.5 rounded-lg border border-blue-200/90 dark:border-blue-900/60 bg-blue-50/60 hover:bg-blue-100/80 dark:bg-blue-950/25 dark:hover:bg-blue-950/45 transition-colors cursor-pointer text-left flex flex-col justify-between min-w-0 overflow-hidden"
                        title={language === 'vi' ? ankiOptions[1].subLabelVi : ankiOptions[1].subLabelEn}
                      >
                        <div className="flex items-center justify-between gap-1 w-full">
                          <span className="text-[9.5px] font-bold uppercase text-blue-600 dark:text-blue-400 truncate">
                            2 · {language === 'vi' ? 'Tốt (Good)' : 'Good'}
                          </span>
                          <span className="text-[9px] font-mono font-semibold text-blue-600 dark:text-blue-400 shrink-0 tabular-nums">
                            L{ankiOptions[1].nextLevel}
                          </span>
                        </div>
                        <div className="text-[11px] sm:text-xs font-bold text-blue-950 dark:text-blue-100 truncate mt-0.5 font-mono tabular-nums">
                          {language === 'vi' ? `+${ankiOptions[1].days} ngày` : `+${ankiOptions[1].days}d`}
                        </div>
                        <div className="text-[9.5px] text-blue-700/80 dark:text-blue-300/80 truncate">
                          {language === 'vi' ? `Lên Mức ${ankiOptions[1].nextLevel}` : `To Lvl ${ankiOptions[1].nextLevel}`}
                        </div>
                      </button>

                      {/* Option 3: Dễ / Easy (Hoãn vượt cấp +2 mức) */}
                      <button
                        type="button"
                        onClick={() => handleApplyAnkiOption(item, ankiOptions[2])}
                        className="px-2 py-1.5 rounded-lg border border-emerald-200/90 dark:border-emerald-900/60 bg-emerald-50/60 hover:bg-emerald-100/80 dark:bg-emerald-950/25 dark:hover:bg-emerald-950/45 transition-colors cursor-pointer text-left flex flex-col justify-between min-w-0 overflow-hidden"
                        title={language === 'vi' ? ankiOptions[2].subLabelVi : ankiOptions[2].subLabelEn}
                      >
                        <div className="flex items-center justify-between gap-1 w-full">
                          <span className="text-[9.5px] font-bold uppercase text-emerald-600 dark:text-emerald-400 truncate">
                            3 · {language === 'vi' ? 'Dễ (Easy)' : 'Easy'}
                          </span>
                          <span className="text-[9px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 shrink-0 tabular-nums">
                            L{ankiOptions[2].nextLevel}
                          </span>
                        </div>
                        <div className="text-[11px] sm:text-xs font-bold text-emerald-950 dark:text-emerald-100 truncate mt-0.5 font-mono tabular-nums">
                          {language === 'vi' ? `+${ankiOptions[2].days} ngày` : `+${ankiOptions[2].days}d`}
                        </div>
                        <div className="text-[9.5px] text-emerald-700/80 dark:text-emerald-300/80 truncate">
                          {language === 'vi' ? `Vượt Mức ${ankiOptions[2].nextLevel}` : `Jump Lvl ${ankiOptions[2].nextLevel}`}
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 sm:px-5 py-2.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <RotateCcw className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="truncate">
              {language === 'vi'
                ? 'Chuẩn AnkiWeb SM-2: 1d → 3d → 7d → 16d → 35d'
                : 'AnkiWeb SM-2: 1d → 3d → 7d → 16d → 35d'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-950 font-medium text-xs rounded-lg transition-colors cursor-pointer shrink-0"
          >
            {t.common.close}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
