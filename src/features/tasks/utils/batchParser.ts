import { SubTask } from '../../../types';

export const cleanPastedLine = (rawLine: string): string =>
  rawLine
    .trim()
    .replace(/^([-*+•▪▫]\s*)?\[[ xX]\]\s*/, '')
    .replace(/^(\(\d+\)|\d+[.)-])\s+/, '')
    .replace(/^[-*+•▪▫👉✔️✓🔹>]\s*/, '')
    .trim();

export const detectLineCompletion = (rawLine: string): boolean =>
  /^([-*+•▪▫]\s*)?\[[xX]\]/i.test(rawLine.trim()) || /^(✔️|✓)\s*/.test(rawLine.trim());

export const parsePastedTasks = (rawText: string): string[] =>
  rawText
    .split(/\r?\n/)
    .map(cleanPastedLine)
    .filter((line) => line.length > 0);

export interface HierarchicalTaskItem {
  title: string;
  subtasks: string[];
  completed: boolean;
}

export const parsePastedHierarchy = (rawText: string): HierarchicalTaskItem[] => {
  const roots: HierarchicalTaskItem[] = [];
  let currentParent: HierarchicalTaskItem | null = null;

  for (const line of rawText.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const title = cleanPastedLine(line);
    if (!title) continue;

    if (/^(\s{2,}|\t)/.test(line) && currentParent) {
      currentParent.subtasks.push(title);
    } else {
      currentParent = { title, subtasks: [], completed: detectLineCompletion(line) };
      roots.push(currentParent);
    }
  }

  return roots;
};

export const parsePastedSubtasks = (rawText: string): SubTask[] => {
  const roots: SubTask[] = [];
  const stack: Array<{ indent: number; node: SubTask }> = [];
  let index = 0;

  for (const line of rawText.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const whitespace = line.match(/^[\t ]*/)?.[0] ?? '';
    const indent = whitespace.replace(/\t/g, '  ').length;
    const title = cleanPastedLine(line);
    if (!title) continue;

    const completed = detectLineCompletion(line);
    const node: SubTask = {
      id: `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}_${index++}`,
      title,
      completed,
      status: completed ? 'done' : 'todo',
      subtasks: [],
    };

    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) stack.pop();
    const parent = stack[stack.length - 1]?.node;
    if (parent) parent.subtasks!.push(node);
    else roots.push(node);
    stack.push({ indent, node });
  }

  return roots;
};
