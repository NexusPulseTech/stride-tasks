import { useState } from 'react';
import { Project } from '../../../types';

export function useTaskDnd(
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
) {
  const [draggedItem, setDraggedItem] = useState<{ projId: string; index: number } | null>(null);
  const [dragOverItem, setDragOverItem] = useState<{
    projId: string;
    index: number;
    position: 'top' | 'bottom';
  } | null>(null);

  const handleDragStart = (e: React.DragEvent, projId: string, index: number) => {
    const target = e.target as HTMLElement;
    if (target.closest('input, select, button:not([data-drag-handle]), a, [data-subtask-row]')) {
      e.preventDefault();
      return;
    }
    setDraggedItem({ projId, index });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${projId}:${index}`);
  };

  const handleDragOver = (e: React.DragEvent, projId: string, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!draggedItem || draggedItem.projId !== projId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position = e.clientY < midY ? 'top' : 'bottom';

    if (
      !dragOverItem ||
      dragOverItem.projId !== projId ||
      dragOverItem.index !== index ||
      dragOverItem.position !== position
    ) {
      setDragOverItem({ projId, index, position });
    }
  };

  const handleDrop = (e: React.DragEvent, projId: string, dropIndex: number) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.projId !== projId) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    const sourceIndex = draggedItem.index;
    let targetIndex = dropIndex;
    if (dragOverItem?.position === 'bottom') {
      targetIndex += 1;
    }
    if (sourceIndex < targetIndex) {
      targetIndex -= 1;
    }

    if (sourceIndex !== targetIndex) {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== projId) return p;
          const newTasks = [...p.tasks];
          const [moved] = newTasks.splice(sourceIndex, 1);
          newTasks.splice(targetIndex, 0, moved);
          return { ...p, tasks: newTasks };
        })
      );
    }

    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  return {
    draggedItem,
    dragOverItem,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  };
}
