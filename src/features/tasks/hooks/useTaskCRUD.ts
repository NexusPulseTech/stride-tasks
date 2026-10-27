import { useState, useEffect, useRef, useCallback } from 'react';
import { Project, Task, RecurrenceType } from '../../../types';
import { STORAGE_KEY } from '../../../constants';
import { triggerHaptic, truncateText } from '../../../utils';
import { useTranslationRef, formatMessage } from '../../../i18n';
import { parsePastedTasks, parsePastedHierarchy } from '../utils/batchParser';
import { buildSmartTask, summarizeSmartTask } from '../utils/smartTaskParser';
import { cascadeSubtaskCompleted, updateSubtaskStatusInTree, determineTaskStatusFromSubtasks } from '../utils/subtaskTree';
import { exportProjectToMarkdown } from '../utils/formatters';
import { isDoneStatus } from '../utils/statusCategory';
import { stampProjectsUpdatedAt } from '../utils/updatedAtStamp';
import {
  loadProjectsSafely,
  saveProjectsSafely,
  requestPersistentStorage,
  idbGet,
  countTotalTasks,
  isSampleTemplate,
  subscribeCrossTabSync,
} from '../../../utils/persistentStorage';
import {
  getTodayDateString,
  processDailyRecurrenceRollover,
  manuallyResetRecurringTask,
  manuallyResetRecurringSubTask,
  updateTaskRecurrenceRule,
  updateSubTaskRecurrenceRule,
} from '../utils/recurringHelper';

export const STRIDE_AUTO_BACKUP_KEY = 'STRIDE_AUTO_BACKUP_DATA';

interface TaskCRUDDeps {
  showToast: (msg: string) => void;
  triggerCelebration: () => void;
  triggerUndoableAction: (message: string, undoFn: () => void) => void;
  handleDoneStreak: () => void;
  onTaskDone?: (completed: boolean, task?: Task, project?: Project) => void;
  onTaskCreated?: (projId: string, newTask: Task) => void;
}

