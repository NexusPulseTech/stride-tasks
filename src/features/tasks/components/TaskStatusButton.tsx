import React from 'react';
import { Check, Circle, Clock3 } from 'lucide-react';

interface TaskStatusButtonProps {
  status: 'todo' | 'doing' | 'done';
  onChangeStatus: (nextStatus: 'todo' | 'doing' | 'done') => void;
}

export function TaskStatusButton({ status, onChangeStatus }: TaskStatusButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = status === 'todo' ? 'doing' : status === 'doing' ? 'done' : 'todo';
    onChangeStatus(next);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`shrink-0 whitespace-nowrap text-[10.5px] px-2 py-0.5 rounded-md border transition-all cursor-pointer select-none font-medium flex items-center gap-1 ${
        status === 'done'
          ? 'text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-[#161b22]/40 border-slate-200/60 dark:border-slate-800'
          : status === 'doing'
          ? 'text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 font-semibold shadow-2xs'
          : 'text-slate-500 dark:text-slate-400 bg-transparent border-slate-200 dark:border-slate-700/60 hover:bg-slate-100/60 dark:hover:bg-slate-800'
      }`}
      title="Chạm để đổi: Chờ ➔ Đang làm ➔ Xong"
      aria-label={`Trạng thái: ${status === 'done' ? 'Đã xong' : status === 'doing' ? 'Đang làm' : 'Chờ thực hiện'}`}
    >
      {status === 'done' ? (
        <>
          <Check className="w-2.5 h-2.5 shrink-0 stroke-[2.5] text-slate-400 dark:text-slate-500" aria-hidden="true" />
          <span>Xong</span>
        </>
      ) : status === 'doing' ? (
        <>
          <Clock3 className="w-2.5 h-2.5 shrink-0 text-slate-700 dark:text-slate-300 stroke-[2]" aria-hidden="true" />
          <span>Đang làm</span>
        </>
      ) : (
        <>
          <Circle className="w-2.5 h-2.5 shrink-0 text-slate-400 dark:text-slate-500 stroke-[2]" aria-hidden="true" />
          <span>Chờ</span>
        </>
      )}
    </button>
  );
}
