import React, { useState } from 'react';
import {
  Pin,
  Check,
  Folder,
  ChevronRight,
  Eye,
  Plus,
  Trash2,
  Calendar,
  Clock,
  RotateCcw,
  Play,
} from 'lucide-react';
import { Task, Project, SubTask, StatusDefinition } from '../../../types';
import { FormattedTaskText } from '../utils/formatters';
import { RecurrenceBadge } from './RecurrenceBadge';
import { TaskStatusButton } from './TaskStatusButton';
import { isDoneStatus } from '../utils/statusCategory';
import { countLeafSubtasks } from '../utils/subtaskTree';
import { formatScheduleBadge } from '../utils/scheduleHelper';
import { formatSnoozeCountdown } from '../utils/spacedSnooze';
import { useLanguage } from '../../../i18n';

export type PinnedItem =
  | {
      type: 'task';
      task: Task;
      project: Project;
    }
  | {
      type: 'subtask';
      subtask: SubTask;
      parentTask: Task;
      project: Project;
      path?: string[];
    };

interface PinnedSectionProps {
  pinnedTasks?: PinnedItem[];
  pinnedItems?: PinnedItem[];
  expandedTaskId?: string | null;
  onToggleExpand?: (id: string) => void;
  onToggleTaskDone: (projId: string, taskId: string, done: boolean) => void;
  onChangeStatus?: (projId: string, taskId: string, nextStatus: 'todo' | 'doing' | 'done') => void;
  onChangeSubtaskStatus?: (projId: string, taskId: string, subId: string, status: string, isDoneCategory: boolean) => void;
  onTogglePinTask: (projId: string, taskId: string, e: React.MouseEvent) => void;
  onTogglePinSubTask?: (projId: string, taskId: string, subId: string) => void;
  onEditTaskTitle?: (projId: string, taskId: string, newTitle: string) => void;
  onEditSubtaskTitle?: (projId: string, taskId: string, subId: string, newTitle: string) => void;
  onToggleSubTask?: (projId: string, taskId: string, subId: string, completed: boolean) => void;
  onDeleteSubTask?: (projId: string, taskId: string, subId: string) => void;
  onAddSubTask?: (projId: string, taskId: string, title?: string, parentSubId?: string | null) => void;
  onOpenDetail?: (task: Task, projectId: string) => void;
  onOpenSchedule?: (task: Task, project: Project) => void;
  onOpenAnkiSrs?: (task: Task, projectId: string, parentTaskId?: string) => void;
  onStartFocusTask?: (task: Task, project: Project) => void;
  activeFocusTaskId?: string | null;
  statuses?: StatusDefinition[];
}

function countArrayLeafSubtasks(subs: SubTask[]): { total: number; completed: number } {
  let total = 0;
  let completed = 0;
  for (const s of subs) {
    const res = countLeafSubtasks(s);
    total += res.total;
    completed += res.completed;
  }
  return { total, completed };
}

interface PinnedSubtaskBranchProps {
  subs: SubTask[];
  projectId: string;
  parentTaskId: string;
  statuses: StatusDefinition[];
  depth?: number;
  expandedPinnedSubs: Record<string, boolean>;
  onToggleExpandSub: (id: string) => void;
  onToggleSubTask?: (projId: string, taskId: string, subId: string, completed: boolean) => void;
  onDeleteSubTask?: (projId: string, taskId: string, subId: string) => void;
  onAddSubTask?: (projId: string, taskId: string, title?: string, parentSubId?: string | null) => void;
  onTogglePinSubTask?: (projId: string, taskId: string, subId: string) => void;
  newSubInputs: Record<string, string>;
  onNewSubInputChange: (key: string, val: string) => void;
  addingToId: string | null;
  onSetAddingToId: (id: string | null) => void;
}

