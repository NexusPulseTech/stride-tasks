import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Project,
  Task,
  SubTask,
  FilterType,
  MobileGuideTab,
  ConfirmDialogState,
  AutoBackupData,
  StrideBackupPayload,
  StatusDefinition,
  BatchPasteTarget,
} from '../../../types';
import { INITIAL_PROJECTS, APP_VERSION } from '../../../constants';
import { triggerHaptic, playChime } from '../../../utils';
import { parsePastedTasks, parsePastedHierarchy } from '../utils/batchParser';
import { isDoingStatus, isDoneStatus } from '../utils/statusCategory';
import { matchTaskDeep } from '../utils/searchHelper';
import { useCelebrationAndStreak } from './useCelebrationAndStreak';
import { useSmartReminder } from './useSmartReminder';
import { useTaskCRUD, STRIDE_AUTO_BACKUP_KEY } from './useTaskCRUD';
import { useSubtaskOperations } from './useSubtaskOperations';
import { useTaskDnd } from './useTaskDnd';
import { useProjectDnd } from './useProjectDnd';
import { useStatusManager } from './useStatusManager';
import { useActivityLog, CompletedItemLog } from '../../analytics';
import { clearAllPersistentData } from '../../../utils/persistentStorage';
import { PinnedItem } from '../components/PinnedSection';
import { getDailyFocusQueue, ActionableItem, AnkiSrsOption } from '../utils/spacedSnooze';
import { AnkiSrsTargetItem } from '../components/AnkiSrsModal';

