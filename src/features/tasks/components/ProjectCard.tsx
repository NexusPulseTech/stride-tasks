import React, { useRef } from 'react';
import { Plus, ClipboardPaste, Check } from 'lucide-react';
import { Project, Task, StatusDefinition, RecurrenceType, FilterType } from '../../../types';
import { isDoneStatus } from '../utils/statusCategory';
import { TaskItem } from './TaskItem';
import { ProjectCardHeader } from './ProjectCardHeader';
import { useLanguage } from '../../../i18n';

export interface ProjectCardProps {
  project: Project;
  visibleTasks: Task[];
  search: string;
  filter: FilterType;
  isFocusMode: boolean;
  hideCompletedInAllView?: boolean;
  onToggleHideCompletedInAll?: () => void;
  onToggleExpand: (id: string) => void;
  onCopyProjectAsMarkdown: (project: Project, e: React.MouseEvent) => void;
  onOpenBatchPaste: (project: Project) => void;
  onOpenBatchPasteForTask?: (projId: string, taskId: string, parentSubId?: string | null, targetTitle?: string) => void;
  onDeleteProject: (id: string, e: React.MouseEvent) => void;
  taskInputValue: string;
  onTaskInputChange: (projId: string, val: string) => void;
  onAddTask: (projId: string, e?: React.FormEvent) => void;
  onTaskInputPaste: (projId: string, e: React.ClipboardEvent<HTMLInputElement>) => void;
  draggedItem: { projId: string; index: number } | null;
  dragOverItem: { projId: string; index: number; position: 'top' | 'bottom' } | null;
  onDragStart: (e: React.DragEvent, projId: string, index: number) => void;
  onDragOver: (e: React.DragEvent, projId: string, index: number) => void;
  onDrop: (e: React.DragEvent, projId: string, index: number) => void;
  onDragEnd: () => void;
  expandedTaskId: string | null;
  onToggleExpandTask: (id: string | null) => void;
  onToggleTaskDone: (projId: string, taskId: string, done: boolean) => void;
  onChangeStatus: (projId: string, taskId: string, status: string, isDoneCategory?: boolean) => void;
  statuses?: StatusDefinition[];
  onAddCustomStatus?: (label: string, category: 'todo' | 'doing' | 'done', color: string) => StatusDefinition | null;
  onDeleteCustomStatus?: (statusId: string) => void;
  onChangeSubtaskStatus?: (projId: string, taskId: string, subId: string, status: string, isDoneCategory?: boolean) => void;
  activeMenuTaskId: string | null;
  onSetActiveMenuTaskId: (id: string | null) => void;
  onCopyTask: (title: string) => void;
  onTogglePinTask: (projId: string, taskId: string, e: React.MouseEvent) => void;
  onOpenAddSubtask: (taskId: string) => void;
  onMoveTask: (projId: string, index: number, dir: 'up' | 'down', e: React.MouseEvent) => void;
  onDeleteTask: (projId: string, taskId: string) => void;
  onSetTaskRecurrence?: (projId: string, taskId: string, recurrence: RecurrenceType) => void;
  onSetSubTaskRecurrence?: (projId: string, taskId: string, subId: string, recurrence: RecurrenceType) => void;
  onManuallyResetRecurring?: (projId: string, taskId: string) => void;
  onManuallyResetRecurringSubTask?: (projId: string, taskId: string, subId: string) => void;
  expandedSubtasks: Record<string, boolean>;
  onToggleExpandSubtasks: (taskId: string) => void;
  activeSubTaskId: string | null;
  subtaskFilterMap: Record<string, 'active' | 'all' | 'completed'>;
  onSubtaskFilterModeChange: (taskId: string, mode: 'active' | 'all' | 'completed') => void;
  showCompletedSubs: Record<string, boolean>;
  onToggleCompletedSubExpanded: (taskId: string) => void;
  showAllActiveSubs: Record<string, boolean>;
  onToggleShowAllActiveSubs: (taskId: string, show: boolean) => void;
  expandedSubTaskId: string | null;
  onToggleExpandedSubTaskId: (id: string | null) => void;
  onToggleSubTask: (projId: string, taskId: string, subId: string, completed: boolean) => void;
  onDeleteSubTask: (projId: string, taskId: string, subId: string) => void;
  subInputs: Record<string, string>;
  onSubInputChange: (taskId: string, val: string) => void;
  onAddSubTask: (
    projId: string,
    taskId: string,
    title?: string,
    parentSubId?: string | null
  ) => void;
  onCloseSubtaskInput: () => void;
  onEditProjectName?: (id: string, newName: string) => void;
  onEditTaskTitle?: (projId: string, taskId: string, newTitle: string) => void;
  onEditSubtaskTitle?: (
    projId: string,
    taskId: string,
    subId: string,
    newTitle: string
  ) => void;
  onReorderSubtask?: (
    projId: string,
    taskId: string,
    sourceId: string,
    targetId: string,
    position: 'top' | 'bottom'
  ) => void;
  onOpenDetail?: (task: Task, projectId: string) => void;
  onOpenSchedule?: (task: Task, projectId: string) => void;
  onTogglePinSubTask?: (projId: string, taskId: string, subId: string) => void;
  onOpenAnkiSrs?: (task: Task, projectId: string) => void;
  onMoveProject?: (projId: string, direction: 'up' | 'down') => void;
  isFirstProject?: boolean;
  isLastProject?: boolean;
  isProjectDragging?: boolean;
  isProjectOver?: boolean;
  dragOverProjectPosition?: 'top' | 'bottom' | null;
  onProjectDragStart?: (e: React.DragEvent, projId: string) => void;
  onProjectDragOver?: (e: React.DragEvent, projId: string) => void;
  onProjectDrop?: (e: React.DragEvent, projId: string) => void;
  onProjectDragEnd?: () => void;
}

