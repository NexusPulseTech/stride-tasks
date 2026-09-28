import { useState, useEffect } from 'react';
import { Project, Task } from '../../../types';
import { STORAGE_KEY, INITIAL_PROJECTS } from '../../../constants';
import { triggerHaptic } from '../../../utils';
import { parsePastedTasks } from '../utils/batchParser';
import { cascadeSubtaskCompleted } from '../utils/subtaskTree';
import { exportProjectToMarkdown } from '../utils/formatters';

interface TaskCRUDDeps {
  showToast: (msg: string) => void;
  triggerCelebration: () => void;
  triggerUndoableAction: (message: string, undoFn: () => void) => void;
  handleDoneStreak: () => void;
  onTaskDone?: (completed: boolean, task?: Task, project?: Project) => void;
}

export function useTaskCRUD({
  showToast,
  triggerCelebration,
  triggerUndoableAction,
  handleDoneStreak,
  onTaskDone,
}: TaskCRUDDeps) {
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_PROJECTS;
  });

  const [newProjectName, setNewProjectName] = useState('');
  const [taskInputs, setTaskInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {}
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
    showToast('Đã cập nhật ghim ưu tiên!');
  };

  const copyTaskToClipboard = (title: string) => {
    triggerHaptic();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(title);
      showToast('Đã sao chép công việc!');
    }
  };

  const copyProjectAsMarkdown = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    triggerHaptic();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(exportProjectToMarkdown(project));
      showToast('Đã sao chép toàn bộ checklist (Notion Markdown)!');
    }
  };

  const handleTaskInputPaste = (projId: string, e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    if (text && text.includes('\n')) {
      const lines = parsePastedTasks(text);
      if (lines.length > 1) {
        e.preventDefault();
        triggerHaptic();
        const newTasks: Task[] = lines.map((title) => ({
          id: 't_' + Math.random().toString(36).slice(2, 9),
          title,
          status: 'todo',
          subtasks: [],
        }));
        setProjects((prev) => prev.map((p) => (p.id === projId ? { ...p, tasks: [...p.tasks, ...newTasks] } : p)));
        showToast(`Đã dán nhanh ${lines.length} công việc!`);
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
    showToast(`Đã tạo dự án "${name}"!`);
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const projIndex = projects.findIndex((p) => p.id === id);
    const projToDelete = projects[projIndex];
    if (!projToDelete) return;
    setProjects((prev) => prev.filter((p) => p.id !== id));
    triggerUndoableAction(`Đã xóa dự án "${projToDelete.name}"`, () => {
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
      const newTasks: Task[] = lines.map((title) => ({
        id: 't_' + Math.random().toString(36).slice(2, 9),
        title,
        status: 'todo',
        subtasks: [],
      }));
      setProjects((prev) => prev.map((p) => (p.id === projId ? { ...p, tasks: [...p.tasks, ...newTasks] } : p)));
      showToast(`Đã thêm ${lines.length} công việc!`);
    } else {
      const newTask: Task = { id: 't_' + Date.now(), title: raw, status: 'todo', subtasks: [] };
      setProjects((prev) => prev.map((p) => (p.id === projId ? { ...p, tasks: [...p.tasks, newTask] } : p)));
      showToast('Đã thêm việc!');
    }
    setTaskInputs((prev) => ({ ...prev, [projId]: '' }));
  };

  const checkProjectCompletion = (projId: string, taskId: string) => {
    handleDoneStreak();
    const p = projects.find((item) => item.id === projId);
    if (p) {
      const remaining = p.tasks.filter((t) => t.id !== taskId && t.status !== 'done');
      if (remaining.length === 0) {
        triggerCelebration();
        showToast(`🎉 Xuất sắc! Đã hoàn thành toàn bộ dự án "${p.name}"!`);
      }
    }
  };

  const toggleTaskDone = (projId: string, taskId: string, isChecked: boolean) => {
    triggerHaptic();
    const nextStatus: 'done' | 'todo' = isChecked ? 'done' : 'todo';
    setProjects((prev) =>
      prev.map((p) => p.id !== projId ? p : {
        ...p,
        tasks: p.tasks.map((t) => t.id !== taskId ? t : {
          ...t,
          status: nextStatus,
          completedAt: isChecked ? (t.completedAt || new Date().toISOString()) : undefined,
          subtasks: isChecked ? t.subtasks.map((s) => cascadeSubtaskCompleted(s, true)) : t.subtasks,
        }),
      })
    );
    const targetProject = projects.find((item) => item.id === projId);
    const targetTask = targetProject?.tasks.find((item) => item.id === taskId);

    if (isChecked) {
      checkProjectCompletion(projId, taskId);
      onTaskDone?.(true, targetTask ? { ...targetTask, status: 'done' } : undefined, targetProject);
    } else {
      onTaskDone?.(false, targetTask, targetProject);
    }
  };

  const changeStatus = (projId: string, taskId: string, status: 'todo' | 'doing' | 'done') => {
    triggerHaptic();
    setProjects((prev) =>
      prev.map((p) => p.id !== projId ? p : {
        ...p,
        tasks: p.tasks.map((t) => t.id !== taskId ? t : {
          ...t,
          status,
          completedAt: status === 'done' ? (t.completedAt || new Date().toISOString()) : undefined,
          subtasks: status === 'done' ? t.subtasks.map((s) => cascadeSubtaskCompleted(s, true)) : t.subtasks,
        }),
      })
    );

    const targetProject = projects.find((item) => item.id === projId);
    const targetTask = targetProject?.tasks.find((item) => item.id === taskId);

    if (status === 'done') {
      checkProjectCompletion(projId, taskId);
      onTaskDone?.(true, targetTask ? { ...targetTask, status: 'done' } : undefined, targetProject);
    } else {
      onTaskDone?.(false, targetTask, targetProject);
    }
  };

  const handleDeleteTask = (projId: string, taskId: string) => {
    const p = projects.find((item) => item.id === projId);
    if (!p) return;
    const taskIndex = p.tasks.findIndex((t) => t.id === taskId);
    const taskToDelete = p.tasks[taskIndex];
    if (!taskToDelete) return;

    setProjects((prev) => prev.map((proj) => proj.id === projId ? { ...proj, tasks: proj.tasks.filter((t) => t.id !== taskId) } : proj));
    triggerUndoableAction(`Đã xóa "${taskToDelete.title.slice(0, 22)}..."`, () => {
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
    showToast('Đã cập nhật tên công việc!');
  };

  const handleEditProjectName = (projId: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setProjects((prev) =>
      prev.map((p) => (p.id === projId ? { ...p, name: trimmed } : p))
    );
    showToast('Đã đổi tên dự án!');
  };

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
    handleDeleteTask,
    handleEditTaskTitle,
    moveTask,
    togglePinTask,
    toggleExpand,
    copyTaskToClipboard,
    copyProjectAsMarkdown,
    handleTaskInputPaste,
  };
}
