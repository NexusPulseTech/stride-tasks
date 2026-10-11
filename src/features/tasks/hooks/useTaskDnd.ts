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
    // Bỏ qua nếu bắt đầu từ nút bấm, input, textarea, link hoặc danh sách việc con (subtasks)
    if (target.closest('input, textarea, select, button, a, [data-subtask-row]')) {
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    setDraggedItem({ projId, index });
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', `${projId}:${index}`);
      e.dataTransfer.setData('application/x-task-drag', `${projId}:${index}`);
    } catch (err) {}
  };

  const handleDragOver = (e: React.DragEvent, projId: string, index: number) => {
    // Chỉ xử lý dragover nếu đang thực sự kéo một task, nếu không hãy để sự kiện nổi lên danh mục (Project)
    if (!draggedItem) return;

    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';

    // Đo đạc chính xác chiều cao card chính, loại trừ danh sách việc con mở rộng
    const cardEl =
      ((e.currentTarget as HTMLElement).querySelector('[data-task-card="true"]') as HTMLElement) ||
      (e.currentTarget as HTMLElement);
    const rect = cardEl.getBoundingClientRect();
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

  const handleDrop = (e: React.DragEvent, targetProjId: string, dropIndex: number) => {
    // Nếu không kéo task, không được nuốt sự kiện drop (để project drop nhận diện)
    if (!draggedItem) return;

    e.preventDefault();
    e.stopPropagation();

    const { projId: sourceProjId, index: sourceIndex } = draggedItem;

    if (sourceProjId === targetProjId) {
      // Kéo thả sắp xếp lại thứ tự trong cùng một dự án
      if (sourceIndex === dropIndex) {
        setDraggedItem(null);
        setDragOverItem(null);
        return;
      }

      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== sourceProjId) return p;
          const newTasks = [...p.tasks];
          const [moved] = newTasks.splice(sourceIndex, 1);
          if (!moved) return p;

          // Thuật toán tính chỉ số mục tiêu chuẩn xác 100%:
          // Khi kéo lên (dropIndex < sourceIndex): dropIndex vẫn giữ nguyên vị trí trong mảng sau khi xóa source
          // - position === 'top': chèn ngay tại dropIndex
          // - position === 'bottom': chèn sau dropIndex (dropIndex + 1)
          // Khi kéo xuống (dropIndex > sourceIndex): item tại dropIndex bị lùi 1 vị trí do xóa source trước đó
          // - position === 'top': chèn trước nó (dropIndex - 1)
          // - position === 'bottom': chèn sau nó (dropIndex)
          let targetIndex: number;
          if (dropIndex < sourceIndex) {
            targetIndex = dragOverItem?.position === 'bottom' ? dropIndex + 1 : dropIndex;
          } else {
            targetIndex = dragOverItem?.position === 'top' ? dropIndex - 1 : dropIndex;
          }

          const safeTarget = Math.max(0, Math.min(newTasks.length, targetIndex));
          newTasks.splice(safeTarget, 0, moved);
          return { ...p, tasks: newTasks };
        })
      );
    } else {
      // Kéo thả chuyển việc giữa các dự án khác nhau
      setProjects((prev) => {
        const sourceProj = prev.find((p) => p.id === sourceProjId);
        if (!sourceProj || !sourceProj.tasks[sourceIndex]) return prev;
        const taskToMove = sourceProj.tasks[sourceIndex];

        let targetIndex = dropIndex;
        if (dragOverItem?.position === 'bottom') {
          targetIndex += 1;
        }

        return prev.map((p) => {
          if (p.id === sourceProjId) {
            return {
              ...p,
              tasks: p.tasks.filter((_, idx) => idx !== sourceIndex),
            };
          }
          if (p.id === targetProjId) {
            const newTasks = [...p.tasks];
            const safeTarget = Math.max(0, Math.min(newTasks.length, targetIndex));
            newTasks.splice(safeTarget, 0, taskToMove);
            return { ...p, tasks: newTasks };
          }
          return p;
        });
      });
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
