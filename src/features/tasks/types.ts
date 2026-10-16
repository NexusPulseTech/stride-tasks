import React from 'react';
import { Task, StatusDefinition, RecurrenceType } from '../../types';

export interface TaskItemProps {
  projectId: string;
  task: Task;
  taskIndex: number;
  totalProjectTasks: number;
  isDragging: boolean;
  isOver: boolean;
  dragOverPosition: 'top' | 'bottom' | null;
  onDragStart: (e: React.DragEvent, projId: string, index: number) => void;
  onDragOver: (e: React.DragEvent, projId: string, index: number) => void;
  onDrop: (e: React.DragEvent, projId: string, index: number) => void;
  onDragEnd: () => void;
  expandedTaskId: string | null;
  onToggleExpandTask: (id: string | null) => void;
  onToggleTaskDone: (projId: string, taskId: string, done: boolean) => void;
  onChangeStatus: (projId: string, taskId: string, status: string, isDoneCategory?: boolean) => void;
  statuses: StatusDefinition[];
  onAddCustomStatus: (label: string, category: 'todo' | 'doing' | 'done', color: string) => StatusDefinition | null;
  onDeleteCustomStatus: (statusId: string) => void;
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
  isSubOpen: boolean;
  onToggleExpandSubtasks: (taskId: string) => void;
  isAddingSub: boolean;
  subtaskFilterMode: 'active' | 'all' | 'completed';
  onSubtaskFilterModeChange: (mode: 'active' | 'all' | 'completed') => void;
  isCompletedSubExpanded: boolean;
  onToggleCompletedSubExpanded: () => void;
  showAllActiveSubs: boolean;
  onToggleShowAllActiveSubs: (show: boolean) => void;
  expandedSubTaskId: string | null;
  onToggleExpandedSubTaskId: (id: string | null) => void;
  onToggleSubTask: (projId: string, taskId: string, subId: string, completed: boolean) => void;
  onDeleteSubTask: (projId: string, taskId: string, subId: string) => void;
  newSubTaskTitle: string;
  onNewSubTaskTitleChange: (val: string) => void;
  onAddSubTask: (
    projId: string,
    taskId: string,
    title?: string,
    parentSubId?: string | null
  ) => void;
  onCloseSubtaskInput: () => void;
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
  onOpenBatchPasteForTask?: (
    projId: string,
    taskId: string,
    parentSubId?: string | null,
    targetTitle?: string
  ) => void;
  onOpenDetail?: (task: Task, projectId: string) => void;
  onOpenSchedule?: (task: Task, projectId: string) => void;
  onTogglePinSubTask?: (projId: string, taskId: string, subId: string) => void;
  onOpenAnkiSrs?: (task: Task, projectId: string, parentTaskId?: string) => void;
}
