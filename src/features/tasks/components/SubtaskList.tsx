import React, { useRef, useEffect, useState } from 'react';
import { ClipboardPaste, Plus } from 'lucide-react';
import { Task, StatusDefinition } from '../../../types';
import { countSubtaskLeaves } from '../utils/statusCategory';
import { SubTaskRow } from './SubTaskRow';

export interface SubtaskListProps {
  projectId: string;
  task: Task;
  filterMode: 'active' | 'all' | 'completed';
  onFilterModeChange: (mode: 'active' | 'all' | 'completed') => void;
  isCompletedExpanded: boolean;
  onToggleCompletedExpanded: () => void;
  showAllActive: boolean;
  onToggleShowAllActive: (show: boolean) => void;
  expandedSubTaskId: string | null;
  onToggleExpandedSubTaskId: (id: string | null) => void;
  onToggleSubTask: (projId: string, taskId: string, subId: string, completed: boolean) => void;
  onDeleteSubTask: (projId: string, taskId: string, subId: string) => void;
  statuses?: StatusDefinition[];
  onAddCustomStatus?: (label: string, category: 'todo' | 'doing' | 'done', color: string) => StatusDefinition | null;
  onDeleteCustomStatus?: (statusId: string) => void;
  onChangeSubtaskStatus?: (projId: string, taskId: string, subId: string, status: string, isDoneCategory: boolean) => void;
  isInputActive: boolean;
  newSubTaskTitle: string;
  onNewSubTaskTitleChange: (val: string) => void;
  onAddSubTask: (
    projId: string,
    taskId: string,
    title?: string,
    parentSubId?: string | null
  ) => void;
  onCloseInput: () => void;
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
  onOpenBatchPasteForTask?: (projId: string, taskId: string, parentSubId?: string | null, targetTitle?: string) => void;
}

