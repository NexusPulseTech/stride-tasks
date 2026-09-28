import React from 'react';
import { Undo2, X } from 'lucide-react';
import { UndoAction } from '../../types';

interface UndoSnackbarProps {
  undoState: UndoAction | null;
  onDismiss: () => void;
}

export function UndoSnackbar({ undoState, onDismiss }: UndoSnackbarProps) {
  if (!undoState) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-5 left-3 right-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto sm:min-w-[320px] sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
      <div className="bg-[#1c1c1e] dark:bg-[#1a202c] text-white rounded-xl px-3 py-2 shadow-xl border border-white/15 dark:border-slate-700 flex items-center justify-between gap-2.5 backdrop-blur-md">
        <div className="flex items-center gap-2 min-w-0 flex-1 pl-0.5">
          <div className="w-5.5 h-5.5 rounded-md bg-white/10 text-slate-300 flex items-center justify-center shrink-0">
            <Undo2 className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
          </div>
          <span className="text-[12px] font-medium text-slate-100 truncate">
            {undoState.message}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={undoState.undo}
            className="h-7 px-2.5 bg-white hover:bg-slate-100 active:scale-95 text-slate-950 font-medium text-[11.5px] rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
            title="Hoàn tác thao tác vừa rồi (Ctrl+Z)"
            aria-label="Hoàn tác thao tác vừa rồi"
          >
            <Undo2 className="w-3.5 h-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
            <span>Hoàn tác</span>
            <span className="hidden sm:inline text-[9.5px] text-slate-500 font-normal ml-0.5">(Ctrl+Z)</span>
          </button>

          <button
            type="button"
            onClick={onDismiss}
            className="w-6 h-6 rounded-md hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            title="Đóng (Esc)"
            aria-label="Đóng thông báo"
          >
            <X className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