function PinnedSubtaskBranch({
  subs,
  projectId,
  parentTaskId,
  statuses,
  depth = 0,
  expandedPinnedSubs,
  onToggleExpandSub,
  onToggleSubTask,
  onDeleteSubTask,
  onAddSubTask,
  onTogglePinSubTask,
  newSubInputs,
  onNewSubInputChange,
  addingToId,
  onSetAddingToId,
}: PinnedSubtaskBranchProps) {
  const { t } = useLanguage();
  if (!subs || subs.length === 0) return null;

  const sortedSubs = [...subs].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  return (
    <div className={`space-y-1 ${depth > 0 ? 'ml-3 pl-2.5 border-l border-slate-200/80 dark:border-slate-800' : ''}`}>
      {sortedSubs.map((childSub) => {
        const childDone = childSub.status
          ? isDoneStatus(childSub.status, statuses)
          : childSub.completed;
        const hasChildren = childSub.subtasks && childSub.subtasks.length > 0;
        const isChildExpanded = Boolean(expandedPinnedSubs[childSub.id]);
        const childStats = hasChildren && childSub.subtasks ? countArrayLeafSubtasks(childSub.subtasks) : { total: 0, completed: 0 };

        return (
          <div key={childSub.id} className="space-y-1">
            <div className="group/child flex items-center gap-1.5 py-0.5 px-1.5 min-h-[28px] rounded-lg hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors text-xs flex-nowrap w-full overflow-hidden">
              {/* Cột cố định 16px: Nút toggle nếu có con hoặc chấm căn lề */}
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => onToggleExpandSub(childSub.id)}
                  className="w-4 h-4 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center shrink-0 cursor-pointer rounded"
                  title={isChildExpanded ? t.pinned.collapseSubtasks : t.pinned.expandSubtasks}
                >
                  <ChevronRight
                    className={`w-3 h-3 shrink-0 transition-transform duration-150 ${
                      isChildExpanded ? 'rotate-90 text-slate-700 dark:text-slate-200' : ''
                    }`}
                  />
                </button>
              ) : (
                <div className="w-4 h-4 shrink-0 flex items-center justify-center" aria-hidden="true">
                  <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                </div>
              )}

              {/* Checkbox subtask con */}
              <button
                type="button"
                onClick={() => {
                  if (onToggleSubTask) {
                    onToggleSubTask(projectId, parentTaskId, childSub.id, !childDone);
                  }
                }}
                className="shrink-0 cursor-pointer p-0.5 -m-0.5 rounded-full flex items-center justify-center"
                aria-label={childDone ? 'Uncheck' : 'Check'}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${
                    childDone
                      ? 'bg-[#34c759] border-[#34c759] text-white'
                      : 'border-slate-300 dark:border-slate-600 hover:border-slate-500'
                  }`}
                >
                  {childDone && <Check className="w-2 h-2 shrink-0" strokeWidth={3} />}
                </div>
              </button>

              {/* Tiêu đề subtask con + badges trên cùng 1 hàng */}
              <div className="flex-1 min-w-0 flex items-center gap-1.5 flex-nowrap overflow-hidden pr-1">
                <span
                  className={`text-xs truncate min-w-0 ${
                    childDone
                      ? 'line-through text-slate-400 dark:text-slate-500'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <FormattedTaskText text={childSub.title} isDone={childDone} />
                </span>

                <div className="flex items-center gap-1 shrink-0 flex-nowrap">
                  {hasChildren && (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tabular-nums shrink-0 whitespace-nowrap">
                      {childStats.completed}/{childStats.total}
                    </span>
                  )}

                  {childSub.recurrence && (
                    <RecurrenceBadge
                      recurrence={childSub.recurrence}
                      recurrenceStreak={childSub.recurrenceStreak}
                      isDone={childDone}
                    />
                  )}
                </div>
              </div>

              {/* Quick actions basic icons: Add child (+), Delete */}
              <div className="shrink-0 flex items-center gap-0.5 flex-nowrap">
                {onAddSubTask && (
                  <button
                    type="button"
                    onClick={() => onSetAddingToId(addingToId === childSub.id ? null : childSub.id)}
                    className="w-6 h-6 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 cursor-pointer rounded shrink-0 transition-colors inline-flex items-center justify-center"
                    title={t.pinned.addSubtask}
                    aria-label={t.pinned.addSubtask}
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                  </button>
                )}

                {onDeleteSubTask && (
                  <button
                    type="button"
                    onClick={() => onDeleteSubTask(projectId, parentTaskId, childSub.id)}
                    className="w-6 h-6 text-slate-300 dark:text-slate-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer rounded shrink-0 transition-colors inline-flex items-center justify-center"
                    title={t.pinned.deleteSubtask}
                    aria-label={t.pinned.deleteSubtask}
                  >
                    <Trash2 className="w-3 h-3 shrink-0" />
                  </button>
                )}
              </div>
            </div>

            {/* Input thêm việc con trực tiếp cho nút này nếu đang mở (cố định chiều cao h-7, không xuống dòng) */}
            {addingToId === childSub.id && onAddSubTask && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const val = newSubInputs[childSub.id]?.trim();
                  if (!val) return;
                  onAddSubTask(projectId, parentTaskId, val, childSub.id);
                  onNewSubInputChange(childSub.id, '');
                  onSetAddingToId(null);
                  onToggleExpandSub(childSub.id);
                }}
                className="h-7 flex items-center gap-1.5 ml-5 flex-nowrap w-auto overflow-hidden"
              >
                <input
                  type="text"
                  value={newSubInputs[childSub.id] || ''}
                  onChange={(e) => onNewSubInputChange(childSub.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') onSetAddingToId(null);
                  }}
                  autoFocus
                  placeholder={t.pinned.addSubtaskPlaceholder.replace('{title}', childSub.title.slice(0, 15))}
                  className="flex-1 min-w-0 h-6.5 text-xs px-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md outline-none text-slate-900 dark:text-slate-100"
                />
                <button
                  type="submit"
                  className="h-6.5 px-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium rounded-md cursor-pointer shrink-0 whitespace-nowrap"
                >
                  {t.pinned.save}
                </button>
                <button
                  type="button"
                  onClick={() => onSetAddingToId(null)}
                  className="h-6.5 px-1.5 text-xs text-slate-400 hover:text-slate-600 cursor-pointer shrink-0 whitespace-nowrap"
                >
                  {t.pinned.cancel}
                </button>
              </form>
            )}

            {/* Đệ quy hiển thị các bước con cấp tiếp theo (Recursive Hierarchical Subtasks) */}
            {hasChildren && isChildExpanded && (
              <PinnedSubtaskBranch
                subs={childSub.subtasks || []}
                projectId={projectId}
                parentTaskId={parentTaskId}
                statuses={statuses}
                depth={depth + 1}
                expandedPinnedSubs={expandedPinnedSubs}
                onToggleExpandSub={onToggleExpandSub}
                onToggleSubTask={onToggleSubTask}
                onDeleteSubTask={onDeleteSubTask}
                onAddSubTask={onAddSubTask}
                onTogglePinSubTask={onTogglePinSubTask}
                newSubInputs={newSubInputs}
                onNewSubInputChange={onNewSubInputChange}
                addingToId={addingToId}
                onSetAddingToId={onSetAddingToId}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function PinnedSection({
  pinnedTasks,
  pinnedItems,
  onToggleTaskDone,
  onTogglePinTask,
  onTogglePinSubTask,
  onToggleSubTask,
  onDeleteSubTask,
  onAddSubTask,
  onOpenDetail,
  onOpenSchedule,
  onOpenAnkiSrs,
  onStartFocusTask,
  activeFocusTaskId,
  onChangeStatus,
  onChangeSubtaskStatus,
  statuses = [],
}: PinnedSectionProps) {
  const { t, language } = useLanguage();
  const items = pinnedItems || pinnedTasks || [];
  const [expandedPinnedSubs, setExpandedPinnedSubs] = useState<Record<string, boolean>>({});
  const [newSubInputs, setNewSubInputs] = useState<Record<string, string>>({});
  const [addingToId, setAddingToId] = useState<string | null>(null);

  if (items.length === 0) return null;

  const toggleSubExpand = (id: string) => {
    setExpandedPinnedSubs((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? true : !prev[id],
    }));
  };

  const handleAddSub = (projId: string, taskId: string, parentSubId: string | null = null) => {
    const key = parentSubId || taskId;
    const text = newSubInputs[key]?.trim();
    if (!text || !onAddSubTask) return;
    onAddSubTask(projId, taskId, text, parentSubId);
    setNewSubInputs((prev) => ({ ...prev, [key]: '' }));
    setAddingToId(null);
  };

  return (
    <div className="bg-slate-100/60 dark:bg-[#161b22]/80 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 space-y-2.5 shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="h-6 flex items-center justify-between flex-nowrap gap-2 overflow-hidden">
        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-800 dark:text-slate-200 truncate flex-1 min-w-0">
          <Pin className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400 fill-current" strokeWidth={1.5} aria-hidden="true" />
          <span className="truncate">{t.pinned.title} ({items.length})</span>
        </div>
        <span className="text-[10.5px] text-slate-500 dark:text-slate-400 shrink-0 whitespace-nowrap hidden sm:inline">
          {t.pinned.subtitle}
        </span>
      </div>

      {/* Danh sách các mục đã ghim */}
      <div className="space-y-1.5">
        {items.map((item, idx) => {
          const isTaskType = !('type' in item) || item.type === 'task';
          const task = isTaskType ? (item as any).task : item.parentTask;
          const project = item.project;
          const subtask = !isTaskType ? (item as any).subtask : null;

          const itemId = isTaskType ? `pin_task_${task.id}` : `pin_sub_${subtask.id}`;
          const title = isTaskType ? task.title : subtask.title;
          const isDone = isTaskType
            ? isDoneStatus(task.status, statuses)
            : subtask.status
            ? isDoneStatus(subtask.status, statuses)
            : subtask.completed;

          const recurrence = isTaskType ? task.recurrence : subtask?.recurrence;
          const recurrenceStreak = isTaskType ? task.recurrenceStreak : subtask?.recurrenceStreak;
          const scheduleBadge = isTaskType
            ? formatScheduleBadge(task.reminderAt, task.deadline, new Date(), language)
            : { status: 'none', label: '', isOverdue: false };

          // Danh sách subtasks con hiển thị dưới mục ghim
          const subs: SubTask[] = isTaskType
            ? task.subtasks || []
            : subtask?.subtasks || [];
          const hasSubs = subs.length > 0;
          const isSubsOpen = Boolean(expandedPinnedSubs[itemId]);
          const stats = hasSubs ? countArrayLeafSubtasks(subs) : { total: 0, completed: 0 };

          return (
            <div
              key={`${itemId}_${idx}`}
              className={`rounded-lg border transition-colors overflow-hidden ${
                isDone
                  ? 'border-slate-200/60 dark:border-slate-800 bg-white/60 dark:bg-[#161b22]/50 text-slate-400 dark:text-slate-500'
                  : 'bg-white dark:bg-[#161b22] border-slate-200/90 dark:border-slate-800 shadow-2xs text-slate-800 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Item Header Row - Single-line, fixed min-height, zero layout shift */}
              <div className="flex items-center gap-1.5 py-1 px-2 sm:px-2.5 min-h-[34px] flex-nowrap w-full overflow-hidden">
                {/* Cột cố định 16px: Nút dropdown sổ/gập việc con hoặc chấm căn lề */}
                {hasSubs ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSubExpand(itemId);
                    }}
                    className="w-4 h-4 text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 flex items-center justify-center cursor-pointer shrink-0 transition-colors rounded hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
                    title={isSubsOpen ? t.pinned.collapseSubtasks : `${t.pinned.expandSubtasks} (${stats.total})`}
                    aria-label={isSubsOpen ? t.pinned.collapseSubtasks : t.pinned.expandSubtasks}
                  >
                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                        isSubsOpen ? 'rotate-90 text-slate-800 dark:text-slate-200' : ''
                      }`}
                      strokeWidth={2}
                    />
                  </button>
                ) : (
                  <div className="w-4 h-4 shrink-0 flex items-center justify-center" aria-hidden="true">
                    <span className="w-1 h-1 rounded-full bg-amber-400 dark:bg-amber-500" />
                  </div>
                )}

                {/* Checkbox */}
                <button
                  type="button"
                  onClick={() => {
                    if (isTaskType) {
                      onToggleTaskDone(project.id, task.id, !isDone);
                    } else if (onToggleSubTask) {
                      onToggleSubTask(project.id, task.id, subtask.id, !isDone);
                    }
                  }}
                  className="shrink-0 cursor-pointer p-0.5 -m-0.5 rounded-full flex items-center justify-center"
                  aria-label={isDone ? 'Mark undone' : 'Mark done'}
                >
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                      isDone
                        ? 'bg-[#34c759] border-[#34c759] text-white'
                        : 'border-slate-300 dark:border-slate-600 hover:border-slate-600 dark:hover:border-slate-400'
                    }`}
                  >
                    {isDone && <Check className="w-2.5 h-2.5 shrink-0" strokeWidth={2.5} />}
                  </div>
                </button>

                {/* Tiêu đề & Metadata trên cùng 1 hàng (không nhảy dòng) */}
                <div className="flex-1 min-w-0 flex items-center gap-1.5 flex-nowrap overflow-hidden pr-1">
                  <div
                    onClick={() => {
                      if (isTaskType && onOpenDetail) onOpenDetail(task, project.id);
                    }}
                    className={`text-[13px] leading-snug font-normal truncate min-w-0 ${isTaskType ? 'cursor-pointer hover:text-slate-950 dark:hover:text-white' : ''} transition-colors ${
                      isDone ? 'line-through text-slate-400 dark:text-slate-500' : ''
                    }`}
                    title={isTaskType ? t.pinned.viewDetails : title}
                  >
                    <FormattedTaskText text={title} isDone={isDone} />
                  </div>

                  {/* Metadata Badges (shrink-0, không xuống dòng) */}
                  <div className="flex items-center gap-1 shrink-0 flex-nowrap">
                    <span
                      className="hidden sm:inline-flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded font-medium max-w-[140px] truncate shrink-0 whitespace-nowrap"
                      title={project.name}
                    >
                      <Folder className="w-2.5 h-2.5 shrink-0 text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
                      <span className="truncate">{project.name}</span>
                    </span>

                    {recurrence && (
                      <RecurrenceBadge
                        recurrence={recurrence}
                        recurrenceStreak={recurrenceStreak}
                        isDone={isDone}
                      />
                    )}

                    {scheduleBadge.status !== 'none' && onOpenSchedule && isTaskType && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenSchedule(task, project);
                        }}
                        className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer shrink-0 font-medium whitespace-nowrap ${
                          scheduleBadge.isOverdue
                            ? 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-800/60'
                            : scheduleBadge.status === 'today'
                            ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-800/60'
                            : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/70'
                        }`}
                        title={scheduleBadge.label}
                      >
                        <Clock className="w-2.5 h-2.5 shrink-0" strokeWidth={1.5} />
                        <span>{scheduleBadge.label}</span>
                      </button>
                    )}

                    {(isTaskType ? task.snoozeUntil : subtask.snoozeUntil) && (() => {
                      const snoozeVal = isTaskType ? task.snoozeUntil : subtask.snoozeUntil;
                      const countdown = formatSnoozeCountdown(snoozeVal, language);
                      if (!countdown) return null;
                      return (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenAnkiSrs) {
                              onOpenAnkiSrs(
                                isTaskType
                                  ? task
                                  : ({
                                      id: subtask.id,
                                      title: subtask.title,
                                      status: subtask.status || (subtask.completed ? 'done' : 'todo'),
                                      subtasks: subtask.subtasks || [],
                                      snoozeLevel: subtask.snoozeLevel,
                                      snoozeUntil: subtask.snoozeUntil,
                                      isPinned: subtask.isPinned,
                                    } as Task),
                                project.id,
                                isTaskType ? undefined : task.id
                              );
                            }
                          }}
                          className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer shrink-0 font-medium whitespace-nowrap ${
                            countdown.isDue
                              ? 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-800/60 hover:bg-rose-100/80'
                              : 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-800/60 hover:bg-amber-100/80'
                          }`}
                          title={`${snoozeVal} • Nhấn để đổi chu kỳ nhắc lặp (Anki SRS)`}
                        >
                          <RotateCcw className="w-2.5 h-2.5 shrink-0" strokeWidth={1.75} />
                          <span>{countdown.text}</span>
                        </button>
                      );
                    })()}

                    {isTaskType && Boolean(task.focusedMinutes && task.focusedMinutes > 0) && (
                      <span className="hidden sm:inline-flex items-center text-[10px] font-mono tabular-nums text-amber-600 dark:text-amber-400 px-1 py-0.5 shrink-0 whitespace-nowrap">
                        {task.focusedMinutes}m
                      </span>
                    )}

                    {hasSubs && (
                      <button
                        type="button"
                        onClick={() => toggleSubExpand(itemId)}
                        className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer shrink-0 font-mono tabular-nums whitespace-nowrap ${
                          isSubsOpen
                            ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100 font-medium'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 font-medium'
                        }`}
                        title={isSubsOpen ? t.pinned.collapseSubtasks : t.pinned.expandSubtasks}
                      >
                        <span>
                          {stats.completed}/{stats.total}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Action Buttons: Basic icons w-6 h-6 */}
                <div className="shrink-0 flex items-center gap-0.5 flex-nowrap">
                  {isTaskType && !isDone && onStartFocusTask && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartFocusTask(task, project);
                      }}
                      className={`w-6 h-6 rounded cursor-pointer shrink-0 transition-colors hidden sm:inline-flex items-center justify-center ${
                        activeFocusTaskId === task.id
                          ? 'text-amber-600 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-950/50'
                          : 'text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title={language === 'vi' ? 'Chạy đồng hồ Focus Pomodoro (25 phút)' : 'Start 25m Focus Pomodoro'}
                    >
                      <Play className="w-3 h-3 shrink-0 fill-current" strokeWidth={1.5} />
                    </button>
                  )}

                  {onOpenDetail && isTaskType && (
                    <button
                      type="button"
                      onClick={() => onOpenDetail(task, project.id)}
                      className="w-6 h-6 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer rounded shrink-0 transition-colors hidden sm:inline-flex items-center justify-center"
                      title={t.pinned.viewDetails}
                      aria-label={t.pinned.viewDetails}
                    >
                      <Eye className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                    </button>
                  )}

                  {/* Nút thêm việc con (+) chuẩn basic như các icon khác */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isSubsOpen) toggleSubExpand(itemId);
                      setAddingToId(addingToId === itemId ? null : itemId);
                    }}
                    className="w-6 h-6 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer shrink-0 transition-colors inline-flex items-center justify-center"
                    title={t.pinned.addSubtask}
                    aria-label={t.pinned.addSubtask}
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                  </button>

                  {onOpenSchedule && isTaskType && (
                    <button
                      type="button"
                      onClick={() => onOpenSchedule(task, project)}
                      className={`w-6 h-6 rounded cursor-pointer shrink-0 transition-colors hidden sm:inline-flex items-center justify-center ${
                        scheduleBadge.status !== 'none'
                          ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                          : 'text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title={scheduleBadge.status !== 'none' ? `${t.schedule.modalTitle}: ${scheduleBadge.label}` : t.schedule.modalTitle}
                      aria-label={t.schedule.modalTitle}
                    >
                      <Calendar className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                    </button>
                  )}

                  <TaskStatusButton
                    status={isTaskType ? task.status : (subtask.status || (subtask.completed ? 'done' : 'todo'))}
                    statuses={statuses}
                    onChangeStatus={(next) => {
                      if (isTaskType && onChangeStatus) {
                        onChangeStatus(project.id, task.id, next as any);
                      } else if (!isTaskType && onChangeSubtaskStatus) {
                        onChangeSubtaskStatus(project.id, task.id, subtask.id, next, next === 'done');
                      }
                    }}
                    size="sm"
                  />

                  <button
                    type="button"
                    onClick={(e) => {
                      if (isTaskType) {
                        onTogglePinTask(project.id, task.id, e);
                      } else if (onTogglePinSubTask) {
                        onTogglePinSubTask(project.id, task.id, subtask.id);
                      }
                    }}
                    className="w-6 h-6 text-amber-600 dark:text-amber-400 hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer rounded shrink-0 transition-colors inline-flex items-center justify-center"
                    title={t.pinned.unpin}
                    aria-label={t.pinned.unpin}
                  >
                    <Pin className="w-3.5 h-3.5 shrink-0 fill-current" />
                  </button>
                </div>
              </div>

              {/* Chi tiết các bước con bên dưới việc được ghim (Hiển thị phân cấp đệ quy đầy đủ) */}
              {((hasSubs && isSubsOpen) || addingToId === itemId) && (
                <div className="px-3 pb-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-black/20 space-y-1">
                  <PinnedSubtaskBranch
                    subs={subs}
                    projectId={project.id}
                    parentTaskId={task.id}
                    statuses={statuses}
                    depth={0}
                    expandedPinnedSubs={expandedPinnedSubs}
                    onToggleExpandSub={toggleSubExpand}
                    onToggleSubTask={onToggleSubTask}
                    onDeleteSubTask={onDeleteSubTask}
                    onAddSubTask={onAddSubTask}
                    onTogglePinSubTask={onTogglePinSubTask}
                    newSubInputs={newSubInputs}
                    onNewSubInputChange={(key, val) =>
                      setNewSubInputs((prev) => ({ ...prev, [key]: val }))
                    }
                    addingToId={addingToId}
                    onSetAddingToId={setAddingToId}
                  />

                  {/* Input thêm nhanh việc con trực tiếp dưới gốc của mục ghim (cố định chiều cao h-7) */}
                  {onAddSubTask && (
                    <div className="h-7 flex items-center w-full overflow-hidden">
                      {addingToId === itemId ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleAddSub(project.id, task.id, !isTaskType ? subtask.id : null);
                          }}
                          className="h-7 flex items-center gap-1.5 flex-nowrap w-full overflow-hidden"
                        >
                          <input
                            type="text"
                            value={newSubInputs[!isTaskType ? subtask.id : task.id] || ''}
                            onChange={(e) =>
                              setNewSubInputs((prev) => ({
                                ...prev,
                                [!isTaskType ? subtask.id : task.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') setAddingToId(null);
                            }}
                            autoFocus
                            placeholder={t.taskDetail.newSubtaskPlaceholder}
                            className="flex-1 min-w-0 h-6.5 text-xs px-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md outline-none text-slate-900 dark:text-slate-100"
                          />
                          <button
                            type="submit"
                            className="h-6.5 px-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium rounded-md cursor-pointer shrink-0 whitespace-nowrap"
                          >
                            {t.pinned.save}
                          </button>
                          <button
                            type="button"
                            onClick={() => setAddingToId(null)}
                            className="h-6.5 px-1.5 text-xs text-slate-400 hover:text-slate-600 cursor-pointer shrink-0 whitespace-nowrap"
                          >
                            {t.pinned.cancel}
                          </button>
                        </form>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setAddingToId(itemId)}
                          className="h-7 flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 px-1 cursor-pointer transition-colors whitespace-nowrap"
                        >
                          <Plus className="w-3 h-3 shrink-0" />
                          <span>{t.pinned.addSubtask}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