export function SubtaskList({
  projectId,
  task,
  filterMode,
  onFilterModeChange,
  onToggleSubTask,
  onDeleteSubTask,
  statuses = [],
  onAddCustomStatus = () => null,
  onDeleteCustomStatus = () => {},
  onChangeSubtaskStatus,
  isInputActive,
  newSubTaskTitle,
  onNewSubTaskTitleChange,
  onAddSubTask,
  onCloseInput,
  onEditSubtaskTitle,
  onReorderSubtask,
  onOpenBatchPasteForTask,
}: SubtaskListProps) {
  const rootInputRef = useRef<HTMLInputElement>(null);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [addingChildToSubId, setAddingChildToSubId] = useState<string | null>(null);
  const [isRootInputOpen, setIsRootInputOpen] = useState(false);
  const [draggedSubId, setDraggedSubId] = useState<string | null>(null);
  const [dragOverSub, setDragOverSub] = useState<{
    subId: string;
    position: 'top' | 'bottom';
  } | null>(null);

  useEffect(() => {
    if (isInputActive || isRootInputOpen) {
      rootInputRef.current?.focus();
    }
  }, [isInputActive, isRootInputOpen]);

  const toggleExpandNode = (subId: string, forceExpand?: boolean) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [subId]: forceExpand !== undefined ? forceExpand : !(prev[subId] ?? true),
    }));
  };

  const handleSubDragStart = (e: React.DragEvent, subId: string) => {
    const target = e.target as HTMLElement;
    if (target.closest('input, button, a')) {
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    setDraggedSubId(subId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `subtask:${subId}`);
  };

  const handleSubDragOver = (e: React.DragEvent, subId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (!draggedSubId || draggedSubId === subId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position = e.clientY < midY ? 'top' : 'bottom';

    if (!dragOverSub || dragOverSub.subId !== subId || dragOverSub.position !== position) {
      setDragOverSub({ subId, position });
    }
  };

  const handleSubDrop = (e: React.DragEvent, targetSubId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedSubId && draggedSubId !== targetSubId && onReorderSubtask) {
      const pos = dragOverSub?.position || 'bottom';
      onReorderSubtask(projectId, task.id, draggedSubId, targetSubId, pos);
    }
    setDraggedSubId(null);
    setDragOverSub(null);
  };

  const handleSubDragEnd = (e: React.DragEvent) => {
    e.stopPropagation();
    setDraggedSubId(null);
    setDragOverSub(null);
  };

  let totalLeafs = 0;
  let doneLeafs = 0;
  if (task.subtasks) {
    for (const sub of task.subtasks) {
      const stats = countSubtaskLeaves(sub, statuses);
      totalLeafs += stats.total;
      doneLeafs += stats.completed;
    }
  }

  const handleRootSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubTaskTitle.trim()) {
      onAddSubTask(projectId, task.id, newSubTaskTitle.trim(), null);
      onNewSubTaskTitleChange('');
      onCloseInput();
      setIsRootInputOpen(false);
    }
  };

  const handleQuickPaste = async (parentSubId: string | null, targetTitle: string) => {
    try {
      if (navigator.clipboard?.readText) {
        const clipboardText = await navigator.clipboard.readText();
        if (clipboardText.trim()) {
          onAddSubTask(projectId, task.id, clipboardText, parentSubId);
          if (parentSubId) toggleExpandNode(parentSubId, true);
          return;
        }
      }
    } catch (error) {
      // Clipboard permissions may require a user gesture or secure context.
    }
    onOpenBatchPasteForTask?.(projectId, task.id, parentSubId, targetTitle);
  };

  const handleRootPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    if (text.includes('\n')) {
      e.preventDefault();
      onAddSubTask(projectId, task.id, text, null);
      onNewSubTaskTitleChange('');
      onCloseInput();
      setIsRootInputOpen(false);
    }
  };

  return (
    <div className="space-y-1 mt-1 pt-1 border-t border-slate-100 dark:border-slate-800/80 text-xs">
      {totalLeafs > 1 && (
        <div className="flex items-center justify-end pb-0.5">
          <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded text-[10px] shrink-0">
            <button
              type="button"
              onClick={() => onFilterModeChange('all')}
              className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Tất cả ({totalLeafs})
            </button>
            <button
              type="button"
              onClick={() => onFilterModeChange('active')}
              className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                filterMode === 'active'
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Cần làm ({totalLeafs - doneLeafs})
            </button>
            <button
              type="button"
              onClick={() => onFilterModeChange('completed')}
              className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                filterMode === 'completed'
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Đã xong ({doneLeafs})
            </button>
          </div>
        </div>
      )}

      {/* Danh sách toàn bộ các bước con */}
      <div className="space-y-0.5">
        {task.subtasks.map((sub) => (
          <SubTaskRow
            key={sub.id}
            sub={sub}
            depth={0}
            projectId={projectId}
            taskId={task.id}
            onToggleSubTask={onToggleSubTask}
            onDeleteSubTask={onDeleteSubTask}
            onAddSubTask={onAddSubTask}
            expandedNodes={expandedNodes}
            onToggleExpandNode={toggleExpandNode}
            addingChildToSubId={addingChildToSubId}
            onSetAddingChildToSubId={setAddingChildToSubId}
            filterMode={filterMode}
            onEditSubtaskTitle={onEditSubtaskTitle}
            statuses={statuses}
            onAddCustomStatus={onAddCustomStatus}
            onDeleteCustomStatus={onDeleteCustomStatus}
            onChangeSubtaskStatus={onChangeSubtaskStatus}
            onOpenBatchPasteForTask={onOpenBatchPasteForTask}
            isDragging={draggedSubId === sub.id}
            isOver={dragOverSub?.subId === sub.id}
            dragOverPosition={dragOverSub?.subId === sub.id ? dragOverSub.position : null}
            onSubDragStart={handleSubDragStart}
            onSubDragOver={handleSubDragOver}
            onSubDrop={handleSubDrop}
            onSubDragEnd={handleSubDragEnd}
            draggedSubId={draggedSubId}
            dragOverSub={dragOverSub}
          />
        ))}
      </div>

      {/* Ô nhập hoặc nút "Thêm việc con" dưới đáy danh sách */}
      {isInputActive || isRootInputOpen ? (
        <form onSubmit={handleRootSubmit} className="flex items-center gap-1.5 pt-1 animate-in fade-in duration-100">
          <input
            ref={rootInputRef}
            type="text"
            value={newSubTaskTitle}
            onChange={(e) => onNewSubTaskTitleChange(e.target.value)}
            onPaste={handleRootPaste}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                onCloseInput();
                setIsRootInputOpen(false);
              }
            }}
            placeholder="Nhập tên việc con... (Enter để lưu)"
            className="flex-1 h-7 px-2 bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-slate-800 dark:focus:border-slate-400 transition-all shadow-2xs"
          />
          <button
            type="submit"
            disabled={!newSubTaskTitle.trim()}
            className="h-7 px-2.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white disabled:opacity-40 text-white dark:text-slate-950 rounded-md text-[11px] font-medium cursor-pointer transition-colors shrink-0 shadow-2xs"
          >
            Lưu
          </button>
          <button
            type="button"
            onClick={() => handleQuickPaste(null, task.title)}
            className="h-7 px-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-[10.5px] cursor-pointer shrink-0 transition-colors flex items-center gap-1"
            title="Dán nhanh danh sách việc con từ Clipboard"
          >
            <ClipboardPaste className="w-3 h-3" />
            <span className="hidden sm:inline">Dán</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onCloseInput();
              setIsRootInputOpen(false);
            }}
            className="h-7 px-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs cursor-pointer rounded-md shrink-0 transition-colors"
            title="Đóng (Esc)"
          >
            Hủy
          </button>
        </form>
      ) : (
        <div className="flex items-center gap-1.5 pt-0.5">
          <button
            type="button"
            onClick={() => setIsRootInputOpen(true)}
            className="flex-1 flex items-center gap-1.5 py-1 px-1.5 text-[11px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 rounded cursor-pointer transition-colors text-left font-normal select-none"
          >
            <Plus className="w-3 h-3 shrink-0 stroke-[1.75]" aria-hidden="true" />
            <span>Thêm việc con</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickPaste(null, task.title)}
            className="flex items-center gap-1 py-1 px-2 text-[10.5px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800/70 dark:hover:bg-slate-700/70 rounded cursor-pointer transition-colors font-medium shrink-0"
            title="Dán nhanh việc con từ Clipboard hoặc nhập thủ công"
          >
            <ClipboardPaste className="w-3 h-3 shrink-0" />
            <span>Dán nhanh</span>
          </button>
        </div>
      )}
    </div>
  );
}
