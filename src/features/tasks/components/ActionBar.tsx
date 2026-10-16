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

  const formatCount = (n: number) => (n > 99 ? '99+' : String(n));

  return (
    <div className="w-full overflow-hidden">
      {mobileSearchOpen ? (
        <div className="h-8.5 flex items-center gap-1.5 bg-white dark:bg-[#161b22] border border-slate-200/90 dark:border-slate-800 rounded-lg px-2.5 shadow-2xs w-full overflow-hidden">
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
        <div className="h-8.5 flex items-center justify-between gap-1 sm:gap-1.5 flex-nowrap w-full overflow-hidden">
          {/* Khu vực 4 tabs lọc + nút ẩn việc xong: Cố định bằng Grid tỷ lệ chuẩn, không bao giờ tràn hay đẩy mất nút cuối */}
          {showFilterTabs ? (
            <div className="flex items-center gap-1 sm:gap-1.5 flex-1 min-w-0 sm:flex-none flex-nowrap">
              <div className="flex-1 min-w-0 sm:flex-none sm:w-[312px] h-8 grid grid-cols-[0.82fr_1.18fr_1.18fr_0.82fr] items-center gap-0.5 bg-slate-200/75 dark:bg-slate-800/85 p-0.5 rounded-lg text-[10.5px] sm:text-[11.5px] font-medium overflow-hidden">
                <button
                  type="button"
                  onPointerDown={handleAllPointerDown}
                  onPointerUp={handleAllPointerUp}
                  onPointerLeave={handleAllPointerCancel}
                  onPointerCancel={handleAllPointerCancel}
                  title={`${t.actionBar.allFilter} (${hideCompletedInAllView ? t.actionBar.allActiveOnly : t.actionBar.allWithCompleted}) • ${t.actionBar.longPressHint}`}
                  className={`h-7 px-1 rounded-md transition-colors cursor-pointer whitespace-nowrap min-w-0 overflow-hidden flex items-center justify-center relative select-none ${
                    filter === 'all'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  } ${holdingProgress ? 'ring-2 ring-amber-400/50' : ''}`}
                >
                  <span className="truncate">{t.actionBar.allFilter}</span>
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
                  className={`h-7 px-1 rounded-md transition-colors cursor-pointer whitespace-nowrap min-w-0 overflow-hidden flex items-center justify-center gap-0.5 select-none ${
                    filter === 'doing'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <span className="truncate">{t.actionBar.doingFilter}</span>
                  {totalDoing > 0 && (
                    <span className="font-bold font-mono tabular-nums text-[9.5px] sm:text-[10px] opacity-80 shrink-0">
                      {formatCount(totalDoing)}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onFilterChange('scheduled')}
                  className={`h-7 px-1 rounded-md transition-colors cursor-pointer whitespace-nowrap min-w-0 overflow-hidden flex items-center justify-center gap-0.5 select-none ${
                    filter === 'scheduled'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <span className="truncate">{t.actionBar.scheduledFilter}</span>
                  {totalScheduled > 0 && (
                    <span className="font-bold font-mono tabular-nums text-[9.5px] sm:text-[10px] opacity-80 shrink-0">
                      {formatCount(totalScheduled)}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onFilterChange('completed')}
                  className={`h-7 px-1 rounded-md transition-colors cursor-pointer whitespace-nowrap min-w-0 overflow-hidden flex items-center justify-center select-none ${
                    filter === 'completed'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <span className="truncate">{t.actionBar.completedFilter}</span>
                </button>
              </div>

              {/* Nút bật/tắt nhanh ẩn việc đã xong: Cố định 32x32px */}
              {onToggleHideCompletedInAll && (
                <button
                  type="button"
                  onClick={() => {
                    if (filter !== 'all') {
                      onFilterChange('all');
                    }
                    onToggleHideCompletedInAll();
                  }}
                  className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer shrink-0 border ${
                    filter === 'all'
                      ? hideCompletedInAllView
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 border-amber-300/60 dark:border-amber-700/60 shadow-2xs'
                        : 'bg-slate-200/60 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-300/70 dark:hover:bg-slate-700 border-transparent'
                      : 'opacity-40 hover:opacity-80 text-slate-400 dark:text-slate-500 border-transparent hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                  }`}
                  title={
                    filter === 'all'
                      ? hideCompletedInAllView
                        ? `${t.actionBar.hideCompleted} (${hiddenDoneCount}) • Bấm để hiện lại`
                        : `${t.actionBar.showCompleted} • Bấm để ẩn việc đã hoàn thành`
                      : `${t.actionBar.hideCompleted}`
                  }
                  aria-label={hideCompletedInAllView ? t.actionBar.showCompleted : t.actionBar.hideCompleted}
                >
                  {hideCompletedInAllView ? (
                    <EyeOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  ) : (
                    <Eye className="w-3.5 h-3.5 shrink-0" />
                  )}

                  {filter === 'all' && hideCompletedInAllView && hiddenDoneCount > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 min-w-[15px] h-3.5 px-0.5 rounded-full bg-amber-500 text-white font-mono text-[8.5px] font-bold flex items-center justify-center shadow-xs pointer-events-none tabular-nums"
                      aria-hidden="true"
                    >
                      {formatCount(hiddenDoneCount)}
                    </span>
                  )}
                </button>
              )}
            </div>
          ) : (
            <div />
          )}

          {/* Khu vực phải: Tiêu điểm hôm nay & Tìm kiếm (Khóa cứng kích thước, không bao giờ bị đẩy mất) */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-nowrap">
            {/* Nút Tiêu điểm & Giảm tải công việc */}
            {onOpenDailyFocus && (
              <button
                type="button"
                onClick={onOpenDailyFocus}
                className={`h-8 px-2 sm:w-[112px] sm:px-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs shrink-0 overflow-hidden whitespace-nowrap ${
                  dailyFocusCount > 0
                    ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-300/80 dark:border-amber-800/80'
                    : 'bg-white dark:bg-[#161b22] border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
                title={t.dailyFocus.buttonTooltip}
                aria-label={t.dailyFocus.buttonTooltip}
              >
                <Target className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="hidden sm:inline font-semibold text-[11px] truncate">
                  {t.actionBar.allFilter === 'Tất cả' ? 'Tiêu điểm' : 'Focus'}
                </span>
                {dailyFocusCount > 0 && (
                  <span className="font-mono tabular-nums font-bold text-[9.5px] px-1 py-0.2 bg-amber-500/20 dark:bg-amber-500/30 text-amber-800 dark:text-amber-200 rounded shrink-0">
                    {formatCount(dailyFocusCount)}
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

            {/* Ô tìm kiếm cố định w-[156px] trên Desktop (không tự phình to khi focus tránh đẩy lệch) */}
            <div className="hidden sm:flex items-center shrink-0">
              <div className="relative flex items-center w-[156px]">
                <input
                  ref={desktopSearchRef}
                  type="text"
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={t.actionBar.searchPlaceholder}
                  className="w-full h-8 pl-2.5 pr-6 bg-white dark:bg-[#161b22] border border-slate-200/90 dark:border-slate-800 focus:border-slate-800 dark:focus:border-slate-400 rounded-lg text-[11.5px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-colors truncate shadow-2xs"
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
                  <kbd className="absolute right-1.5 text-[9px] text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 rounded px-1 pointer-events-none font-mono">
                    /
                  </kbd>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
