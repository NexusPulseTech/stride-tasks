import React, { useState, useMemo } from 'react';
import { Search, X, Trash2, RotateCcw } from 'lucide-react';
import {
  CompletedTaskItem,
  TimeFilterRange,
  filterCompletedTasks,
} from '../utils/completedTasksHelper';
import { useLanguage, formatMessage, pluralize } from '../../../i18n';

interface CompletedTasksTableProps {
  completedTasks: CompletedTaskItem[];
  selectedDateKey: string | null;
  selectedDateFormatted?: string;
  onClearDateFilter: () => void;
  onOpenShareModal: () => void;
  onDeleteLog?: (logId: string) => void;
  onClearAllLogs?: () => void;
  onResetSeed?: () => void;
}

export function CompletedTasksTable({
  completedTasks,
  selectedDateKey,
  selectedDateFormatted,
  onClearDateFilter,
  onDeleteLog,
  onClearAllLogs,
  onResetSeed,
}: CompletedTasksTableProps) {
  const { t } = useLanguage();
  const [range, setRange] = useState<TimeFilterRange>(selectedDateKey ? 'date' : 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);

  // Tự động chuyển bộ lọc khi người dùng click vào một ngày trên Heatmap
  React.useEffect(() => {
    if (selectedDateKey) {
      setRange('date');
    }
  }, [selectedDateKey]);

  const filtered = useMemo(() => {
    return filterCompletedTasks(completedTasks, range, selectedDateKey, searchQuery);
  }, [completedTasks, range, selectedDateKey, searchQuery]);

  return (
    <div className="space-y-3 pt-2">
      {/* Thanh công cụ: Bộ lọc thời gian và Tìm kiếm */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Segmented control tabs - Thiết kế tối giản */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800/60 rounded-md text-xs">
          <button
            type="button"
            onClick={() => {
              setRange('all');
              if (selectedDateKey) onClearDateFilter();
            }}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer text-[11.5px] ${
              range === 'all' && !selectedDateKey
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-medium'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {formatMessage(t.analytics.filterAll, { count: completedTasks.length })}
          </button>
          <button
            type="button"
            onClick={() => {
              setRange('today');
              if (selectedDateKey) onClearDateFilter();
            }}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer text-[11.5px] ${
              range === 'today'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-medium'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {t.common.today}
          </button>
          <button
            type="button"
            onClick={() => {
              setRange('week');
              if (selectedDateKey) onClearDateFilter();
            }}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer text-[11.5px] ${
              range === 'week'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-medium'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {t.common.thisWeek}
          </button>
          <button
            type="button"
            onClick={() => {
              setRange('month');
              if (selectedDateKey) onClearDateFilter();
            }}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer text-[11.5px] ${
              range === 'month'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-medium'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {t.common.thisMonth}
          </button>
          {selectedDateKey && (
            <button
              type="button"
              onClick={() => setRange('date')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer text-[11.5px] ${
                range === 'date'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950 font-medium'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {selectedDateFormatted || selectedDateKey}
            </button>
          )}
        </div>

        {/* Cụm công cụ bên phải: Tìm kiếm & Xóa sạch */}
        <div className="flex items-center gap-1.5">
          {/* Ô tìm kiếm đơn giản */}
          <div className="relative sm:w-44">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.analytics.filterPlaceholder}
              className="w-full h-7 pl-7.5 pr-6 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 rounded-md text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Nút xóa sạch toàn bộ lịch sử */}
          {onClearAllLogs && completedTasks.length > 0 && (
            <button
              type="button"
              onClick={() => setIsConfirmClearOpen(true)}
              className="h-7 px-2 border border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-md text-[11px] font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1"
              title={t.analytics.clearAllTitle}
            >
              <Trash2 className="w-3 h-3" />
              <span className="hidden md:inline">{t.analytics.clearAllButton}</span>
            </button>
          )}

          {/* Nút khôi phục dữ liệu mẫu */}
          {onResetSeed && completedTasks.length === 0 && (
            <button
              type="button"
              onClick={onResetSeed}
              className="h-7 px-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md text-[11px] font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1"
              title={t.analytics.resetSeedTitle}
            >
              <RotateCcw className="w-3 h-3" />
              <span>{t.header.restoreSampleData}</span>
            </button>
          )}
        </div>
      </div>

      {/* Hộp thoại xác nhận dọn sạch */}
      {isConfirmClearOpen && (
        <div className="p-3 bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/50 rounded-lg flex items-center justify-between gap-3 text-xs text-rose-800 dark:text-rose-300 animate-in fade-in duration-150">
          <span>{formatMessage(t.analytics.clearAllConfirm, { count: completedTasks.length })}</span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (onClearAllLogs) onClearAllLogs();
                setIsConfirmClearOpen(false);
              }}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-medium cursor-pointer"
            >
              {t.analytics.confirmClearButton}
            </button>
            <button
              type="button"
              onClick={() => setIsConfirmClearOpen(false)}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 rounded cursor-pointer"
            >
              {t.common.cancel}
            </button>
          </div>
        </div>
      )}

      {/* Thông báo ngày đang chọn */}
      {selectedDateKey && range === 'date' && (
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-0.5">
          <span>
            {t.analytics.filteringLabel}{' '}
            <strong className="text-slate-800 dark:text-slate-200">{selectedDateFormatted || selectedDateKey}</strong> (
            {filtered.length} {pluralize(filtered.length, t.analytics.unitTaskOne, t.analytics.unitTaskOther)})
          </span>
          <button
            type="button"
            onClick={onClearDateFilter}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 underline cursor-pointer"
          >
            {t.analytics.viewAll}
          </button>
        </div>
      )}

      {/* Bảng dữ liệu sạch: Có nút xóa từng dòng */}
      <div className="border border-slate-200/80 dark:border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-medium text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-800/20">
                <th className="py-2 px-3 font-medium">{t.analytics.tableTaskCol}</th>
                <th className="py-2 px-3 font-medium w-36 hidden sm:table-cell">{t.analytics.tableProjCol}</th>
                <th className="py-2 px-3 font-medium w-28 text-right">{t.analytics.tableTimeCol}</th>
                {onDeleteLog && (
                  <th className="py-2 px-2 font-medium w-10 text-center" aria-label={t.analytics.actionsCol}>
                    <span className="sr-only">{t.analytics.actionsCol}</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={onDeleteLog ? 4 : 3} className="py-8 text-center text-slate-400 dark:text-slate-500">
                    {t.analytics.emptyRange}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="group hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    {/* Tên việc */}
                    <td className="py-2 px-3 text-slate-800 dark:text-slate-200">
                      <div className="font-medium text-[12.5px] leading-snug">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 sm:hidden mt-0.5">
                        <span>{item.projectName}</span>
                        {item.subtasksTotal > 0 && (
                          <span> · {formatMessage(t.analytics.subtasksShort, { done: item.subtasksCompleted, total: item.subtasksTotal })}</span>
                        )}
                      </div>
                      {item.subtasksTotal > 0 && (
                        <div className="hidden sm:inline-block text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {formatMessage(t.analytics.subtasksDone, { done: item.subtasksCompleted, total: item.subtasksTotal })}
                        </div>
                      )}
                    </td>

                    {/* Dự án */}
                    <td className="py-2 px-3 hidden sm:table-cell text-slate-500 dark:text-slate-400 text-[12px] truncate max-w-[140px]">
                      {item.projectName}
                    </td>

                    {/* Thời gian hoàn thành */}
                    <td className="py-2 px-3 text-right text-slate-400 dark:text-slate-500 text-[11.5px] font-mono tabular-nums whitespace-nowrap">
                      {item.formattedDate}
                    </td>

                    {/* Nút xóa từng dòng */}
                    {onDeleteLog && (
                      <td className="py-2 px-2 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onDeleteLog(item.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded transition-all cursor-pointer"
                          title={t.analytics.deleteRowTitle}
                          aria-label={formatMessage(t.analytics.deleteRowLabel, { title: item.title })}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
