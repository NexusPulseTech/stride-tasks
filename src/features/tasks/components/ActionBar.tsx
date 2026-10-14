import React, { useRef, useState, useCallback } from 'react';
import { Search, RotateCcw, X, Eye, EyeOff, Target } from 'lucide-react';
import { FilterType } from '../../../types';
import { useLanguage } from '../../../i18n';
import { triggerHaptic } from '../../../utils';

interface ActionBarProps {
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  totalDoing: number;
  totalScheduled?: number;
  search: string;
  onSearchChange: (search: string) => void;
  mobileSearchOpen: boolean;
  onOpenMobileSearch: () => void;
  onCloseMobileSearch: () => void;
  onResetSample: () => void;
  desktopSearchRef: React.RefObject<HTMLInputElement | null>;
  mobileSearchRef: React.RefObject<HTMLInputElement | null>;
  showFilterTabs?: boolean;
  hideCompletedInAllView?: boolean;
  onToggleHideCompletedInAll?: () => void;
  hiddenDoneCount?: number;
  dailyFocusCount?: number;
  onOpenDailyFocus?: () => void;
}

export function ActionBar({
  filter,
  onFilterChange,
  totalDoing,
  totalScheduled = 0,
  search,
  onSearchChange,
  mobileSearchOpen,
  onOpenMobileSearch,
  onCloseMobileSearch,
  onResetSample,
  desktopSearchRef,
  mobileSearchRef,
  showFilterTabs = true,
  hideCompletedInAllView = false,
  onToggleHideCompletedInAll,
  hiddenDoneCount = 0,
  dailyFocusCount = 0,
  onOpenDailyFocus,
}: ActionBarProps) {
  const { t } = useLanguage();
  const longPressTimerRef = useRef<number | null>(null);
  const isLongPressRef = useRef(false);
  const [holdingProgress, setHoldingProgress] = useState(false);

  const handleAllPointerDown = useCallback(() => {
    isLongPressRef.current = false;
    setHoldingProgress(true);
    longPressTimerRef.current = window.setTimeout(() => {
      isLongPressRef.current = true;
      triggerHaptic();
      onToggleHideCompletedInAll?.();
      setHoldingProgress(false);
    }, 1200); // Giữ 1.2s để toggle nhanh
  }, [onToggleHideCompletedInAll]);

  const handleAllPointerUp = useCallback(() => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setHoldingProgress(false);
    if (!isLongPressRef.current) {
      onFilterChange('all');
    }
    isLongPressRef.current = false;
  }, [onFilterChange]);

  const handleAllPointerCancel = useCallback(() => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    setHoldingProgress(false);
    isLongPressRef.current = false;
  }, []);

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
            placeholder={t.actionBar.searchPlaceholder}
            className="flex-1 min-w-0 h-full bg-transparent text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
            autoFocus
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 text-xs shrink-0 cursor-pointer"
              title={t.actionBar.clearSearch}
              aria-label={t.actionBar.clearSearch}
            >
              <X className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            onClick={onCloseMobileSearch}
            className="text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium px-1.5 py-0.5 shrink-0 cursor-pointer whitespace-nowrap"
          >
            {t.actionBar.cancelSearch}
          </button>
        </div>
      ) : (
        <div className="h-9 flex items-center justify-between gap-1.5 flex-nowrap w-full overflow-hidden">
          {/* 3 tabs bộ lọc trạng thái (ẩn được theo View Preferences) */}
          {showFilterTabs ? (
            <div className="flex items-center gap-1.5 shrink-0 flex-nowrap">
              <div className="flex items-center gap-0.5 bg-slate-200/70 dark:bg-slate-800/80 p-0.5 rounded-lg text-[11px] sm:text-[11.5px] font-medium shrink-0 flex-nowrap">
                <button
                  type="button"
                  onPointerDown={handleAllPointerDown}
                  onPointerUp={handleAllPointerUp}
                  onPointerLeave={handleAllPointerCancel}
                  onPointerCancel={handleAllPointerCancel}
                  title={`${t.actionBar.allFilter} (${hideCompletedInAllView ? t.actionBar.allActiveOnly : t.actionBar.allWithCompleted}) • ${t.actionBar.longPressHint}`}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 relative select-none ${
                    filter === 'all'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  } ${holdingProgress ? 'ring-2 ring-amber-400/50' : ''}`}
                >
                  <span>{t.actionBar.allFilter}</span>
                  {filter === 'all' && hideCompletedInAllView && (
                    <span
                      className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-500 pointer-events-none"
                      title={t.actionBar.hideCompleted}
                    />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onFilterChange('doing')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    filter === 'doing'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <span>{t.actionBar.doingFilter}</span>
                  {totalDoing > 0 && <span className="ml-1 font-bold font-mono tabular-nums">({totalDoing})</span>}
                </button>
                <button
                  type="button"
                  onClick={() => onFilterChange('scheduled')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    filter === 'scheduled'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <span>{t.actionBar.scheduledFilter}</span>
                  {totalScheduled > 0 && <span className="ml-1 font-bold font-mono tabular-nums">({totalScheduled})</span>}
                </button>
                <button
                  type="button"
                  onClick={() => onFilterChange('completed')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    filter === 'completed'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {t.actionBar.completedFilter}
                </button>
              </div>

              {/* Nút bật/tắt nhanh ẩn việc đã xong: Cố định kích thước 32x32px & vị trí, triệt tiêu hiện tượng nhảy layout */}
              {onToggleHideCompletedInAll && (
                <button
                  type="button"
                  onClick={() => {
                    if (filter !== 'all') {
                      onFilterChange('all');
                    }
                    onToggleHideCompletedInAll();
                  }}
                  className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer shrink-0 border ${
                    filter === 'all'
                      ? hideCompletedInAllView
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 border-amber-300/60 dark:border-amber-700/60 shadow-2xs'
                        : 'bg-slate-200/60 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-300/70 dark:hover:bg-slate-700 border-transparent'
                      : 'opacity-40 hover:opacity-80 text-slate-400 dark:text-slate-500 border-transparent hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                  }`}
                  title={
                    filter === 'all'
                      ? hideCompletedInAllView
                        ? `${t.actionBar.hideCompleted} (${hiddenDoneCount} việc đã ẩn) • Bấm để hiện lại`
                        : `${t.actionBar.showCompleted} • Bấm để ẩn việc đã hoàn thành`
                      : `${t.actionBar.hideCompleted} (Áp dụng cho tab Tất cả) • Bấm để chuyển sang Tất cả`
                  }
                  aria-label={hideCompletedInAllView ? t.actionBar.showCompleted : t.actionBar.hideCompleted}
                >
                  {hideCompletedInAllView ? (
                    <EyeOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  ) : (
                    <Eye className="w-3.5 h-3.5 shrink-0" />
                  )}

                  {/* Huy hiệu số việc đã ẩn: Absolute không gây co giãn layout (CLS = 0) */}
                  {filter === 'all' && hideCompletedInAllView && hiddenDoneCount > 0 && (
                    <span
                      className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-white font-mono text-[9px] font-bold flex items-center justify-center shadow-xs pointer-events-none"
                      aria-hidden="true"
                    >
                      {hiddenDoneCount > 99 ? '99+' : hiddenDoneCount}
                    </span>
                  )}
                </button>
              )}
            </div>
          ) : (
            <div />
          )}

          {/* Khu vực tìm kiếm & Tiêu điểm */}
          <div className="flex items-center gap-1 shrink-0 flex-nowrap">
            {/* Nút Tiêu điểm giải quyết quá tải việc */}
            {onOpenDailyFocus && (
              <button
                type="button"
                onClick={onOpenDailyFocus}
                className={`h-8 px-2 sm:px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs shrink-0 ${
                  dailyFocusCount > 0
                    ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-300/80 dark:border-amber-800/80'
                    : 'bg-white dark:bg-[#161b22] border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
                title={t.dailyFocus.buttonTooltip}
                aria-label={t.dailyFocus.buttonTooltip}
              >
                <Target className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="hidden md:inline font-semibold text-[11.5px]">
                  {t.dailyFocus.modalTitle.split('&')[0].trim()}
                </span>
                {dailyFocusCount > 0 && (
                  <span className="font-mono tabular-nums font-bold text-[10px] px-1 py-0.2 bg-amber-500/20 dark:bg-amber-500/30 text-amber-800 dark:text-amber-200 rounded-full">
                    {dailyFocusCount}
                  </span>
                )}
              </button>
            )}

            {/* Nút kính lúp trên Mobile */}
            <button
              type="button"
              onClick={onOpenMobileSearch}
              className="sm:hidden h-8 w-8 rounded-lg bg-white dark:bg-[#161b22] border border-slate-200/90 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center cursor-pointer shrink-0 shadow-2xs"
              title={t.actionBar.searchPlaceholder}
              aria-label={t.actionBar.searchPlaceholder}
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
                  placeholder={t.actionBar.searchPlaceholder}
                  className="w-44 focus:w-56 h-8 pl-3 pr-8 bg-white dark:bg-[#161b22] border border-slate-200/90 dark:border-slate-800 rounded-lg text-[11.5px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all truncate shadow-2xs"
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => onSearchChange('')}
                    className="absolute right-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
                    title={t.actionBar.clearSearch}
                    aria-label={t.actionBar.clearSearch}
                  >
                    <X className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
                  </button>
                ) : (
                  <kbd className="absolute right-1.5 text-[9px] text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 rounded px-1 pointer-events-none hidden sm:inline font-mono">
                    /
                  </kbd>
                )}
              </div>
            </div>

            {/* Nút khôi phục mẫu */}
            <button
              type="button"
              onClick={onResetSample}
              className="h-8 px-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer shrink-0 hidden sm:flex items-center justify-center text-xs"
              title={t.actionBar.resetSample}
              aria-label={t.actionBar.resetSample}
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
