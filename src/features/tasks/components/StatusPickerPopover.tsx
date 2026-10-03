import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  Plus,
  Trash2,
  X,
  Circle,
  Clock,
  AlertCircle,
  CheckCircle2,
  PauseCircle,
} from 'lucide-react';
import { StatusDefinition } from '../../../types';

export interface StatusPickerPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  currentStatusId: string;
  statuses: StatusDefinition[];
  onSelectStatus: (statusId: string) => void;
  onAddCustomStatus: (label: string, category: 'todo' | 'doing' | 'done', color: string) => StatusDefinition | null;
  onDeleteCustomStatus: (statusId: string) => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

const PRESET_COLORS = [
  '#64748b', // Slate
  '#2563eb', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#d97706', // Amber
  '#ea580c', // Orange
  '#dc2626', // Red
  '#16a34a', // Emerald
  '#0d9488', // Teal
  '#ec4899', // Pink
];

interface PopoverCoords {
  top?: number;
  bottom?: number;
  right: number;
  width: number;
  isFlipped: boolean;
}

export function StatusPickerPopover({
  isOpen,
  onClose,
  currentStatusId,
  statuses = [],
  onSelectStatus,
  onAddCustomStatus,
  onDeleteCustomStatus,
  anchorRef,
}: StatusPickerPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newCategory, setNewCategory] = useState<'todo' | 'doing' | 'done'>('doing');
  const [newColor, setNewColor] = useState(PRESET_COLORS[1]);
  const [coords, setCoords] = useState<PopoverCoords>({
    top: 0,
    right: 8,
    width: 264,
    isFlipped: false,
  });

  const updateCoordinates = useCallback(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const margin = 6;
    const popoverWidth = Math.min(270, window.innerWidth - 16);
    const estimatedHeight = isCreating ? 340 : 280;

    // Viewport overflow check: Flip upwards if close to bottom of screen
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const shouldFlip = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;

    // Horizontal placement: Align to right edge of button
    let right = window.innerWidth - rect.right;
    if (right < 8) right = 8;
    // Don't let left edge go off-screen
    if (window.innerWidth - right < popoverWidth + 8) {
      right = Math.max(8, window.innerWidth - popoverWidth - 8);
    }

    if (shouldFlip) {
      setCoords({
        bottom: window.innerHeight - rect.top + margin,
        right,
        width: popoverWidth,
        isFlipped: true,
      });
    } else {
      setCoords({
        top: rect.bottom + margin,
        right,
        width: popoverWidth,
        isFlipped: false,
      });
    }
  }, [anchorRef, isCreating]);

  useEffect(() => {
    if (!isOpen) {
      setIsCreating(false);
      setNewLabel('');
      return;
    }

    updateCoordinates();

    function handleClickOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        anchorRef.current &&
        !anchorRef.current.contains(target)
      ) {
        onClose();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    const handleScrollOrResize = () => {
      updateCoordinates();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, onClose, anchorRef, updateCoordinates]);

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    const created = onAddCustomStatus(newLabel.trim(), newCategory, newColor);
    if (created) {
      onSelectStatus(created.id);
      setIsCreating(false);
      setNewLabel('');
      onClose();
    }
  };

  const getStatusIcon = (status: StatusDefinition) => {
    if (status.category === 'done' || status.id === 'done') {
      return <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: status.color }} />;
    }
    if (status.id === 'blocked') {
      return <AlertCircle className="w-3.5 h-3.5 shrink-0" style={{ color: status.color }} />;
    }
    if (status.id === 'paused') {
      return <PauseCircle className="w-3.5 h-3.5 shrink-0" style={{ color: status.color }} />;
    }
    if (status.category === 'doing') {
      return <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: status.color }} />;
    }
    return <Circle className="w-3.5 h-3.5 shrink-0" style={{ color: status.color }} />;
  };

  const popoverContent = (
    <div
      ref={popoverRef}
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        ...(coords.isFlipped ? { bottom: `${coords.bottom}px` } : { top: `${coords.top}px` }),
        right: `${coords.right}px`,
        width: `${coords.width}px`,
        maxHeight: 'calc(100vh - 24px)',
      }}
      className="bg-white dark:bg-[#161b22] rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden z-[99999] animate-in fade-in zoom-in-95 duration-100 text-xs text-slate-800 dark:text-slate-100 flex flex-col"
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50 shrink-0">
        <span className="font-semibold text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Chọn trạng thái
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
          title="Đóng (Esc)"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Danh sách các trạng thái */}
      <div className="p-1.5 space-y-0.5 max-h-56 overflow-y-auto overflow-x-hidden">
        {statuses.map((s) => {
          const isSelected = s.id === currentStatusId;
          return (
            <div
              key={s.id}
              onClick={() => {
                onSelectStatus(s.id);
                onClose();
              }}
              className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-slate-100 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {getStatusIcon(s)}
                <span className="truncate">{s.label}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-slate-900 dark:text-slate-100 stroke-[2.5]" />
                )}
                {s.isCustom && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteCustomStatus(s.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-600 rounded transition-opacity"
                    title="Xóa trạng thái này"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer: Thêm trạng thái tùy chỉnh */}
      <div className="p-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 shrink-0">
        {!isCreating ? (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="w-full py-1 px-2 flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-lg hover:border-slate-300 transition-colors cursor-pointer shadow-2xs"
          >
            <Plus className="w-3 h-3" strokeWidth={2} />
            <span>Thêm trạng thái mới...</span>
          </button>
        ) : (
          <form onSubmit={handleCreateSubmit} className="space-y-2 animate-in fade-in duration-100">
            <div>
              <input
                type="text"
                placeholder="Tên trạng thái (VD: Đang test)..."
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                autoFocus
                className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:border-slate-800 dark:focus:border-slate-200 shadow-2xs"
              />
            </div>

            {/* Phân loại category */}
            <div className="grid grid-cols-3 gap-1 text-[10px] font-medium">
              <button
                type="button"
                onClick={() => setNewCategory('todo')}
                className={`py-0.5 rounded border text-center transition-colors cursor-pointer ${
                  newCategory === 'todo'
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950 font-semibold shadow-2xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                Chờ
              </button>
              <button
                type="button"
                onClick={() => setNewCategory('doing')}
                className={`py-0.5 rounded border text-center transition-colors cursor-pointer ${
                  newCategory === 'doing'
                    ? 'bg-blue-600 text-white border-blue-600 font-semibold shadow-2xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                Đang làm
              </button>
              <button
                type="button"
                onClick={() => setNewCategory('done')}
                className={`py-0.5 rounded border text-center transition-colors cursor-pointer ${
                  newCategory === 'done'
                    ? 'bg-emerald-600 text-white border-emerald-600 font-semibold shadow-2xs'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                Đã xong
              </button>
            </div>

            {/* Màu sắc */}
            <div className="flex items-center gap-1.5 justify-center py-0.5 flex-wrap">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewColor(color)}
                  className={`w-4 h-4 rounded-full transition-transform cursor-pointer ${
                    newColor === color
                      ? 'scale-125 ring-2 ring-offset-1 ring-slate-800 dark:ring-white'
                      : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <div className="flex items-center gap-1 pt-1">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="flex-1 py-1 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={!newLabel.trim()}
                className="flex-1 py-1 text-[11px] rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 font-medium hover:bg-slate-800 disabled:opacity-40 cursor-pointer shadow-2xs"
              >
                Lưu
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return createPortal(popoverContent, document.body);
}
