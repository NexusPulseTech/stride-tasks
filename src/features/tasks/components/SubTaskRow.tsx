import React, { useRef, useState } from 'react';
import {
  Check,
  ChevronRight,
  Plus,
  MoreHorizontal,
  GripVertical,
  ClipboardPaste,
  Pin,
} from 'lucide-react';
import { SubTask, StatusDefinition, RecurrenceType } from '../../../types';
import { FormattedTaskText } from '../utils/formatters';
import { countLeafSubtasks } from '../utils/subtaskTree';
import { isDoneStatus } from '../utils/statusCategory';
import { SubTaskInlineForm } from './SubTaskInlineForm';
import { SubTaskMoreMenu } from './SubTaskMoreMenu';
import { TaskStatusButton } from './TaskStatusButton';
import { RecurrenceBadge } from './RecurrenceBadge';

export interface SubTaskRowProps {
  sub: SubTask;
  depth: number;
  projectId: string;
  taskId: string;
  onToggleSubTask: (projId: string, taskId: string, subId: string, completed: boolean) => void;
  onDeleteSubTask: (projId: string, taskId: string, subId: string) => void;
  onAddSubTask: (projId: string, taskId: string, title?: string, parentSubId?: string | null) => void;
  expandedNodes: Record<string, boolean>;
  onToggleExpandNode: (subId: string, forceExpand?: boolean) => void;
  addingChildToSubId: string | null;
  onSetAddingChildToSubId: (subId: string | null) => void;
  filterMode: 'active' | 'all' | 'completed';
  onEditSubtaskTitle?: (projId: string, taskId: string, subId: string, newTitle: string) => void;
  statuses?: StatusDefinition[];
  onAddCustomStatus?: (label: string, category: 'todo' | 'doing' | 'done', color: string) => StatusDefinition | null;
  onDeleteCustomStatus?: (statusId: string) => void;
  onChangeSubtaskStatus?: (projId: string, taskId: string, subId: string, status: string, isDoneCategory: boolean) => void;
  onOpenBatchPasteForTask?: (projId: string, taskId: string, parentSubId?: string | null, targetTitle?: string) => void;
  onSetSubTaskRecurrence?: (projId: string, taskId: string, subId: string, recurrence: RecurrenceType) => void;
  onManuallyResetRecurringSubTask?: (projId: string, taskId: string, subId: string) => void;
  onTogglePinSubTask?: (projId: string, taskId: string, subId: string) => void;
  onOpenParentDetail?: () => void;
  isDragging?: boolean;
  isOver?: boolean;
  dragOverPosition?: 'top' | 'bottom' | null;
  onSubDragStart?: (e: React.DragEvent, subId: string) => void;
  onSubDragOver?: (e: React.DragEvent, subId: string) => void;
  onSubDrop?: (e: React.DragEvent, targetSubId: string) => void;
  onSubDragEnd?: (e: React.DragEvent) => void;
  draggedSubId?: string | null;
  dragOverSub?: { subId: string; position: 'top' | 'bottom' } | null;
}

