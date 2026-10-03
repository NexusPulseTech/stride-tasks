import React, { useRef, useState } from 'react';
import {
  ChevronDown,
  Check,
  Circle,
  Clock,
  AlertCircle,
  PauseCircle,
  CheckCircle2,
} from 'lucide-react';
import { StatusDefinition } from '../../../types';
import { StatusPickerPopover } from './StatusPickerPopover';

export interface TaskStatusButtonProps {
  status: string;
  statuses: StatusDefinition[];
  onChangeStatus: (nextStatus: string) => void;
  onAddCustomStatus: (label: string, category: 'todo' | 'doing' | 'done', color: string) => StatusDefinition | null;
  onDeleteCustomStatus: (statusId: string) => void;
  size?: 'sm' | 'md';
}

const FALLBACK_DEF: StatusDefinition = {
  id: 'todo',
  label: 'Chờ',
  category: 'todo',
  color: '#64748b',
};

export function TaskStatusButton({
  status,
  statuses = [],
  onChangeStatus,
  onAddCustomStatus,
  onDeleteCustomStatus,
  size = 'md',
}: TaskStatusButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const safeStatuses = statuses.length > 0 ? statuses : [FALLBACK_DEF];

  const currentDef =
    safeStatuses.find((s) => s.id === status) ||
    safeStatuses.find(
      (s) => s.category === (status === 'done' ? 'done' : status === 'doing' ? 'doing' : 'todo')
    ) ||
    safeStatuses[0] ||
    FALLBACK_DEF;

  const getStatusIcon = (def: StatusDefinition) => {
    if (def.category === 'done' || def.id === 'done') {
      return <Check className="w-2.5 h-2.5 shrink-0 stroke-[2.5]" style={{ color: def.color }} />;
    }
    if (def.id === 'blocked') {
      return <AlertCircle className="w-2.5 h-2.5 shrink-0 stroke-[2]" style={{ color: def.color }} />;
    }
    if (def.id === 'paused') {
      return <PauseCircle className="w-2.5 h-2.5 shrink-0 stroke-[2]" style={{ color: def.color }} />;
    }
    if (def.category === 'doing') {
      return <Clock className="w-2.5 h-2.5 shrink-0 stroke-[2]" style={{ color: def.color }} />;
    }
    return <Circle className="w-2.5 h-2.5 shrink-0 stroke-[2]" style={{ color: def.color }} />;
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`shrink-0 whitespace-nowrap rounded-md border transition-all cursor-pointer select-none font-medium flex items-center gap-1 shadow-2xs ${
          size === 'sm'
            ? 'text-[10px] px-1.5 py-0.2 h-[22px]'
            : 'text-[10.5px] px-2 py-0.5 h-[24px]'
        } ${
          currentDef.category === 'done'
            ? 'text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#161b22]/40 border-slate-200/80 dark:border-slate-800'
            : currentDef.category === 'doing'
            ? 'text-slate-900 dark:text-slate-100 bg-slate-100/90 dark:bg-slate-800 border-slate-300 dark:border-slate-600 font-semibold'
            : 'text-slate-600 dark:text-slate-300 bg-white dark:bg-[#161b22] border-slate-200 dark:border-slate-700/70 hover:bg-slate-50 dark:hover:bg-slate-800'
        }`}
        title={`Trạng thái: ${currentDef.label} (Bấm để đổi trạng thái hoặc thêm mới)`}
        aria-label={`Trạng thái: ${currentDef.label}`}
      >
        {getStatusIcon(currentDef)}
        <span className="truncate max-w-[85px]">{currentDef.label}</span>
        <ChevronDown className="w-2.5 h-2.5 text-slate-400 shrink-0 opacity-70" />
      </button>

      <StatusPickerPopover
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        currentStatusId={currentDef.id}
        statuses={safeStatuses}
        onSelectStatus={(newStatusId) => {
          onChangeStatus(newStatusId);
          setIsOpen(false);
        }}
        onAddCustomStatus={onAddCustomStatus}
        onDeleteCustomStatus={onDeleteCustomStatus}
        anchorRef={buttonRef}
      />
    </div>
  );
}
