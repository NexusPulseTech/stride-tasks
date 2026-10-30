import React, { useState, useMemo } from 'react';
import {
  Check,
  Pin,
  Plus,
  Play,
  ArrowRight,
  RotateCcw,
  Layers,
  Clock,
  FolderKanban,
} from 'lucide-react';
import { Project, Task, StatusDefinition } from '../../../types';
import { isDoneStatus } from '../utils/statusCategory';
import { getTaskSubtaskStats } from '../utils/subtaskTree';
import { FormattedTaskText } from '../utils/formatters';
import { useLanguage } from '../../../i18n';
import { triggerHaptic } from '../../../utils';

export type KanbanColumnId = 'todo' | 'doing' | 'review' | 'done';

interface KanbanColumnDef {
  id: KanbanColumnId;
  titleVi: string;
  titleEn: string;
  subtitleVi: string;
  subtitleEn: string;
  targetStatus: string;
  accentColor: string;
}

const KANBAN_COLUMNS: KanbanColumnDef[] = [
  {
    id: 'todo',
    titleVi: 'Chờ xử lý',
    titleEn: 'Backlog & Todo',
    subtitleVi: 'Hàng đợi chuẩn bị',
    subtitleEn: 'Queued for execution',
    targetStatus: 'todo',
    accentColor: '#64748b',
  },
  {
    id: 'doing',
    titleVi: 'Đang thực hiện',
    titleEn: 'In Progress',
    subtitleVi: 'Đang tập trung xử lý',
    subtitleEn: 'Actively working',
    targetStatus: 'doing',
    accentColor: '#2563eb',
  },
  {
    id: 'review',
    titleVi: 'Đang duyệt & Kiểm thử',
    titleEn: 'Review & Blocked',
    subtitleVi: 'Kiểm tra / Chờ phản hồi',
    subtitleEn: 'Testing or awaiting review',
    targetStatus: 'review',
    accentColor: '#d97706',
  },
  {
    id: 'done',
    titleVi: 'Hoàn thành',
    titleEn: 'Done',
    subtitleVi: 'Đã nghiệm thu xong',
    subtitleEn: 'Completed tasks',
    targetStatus: 'done',
    accentColor: '#16a34a',
  },
];

export interface KanbanBoardViewProps {
  projects: Project[];
  statuses: StatusDefinition[];
  search: string;
  onChangeStatus: (projId: string, taskId: string, status: string, isDoneCategory?: boolean) => void;
  onToggleTaskDone: (projId: string, taskId: string, done: boolean) => void;
  onTogglePinTask: (projId: string, taskId: string, e?: React.MouseEvent) => void;
  onOpenDetail: (task: Task, projectId: string) => void;
  onOpenAnkiSrs: (task: Task, projectId: string) => void;
  onStartFocusTask: (task: Task, project: Project) => void;
  onQuickAddTaskToColumn: (projectId: string, title: string, status: string) => void;
  activeFocusTaskId?: string | null;
  /** Gọi trước khi chuyển thẻ sang cột khác (kéo thả hoặc nút bước tiếp). Trả về false để chặn (paywall). */
  onBeforeMoveCard?: () => boolean;
}

