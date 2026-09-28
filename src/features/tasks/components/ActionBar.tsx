import React from 'react';
import { Search, RotateCcw, X } from 'lucide-react';
import { FilterType } from '../../../types';

interface ActionBarProps {
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  totalDoing: number;
  search: string;
  onSearchChange: (search: string) => void;
  mobileSearchOpen: boolean;
  onOpenMobileSearch: () => void;
  onCloseMobileSearch: () => void;
  onResetSample: () => void;
  desktopSearchRef: React.RefObject<HTMLInputElement | null>;
  mobileSearchRef: React.RefObject<HTMLInputElement | null>;
}

export function ActionBar({
  filter,
  onFilterChange,
  totalDoing,
  search,
  onSearchChange,
  mobileSearchOpen,
  onOpenMobileSearch,
  onCloseMobileSearch,
  onResetSample,
  desktopSearchRef,
  mobileSearchRef,
}: ActionBarProps) {
  return (
    <div className="w-full">
      {mobileSearchOpen ? (
        <div className="h-9 flex items-center gap-1.5 bg-white dark:bg-[#161b22] border border-slate-200/90 dark:border-slate-800 rounded-xl px-2.5 shadow-2xs animate-in fade-in duration-100 w-full overflow-hidden">
          <Search className="w-3.5 h-3.5 shrink-0 text-slate-400" strokeWidth={1.75} aria-hidden="true" />
          <input
            ref={mobileSearchRef}
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm công việc..."
            className="flex-1 min-w-0 h-full bg-transparent text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
            autoFocus
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 text-xs shrink-0 cursor-pointer"
              title="Xóa chữ tìm kiếm"
              aria-label="Xóa chữ tìm kiếm"
            >
              <X className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={onCloseMobileSearch}
            className="text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium px-1.5 py-0.5 shrink-0 cursor-pointer whitespace-nowrap"
          >
            Hủy
          </button>
        </div>
      ) : (
        <div className="h-9 flex items-center justify-between gap-1.5 flex-nowrap w-full overflow-hidden">
          {/* 3 tabs bộ lọc trạng thái */}
          <div className="flex items-center gap-0.5 bg-slate-200/70 dark:bg-slate-800/80 p-0.5 rounded-lg text-[11px] sm:text-[11.5px] font-medium shrink-0 flex-nowrap">
            <button
              type="button"
              onClick={() => onFilterChange('all')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                filter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => onFilterChange('doing')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                filter === 'doing'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>Đang làm</span>
              {totalDoing > 0 && <span className="ml-1 font-bold tabular-nums">({totalDoing})</span>}
            </button>
            <button
              type="button"
              onClick={() => onFilterChange('completed')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                filter === 'completed'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Đã xong
            </button>
          </div>

          {/* Khu vực tìm kiếm */}
          <div className="flex items-center gap-1 shrink-0 flex-nowrap">
            {/* Nút kính lúp trên Mobile */}
            <button
              type="button"
              onClick={onOpenMobileSearch}
              className="sm:hidden h-8 w-8 rounded-lg bg-white dark:bg-[#161b22] border border-slate-200/90 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center cursor-pointer shrink-0 shadow-2xs"
              title="Tìm kiếm việc..."
              aria-label="Tìm kiếm việc"
            >
              <Search className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            </button>

            {/* Ô tìm kiếm cố định trên Desktop */}
            <div className="hidden sm:flex items-center gap-1 flex-nowrap">
              <div className="relative flex items-center">
                <input
                  ref={desktopSearchRef}
                  type="text"
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Tìm nhanh... (/)"
                  className="w-28 focus:w-36 h-8 px-2.5 bg-white dark:bg-[#161b22] border border-slate-200/90 dark:border-slate-800 rounded-lg text-[11.5px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all truncate shadow-2xs"
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    className="absolute right-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
                    title="Xóa tìm kiếm (Esc)"
                    aria-label="Xóa tìm kiếm"
                  >
                    <X className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                  </button>
                ) : (
                  <kbd className="absolute right-1.5 text-[9px] text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 rounded px-1 pointer-events-none hidden sm:inline font-mono">
                    /
                  </kbd>
                )}
              </div>

              <button
                type="button"
                onClick={onResetSample}
                className="h-8 px-2 text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#161b22] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                title="Khôi phục dữ liệu mẫu"
                aria-label="Khôi phục dữ liệu mẫu"
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
