import React, { useState } from 'react';
import {
  Pin,
  Check,
  Folder,
  ChevronRight,
  Eye,
  Plus,
  Trash2,
  Calendar,
  Clock,
} from 'lucide-react';
import { Task, Project, SubTask, StatusDefinition } from '../../../types';
import { FormattedTaskText } from '../utils/formatters';
import { RecurrenceBadge } from './RecurrenceBadge';
import { isDoneStatus } from '../utils/statusCategory';
import { countLeafSubtasks } from '../utils/subtaskTree';
import { formatScheduleBadge } from '../utils/scheduleHelper';

export type PinnedItem =
  | {
      type: 'task';
      task: Task;
      project: Project;
    }
  | {
      type: 'subtask';
      subtask: SubTask;
      parentTask: Task;
      project: Project;
      path?: string[];
    };

interface PinnedSectionProps {
  pinnedTasks?: PinnedItem[];
  pinnedItems?: PinnedItem[];
  expandedTaskId?: string | null;
  onToggleExpand?: (id: string) => void;
  onToggleTaskDone: (projId: string, taskId: string, done: boolean) => void;
  onChangeStatus?: (projId: string, taskId: string, nextStatus: 'todo' | 'doing' | 'done') => void;
  onTogglePinTask: (projId: string, taskId: string, e: React.MouseEvent) => void;
  onTogglePinSubTask?: (projId: string, taskId: string, subId: string) => void;
  onEditTaskTitle?: (projId: string, taskId: string, newTitle: string) => void;
  onEditSubtaskTitle?: (projId: string, taskId: string, subId: string, newTitle: string) => void;
  onToggleSubTask?: (projId: string, taskId: string, subId: string, completed: boolean) => void;
  onDeleteSubTask?: (projId: string, taskId: string, subId: string) => void;
  onAddSubTask?: (projId: string, taskId: string, title?: string, parentSubId?: string | null) => void;
  onOpenDetail?: (task: Task, projectId: string) => void;
  onOpenSchedule?: (task: Task, project: Project) => void;
  statuses?: StatusDefinition[];
}

function countArrayLeafSubtasks(subs: SubTask[]): { total: number; completed: number } {
  let total = 0;
  let completed = 0;
  for (const s of subs) {
    const res = countLeafSubtasks(s);
    total += res.total;
    completed += res.completed;
  }
  return { total, completed };
}

interface PinnedSubtaskBranchProps {
  subs: SubTask[];
  projectId: string;
  parentTaskId: string;
  statuses: StatusDefinition[];
  depth?: number;
  expandedPinnedSubs: Record<string, boolean>;
  onToggleExpandSub: (id: string) => void;
  onToggleSubTask?: (projId: string, taskId: string, subId: string, completed: boolean) => void;
  onDeleteSubTask?: (projId: string, taskId: string, subId: string) => void;
  onAddSubTask?: (projId: string, taskId: string, title?: string, parentSubId?: string | null) => void;
  newSubInputs: Record<string, string>;
  onNewSubInputChange: (key: string, val: string) => void;
  addingToId: string | null;
  onSetAddingToId: (id: string | null) => void;
}

