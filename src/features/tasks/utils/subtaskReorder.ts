import { SubTask } from '../../../types';

/**
 * UTILITIES FOR REORDERING SUBTASKS IN TREE HIERARCHY
 * Hỗ trợ kéo thả sắp xếp lại các bước con ở mọi cấp độ (Notion / Linear style).
 */

function isDescendant(node: SubTask, targetId: string): boolean {
  if (node.id === targetId) return true;
  if (node.subtasks) {
    for (const child of node.subtasks) {
      if (isDescendant(child, targetId)) return true;
    }
  }
  return false;
}

function extractSubtask(
  list: SubTask[],
  id: string
): { extracted: SubTask | null; remaining: SubTask[] } {
  let extracted: SubTask | null = null;
  function traverse(items: SubTask[]): SubTask[] {
    const res: SubTask[] = [];
    for (const item of items) {
      if (item.id === id) {
        extracted = item;
        continue;
      }
      if (item.subtasks && item.subtasks.length > 0) {
        res.push({
          ...item,
          subtasks: traverse(item.subtasks),
        });
      } else {
        res.push(item);
      }
    }
    return res;
  }
  const remaining = traverse(list);
  return { extracted, remaining };
}

function insertSubtask(
  list: SubTask[],
  targetId: string,
  subtaskToInsert: SubTask,
  position: 'top' | 'bottom'
): SubTask[] {
  let inserted = false;

  function traverse(items: SubTask[]): SubTask[] {
    const res: SubTask[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.id === targetId) {
        inserted = true;
        if (position === 'top') {
          res.push(subtaskToInsert);
          res.push(item);
        } else {
          res.push(item);
          res.push(subtaskToInsert);
        }
      } else {
        if (item.subtasks && item.subtasks.length > 0) {
          res.push({
            ...item,
            subtasks: traverse(item.subtasks),
          });
        } else {
          res.push(item);
        }
      }
    }
    return res;
  }

  const result = traverse(list);
  return inserted ? result : list;
}

/**
 * Reorders a subtask in the tree hierarchy.
 * Ngăn chặn việc thả một node cha vào bên trong node con của chính nó.
 */
export function reorderSubtaskTree(
  subtasks: SubTask[],
  sourceId: string,
  targetId: string,
  position: 'top' | 'bottom'
): SubTask[] {
  if (sourceId === targetId) return subtasks;

  const { extracted, remaining } = extractSubtask(subtasks, sourceId);
  if (!extracted) return subtasks;

  if (isDescendant(extracted, targetId)) {
    return subtasks;
  }

  return insertSubtask(remaining, targetId, extracted, position);
}
