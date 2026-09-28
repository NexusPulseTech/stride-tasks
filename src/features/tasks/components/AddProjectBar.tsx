import React from 'react';
import { Plus } from 'lucide-react';

interface AddProjectBarProps {
  projectName: string;
  onChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AddProjectBar({
  projectName,
  onChange,
  onSubmit,
}: AddProjectBarProps) {
  return (
    <form onSubmit={onSubmit} className="flex gap-1.5 flex-nowrap w-full">
      <input
        type="text"
        value={projectName}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Thêm dự án mới... (Nhấn Enter)"
        className="flex-1 min-w-0 h-8.5 px-3 bg-white dark:bg-[#161b22] border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-slate-800 dark:focus:border-slate-500 rounded-lg text-[12.5px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-colors shadow-2xs"
      />
      <button
        type="submit"
        className="h-8.5 px-3 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white active:scale-[0.98] text-white dark:text-slate-950 text-[12px] font-medium rounded-lg transition-all shrink-0 shadow-xs cursor-pointer whitespace-nowrap flex items-center gap-1.5"
      >
        <Plus className="w-3.5 h-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
        <span>Thêm</span>
      </button>
    </form>
  );
}