export function useTaskCRUD({
  showToast,
  triggerCelebration,
  triggerUndoableAction,
  handleDoneStreak,
  onTaskDone,
  onTaskCreated,
}: TaskCRUDDeps) {
  const [projects, setProjectsState] = useState<Project[]>(() => {
    return loadProjectsSafely();
  });

  // Mọi thay đổi dữ liệu đi qua setter này → tự động gắn `updatedAt` cho Project / Task / SubTask thực sự thay đổi
  const setProjects = useCallback<React.Dispatch<React.SetStateAction<Project[]>>>((action) => {
    setProjectsState((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      return stampProjectsUpdatedAt(prev, next);
    });
  }, []);

  const tRef = useTranslationRef();
  const isHydratedRef = useRef(false);
  const recurrenceLabel = (rule: RecurrenceType) =>
    rule === 'daily' ? tRef.current.toast.recurrenceDaily : rule === 'weekdays' ? tRef.current.toast.recurrenceWeekdays : tRef.current.toast.recurrenceWeekly;
  const showToastRef = useRef(showToast);
  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  // 1. Tự động kiểm tra làm mới việc lặp lại khi sang ngày mới (Auto-Rollover) - chạy 1 lần khi khởi động
  useEffect(() => {
    setProjects((current) => {
      const { updatedProjects, resetCount } = processDailyRecurrenceRollover(current);
      if (resetCount > 0) {
        showToastRef.current?.(formatMessage(tRef.current.toast.recurringRolledOver, { count: resetCount }));
        return updatedProjects;
      }
      return current;
    });
  }, []);

  // 2. Khởi tạo bảo vệ: Yêu cầu Persistent Storage & kiểm tra phục hồi sâu từ IndexedDB (chỉ khi LocalStorage bị xóa sạch bởi trình duyệt)
  useEffect(() => {
    requestPersistentStorage();

    const primary = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    // CHỈ khôi phục từ IndexedDB khi LocalStorage hoàn toàn không tồn tại (do browser cleanup)
    if (primary === null) {
      idbGet<Project[]>(STORAGE_KEY).then((idbProjects) => {
        if (Array.isArray(idbProjects) && idbProjects.length > 0) {
          setProjects(idbProjects);
          saveProjectsSafely(idbProjects);
          showToastRef.current?.(formatMessage(tRef.current.toast.idbRecovered, { count: countTotalTasks(idbProjects) }));
        }
      });
    }
  }, []);

  // 3. Đồng bộ đa tab thời gian thực (Zero Desync across open tabs)
  useEffect(() => {
    const unsubscribe = subscribeCrossTabSync(() => {
      const fresh = loadProjectsSafely();
      setProjects(fresh);
    });
    return unsubscribe;
  }, []);

  // 4. Lưu an toàn trước khi đóng tab (beforeunload flush)
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveProjectsSafely(projects, false);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [projects]);

  const [newProjectName, setNewProjectName] = useState('');
  const [taskInputs, setTaskInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isHydratedRef.current) {
      isHydratedRef.current = true;
      return; // Không ghi đè ở lần mount đầu tiên tránh race condition!
    }
    saveProjectsSafely(projects);
  }, [projects]);

  const togglePinTask = (projId: string, taskId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerHaptic();
    setProjects((prev) =>
      prev.map((p) => p.id === projId ? {
        ...p,
        tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, isPinned: !t.isPinned } : t)),
      } : p)
    );
    showToast(tRef.current.toast.taskPinUpdated);
  };

  const copyTaskToClipboard = (title: string) => {
    triggerHaptic();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(title);
      showToast(tRef.current.toast.taskCopied);
    }
  };

  const copyProjectAsMarkdown = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(exportProjectToMarkdown(project));
      showToast(tRef.current.toast.checklistCopied);
    }
  };

  const handleTaskInputPaste = (projId: string, e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    if (text && text.includes('\n')) {
      const hierarchy = parsePastedHierarchy(text);
      if (hierarchy.length > 0) {
        e.preventDefault();
        triggerHaptic();
        const newTasks: Task[] = hierarchy.map((item, idx) => ({
          id: 't_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7) + '_' + idx,
          title: item.title,
          status: item.completed ? 'done' : 'todo',
          completedAt: item.completed ? new Date().toISOString() : undefined,
          subtasks: item.subtasks.map((subTitle, subIdx) => ({
            id: 's_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7) + '_' + subIdx,
            title: subTitle,
            completed: false,
            status: 'todo',
            subtasks: [],
          })),
        }));
        setProjects((prev) => prev.map((p) => (p.id === projId ? { ...p, isExpanded: true, tasks: [...p.tasks, ...newTasks] } : p)));
        showToast(formatMessage(tRef.current.toast.tasksPasted, { count: newTasks.length }));
        setTaskInputs((prev) => ({ ...prev, [projId]: '' }));
      }
    }
  };

  const handleAddProject = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const name = newProjectName.trim();
    if (!name) return;
    const newP: Project = { id: 'p_' + Date.now(), name, color: '#0071e3', isExpanded: true, tasks: [] };
    setProjects([newP, ...projects]);
    setNewProjectName('');
    showToast(formatMessage(tRef.current.toast.projectCreated, { name }));
  };

  const handleDeleteProject = (id: string, e?: React.MouseEvent) => {
    if (e && typeof e.stopPropagation === 'function') {
      try {
        e.stopPropagation();
      } catch (err) {}
    }
    const projIndex = projects.findIndex((p) => p.id === id);
    const projToDelete = projects[projIndex];
    if (!projToDelete) return;
    setProjects((prev) => prev.filter((p) => p.id !== id));
    triggerUndoableAction(formatMessage(tRef.current.toast.projectDeleted, { name: truncateText(projToDelete.name, 32) }), () => {
      setProjects((prev) => {
        const next = [...prev];
        next.splice(projIndex, 0, projToDelete);
        return next;
      });
    });
  };

  const handleAddTask = (projId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const raw = taskInputs[projId]?.trim();
    if (!raw) return;
    triggerHaptic();

    if (raw.includes('\n')) {
      const lines = parsePastedTasks(raw);
      const built = lines.map((title) => buildSmartTask(title, 'todo'));
      const newTasks = built.map((b) => b.task).filter((t): t is Task => t !== null);
      if (newTasks.length === 0) {
        showToast(tRef.current.toast.noValidLines);
        return;
      }
      setProjects((prev) => prev.map((p) => (p.id === projId ? { ...p, tasks: [...p.tasks, ...newTasks] } : p)));
      const project = projects.find((p) => p.id === projId);
      built.forEach((b) => {
        if (b.task && b.isDone) onTaskDone?.(true, b.task, project);
      });
      const skipped = lines.length - newTasks.length;
      showToast(
        formatMessage(skipped > 0 ? tRef.current.toast.tasksAddedSkipped : tRef.current.toast.tasksAdded, { count: newTasks.length, skipped })
      );
    } else {
      const { task: newTask, hasSmartTokens, isDone } = buildSmartTask(raw, 'todo');
      if (!newTask) {
        showToast(tRef.current.toast.emptyTitle);
        return;
      }
      setProjects((prev) => prev.map((p) => (p.id === projId ? { ...p, tasks: [...p.tasks, newTask] } : p)));
      if (isDone) {
        onTaskDone?.(true, newTask, projects.find((p) => p.id === projId));
      }
      const summary = hasSmartTokens ? summarizeSmartTask(newTask) : '';
      showToast(summary ? formatMessage(tRef.current.toast.taskAddedWithSummary, { summary }) : tRef.current.toast.taskAdded);
      onTaskCreated?.(projId, newTask);
    }
    setTaskInputs((prev) => ({ ...prev, [projId]: '' }));
  };

  const checkProjectCompletion = (projId: string, taskId: string) => {
    handleDoneStreak();
    const p = projects.find((item) => item.id === projId);
    if (p) {
      const remaining = p.tasks.filter((t) => t.id !== taskId && !isDoneStatus(t.status));
      if (remaining.length === 0) {
        triggerCelebration();
        showToast(formatMessage(tRef.current.toast.projectAllDone, { name: p.name }));
      }
    }
  };

  const toggleTaskDone = (projId: string, taskId: string, isChecked: boolean) => {
    triggerHaptic();
    const nextStatus: 'done' | 'todo' = isChecked ? 'done' : 'todo';
    const todayStr = getTodayDateString();

    let completedRecurring = false;
    let newStreak = 0;

    setProjects((prev) =>
      prev.map((p) => p.id !== projId ? p : {
        ...p,
        tasks: p.tasks.map((t) => {
          if (t.id !== taskId) return t;
          const isRecurring = Boolean(t.recurrence);
          if (isChecked && isRecurring) {
            completedRecurring = true;
            newStreak = (t.recurrenceStreak || 0) + 1;
          }
          return {
            ...t,
            status: nextStatus,
            completedAt: isChecked ? (t.completedAt || new Date().toISOString()) : undefined,
            snoozeUntil: isChecked ? undefined : t.snoozeUntil,
            lastCompletedDate: isChecked && isRecurring ? todayStr : t.lastCompletedDate,
            recurrenceStreak: isChecked && isRecurring ? newStreak : t.recurrenceStreak,
            subtasks: isChecked ? t.subtasks.map((s) => cascadeSubtaskCompleted(s, true)) : t.subtasks,
          };
        }),
      })
    );
    const targetProject = projects.find((item) => item.id === projId);
    const targetTask = targetProject?.tasks.find((item) => item.id === taskId);

    if (isChecked) {
      checkProjectCompletion(projId, taskId);
      onTaskDone?.(true, targetTask ? { ...targetTask, status: 'done' } : undefined, targetProject);
      if (completedRecurring) {
        showToast(formatMessage(tRef.current.toast.recurringDoneToday, { streak: newStreak }));
      }
    } else {
      onTaskDone?.(false, targetTask, targetProject);
    }
  };

  const handleSetTaskRecurrence = (projId: string, taskId: string, recurrence: RecurrenceType) => {
    setProjects((prev) => updateTaskRecurrenceRule(prev, projId, taskId, recurrence));
    showToast(recurrence ? formatMessage(tRef.current.toast.recurrenceSet, { rule: recurrenceLabel(recurrence) }) : tRef.current.toast.recurrenceOff);
  };

  const handleSetSubTaskRecurrence = (projId: string, taskId: string, subId: string, recurrence: RecurrenceType) => {
    setProjects((prev) => updateSubTaskRecurrenceRule(prev, projId, taskId, subId, recurrence));
    showToast(recurrence ? formatMessage(tRef.current.toast.recurrenceSet, { rule: recurrenceLabel(recurrence) }) : tRef.current.toast.subRecurrenceOff);
  };

  const handleManuallyResetRecurring = (projId: string, taskId: string) => {
    setProjects((prev) => manuallyResetRecurringTask(prev, projId, taskId));
    showToast(tRef.current.toast.recurringReset);
  };

  const handleManuallyResetRecurringSubTask = (projId: string, taskId: string, subId: string) => {
    setProjects((prev) => manuallyResetRecurringSubTask(prev, projId, taskId, subId));
    showToast(tRef.current.toast.subRecurringReset);
  };

  const handleSetTaskSchedule = (
    projId: string,
    taskId: string,
    schedule: { reminderAt?: string | null; deadline?: string | null }
  ) => {
    triggerHaptic();
    const isClearing = schedule.reminderAt === null && schedule.deadline === null;
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projId) return p;
        return {
          ...p,
          tasks: p.tasks.map((t) => {
            if (t.id !== taskId) return t;
            return {
              ...t,
              reminderAt: schedule.reminderAt === null ? undefined : (schedule.reminderAt ?? t.reminderAt),
              deadline: schedule.deadline === null ? undefined : (schedule.deadline ?? t.deadline),
              snoozeUntil: isClearing ? undefined : t.snoozeUntil,
            };
          }),
        };
      })
    );
    showToast(schedule.reminderAt || schedule.deadline ? tRef.current.toast.scheduleSet : tRef.current.toast.scheduleCleared);
  };

  const changeStatus = (
    projId: string,
    taskId: string,
    status: string,
    isDoneCategory: boolean = status === 'done'
  ) => {
    triggerHaptic();
    setProjects((prev) =>
      prev.map((p) =>
        p.id !== projId
          ? p
          : {
              ...p,
              tasks: p.tasks.map((t) => {
                if (t.id !== taskId) return t;

                let nextSubs = t.subtasks;
                if (isDoneCategory) {
                  // Khi chuyển sang Đã xong: Hoàn thành toàn bộ các bước con
                  nextSubs = t.subtasks.map((s) => cascadeSubtaskCompleted(s, true));
                } else if (status === 'todo') {
                  // Khi chuyển về Chờ: Đưa tất cả bước con về chưa hoàn thành
                  nextSubs = t.subtasks.map((s) => cascadeSubtaskCompleted(s, false));
                } else if (t.status === 'done' && !isDoneCategory) {
                  // Đang từ Đã xong chuyển sang Đang làm/Duyệt/Nghẽn/Custom:
                  // Mở lại các việc con để không bị tự động bọt khí ép ngược về done
                  nextSubs = t.subtasks.map((s) => cascadeSubtaskCompleted(s, false));
                }

                return {
                  ...t,
                  status,
                  completedAt: isDoneCategory ? t.completedAt || new Date().toISOString() : undefined,
                  snoozeUntil: isDoneCategory ? undefined : t.snoozeUntil,
                  subtasks: nextSubs,
                };
              }),
            }
      )
    );

    const targetProject = projects.find((item) => item.id === projId);
    const targetTask = targetProject?.tasks.find((item) => item.id === taskId);

    if (isDoneCategory) {
      checkProjectCompletion(projId, taskId);
      onTaskDone?.(true, targetTask ? { ...targetTask, status } : undefined, targetProject);
    } else {
      onTaskDone?.(false, targetTask, targetProject);
    }
  };

  const changeSubtaskStatus = (
    projId: string,
    taskId: string,
    subId: string,
    status: string,
    isDoneCategory: boolean = status === 'done'
  ) => {
    triggerHaptic();
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projId) return p;
        return {
          ...p,
          tasks: p.tasks.map((t) => {
            if (t.id !== taskId) return t;
            const updatedSubs = updateSubtaskStatusInTree(t.subtasks, subId, status, isDoneCategory);
            const nextTaskStatus = determineTaskStatusFromSubtasks(
              t.status === 'done' || isDoneCategory ? (t.status === 'done' ? 'done' : 'doing') : t.status,
              updatedSubs
            );
            return {
              ...t,
              status: nextTaskStatus,
              subtasks: updatedSubs,
              completedAt: nextTaskStatus === 'done' ? t.completedAt || new Date().toISOString() : undefined,
              snoozeUntil: nextTaskStatus === 'done' ? undefined : t.snoozeUntil,
            };
          }),
        };
      })
    );
  };

  const handleDeleteTask = (projId: string, taskId: string) => {
    const p = projects.find((item) => item.id === projId);
    if (!p) return;
    const taskIndex = p.tasks.findIndex((t) => t.id === taskId);
    const taskToDelete = p.tasks[taskIndex];
    if (!taskToDelete) return;

    setProjects((prev) => prev.map((proj) => proj.id === projId ? { ...proj, tasks: proj.tasks.filter((t) => t.id !== taskId) } : proj));
    triggerUndoableAction(formatMessage(tRef.current.toast.taskDeleted, { title: truncateText(taskToDelete.title, 22) }), () => {
      setProjects((prev) => prev.map((proj) => {
        if (proj.id !== projId) return proj;
        const nextTasks = [...proj.tasks];
        nextTasks.splice(taskIndex, 0, taskToDelete);
        return { ...proj, tasks: nextTasks };
      }));
    });
  };

  const moveTask = (projId: string, index: number, direction: 'up' | 'down', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    triggerHaptic();
    setProjects((prev) => prev.map((p) => {
      if (p.id !== projId) return p;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= p.tasks.length) return p;
      const newTasks = [...p.tasks];
      const [moved] = newTasks.splice(index, 1);
      newTasks.splice(targetIndex, 0, moved);
      return { ...p, tasks: newTasks };
    }));
  };

  const toggleExpand = (id: string) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, isExpanded: !p.isExpanded } : p)));
  };

  const handleEditTaskTitle = (projId: string, taskId: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    setProjects((prev) =>
      prev.map((p) =>
        p.id !== projId
          ? p
          : {
              ...p,
              tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, title: trimmed } : t)),
            }
      )
    );
    showToast(tRef.current.toast.taskRenamed);
  };

  const handleEditProjectName = (projId: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setProjects((prev) =>
      prev.map((p) => (p.id === projId ? { ...p, name: trimmed } : p))
    );
    showToast(tRef.current.toast.projectRenamed);
  };

  const handleSnoozeTask = (
    projId: string,
    taskId: string,
    snoozeUntil: string | null,
    snoozeLevel?: number,
    autoPin?: boolean
  ) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projId) return p;
        return {
          ...p,
          tasks: p.tasks.map((t) => {
            if (t.id !== taskId) return t;
            return {
              ...t,
              snoozeUntil: snoozeUntil || undefined,
              snoozeLevel: snoozeLevel !== undefined ? snoozeLevel : t.snoozeLevel,
              isPinned: autoPin ? true : t.isPinned,
            };
          }),
        };
      })
    );
    if (autoPin && !snoozeUntil) {
      showToast(tRef.current.toast.pinnedAndReset);
    } else if (snoozeUntil) {
      showToast(snoozeLevel ? formatMessage(tRef.current.toast.taskSnoozedLevel, { level: snoozeLevel }) : tRef.current.toast.taskSnoozeSaved);
    } else {
      showToast(tRef.current.toast.taskSnoozeCancelled);
    }
  };

  const addTaskFocusedMinutes = useCallback(
    (projId: string, taskId: string, minutesToAdd: number, incrementSession = true) => {
      if (minutesToAdd <= 0) return;
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== projId) return p;
          return {
            ...p,
            tasks: p.tasks.map((t) => {
              if (t.id !== taskId) return t;
              return {
                ...t,
                focusedMinutes: (t.focusedMinutes || 0) + minutesToAdd,
                pomodoroSessions: incrementSession ? (t.pomodoroSessions || 0) + 1 : t.pomodoroSessions,
              };
            }),
          };
        })
      );
    },
    []
  );

  const setTaskEstimatedMinutes = useCallback(
    (projId: string, taskId: string, estimatedMinutes: number | undefined) => {
      triggerHaptic();
      setProjects((prev) =>
        prev.map((p) =>
          p.id !== projId
            ? p
            : {
                ...p,
                tasks: p.tasks.map((t) =>
                  t.id === taskId ? { ...t, estimatedMinutes } : t
                ),
              }
        )
      );
      showToast(estimatedMinutes ? formatMessage(tRef.current.toast.estimateSet, { minutes: estimatedMinutes }) : tRef.current.toast.estimateCleared);
    },
    [showToast]
  );

  // Nghi thức Chốt Ca Cuối Ngày (Sunsama Daily Shutdown Ritual): Dời các việc đang dở sang ngày mai & chống kiệt sức
  const executeDailyShutdownRitual = useCallback(() => {
    triggerHaptic();
    const tomorrowMorning = new Date();
    tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);
    tomorrowMorning.setHours(9, 0, 0, 0);
    const tomorrowIso = tomorrowMorning.toISOString();

    let movedCount = 0;
    setProjects((prev) =>
      prev.map((p) => ({
        ...p,
        tasks: p.tasks.map((t) => {
          if (t.status === 'doing' || t.status === 'review') {
            movedCount += 1;
            return {
              ...t,
              status: 'todo',
              reminderAt: t.reminderAt || tomorrowIso,
            };
          }
          return t;
        }),
      }))
    );

    showToast(movedCount > 0 ? formatMessage(tRef.current.toast.shutdownMoved, { count: movedCount }) : tRef.current.toast.shutdownClean);
    return movedCount;
  }, [showToast]);

  return {
    projects,
    setProjects,
    newProjectName,
    setNewProjectName,
    taskInputs,
    setTaskInputs,
    handleAddProject,
    handleDeleteProject,
    handleEditProjectName,
    handleAddTask,
    toggleTaskDone,
    changeStatus,
    changeSubtaskStatus,
    handleDeleteTask,
    handleEditTaskTitle,
    moveTask,
    togglePinTask,
    toggleExpand,
    copyTaskToClipboard,
    copyProjectAsMarkdown,
    handleTaskInputPaste,
    handleSetTaskRecurrence,
    handleSetSubTaskRecurrence,
    handleManuallyResetRecurring,
    handleManuallyResetRecurringSubTask,
    handleSetTaskSchedule,
    handleSnoozeTask,
    addTaskFocusedMinutes,
    setTaskEstimatedMinutes,
    executeDailyShutdownRitual,
  };
}
