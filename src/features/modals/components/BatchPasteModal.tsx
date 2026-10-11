import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ClipboardPaste,
  Plus,
  ListFilter,
  X,
  ClipboardCopy,
  Eye,
  Edit3,
  CheckCircle2,
  Circle,
  CornerDownRight,
} from 'lucide-react';
import { Project, BatchPasteTarget, SubTask } from '../../../types';
import { parsePastedTasks, parsePastedHierarchy, parsePastedSubtasks } from '../../tasks';

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
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  const target: BatchPasteTarget | null =
    batchPasteTarget ||
    (batchPasteProject
      ? {
          type: 'project',
          projectId: batchPasteProject.id,
          projectName: batchPasteProject.name,
        }
      : null);

  if (!target) return null;

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          onTextChange(text);
        }
      }
    } catch (e) {
      // Trình duyệt chặn quyền đọc clipboard thì user tự ấn Ctrl+V
    }
  };

  const detectedCount = parsePastedTasks(batchPasteText).length;
  const hierarchyTasks = parsePastedHierarchy(batchPasteText);
  const subtaskTree = parsePastedSubtasks(batchPasteText);

  const modalTitle =
    target.type === 'subtask'
      ? `Dán nhiều việc con cho "${target.subTitle || 'mục con'}"`
      : target.type === 'task'
      ? `Dán nhiều việc con vào "${target.taskTitle || 'công việc'}"`
      : `Dán nhiều việc vào "${target.projectName}"`;

  const modalSubtitle =
    target.type === 'project'
      ? 'Mỗi dòng một việc · Hỗ trợ thụt lề để tự tạo việc con'
      : 'Mỗi dòng một việc con · Tự động làm sạch bullet và số thứ tự';

  const renderSubtaskPreview = (subs: SubTask[], level = 0) => {
    return (
      <div className={`space-y-1 ${level > 0 ? 'ml-3 pl-2 border-l border-slate-200 dark:border-slate-700' : ''}`}>
        {subs.map((sub, i) => (
          <div key={sub.id || i} className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
              {sub.completed ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              )}
              <span className={`truncate ${sub.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                {sub.title}
              </span>
            </div>
            {sub.subtasks && sub.subtasks.length > 0 && renderSubtaskPreview(sub.subtasks, level + 1)}
          </div>
        ))}
      </div>
    );
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[99999] bg-slate-950/40 dark:bg-black/70 backdrop-blur-[3px] flex items-center justify-center p-3.5 sm:p-4 animate-in fade-in duration-100"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#161b22] rounded-2xl max-w-[480px] w-[calc(100vw-32px)] shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden max-h-[88vh] flex flex-col animate-in zoom-in-[0.98] duration-100"
      >
        {/* Header */}
        <div className="px-4.5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0">
              <ClipboardPaste className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[13px] sm:text-[13.5px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                {modalTitle}
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-normal truncate mt-0.5">
                {modalSubtitle}
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

        {/* Tab Switcher: Nhập văn bản vs Xem trước cấu trúc */}
        <div className="px-4.5 pt-2.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 shrink-0">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px] font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'edit'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-semibold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>Nhập văn bản</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-semibold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Xem trước cây việc</span>
              {detectedCount > 0 && (
                <span className="text-[10px] font-mono px-1 rounded bg-slate-200/80 dark:bg-slate-600">
                  {detectedCount}
                </span>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={handlePasteFromClipboard}
            className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
            title="Tự động lấy văn bản từ bộ nhớ tạm"
          >
            <ClipboardCopy className="w-3 h-3" />
            <span>Dán từ Clipboard</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-2.5 overflow-y-auto overflow-x-hidden text-xs flex-1">
          {activeTab === 'edit' ? (
            <div className="space-y-2">
              <div className="relative">
                <textarea
                  value={batchPasteText}
                  onChange={(e) => onTextChange(e.target.value)}
                  placeholder={`Ví dụ:\n1. Phân tích yêu cầu bài toán\n- Thiết kế kiến trúc giải pháp\n  - Vẽ sơ đồ database\n  - Thiết kế REST API\n* Triển khai code và kiểm thử unit\nhttps://linear.app/tasks/123`}
                  rows={8}
                  className="w-full p-3 bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-slate-400 dark:focus:border-slate-600 focus:bg-white dark:focus:bg-[#161b22] font-mono leading-relaxed transition-all resize-none"
                  autoFocus
                />
                {batchPasteText.trim() && (
                  <span className="absolute bottom-2.5 right-2.5 text-[10px] bg-white/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 shadow-2xs font-sans font-medium tabular-nums">
                    Nhận diện {detectedCount} việc
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 dark:text-slate-500 leading-normal flex items-center gap-1.5">
                <ListFilter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                <span>Tự động làm sạch các tiền tố (1., -, •, [ ]) và giữ nguyên link web. Thụt lề để tự tạo việc con lồng nhau.</span>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {!batchPasteText.trim() ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500 italic">
                  Chưa có nội dung. Chuyển sang tab "Nhập văn bản" hoặc bấm "Dán từ Clipboard".
                </div>
              ) : target.type === 'project' ? (
                <div className="space-y-2 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 bg-slate-50/60 dark:bg-slate-900/40">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Dự án: {target.projectName} ({hierarchyTasks.length} việc chính)
                  </div>
                  <div className="space-y-2 pt-1">
                    {hierarchyTasks.map((t, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-800 dark:text-slate-200 font-medium">
                          {t.completed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <span>{t.title}</span>
                        </div>
                        {t.subtasks && t.subtasks.length > 0 && (
                          <div className="ml-4 pl-2 border-l border-slate-200 dark:border-slate-700 space-y-0.5">
                            {t.subtasks.map((subTitle, subIdx) => (
                              <div key={subIdx} className="flex items-center gap-1.5 text-[11.5px] text-slate-600 dark:text-slate-400">
                                <CornerDownRight className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{subTitle}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 bg-slate-50/60 dark:bg-slate-900/40">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Mục tiêu: {target.subTitle || target.taskTitle} ({subtaskTree.length} việc con)
                  </div>
                  <div className="pt-1">
                    {renderSubtaskPreview(subtaskTree)}
                  </div>
                </div>
              )}
            </div>
          )}
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
                ? `Thêm ${detectedCount} việc`
                : 'Thêm tất cả'}
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
