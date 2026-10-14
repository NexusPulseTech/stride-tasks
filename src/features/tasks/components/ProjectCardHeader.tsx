import React, { useState } from 'react';
import { ChevronRight, Trash2, Copy, ClipboardPaste, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { Project } from '../../../types';
import { useLanguage } from '../../../i18n';

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
  onMoveProject?: (projId: string, direction: 'up' | 'down') => void;
  isFirst?: boolean;
  isLast?: boolean;
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
  onMoveProject,
  isFirst = false,
  isLast = false,
}: ProjectCardHeaderProps) {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(project.name);

  return (
    <div
      onClick={() => onToggleExpand(project.id)}
      className="h-11 px-3 sm:px-3.5 cursor-pointer select-none flex items-center justify-between gap-2 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors flex-nowrap w-full overflow-hidden"
    >
      <div className="flex items-center gap-1.5 flex-1 min-w-0 flex-nowrap overflow-hidden">
        {/* GripVertical cho phép kéo thả sắp xếp danh mục */}
        <div
          data-project-drag-handle="true"
          className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 transition-colors select-none shrink-0"
          title={t.projectHeader.dragSort}
          aria-label={t.projectHeader.dragSort}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-3.5 h-3.5 shrink-0 pointer-events-none" strokeWidth={1.5} />
        </div>

        <div
          className="w-2.5 h-2.5 rounded-full shrink-0"
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
            className="flex-1 min-w-0 flex items-center"
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
              className="h-6 text-[13px] font-semibold text-slate-900 dark:text-slate-100 bg-white dark:bg-[#161b22] border border-slate-300 dark:border-slate-600 rounded px-1.5 py-0 outline-none w-full min-w-0"
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

        {/* Di chuyển danh mục lên/xuống (Hỗ trợ tốt nhất cho cả Desktop và Mobile) */}
        {onMoveProject && (
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              disabled={isFirst}
              onClick={(e) => {
                e.stopPropagation();
                onMoveProject(project.id, 'up');
              }}
              className="p-1 text-slate-300 dark:text-slate-600 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 disabled:pointer-events-none rounded transition-colors cursor-pointer shrink-0"
              title={t.projectHeader.moveUp}
              aria-label={t.projectHeader.moveUp}
            >
              <ArrowUp className="w-3 h-3 shrink-0" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              disabled={isLast}
              onClick={(e) => {
                e.stopPropagation();
                onMoveProject(project.id, 'down');
              }}
              className="p-1 text-slate-300 dark:text-slate-600 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 disabled:pointer-events-none rounded transition-colors cursor-pointer shrink-0"
              title={t.projectHeader.moveDown}
              aria-label={t.projectHeader.moveDown}
            >
              <ArrowDown className="w-3 h-3 shrink-0" strokeWidth={1.5} />
            </button>
          </div>
        )}

        {/* Nút Sao chép toàn bộ checklist của dự án (Desktop) */}
        <button
          type="button"
          onClick={(e) => onCopyProjectAsMarkdown(project, e)}
          className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded transition-colors cursor-pointer shrink-0 hidden sm:flex"
          title={t.projectHeader.copyChecklist}
          aria-label={t.projectHeader.copyChecklist}
        >
          <Copy className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
        </button>

        {/* Nút Dán nhanh nhiều việc vào dự án */}
        <button
          type="button"
          onClick={() => onOpenBatchPaste(project)}
          className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded transition-colors cursor-pointer shrink-0"
          title={t.projectHeader.batchPaste}
          aria-label={t.projectHeader.batchPaste}
        >
          <ClipboardPaste className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
        </button>

        {/* Xóa dự án */}
        <button
          type="button"
          onClick={(e) => onDeleteProject(project.id, e)}
          className="p-1 text-slate-300 dark:text-slate-600 hover:text-rose-500 rounded transition-colors cursor-pointer shrink-0"
          title={t.projectHeader.deleteProject}
          aria-label={t.projectHeader.deleteProject}
        >
          <Trash2 className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
        </button>

        {/* Mở rộng / Thu gọn */}
        <button
          type="button"
          onClick={() => onToggleExpand(project.id)}
          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer shrink-0"
          title={project.isExpanded ? t.projectHeader.collapseProject : t.projectHeader.expandProject}
          aria-label={project.isExpanded ? t.projectHeader.collapseProject : t.projectHeader.expandProject}
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

