import React from 'react';
import { createPortal } from 'react-dom';
import { ClipboardPaste, Plus, ListFilter, X } from 'lucide-react';
import { BatchPasteTarget, Project, SubTask } from '../../../types';
import { parsePastedTasks, parsePastedSubtasks } from '../../tasks';

interface BatchPasteModalProps {
  batchPasteProject?: Project | null;
  batchPasteTarget?: BatchPasteTarget | null;
  batchPasteText: string;
  onTextChange: (text: string) => void;
  onClose: () => void;
  onExecute: () => void;
}

export function BatchPasteModal({
  batchPasteProject,
  batchPasteTarget,
  batchPasteText,
  onTextChange,
  onClose,
  onExecute,
}: BatchPasteModalProps) {
  const target = batchPasteTarget || (batchPasteProject ? {
    type: 'project' as const,
    projectId: batchPasteProject.id,
    projectName: batchPasteProject.name,
  } : null);
  if (!target) return null;

  const parsedTree = parsePastedSubtasks(batchPasteText);
  const targetLabel = target.type === 'project'
    ? `Dán nhiều việc vào "${target.projectName}"`
    : target.type === 'task'
    ? `Dán việc con vào "${target.taskTitle || 'công việc'}"`
    : `Dán việc con vào "${target.subTitle || 'mục con'}"`;

  const renderTree = (nodes: SubTask[], depth = 0): React.ReactNode => nodes.map((node) => (
    <div key={node.id} className={depth > 0 ? 'ml-3 pl-2 border-l border-slate-200 dark:border-slate-700' : ''}>
      <div className={`text-xs py-0.5 ${node.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
        {node.completed ? '[x]' : '[ ]'} {node.title}
      </div>
      {node.subtasks?.length ? renderTree(node.subtasks, depth + 1) : null}
    </div>
  ));

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[99999] bg-slate-950/40 dark:bg-black/70 backdrop-blur-[3px] flex items-center justify-center p-3.5 sm:p-4 animate-in fade-in duration-100"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#161b22] rounded-2xl max-w-[460px] w-[calc(100vw-32px)] shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden max-h-[85vh] flex flex-col animate-in zoom-in-[0.98] duration-100"
      >
        {/* Header */}
        <div className="px-4.5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0">
              <ClipboardPaste className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[13px] sm:text-[13.5px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                {targetLabel}
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-normal truncate mt-0.5">
                Thụt lề để tạo cây việc con · [x] đánh dấu hoàn thành
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Đóng (Esc)"
            aria-label="Đóng"
          >
            <X className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-2.5 overflow-y-auto overflow-x-hidden text-xs">
          <div className="relative">
            <textarea
              value={batchPasteText}
              onChange={(e) => onTextChange(e.target.value)}
              placeholder={`Ví dụ:\nLên kế hoạch phát hành\n  - [x] Chốt nội dung\n  - Chuẩn bị assets\n    - [x] Thiết kế icon\n    - Kiểm tra ảnh chụp\nXuất bản bản cập nhật`}
              rows={8}
              className="w-full p-3 bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-slate-400 dark:focus:border-slate-600 focus:bg-white dark:focus:bg-[#161b22] font-mono leading-relaxed transition-all resize-none"
              autoFocus
            />
            {batchPasteText.trim() && (
              <span className="absolute bottom-2.5 right-2.5 text-[10px] bg-white/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 shadow-2xs font-sans font-medium tabular-nums">
                Nhận diện {parsedTree.length} mục gốc
              </span>
            )}
          </div>
          {batchPasteText.trim() && parsedTree.length > 0 && (
            <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 p-2">
              {renderTree(parsedTree)}
            </div>
          )}
          <div className="text-[11px] text-slate-400 dark:text-slate-500 leading-normal flex items-center gap-1.5">
            <ListFilter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            <span>Hỗ trợ bullet, số thứ tự, thụt lề nhiều cấp, checklist [x] và giữ nguyên URL.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4.5 py-2.5 sm:py-3 bg-slate-50/70 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-7.5 px-3 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={!batchPasteText.trim()}
            onClick={onExecute}
            className="h-7.5 px-3.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white disabled:opacity-40 text-white dark:text-slate-950 rounded-lg text-xs font-medium cursor-pointer shadow-xs active:scale-[0.98] transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
            <span>
              {batchPasteText.trim()
                ? `Thêm ${parsePastedTasks(batchPasteText).length} việc`
                : 'Thêm tất cả'}
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
