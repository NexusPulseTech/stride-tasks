import React, { useRef, useState } from 'react';
import {
  Check,
  Plus,
  ChevronRight,
  MoreHorizontal,
  GripVertical,
  Pin,
} from 'lucide-react';
import { FormattedTaskText } from '../utils/formatters';
import { getTaskSubtaskStats } from '../utils/subtaskTree';
import { SubtaskList } from './SubtaskList';
import { TaskMoreMenu } from './TaskMoreMenu';
import { TaskStatusButton } from './TaskStatusButton';
import { TaskItemProps } from '../types';

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
  isSubOpen, onToggleExpandSubtasks, isAddingSub,
  subtaskFilterMode, onSubtaskFilterModeChange,
  isCompletedSubExpanded, onToggleCompletedSubExpanded,
  showAllActiveSubs, onToggleShowAllActiveSubs,
  expandedSubTaskId, onToggleExpandedSubTaskId,
  onToggleSubTask, onDeleteSubTask,
  newSubTaskTitle, onNewSubTaskTitleChange,
  onAddSubTask, onCloseSubtaskInput,
  onEditTaskTitle, onEditSubtaskTitle, onReorderSubtask,
}: TaskItemProps) {
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const isDone = task.status === 'done';
  const hasSubs = task.subtasks && task.subtasks.length > 0;
  const stats = getTaskSubtaskStats(task);
  const totalSubs = stats.leafTotal;
  const doneCount = stats.leafDone;
  const pendingCount = totalSubs - doneCount;

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

      {/* Item container */}
      <div
        onClick={() => {
          if (hasSubs) onToggleExpandSubtasks(task.id);
        }}
        className={`group flex items-start gap-1.5 py-1.5 px-2 sm:px-2.5 rounded-lg border transition-all duration-150 flex-nowrap w-full ${
          hasSubs ? 'cursor-pointer' : ''
        } ${
          isDone
            ? 'bg-slate-50/60 dark:bg-[#161b22]/50 border-slate-100/90 dark:border-slate-800/80 text-slate-400 dark:text-slate-500'
            : 'bg-white dark:bg-[#161b22] border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs text-slate-800 dark:text-slate-100'
        } ${isDragging ? 'border-dashed border-slate-400 dark:border-slate-600' : ''}`}
      >
        {/* GripVertical 6 chấm trên Desktop */}
        <div
          data-drag-handle="true"
          className="mt-0.5 cursor-grab active:cursor-grabbing p-0.5 text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 transition-colors select-none hidden sm:block shrink-0"
          title="Kéo thả để sắp xếp lại thứ tự"
          aria-label="Kéo thả sắp xếp thứ tự"
        >
          <GripVertical className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
        </div>

        {/* Nút Navigation sổ/gập subtasks chuẩn Notion */}
        {hasSubs ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpandSubtasks(task.id);
            }}
            className="w-4.5 h-4.5 mt-0.5 text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 flex items-center justify-center cursor-pointer shrink-0 transition-colors rounded hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
            title={isSubOpen ? 'Thu gọn việc con' : `Mở rộng ${totalSubs} việc con (Notion Navigation)`}
            aria-label={isSubOpen ? 'Thu gọn việc con' : 'Mở rộng việc con'}
          >
            <ChevronRight
              className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                isSubOpen ? 'rotate-90 text-slate-800 dark:text-slate-200' : ''
              }`}
              strokeWidth={2}
            />
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenAddSubtask(task.id);
            }}
            className="w-4.5 h-4.5 mt-0.5 text-slate-300 dark:text-slate-600 hover:text-slate-800 dark:hover:text-slate-100 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer shrink-0 transition-all rounded hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
            title="Thêm việc con cho mục này"
            aria-label="Thêm việc con"
          >
            <Plus className="w-3 h-3 shrink-0" strokeWidth={2} />
          </button>
        )}

        {/* Checkbox chuẩn Apple / Linear */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleTaskDone(projectId, task.id, !isDone);
          }}
          className="mt-0.5 shrink-0 cursor-pointer p-0.5 -m-0.5 rounded-full"
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

        {/* Khu vực tiêu đề chính + metadata */}
        <div className="flex-1 min-w-0 pr-1">
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
              className="w-full text-[13px] leading-snug px-1.5 py-0.5 bg-white dark:bg-[#161b22] border border-slate-300 dark:border-slate-600 rounded focus:border-slate-900 dark:focus:border-slate-100 outline-none text-slate-900 dark:text-slate-100 shadow-2xs"
            />
          ) : (
            <div
              onClick={(e) => {
                e.stopPropagation();
                setEditTitle(task.title);
                setIsEditingTitle(true);
              }}
              className={`text-[13px] leading-snug select-text font-normal cursor-text hover:text-slate-950 dark:hover:text-white transition-colors ${
                expandedTaskId === task.id ? '' : 'line-clamp-2'
              }`}
              title="Chạm hoặc nhấp chuột vào chữ để chỉnh sửa (bấm ra ngoài để đóng/mở việc con)"
            >
              <FormattedTaskText text={task.title} isDone={isDone} />
            </div>
          )}

          {/* Micro indicators bên dưới tiêu đề */}
          <div className="flex items-center gap-1.5 mt-1 flex-nowrap overflow-hidden">
            {task.isPinned && (
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-medium shrink-0 whitespace-nowrap">
                <Pin className="w-2.5 h-2.5 shrink-0 fill-current text-slate-500 dark:text-slate-400" strokeWidth={1.5} aria-hidden="true" />
                <span>Ưu tiên</span>
              </span>
            )}
            {hasSubs && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpandSubtasks(task.id);
                }}
                className={`inline-flex items-center gap-1 text-[10.5px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer shrink-0 whitespace-nowrap select-none ${
                  isSubOpen
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100 font-medium shadow-2xs'
                    : pendingCount > 0
                    ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200/90 dark:border-slate-700/80 hover:bg-slate-200/80 dark:hover:bg-slate-700 font-medium'
                    : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/50 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/30'
                }`}
                title={isSubOpen ? 'Thu gọn việc con' : 'Xem toàn bộ việc con'}
                aria-label={isSubOpen ? 'Thu gọn việc con' : 'Xem toàn bộ việc con'}
              >
                <ChevronRight
                  className={`w-2.5 h-2.5 shrink-0 transition-transform duration-200 ${
                    isSubOpen ? 'rotate-90' : ''
                  }`}
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <span className="tabular-nums">
                  {pendingCount > 0
                    ? `${pendingCount} cần làm · ${doneCount}/${totalSubs} xong`
                    : `${totalSubs}/${totalSubs} xong ✓`}
                </span>
              </button>
            )}
            {task.title.length > 70 && (
              <button
                type="button"
                onClick={() => onToggleExpandTask(expandedTaskId === task.id ? null : task.id)}
                className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer shrink-0"
              >
                {expandedTaskId === task.id ? 'Thu gọn' : '...'}
              </button>
            )}
          </div>
        </div>

        {/* Nút thêm nhanh việc con & Nút trạng thái & Menu */}
        <div className="shrink-0 flex items-center gap-1 flex-nowrap">
          {/* Nút thêm nhanh việc con trực tiếp - Không cần vào 3 chấm */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenAddSubtask(task.id);
            }}
            className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer shrink-0 transition-colors"
            title="Thêm nhanh việc con (+)"
            aria-label="Thêm việc con"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
          </button>

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
          <div className="relative shrink-0">
            <button
              ref={moreButtonRef}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSetActiveMenuTaskId(activeMenuTaskId === task.id ? null : task.id);
              }}
              className={`p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer shrink-0 transition-colors ${
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
            />
          </div>
        </div>
      </div>

      {/* Drop indicator phía dưới */}
      {isOver && dragOverPosition === 'bottom' && (
        <div className="h-0.5 w-full bg-slate-900 dark:bg-slate-100 rounded-full my-0.5" />
      )}

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
          />
        </div>
      )}
    </div>
  );
}
