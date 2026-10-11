import { SubTask } from '../../../types';

/**
 * Trích xuất và làm sạch danh sách công việc từ văn bản dán (Clipboard)
 * Hỗ trợ các định dạng phổ biến:
 * - Bullet Markdown: "- Task", "* Task", "+ Task", "• Task", "▪ Task"
 * - Danh sách số: "1. Task", "1) Task", "1 - Task", "(1) Task"
 * - Checkbox Markdown: "[ ] Task", "[x] Task", "- [ ] Task", "* [x] Task"
 * - Giữ nguyên liên kết web URL (https://..., http://...)
 */
export const cleanPastedLine = (rawLine: string): string => {
  let cleaned = rawLine.trim();
  if (!cleaned) return '';

  // Bỏ Markdown checkboxes: "- [ ]", "- [x]", "[ ]", "[x]", "* [x]"
  cleaned = cleaned.replace(/^([-*+•▪▫]\s*)?\[[ xX]\]\s*/, '');
  // Bỏ số thứ tự đầu dòng: "1. ", "1) ", "1 - ", "(1) "
  cleaned = cleaned.replace(/^(\(\d+\)|\d+[\.\)\-])\s+/, '');
  // Bỏ bullet symbols: "- ", "* ", "+ ", "• ", "▪ ", "▫ ", "👉 ", "✔️ ", "✓ ", "🔹 ", "> "
  cleaned = cleaned.replace(/^[-*+•▪▫👉✔️✓🔹\>]\s*/, '');

  return cleaned.trim();
};

/**
 * Nhận diện xem một dòng có được đánh dấu hoàn thành từ trước không
 * Ví dụ: "- [x] Done item", "[x] Done item", "✔️ Item đã xong"
 */
export const detectLineCompletion = (rawLine: string): boolean => {
  const trimmed = rawLine.trim();
  return (
    /^([-*+•▪▫]\s*)?\[[xX]\]/i.test(trimmed) ||
    /^(✔️|✓)\s*/.test(trimmed)
  );
};

export const parsePastedTasks = (rawText: string): string[] => {
  if (!rawText) return [];
  return rawText
    .split(/\r?\n/)
    .map((line) => cleanPastedLine(line))
    .filter((line) => line.length > 0);
};

export interface HierarchicalTaskItem {
  title: string;
  subtasks: string[];
  completed?: boolean;
}

/**
 * Phân tích danh sách có cấu trúc phân cấp (thụt đầu dòng 2 khoảng trắng hoặc Tab)
 * Ví dụ:
 * Giai đoạn 1: Chuẩn bị
 *   - Mua tên miền
 *   - Cài đặt server
 * Giai đoạn 2: Thiết kế
 */
export const parsePastedHierarchy = (rawText: string): HierarchicalTaskItem[] => {
  if (!rawText) return [];
  const lines = rawText.split(/\r?\n/);
  const result: HierarchicalTaskItem[] = [];
  let currentParent: HierarchicalTaskItem | null = null;

  for (const line of lines) {
    if (!line.trim()) continue;

    // Kiểm tra xem dòng có thụt lề hay không (2+ spaces hoặc Tab)
    const isIndented = /^(\s{2,}|\t)/.test(line);
    const cleaned = cleanPastedLine(line);
    if (!cleaned) continue;

    const isCompleted = detectLineCompletion(line);

    if (isIndented && currentParent) {
      currentParent.subtasks.push(cleaned);
    } else {
      currentParent = {
        title: cleaned,
        subtasks: [],
        completed: isCompleted,
      };
      result.push(currentParent);
    }
  }

  return result;
};

/**
 * Phân tích văn bản dán thành cây việc con đa tầng (Notion / Workflowy Style)
 * Tính toán thụt lề tự động (Spaces hoặc Tab) để lồng các subtask con bên trong.
 */
export const parsePastedSubtasks = (rawText: string): SubTask[] => {
  if (!rawText) return [];
  const lines = rawText.split(/\r?\n/);
  const rootSubs: SubTask[] = [];

  interface StackItem {
    indent: number;
    subtask: SubTask;
  }
  const stack: StackItem[] = [];

  let idx = 0;
  for (const line of lines) {
    if (!line.trim()) continue;

    // Tính toán độ thụt lề (1 tab = 2 spaces)
    const leadingWhitespaceMatch = line.match(/^[\t ]*/);
    const leadingStr = leadingWhitespaceMatch ? leadingWhitespaceMatch[0] : '';
    const indent = leadingStr.replace(/\t/g, '  ').length;

    const cleaned = cleanPastedLine(line);
    if (!cleaned) continue;

    const isCompleted = detectLineCompletion(line);
    idx++;

    const newSub: SubTask = {
      id: 's_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7) + '_' + idx,
      title: cleaned,
      completed: isCompleted,
      status: isCompleted ? 'done' : 'todo',
      subtasks: [],
    };

    // Tìm node cha phù hợp dựa vào độ thụt lề
    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    if (stack.length === 0) {
      rootSubs.push(newSub);
    } else {
      const parent = stack[stack.length - 1].subtask;
      if (!parent.subtasks) parent.subtasks = [];
      parent.subtasks.push(newSub);
    }

    stack.push({ indent, subtask: newSub });
  }

  return rootSubs;
};
