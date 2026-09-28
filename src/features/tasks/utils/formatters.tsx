import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Project, SubTask } from '../../../types';
export function formatSubtasksToMarkdown(subtasks: SubTask[], indentLevel = 1): string[] {
  const lines: string[] = [];
  const indent = '  '.repeat(indentLevel);

  for (const sub of subtasks) {
    lines.push(`${indent}- [${sub.completed ? 'x' : ' '}] ${sub.title}`);
    if (sub.subtasks && sub.subtasks.length > 0) {
      lines.push(...formatSubtasksToMarkdown(sub.subtasks, indentLevel + 1));
    }
  }

  return lines;
}

export function exportProjectToMarkdown(project: Project): string {
  let md = `# ${project.name}\n\n`;
  project.tasks.forEach((t) => {
    const mark = t.status === 'done' ? '[x]' : '[ ]';
    md += `- ${mark} ${t.title}\n`;
    if (t.subtasks && t.subtasks.length > 0) {
      md += formatSubtasksToMarkdown(t.subtasks, 1);
    }
  });
  return md;
}

export function FormattedTaskText({ text, isDone }: { text: string; isDone: boolean }) {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return (
    <span className={`inline ${isDone ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'}`}>
      {parts.map((part, index) => {
        if (part.match(urlRegex)) {
          let displayUrl = part;
          try {
            const urlObj = new URL(part);
            const host = urlObj.hostname.replace(/^www\./, '');
            const path =
              urlObj.pathname === '/' || !urlObj.pathname
                ? ''
                : urlObj.pathname.length > 8
                ? urlObj.pathname.slice(0, 8) + '…'
                : urlObj.pathname;
            displayUrl = host + path;
          } catch (e) {
            displayUrl = part.length > 20 ? part.slice(0, 20) + '…' : part;
          }

          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-0.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline underline-offset-2 mx-1 font-medium select-text max-w-[130px] sm:max-w-[200px] truncate align-baseline cursor-pointer"
              title={`Mở liên kết: ${part}`}
              aria-label={`Mở liên kết: ${part}`}
            >
              <span className="truncate">{displayUrl}</span>
              <ExternalLink className="w-2.5 h-2.5 shrink-0 inline" strokeWidth={1.75} aria-hidden="true" />
            </a>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}
