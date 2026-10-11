import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Pin,
  Check,
  Folder,
  Plus,
  Trash2,
  Copy,
  Repeat,
  RotateCw,
  AlignLeft,
  ListTodo,
  Calendar,
  Clock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Pencil,
} from 'lucide-react';
import { Task, Project, StatusDefinition, RecurrenceType, SubTask } from '../../../types';
import { isDoneStatus } from '../utils/statusCategory';
import { TaskStatusButton } from './TaskStatusButton';
import { RecurrenceBadge } from './RecurrenceBadge';
import { FormattedTaskText } from '../utils/formatters';
import { getTaskSubtaskStats } from '../utils/subtaskTree';
import { formatScheduleBadge } from '../utils/scheduleHelper';

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
  onDeleteTask: (projId: string, taskId: string) => void;
  onSetRecurrence?: (projId: string, taskId: string, recurrence: RecurrenceType) => void;
  onManuallyResetRecurring?: (projId: string, taskId: string) => void;
  onToggleSubTask: (projId: string, taskId: string, subId: string, completed: boolean) => void;
  onAddSubTask: (projId: string, taskId: string, title?: string, parentSubId?: string | null) => void;
  onDeleteSubTask: (projId: string, taskId: string, subId: string) => void;
  onEditSubtaskTitle: (projId: string, taskId: string, subId: string, newTitle: string) => void;
  onOpenSchedule?: (task: Task, projectId: string) => void;
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
  onDeleteTask,
  onSetRecurrence,
  onManuallyResetRecurring,
  onToggleSubTask,
  onAddSubTask,
  onDeleteSubTask,
  onEditSubtaskTitle,
  onOpenSchedule,
}: TaskDetailModalProps) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newSubTitle, setNewSubTitle] = useState('');
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editSubTitle, setEditSubTitle] = useState('');
  const [copied, setCopied] = useState(false);

  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setNotes(task.notes || '');
      setIsEditingTitle(false);
      setNewSubTitle('');
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
  const scheduleBadge = formatScheduleBadge(task.reminderAt, task.deadline);

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
    onAddSubTask(project.id, task.id, trimmed);
    setNewSubTitle('');
  };

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(task.title);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Chi tiết công việc"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[92vh] flex flex-col bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Top Header - Chuẩn Linear / GitHub Enterprise UI (Chống chồng tréo mọi kích thước màn hình) */}
        <div className="h-12 px-3.5 sm:px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/80 dark:bg-[#12161f]/90 shrink-0">
          {/* Breadcrumb bên trái: Linh hoạt, tự co giãn, không bao giờ tràn */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 overflow-hidden">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: project.color || '#487ca5' }}
            />
            <span
              className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[100px] sm:max-w-[200px]"
              title={`Dự án: ${project.name}`}
            >
              {project.name}
            </span>
            {task.isPinned && (
              <span className="inline-flex items-center gap-1 text-[10.5px] px-1.5 py-0.5 rounded font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60 shrink-0 whitespace-nowrap">
                <Pin className="w-2.5 h-2.5 fill-current text-amber-600 dark:text-amber-400 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                <span className="hidden sm:inline">Đã ghim</span>
              </span>
            )}
            <span className="text-slate-300 dark:text-slate-600 text-xs select-none shrink-0 hidden sm:inline">/</span>
            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 shrink-0 hidden sm:inline">
              #{task.id.slice(-6)}
            </span>
          </div>

          {/* Action Toolbar bên phải: Kích thước cố định chuẩn SaaS, không bao giờ chồng tréo */}
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
              title={task.isPinned ? 'Bỏ ghim ưu tiên' : 'Ghim việc lên đầu'}
              aria-label={task.isPinned ? 'Bỏ ghim' : 'Ghim việc'}
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
              title="Sao chép nội dung việc"
              aria-label="Sao chép"
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
              title="Xóa công việc này"
              aria-label="Xóa"
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-0.5 shrink-0" />

            {/* Đóng Modal */}
            <button
              type="button"
              onClick={onClose}
              className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Đóng (Esc)"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Main Title Area (Xem & Chỉnh sửa toàn diện, không che giấu Text) */}
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              {/* Checkbox tròn */}
              <button
                type="button"
                onClick={() => onToggleTaskDone(project.id, task.id, !isDone)}
                className="mt-1 shrink-0 cursor-pointer p-0.5 rounded-full"
                aria-label={isDone ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
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
                      placeholder="Nhập tiêu đề hoặc nội dung công việc..."
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
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveTitleSubmit}
                        className="px-3 py-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-xs font-medium cursor-pointer shadow-2xs hover:bg-slate-800 dark:hover:bg-white"
                      >
                        Lưu tên việc
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setIsEditingTitle(true)}
                    className="group cursor-text p-1.5 -m-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    title="Nhấp chuột vào để chỉnh sửa tiêu đề công việc"
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
                      <span>Nhấp để chỉnh sửa nội dung</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Properties Toolbar (Trạng thái & Lặp lại) */}
          <div className="p-3 bg-slate-50 dark:bg-[#12161f] border border-slate-100 dark:border-slate-800 rounded-xl flex flex-wrap items-center gap-3 text-xs">
            {/* Status */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 dark:text-slate-500 font-medium">Trạng thái:</span>
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

            {/* Recurrence Rule Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1">
                <Repeat className="w-3.5 h-3.5" />
                <span>Lặp lại:</span>
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
                <option value="none">Không lặp lại</option>
                <option value="daily">Hàng ngày (Daily)</option>
                <option value="weekdays">T2 - T6 (Weekdays)</option>
                <option value="weekly">Hàng tuần (Weekly)</option>
              </select>
            </div>

            {/* Smart Schedule / Reminder Trigger */}
            {onOpenSchedule && (
              <>
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Lịch nhắc:</span>
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
                    title="Nhấp để lên lịch nhắc thông minh"
                  >
                    <Clock className="w-3 h-3 shrink-0" strokeWidth={1.5} />
                    <span>{scheduleBadge.status !== 'none' ? scheduleBadge.label : 'Chọn lịch thông minh'}</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Subtasks Section (Danh sách việc con chi tiết) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <h2 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Các bước con ({stats.leafDone}/{stats.leafTotal})
                </h2>
              </div>
              {stats.leafTotal > 0 && (
                <span className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                  {subPct}% hoàn thành
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

            {/* List of subtasks */}
            <div className="space-y-1.5">
              {task.subtasks && task.subtasks.length > 0 ? (
                task.subtasks.map((sub) => {
                  const subDone = sub.status ? isDoneStatus(sub.status, statuses) : sub.completed;
                  const isEditingThis = editingSubId === sub.id;

                  return (
                    <div
                      key={sub.id}
                      className="group flex items-center gap-2 p-2 rounded-lg bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                    >
                      {/* Checkbox subtask */}
                      <button
                        type="button"
                        onClick={() => onToggleSubTask(project.id, task.id, sub.id, !subDone)}
                        className="shrink-0 cursor-pointer p-0.5 rounded-full"
                        aria-label={subDone ? 'Đánh dấu chưa xong' : 'Đánh dấu xong'}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                            subDone
                              ? 'bg-[#34c759] border-[#34c759] text-white'
                              : 'border-slate-300 dark:border-slate-600 hover:border-slate-500'
                          }`}
                        >
                          {subDone && <Check className="w-2.5 h-2.5 shrink-0" strokeWidth={2.5} />}
                        </div>
                      </button>

                      {/* Title */}
                      <div className="flex-1 min-w-0">
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
                            className="w-full text-xs px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-slate-100 outline-none"
                          />
                        ) : (
                          <span
                            onClick={() => {
                              setEditingSubId(sub.id);
                              setEditSubTitle(sub.title);
                            }}
                            className={`text-xs block cursor-text hover:text-slate-950 dark:hover:text-white transition-colors ${
                              subDone
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
                            title="Nhấp để sửa tên bước con"
                          >
                            <FormattedTaskText text={sub.title} isDone={subDone} />
                          </span>
                        )}
                      </div>

                      {/* Delete Subtask */}
                      <button
                        type="button"
                        onClick={() => onDeleteSubTask(project.id, task.id, sub.id)}
                        className="p-1 text-slate-300 dark:text-slate-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                        title="Xóa bước con này"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500 italic py-1">
                  Chưa có bước con nào. Thêm các việc nhỏ bên dưới để dễ dàng theo dõi.
                </p>
              )}
            </div>

            {/* Input thêm việc con nhanh */}
            <form onSubmit={handleAddSubSubmit} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newSubTitle}
                onChange={(e) => setNewSubTitle(e.target.value)}
                placeholder="Thêm bước con tiếp theo (nhấn Enter)..."
                className="flex-1 text-xs px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-slate-900 dark:focus:border-slate-100 shadow-2xs"
              />
              <button
                type="submit"
                disabled={!newSubTitle.trim()}
                className="h-8 px-3 bg-slate-900 dark:bg-slate-100 disabled:opacity-40 text-white dark:text-slate-900 text-xs font-medium rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-2xs shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm</span>
              </button>
            </form>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50/80 dark:bg-[#12161f]/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            {task.completedAt && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Hoàn thành: {new Date(task.completedAt).toLocaleDateString('vi-VN')}</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-medium cursor-pointer shadow-2xs transition-colors"
          >
            Hoàn tất
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
