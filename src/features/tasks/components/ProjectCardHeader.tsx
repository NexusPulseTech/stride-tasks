import React, { useState } from 'react';
import { ChevronRight, Trash2, Copy, ClipboardPaste } from 'lucide-react';
import { Project } from '../../../types';

export interface ProjectCardHeaderProps {
  project: Project;
  countDone: number;
  totalTasks: number;
  pct: number;
  isAllDone: boolean;
  onToggleExpand: (id: string) => void;
  onCopyProjectAsMarkdown: (project: Project, e: React.MouseEvent) => void;
  onOpenBatchPaste: (project: Project) => void;
  onDeleteProject: (id: string, e: React.MouseEvent) => void;
  onEditProjectName?: (id: string, newName: string) => void;
}

export function ProjectCardHeader({
  project,
  countDone,
  totalTasks,
  pct,
  isAllDone,
  onToggleExpand,
  onCopyProjectAsMarkdown,
  onOpenBatchPaste,
  onDeleteProject,
  onEditProjectName,
}: ProjectCardHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(project.name);

  return (
    <div
      onClick={() => onToggleExpand(project.id)}
      className="h-11 px-3.5 cursor-pointer select-none flex items-center justify-between gap-2 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors flex-nowrap w-full overflow-hidden"
    >
      <div className="flex items-center gap-2 flex-1 min-w-0 flex-nowrap overflow-hidden">
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: project.color || '#487ca5' }}
        />
        {isEditing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (editName.trim() && onEditProjectName) onEditProjectName(project.id, editName);
              setIsEditing(false);
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 min-w-0"
          >
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onFocus={(e) => e.target.select()}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setEditName(project.name);
                  setIsEditing(false);
                }
              }}
              onBlur={() => {
                if (editName.trim() && onEditProjectName) onEditProjectName(project.id, editName);
                setIsEditing(false);
              }}
              autoFocus
              className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 bg-white dark:bg-[#161b22] border border-slate-300 dark:border-slate-600 rounded px-1.5 py-0.5 outline-none w-full shadow-2xs"
            />
          </form>
        ) : (
          <h2
            onClick={(e) => {
              e.stopPropagation();
              setEditName(project.name);
              setIsEditing(true);
            }}
            className="text-[13px] sm:text-[13.5px] font-semibold text-slate-900 dark:text-slate-100 truncate cursor-text hover:text-slate-950 dark:hover:text-white transition-colors"
            title="Chạm hoặc nhấp chuột vào chữ để đổi tên dự án (bấm ra ngoài để đóng/mở)"
          >
            {project.name}
          </h2>
        )}
        <span className="text-[11.5px] text-slate-400 dark:text-slate-500 shrink-0 font-normal whitespace-nowrap tabular-nums">
          · {countDone}/{totalTasks}
        </span>
      </div>

      <div
        className="flex items-center gap-0.5 sm:gap-1 shrink-0 flex-nowrap"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hairline Progress Bar */}
        <div className="w-12 sm:w-14 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden hidden sm:block shrink-0">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${pct}%`,
              backgroundColor: isAllDone ? '#34c759' : '#64748b',
            }}
          />
        </div>

        {/* Nút Sao chép toàn bộ checklist của dự án (Desktop) */}
        <button
          type="button"
          onClick={(e) => onCopyProjectAsMarkdown(project, e)}
          className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded transition-colors cursor-pointer shrink-0 hidden sm:flex"
          title="Sao chép toàn bộ checklist (Markdown/Notion)"
          aria-label="Sao chép toàn bộ checklist của dự án"
        >
          <Copy className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
        </button>

        {/* Nút Dán nhanh nhiều việc vào dự án */}
        <button
          type="button"
          onClick={() => onOpenBatchPaste(project)}
          className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded transition-colors cursor-pointer shrink-0"
          title="Dán nhanh nhiều việc cùng lúc"
          aria-label="Dán nhanh nhiều việc"
        >
          <ClipboardPaste className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
        </button>

        {/* Xóa dự án */}
        <button
          type="button"
          onClick={(e) => onDeleteProject(project.id, e)}
          className="p-1 text-slate-300 dark:text-slate-600 hover:text-rose-500 rounded transition-colors cursor-pointer shrink-0"
          title="Xóa dự án"
          aria-label="Xóa dự án"
        >
          <Trash2 className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
        </button>

        {/* Mở rộng / Thu gọn */}
        <button
          type="button"
          onClick={() => onToggleExpand(project.id)}
          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer shrink-0"
          title={project.isExpanded ? 'Thu gọn dự án' : 'Mở rộng dự án'}
          aria-label={project.isExpanded ? 'Thu gọn dự án' : 'Mở rộng dự án'}
        >
          <ChevronRight
            className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
              project.isExpanded ? 'rotate-90' : ''
            }`}
            strokeWidth={1.75}
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  );
}