export function useTaskManager() {
  const [showStats, setShowStats] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [activeMenuTaskId, setActiveMenuTaskId] = useState<string | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Modals state
  const [batchPasteProject, setBatchPasteProject] = useState<Project | null>(null);
  const [batchPasteTarget, setBatchPasteTarget] = useState<BatchPasteTarget | null>(null);
  const [batchPasteText, setBatchPasteText] = useState('');
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showMobileGuideModal, setShowMobileGuideModal] = useState(false);
  const [mobileGuideTab, setMobileGuideTab] = useState<MobileGuideTab>('ios');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [showMobileAddModal, setShowMobileAddModal] = useState(false);
  const [mobileTaskTitle, setMobileTaskTitle] = useState('');
  const [mobileSelectedProjId, setMobileSelectedProjId] = useState('');
  const [mobileTaskPinned, setMobileTaskPinned] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showViewSettingsModal, setShowViewSettingsModal] = useState(false);
  const [showDailyFocusModal, setShowDailyFocusModal] = useState(false);
  const [selectedDetailId, setSelectedDetailId] = useState<{
    taskId: string;
    projectId: string;
  } | null>(null);

  const [scheduleTaskTarget, setScheduleTaskTarget] = useState<{
    task: Task;
    project: Project;
  } | null>(null);

  const openScheduleModal = (task: Task, project: Project) => {
    setScheduleTaskTarget({ task, project });
  };

  const closeScheduleModal = () => {
    setScheduleTaskTarget(null);
  };

  const openDetailModal = (task: Task, projectId: string) => {
    setSelectedDetailId({ taskId: task.id, projectId });
  };

  const closeDetailModal = () => {
    setSelectedDetailId(null);
  };

  // Anki SRS (Lặp lại ngắt quãng thông minh) Modal State
  const [ankiModalTarget, setAnkiModalTarget] = useState<AnkiSrsTargetItem | null>(null);
  const [isAnkiModalOpen, setIsAnkiModalOpen] = useState(false);
  const onTaskCreatedCallbackRef = useRef<(projId: string, newTask: Task) => void>(() => {});
  const dismissedReviewIdsRef = useRef<Set<string>>(new Set());

  // Auto-backup data state
  const [autoBackupData, setAutoBackupData] = useState<AutoBackupData | null>(() => {
    try {
      const saved = localStorage.getItem(STRIDE_AUTO_BACKUP_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  const desktopSearchRef = useRef<HTMLInputElement | null>(null);
  const mobileSearchRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Composed Sub-Hooks
  const statusManager = useStatusManager();
  const activity = useActivityLog();
  const celebration = useCelebrationAndStreak();

  const handleDoneStreak = useCallback(() => {
    celebration.handleDoneStreak();
  }, [celebration]);

  const onTaskDone = useCallback(
    (completed: boolean, task?: Task, project?: Project) => {
      if (completed && task) {
        activity.recordTaskCompletion(task, project);
        celebration.handleDoneStreak();
      } else if (!completed && task) {
        activity.removeTaskCompletion(task.id);
      }
    },
    [activity, celebration]
  );

  const crud = useTaskCRUD({
    showToast: celebration.showToast,
    triggerCelebration: celebration.triggerCelebration,
    triggerUndoableAction: celebration.triggerUndoableAction,
    handleDoneStreak,
    onTaskDone,
    onTaskCreated: (projId, newTask) => onTaskCreatedCallbackRef.current(projId, newTask),
  });

  // Derived state: luôn đồng bộ 100% với crud.projects mà không cần setState trong useEffect (loại bỏ Maximum update depth exceeded)
  const selectedDetailTask = useMemo(() => {
    if (!selectedDetailId) return null;
    const proj = crud.projects.find((p) => p.id === selectedDetailId.projectId);
    if (!proj) return null;
    const task = proj.tasks.find((t) => t.id === selectedDetailId.taskId);
    if (!task) return null;
    return { task, project: proj };
  }, [selectedDetailId, crud.projects]);

  const refreshAutoBackup = useCallback(() => {
    try {
      const saved = localStorage.getItem(STRIDE_AUTO_BACKUP_KEY);
      if (saved) {
        setAutoBackupData(JSON.parse(saved));
      } else {
        setAutoBackupData(null);
      }
    } catch (e) {}
  }, []);

  // Tự động sao lưu dữ liệu toàn diện (Full Auto-Backup Snapshot: Projects + History + Custom Statuses)
  useEffect(() => {
    try {
      const isTemplate = JSON.stringify(crud.projects) === JSON.stringify(INITIAL_PROJECTS);
      if (!isTemplate && crud.projects.length > 0) {
        let totalTasksCount = 0;
        crud.projects.forEach((p) => {
          totalTasksCount += (p.tasks || []).length;
        });
        const fullAutoBackup: AutoBackupData = {
          timestamp: new Date().toISOString(),
          projectCount: crud.projects.length,
          taskCount: totalTasksCount,
          historyCount: activity.completedLogs.length,
          projects: crud.projects,
          completedLogs: activity.completedLogs,
          customStatuses: statusManager.statuses.filter((s) => s.isCustom),
        };
        localStorage.setItem(STRIDE_AUTO_BACKUP_KEY, JSON.stringify(fullAutoBackup));
        setAutoBackupData(fullAutoBackup);
      }
    } catch (e) {}
  }, [crud.projects, activity.completedLogs, statusManager.statuses]);

  // Smart Reminder kết nối trực tiếp với crud.projects
  const reminder = useSmartReminder({
    projects: crud.projects,
    isMuted: celebration.isMuted,
    showToast: celebration.showToast,
  });

  const subtasks = useSubtaskOperations({
    projects: crud.projects,
    setProjects: crud.setProjects,
    showToast: celebration.showToast,
    triggerUndoableAction: celebration.triggerUndoableAction,
    handleDoneStreak,
    playChime,
    isMuted: celebration.isMuted,
    onTaskDone,
  });
  const dnd = useTaskDnd(crud.setProjects);
  const projectDnd = useProjectDnd(crud.setProjects);

  // 1. Khi tạo công việc mới -> tự động bật Anki SRS modal để người dùng chọn lặp lại ngay từ đầu
  onTaskCreatedCallbackRef.current = (projId: string, newTask: Task) => {
    const proj = crud.projects.find((p) => p.id === projId);
    setAnkiModalTarget({
      projectId: projId,
      projectName: proj?.name,
      taskId: newTask.id,
      title: newTask.title,
      currentLevel: 1,
      isNewTask: true,
      isPinned: newTask.isPinned,
    });
    setIsAnkiModalOpen(true);
  };

  // 2. Xử lý khi người dùng chọn 1 trong 3 Option của Anki SRS
  const handleSelectAnkiOption = useCallback(
    (target: AnkiSrsTargetItem, option: AnkiSrsOption, targetIso: string | null) => {
      if (target.subId) {
        // Cập nhật cho subtask
        subtasks.handleSnoozeSubTask(
          target.projectId,
          target.taskId,
          target.subId,
          targetIso,
          option.nextLevel
        );
        if (option.autoPin) {
          crud.setProjects((prev) =>
            prev.map((p) => {
              if (p.id !== target.projectId) return p;
              return {
                ...p,
                tasks: p.tasks.map((t) => {
                  if (t.id !== target.taskId) return t;
                  const updatePinInSubs = (subs: SubTask[]): SubTask[] => {
                    return subs.map((s) => {
                      if (s.id === target.subId) {
                        return { ...s, isPinned: true, snoozeLevel: 1, snoozeUntil: undefined };
                      }
                      if (s.subtasks && s.subtasks.length > 0) {
                        return { ...s, subtasks: updatePinInSubs(s.subtasks) };
                      }
                      return s;
                    });
                  };
                  return { ...t, subtasks: updatePinInSubs(t.subtasks) };
                }),
              };
            })
          );
        }
      } else {
        // Cập nhật cho task
        crud.handleSnoozeTask(
          target.projectId,
          target.taskId,
          targetIso,
          option.nextLevel
        );
        if (option.autoPin) {
          crud.setProjects((prev) =>
            prev.map((p) => {
              if (p.id !== target.projectId) return p;
              return {
                ...p,
                tasks: p.tasks.map((t) => {
                  if (t.id !== target.taskId) return t;
                  return { ...t, isPinned: true, snoozeLevel: 1, snoozeUntil: undefined };
                }),
              };
            })
          );
        }
      }

      if (option.optionNumber === 1) {
        celebration.showToast('Đã ghim làm ngay & giữ Mức 1 (nhắc liên tục đến khi hoàn thành)!');
      } else {
        celebration.showToast(
          `Đã dời nhắc lại sau ${option.days} ngày (Lên Mức ${option.nextLevel})!`
        );
      }
    },
    [crud, subtasks, celebration]
  );

  const handleMarkAnkiTaskDone = useCallback(
    (target: AnkiSrsTargetItem) => {
      if (target.subId) {
        subtasks.toggleSubTask(target.projectId, target.taskId, target.subId, true);
      } else {
        crud.toggleTaskDone(target.projectId, target.taskId, true);
      }
      celebration.showToast('Chúc mừng bạn đã hoàn thành công việc!');
    },
    [crud, subtasks, celebration]
  );

  const openAnkiModalForTask = useCallback(
    (task: Task, projectId: string) => {
      const proj = crud.projects.find((p) => p.id === projectId);
      setAnkiModalTarget({
        projectId,
        projectName: proj?.name,
        taskId: task.id,
        title: task.title,
        currentLevel: task.snoozeLevel || 1,
        snoozeUntil: task.snoozeUntil,
        isPinned: task.isPinned,
        isNewTask: false,
        path: [task.title],
      });
      setIsAnkiModalOpen(true);
    },
    [crud.projects]
  );

  const openAnkiModalForSubtask = useCallback(
    (sub: SubTask, projectId: string, taskId: string) => {
      const proj = crud.projects.find((p) => p.id === projectId);
      const task = proj?.tasks.find((t) => t.id === taskId);
      setAnkiModalTarget({
        projectId,
        projectName: proj?.name,
        taskId,
        subId: sub.id,
        title: sub.title,
        currentLevel: sub.snoozeLevel || 1,
        snoozeUntil: sub.snoozeUntil,
        isPinned: sub.isPinned,
        isNewTask: false,
        path: task ? [task.title, sub.title] : [sub.title],
      });
      setIsAnkiModalOpen(true);
    },
    [crud.projects]
  );

  const closeAnkiModal = useCallback(() => {
    setIsAnkiModalOpen(false);
    setAnkiModalTarget(null);
  }, []);

  // Tự động kiểm tra định kỳ các việc (và việc con) chưa Done đang đến hạn nhắc cấp số nhân (due snooze review)
  useEffect(() => {
    const checkDueAnkiReviews = () => {
      if (isAnkiModalOpen || selectedDetailId || scheduleTaskTarget || showMobileAddModal) {
        return;
      }
      const now = Date.now();
      for (const p of crud.projects) {
        for (const t of p.tasks) {
          if (isDoneStatus(t.status, statusManager.statuses)) continue;

          // Kiểm tra subtask đệ quy trước (Bottom-up GTD Next Action)
          const findDueSub = (subs: SubTask[], path: string[]): { sub: SubTask; path: string[] } | null => {
            for (const s of subs) {
              if (s.completed) continue;
              if (s.subtasks && s.subtasks.length > 0) {
                const deeper = findDueSub(s.subtasks, [...path, s.title]);
                if (deeper) return deeper;
              }
              if (s.snoozeUntil) {
                const dueTime = new Date(s.snoozeUntil).getTime();
                const reviewKey = `${s.id}_${s.snoozeUntil}`;
                if (!isNaN(dueTime) && dueTime <= now && !dismissedReviewIdsRef.current.has(reviewKey)) {
                  return { sub: s, path };
                }
              }
            }
            return null;
          };

          if (t.subtasks && t.subtasks.length > 0) {
            const dueSubResult = findDueSub(t.subtasks, [t.title]);
            if (dueSubResult) {
              const reviewKey = `${dueSubResult.sub.id}_${dueSubResult.sub.snoozeUntil}`;
              dismissedReviewIdsRef.current.add(reviewKey);
              setAnkiModalTarget({
                projectId: p.id,
                projectName: p.name,
                taskId: t.id,
                subId: dueSubResult.sub.id,
                title: dueSubResult.sub.title,
                currentLevel: dueSubResult.sub.snoozeLevel || 1,
                snoozeUntil: dueSubResult.sub.snoozeUntil,
                isPinned: dueSubResult.sub.isPinned,
                isNewTask: false,
                path: dueSubResult.path,
              });
              setIsAnkiModalOpen(true);
              return;
            }
          }

          if (t.snoozeUntil) {
            const dueTime = new Date(t.snoozeUntil).getTime();
            const reviewKey = `${t.id}_${t.snoozeUntil}`;
            if (!isNaN(dueTime) && dueTime <= now && !dismissedReviewIdsRef.current.has(reviewKey)) {
              dismissedReviewIdsRef.current.add(reviewKey);
              setAnkiModalTarget({
                projectId: p.id,
                projectName: p.name,
                taskId: t.id,
                title: t.title,
                currentLevel: t.snoozeLevel || 1,
                snoozeUntil: t.snoozeUntil,
                isPinned: t.isPinned,
                isNewTask: false,
              });
              setIsAnkiModalOpen(true);
              return;
            }
          }
        }
      }
    };

    checkDueAnkiReviews();
    const timer = window.setInterval(checkDueAnkiReviews, 30 * 1000);
    return () => window.clearInterval(timer);
  }, [crud.projects, isAnkiModalOpen, selectedDetailId, scheduleTaskTarget, showMobileAddModal, statusManager.statuses]);

  useEffect(() => {
    const handleGlobalClick = () => setActiveMenuTaskId(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const openBatchPasteForProject = (project: Project) => {
    setBatchPasteProject(project);
    setBatchPasteTarget({
      type: 'project',
      projectId: project.id,
      projectName: project.name,
    });
    setBatchPasteText('');
  };

  const openBatchPasteForTask = (
    project: Project,
    task: Task,
    parentSubId?: string,
    subTitle?: string
  ) => {
    setBatchPasteProject(project);
    setBatchPasteTarget({
      type: parentSubId ? 'subtask' : 'task',
      projectId: project.id,
      projectName: project.name,
      taskId: task.id,
      taskTitle: task.title,
      parentSubId,
      subTitle,
    });
    setBatchPasteText('');
  };

  const handleExecuteBatchPaste = () => {
    const target =
      batchPasteTarget ||
      (batchPasteProject
        ? {
            type: 'project' as const,
            projectId: batchPasteProject.id,
            projectName: batchPasteProject.name,
          }
        : null);

    if (!target) return;
    const lines = parsePastedTasks(batchPasteText);
    if (lines.length === 0) return;

    if (target.type === 'project') {
      const hierarchy = parsePastedHierarchy(batchPasteText);
      const newTasks: Task[] = hierarchy.map((item) => ({
        id: 't_' + Math.random().toString(36).slice(2, 9),
        title: item.title,
        status: 'todo',
        subtasks: item.subtasks.map((subTitle) => ({
          id: 's_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9),
          title: subTitle,
          completed: false,
          subtasks: [],
        })),
      }));

      crud.setProjects((prev) =>
        prev.map((p) =>
          p.id === target.projectId
            ? { ...p, isExpanded: true, tasks: [...p.tasks, ...newTasks] }
            : p
        )
      );
      celebration.showToast(`Đã thêm ${newTasks.length} công việc vào "${target.projectName}"!`);
    } else if (target.type === 'task' && target.taskId) {
      subtasks.handleAddSubTask(target.projectId, target.taskId, batchPasteText, null);
    } else if (target.type === 'subtask' && target.taskId && target.parentSubId) {
      subtasks.handleAddSubTask(target.projectId, target.taskId, batchPasteText, target.parentSubId);
    }

    setBatchPasteProject(null);
    setBatchPasteTarget(null);
    setBatchPasteText('');
  };

  const handleMobileSubmitTask = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = mobileTaskTitle.trim();
    if (!raw) return;
    const targetProjId =
      mobileSelectedProjId || (crud.projects.length > 0 ? crud.projects[0].id : '');
    if (!targetProjId) return;

    triggerHaptic();
    if (raw.includes('\n')) {
      const lines = parsePastedTasks(raw);
      const newTasks: Task[] = lines.map((title, idx) => ({
        id: 't_' + Date.now() + '_' + idx,
        title,
        status: 'todo',
        isPinned: idx === 0 ? mobileTaskPinned : false,
        subtasks: [],
      }));
      crud.setProjects((prev) =>
        prev.map((p) =>
          p.id === targetProjId
            ? { ...p, isExpanded: true, tasks: [...p.tasks, ...newTasks] }
            : p
        )
      );
      celebration.showToast(`Đã tạo ${lines.length} việc mới!`);
    } else {
      const newTask: Task = {
        id: 't_' + Date.now(),
        title: raw,
        status: 'todo',
        isPinned: mobileTaskPinned,
        subtasks: [],
      };
      crud.setProjects((prev) =>
        prev.map((p) =>
          p.id === targetProjId ? { ...p, isExpanded: true, tasks: [...p.tasks, newTask] } : p
        )
      );
      celebration.showToast('Đã thêm công việc!');
      const targetProj = crud.projects.find((p) => p.id === targetProjId);
      setAnkiModalTarget({
        projectId: targetProjId,
        projectName: targetProj?.name,
        taskId: newTask.id,
        title: newTask.title,
        currentLevel: 1,
        isNewTask: true,
        isPinned: mobileTaskPinned,
      });
      setIsAnkiModalOpen(true);
    }
    setMobileTaskTitle('');
    setMobileTaskPinned(false);
    setShowMobileAddModal(false);
  };

  // 1. Khôi phục dữ liệu mẫu ban đầu (Luôn Confirm)
  const resetSample = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Khôi phục dữ liệu mẫu ban đầu?',
      message:
        'Thao tác này sẽ thiết lập lại các danh mục dự án, công việc và lịch sử hoàn thành (Heatmap) về trạng thái mẫu ban đầu. Toàn bộ công việc bạn đã tạo thêm sẽ bị thay thế. Hãy nhớ tải bản sao lưu .JSON trước nếu cần!',
      confirmText: 'Khôi phục mẫu',
      cancelText: 'Hủy',
      isDestructive: true,
      onConfirm: () => {
        crud.setProjects(JSON.parse(JSON.stringify(INITIAL_PROJECTS)));
        activity.resetSeedActivityLogs();
        celebration.showToast('Đã khôi phục dữ liệu mẫu thành công!');
        setConfirmDialog(null);
        setShowBackupModal(false);
      },
    });
  };

  // 2. Khôi phục từ bản tự động sao lưu của User (Luôn Confirm)
  const restoreAutoBackup = () => {
    if (!autoBackupData || !autoBackupData.projects || autoBackupData.projects.length === 0) {
      celebration.showToast('Chưa có bản sao lưu tự động nào!');
      return;
    }
    const formattedDate = new Date(autoBackupData.timestamp).toLocaleString('vi-VN');
    const histCount = autoBackupData.historyCount ?? (autoBackupData.completedLogs ? autoBackupData.completedLogs.length : 0);
    setConfirmDialog({
      isOpen: true,
      title: 'Khôi phục từ bản tự động sao lưu?',
      message: `Hệ thống sẽ khôi phục dữ liệu đã tự động lưu lúc ${formattedDate} (${autoBackupData.projectCount} dự án, ${autoBackupData.taskCount} công việc${histCount > 0 ? `, ${histCount} lịch sử Heatmap` : ''}). Dữ liệu hiện tại sẽ được thay thế bằng bản sao lưu này. Bạn có muốn tiếp tục?`,
      confirmText: 'Khôi phục bản này',
      cancelText: 'Hủy',
      isDestructive: false,
      onConfirm: () => {
        crud.setProjects(autoBackupData.projects);
        if (autoBackupData.completedLogs && Array.isArray(autoBackupData.completedLogs)) {
          activity.saveLogs(autoBackupData.completedLogs);
        }
        if (autoBackupData.customStatuses && Array.isArray(autoBackupData.customStatuses)) {
          statusManager.restoreCustomStatuses(autoBackupData.customStatuses);
        }
        celebration.showToast('Đã khôi phục dữ liệu từ bản tự động thành công!');
        setConfirmDialog(null);
        setShowBackupModal(false);
      },
    });
  };

  const handleRestoreSnapshot = (projects: Project[], label?: string) => {
    crud.setProjects(projects);
    celebration.showToast(`Đã khôi phục thành công: ${label || 'Bản sao lưu'}!`);
    setShowBackupModal(false);
  };

  const handleDirectPasteRestore = (rawJson: string) => {
    try {
      const parsed = JSON.parse(rawJson);
      let incomingProjects: Project[] = [];
      let incomingLogs: CompletedItemLog[] | null = null;
      let incomingCustomStatuses: StatusDefinition[] | null = null;

      if (parsed && typeof parsed === 'object' && parsed.data && Array.isArray(parsed.data.projects)) {
        incomingProjects = parsed.data.projects;
        incomingLogs = Array.isArray(parsed.data.completedLogs) ? parsed.data.completedLogs : null;
        incomingCustomStatuses = Array.isArray(parsed.data.customStatuses) ? parsed.data.customStatuses : null;
      } else if (Array.isArray(parsed) && parsed.length > 0) {
        incomingProjects = parsed;
      } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.projects)) {
        incomingProjects = parsed.projects;
        incomingLogs = Array.isArray(parsed.completedLogs) ? parsed.completedLogs : null;
        incomingCustomStatuses = Array.isArray(parsed.customStatuses) ? parsed.customStatuses : null;
      } else {
        celebration.showToast('Dữ liệu JSON không đúng định dạng!');
        return;
      }

      crud.setProjects(incomingProjects);
      if (incomingLogs && Array.isArray(incomingLogs)) {
        activity.saveLogs(incomingLogs);
      }
      if (incomingCustomStatuses && Array.isArray(incomingCustomStatuses)) {
        statusManager.restoreCustomStatuses(incomingCustomStatuses);
      }

      const totalRecovered = incomingProjects.reduce((a, b) => a + (b.tasks?.length || 0), 0);
      celebration.showToast(`Đã đồng bộ thành công ${totalRecovered} công việc từ mã JSON.`);
      setShowBackupModal(false);
    } catch (e) {
      celebration.showToast('Lỗi: Chuỗi dán vào không phải là JSON hợp lệ!');
    }
  };

  // 3. Xóa toàn bộ dữ liệu (Luôn Confirm)
  const clearAllData = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa toàn bộ dự án, công việc và lịch sử?',
      message:
        'Thao tác này sẽ xóa sạch tất cả danh mục, công việc và lịch sử hoàn thành Heatmap hiện có, đưa ứng dụng về không gian làm việc trống hoàn toàn. Bạn có chắc chắn muốn xóa?',
      confirmText: 'Xóa tất cả',
      cancelText: 'Hủy',
      isDestructive: true,
      onConfirm: () => {
        crud.setProjects([]);
        activity.clearAllActivityLogs();
        clearAllPersistentData();
        celebration.showToast('Đã xóa toàn bộ dữ liệu!');
        setConfirmDialog(null);
        setShowBackupModal(false);
      },
    });
  };

  const downloadHtml = () => {
    const a = document.createElement('a');
    a.href = '/quan-ly-cong-viec.html';
    a.download = 'quan-ly-cong-viec.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    celebration.showToast('Đang tải file HTML offline...');
  };

  const downloadSourceZip = () => {
    const a = document.createElement('a');
    a.href = `/tasktodo-v${APP_VERSION}.zip`;
    a.download = `tasktodo-v${APP_VERSION}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    celebration.showToast('Đang tải tệp mã nguồn (.zip)...');
  };

  // 4. Xuất bản sao lưu toàn diện (Full Snapshot: Projects + History + Custom Statuses)
  const getFullBackupJsonString = (): string => {
    let totalTasksCount = 0;
    crud.projects.forEach((p) => {
      totalTasksCount += (p.tasks || []).length;
    });

    const payload: StrideBackupPayload = {
      version: APP_VERSION,
      schemaVersion: 2,
      appName: 'TaskTodo',
      exportedAt: new Date().toISOString(),
      summary: {
        projectCount: crud.projects.length,
        taskCount: totalTasksCount,
        historyLogCount: activity.completedLogs.length,
        streakCount: activity.currentStreak,
      },
      data: {
        projects: crud.projects,
        completedLogs: activity.completedLogs,
        customStatuses: statusManager.statuses.filter((s) => s.isCustom),
      },
    };

    return JSON.stringify(payload, null, 2);
  };

  const exportDataJson = () => {
    const dataStr = getFullBackupJsonString();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasktodo-full-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    celebration.showToast('Đã xuất file sao lưu toàn diện (.JSON)!');
  };

  // 5. Nhập file JSON sao lưu (Hỗ trợ cả Bản sao lưu toàn diện mới & Tệp định dạng cũ)
  const importDataJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        
        let incomingProjects: Project[] = [];
        let incomingLogs: CompletedItemLog[] | null = null;
        let incomingCustomStatuses: StatusDefinition[] | null = null;
        let isFullSnapshot = false;

        // Định dạng 1: Bản sao lưu toàn diện mới (Full Snapshot schema v2)
        if (parsed && typeof parsed === 'object' && parsed.data && Array.isArray(parsed.data.projects)) {
          incomingProjects = parsed.data.projects;
          incomingLogs = Array.isArray(parsed.data.completedLogs) ? parsed.data.completedLogs : null;
          incomingCustomStatuses = Array.isArray(parsed.data.customStatuses) ? parsed.data.customStatuses : null;
          isFullSnapshot = true;
        } 
        // Định dạng 2: Tệp cũ (mảng Project[])
        else if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].tasks) {
          incomingProjects = parsed;
          isFullSnapshot = false;
        } 
        // Định dạng 3: Object chứa trực tiếp projects
        else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.projects)) {
          incomingProjects = parsed.projects;
          incomingLogs = Array.isArray(parsed.completedLogs) ? parsed.completedLogs : null;
          incomingCustomStatuses = Array.isArray(parsed.customStatuses) ? parsed.customStatuses : null;
          isFullSnapshot = !!incomingLogs;
        } else {
          celebration.showToast('Tệp JSON không hợp lệ hoặc sai định dạng!');
          return;
        }

        const taskCount = incomingProjects.reduce((acc, p) => acc + (p.tasks ? p.tasks.length : 0), 0);
        const historyCount = incomingLogs ? incomingLogs.length : 0;

        setConfirmDialog({
          isOpen: true,
          title: 'Khôi phục dữ liệu từ tệp sao lưu JSON?',
          message: isFullSnapshot && historyCount > 0
            ? `Tệp sao lưu toàn diện chứa:\n• ${incomingProjects.length} dự án & ${taskCount} công việc\n• ${historyCount} lịch sử hoàn thành (Activity Heatmap & Streak)\n• ${(incomingCustomStatuses || []).length} trạng thái tùy chỉnh.\n\nThao tác này sẽ cập nhật toàn diện dữ liệu. Bạn có muốn tiếp tục?`
            : `Tệp sao lưu chứa ${incomingProjects.length} dự án và ${taskCount} công việc (định dạng cũ). Lịch sử Heatmap hiện tại sẽ được giữ nguyên. Bạn có muốn tiếp tục?`,
          confirmText: 'Khôi phục toàn diện',
          cancelText: 'Hủy',
          isDestructive: true,
          onConfirm: () => {
            crud.setProjects(incomingProjects);
            if (incomingLogs && Array.isArray(incomingLogs)) {
              activity.saveLogs(incomingLogs);
            }
            if (incomingCustomStatuses && Array.isArray(incomingCustomStatuses)) {
              statusManager.restoreCustomStatuses(incomingCustomStatuses);
            }
            celebration.showToast('Đã khôi phục toàn diện dữ liệu thành công!');
            setConfirmDialog(null);
            setShowBackupModal(false);
          },
        });
      } catch (err) {
        celebration.showToast('Lỗi đọc file JSON!');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };


  // 5. Xóa dự án (Confirm nếu dự án có công việc bên trong)
  const handleDeleteProject = (id: string, e?: React.MouseEvent) => {
    if (e && typeof e.stopPropagation === 'function') {
      try { e.stopPropagation(); } catch (err) {}
    }
    const projToDelete = crud.projects.find((p) => p.id === id);
    if (!projToDelete) return;

    if (projToDelete.tasks && projToDelete.tasks.length > 0) {
      setConfirmDialog({
        isOpen: true,
        title: `Xóa dự án "${projToDelete.name}"?`,
        message: `Dự án này đang có ${projToDelete.tasks.length} công việc bên trong. Thao tác xóa sẽ loại bỏ toàn bộ các công việc này. Bạn có chắc chắn muốn xóa không?`,
        confirmText: 'Xóa dự án',
        cancelText: 'Hủy',
        isDestructive: true,
        onConfirm: () => {
          crud.handleDeleteProject(id);
          setConfirmDialog(null);
        },
      });
    } else {
      crud.handleDeleteProject(id);
    }
  };

  const clearSampleData = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa toàn bộ dữ liệu mẫu ban đầu?',
      message:
        'Thao tác này sẽ xóa sạch tất cả dự án và công việc mẫu ban đầu, đưa ứng dụng về không gian làm việc trống (trang trắng) hoàn toàn. Bạn có chắc chắn muốn xóa không?',
      confirmText: 'Xóa dữ liệu mẫu',
      cancelText: 'Hủy',
      isDestructive: true,
      onConfirm: () => {
        crud.setProjects([]);
        activity.clearAllActivityLogs();
        clearAllPersistentData();
        celebration.showToast('Đã xóa sạch dữ liệu mẫu. Không gian làm việc sẵn sàng.');
        setConfirmDialog(null);
      },
    });
  };

  let totalTasks = 0;
  let totalDone = 0;
  let totalDoing = 0;
  let totalScheduled = 0;
  crud.projects.forEach((p) => {
    totalTasks += p.tasks.length;
    p.tasks.forEach((t) => {
      if (isDoneStatus(t.status, statusManager.statuses)) totalDone++;
      if (isDoingStatus(t.status, statusManager.statuses)) totalDoing++;
      if (Boolean(t.reminderAt || t.deadline) && !isDoneStatus(t.status, statusManager.statuses)) totalScheduled++;
    });
  });

  const percentTotal = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;
  const uncompletedCount = totalTasks - totalDone;

  const dailyFocusQueue = useMemo(() => {
    return getDailyFocusQueue(crud.projects, statusManager.statuses, 5);
  }, [crud.projects, statusManager.statuses]);

  const filteredProjects = crud.projects
    .filter((p) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchP = p.name.toLowerCase().includes(q);
        const matchT = p.tasks.some((t) => matchTaskDeep(t, q));
        if (!matchP && !matchT) return false;
      }
      if (filter === 'doing') {
        return p.tasks.some((t) => isDoingStatus(t.status, statusManager.statuses));
      }
      if (filter === 'scheduled') {
        return p.tasks.some((t) => Boolean(t.reminderAt || t.deadline) && !isDoneStatus(t.status, statusManager.statuses));
      }
      if (filter === 'completed') {
        return p.tasks.some((t) => isDoneStatus(t.status, statusManager.statuses));
      }
      return true;
    })
    .map((p) => {
      // Khi đang tìm kiếm: Tự động mở rộng (auto-expand) dự án nếu có kết quả khớp
      if (search.trim()) {
        return { ...p, isExpanded: true };
      }
      return p;
    });

  // Hỗ trợ ghim cả Task cha lẫn bất kỳ Subtask con nào trong cây phả hệ
  const pinnedTasks: PinnedItem[] = crud.projects.flatMap((p) => {
    const list: PinnedItem[] = [];
    p.tasks.forEach((t) => {
      if (t.isPinned) {
        list.push({ type: 'task', task: t, project: p });
      }

      const collectPinnedSubs = (subs: SubTask[], parentTask: Task, path: string[]) => {
        subs.forEach((s) => {
          if (s.isPinned) {
            list.push({
              type: 'subtask',
              subtask: s,
              parentTask,
              project: p,
              path,
            });
          }
          if (s.subtasks && s.subtasks.length > 0) {
            collectPinnedSubs(s.subtasks, parentTask, [...path, s.title]);
          }
        });
      };

      if (t.subtasks && t.subtasks.length > 0) {
        collectPinnedSubs(t.subtasks, t, [t.title]);
      }
    });
    return list;
  });

  return {
    ...crud,
    ...subtasks,
    ...dnd,
    ...celebration,
    ...activity,
    reminder,
    // Status management
    statuses: statusManager.statuses,
    addCustomStatus: statusManager.addCustomStatus,
    deleteCustomStatus: statusManager.deleteCustomStatus,
    getStatus: statusManager.getStatus,
    // Auto backup & confirmations
    autoBackupData,
    refreshAutoBackup,
    restoreAutoBackup,
    clearAllData,
    handleDeleteProject,
    // Modals & UI
    showViewSettingsModal,
    setShowViewSettingsModal,
    showStats,
    setShowStats,
    filter,
    setFilter,
    search,
    setSearch,
    mobileSearchOpen,
    setMobileSearchOpen,
    expandedTaskId,
    setExpandedTaskId,
    activeMenuTaskId,
    setActiveMenuTaskId,
    batchPasteProject,
    setBatchPasteProject,
    batchPasteTarget,
    setBatchPasteTarget,
    openBatchPasteForProject,
    openBatchPasteForTask,
    batchPasteText,
    setBatchPasteText,
    showGuideModal,
    setShowGuideModal,
    showBackupModal,
    setShowBackupModal,
    showMobileGuideModal,
    setShowMobileGuideModal,
    mobileGuideTab,
    setMobileGuideTab,
    confirmDialog,
    setConfirmDialog,
    showMobileAddModal,
    setShowMobileAddModal,
    mobileTaskTitle,
    setMobileTaskTitle,
    mobileSelectedProjId,
    setMobileSelectedProjId,
    mobileTaskPinned,
    setMobileTaskPinned,
    isFocusMode,
    setIsFocusMode,
    desktopSearchRef,
    mobileSearchRef,
    fileInputRef,
    handleExecuteBatchPaste,
    handleMobileSubmitTask,
    resetSample,
    downloadHtml,
    downloadSourceZip,
    exportDataJson,
    importDataJson,
    totalTasks,
    totalDone,
    totalDoing,
    totalScheduled,
    percentTotal,
    uncompletedCount,
    filteredProjects,
    pinnedTasks,
    showFeedbackModal,
    setShowFeedbackModal,
    handleRestoreSnapshot,
    handleDirectPasteRestore,
    getFullBackupJsonString,
    handleSetTaskRecurrence: crud.handleSetTaskRecurrence,
    handleSetSubTaskRecurrence: crud.handleSetSubTaskRecurrence,
    handleManuallyResetRecurring: crud.handleManuallyResetRecurring,
    handleManuallyResetRecurringSubTask: crud.handleManuallyResetRecurringSubTask,
    handleSetTaskSchedule: crud.handleSetTaskSchedule,
    selectedDetailTask,
    openDetailModal,
    closeDetailModal,
    scheduleTaskTarget,
    openScheduleModal,
    closeScheduleModal,
    clearSampleData,
    togglePinSubTask: subtasks.togglePinSubTask,
    draggedProjId: projectDnd.draggedProjId,
    dragOverProj: projectDnd.dragOverProj,
    moveProject: projectDnd.moveProject,
    handleProjectDragStart: projectDnd.handleProjectDragStart,
    handleProjectDragOver: projectDnd.handleProjectDragOver,
    handleProjectDrop: projectDnd.handleProjectDrop,
    handleProjectDragEnd: projectDnd.handleProjectDragEnd,
    dailyFocusQueue,
    showDailyFocusModal,
    setShowDailyFocusModal,
    handleSnoozeTask: crud.handleSnoozeTask,
    handleSnoozeSubTask: subtasks.handleSnoozeSubTask,
    // Anki SRS (Lặp lại ngắt quãng thông minh)
    isAnkiModalOpen,
    ankiModalTarget,
    openAnkiModalForTask,
    openAnkiModalForSubtask,
    closeAnkiModal,
    handleSelectAnkiOption,
    handleMarkAnkiTaskDone,
    openAnkiModal: openAnkiModalForTask,
  };
}
