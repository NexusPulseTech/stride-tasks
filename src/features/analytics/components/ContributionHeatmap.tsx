import React, { useState, useMemo } from 'react';
import { generateHeatmapWeeks, HeatmapDay } from '../utils/heatmapHelper';

interface ContributionHeatmapProps {
  activityMap: Record<string, number>;
  selectedDay: HeatmapDay | null;
  onSelectDay: (day: HeatmapDay | null) => void;
  onAddManualDoneToday?: () => void;
}

export function ContributionHeatmap({
  activityMap,
  selectedDay,
  onSelectDay,
  onAddManualDoneToday,
}: ContributionHeatmapProps) {
  // Sinh 22 tuần qua (khoảng 5 tháng) để vừa vặn hoàn hảo trên màn hình
  const weeks = useMemo(() => generateHeatmapWeeks(activityMap, 22), [activityMap]);

  const getColorClasses = (level: 0 | 1 | 2 | 3 | 4) => {
    switch (level) {
      case 1:
        return 'bg-emerald-200/90 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 hover:brightness-95';
      case 2:
        return 'bg-emerald-400 dark:bg-emerald-800 border border-emerald-500 dark:border-emerald-700 hover:brightness-95';
      case 3:
        return 'bg-emerald-600 dark:bg-emerald-600 border border-emerald-700 dark:border-emerald-500 hover:brightness-95';
      case 4:
        return 'bg-emerald-700 dark:bg-emerald-400 border border-emerald-800 dark:border-emerald-300 hover:brightness-95';
      default:
        return 'bg-slate-100 dark:bg-[#161b22] border border-slate-200/60 dark:border-slate-800/80 hover:border-slate-400 dark:hover:border-slate-600';
    }
  };

  const handleDayClick = (day: HeatmapDay) => {
    if (selectedDay?.dateKey === day.dateKey) {
      onSelectDay(null); // Click lại để hủy lọc
    } else {
      onSelectDay(day);
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Container cuộn ngang mượt mà cho bản đồ nhịp độ */}
      <div className="overflow-x-auto pb-1 scrollbar-none">
        <div className="inline-block min-w-full">
          {/* Nhãn tháng phía trên */}
          <div className="flex text-[9px] text-slate-400 dark:text-slate-500 font-medium pl-6 pb-1 h-3.5 select-none">
            {weeks.map((week, idx) => (
              <div key={idx} className="w-[13.5px] shrink-0 text-left">
                {week.monthLabel ? (
                  <span className="whitespace-nowrap">{week.monthLabel}</span>
                ) : null}
              </div>
            ))}
          </div>

          {/* Lưới ô vuông 7 ngày x 22 tuần */}
          <div className="flex gap-[2.5px] items-start">
            {/* Cột nhãn thứ trong tuần (T2, T4, T6) */}
            <div className="flex flex-col gap-[2.5px] text-[8.5px] text-slate-400 dark:text-slate-500 font-medium pr-1 select-none shrink-0 w-5">
              <span className="h-[11px] leading-[11px]"></span>
              <span className="h-[11px] leading-[11px]">T2</span>
              <span className="h-[11px] leading-[11px]"></span>
              <span className="h-[11px] leading-[11px]">T4</span>
              <span className="h-[11px] leading-[11px]"></span>
              <span className="h-[11px] leading-[11px]">T6</span>
              <span className="h-[11px] leading-[11px]"></span>
            </div>

            {/* Các cột tuần */}
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-[2.5px] shrink-0">
                {week.days.map((day, dIdx) => {
                  if (!day) {
                    return (
                      <div
                        key={dIdx}
                        className="w-[11px] h-[11px] rounded-[2px] opacity-0 pointer-events-none"
                      />
                    );
                  }

                  const isSelected = selectedDay?.dateKey === day.dateKey;

                  return (
                    <button
                      key={day.dateKey}
                      type="button"
                      onClick={() => handleDayClick(day)}
                      title={`${day.count} việc hoàn thành vào ${day.formattedDate} (Bấm để xem danh sách)`}
                      aria-label={`${day.count} việc hoàn thành vào ${day.formattedDate}`}
                      className={`w-[11px] h-[11px] rounded-[2px] transition-all cursor-pointer ${getColorClasses(
                        day.level
                      )} ${
                        day.isToday
                          ? 'ring-1.5 ring-slate-900 dark:ring-slate-100 ring-offset-1 dark:ring-offset-[#161b22]'
                          : ''
                      } ${isSelected ? 'scale-125 z-10 shadow-sm ring-1 ring-emerald-500' : ''}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Thanh chú giải mức độ (Legend) & Thông tin chi tiết ngày đã chọn */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-1.5 min-w-0 pr-2">
          {selectedDay ? (
            <span className="truncate">
              <strong className="text-slate-900 dark:text-slate-100">
                {selectedDay.count}
              </strong>{' '}
              việc vào {selectedDay.formattedDate}
              {selectedDay.isToday ? ' (Hôm nay)' : ''}
              <button
                type="button"
                onClick={() => onSelectDay(null)}
                className="ml-2 text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
              >
                Hủy chọn
              </button>
            </span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 italic text-[10.5px]">
              Bấm vào bất kỳ ô nào để lọc danh sách việc ngày đó
            </span>
          )}
        </div>

        {/* Chú giải mức độ nhịp độ hoàn thành */}
        <div className="flex items-center gap-1 text-[10px] select-none shrink-0">
          <span className="text-slate-400 dark:text-slate-500 text-[10px]">Ít</span>
          <span
            className="w-[10px] h-[10px] rounded-[2px] bg-slate-100 dark:bg-[#161b22] border border-slate-200/60 dark:border-slate-800"
            title="0 việc (Trống)"
          />
          <span
            className="w-[10px] h-[10px] rounded-[2px] bg-emerald-200/90 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800"
            title="1 việc (Xanh nhẹ)"
          />
          <span
            className="w-[10px] h-[10px] rounded-[2px] bg-emerald-400 dark:bg-emerald-800 border border-emerald-500 dark:border-emerald-700"
            title="2 việc"
          />
          <span
            className="w-[10px] h-[10px] rounded-[2px] bg-emerald-600 dark:bg-emerald-600 border border-emerald-700 dark:border-emerald-500"
            title="3 việc"
          />
          <span
            className="w-[10px] h-[10px] rounded-[2px] bg-emerald-700 dark:bg-emerald-400 border border-emerald-800 dark:border-emerald-300"
            title="4+ việc (Xanh đậm)"
          />
          <span className="text-slate-400 dark:text-slate-500 text-[10px]">Nhiều</span>
        </div>
      </div>
    </div>
  );
}
