import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, Check, Download, FileText } from 'lucide-react';
import { Project, StatusDefinition } from '../../../types';
import { isDoneStatus, isDoingStatus } from '../../tasks/utils/statusCategory';
import { CompletedItemLog, getTodayKey } from '../../analytics/hooks/useActivityLog';
import { useLanguage, formatMessage, pluralize } from '../../../i18n';
import { triggerHaptic } from '../../../utils';

export interface MarkdownReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  statuses: StatusDefinition[];
  completedLogs: CompletedItemLog[];
  streak: number;
  todayCount: number;
  weekCount: number;
  showToast: (msg: string) => void;
  /** Gọi ngay trước khi sao chép/tải báo cáo (khoảnh khắc nhận giá trị). Trả về false để chặn (paywall). */
  onBeforeExport?: () => boolean;
}

type ReportTemplate = 'standup' | 'obsidian' | 'weekly';

export function MarkdownReportModal({
  isOpen,
  onClose,
  projects,
  statuses,
  streak,
  todayCount,
  weekCount,
  showToast,
  onBeforeExport,
}: MarkdownReportModalProps) {
  const { t, language } = useLanguage();
  const [template, setTemplate] = useState<ReportTemplate>('standup');
  const [includeAttribution, setIncludeAttribution] = useState(true);
  const [copied, setCopied] = useState(false);

  const { reportMarkdown, summaryStats } = useMemo(() => {
    const todayDate = getTodayKey();
    const doneTasks: Array<{ title: string; project: string; minutes: number; estimated: number }> = [];
    const doingTasks: Array<{
      title: string;
      project: string;
      isPinned?: boolean;
      minutes: number;
      estimated: number;
    }> = [];
    const srsTasks: Array<{ title: string; project: string; level: number }> = [];
    let totalFocusMinutes = 0;
    let totalEstimatedMinutes = 0;
    let totalPomodoroSessions = 0;

    projects.forEach((p) => {
      p.tasks.forEach((t) => {
        const mins = t.focusedMinutes || 0;
        const est = t.estimatedMinutes || 0;
        totalFocusMinutes += mins;
        totalEstimatedMinutes += est;
        totalPomodoroSessions += t.pomodoroSessions || 0;

        if (isDoneStatus(t.status, statuses)) {
          doneTasks.push({ title: t.title, project: p.name, minutes: mins, estimated: est });
        } else if (isDoingStatus(t.status, statuses)) {
          doingTasks.push({
            title: t.title,
            project: p.name,
            isPinned: t.isPinned,
            minutes: mins,
            estimated: est,
          });
        }

        if (t.snoozeLevel && t.snoozeLevel > 1) {
          srsTasks.push({
            title: t.title,
            project: p.name,
            level: t.snoozeLevel,
          });
        }
      });
    });

    const r = t.report;
    const formatTimeBadge = (mins: number, est: number) => {
      if (mins > 0 && est > 0) return ` · ${formatMessage(r.badgeFocusOfPlan, { mins, est })}`;
      if (mins > 0) return ` · ${formatMessage(r.badgeFocus, { mins })}`;
      if (est > 0) return ` · ${formatMessage(r.badgeEstimate, { est })}`;
      return '';
    };
    const focusTotal = totalEstimatedMinutes > 0 ? `${totalFocusMinutes}/${totalEstimatedMinutes}` : totalFocusMinutes;

    const lines: string[] = [];

    if (template === 'standup') {
      lines.push(`# ${formatMessage(r.standupTitle, { date: todayDate })}`);
      lines.push(
        formatMessage(r.standupSummary, {
          streak,
          today: todayCount,
          focus: focusTotal,
          sessions: totalPomodoroSessions,
        })
      );
      lines.push('');
      lines.push(`## ${formatMessage(r.sectionCompleted, { count: doneTasks.length })}`);
      if (doneTasks.length === 0) {
        lines.push(`- ${r.noneCompleted}`);
      } else {
        doneTasks.forEach((item) => {
          lines.push(
            `- [x] **${item.title}** *(${item.project}${formatTimeBadge(item.minutes, item.estimated)})*`
          );
        });
      }
      lines.push('');
      lines.push(`## ${formatMessage(r.sectionInProgress, { count: doingTasks.length })}`);
      if (doingTasks.length === 0) {
        lines.push(`- ${r.allClear}`);
      } else {
        doingTasks.slice(0, 15).forEach((item) => {
          lines.push(
            `- [ ] ${item.isPinned ? r.pinnedPrefix : ''}${item.title} *(${item.project}${formatTimeBadge(
              item.minutes,
              item.estimated
            )})*`
          );
        });
      }
    } else if (template === 'obsidian') {
      lines.push('---');
      lines.push(`date: ${todayDate}`);
      lines.push(`streak: ${streak}`);
      lines.push(`completed_today: ${todayCount}`);
      lines.push(`focus_minutes: ${totalFocusMinutes}`);
      lines.push(`estimated_minutes: ${totalEstimatedMinutes}`);
      lines.push(`pomodoro_sessions: ${totalPomodoroSessions}`);
      lines.push('tags: [stride-tasks, daily-note, productivity, deep-work]');
      lines.push('---');
      lines.push('');
      lines.push(`# ${formatMessage(r.obsidianTitle, { date: todayDate })}`);
      lines.push('');
      lines.push(`### ${r.sectionPriority}`);
      doingTasks.forEach((item) => {
        lines.push(`- [ ] ${item.title} \`${item.project}\`${formatTimeBadge(item.minutes, item.estimated)}`);
      });
      lines.push('');
      lines.push(`### ${r.sectionSrs}`);
      if (srsTasks.length === 0) {
        lines.push(`- ${r.noSrs}`);
      } else {
        srsTasks.forEach((item) => {
          lines.push(`- **${item.title}** · ${item.project} · \`SRS Lv.${item.level}\``);
        });
      }
      lines.push('');
      lines.push(`### ${r.sectionDone}`);
      doneTasks.forEach((item) => {
        lines.push(`- [x] ${item.title} \`${item.project}\`${formatTimeBadge(item.minutes, item.estimated)}`);
      });
    } else {
      lines.push(`# ${formatMessage(r.weeklyTitle, { date: todayDate })}`);
      lines.push('');
      lines.push(`- ${formatMessage(r.weeklyStreak, { count: streak })}`);
      lines.push(`- ${formatMessage(r.weeklyCompleted, { count: weekCount })}`);
      lines.push(`- ${formatMessage(r.weeklyFocus, { focus: focusTotal, sessions: totalPomodoroSessions })}`);
      lines.push(`- ${formatMessage(r.weeklyProjects, { count: projects.length })}`);
      lines.push('');
      lines.push(`## ${r.sectionProjects}`);
      projects.forEach((p) => {
        const doneCount = p.tasks.filter((t) => isDoneStatus(t.status, statuses)).length;
        lines.push(`### ${p.name} (${doneCount}/${p.tasks.length})`);
        p.tasks.forEach((t) => {
          const done = isDoneStatus(t.status, statuses);
          lines.push(
            `- [${done ? 'x' : ' '}] ${t.title}${formatTimeBadge(
              t.focusedMinutes || 0,
              t.estimatedMinutes || 0
            )}${t.snoozeLevel && t.snoozeLevel > 1 ? ` · SRS Lv.${t.snoozeLevel}` : ''}`
          );
        });
        lines.push('');
      });
    }

    if (includeAttribution) {
      lines.push('');
      lines.push('---');
      lines.push(r.attribution);
    }

    return {
      reportMarkdown: lines.join('\n'),
      summaryStats: {
        totalFocusMinutes,
        totalEstimatedMinutes,
        totalPomodoroSessions,
        doneCount: doneTasks.length,
        doingCount: doingTasks.length,
        srsCount: srsTasks.length,
      },
    };
  }, [projects, statuses, streak, todayCount, weekCount, template, includeAttribution, t]);

  if (!isOpen) return null;

  const handleCopy = () => {
    triggerHaptic();
    if (onBeforeExport && !onBeforeExport()) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(reportMarkdown);
      setCopied(true);
      showToast(
        language === 'vi'
          ? 'Đã sao chép Báo cáo Markdown vào Clipboard!'
          : 'Copied Markdown Report to Clipboard!'
      );
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadMd = () => {
    triggerHaptic();
    if (onBeforeExport && !onBeforeExport()) return;
    const blob = new Blob([reportMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stride-report-${template}-${getTodayKey()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(language === 'vi' ? 'Đã tải xuống file báo cáo (.md)!' : 'Downloaded Markdown (.md) file!');
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Markdown Report Generator"
      style={{ zIndex: 10012 }}
      className="fixed inset-0 z-[10012] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[86vh] animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/70 dark:bg-[#12161f]">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {language === 'vi'
                ? 'Xuất Báo cáo Tiến độ Chuẩn Markdown (Obsidian / Notion / Standup)'
                : 'Markdown Progress Report (Obsidian / Notion / Daily Standup)'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7.5 h-7.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Time-Budget & Shutdown ROI Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200/80 dark:border-slate-800">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t.report.uiFocusVsPlan}
              </div>
              <div className="text-sm font-mono tabular-nums font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                {summaryStats.totalFocusMinutes}
                {summaryStats.totalEstimatedMinutes > 0
                  ? `/${summaryStats.totalEstimatedMinutes}m`
                  : 'm'}{' '}
                <span className="text-[11px] font-normal text-slate-400">
                  {pluralize(summaryStats.totalPomodoroSessions, t.report.uiSessionsOne, t.report.uiSessionsOther)}
                </span>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t.report.uiDone}
              </div>
              <div className="text-sm font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatMessage(t.report.uiDoneValue, { count: summaryStats.doneCount, today: todayCount })}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t.report.uiWip}
              </div>
              <div className="text-sm font-mono tabular-nums font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                {formatMessage(t.report.uiWipValue, { count: summaryStats.doingCount })}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t.report.uiSrs}
              </div>
              <div className="text-sm font-mono tabular-nums font-bold text-sky-600 dark:text-sky-400 mt-0.5">
                {formatMessage(t.report.uiSrsValue, { count: summaryStats.srsCount, streak })}
              </div>
            </div>
          </div>

          {/* Template Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setTemplate('standup')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  template === 'standup'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Daily Standup (Slack/Teams)
              </button>
              <button
                type="button"
                onClick={() => setTemplate('obsidian')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  template === 'obsidian'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Obsidian / Logseq Note
              </button>
              <button
                type="button"
                onClick={() => setTemplate('weekly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  template === 'weekly'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {language === 'vi' ? 'Tổng kết Tuần & SRS' : 'Weekly & SRS Summary'}
              </button>
            </div>

            <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeAttribution}
                onChange={(e) => setIncludeAttribution(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700"
              />
              <span>{language === 'vi' ? 'Kèm chữ ký Stride Tasks' : 'Include Stride Tasks signature'}</span>
            </label>
          </div>

          {/* Markdown Preview Area */}
          <textarea
            readOnly
            value={reportMarkdown}
            rows={14}
            className="w-full font-mono text-xs leading-relaxed p-3.5 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 outline-none resize-y"
          />
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-[#12161f] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleDownloadMd}
            className="h-8.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{language === 'vi' ? 'Tải file .MD' : 'Download .MD'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-8.5 px-3 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
            >
              {language === 'vi' ? 'Đóng' : 'Close'}
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="h-8.5 px-4 rounded-lg bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                  <span>{language === 'vi' ? 'Đã sao chép!' : 'Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{language === 'vi' ? 'Sao chép Markdown' : 'Copy Markdown'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
