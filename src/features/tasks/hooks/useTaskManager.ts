import { useState, useEffect, useRef, useCallback } from 'react';
import {
  AutoBackupData,
  CompletedItemLog,
  Project,
  Task,
  FilterType,
  MobileGuideTab,
  ConfirmDialogState,
  BatchPasteTarget,
  StatusDefinition,
  SubTask,
  StrideBackupPayload,
} from '../../../types';
import { APP_VERSION, INITIAL_PROJECTS } from '../../../constants';
import { triggerHaptic, playChime } from '../../../utils';
import { parsePastedTasks, parsePastedSubtasks } from '../utils/batchParser';
import { isDoneStatus, isDoingStatus } from '../utils/statusCategory';
import { matchTaskDeep } from '../utils/searchHelper';
import { useCelebrationAndStreak } from './useCelebrationAndStreak';
import { useSmartReminder } from './useSmartReminder';
import { useTaskCRUD, STRIDE_AUTO_BACKUP_KEY } from './useTaskCRUD';
import { useSubtaskOperations } from './useSubtaskOperations';
import { useTaskDnd } from './useTaskDnd';
import { useStatusManager } from './useStatusManager';
import { useActivityLog } from '../../analytics';

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
  const celebration = useCelebrationAndStreak([]);
  const crud = useTaskCRUD({
    showToast: celebration.showToast,
    triggerCelebration: celebration.triggerCelebration,
    triggerUndoableAction: celebration.triggerUndoableAction,
    handleDoneStreak: () => {
      celebration.handleDoneStreak();
    },
    onTaskDone: (completed, task, project) => {
      if (completed && task) {
        activity.recordTaskCompletion(task, project);
        celebration.handleDoneStreak();
      } else if (!completed && task) {
        activity.removeTaskCompletion(task.id);
      }
    },
  });

  // Keep one recovery snapshot synchronized with projects, completion history, and custom statuses.
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

  useEffect(() => {
    try {
      const isTemplate = JSON.stringify(crud.projects) === JSON.stringify(INITIAL_PROJECTS);
      if (isTemplate || crud.projects.length === 0) return;

      const taskCount = crud.projects.reduce((total, project) => total + (project.tasks?.length || 0), 0);
      const snapshot: AutoBackupData = {
        timestamp: new Date().toISOString(),
        projectCount: crud.projects.length,
        taskCount,
        historyCount: activity.completedLogs.length,
        projects: crud.projects,
        completedLogs: activity.completedLogs,
        customStatuses: statusManager.statuses.filter((status) => status.isCustom),
      };
      localStorage.setItem(STRIDE_AUTO_BACKUP_KEY, JSON.stringify(snapshot));
      setAutoBackupData(snapshot);
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
    handleDoneStreak: () => {
      celebration.handleDoneStreak();
    },
    playChime,
    isMuted: celebration.isMuted,
    onTaskDone: (completed, task, project) => {
      if (completed && task) {
        activity.recordTaskCompletion(task, project);
        celebration.handleDoneStreak();
      } else if (!completed && task) {
        activity.removeTaskCompletion(task.id);
      }
    },
  });
  const dnd = useTaskDnd(crud.setProjects);

  useEffect(() => {
    const handleGlobalClick = () => setActiveMenuTaskId(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const openBatchPasteForProject = (project: Project) => {
    setBatchPasteProject(project);
    setBatchPasteTarget({ type: 'project', projectId: project.id, projectName: project.name });
    setBatchPasteText('');
  };

  const openBatchPasteForTask = (project: Project, task: Task, parentSubId?: string, subTitle?: string) => {
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
    const target = batchPasteTarget || (batchPasteProject ? {
      type: 'project' as const,
      projectId: batchPasteProject.id,
      projectName: batchPasteProject.name,
    } : null);
    if (!target) return;

    const parsedTree = parsePastedSubtasks(batchPasteText);
    if (parsedTree.length === 0) return;

    if (target.type === 'project') {
      const convertNode = (node: SubTask, forceDone = false): SubTask => {
        const completed = forceDone || node.completed;
        return {
          ...node,
          completed,
          status: completed ? 'done' : node.status || 'todo',
          subtasks: (node.subtasks || []).map((child) => convertNode(child, completed)),
        };
      };
      const newTasks: Task[] = parsedTree.map((root) => ({
        id: 't_' + Math.random().toString(36).slice(2, 9),
        title: root.title,
        status: root.completed ? 'done' : 'todo',
        completedAt: root.completed ? new Date().toISOString() : undefined,
        subtasks: (root.subtasks || []).map((child) => convertNode(child, root.completed)),
      }));
      crud.setProjects((prev) => prev.map((project) => project.id === target.projectId
        ? { ...project, isExpanded: true, tasks: [...project.tasks, ...newTasks] }
        : project));
      celebration.showToast(`Đã thêm ${newTasks.length} công việc vào "${target.projectName}"!`);
    } else if (target.taskId) {
      subtasks.handleAddSubTask(target.projectId, target.taskId, batchPasteText, target.parentSubId ?? null);
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
        'Thao tác này sẽ thiết lập lại các danh mục dự án và công việc về trạng thái mẫu ban đầu. Toàn bộ công việc bạn đã tạo thêm sẽ bị thay thế. Hãy nhớ tải bản sao lưu .JSON trước nếu cần!',
      confirmText: 'Khôi phục mẫu',
      cancelText: 'Hủy',
      isDestructive: true,
      onConfirm: () => {
        crud.setProjects(JSON.parse(JSON.stringify(INITIAL_PROJECTS)));
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
    setConfirmDialog({
      isOpen: true,
      title: 'Khôi phục từ bản tự động sao lưu?',
      message: `Hệ thống sẽ khôi phục dữ liệu đã tự động lưu lúc ${formattedDate} (${autoBackupData.projectCount} danh mục, ${autoBackupData.taskCount} công việc). Dữ liệu hiện tại sẽ được thay thế bằng bản sao lưu này. Bạn có muốn tiếp tục?`,
      confirmText: 'Khôi phục bản này',
      cancelText: 'Hủy',
      isDestructive: false,
      onConfirm: () => {
        crud.setProjects(autoBackupData.projects);
        if (Array.isArray(autoBackupData.completedLogs)) {
          activity.saveLogs(autoBackupData.completedLogs);
        }
        if (Array.isArray(autoBackupData.customStatuses)) {
          statusManager.restoreCustomStatuses(autoBackupData.customStatuses);
        }
        celebration.showToast('Đã khôi phục dữ liệu từ bản tự động thành công!');
        setConfirmDialog(null);
        setShowBackupModal(false);
      },
    });
  };

  // 3. Xóa toàn bộ dữ liệu (Luôn Confirm)
  const clearAllData = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa toàn bộ dự án và công việc?',
      message:
        'Thao tác này sẽ xóa sạch tất cả danh mục và công việc hiện có, đưa ứng dụng về trang làm việc trống hoàn toàn. Bạn có chắc chắn muốn xóa?',
      confirmText: 'Xóa tất cả',
      cancelText: 'Hủy',
      isDestructive: true,
      onConfirm: () => {
        crud.setProjects([]);
        activity.clearAllActivityLogs();
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

  const exportDataJson = () => {
    const taskCount = crud.projects.reduce((total, project) => total + (project.tasks?.length || 0), 0);
    const payload: StrideBackupPayload = {
      version: APP_VERSION,
      schemaVersion: 2,
      appName: 'Stride Tasks',
      exportedAt: new Date().toISOString(),
      summary: {
        projectCount: crud.projects.length,
        taskCount,
        historyLogCount: activity.completedLogs.length,
        streakCount: activity.currentStreak,
      },
      data: {
        projects: crud.projects,
        completedLogs: activity.completedLogs,
        customStatuses: statusManager.statuses.filter((status) => status.isCustom),
      },
    };
    const dataStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stride-tasks-full-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    celebration.showToast('Đã xuất file sao lưu toàn diện (.JSON)!');
  };

  // 4. Nhập file JSON sao lưu (Luôn Confirm trước khi đè dữ liệu)
  const importDataJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed: unknown = JSON.parse(event.target?.result as string);
        const parsedRecord =
          parsed && typeof parsed === 'object' && !Array.isArray(parsed)
            ? (parsed as Record<string, unknown>)
            : null;
        const snapshotData =
          parsedRecord?.data && typeof parsedRecord.data === 'object' && !Array.isArray(parsedRecord.data)
            ? (parsedRecord.data as Record<string, unknown>)
            : null;
        let incomingProjects: Project[] | null = null;
        let incomingLogs: CompletedItemLog[] | null = null;
        let incomingCustomStatuses: StatusDefinition[] | null = null;
        let hasFullSnapshot = false;

        if (snapshotData && Array.isArray(snapshotData.projects)) {
          incomingProjects = snapshotData.projects as Project[];
          incomingLogs = Array.isArray(snapshotData.completedLogs)
            ? (snapshotData.completedLogs as CompletedItemLog[])
            : null;
          incomingCustomStatuses = Array.isArray(snapshotData.customStatuses)
            ? (snapshotData.customStatuses as StatusDefinition[])
            : null;
          hasFullSnapshot = true;
        } else if (
          Array.isArray(parsed) &&
          parsed.every((project) => project && typeof project === 'object' && Array.isArray(project.tasks))
        ) {
          incomingProjects = parsed as Project[];
        } else if (parsedRecord && Array.isArray(parsedRecord.projects)) {
          incomingProjects = parsedRecord.projects as Project[];
          incomingLogs = Array.isArray(parsedRecord.completedLogs)
            ? (parsedRecord.completedLogs as CompletedItemLog[])
            : null;
          incomingCustomStatuses = Array.isArray(parsedRecord.customStatuses)
            ? (parsedRecord.customStatuses as StatusDefinition[])
            : null;
          hasFullSnapshot = incomingLogs !== null || incomingCustomStatuses !== null;
        }

        if (!incomingProjects) {
          celebration.showToast('File JSON không hợp lệ hoặc sai định dạng!');
          return;
        }

        const taskCount = incomingProjects.reduce((acc, project) => acc + (project.tasks?.length || 0), 0);
        const historyCount = incomingLogs?.length || 0;
        setConfirmDialog({
          isOpen: true,
          title: 'Khôi phục dữ liệu từ tệp sao lưu JSON?',
          message: hasFullSnapshot
            ? `Tệp snapshot chứa ${incomingProjects.length} dự án, ${taskCount} công việc, ${historyCount} mục lịch sử Heatmap và ${(incomingCustomStatuses || []).length} trạng thái tùy chỉnh. Dữ liệu snapshot sẽ thay thế dữ liệu tương ứng hiện tại. Bạn có muốn tiếp tục?`
            : `Tệp sao lưu cũ chứa ${incomingProjects.length} dự án và ${taskCount} công việc. Lịch sử Heatmap và trạng thái tùy chỉnh hiện tại sẽ được giữ nguyên. Bạn có muốn tiếp tục?`,
          confirmText: 'Khôi phục tệp này',
          cancelText: 'Hủy',
          isDestructive: true,
          onConfirm: () => {
            crud.setProjects(incomingProjects!);
            if (incomingLogs) activity.saveLogs(incomingLogs);
            if (incomingCustomStatuses) statusManager.restoreCustomStatuses(incomingCustomStatuses);
            celebration.showToast('Đã khôi phục dữ liệu sao lưu thành công!');
            setConfirmDialog(null);
            setShowBackupModal(false);
          },
        });
      } catch (err) {
        celebration.showToast('Lỗi đọc file JSON!');
      }
    };
  };

  // 5. Xóa dự án (Confirm nếu dự án có công việc bên trong)
  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
          crud.handleDeleteProject(id, e);
          setConfirmDialog(null);
        },
      });
    } else {
      crud.handleDeleteProject(id, e);
    }
  };

  let totalTasks = 0;
  let totalDone = 0;
  let totalDoing = 0;
  crud.projects.forEach((p) => {
    totalTasks += p.tasks.length;
    p.tasks.forEach((t) => {
      if (isDoneStatus(t.status, statusManager.statuses)) totalDone++;
      if (isDoingStatus(t.status, statusManager.statuses)) totalDoing++;
    });
  });

  const percentTotal = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;
  const uncompletedCount = totalTasks - totalDone;

  const filteredProjects = crud.projects
    .filter((p) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchP = p.name.toLowerCase().includes(q);
        const matchT = p.tasks.some((t) => matchTaskDeep(t, q));
        if (!matchP && !matchT) return false;
      }
      if (filter === 'doing') return p.tasks.some((task) => isDoingStatus(task.status, statusManager.statuses));
      if (filter === 'completed') return p.tasks.some((task) => isDoneStatus(task.status, statusManager.statuses));
      return true;
    })
    .map((p) => {
      // Khi đang tìm kiếm: Tự động mở rộng (auto-expand) dự án nếu có kết quả khớp
      if (search.trim()) {
        return { ...p, isExpanded: true };
      }
      return p;
    });

  const pinnedTasks = crud.projects.flatMap((p) =>
    p.tasks.filter((t) => t.isPinned).map((t) => ({ task: t, project: p }))
  );

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
    exportDataJson,
    importDataJson,
    totalTasks,
    totalDone,
    totalDoing,
    percentTotal,
    uncompletedCount,
    filteredProjects,
    pinnedTasks,
    showFeedbackModal,
    setShowFeedbackModal,
  };
}
