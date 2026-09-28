import React from 'react';
import { Plus } from 'lucide-react';

interface MobileFabProps {
  onClick: () => void;
}

export function MobileFab({ onClick }: MobileFabProps) {
  return (
    <aside
      aria-label="Thao tác nhanh trên di động"
      className="fixed bottom-5 right-4 z-40 sm:hidden"
    >
      <button
        type="button"
        onClick={onClick}
        className="h-9.5 px-3.5 bg-slate-950/95 dark:bg-white hover:bg-black dark:hover:bg-slate-100 text-white dark:text-slate-950 rounded-full shadow-lg shadow-slate-900/25 dark:shadow-black/50 active:scale-95 transition-all text-xs font-semibold cursor-pointer border border-white/15 dark:border-slate-300 backdrop-blur-sm select-none flex items-center gap-1.5"
        aria-label="Thêm việc nhanh"
      >
        <Plus className="w-3.5 h-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
        <span>Thêm việc</span>
      </button>
    </aside>
  );
}