export function ProjectCard({
  project,
  visibleTasks,
  search,
  filter,
  isFocusMode,
  hideCompletedInAllView = false,
  onToggleHideCompletedInAll,
  onToggleExpand,
  onCopyProjectAsMarkdown,
  onOpenBatchPaste,
  onDeleteProject,
  taskInputValue,
  onTaskInputChange,
  onAddTask,
  onTaskInputPaste,
  draggedItem,
  dragOverItem,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  expandedTaskId,
  onToggleExpandTask,
  onToggleTaskDone,
  onChangeStatus,
  statuses = [],
  onAddCustomStatus = () => null,
  onDeleteCustomStatus = () => {},
  onChangeSubtaskStatus,
  activeMenuTaskId,
  onSetActiveMenuTaskId,
  onCopyTask,
  onTogglePinTask,
  onOpenAddSubtask,
  onMoveTask,
  onDeleteTask,
  onSetTaskRecurrence,
  onSetSubTaskRecurrence,
  onManuallyResetRecurring,
  onManuallyResetRecurringSubTask,
  expandedSubtasks,
  onToggleExpandSubtasks,
  activeSubTaskId,
  subtaskFilterMap,
  onSubtaskFilterModeChange,
  showCompletedSubs,
  onToggleCompletedSubExpanded,
  showAllActiveSubs,
  onToggleShowAllActiveSubs,
  expandedSubTaskId,
  onToggleExpandedSubTaskId,
  onToggleSubTask,
  onDeleteSubTask,
  subInputs,
  onSubInputChange,
  onAddSubTask,
  onCloseSubtaskInput,
  onEditProjectName,
  onEditTaskTitle,
  onEditSubtaskTitle,
  onReorderSubtask,
  onOpenBatchPasteForTask,
  onOpenDetail,
  onOpenSchedule,
  onTogglePinSubTask,
  onOpenAnkiSrs,
  onMoveProject,
  isFirstProject = false,
  isLastProject = false,
  isProjectDragging,
  isProjectOver,
  dragOverProjectPosition,
  onProjectDragStart,
  onProjectDragOver,
  onProjectDrop,
  onProjectDragEnd,
}: ProjectCardProps) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const tasks = project.tasks;
  const countDone = tasks.filter((t) => isDoneStatus(t.status, statuses)).length;
  const pct = tasks.length > 0 ? Math.round((countDone / tasks.length) * 100) : 0;
  const isAllDone = tasks.length > 0 && countDone === tasks.length;

  if (tasks.length === 0 && search) return null;

  // Việc được ghim tự động ưu tiên hiển thị ở trên cùng danh mục
  const sortedTasks = [...visibleTasks].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  return (
    <div
      draggable
      onDragStart={(e) => onProjectDragStart?.(e, project.id)}
      onDragOver={(e) => onProjectDragOver?.(e, project.id)}
      onDrop={(e) => onProjectDrop?.(e, project.id)}
      onDragEnd={onProjectDragEnd}
      className={`rounded-xl border transition-all overflow-hidden ${
        isProjectDragging
          ? 'opacity-30 scale-[0.99] border-dashed border-slate-400 dark:border-slate-600'
          : 'bg-white dark:bg-[#161b22] border-slate-200/80 dark:border-slate-800 shadow-2xs'
      }`}
    >
      {/* Chỉ báo kéo thả danh mục phía trên */}
      {isProjectOver && dragOverProjectPosition === 'top' && (
        <div className="h-1 w-full bg-slate-900 dark:bg-slate-100 rounded-full my-0.5 animate-in fade-in" />
      )}

      {/* Tiêu đề dự án */}
      <ProjectCardHeader
        project={project}
        countDone={countDone}
        totalTasks={tasks.length}
        pct={pct}
        isAllDone={isAllDone}
        onToggleExpand={onToggleExpand}
        onCopyProjectAsMarkdown={onCopyProjectAsMarkdown}
        onOpenBatchPaste={onOpenBatchPaste}
        onDeleteProject={onDeleteProject}
        onEditProjectName={onEditProjectName}
        onMoveProject={onMoveProject}
        isFirst={isFirstProject}
        isLast={isLastProject}
      />

      {/* Nội dung công việc bên trong */}
      {project.isExpanded && (
        <div className="px-3 sm:px-4 pb-3 pt-1 border-t border-slate-100 dark:border-slate-800/80 bg-[#fafbfc] dark:bg-[#11141b] space-y-1.5">
          {sortedTasks.length === 0 ? (
            <div
              onDragOver={(e) => onDragOver(e, project.id, 0)}
              onDrop={(e) => onDrop(e, project.id, 0)}
              className="py-3 text-center text-xs text-slate-400 dark:text-slate-500 rounded-lg border border-dashed border-slate-200/60 dark:border-slate-800/60 transition-colors"
            >
              {search ? (
                <span>{t.tasks.emptyTasksSearch}</span>
              ) : isFocusMode || filter === 'doing' ? (
                <span>{t.tasks.emptyTasksFocus}</span>
              ) : filter === 'completed' ? (
                <span>{t.tasks.emptyTasksCompleted}</span>
              ) : filter === 'all' && hideCompletedInAllView && isAllDone ? (
                <div className="space-y-1.5 py-1">
                  <span className="font-medium text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>{t.projectCard.noTasksEmpty} ({t.actionBar.hideCompleted})</span>
                  </span>
                  {onToggleHideCompletedInAll && (
                    <button
                      type="button"
                      onClick={onToggleHideCompletedInAll}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-medium"
                    >
                      {t.actionBar.showCompleted}
                    </button>
                  )}
                </div>
              ) : (
                <span className="italic">{t.tasks.emptyTasksDefault}</span>
              )}
            </div>
          ) : (
            sortedTasks.map((task) => {
              const realTaskIndex = project.tasks.findIndex((t) => t.id === task.id);
              const taskIndex = realTaskIndex !== -1 ? realTaskIndex : 0;
              const isAddingSub = activeSubTaskId === task.id;
              const isSubOpen = !!expandedSubtasks[task.id];
              const isCompletedExpanded = !!showCompletedSubs[task.id];
              const filterMode = subtaskFilterMap[task.id] || 'all';
              const isDragging =
                draggedItem?.projId === project.id && draggedItem?.index === taskIndex;
              const isOver =
                dragOverItem?.projId === project.id && dragOverItem?.index === taskIndex;

              return (
                <TaskItem
                  key={task.id}
                  projectId={project.id}
                  task={task}
                  taskIndex={taskIndex}
                  totalProjectTasks={project.tasks.length}
                  isDragging={isDragging}
                  isOver={isOver}
                  dragOverPosition={isOver ? dragOverItem?.position ?? null : null}
                  onDragStart={onDragStart}
                  onDragOver={onDragOver}
                  onDrop={onDrop}
                  onDragEnd={onDragEnd}
                  expandedTaskId={expandedTaskId}
                  onToggleExpandTask={onToggleExpandTask}
                  onToggleTaskDone={onToggleTaskDone}
                  onChangeStatus={onChangeStatus}
                  statuses={statuses}
                  onAddCustomStatus={onAddCustomStatus}
                  onDeleteCustomStatus={onDeleteCustomStatus}
                  onChangeSubtaskStatus={onChangeSubtaskStatus}
                  activeMenuTaskId={activeMenuTaskId}
                  onSetActiveMenuTaskId={onSetActiveMenuTaskId}
                  onCopyTask={onCopyTask}
                  onTogglePinTask={onTogglePinTask}
                  onOpenAddSubtask={onOpenAddSubtask}
                  onMoveTask={onMoveTask}
                  onDeleteTask={onDeleteTask}
                  isSubOpen={isSubOpen}
                  onToggleExpandSubtasks={onToggleExpandSubtasks}
                  isAddingSub={isAddingSub}
                  subtaskFilterMode={filterMode}
                  onSubtaskFilterModeChange={(mode) =>
                    onSubtaskFilterModeChange(task.id, mode)
                  }
                  isCompletedSubExpanded={isCompletedExpanded}
                  onToggleCompletedSubExpanded={() =>
                    onToggleCompletedSubExpanded(task.id)
                  }
                  showAllActiveSubs={!!showAllActiveSubs[task.id]}
                  onToggleShowAllActiveSubs={(show) =>
                    onToggleShowAllActiveSubs(task.id, show)
                  }
                  expandedSubTaskId={expandedSubTaskId}
                  onToggleExpandedSubTaskId={onToggleExpandedSubTaskId}
                  onToggleSubTask={onToggleSubTask}
                  onDeleteSubTask={onDeleteSubTask}
                  newSubTaskTitle={subInputs[task.id] || ''}
                  onNewSubTaskTitleChange={(val) => onSubInputChange(task.id, val)}
                  onAddSubTask={onAddSubTask}
                  onCloseSubtaskInput={onCloseSubtaskInput}
                  onEditTaskTitle={onEditTaskTitle}
                  onEditSubtaskTitle={onEditSubtaskTitle}
                  onReorderSubtask={onReorderSubtask}
                  onOpenBatchPasteForTask={onOpenBatchPasteForTask}
                  onSetTaskRecurrence={onSetTaskRecurrence}
                  onSetSubTaskRecurrence={onSetSubTaskRecurrence}
                  onManuallyResetRecurring={onManuallyResetRecurring}
                  onManuallyResetRecurringSubTask={onManuallyResetRecurringSubTask}
                  onOpenDetail={onOpenDetail}
                  onOpenSchedule={onOpenSchedule}
                  onTogglePinSubTask={onTogglePinSubTask}
                  onOpenAnkiSrs={onOpenAnkiSrs}
                />
              );
            })
          )}

          {/* Thanh hiển thị số việc đã hoàn thành bị ẩn trong tab Tất cả */}
          {filter === 'all' && hideCompletedInAllView && countDone > 0 && !search.trim() && (
            <div className="pt-2 pb-0.5 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 px-1 border-t border-slate-100 dark:border-slate-800/60">
              <span className="flex items-center gap-1 font-medium">
                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  {t.actionBar.hiddenCompletedCount.replace('{count}', String(countDone))}
                </span>
              </span>
              {onToggleHideCompletedInAll && (
                <button
                  type="button"
                  onClick={onToggleHideCompletedInAll}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-medium"
                >
                  {t.actionBar.showCompleted}
                </button>
              )}
            </div>
          )}

          {/* Ô thêm việc dưới cùng - Cố định kích thước, không nhảy, không xuống dòng */}
          {!isFocusMode && filter !== 'completed' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onAddTask(project.id, e);
                inputRef.current?.focus();
              }}
              className="flex items-center gap-1.5 pt-1 flex-nowrap w-full overflow-hidden"
            >
              <input
                ref={inputRef}
                type="text"
                value={taskInputValue}
                onChange={(e) => onTaskInputChange(project.id, e.target.value)}
                onPaste={(e) => onTaskInputPaste(project.id, e)}
                placeholder="Nhập việc cần làm... (Enter để lưu)"
                className="flex-1 min-w-0 h-8 px-2.5 bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-slate-800 dark:focus:border-slate-400 transition-colors shadow-2xs"
              />
              <button
                type="submit"
                disabled={!taskInputValue.trim()}
                className="h-8 px-3 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white disabled:opacity-40 text-white dark:text-slate-950 rounded-lg text-xs font-medium cursor-pointer transition-colors shrink-0 whitespace-nowrap shadow-2xs inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5 shrink-0 stroke-[2]" aria-hidden="true" />
                <span className="hidden sm:inline">Thêm</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenBatchPaste(project)}
                className="h-8 px-2.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium cursor-pointer transition-colors shrink-0 whitespace-nowrap shadow-2xs inline-flex items-center gap-1"
                title="Dán nhanh danh sách công việc (từ Clipboard hoặc mở hộp thoại dán)"
              >
                <ClipboardPaste className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                <span className="hidden sm:inline">Dán nhanh</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* Chỉ báo kéo thả danh mục phía dưới */}
      {isProjectOver && dragOverProjectPosition === 'bottom' && (
        <div className="h-1 w-full bg-slate-900 dark:bg-slate-100 rounded-full my-0.5 animate-in fade-in" />
      )}
    </div>
  );
}
