import React, { useRef } from 'react';
import { ClipboardPaste, Plus } from 'lucide-react';
import { Project, Task, StatusDefinition } from '../../../types';
import { TaskItem } from './TaskItem';
import { ProjectCardHeader } from './ProjectCardHeader';
import { isDoneStatus } from '../utils/statusCategory';

export interface ProjectCardProps {
  project: Project;
  visibleTasks: Task[];
  search: string;
  filter: 'all' | 'doing' | 'completed';
  isFocusMode: boolean;
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
}

export function ProjectCard({
  project,
  visibleTasks,
  search,
  filter,
  isFocusMode,
  onToggleExpand,
  onCopyProjectAsMarkdown,
  onOpenBatchPaste,
  onOpenBatchPasteForTask,
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
}: ProjectCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const tasks = project.tasks;
  const countDone = tasks.filter((task) => isDoneStatus(task.status, statuses)).length;
  const pct = tasks.length > 0 ? Math.round((countDone / tasks.length) * 100) : 0;
  const isAllDone = tasks.length > 0 && countDone === tasks.length;

  if (tasks.length === 0 && search) return null;

  return (
    <div className="bg-white dark:bg-[#161b22] rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden transition-all">
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
      />

      {/* Nội dung công việc bên trong */}
      {project.isExpanded && (
        <div className="px-3 sm:px-4 pb-3 pt-1 border-t border-slate-100 dark:border-slate-800/80 bg-[#fafbfc] dark:bg-[#11141b] space-y-1.5">
          {visibleTasks.length === 0 ? (
            <div className="py-3 text-center text-xs text-slate-400 dark:text-slate-500">
              {search ? (
                <span>Không tìm thấy công việc nào khớp với tìm kiếm.</span>
              ) : isFocusMode || filter === 'doing' ? (
                <span>Tuyệt vời! Không còn việc nào chưa hoàn thành.</span>
              ) : filter === 'completed' ? (
                <span>Chưa có việc nào hoàn thành.</span>
              ) : (
                <span className="italic">Chưa có việc nào. Gõ việc vào ô bên dưới hoặc bấm nút dán nhanh.</span>
              )}
            </div>
          ) : (
            visibleTasks.map((task) => {
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
                />
              );
            })
          )}

          {/* Ô thêm việc dưới cùng */}
          {!isFocusMode && filter !== 'completed' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onAddTask(project.id, e);
                inputRef.current?.focus();
              }}
              className="flex items-center gap-1.5 pt-1"
            >
              <input
                ref={inputRef}
                type="text"
                value={taskInputValue}
                onChange={(e) => onTaskInputChange(project.id, e.target.value)}
                onPaste={(e) => onTaskInputPaste(project.id, e)}
                placeholder="Nhập việc cần làm... (Enter để lưu)"
                className="flex-1 h-8 px-2.5 bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-slate-800 dark:focus:border-slate-400 transition-all shadow-2xs"
              />
              <button
                type="submit"
                disabled={!taskInputValue.trim()}
                className="h-8 px-3 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white disabled:opacity-40 text-white dark:text-slate-950 rounded-lg text-xs font-medium cursor-pointer transition-colors shrink-0 shadow-2xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5 shrink-0 stroke-[2]" aria-hidden="true" />
                <span className="hidden sm:inline">Thêm</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenBatchPaste(project)}
                className="h-8 px-2.5 bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-medium cursor-pointer transition-colors shrink-0 flex items-center gap-1"
                title="Dán nhanh danh sách công việc"
                aria-label="Dán nhanh danh sách công việc"
              >
                <ClipboardPaste className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Dán nhanh</span>
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
