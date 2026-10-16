import React, { useRef, useState } from 'react';
import {
  Check,
  Plus,
  ChevronRight,
  MoreHorizontal,
  GripVertical,
  Pin,
  Eye,
  Calendar,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { FormattedTaskText } from '../utils/formatters';
import { getTaskSubtaskStats } from '../utils/subtaskTree';
import { isDoneStatus } from '../utils/statusCategory';
import { formatScheduleBadge } from '../utils/scheduleHelper';
import { formatSnoozeCountdown } from '../utils/spacedSnooze';
import { SubtaskList } from './SubtaskList';
import { TaskMoreMenu } from './TaskMoreMenu';
import { TaskStatusButton } from './TaskStatusButton';
import { RecurrenceBadge } from './RecurrenceBadge';
import { TaskItemProps } from '../types';
import { Task } from '../../../types';
import { useLanguage } from '../../../i18n';

export type { TaskItemProps };

export function TaskItem({
  projectId, task, taskIndex, totalProjectTasks,
  isDragging, isOver, dragOverPosition,
  onDragStart, onDragOver, onDrop, onDragEnd,
  expandedTaskId, onToggleExpandTask,
  onToggleTaskDone, onChangeStatus,
  statuses, onAddCustomStatus, onDeleteCustomStatus, onChangeSubtaskStatus,
  activeMenuTaskId, onSetActiveMenuTaskId,
  onCopyTask, onTogglePinTask, onOpenAddSubtask,
  onMoveTask, onDeleteTask,
  onSetTaskRecurrence, onSetSubTaskRecurrence, onManuallyResetRecurring,
  onManuallyResetRecurringSubTask,
  isSubOpen, onToggleExpandSubtasks, isAddingSub,
  subtaskFilterMode, onSubtaskFilterModeChange,
  isCompletedSubExpanded, onToggleCompletedSubExpanded,
  showAllActiveSubs, onToggleShowAllActiveSubs,
  expandedSubTaskId, onToggleExpandedSubTaskId,
  onToggleSubTask, onDeleteSubTask,
  newSubTaskTitle, onNewSubTaskTitleChange,
  onAddSubTask, onCloseSubtaskInput,
  onEditTaskTitle, onEditSubtaskTitle, onReorderSubtask,
  onOpenBatchPasteForTask,
  onOpenDetail,
  onOpenSchedule,
  onTogglePinSubTask,
  onOpenAnkiSrs,
}: TaskItemProps) {
  const { t, language } = useLanguage();
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const isDone = isDoneStatus(task.status, statuses);
  const hasSubs = task.subtasks && task.subtasks.length > 0;
  const stats = getTaskSubtaskStats(task);
  const totalSubs = stats.leafTotal;
  const doneCount = stats.leafDone;
  const pendingCount = totalSubs - doneCount;
  const scheduleBadge = formatScheduleBadge(task.reminderAt, task.deadline);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, projectId, taskIndex)}
      onDragOver={(e) => onDragOver(e, projectId, taskIndex)}
      onDrop={(e) => onDrop(e, projectId, taskIndex)}
      onDragEnd={onDragEnd}
      className={`space-y-1 relative transition-all ${
        isDragging ? 'opacity-30 scale-[0.98]' : ''
      }`}
    >
      {/* Drop indicator phía trên */}
      {isOver && dragOverPosition === 'top' && (
        <div className="h-0.5 w-full bg-slate-900 dark:bg-slate-100 rounded-full my-0.5" />
      )}

      {/* Item container - Single-line, fixed min-height, zero layout shift */}
      <div
        data-task-card="true"
        className={`group flex items-center gap-1.5 py-1 px-2 sm:px-2.5 min-h-[34px] rounded-lg border transition-colors duration-150 flex-nowrap w-full overflow-hidden ${
          isDone
            ? 'bg-slate-50/60 dark:bg-[#161b22]/50 border-slate-100/90 dark:border-slate-800/80 text-slate-400 dark:text-slate-500'
            : 'bg-white dark:bg-[#161b22] border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs text-slate-800 dark:text-slate-100'
        } ${isDragging ? 'border-dashed border-slate-400 dark:border-slate-600' : ''}`}
      >
        {/* GripVertical - Hỗ trợ kéo thả trên cả Desktop & Mobile */}
        <div
          data-drag-handle="true"
          className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 transition-colors select-none shrink-0 flex items-center justify-center"
          title="Kéo thả để sắp xếp lại thứ tự công việc"
          aria-label="Kéo thả sắp xếp thứ tự"
        >
          <GripVertical className="w-3.5 h-3.5 shrink-0 pointer-events-none" strokeWidth={1.5} aria-hidden="true" />
        </div>

        {/* Cột cố định 16px: Nút sổ/gập subtasks hoặc chấm căn lề cố định (chống xê dịch checkbox) */}
        {hasSubs ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpandSubtasks(task.id);
            }}
            className="w-4 h-4 text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 flex items-center justify-center cursor-pointer shrink-0 transition-colors rounded hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
            title={isSubOpen ? t.pinned.collapseSubtasks : `${t.pinned.expandSubtasks} (${totalSubs})`}
            aria-label={isSubOpen ? t.pinned.collapseSubtasks : t.pinned.expandSubtasks}
          >
            <ChevronRight
              className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                isSubOpen ? 'rotate-90 text-slate-800 dark:text-slate-200' : ''
              }`}
              strokeWidth={2}
            />
          </button>
        ) : (
          <div className="w-4 h-4 shrink-0 flex items-center justify-center" aria-hidden="true">
            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
          </div>
        )}

        {/* Checkbox chuẩn Apple / Linear */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleTaskDone(projectId, task.id, !isDone);
          }}
          className="shrink-0 cursor-pointer p-0.5 -m-0.5 rounded-full flex items-center justify-center"
          aria-label={isDone ? 'Đánh dấu chưa xong' : 'Đánh dấu đã xong'}
        >
          <div
            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
              isDone
                ? 'bg-[#34c759] border-[#34c759] text-white'
                : 'border-slate-300 dark:border-slate-600 hover:border-slate-600 dark:hover:border-slate-400'
            }`}
          >
            {isDone && <Check className="w-2.5 h-2.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />}
          </div>
        </button>

        {/* Khu vực tiêu đề chính + micro badges trên cùng 1 hàng (không nhảy dòng) */}
        <div className="flex-1 min-w-0 flex items-center gap-1.5 flex-nowrap overflow-hidden pr-1">
          {isEditingTitle ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onFocus={(e) => e.target.select()}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (editTitle.trim() && onEditTaskTitle) onEditTaskTitle(projectId, task.id, editTitle);
                  setIsEditingTitle(false);
                } else if (e.key === 'Escape') {
                  setEditTitle(task.title);
                  setIsEditingTitle(false);
                }
              }}
              onBlur={() => {
                if (editTitle.trim() && onEditTaskTitle) onEditTaskTitle(projectId, task.id, editTitle);
                setIsEditingTitle(false);
              }}
              autoFocus
              className="flex-1 min-w-0 h-6 text-[13px] leading-none px-1.5 bg-white dark:bg-[#161b22] border border-slate-300 dark:border-slate-600 rounded focus:border-slate-900 dark:focus:border-slate-100 outline-none text-slate-900 dark:text-slate-100"
            />
          ) : (
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenDetail) {
                  onOpenDetail(task, projectId);
                } else {
                  onToggleExpandTask(expandedTaskId === task.id ? null : task.id);
                }
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditTitle(task.title);
                setIsEditingTitle(true);
              }}
              className={`text-[13px] leading-snug select-text font-normal cursor-pointer hover:text-slate-950 dark:hover:text-white transition-colors min-w-0 ${
                expandedTaskId === task.id ? 'break-words' : 'truncate'
              }`}
              title="Nhấp để xem chi tiết đầy đủ (hoặc nhấp đúp để chỉnh sửa tiêu đề)"
            >
              <FormattedTaskText text={task.title} isDone={isDone} />
            </div>
          )}

          {!isEditingTitle && (
            <div className="flex items-center gap-1 shrink-0 flex-nowrap">
              {task.isPinned && (
                <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/50 px-1.5 py-0.5 rounded font-medium shrink-0 whitespace-nowrap">
                  <Pin className="w-2.5 h-2.5 shrink-0 fill-current text-amber-600 dark:text-amber-400" strokeWidth={1.5} aria-hidden="true" />
                  <span className="hidden sm:inline">Ưu tiên</span>
                </span>
              )}

              {task.recurrence && (
                <RecurrenceBadge
                  recurrence={task.recurrence}
                  recurrenceStreak={task.recurrenceStreak}
                  isDone={isDone}
                  onReset={() => onManuallyResetRecurring?.(projectId, task.id)}
                />
              )}

              {scheduleBadge.status !== 'none' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenSchedule?.(task, projectId);
                  }}
                  className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer shrink-0 font-medium whitespace-nowrap select-none ${
                    scheduleBadge.isOverdue
                      ? 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-800/60 hover:bg-rose-100/70'
                      : scheduleBadge.status === 'today'
                      ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-800/60 hover:bg-amber-100/70'
                      : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/70 hover:bg-slate-200/80'
                  }`}
                  title="Nhấp để thay đổi lịch hẹn hoặc hủy nhắc"
                >
                  <Clock className="w-2.5 h-2.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                  <span>{scheduleBadge.label}</span>
                </button>
              )}

              {task.snoozeUntil && (() => {
                const countdown = formatSnoozeCountdown(task.snoozeUntil, language);
                if (!countdown) return null;
                return (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onOpenAnkiSrs) onOpenAnkiSrs(task, projectId);
                    }}
                    className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border font-medium shrink-0 whitespace-nowrap cursor-pointer transition-colors ${
                      countdown.isDue
                        ? 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-800/60 hover:bg-rose-100/80'
                        : 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-800/60 hover:bg-amber-100/80'
                    }`}
                    title={`${t.dailyFocus?.snoozeUntilLabel || 'Hoãn đến:'} ${task.snoozeUntil} • Nhấn để đổi chu kỳ`}
                  >
                    <RotateCcw className="w-2.5 h-2.5 shrink-0" strokeWidth={1.75} />
                    <span>{countdown.text}</span>
                  </button>
                );
              })()}

              {hasSubs && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleExpandSubtasks(task.id);
                  }}
                  className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer shrink-0 whitespace-nowrap select-none font-mono tabular-nums ${
                    isSubOpen
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100 font-medium'
                      : pendingCount > 0
                      ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200/90 dark:border-slate-700/80 hover:bg-slate-200/80 dark:hover:bg-slate-700 font-medium'
                      : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/50 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/30'
                  }`}
                  title={isSubOpen ? t.pinned.collapseSubtasks : t.pinned.expandSubtasks}
                  aria-label={isSubOpen ? t.pinned.collapseSubtasks : t.pinned.expandSubtasks}
                >
                  <span>{doneCount}/{totalSubs}</span>
                  {pendingCount === 0 && (
                    <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Các icon thao tác chuẩn basic, đồng nhất kích thước w-6 h-6, không xê dịch */}
        <div className="shrink-0 flex items-center gap-0.5 flex-nowrap">
          {onOpenDetail && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail(task, projectId);
              }}
              className="w-6 h-6 text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer shrink-0 transition-colors hidden sm:inline-flex items-center justify-center"
              title={t.taskMenu?.viewDetail || 'Xem chi tiết & Ghi chú'}
              aria-label={t.taskMenu?.viewDetail || 'Xem chi tiết'}
            >
              <Eye className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
            </button>
          )}

          {/* Nút thêm nhanh việc con (+) chuẩn basic như các icon khác */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenAddSubtask(task.id);
            }}
            className="w-6 h-6 text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer shrink-0 transition-colors inline-flex items-center justify-center"
            title={t.taskMenu?.addSubtask || 'Thêm việc con'}
            aria-label={t.taskMenu?.addSubtask || 'Thêm việc con'}
          >
            <Plus className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
          </button>

          {/* Nút Lên lịch nhắc thông minh (Calendar) */}
          {onOpenSchedule && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenSchedule(task, projectId);
              }}
              className={`w-6 h-6 rounded cursor-pointer shrink-0 transition-colors hidden sm:inline-flex items-center justify-center ${
                scheduleBadge.status !== 'none'
                  ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                  : 'text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={
                scheduleBadge.status !== 'none'
                  ? `${t.schedule.modalTitle}: ${scheduleBadge.label}`
                  : (t.taskMenu?.schedule || t.schedule.modalTitle)
              }
              aria-label={t.taskMenu?.schedule || t.schedule.modalTitle}
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
            </button>
          )}

          <TaskStatusButton
            status={task.status}
            statuses={statuses}
            onChangeStatus={(next) => {
              const def = statuses.find((s) => s.id === next);
              const isDoneCat = def?.category === 'done' || next === 'done';
              onChangeStatus(projectId, task.id, next, isDoneCat);
            }}
            onAddCustomStatus={onAddCustomStatus}
            onDeleteCustomStatus={onDeleteCustomStatus}
          />

          {/* Menu tùy chọn (···) */}
          <div className="relative shrink-0 flex items-center">
            <button
              ref={moreButtonRef}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSetActiveMenuTaskId(activeMenuTaskId === task.id ? null : task.id);
              }}
              className={`w-6 h-6 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer shrink-0 transition-colors inline-flex items-center justify-center ${
                activeMenuTaskId === task.id ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200' : ''
              }`}
              title="Tùy chọn khác"
              aria-label="Tùy chọn khác"
            >
              <MoreHorizontal className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            </button>

            <TaskMoreMenu
              task={task} projectId={projectId}
              taskIndex={taskIndex} totalProjectTasks={totalProjectTasks}
              isOpen={activeMenuTaskId === task.id}
              onClose={() => onSetActiveMenuTaskId(null)}
              triggerRef={moreButtonRef}
              onStartEdit={() => { setEditTitle(task.title); setIsEditingTitle(true); }}
              onCopyTask={onCopyTask} onTogglePinTask={onTogglePinTask}
              onOpenAddSubtask={onOpenAddSubtask} onMoveTask={onMoveTask} onDeleteTask={onDeleteTask}
              onOpenBatchPasteSubtasks={onOpenBatchPasteForTask ? () => {
                onSetActiveMenuTaskId(null);
                onOpenBatchPasteForTask(projectId, task.id, null, task.title);
              } : undefined}
              onSetRecurrence={onSetTaskRecurrence}
              onManuallyResetRecurring={onManuallyResetRecurring}
              onOpenDetail={onOpenDetail ? () => onOpenDetail(task, projectId) : undefined}
              onOpenSchedule={onOpenSchedule ? () => onOpenSchedule(task, projectId) : undefined}
              onOpenAnkiSrs={onOpenAnkiSrs ? () => onOpenAnkiSrs(task, projectId) : undefined}
            />
          </div>
        </div>
      </div>

      {/* Sub-tasks lồng nhau */}
      {((isSubOpen && totalSubs > 0) || isAddingSub) && (
        <div className="ml-3 sm:ml-4 pl-2 sm:pl-2.5 border-l border-slate-200/90 dark:border-slate-800 my-1 space-y-1 pt-0.5">
          <SubtaskList
            projectId={projectId} task={task} filterMode={subtaskFilterMode}
            onFilterModeChange={onSubtaskFilterModeChange} isCompletedExpanded={isCompletedSubExpanded}
            onToggleCompletedExpanded={onToggleCompletedSubExpanded} showAllActive={showAllActiveSubs}
            onToggleShowAllActive={onToggleShowAllActiveSubs} expandedSubTaskId={expandedSubTaskId}
            onToggleExpandedSubTaskId={onToggleExpandedSubTaskId} onToggleSubTask={onToggleSubTask}
            onDeleteSubTask={onDeleteSubTask} isInputActive={isAddingSub}
            newSubTaskTitle={newSubTaskTitle} onNewSubTaskTitleChange={onNewSubTaskTitleChange}
            onAddSubTask={onAddSubTask} onCloseInput={onCloseSubtaskInput} onEditSubtaskTitle={onEditSubtaskTitle}
            onReorderSubtask={onReorderSubtask}
            statuses={statuses}
            onAddCustomStatus={onAddCustomStatus}
            onDeleteCustomStatus={onDeleteCustomStatus}
            onChangeSubtaskStatus={onChangeSubtaskStatus}
            onOpenBatchPasteForTask={onOpenBatchPasteForTask}
            onSetSubTaskRecurrence={onSetSubTaskRecurrence}
            onManuallyResetRecurringSubTask={onManuallyResetRecurringSubTask}
            onTogglePinSubTask={onTogglePinSubTask}
            onOpenAnkiSrsForSubtask={onOpenAnkiSrs ? (sub, projId, tId) => {
              onOpenAnkiSrs({
                id: sub.id,
                title: sub.title,
                status: sub.status || (sub.completed ? 'done' : 'todo'),
                subtasks: sub.subtasks || [],
                snoozeLevel: sub.snoozeLevel,
                snoozeUntil: sub.snoozeUntil,
                isPinned: sub.isPinned,
              } as Task, projId, tId);
            } : undefined}
            onOpenParentDetail={onOpenDetail ? () => onOpenDetail(task, projectId) : undefined}
          />
        </div>
      )}

      {/* Drop indicator phía dưới */}
      {isOver && dragOverPosition === 'bottom' && (
        <div className="h-0.5 w-full bg-slate-900 dark:bg-slate-100 rounded-full my-0.5" />
      )}
    </div>
  );
}
