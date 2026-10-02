import { useState, useEffect, useRef } from 'react';
import { Project, Task, FilterType, MobileGuideTab, ConfirmDialogState } from '../../../types';
import { INITIAL_PROJECTS } from '../../../constants';
import { triggerHaptic, playChime } from '../../../utils';
import { parsePastedTasks } from '../utils/batchParser';
import { matchTaskDeep } from '../utils/searchHelper';
import { useCelebrationAndStreak } from './useCelebrationAndStreak';
import { useSmartReminder } from './useSmartReminder';
import { useTaskCRUD } from './useTaskCRUD';
import { useSubtaskOperations } from './useSubtaskOperations';
import { useTaskDnd } from './useTaskDnd';
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

  const desktopSearchRef = useRef<HTMLInputElement | null>(null);
  const mobileSearchRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Composed Sub-Hooks
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

  const handleExecuteBatchPaste = () => {
    if (!batchPasteProject) return;
    const lines = parsePastedTasks(batchPasteText);
    if (lines.length === 0) return;
    const newTasks: Task[] = lines.map((title) => ({
      id: 't_' + Math.random().toString(36).slice(2, 9),
      title,
      status: 'todo',
      subtasks: [],
    }));
    crud.setProjects((prev) =>
      prev.map((p) => p.id === batchPasteProject.id ? { ...p, isExpanded: true, tasks: [...p.tasks, ...newTasks] } : p)
    );
    celebration.showToast(`Đã thêm ${lines.length} công việc vào "${batchPasteProject.name}"!`);
    setBatchPasteProject(null);
    setBatchPasteText('');
  };

  const handleMobileSubmitTask = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = mobileTaskTitle.trim();
    if (!raw) return;
    const targetProjId = mobileSelectedProjId || (crud.projects.length > 0 ? crud.projects[0].id : '');
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
        prev.map((p) => p.id === targetProjId ? { ...p, isExpanded: true, tasks: [...p.tasks, ...newTasks] } : p)
      );
      celebration.showToast(`Đã tạo ${lines.length} việc mới!`);
    } else {
      const newTask: Task = { id: 't_' + Date.now(), title: raw, status: 'todo', isPinned: mobileTaskPinned, subtasks: [] };
      crud.setProjects((prev) =>
        prev.map((p) => p.id === targetProjId ? { ...p, isExpanded: true, tasks: [...p.tasks, newTask] } : p)
      );
      celebration.showToast('Đã thêm công việc!');
    }
    setMobileTaskTitle('');
    setMobileTaskPinned(false);
    setShowMobileAddModal(false);
  };

  const resetSample = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Khôi phục dữ liệu mẫu ban đầu?',
      message: 'Thao tác này sẽ thiết lập lại các danh mục dự án và công việc về trạng thái mẫu ban đầu.',
      confirmText: 'Khôi phục',
      cancelText: 'Hủy',
      isDestructive: false,
      onConfirm: () => {
        crud.setProjects(JSON.parse(JSON.stringify(INITIAL_PROJECTS)));
        celebration.showToast('Đã khôi phục dữ liệu mẫu!');
        setConfirmDialog(null);
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
    const dataStr = JSON.stringify(crud.projects, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cong-viec-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    celebration.showToast('Đã xuất file sao lưu!');
  };

  const importDataJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].tasks) {
          crud.setProjects(parsed);
          celebration.showToast('Đã khôi phục dữ liệu thành công!');
          setShowBackupModal(false);
        } else {
          celebration.showToast('File JSON không hợp lệ!');
        }
      } catch (err) {
        celebration.showToast('Lỗi đọc file JSON!');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  let totalTasks = 0;
  let totalDone = 0;
  let totalDoing = 0;
  crud.projects.forEach((p) => {
    totalTasks += p.tasks.length;
    p.tasks.forEach((t) => {
      if (t.status === 'done') totalDone++;
      if (t.status === 'doing') totalDoing++;
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
      const total = p.tasks.length;
      const done = p.tasks.filter((t) => t.status === 'done').length;
      const isCompleted = total > 0 && done === total;
      if (filter === 'doing') return p.tasks.some((t) => t.status === 'doing') || !isCompleted;
      if (filter === 'completed') return isCompleted;
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