function PinnedSubtaskBranch({
  subs,
  projectId,
  parentTaskId,
  statuses,
  depth = 0,
  expandedPinnedSubs,
  onToggleExpandSub,
  onToggleSubTask,
  onDeleteSubTask,
  onAddSubTask,
  newSubInputs,
  onNewSubInputChange,
  addingToId,
  onSetAddingToId,
}: PinnedSubtaskBranchProps) {
  if (!subs || subs.length === 0) return null;

  return (
    <div className={`space-y-1 ${depth > 0 ? 'ml-3 pl-2.5 border-l border-slate-200/80 dark:border-slate-800' : ''}`}>
      {subs.map((childSub) => {
        const childDone = childSub.status
          ? isDoneStatus(childSub.status, statuses)
          : childSub.completed;
        const hasChildren = childSub.subtasks && childSub.subtasks.length > 0;
        const isChildExpanded = Boolean(expandedPinnedSubs[childSub.id]); // Mặc định ĐÓNG, chỉ mở khi người dùng bấm dropdown
        const childStats = hasChildren && childSub.subtasks ? countArrayLeafSubtasks(childSub.subtasks) : { total: 0, completed: 0 };

        return (
          <div key={childSub.id} className="space-y-1">
            <div className="group/child flex items-start gap-1.5 py-1 px-1.5 rounded-lg hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors text-xs flex-nowrap">
              {/* Checkbox subtask con */}
              <button
                type="button"
                onClick={() => {
                  if (onToggleSubTask) {
                    onToggleSubTask(projectId, parentTaskId, childSub.id, !childDone);
                  }
                }}
                className="mt-0.5 shrink-0 cursor-pointer p-0.5 rounded-full"
                aria-label={childDone ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${
                    childDone
                      ? 'bg-[#34c759] border-[#34c759] text-white'
                      : 'border-slate-300 dark:border-slate-600 hover:border-slate-500'
                  }`}
                >
                  {childDone && <Check className="w-2 h-2 shrink-0" strokeWidth={3} />}
                </div>
              </button>

              {/* Nút toggle nếu có con */}
              {hasChildren && (
                <button
                  type="button"
                  onClick={() => onToggleExpandSub(childSub.id)}
                  className="mt-0.5 w-4 h-4 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center shrink-0 cursor-pointer rounded"
                  title={isChildExpanded ? 'Thu gọn' : 'Xem các bước con bên dưới'}
                >
                  <ChevronRight
                    className={`w-3 h-3 transition-transform duration-150 ${
                      isChildExpanded ? 'rotate-90 text-slate-700 dark:text-slate-200' : ''
                    }`}
                  />
                </button>
              )}

              {/* Tiêu đề subtask con (không bị cắt chữ bí bách) */}
              <div className="flex-1 min-w-0 pr-1">
                <span
                  className={`text-xs block break-words leading-relaxed ${
                    childDone
                      ? 'line-through text-slate-400 dark:text-slate-500'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <FormattedTaskText text={childSub.title} isDone={childDone} />
                </span>

                {/* Subtask badges row */}
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  {/* Badge số lượng việc con */}
                  {hasChildren && (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      {childStats.completed}/{childStats.total} việc con
                    </span>
                  )}

                  {/* Recurrence nếu có */}
                  {childSub.recurrence && (
                    <RecurrenceBadge
                      recurrence={childSub.recurrence}
                      recurrenceStreak={childSub.recurrenceStreak}
                      isDone={childDone}
                    />
                  )}
                </div>
              </div>

              {/* Quick actions for this child subtask */}
              <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover/child:opacity-100 transition-opacity">
                {onAddSubTask && (
                  <button
                    type="button"
                    onClick={() => onSetAddingToId(childSub.id)}
                    className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer rounded"
                    title="Thêm bước con bên dưới"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}

                {onDeleteSubTask && (
                  <button
                    type="button"
                    onClick={() => onDeleteSubTask(projectId, parentTaskId, childSub.id)}
                    className="p-1 text-slate-300 dark:text-slate-600 hover:text-rose-500 cursor-pointer rounded"
                    title="Xóa bước con này"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Input thêm việc con trực tiếp cho nút này nếu đang mở */}
            {addingToId === childSub.id && onAddSubTask && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const val = newSubInputs[childSub.id]?.trim();
                  if (!val) return;
                  onAddSubTask(projectId, parentTaskId, val, childSub.id);
                  onNewSubInputChange(childSub.id, '');
                  onSetAddingToId(null);
                  onToggleExpandSub(childSub.id);
                }}
                className="flex items-center gap-1.5 ml-5 my-1"
              >
                <input
                  type="text"
                  value={newSubInputs[childSub.id] || ''}
                  onChange={(e) => onNewSubInputChange(childSub.id, e.target.value)}
                  autoFocus
                  placeholder={`Thêm bước con cho "${childSub.title.slice(0, 15)}..."`}
                  className="flex-1 text-xs px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md outline-none text-slate-900 dark:text-slate-100"
                />
                <button
                  type="submit"
                  className="h-6 px-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium rounded cursor-pointer"
                >
                  Lưu
                </button>
                <button
                  type="button"
                  onClick={() => onSetAddingToId(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 px-1 cursor-pointer"
                >
                  Hủy
                </button>
              </form>
            )}

            {/* Đệ quy hiển thị các bước con cấp tiếp theo (Recursive Hierarchical Subtasks) */}
            {hasChildren && isChildExpanded && (
              <PinnedSubtaskBranch
                subs={childSub.subtasks || []}
                projectId={projectId}
                parentTaskId={parentTaskId}
                statuses={statuses}
                depth={depth + 1}
                expandedPinnedSubs={expandedPinnedSubs}
                onToggleExpandSub={onToggleExpandSub}
                onToggleSubTask={onToggleSubTask}
                onDeleteSubTask={onDeleteSubTask}
                onAddSubTask={onAddSubTask}
                newSubInputs={newSubInputs}
                onNewSubInputChange={onNewSubInputChange}
                addingToId={addingToId}
                onSetAddingToId={onSetAddingToId}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function PinnedSection({
  pinnedTasks,
  pinnedItems,
  expandedTaskId,
  onToggleExpand,
  onToggleTaskDone,
  onChangeStatus,
  onTogglePinTask,
  onTogglePinSubTask,
  onEditTaskTitle,
  onToggleSubTask,
  onDeleteSubTask,
  onAddSubTask,
  onOpenDetail,
  onOpenSchedule,
  statuses = [],
}: PinnedSectionProps) {
  const items = pinnedItems || pinnedTasks || [];
  const [expandedPinnedSubs, setExpandedPinnedSubs] = useState<Record<string, boolean>>({});
  const [newSubInputs, setNewSubInputs] = useState<Record<string, string>>({});
  const [addingToId, setAddingToId] = useState<string | null>(null);

  if (items.length === 0) return null;

  const toggleSubExpand = (id: string) => {
    setExpandedPinnedSubs((prev) => ({
      ...prev,
      [id]: prev[id] === undefined ? true : !prev[id],
    }));
  };

  const handleAddSub = (projId: string, taskId: string, parentSubId: string | null = null) => {
    const key = parentSubId || taskId;
    const text = newSubInputs[key]?.trim();
    if (!text || !onAddSubTask) return;
    onAddSubTask(projId, taskId, text, parentSubId);
    setNewSubInputs((prev) => ({ ...prev, [key]: '' }));
    setAddingToId(null);
  };

  return (
    <div className="bg-slate-100/60 dark:bg-[#161b22]/80 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 space-y-2.5 shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="h-6 flex items-center justify-between flex-nowrap gap-2 overflow-hidden">
        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-800 dark:text-slate-200 truncate flex-1 min-w-0">
          <Pin className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400 fill-current" strokeWidth={1.5} aria-hidden="true" />
          <span className="truncate">Tiêu điểm ưu tiên ({items.length})</span>
        </div>
        <span className="text-[10.5px] text-slate-500 dark:text-slate-400 shrink-0 whitespace-nowrap hidden sm:inline">
          Việc quan trọng cần làm trước
        </span>
      </div>

      {/* Danh sách các mục đã ghim */}
      <div className="space-y-2">
        {items.map((item, idx) => {
          const isTaskType = !('type' in item) || item.type === 'task';
          const task = isTaskType ? (item as any).task : item.parentTask;
          const project = item.project;
          const subtask = !isTaskType ? (item as any).subtask : null;

          const itemId = isTaskType ? `pin_task_${task.id}` : `pin_sub_${subtask.id}`;
          const title = isTaskType ? task.title : subtask.title;
          const isDone = isTaskType
            ? isDoneStatus(task.status, statuses)
            : subtask.status
            ? isDoneStatus(subtask.status, statuses)
            : subtask.completed;

          const recurrence = isTaskType ? task.recurrence : subtask?.recurrence;
          const recurrenceStreak = isTaskType ? task.recurrenceStreak : subtask?.recurrenceStreak;
          const scheduleBadge = isTaskType
            ? formatScheduleBadge(task.reminderAt, task.deadline)
            : { status: 'none', label: '', isOverdue: false };

          // Danh sách subtasks con hiển thị dưới mục ghim
          const subs: SubTask[] = isTaskType
            ? task.subtasks || []
            : subtask?.subtasks || [];
          const hasSubs = subs.length > 0;
          const isSubsOpen = Boolean(expandedPinnedSubs[itemId]); // Mặc định ĐÓNG, chỉ mở khi người dùng bấm nút
          const stats = hasSubs ? countArrayLeafSubtasks(subs) : { total: 0, completed: 0 };

          return (
            <div
              key={`${itemId}_${idx}`}
              className={`rounded-lg border transition-all overflow-hidden ${
                isDone
                  ? 'border-slate-200/60 dark:border-slate-800 bg-white/60 dark:bg-[#161b22]/50 text-slate-400 dark:text-slate-500'
                  : 'bg-white dark:bg-[#161b22] border-slate-200/90 dark:border-slate-800 shadow-2xs text-slate-800 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Item Header Row chuẩn dáng task bình thường */}
              <div className="flex items-start gap-1.5 py-1.5 px-2 sm:px-2.5 flex-nowrap w-full overflow-hidden">
                {/* Pin glyph indicator thay cho drag handle */}
                <div
                  className="mt-0.5 p-1 -ml-1 text-amber-500 dark:text-amber-400 select-none shrink-0"
                  title="Công việc được ghim ưu tiên"
                >
                  <Pin className="w-3.5 h-3.5 shrink-0 fill-current" strokeWidth={1.5} />
                </div>

                {/* Checkbox */}
                <button
                  type="button"
                  onClick={() => {
                    if (isTaskType) {
                      onToggleTaskDone(project.id, task.id, !isDone);
                    } else if (onToggleSubTask) {
                      onToggleSubTask(project.id, task.id, subtask.id, !isDone);
                    }
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
                    {isDone && <Check className="w-2.5 h-2.5 shrink-0" strokeWidth={2.5} />}
                  </div>
                </button>

                {/* Nút dropdown sổ/gập việc con chuẩn Notion */}
                {hasSubs && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSubExpand(itemId);
                    }}
                    className="w-4.5 h-4.5 mt-0.5 text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 flex items-center justify-center cursor-pointer shrink-0 transition-colors rounded hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
                    title={isSubsOpen ? 'Thu gọn việc con' : `Mở rộng ${stats.total} việc con`}
                    aria-label={isSubsOpen ? 'Thu gọn việc con' : 'Mở rộng việc con'}
                  >
                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                        isSubsOpen ? 'rotate-90 text-slate-800 dark:text-slate-200' : ''
                      }`}
                      strokeWidth={2}
                    />
                  </button>
                )}

                {/* Tiêu đề & Thông tin */}
                <div className="flex-1 min-w-0 pr-1 overflow-hidden">
                  <div
                    onClick={() => {
                      if (onOpenDetail) onOpenDetail(task, project.id);
                    }}
                    className={`text-[13px] leading-snug font-normal break-words cursor-pointer hover:text-slate-950 dark:hover:text-white transition-colors ${
                      isDone ? 'line-through text-slate-400 dark:text-slate-500' : ''
                    }`}
                    title="Nhấp để xem chi tiết"
                  >
                    <FormattedTaskText text={title} isDone={isDone} />
                  </div>

                  {/* Metadata Row */}
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {/* Project & Path Tag */}
                    <span
                      className="inline-flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded font-medium max-w-[150px] truncate shrink-0"
                      title={project.name}
                    >
                      <Folder className="w-3 h-3 shrink-0 text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
                      <span className="truncate">
                        {project.name}
                        {!isTaskType ? ` › ${task.title.slice(0, 15)}...` : ''}
                      </span>
                    </span>

                    {/* Recurrence Badge (Sạch sẽ, chuẩn Linear/Things 3, không icon lửa) */}
                    {recurrence && (
                      <RecurrenceBadge
                        recurrence={recurrence}
                        recurrenceStreak={recurrenceStreak}
                        isDone={isDone}
                      />
                    )}

                    {/* Schedule Badge nếu có */}
                    {scheduleBadge.status !== 'none' && onOpenSchedule && isTaskType && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenSchedule(task, project);
                        }}
                        className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer shrink-0 font-medium ${
                          scheduleBadge.isOverdue
                            ? 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-800/60'
                            : scheduleBadge.status === 'today'
                            ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-800/60'
                            : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/70'
                        }`}
                        title="Đổi lịch hẹn"
                      >
                        <Clock className="w-2.5 h-2.5 shrink-0" strokeWidth={1.5} />
                        <span>{scheduleBadge.label}</span>
                      </button>
                    )}

                    {/* Nút xem/thu gọn Subtasks con */}
                    {hasSubs && (
                      <button
                        type="button"
                        onClick={() => toggleSubExpand(itemId)}
                        className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer shrink-0 font-medium ${
                          isSubsOpen
                            ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                        }`}
                        title={isSubsOpen ? 'Thu gọn các bước con' : 'Xem các bước con'}
                      >
                        <ChevronRight
                          className={`w-2.5 h-2.5 shrink-0 transition-transform duration-200 ${
                            isSubsOpen ? 'rotate-90' : ''
                          }`}
                        />
                        <span className="tabular-nums">
                          {stats.completed}/{stats.total} việc con
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Action Buttons: Detail, Calendar, Unpin */}
                <div className="shrink-0 flex items-center gap-1">
                  {onOpenSchedule && isTaskType && (
                    <button
                      type="button"
                      onClick={() => onOpenSchedule(task, project)}
                      className={`p-1 rounded cursor-pointer transition-colors ${
                        scheduleBadge.status !== 'none'
                          ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                          : 'text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                      title={scheduleBadge.status !== 'none' ? `Lịch hẹn: ${scheduleBadge.label}` : 'Lên lịch nhắc thông minh'}
                      aria-label="Lên lịch nhắc"
                    >
                      <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  )}

                  {onOpenDetail && (
                    <button
                      type="button"
                      onClick={() => onOpenDetail(task, project.id)}
                      className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer rounded transition-colors"
                      title="Xem toàn bộ nội dung"
                      aria-label="Xem chi tiết"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      if (isTaskType) {
                        onTogglePinTask(project.id, task.id, e);
                      } else if (onTogglePinSubTask) {
                        onTogglePinSubTask(project.id, task.id, subtask.id);
                      }
                    }}
                    className="p-1 text-amber-600 dark:text-amber-400 hover:text-slate-400 cursor-pointer rounded transition-colors"
                    title="Bỏ ghim khỏi Tiêu điểm ưu tiên"
                    aria-label="Bỏ ghim"
                  >
                    <Pin className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              </div>

              {/* Chi tiết các bước con bên dưới việc được ghim (Hiển thị phân cấp đệ quy đầy đủ) */}
              {hasSubs && isSubsOpen && (
                <div className="px-3 pb-2.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-black/20 space-y-1.5">
                  <PinnedSubtaskBranch
                    subs={subs}
                    projectId={project.id}
                    parentTaskId={task.id}
                    statuses={statuses}
                    depth={0}
                    expandedPinnedSubs={expandedPinnedSubs}
                    onToggleExpandSub={toggleSubExpand}
                    onToggleSubTask={onToggleSubTask}
                    onDeleteSubTask={onDeleteSubTask}
                    onAddSubTask={onAddSubTask}
                    newSubInputs={newSubInputs}
                    onNewSubInputChange={(key, val) =>
                      setNewSubInputs((prev) => ({ ...prev, [key]: val }))
                    }
                    addingToId={addingToId}
                    onSetAddingToId={setAddingToId}
                  />

                  {/* Input thêm nhanh việc con trực tiếp dưới gốc của mục ghim */}
                  {onAddSubTask && (
                    <div className="pt-1">
                      {addingToId === itemId ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleAddSub(project.id, task.id, !isTaskType ? subtask.id : null);
                          }}
                          className="flex items-center gap-1.5"
                        >
                          <input
                            type="text"
                            value={newSubInputs[!isTaskType ? subtask.id : task.id] || ''}
                            onChange={(e) =>
                              setNewSubInputs((prev) => ({
                                ...prev,
                                [!isTaskType ? subtask.id : task.id]: e.target.value,
                              }))
                            }
                            autoFocus
                            placeholder="Thêm bước con tiếp theo..."
                            className="flex-1 text-xs px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md outline-none text-slate-900 dark:text-slate-100"
                          />
                          <button
                            type="submit"
                            className="h-6 px-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-medium rounded cursor-pointer"
                          >
                            Lưu
                          </button>
                          <button
                            type="button"
                            onClick={() => setAddingToId(null)}
                            className="text-xs text-slate-400 hover:text-slate-600 px-1 cursor-pointer"
                          >
                            Hủy
                          </button>
                        </form>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setAddingToId(itemId)}
                          className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 inline-flex items-center gap-1 cursor-pointer py-0.5"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Thêm bước con</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
