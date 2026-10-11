import { useState } from 'react';
import { Project } from '../../../types';

export function useProjectDnd(
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) {
  const [draggedProjId, setDraggedProjId] = useState<string | null>(null);
  const [dragOverProj, setDragOverProj] = useState<{
    projId: string;
    position: 'top' | 'bottom';
  } | null>(null);

  const handleProjectDragStart = (e: React.DragEvent, projId: string) => {
    const target = e.target as HTMLElement;
    // Bỏ qua nếu bắt đầu từ các thành phần nhập liệu, nút bấm hoặc thẻ công việc con
    if (target.closest('input, textarea, select, button, a, [data-task-card="true"]')) {
      return;
    }
    setDraggedProjId(projId);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', `project:${projId}`);
      e.dataTransfer.setData('application/x-project-drag', projId);
    } catch (err) {}
  };

  const handleProjectDragOver = (e: React.DragEvent, projId: string) => {
    // Chỉ xử lý dragover nếu đang thực sự kéo danh mục
    if (!draggedProjId || draggedProjId === projId) return;

    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const cardEl = e.currentTarget as HTMLElement;
    const rect = cardEl.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position = e.clientY < midY ? 'top' : 'bottom';

    if (
      !dragOverProj ||
      dragOverProj.projId !== projId ||
      dragOverProj.position !== position
    ) {
      setDragOverProj({ projId, position });
    }
  };

  const handleProjectDrop = (e: React.DragEvent, targetProjId: string) => {
    if (!draggedProjId || draggedProjId === targetProjId) {
      setDraggedProjId(null);
      setDragOverProj(null);
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    // Xác định vị trí drop trực tiếp từ event nếu dragOverProj chưa kịp set
    const cardEl = e.currentTarget as HTMLElement;
    const rect = cardEl.getBoundingClientRect();
    const isAbove = e.clientY < rect.top + rect.height / 2;
    const dropPosition = dragOverProj?.position || (isAbove ? 'top' : 'bottom');

    setProjects((prev) => {
      const sourceIndex = prev.findIndex((p) => p.id === draggedProjId);
      if (sourceIndex === -1) return prev;

      const newProjects = [...prev];
      const [moved] = newProjects.splice(sourceIndex, 1);
      if (!moved) return prev;

      let targetIndexAfterRemove = newProjects.findIndex((p) => p.id === targetProjId);
      if (targetIndexAfterRemove === -1) return prev;

      if (dropPosition === 'bottom') {
        targetIndexAfterRemove += 1;
      }

      const safeIndex = Math.max(0, Math.min(newProjects.length, targetIndexAfterRemove));
      newProjects.splice(safeIndex, 0, moved);
      return newProjects;
    });

    setDraggedProjId(null);
    setDragOverProj(null);
  };

  const moveProject = (projId: string, direction: 'up' | 'down') => {
    setProjects((prev) => {
      const idx = prev.findIndex((p) => p.id === projId);
      if (idx === -1) return prev;
      if (direction === 'up' && idx === 0) return prev;
      if (direction === 'down' && idx === prev.length - 1) return prev;

      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.splice(targetIdx, 0, item);
      return copy;
    });
  };

  const handleProjectDragEnd = () => {
    setDraggedProjId(null);
    setDragOverProj(null);
  };

  return {
    draggedProjId,
    dragOverProj,
    moveProject,
    handleProjectDragStart,
    handleProjectDragOver,
    handleProjectDrop,
    handleProjectDragEnd,
  };
}