export function SubTaskRow({
  sub, depth, projectId, taskId,
  onToggleSubTask, onDeleteSubTask, onAddSubTask,
  expandedNodes, onToggleExpandNode,
  addingChildToSubId, onSetAddingChildToSubId,
  filterMode, onEditSubtaskTitle,
  statuses = [],
  onAddCustomStatus = () => null,
  onDeleteCustomStatus = () => {},
  onChangeSubtaskStatus,
  onOpenBatchPasteForTask,
  onSetSubTaskRecurrence,
  onManuallyResetRecurringSubTask,
  onTogglePinSubTask,
  onOpenParentDetail,
  isDragging = false, isOver = false, dragOverPosition = null,
  onSubDragStart, onSubDragOver, onSubDrop, onSubDragEnd,
  draggedSubId = null, dragOverSub = null,
}: SubTaskRowProps) {
  const [inlineTitle, setInlineTitle] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(sub.title);
  const [isExpandedText, setIsExpandedText] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const subMenuButtonRef = useRef<HTMLButtonElement>(null);

  const hasChildren = !!(sub.subtasks && sub.subtasks.length > 0);
  const isNodeExpanded = expandedNodes[sub.id] ?? true;
  const leafStats = countLeafSubtasks(sub);
  const isAddingChild = addingChildToSubId === sub.id;

  const handleAddChildSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inlineTitle.trim()) {
      onAddSubTask(projectId, taskId, inlineTitle.trim(), sub.id);
      setInlineTitle('');
      onSetAddingChildToSubId(null);
      onToggleExpandNode(sub.id, true);
    }
  };

  const handleSaveEdit = () => {
    if (editTitle.trim() && onEditSubtaskTitle) {
      onEditSubtaskTitle(projectId, taskId, sub.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const isSubDone = sub.status ? isDoneStatus(sub.status, statuses) : sub.completed;
  if (filterMode === 'completed' && !isSubDone && (!hasChildren || leafStats.completed === 0)) return null;
  if (filterMode === 'active' && isSubDone && (!hasChildren || leafStats.completed === leafStats.total)) return null;

  return (
    <div data-subtask-row="true" className="space-y-0.5">
      {isOver && dragOverPosition === 'top' && (
        <div className="h-0.5 w-full bg-slate-900 dark:bg-slate-100 rounded-full my-0.5 animate-in fade-in" />
      )}

      <div
        draggable
        onDragStart={(e) => onSubDragStart?.(e, sub.id)}
        onDragOver={(e) => onSubDragOver?.(e, sub.id)}
        onDrop={(e) => onSubDrop?.(e, sub.id)}
        onDragEnd={onSubDragEnd}
        className={`group/sub flex items-center gap-1.5 py-0.5 px-1 rounded-md hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors w-full min-h-[26px] ${
          isDragging ? 'opacity-30 scale-[0.99] border-dashed border border-slate-300 dark:border-slate-600' : ''
        }`}
      >
        <div
          data-subtask-drag-handle="true"
          className="cursor-grab active:cursor-grabbing p-0.5 -ml-0.5 text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 opacity-0 group-hover/sub:opacity-100 transition-opacity select-none hidden sm:block shrink-0"
          title="Kéo thả để sắp xếp lại việc con"
          aria-label="Kéo thả sắp xếp việc con"
        >
          <GripVertical className="w-3 h-3 shrink-0" strokeWidth={1.5} aria-hidden="true" />
        </div>

        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggleExpandNode(sub.id)}
            className="w-4 h-4 text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 flex items-center justify-center cursor-pointer shrink-0 transition-colors rounded hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
            title={isNodeExpanded ? 'Thu gọn các việc con' : 'Xem toàn bộ việc con bên trong'}
            aria-label={isNodeExpanded ? 'Thu gọn việc con' : 'Mở rộng việc con'}
          >
            <ChevronRight
              className={`w-3 h-3 shrink-0 transition-transform duration-150 ${isNodeExpanded ? 'rotate-90 text-slate-700 dark:text-slate-200' : ''}`}
              strokeWidth={2}
            />
          </button>
        ) : (
          <div className="w-4 h-4 shrink-0 flex items-center justify-center">
            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
          </div>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSubTask(projectId, taskId, sub.id, !isSubDone);
          }}
          className="shrink-0 cursor-pointer p-0.5 -m-0.5 rounded-full"
          aria-label={isSubDone ? 'Đánh dấu việc con chưa xong' : 'Đánh dấu việc con đã xong'}
        >
          <div
            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${
              isSubDone
                ? 'bg-[#34c759] border-[#34c759] text-white'
                : 'border-slate-300 dark:border-slate-600 hover:border-slate-600 dark:hover:border-slate-400'
            }`}
          >
            {isSubDone && <Check className="w-2 h-2 shrink-0 stroke-[2.5]" aria-hidden="true" />}
          </div>
        </button>

        <div className="flex-1 min-w-0 flex items-center">
          {isEditing ? (
            <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit();
                  if (e.key === 'Escape') {
                    setEditTitle(sub.title);
                    setIsEditing(false);
                  }
                }}
                autoFocus
                className="flex-1 h-5 px-1 bg-white dark:bg-[#161b22] border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-slate-800 dark:focus:border-slate-200"
              />
              <button
                type="button"
                onClick={handleSaveEdit}
                className="h-5 px-1.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 text-[10px] rounded cursor-pointer"
              >
                Lưu
              </button>
            </div>
          ) : (
            <span
              onClick={() => setIsExpandedText(!isExpandedText)}
              onDoubleClick={() => {
                setEditTitle(sub.title);
                setIsEditing(true);
              }}
              className={`text-xs text-slate-700 dark:text-slate-300 cursor-pointer hover:text-slate-950 dark:hover:text-white transition-colors ${
                isExpandedText ? 'break-words' : 'truncate'
              }`}
              title="Nhấp để xem toàn bộ nội dung (nhấp đúp để sửa tên)"
            >
              <FormattedTaskText text={sub.title} isDone={isSubDone} />
            </span>
          )}

          {/* Nút Xem hết khi văn bản dài */}
          {sub.title.length > 45 && !isEditing && (
            <button
              type="button"
              onClick={() => setIsExpandedText(!isExpandedText)}
              className="text-[9.5px] text-blue-600 dark:text-blue-400 hover:underline shrink-0 ml-0.5 cursor-pointer font-medium"
            >
              {isExpandedText ? 'Thu gọn' : '...'}
            </button>
          )}

          {/* Pinned indicator cho việc con */}
          {sub.isPinned && (
            <span className="inline-flex items-center gap-1 ml-1 text-[9.5px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/50 px-1 py-0.2 rounded font-medium shrink-0 whitespace-nowrap">
              <Pin className="w-2.5 h-2.5 fill-current text-amber-600 dark:text-amber-400" />
              <span>Ưu tiên</span>
            </span>
          )}

          {/* Micro indicator cho việc con lặp lại (chuẩn chuyên nghiệp) */}
          {sub.recurrence && (
            <div className="ml-1 shrink-0">
              <RecurrenceBadge
                recurrence={sub.recurrence}
                recurrenceStreak={sub.recurrenceStreak}
                isDone={isSubDone}
                onReset={
                  onManuallyResetRecurringSubTask
                    ? () => onManuallyResetRecurringSubTask(projectId, taskId, sub.id)
                    : undefined
                }
              />
            </div>
          )}
        </div>

        {hasChildren && (
          <span
            className={`text-[9.5px] px-1 py-0.2 rounded font-mono shrink-0 tabular-nums inline-flex items-center gap-0.5 ${
              leafStats.completed === leafStats.total
                ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 font-semibold'
                : 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80'
            }`}
            title={`Đã hoàn thành ${leafStats.completed}/${leafStats.total} việc con ở mọi cấp độ`}
          >
            <span>{leafStats.completed}/{leafStats.total}</span>
            {leafStats.completed === leafStats.total && (
              <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} aria-hidden="true" />
            )}
          </span>
        )}

        <div className="shrink-0 flex items-center">
          <TaskStatusButton
            status={sub.status || (sub.completed ? 'done' : 'todo')}
            statuses={statuses}
            onChangeStatus={(nextStatus) => {
              const def = statuses.find((s) => s.id === nextStatus);
              const isDoneCat = def?.category === 'done' || nextStatus === 'done';
              onChangeSubtaskStatus?.(projectId, taskId, sub.id, nextStatus, isDoneCat);
            }}
            onAddCustomStatus={onAddCustomStatus}
            onDeleteCustomStatus={onDeleteCustomStatus}
            size="sm"
          />
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSetAddingChildToSubId(isAddingChild ? null : sub.id);
              if (!isAddingChild) onToggleExpandNode(sub.id, true);
            }}
            className="p-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/70 dark:hover:bg-slate-700 rounded cursor-pointer shrink-0 transition-colors"
            title="Thêm nhanh việc con (+)"
            aria-label="Thêm việc con"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={async (e) => {
              e.stopPropagation();
              try {
                if (navigator.clipboard && navigator.clipboard.readText) {
                  const clipText = await navigator.clipboard.readText();
                  if (clipText && clipText.trim()) {
                    onAddSubTask(projectId, taskId, clipText, sub.id);
                    onToggleExpandNode(sub.id, true);
                    return;
                  }
                }
              } catch (err) {}
              onOpenBatchPasteForTask?.(projectId, taskId, sub.id, sub.title);
            }}
            className="p-1 text-slate-400 hover:text-slate-800 dark:text-slate-500 dark:hover:text-slate-100 hover:bg-slate-200/70 dark:hover:bg-slate-700 rounded cursor-pointer shrink-0 transition-colors"
            title={`Dán nhanh việc con vào "${sub.title}"`}
            aria-label="Dán việc con"
          >
            <ClipboardPaste className="w-3 h-3" />
          </button>

          <button
            ref={subMenuButtonRef}
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-700 rounded cursor-pointer shrink-0 transition-colors"
            title="Tùy chọn mục con"
            aria-label="Tùy chọn mục con"
          >
            <MoreHorizontal className="w-3 h-3 shrink-0" strokeWidth={1.5} aria-hidden="true" />
          </button>

          <SubTaskMoreMenu
            sub={sub}
            projectId={projectId}
            taskId={taskId}
            isOpen={isMenuOpen}
            onClose={() => setIsMenuOpen(false)}
            triggerRef={subMenuButtonRef}
            onStartAddChild={() => {
              onSetAddingChildToSubId(sub.id);
              onToggleExpandNode(sub.id, true);
              setIsMenuOpen(false);
            }}
            onBatchPasteChild={onOpenBatchPasteForTask ? () => {
              onOpenBatchPasteForTask(projectId, taskId, sub.id, sub.title);
              onToggleExpandNode(sub.id, true);
              setIsMenuOpen(false);
            } : undefined}
            onStartEditTitle={() => {
              setEditTitle(sub.title);
              setIsEditing(true);
              setIsMenuOpen(false);
            }}
            onCopyTitle={() => {
              navigator.clipboard?.writeText(sub.title);
              setIsMenuOpen(false);
            }}
            onDelete={() => {
              onDeleteSubTask(projectId, taskId, sub.id);
              setIsMenuOpen(false);
            }}
            onSetSubTaskRecurrence={onSetSubTaskRecurrence}
            onManuallyResetRecurringSubTask={onManuallyResetRecurringSubTask}
            onTogglePinSubTask={onTogglePinSubTask}
            onOpenParentDetail={onOpenParentDetail}
          />
        </div>
      </div>

      {isOver && dragOverPosition === 'bottom' && (
        <div className="h-0.5 w-full bg-slate-900 dark:bg-slate-100 rounded-full my-0.5 animate-in fade-in" />
      )}

      {isAddingChild && (
        <SubTaskInlineForm
          parentTitle={sub.title}
          value={inlineTitle}
          onChange={setInlineTitle}
          onSubmit={handleAddChildSubmit}
          onCancel={() => {
            onSetAddingChildToSubId(null);
            setInlineTitle('');
          }}
          onPaste={(e) => {
            const text = e.clipboardData.getData('text');
            if (text && text.includes('\n')) {
              e.preventDefault();
              onAddSubTask(projectId, taskId, text, sub.id);
              setInlineTitle('');
              onSetAddingChildToSubId(null);
              onToggleExpandNode(sub.id, true);
            }
          }}
          onQuickPaste={async () => {
            try {
              if (navigator.clipboard && navigator.clipboard.readText) {
                const clipText = await navigator.clipboard.readText();
                if (clipText && clipText.trim()) {
                  onAddSubTask(projectId, taskId, clipText, sub.id);
                  setInlineTitle('');
                  onSetAddingChildToSubId(null);
                  onToggleExpandNode(sub.id, true);
                  return;
                }
              }
            } catch (err) {}
            onOpenBatchPasteForTask?.(projectId, taskId, sub.id, sub.title);
          }}
        />
      )}

      {hasChildren && isNodeExpanded && (
        <div className="ml-2 sm:ml-2.5 pl-2 sm:pl-2.5 border-l border-slate-200/90 dark:border-slate-800 space-y-0.5 my-0.5">
          {sub.subtasks!.map((child) => (
            <SubTaskRow
              key={child.id} sub={child} depth={depth + 1}
              projectId={projectId} taskId={taskId}
              onToggleSubTask={onToggleSubTask} onDeleteSubTask={onDeleteSubTask}
              onAddSubTask={onAddSubTask} expandedNodes={expandedNodes}
              onToggleExpandNode={onToggleExpandNode} addingChildToSubId={addingChildToSubId}
              onSetAddingChildToSubId={onSetAddingChildToSubId} filterMode={filterMode}
              onEditSubtaskTitle={onEditSubtaskTitle}
              statuses={statuses}
              onAddCustomStatus={onAddCustomStatus}
              onDeleteCustomStatus={onDeleteCustomStatus}
              onChangeSubtaskStatus={onChangeSubtaskStatus}
              onOpenBatchPasteForTask={onOpenBatchPasteForTask}
              onSetSubTaskRecurrence={onSetSubTaskRecurrence}
              onManuallyResetRecurringSubTask={onManuallyResetRecurringSubTask}
              onTogglePinSubTask={onTogglePinSubTask}
              onOpenParentDetail={onOpenParentDetail}
              isDragging={draggedSubId === child.id}
              isOver={dragOverSub?.subId === child.id}
              dragOverPosition={dragOverSub?.subId === child.id ? dragOverSub.position : null}
              onSubDragStart={onSubDragStart}
              onSubDragOver={onSubDragOver}
              onSubDrop={onSubDrop}
              onSubDragEnd={onSubDragEnd}
              draggedSubId={draggedSubId}
              dragOverSub={dragOverSub}
            />
          ))}

          {!isAddingChild && (
            <div className="flex items-center gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={() => { onSetAddingChildToSubId(sub.id); onToggleExpandNode(sub.id, true); }}
                className="flex items-center gap-1.5 py-0.5 px-1 text-[11px] text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 rounded cursor-pointer transition-colors text-left font-normal select-none"
              >
                <Plus className="w-2.5 h-2.5 shrink-0 stroke-[2]" aria-hidden="true" />
                <span>Thêm việc con</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    if (navigator.clipboard && navigator.clipboard.readText) {
                      const clipText = await navigator.clipboard.readText();
                      if (clipText && clipText.trim()) {
                        onAddSubTask(projectId, taskId, clipText, sub.id);
                        onToggleExpandNode(sub.id, true);
                        return;
                      }
                    }
                  } catch (err) {}
                  onOpenBatchPasteForTask?.(projectId, taskId, sub.id, sub.title);
                }}
                className="flex items-center gap-1 py-0.5 px-1.5 text-[10px] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100/80 hover:bg-slate-200/70 dark:bg-slate-800/70 dark:hover:bg-slate-700/60 rounded cursor-pointer transition-colors font-medium select-none shrink-0"
                title={`Dán nhanh việc con vào "${sub.title}"`}
              >
                <ClipboardPaste className="w-2.5 h-2.5" />
                <span>Dán nhanh</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