export function KanbanBoardView({
  projects,
  statuses,
  search,
  onChangeStatus,
  onToggleTaskDone,
  onTogglePinTask,
  onOpenDetail,
  onOpenAnkiSrs,
  onStartFocusTask,
  onQuickAddTaskToColumn,
  activeFocusTaskId,
  onBeforeMoveCard,
}: KanbanBoardViewProps) {
  const { language } = useLanguage();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [draggedCard, setDraggedCard] = useState<{ projectId: string; taskId: string } | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<KanbanColumnId | null>(null);
  const [addingColumn, setAddingColumn] = useState<KanbanColumnId | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskProjectId, setNewTaskProjectId] = useState<string>('');

  const mapTaskToColumn = (task: Task): KanbanColumnId => {
    if (isDoneStatus(task.status, statuses)) return 'done';
    if (['review', 'testing', 'blocked'].includes(task.status)) return 'review';
    if (task.status === 'doing') return 'doing';
    const customDef = statuses.find((s) => s.id === task.status);
    if (customDef?.category === 'doing') return 'doing';
    return 'todo';
  };

  const flattenedItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list: Array<{ task: Task; project: Project; columnId: KanbanColumnId }> = [];

    projects.forEach((proj) => {
      if (selectedProjectId !== 'all' && proj.id !== selectedProjectId) return;
      proj.tasks.forEach((task) => {
        if (q) {
          const matchTitle = task.title.toLowerCase().includes(q);
          const matchProj = proj.name.toLowerCase().includes(q);
          const matchSub = task.subtasks?.some((s) => s.title.toLowerCase().includes(q));
          if (!matchTitle && !matchProj && !matchSub) return;
        }
        list.push({
          task,
          project: proj,
          columnId: mapTaskToColumn(task),
        });
      });
    });

    // Ưu tiên việc được Ghim lên đầu mỗi cột
    return list.sort((a, b) => {
      if (a.task.isPinned && !b.task.isPinned) return -1;
      if (!a.task.isPinned && b.task.isPinned) return 1;
      return 0;
    });
  }, [projects, selectedProjectId, search, statuses]);

  const handleDropOnColumn = (col: KanbanColumnDef) => {
    if (!draggedCard) return;
    const card = draggedCard;
    setDraggedCard(null);
    setDragOverColumn(null);
    // Thả lại đúng cột cũ không phải là một thao tác di chuyển (không tốn lượt dùng thử)
    const current = flattenedItems.find((item) => item.project.id === card.projectId && item.task.id === card.taskId);
    if (current && current.columnId === col.id) return;
    if (onBeforeMoveCard && !onBeforeMoveCard()) return;
    triggerHaptic();
    onChangeStatus(card.projectId, card.taskId, col.targetStatus, col.id === 'done');
  };

  const handleQuickAddSubmit = (e: React.FormEvent, col: KanbanColumnDef) => {
    e.preventDefault();
    const trimmed = newTaskTitle.trim();
    if (!trimmed) return;
    const targetProjId =
      selectedProjectId !== 'all'
        ? selectedProjectId
        : newTaskProjectId || projects[0]?.id || '';
    if (!targetProjId) return;

    onQuickAddTaskToColumn(targetProjId, trimmed, col.targetStatus);
    setNewTaskTitle('');
    setAddingColumn(null);
  };

  const getNextColumnStatus = (currentCol: KanbanColumnId): { status: string; isDone: boolean; label: string } => {
    if (currentCol === 'todo') {
      return { status: 'doing', isDone: false, label: language === 'vi' ? 'Sang Đang làm' : 'Move to Doing' };
    }
    if (currentCol === 'doing') {
      return { status: 'review', isDone: false, label: language === 'vi' ? 'Sang Duyệt' : 'Move to Review' };
    }
    if (currentCol === 'review') {
      return { status: 'done', isDone: true, label: language === 'vi' ? 'Hoàn thành' : 'Mark Done' };
    }
    return { status: 'todo', isDone: false, label: language === 'vi' ? 'Mở lại việc' : 'Reopen' };
  };

  return (
    <div className="space-y-3 w-full">
      {/* Top Project Filter Bar for Kanban */}
      <div className="flex items-center justify-between gap-2 flex-wrap bg-white dark:bg-[#161b22] border border-slate-200/80 dark:border-slate-800 rounded-xl px-3 py-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full">
          <FolderKanban className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
          <button
            type="button"
            onClick={() => setSelectedProjectId('all')}
            className={`h-7 px-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              selectedProjectId === 'all'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {language === 'vi' ? 'Tất cả dự án' : 'All Projects'}
            <span className="ml-1.5 font-mono tabular-nums opacity-75">
              {projects.reduce((acc, p) => acc + p.tasks.length, 0)}
            </span>
          </button>

          {projects.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedProjectId(p.id)}
              className={`h-7 px-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                selectedProjectId === p.id
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: p.color || '#0071e3' }}
              />
              <span className="truncate max-w-[140px]">{p.name}</span>
              <span className="font-mono tabular-nums text-[10.5px] opacity-75">
                {p.tasks.length}
              </span>
            </button>
          ))}
        </div>

        <span className="text-[11px] text-slate-400 dark:text-slate-500 hidden md:inline whitespace-nowrap">
          {language === 'vi'
            ? 'Kéo thả thẻ giữa 4 cột chuẩn Linear hoặc bấm ▶ để chạy Pomodoro'
            : 'Drag cards across Linear columns or click ▶ to start Pomodoro'}
        </span>
      </div>

      {/* 4-Column Linear Kanban Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-start">
        {KANBAN_COLUMNS.map((col) => {
          const columnItems = flattenedItems.filter((item) => item.columnId === col.id);
          const isDragOver = dragOverColumn === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOverColumn !== col.id) {
                  setDragOverColumn(col.id);
                }
              }}
              onDragLeave={() => {
                if (dragOverColumn === col.id) {
                  setDragOverColumn(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                handleDropOnColumn(col);
              }}
              className={`bg-white dark:bg-[#161b22] rounded-xl border transition-colors flex flex-col min-h-[340px] ${
                isDragOver
                  ? 'border-slate-900 dark:border-slate-200 ring-2 ring-slate-900/10 dark:ring-white/10'
                  : 'border-slate-200/85 dark:border-slate-800'
              }`}
            >
              {/* Column Header */}
              <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: col.accentColor }}
                    />
                    <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {language === 'vi' ? col.titleVi : col.titleEn}
                    </h3>
                    <span className="text-[11px] font-mono tabular-nums text-slate-400 dark:text-slate-500 font-semibold">
                      {columnItems.length}
                    </span>
                    {col.id === 'doing' && (
                      <span
                        className={`text-[10px] font-mono tabular-nums px-1.5 py-0.5 rounded font-semibold ${
                          columnItems.length > 3
                            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                        title={
                          language === 'vi'
                            ? 'Giới hạn WIP (Work-In-Progress): Khuyến nghị tối đa 3 việc đang làm cùng lúc để tránh phân tán'
                            : 'WIP Limit: Recommended max 3 active tasks to prevent context-switching'
                        }
                      >
                        WIP {columnItems.length}/3
                      </span>
                    )}
                  </div>
                  <p className="text-[10.5px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                    {language === 'vi' ? col.subtitleVi : col.subtitleEn}
                  </p>
                </div>

                {projects.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setAddingColumn(addingColumn === col.id ? null : col.id);
                      setNewTaskTitle('');
                      setNewTaskProjectId(
                        selectedProjectId !== 'all' ? selectedProjectId : projects[0]?.id || ''
                      );
                    }}
                    className="w-6.5 h-6.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    title={language === 'vi' ? 'Thêm việc vào cột này' : 'Add task to column'}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Inline Add Task Form */}
              {addingColumn === col.id && (
                <form
                  onSubmit={(e) => handleQuickAddSubmit(e, col)}
                  className="p-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-2"
                >
                  {selectedProjectId === 'all' && projects.length > 1 && (
                    <select
                      value={newTaskProjectId}
                      onChange={(e) => setNewTaskProjectId(e.target.value)}
                      className="w-full h-7 px-2 text-[11px] rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 outline-none"
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder={language === 'vi' ? 'Nhập tên công việc...' : 'Enter task title...'}
                    autoFocus
                    className="w-full h-7.5 px-2.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none focus:border-slate-900 dark:focus:border-slate-300"
                  />
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAddingColumn(null)}
                      className="h-6.5 px-2 text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {language === 'vi' ? 'Hủy' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={!newTaskTitle.trim()}
                      className="h-6.5 px-2.5 rounded-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[11px] font-medium disabled:opacity-40 cursor-pointer"
                    >
                      {language === 'vi' ? 'Thêm' : 'Add'}
                    </button>
                  </div>
                </form>
              )}

              {/* Column Cards List */}
              <div className="p-2 space-y-2 flex-1">
                {columnItems.length === 0 ? (
                  <div className="py-10 px-3 text-center text-[11px] text-slate-400 dark:text-slate-500">
                    {language === 'vi' ? 'Trống. Kéo thẻ việc thả vào đây' : 'Empty. Drag tasks here'}
                  </div>
                ) : (
                  columnItems.map(({ task, project }) => {
                    const isDone = col.id === 'done';
                    const isFocusedNow = activeFocusTaskId === task.id;
                    const subStats = getTaskSubtaskStats(task);
                    const nextStep = getNextColumnStatus(col.id);

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={() => setDraggedCard({ projectId: project.id, taskId: task.id })}
                        onDragEnd={() => {
                          setDraggedCard(null);
                          setDragOverColumn(null);
                        }}
                        onClick={() => onOpenDetail(task, project.id)}
                        className={`group p-2.5 rounded-lg border transition-colors cursor-pointer space-y-2 ${
                          isFocusedNow
                            ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-400/80 dark:border-amber-600/70'
                            : 'bg-slate-50/70 dark:bg-[#11161f] hover:bg-slate-100/80 dark:hover:bg-slate-800/60 border-slate-200/70 dark:border-slate-800/90'
                        }`}
                      >
                        {/* Clean Unboxed Metadata Line (Zero-Pill Discipline) */}
                        <div className="flex items-center justify-between gap-1.5 text-[10.5px] text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1 min-w-0 truncate">
                            <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                              {project.name}
                            </span>
                            {subStats.leafTotal > 0 && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono tabular-nums shrink-0">
                                  {subStats.leafDone}/{subStats.leafTotal}
                                </span>
                              </>
                            )}
                            {Boolean((task.focusedMinutes && task.focusedMinutes > 0) || task.estimatedMinutes) && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono tabular-nums text-amber-600 dark:text-amber-400 shrink-0">
                                  {task.focusedMinutes
                                    ? `${task.focusedMinutes}${task.estimatedMinutes ? `/${task.estimatedMinutes}` : ''}m`
                                    : `~${task.estimatedMinutes}m`}
                                </span>
                              </>
                            )}
                            {Boolean(task.snoozeLevel && task.snoozeLevel > 1) && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono tabular-nums shrink-0">
                                  SRS Lv.{task.snoozeLevel}
                                </span>
                              </>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onTogglePinTask(project.id, task.id, e);
                            }}
                            className={`p-0.5 rounded transition-colors cursor-pointer shrink-0 ${
                              task.isPinned
                                ? 'text-amber-500 dark:text-amber-400'
                                : 'text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 hover:text-slate-600 dark:hover:text-slate-300'
                            }`}
                            title={language === 'vi' ? 'Ghim ưu tiên' : 'Pin task'}
                          >
                            <Pin className={`w-3 h-3 ${task.isPinned ? 'fill-current' : ''}`} />
                          </button>
                        </div>

                        {/* Task Title */}
                        <div className="flex items-start gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleTaskDone(project.id, task.id, !isDone);
                            }}
                            className="mt-0.5 shrink-0 cursor-pointer"
                            aria-label="Toggle completed"
                          >
                            <div
                              className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${
                                isDone
                                  ? 'bg-[#34c759] border-[#34c759] text-white'
                                  : 'border-slate-300 dark:border-slate-600 hover:border-slate-500'
                              }`}
                            >
                              {isDone && <Check className="w-2.5 h-2.5" strokeWidth={2.5} />}
                            </div>
                          </button>

                          <div
                            className={`text-xs font-medium leading-snug break-words flex-1 min-w-0 ${
                              isDone
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            <FormattedTaskText text={task.title} isDone={isDone} />
                          </div>
                        </div>

                        {/* Quick Card Footer Actions */}
                        <div className="pt-1 flex items-center justify-between gap-1 border-t border-slate-200/50 dark:border-slate-800/70">
                          <div className="flex items-center gap-1">
                            {!isDone && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onStartFocusTask(task, project);
                                }}
                                className="h-6 px-1.5 rounded text-[10.5px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                                title={language === 'vi' ? 'Chạy đồng hồ Focus Pomodoro 25 phút' : 'Start 25m Focus Pomodoro'}
                              >
                                <Play className="w-2.5 h-2.5 text-amber-500 fill-current shrink-0" />
                                <span>Focus</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenAnkiSrs(task, project.id);
                              }}
                              className="h-6 px-1.5 rounded text-[10.5px] font-mono tabular-nums font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                              title={language === 'vi' ? 'Lặp lại ngắt quãng Anki SM-2' : 'Anki SM-2 Spaced Repetition'}
                            >
                              <Layers className="w-2.5 h-2.5 shrink-0" />
                              <span>SRS</span>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onBeforeMoveCard && !onBeforeMoveCard()) return;
                              onChangeStatus(project.id, task.id, nextStep.status, nextStep.isDone);
                            }}
                            className="h-6 px-1.5 rounded text-[10.5px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-800 flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
                            title={nextStep.label}
                          >
                            <span>{nextStep.label}</span>
                            {col.id === 'done' ? (
                              <RotateCcw className="w-2.5 h-2.5 shrink-0" />
                            ) : (
                              <ArrowRight className="w-2.5 h-2.5 shrink-0" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
