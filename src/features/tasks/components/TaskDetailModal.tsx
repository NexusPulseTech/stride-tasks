import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Pin,
  Check,
  Plus,
  Trash2,
  Copy,
  Repeat,
  ListTodo,
  Calendar,
  Clock,
  CheckCircle2,
  Pencil,
  FileText,
  RotateCcw,
  Play,
  Timer,
} from 'lucide-react';
import { Task, Project, StatusDefinition, RecurrenceType, SubTask } from '../../../types';
import { isDoneStatus } from '../utils/statusCategory';
import { TaskStatusButton } from './TaskStatusButton';
import { FormattedTaskText } from '../utils/formatters';
import { getTaskSubtaskStats } from '../utils/subtaskTree';
import { formatScheduleBadge } from '../utils/scheduleHelper';
import { useLanguage } from '../../../i18n';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  project: Project | null;
  statuses: StatusDefinition[];
  onSaveTitle: (projId: string, taskId: string, newTitle: string) => void;
  onSaveNotes?: (projId: string, taskId: string, notes: string) => void;
  onChangeStatus: (projId: string, taskId: string, status: string, isDoneCategory?: boolean) => void;
  onToggleTaskDone: (projId: string, taskId: string, done: boolean) => void;
  onTogglePinTask: (projId: string, taskId: string, e: React.MouseEvent) => void;
  onTogglePinSubTask?: (projId: string, taskId: string, subId: string) => void;
  onDeleteTask: (projId: string, taskId: string) => void;
  onSetRecurrence?: (projId: string, taskId: string, recurrence: RecurrenceType) => void;
  onManuallyResetRecurring?: (projId: string, taskId: string) => void;
  onToggleSubTask: (projId: string, taskId: string, subId: string, completed: boolean) => void;
  onAddSubTask: (projId: string, taskId: string, title?: string, parentSubId?: string | null) => void;
  onDeleteSubTask: (projId: string, taskId: string, subId: string) => void;
  onEditSubtaskTitle: (projId: string, taskId: string, subId: string, newTitle: string) => void;
  onOpenSchedule?: (task: Task, projectId: string) => void;
  onOpenAnkiSrs?: (task: Task, projectId: string) => void;
  onStartFocusTask?: (task: Task, project: Project) => void;
  onSetEstimatedMinutes?: (projId: string, taskId: string, minutes: number | undefined) => void;
}

