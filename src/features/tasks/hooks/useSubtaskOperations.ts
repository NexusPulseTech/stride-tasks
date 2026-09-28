import { useState } from 'react';
import { Project, Task, SubTask } from '../../../types';
import { parsePastedTasks } from '../utils/batchParser';
import {
  toggleSubtaskInTree,
  addNestedSubtask,
  deleteNestedSubtask,
  updateSubtaskTitleInTree,
  determineTaskStatusFromSubtasks,
} from '../utils/subtaskTree';
import { reorderSubtaskTree } from '../utils/subtaskReorder';
import { triggerHaptic } from '../../../utils';

interface SubtaskOperationsDeps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  showToast: (msg: string) => void;
  triggerUndoableAction: (message: string, undoFn: () => void) => void;
  handleDoneStreak: () => void;
  playChime: (isMuted: boolean) => void;
  isMuted: boolean;
  onTaskDone?: (completed: boolean, task?: Task, project?: Project) => void;
}

export function useSubtaskOperations({
  projects,
  setProjects,
  showToast,
  triggerUndoableAction,
  handleDoneStreak,
  playChime,
  isMuted,
  onTaskDone,
}: SubtaskOperationsDeps) {
  const [subInputs, setSubInputs] = useState<Record<string, string>>({});
  const [activeSubTaskId, setActiveSubTaskId] = useState<string | null>(null);
  const [expandedSubtasks, setExpandedSubtasks] = useState<Record<string, boolean>>({});
  const [showCompletedSubs, setShowCompletedSubs] = useState<Record<string, boolean>>({});
  const [subtaskFilterMap, setSubtaskFilterMap] = useState<
    Record<string, 'active' | 'all' | 'completed'>
  >({});
  const [showAllActiveSubs, setShowAllActiveSubs] = useState<Record<string, boolean>>({});
  const [expandedSubTaskId, setExpandedSubTaskId] = useState<string | null>(null);

  const toggleExpandSubtasks = (taskId: string) => {
    setExpandedSubtasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const openAddSubtask = (taskId: string) => {
    setActiveSubTaskId(taskId);
    setExpandedSubtasks((prev) => ({ ...prev, [taskId]: true }));
  };

  const toggleCompletedSubExpanded = (taskId: string) => {
    setShowCompletedSubs((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const handleSubtaskFilterModeChange = (
    taskId: string,
    mode: 'active' | 'all' | 'completed'
  ) => {
    setSubtaskFilterMap((prev) => ({
      ...prev,
      [taskId]: mode,
    }));
  };

  const toggleShowAllActiveSubs = (taskId: string, show: boolean) => {
    setShowAllActiveSubs((prev) => ({
      ...prev,
      [taskId]: show,
    }));
  };

  const handleAddSubTask = (
    projId: string,
    taskId: string,
    textParam?: string,
    parentSubId?: string | null
  ) => {
    const rawText = textParam !== undefined ? textParam : subInputs[taskId];
    const text = rawText?.trim();
    if (!text) return;

    triggerHaptic();

    const titles = text.includes('\n') ? parsePastedTasks(text) : [text];
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projId) return p;
        return {
          ...p,
          tasks: p.tasks.map((t) => {
            if (t.id !== taskId) return t;
            let currentSubs = t.subtasks;
            titles.forEach((title) => {
              const newSub: SubTask = {
                id: 's_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9),
                title,
                completed: false,
                subtasks: [],
              };
              currentSubs = addNestedSubtask(currentSubs, parentSubId ?? null, newSub);
            });
            const nextStatus = determineTaskStatusFromSubtasks(t.status, currentSubs);
            return { ...t, status: nextStatus, subtasks: currentSubs };
          }),
        };
      })
    );
    setExpandedSubtasks((prev) => ({ ...prev, [taskId]: true }));
    if (textParam === undefined) setSubInputs((prev) => ({ ...prev, [taskId]: '' }));
    showToast(titles.length > 1 ? `Đã thêm ${titles.length} việc con!` : parentSubId ? 'Đã thêm việc con mới!' : 'Đã thêm việc con!');
  };

  const toggleSubTask = (projId: string, taskId: string, subId: string, isChecked: boolean) => {
    triggerHaptic();
    let wasAllDoneTriggered = false;

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projId) return p;
        return {
          ...p,
          tasks: p.tasks.map((t) => {
            if (t.id !== taskId) return t;
            const { updatedSubtasks } = toggleSubtaskInTree(t.subtasks, subId, isChecked);
            const nextStatus = determineTaskStatusFromSubtasks(t.status, updatedSubtasks);

            if (nextStatus === 'done' && t.status !== 'done') {
              wasAllDoneTriggered = true;
            }

            return { ...t, status: nextStatus, subtasks: updatedSubtasks };
          }),
        };
      })
    );

    if (isChecked) {
      playChime(isMuted);
    }

    if (wasAllDoneTriggered) {
      handleDoneStreak();
      const p = projects.find((item) => item.id === projId);
      const targetTask = p?.tasks.find((item) => item.id === taskId);
      if (p) {
        onTaskDone?.(true, targetTask ? { ...targetTask, status: 'done' } : undefined, p);
        const remaining = p.tasks.filter((t) => t.id !== taskId && t.status !== 'done');
        if (remaining.length === 0) {
          showToast(`🎉 Hoàn thành xuất sắc toàn bộ bước con của việc này!`);
        }
      }
    }
  };

  const handleDeleteSubTask = (projId: string, taskId: string, subId: string) => {
    const p = projects.find((item) => item.id === projId);
    const t = p?.tasks.find((item) => item.id === taskId);
    if (!t) return;

    let deletedSub: SubTask | null = null;
    const oldSubs = t.subtasks;

    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== projId) return proj;
        return {
          ...proj,
          tasks: proj.tasks.map((task) => {
            if (task.id !== taskId) return task;
            const { updatedSubtasks, deletedItem } = deleteNestedSubtask(task.subtasks, subId);
            deletedSub = deletedItem;
            const nextStatus = determineTaskStatusFromSubtasks(task.status, updatedSubtasks);
            return {
              ...task,
              status: nextStatus,
              subtasks: updatedSubtasks,
            };
          }),
        };
      })
    );

    if (deletedSub) {
      triggerUndoableAction(`Đã xóa bước "${(deletedSub as SubTask).title.slice(0, 18)}..."`, () => {
        setProjects((prev) =>
          prev.map((proj) => {
            if (proj.id !== projId) return proj;
            return {
              ...proj,
              tasks: proj.tasks.map((task) => {
                if (task.id !== taskId) return task;
                const nextStatus = determineTaskStatusFromSubtasks(task.status, oldSubs);
                return { ...task, status: nextStatus, subtasks: oldSubs };
              }),
            };
          })
        );
      });
    }
  };

  const handleEditSubtaskTitle = (
    projId: string,
    taskId: string,
    subId: string,
    newTitle: string
  ) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== projId) return proj;
        return {
          ...proj,
          tasks: proj.tasks.map((task) => {
            if (task.id !== taskId) return task;
            return {
              ...task,
              subtasks: updateSubtaskTitleInTree(task.subtasks, subId, trimmed),
            };
          }),
        };
      })
    );
    showToast('Đã cập nhật tên việc con!');
  };

  const handleReorderSubtask = (
    projId: string,
    taskId: string,
    sourceId: string,
    targetId: string,
    position: 'top' | 'bottom'
  ) => {
    if (sourceId === targetId) return;
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== projId) return proj;
        return {
          ...proj,
          tasks: proj.tasks.map((task) => {
            if (task.id !== taskId) return task;
            const updated = reorderSubtaskTree(task.subtasks, sourceId, targetId, position);
            const nextStatus = determineTaskStatusFromSubtasks(task.status, updated);
            return { ...task, status: nextStatus, subtasks: updated };
          }),
        };
      })
    );
    triggerHaptic();
  };

  return {
    subInputs,
    setSubInputs,
    activeSubTaskId,
    setActiveSubTaskId,
    expandedSubtasks,
    setExpandedSubtasks,
    showCompletedSubs,
    setShowCompletedSubs,
    subtaskFilterMap,
    setSubtaskFilterMap,
    showAllActiveSubs,
    setShowAllActiveSubs,
    expandedSubTaskId,
    setExpandedSubTaskId,
    toggleExpandSubtasks,
    openAddSubtask,
    toggleCompletedSubExpanded,
    handleSubtaskFilterModeChange,
    toggleShowAllActiveSubs,
    handleAddSubTask,
    toggleSubTask,
    handleDeleteSubTask,
    handleEditSubtaskTitle,
    handleReorderSubtask,
  };
}
