import React, { useRef, useEffect } from 'react';
import { ClipboardPaste, CornerDownRight } from 'lucide-react';

interface SubTaskInlineFormProps {
  parentTitle: string;
  value: string;
  onChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onPaste?: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  onQuickPaste?: () => void;
}

export function SubTaskInlineForm({
  parentTitle,
  value,
  onChange,
  onSubmit,
  onCancel,
  onPaste,
  onQuickPaste,
}: SubTaskInlineFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <form
      onSubmit={onSubmit}
      className="ml-3 sm:ml-4 pl-2 border-l border-slate-400 dark:border-slate-600 flex items-center gap-1.5 py-0.5 animate-in fade-in duration-100"
    >
      <CornerDownRight className="w-3 h-3 shrink-0 text-slate-400 dark:text-slate-500" strokeWidth={1.5} aria-hidden="true" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={onPaste}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel();
        }}
        placeholder={`Thêm việc con cho "${parentTitle.slice(0, 20)}..." (Enter để lưu)`}
        className="flex-1 h-6.5 px-2 bg-white dark:bg-[#161b22] border border-slate-300 dark:border-slate-700 rounded-md text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-slate-900 dark:focus:border-slate-300 transition-all shadow-2xs"
      />
      <button
        type="submit"
        disabled={!value.trim()}
        className="h-6.5 px-2.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white disabled:opacity-40 text-white dark:text-slate-900 rounded-md text-[11px] font-medium cursor-pointer transition-colors shrink-0 shadow-2xs"
      >
        Lưu
      </button>
      {onQuickPaste && (
        <button
          type="button"
          onClick={onQuickPaste}
          className="h-6.5 px-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-[10.5px] cursor-pointer shrink-0 transition-colors flex items-center gap-1"
          title="Dán nhanh danh sách việc con từ Clipboard"
        >
          <ClipboardPaste className="w-3 h-3" />
          <span className="hidden sm:inline">Dán</span>
        </button>
      )}
      <button
        type="button"
        onClick={onCancel}
        className="h-6.5 px-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs cursor-pointer rounded-md shrink-0 transition-colors"
        title="Đóng (Esc)"
      >
        Hủy
      </button>
    </form>
  );
}
