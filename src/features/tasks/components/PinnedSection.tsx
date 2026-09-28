import React, { useState } from 'react';
import { Pin, Check, Folder } from 'lucide-react';
import { Task, Project } from '../../../types';
import { FormattedTaskText } from '../utils/formatters';

interface PinnedTaskItem {
  task: Task;
  project: Project;
}

interface PinnedSectionProps {
  pinnedTasks: PinnedTaskItem[];
  expandedTaskId: string | null;
  onToggleExpand: (id: string) => void;
  onToggleTaskDone: (projId: string, taskId: string, done: boolean) => void;
  onChangeStatus: (projId: string, taskId: string, nextStatus: 'todo' | 'doing' | 'done') => void;
  onTogglePinTask: (projId: string, taskId: string, e: React.MouseEvent) => void;
  onEditTaskTitle?: (projId: string, taskId: string, newTitle: string) => void;
}

export function PinnedSection({
  pinnedTasks,
  expandedTaskId,
  onToggleExpand,
  onToggleTaskDone,
  onChangeStatus,
  onTogglePinTask,
  onEditTaskTitle,
}: PinnedSectionProps) {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  if (pinnedTasks.length === 0) return null;

  return (
    <div className="bg-slate-100/60 dark:bg-[#161b22]/80 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 space-y-2 shadow-2xs overflow-hidden">
      <div className="h-6 flex items-center justify-between flex-nowrap gap-2 overflow-hidden">
        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-800 dark:text-slate-200 truncate flex-1 min-w-0">
          <Pin className="w-3.5 h-3.5 shrink-0 text-slate-600 dark:text-slate-400 fill-current" strokeWidth={1.5} aria-hidden="true" />
          <span className="truncate">Tiêu điểm ưu tiên ({pinnedTasks.length})</span>
        </div>
        <span className="text-[10.5px] text-slate-500 dark:text-slate-400 shrink-0 whitespace-nowrap hidden sm:inline">
          Việc quan trọng cần làm trước
        </span>
      </div>

      <div className="space-y-1.5">
        {pinnedTasks.map(({ task, project }) => {
          const isDone = task.status === 'done';
          const isExpanded = expandedTaskId === `pin_${task.id}`;
          const isEditing = editingTaskId === task.id;

          return (
            <div
              key={`pinned_${task.id}`}
              className={`flex items-start gap-2 p-2 sm:p-2.5 rounded-lg border transition-all flex-nowrap w-full overflow-hidden ${
                isDone
                  ? 'border-slate-200/60 dark:border-slate-800 bg-white/60 dark:bg-[#161b22]/50 text-slate-400 dark:text-slate-500'
                  : 'bg-white dark:bg-[#161b22] border-slate-200/90 dark:border-slate-800 shadow-2xs text-slate-800 dark:text-slate-100'
              }`}
            >
              {/* Checkbox */}
              <button
                type="button"
                onClick={() => onToggleTaskDone(project.id, task.id, !isDone)}
                className="mt-0.5 shrink-0 cursor-pointer p-0.5 -m-0.5 rounded-full"
                aria-label={isDone ? 'Đánh dấu chưa xong' : 'Đánh dấu đã xong'}
              >
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                    isDone
                      ? 'bg-slate-900 border-slate-900 text-white dark:bg-slate-100 dark:border-slate-100 dark:text-slate-950'
                      : 'border-slate-300 dark:border-slate-600 hover:border-slate-600 dark:hover:border-slate-400'
                  }`}
                >
                  {isDone && <Check className="w-2.5 h-2.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />}
                </div>
              </button>

              {/* Tiêu đề việc */}
              <div className="flex-1 min-w-0 pr-1 overflow-hidden">
                {isEditing ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (editTitle.trim() && onEditTaskTitle) onEditTaskTitle(project.id, task.id, editTitle);
                        setEditingTaskId(null);
                      } else if (e.key === 'Escape') {
                        setEditTitle(task.title);
                        setEditingTaskId(null);
                      }
                    }}
                    onBlur={() => {
                      if (editTitle.trim() && onEditTaskTitle) onEditTaskTitle(project.id, task.id, editTitle);
                      setEditingTaskId(null);
                    }}
                    autoFocus
                    className="w-full text-[13px] leading-snug px-1.5 py-0.5 bg-white dark:bg-[#161b22] border border-slate-300 dark:border-slate-600 rounded focus:border-slate-900 dark:focus:border-slate-100 outline-none text-slate-900 dark:text-slate-100 shadow-2xs"
                  />
                ) : (
                  <div
                    onClick={() => {
                      setEditingTaskId(task.id);
                      setEditTitle(task.title);
                    }}
                    className={`text-[13px] leading-snug cursor-text select-text font-normal break-words hover:text-slate-900 dark:hover:text-white transition-colors ${
                      isExpanded ? '' : 'line-clamp-2'
                    }`}
                    title="Chạm hoặc nhấp chuột để chỉnh sửa"
                  >
                    <FormattedTaskText text={task.title} isDone={isDone} />
                  </div>
                )}
                <div className="flex items-center gap-1.5 mt-1 flex-nowrap overflow-hidden">
                  <span
                    className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-normal max-w-[120px] truncate shrink-0"
                    title={project.name}
                  >
                    <Folder className="w-3 h-3 shrink-0 text-slate-400 dark:text-slate-500" strokeWidth={1.5} aria-hidden="true" />
                    <span className="truncate">{project.name}</span>
                  </span>
                  {task.title.length > 60 && !isEditing && (
                    <button
                      type="button"
                      onClick={() => onToggleExpand(`pin_${task.id}`)}
                      className="text-[10px] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer shrink-0"
                    >
                      {isExpanded ? 'Thu gọn' : '...'}
                    </button>
                  )}
                </div>
              </div>

              {/* Status & Unpin buttons */}
              <div className="shrink-0 flex items-center gap-1 flex-nowrap">
                <button
                  type="button"
                  onClick={() => {
                    const next =
                      task.status === 'todo'
                        ? 'doing'
                        : task.status === 'doing'
                        ? 'done'
                        : 'todo';
                    onChangeStatus(project.id, task.id, next);
                  }}
                  className={`text-[10.5px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer select-none font-medium whitespace-nowrap ${
                    task.status === 'done'
                      ? 'text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      : task.status === 'doing'
                      ? 'text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 font-semibold'
                      : 'text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title="Chạm để đổi trạng thái"
                >
                  {task.status === 'done'
                    ? 'Xong'
                    : task.status === 'doing'
                    ? 'Đang làm'
                    : 'Chờ'}
                </button>
                <button
                  type="button"
                  onClick={(e) => onTogglePinTask(project.id, task.id, e)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer rounded shrink-0 transition-colors"
                  title="Bỏ ghim khỏi Tiêu điểm ưu tiên"
                  aria-label="Bỏ ghim việc"
                >
                  <Pin className="w-3.5 h-3.5 shrink-0 fill-current text-slate-500 dark:text-slate-400" strokeWidth={1.5} aria-hidden="true" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