export function TaskDetailModal({
  isOpen,
  onClose,
  task,
  project,
  statuses,
  onSaveTitle,
  onSaveNotes,
  onChangeStatus,
  onToggleTaskDone,
  onTogglePinTask,
  onTogglePinSubTask,
  onDeleteTask,
  onSetRecurrence,
  onToggleSubTask,
  onAddSubTask,
  onDeleteSubTask,
  onEditSubtaskTitle,
  onOpenSchedule,
  onOpenAnkiSrs,
  onStartFocusTask,
  onSetEstimatedMinutes,
}: TaskDetailModalProps) {
  const { t, language } = useLanguage();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newSubTitle, setNewSubTitle] = useState('');
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editSubTitle, setEditSubTitle] = useState('');
  const [addingChildToId, setAddingChildToId] = useState<string | null>(null);
  const [childSubTitle, setChildSubTitle] = useState('');
  const [copied, setCopied] = useState(false);

  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setNotes(task.notes || '');
      setIsEditingTitle(false);
      setNewSubTitle('');
      setAddingChildToId(null);
      setChildSubTitle('');
    }
  }, [task]);

  // Đóng modal bằng phím Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !task || !project) return null;

  const isDone = isDoneStatus(task.status, statuses);
  const stats = getTaskSubtaskStats(task);
  const subPct = stats.leafTotal > 0 ? Math.round((stats.leafDone / stats.leafTotal) * 100) : 0;
  const scheduleBadge = formatScheduleBadge(task.reminderAt, task.deadline, new Date(), language);

  const handleSaveTitleSubmit = () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== task.title) {
      onSaveTitle(project.id, task.id, trimmed);
    }
    setIsEditingTitle(false);
  };

  const handleSaveNotesBlur = () => {
    if (onSaveNotes && notes !== (task.notes || '')) {
      onSaveNotes(project.id, task.id, notes);
    }
  };

  const handleAddSubSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newSubTitle.trim();
    if (!trimmed) return;
    onAddSubTask(project.id, task.id, trimmed, null);
    setNewSubTitle('');
  };

  const handleAddChildSubmit = (parentSubId: string) => {
    const trimmed = childSubTitle.trim();
    if (!trimmed) return;
    onAddSubTask(project.id, task.id, trimmed, parentSubId);
    setChildSubTitle('');
    setAddingChildToId(null);
  };

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(task.title);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Đệ quy hiển thị các bước con ở mọi cấp độ phân cấp (Hierarchical Tree)
  const renderSubtaskList = (subs: SubTask[], depth = 0): React.ReactNode => {
    if (!subs || subs.length === 0) return null;

    const sortedSubs = [...subs].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });

    return (
      <div className={`space-y-1 ${depth > 0 ? 'ml-3 pl-2.5 border-l border-slate-200/80 dark:border-slate-800' : ''}`}>
        {sortedSubs.map((sub) => {
          const subDone = sub.status ? isDoneStatus(sub.status, statuses) : sub.completed;
          const isEditingThis = editingSubId === sub.id;
          const isAddingToThis = addingChildToId === sub.id;

          return (
            <div key={sub.id} className="space-y-1">
              <div className="group flex items-center gap-2 p-1.5 sm:p-2 rounded-lg bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                {/* Checkbox subtask */}
                <button
                  type="button"
                  onClick={() => onToggleSubTask(project.id, task.id, sub.id, !subDone)}
                  className="shrink-0 cursor-pointer p-0.5 rounded-full"
                  aria-label={subDone ? 'Uncheck' : 'Check'}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${
                      subDone
                        ? 'bg-[#34c759] border-[#34c759] text-white'
                        : 'border-slate-300 dark:border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    {subDone && <Check className="w-2 h-2 shrink-0" strokeWidth={3} />}
                  </div>
                </button>

                {/* Subtask Title */}
                <div className="flex-1 min-w-0 flex items-center gap-1.5 flex-nowrap overflow-hidden">
                  {isEditingThis ? (
                    <input
                      type="text"
                      value={editSubTitle}
                      onChange={(e) => setEditSubTitle(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (editSubTitle.trim()) {
                            onEditSubtaskTitle(project.id, task.id, sub.id, editSubTitle.trim());
                          }
                          setEditingSubId(null);
                        } else if (e.key === 'Escape') {
                          setEditingSubId(null);
                        }
                      }}
                      onBlur={() => {
                        if (editSubTitle.trim()) {
                          onEditSubtaskTitle(project.id, task.id, sub.id, editSubTitle.trim());
                        }
                        setEditingSubId(null);
                      }}
                      autoFocus
                      className="flex-1 min-w-0 h-6 text-xs px-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-slate-100 outline-none"
                    />
                  ) : (
                    <>
                      <span
                        onClick={() => {
                          setEditingSubId(sub.id);
                          setEditSubTitle(sub.title);
                        }}
                        className={`text-xs cursor-text hover:text-slate-950 dark:hover:text-white transition-colors truncate min-w-0 ${
                          subDone
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                        title={t.taskDetail.clickToEdit}
                      >
                        <FormattedTaskText text={sub.title} isDone={subDone} />
                      </span>

                      {sub.isPinned && (
                        <span className="inline-flex items-center gap-1 text-[9.5px] px-1 py-0.2 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50 font-medium shrink-0 whitespace-nowrap">
                          <Pin className="w-2.5 h-2.5 fill-current shrink-0" />
                          <span>{t.pinned.priorityTag}</span>
                        </span>
                      )}
                    </>
                  )}
                </div>

                {/* Subtask Quick Actions: Add child (+), Delete */}
                <div className="flex items-center gap-0.5 shrink-0 flex-nowrap">
                  <button
                    type="button"
                    onClick={() => {
                      setAddingChildToId(isAddingToThis ? null : sub.id);
                      setChildSubTitle('');
                    }}
                    className="w-6 h-6 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 cursor-pointer rounded shrink-0 transition-colors inline-flex items-center justify-center"
                    title={t.pinned.addSubtask}
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteSubTask(project.id, task.id, sub.id)}
                    className="w-6 h-6 text-slate-300 dark:text-slate-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer rounded shrink-0 transition-colors inline-flex items-center justify-center"
                    title={t.pinned.deleteSubtask}
                  >
                    <Trash2 className="w-3 h-3 shrink-0" />
                  </button>
                </div>
              </div>

              {/* Form thêm con trực tiếp */}
              {isAddingToThis && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddChildSubmit(sub.id);
                  }}
                  className="h-7 flex items-center gap-1.5 ml-4 flex-nowrap w-auto overflow-hidden"
                >
                  <input
                    type="text"
                    value={childSubTitle}
                    onChange={(e) => setChildSubTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setAddingChildToId(null);
                    }}
                    autoFocus
                    placeholder={t.pinned.addSubtaskPlaceholder.replace('{title}', sub.title.slice(0, 15))}
                    className="flex-1 min-w-0 h-6.5 text-xs px-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md outline-none text-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="submit"
                    disabled={!childSubTitle.trim()}
                    className="h-6.5 px-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium rounded-md cursor-pointer disabled:opacity-40 shrink-0 whitespace-nowrap"
                  >
                    {t.pinned.save}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddingChildToId(null)}
                    className="h-6.5 text-xs text-slate-400 hover:text-slate-600 px-1.5 cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    {t.pinned.cancel}
                  </button>
                </form>
              )}

              {/* Recursive child subtasks */}
              {sub.subtasks && sub.subtasks.length > 0 && renderSubtaskList(sub.subtasks, depth + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.taskDetail.title}
      style={{ zIndex: 9992 }}
      className="fixed inset-0 z-[9992] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[92vh] flex flex-col bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Top Header */}
        <div className="h-12 px-3.5 sm:px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/80 dark:bg-[#12161f]/90 shrink-0">
          {/* Breadcrumb bên trái */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 overflow-hidden">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: project.color || '#487ca5' }}
            />
            <span
              className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[100px] sm:max-w-[200px]"
              title={project.name}
            >
              {project.name}
            </span>
            {task.isPinned && (
              <span className="inline-flex items-center gap-1 text-[10.5px] px-1.5 py-0.5 rounded font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60 shrink-0 whitespace-nowrap">
                <Pin className="w-2.5 h-2.5 fill-current text-amber-600 dark:text-amber-400 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                <span className="hidden sm:inline">{t.taskDetail.pinnedBadge}</span>
              </span>
            )}
            <span className="text-slate-300 dark:text-slate-600 text-xs select-none shrink-0 hidden sm:inline">/</span>
            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 shrink-0 hidden sm:inline">
              #{task.id.slice(-6)}
            </span>
          </div>

          {/* Action Toolbar bên phải */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Nút Ghim ưu tiên */}
            <button
              type="button"
              onClick={(e) => onTogglePinTask(project.id, task.id, e)}
              className={`w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-lg border text-xs flex items-center justify-center cursor-pointer transition-colors shrink-0 ${
                task.isPinned
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 shadow-2xs font-semibold'
                  : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title={task.isPinned ? t.tasks.unpinTask : t.tasks.pinTask}
              aria-label={task.isPinned ? t.tasks.unpinTask : t.tasks.pinTask}
            >
              <Pin
                className={`w-3.5 h-3.5 shrink-0 ${task.isPinned ? 'fill-current' : ''}`}
                strokeWidth={1.5}
              />
            </button>

            {/* Sao chép tiêu đề */}
            <button
              type="button"
              onClick={handleCopy}
              className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title={t.common.copy}
              aria-label={t.common.copy}
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" strokeWidth={2} />
              ) : (
                <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
              )}
            </button>

            {/* Xóa công việc */}
            <button
              type="button"
              onClick={() => {
                onDeleteTask(project.id, task.id);
                onClose();
              }}
              className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-200 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title={t.common.delete}
              aria-label={t.common.delete}
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5 shrink-0" />

            {/* Đóng Modal */}
            <button
              type="button"
              onClick={onClose}
              className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title={`${t.common.close} (Esc)`}
              aria-label={t.common.close}
            >
              <X className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Main Title Area */}
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              {/* Checkbox tròn */}
              <button
                type="button"
                onClick={() => onToggleTaskDone(project.id, task.id, !isDone)}
                className="mt-1 shrink-0 cursor-pointer p-0.5 rounded-full"
                aria-label={isDone ? 'Mark undone' : 'Mark done'}
              >
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                    isDone
                      ? 'bg-[#34c759] border-[#34c759] text-white shadow-xs'
                      : 'border-slate-300 dark:border-slate-600 hover:border-slate-600 dark:hover:border-slate-400'
                  }`}
                >
                  {isDone && <Check className="w-3 h-3 shrink-0" strokeWidth={2.5} />}
                </div>
              </button>

              <div className="flex-1 min-w-0">
                {isEditingTitle ? (
                  <div className="space-y-2">
                    <textarea
                      ref={titleTextareaRef}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          handleSaveTitleSubmit();
                        } else if (e.key === 'Escape') {
                          setTitle(task.title);
                          setIsEditingTitle(false);
                        }
                      }}
                      rows={3}
                      autoFocus
                      placeholder={t.taskDetail.clickToEdit}
                      className="w-full text-base sm:text-lg font-semibold leading-relaxed p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-100 outline-none text-slate-900 dark:text-slate-100 resize-y shadow-2xs"
                    />
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setTitle(task.title);
                          setIsEditingTitle(false);
                        }}
                        className="px-3 py-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {t.taskDetail.cancel}
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveTitleSubmit}
                        className="px-3 py-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-xs font-medium cursor-pointer shadow-2xs hover:bg-slate-800 dark:hover:bg-white"
                      >
                        {t.taskDetail.saveTitle}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setIsEditingTitle(true)}
                    className="group cursor-text p-1.5 -m-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    title={t.taskDetail.clickToEdit}
                  >
                    <h1
                      className={`text-base sm:text-lg font-semibold leading-relaxed break-words whitespace-pre-wrap ${
                        isDone
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      <FormattedTaskText text={task.title} isDone={isDone} />
                    </h1>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex items-center gap-1.5">
                      <Pencil className="w-3 h-3 text-slate-400 dark:text-slate-500" strokeWidth={1.5} aria-hidden="true" />
                      <span>{t.taskDetail.editNotesHint}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Properties Toolbar (Trạng thái & Lặp lại & Lên lịch) */}
          <div className="p-3 bg-slate-50 dark:bg-[#12161f] border border-slate-100 dark:border-slate-800 rounded-xl flex flex-wrap items-center gap-3 text-xs">
            {/* Status */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 dark:text-slate-500 font-medium">{t.taskDetail.statusLabel}</span>
              <TaskStatusButton
                status={task.status}
                statuses={statuses}
                onChangeStatus={(next) => {
                  const def = statuses.find((s) => s.id === next);
                  const isDoneCat = def?.category === 'done' || next === 'done';
                  onChangeStatus(project.id, task.id, next, isDoneCat);
                }}
                onAddCustomStatus={() => null}
                onDeleteCustomStatus={() => {}}
              />
            </div>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

            {/* Recurrence Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1">
                <Repeat className="w-3.5 h-3.5" />
                <span>{t.taskDetail.repeatLabel}</span>
              </span>
              <select
                value={task.recurrence || 'none'}
                onChange={(e) => {
                  const val = e.target.value === 'none' ? null : (e.target.value as RecurrenceType);
                  if (onSetRecurrence) {
                    onSetRecurrence(project.id, task.id, val);
                  }
                }}
                className="px-2 py-1 text-xs rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value="none">{t.taskDetail.noRepeat}</option>
                <option value="daily">{t.taskDetail.daily}</option>
                <option value="weekdays">{t.taskDetail.weekdays}</option>
                <option value="weekly">{t.taskDetail.weekly}</option>
              </select>
            </div>

            {/* Smart Schedule / Reminder Trigger */}
            {onOpenSchedule && (
              <>
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{t.taskDetail.scheduleLabel}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenSchedule(task, project.id)}
                    className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                      scheduleBadge.status !== 'none'
                        ? scheduleBadge.isOverdue
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                          : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                    title={t.schedule.modalTitle}
                  >
                    <Clock className="w-3 h-3 shrink-0" strokeWidth={1.5} />
                    <span>{scheduleBadge.status !== 'none' ? scheduleBadge.label : t.taskDetail.chooseSchedule}</span>
                  </button>
                </div>
              </>
            )}

            {/* Time Budget / Estimated Minutes Selector (Chuẩn Sunsama / Akiflow) */}
            {onSetEstimatedMinutes && (
              <>
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1">
                    <Timer className="w-3.5 h-3.5" />
                    <span>{language === 'vi' ? 'Dự kiến:' : 'Budget:'}</span>
                  </span>
                  <select
                    value={task.estimatedMinutes ? String(task.estimatedMinutes) : 'none'}
                    onChange={(e) => {
                      const val =
                        e.target.value === 'none' ? undefined : parseInt(e.target.value, 10);
                      onSetEstimatedMinutes(project.id, task.id, val);
                    }}
                    className="px-2 py-1 text-xs font-mono tabular-nums rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
                  >
                    <option value="none">{language === 'vi' ? 'Chưa đặt' : 'None'}</option>
                    <option value="15">~15m</option>
                    <option value="25">~25m</option>
                    <option value="30">~30m</option>
                    <option value="45">~45m</option>
                    <option value="60">~1h (60m)</option>
                    <option value="90">~1.5h (90m)</option>
                    <option value="120">~2h (120m)</option>
                  </select>
                </div>
              </>
            )}

            {/* Pomodoro Deep Work Trigger */}
            {onStartFocusTask && !isDone && (
              <>
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
                <button
                  type="button"
                  onClick={() => {
                    onStartFocusTask(task, project);
                    onClose();
                  }}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                  title={language === 'vi' ? 'Chạy đồng hồ Focus Pomodoro 25 phút' : 'Start 25m Pomodoro Focus'}
                >
                  <Play className="w-3 h-3 fill-current shrink-0" />
                  <span>{language === 'vi' ? 'Tập trung 25p' : 'Focus 25m'}</span>
                </button>
              </>
            )}

            {Boolean((task.focusedMinutes && task.focusedMinutes > 0) || task.estimatedMinutes) && (
              <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-mono tabular-nums text-[11px] font-semibold">
                <Timer className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {task.focusedMinutes || 0}m
                  {task.estimatedMinutes ? ` / ~${task.estimatedMinutes}m` : ' Deep Work'}
                </span>
              </div>
            )}

          </div>

          {/* Notes & Markdown details */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-1.5">
              <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <h2 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                {t.taskDetail.notesTitle}
              </h2>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleSaveNotesBlur}
              placeholder={t.taskDetail.notesPlaceholder}
              rows={3}
              className="w-full text-xs leading-relaxed p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-slate-800 dark:focus:border-slate-200 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 resize-y"
            />
          </div>

          {/* Subtasks Section (Hierarchical & Pin-enabled) */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <h2 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  {t.taskDetail.subtasksTitle} ({stats.leafDone}/{stats.leafTotal})
                </h2>
              </div>
              {stats.leafTotal > 0 && (
                <span className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                  {t.taskDetail.progressPercent.replace('{pct}', String(subPct))}
                </span>
              )}
            </div>

            {/* Progress bar */}
            {stats.leafTotal > 0 && (
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${subPct}%` }}
                />
              </div>
            )}

            {/* List of subtasks (Recursive) */}
            <div className="space-y-1.5">
              {task.subtasks && task.subtasks.length > 0 ? (
                renderSubtaskList(task.subtasks, 0)
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500 italic py-1">
                  {t.taskDetail.subtasksEmpty}
                </p>
              )}
            </div>

            {/* Input thêm việc con nhanh ở gốc */}
            <form onSubmit={handleAddSubSubmit} className="flex items-center gap-2 pt-1 flex-nowrap w-full overflow-hidden">
              <input
                type="text"
                value={newSubTitle}
                onChange={(e) => setNewSubTitle(e.target.value)}
                placeholder={t.taskDetail.newSubtaskPlaceholder}
                className="flex-1 min-w-0 h-8 text-xs px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-slate-900 dark:focus:border-slate-100 shadow-2xs"
              />
              <button
                type="submit"
                disabled={!newSubTitle.trim()}
                className="h-8 px-3 bg-slate-900 dark:bg-slate-100 disabled:opacity-40 text-white dark:text-slate-900 text-xs font-medium rounded-lg inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs shrink-0 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span>{t.pinned.addSubtask}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50/80 dark:bg-[#12161f]/90 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            {task.completedAt && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {t.taskDetail.completedAt.replace(
                    '{date}',
                    new Date(task.completedAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')
                  )}
                </span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-medium cursor-pointer shadow-2xs transition-colors"
          >
            {t.common.close}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
