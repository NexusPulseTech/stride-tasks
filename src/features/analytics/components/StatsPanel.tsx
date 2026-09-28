import React, { useState, useMemo } from 'react';
import { X, Share2 } from 'lucide-react';
import { CompletedItemLog } from '../hooks/useActivityLog';
import { ContributionHeatmap } from './ContributionHeatmap';
import { CompletedTasksTable } from './CompletedTasksTable';
import { ShareProductivityModal } from './ShareProductivityModal';
import { HeatmapDay } from '../utils/heatmapHelper';
import { formatLogsToTaskItems } from '../utils/completedTasksHelper';

interface StatsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  completedLogs: CompletedItemLog[];
  activityMap: Record<string, number>;
  todayCount: number;
  weekCount: number;
  currentStreak: number;
  totalCompleted: number;
  showToast?: (msg: string) => void;
}

export function StatsPanel({
  isOpen,
  onClose,
  completedLogs,
  activityMap,
  todayCount,
  weekCount,
  currentStreak,
  totalCompleted,
  showToast = () => {},
}: StatsPanelProps) {
  const [selectedDay, setSelectedDay] = useState<HeatmapDay | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Chuyển đổi dữ liệu log hoàn thành (Single Source of Truth) sang định dạng hiển thị
  const completedTasks = useMemo(() => formatLogsToTaskItems(completedLogs), [completedLogs]);

  if (!isOpen) return null;

  return (
    <section className="bg-white dark:bg-[#11141c] rounded-xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-4 transition-colors">
      {/* Header: Thanh lịch, không icon trang trí thừa, typography rõ ràng */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
            Nhịp độ & Lịch sử hoàn thành
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Dữ liệu đồng bộ trực tiếp từ các mục tiêu đã làm
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="h-7.5 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Tạo ảnh thẻ hoặc tóm tắt để chia sẻ kết quả"
            aria-label="Chia sẻ kết quả"
          >
            <Share2 className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
            <span>Chia sẻ</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-7.5 h-7.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md flex items-center justify-center cursor-pointer transition-colors"
            title="Đóng bảng nhịp độ"
            aria-label="Đóng bảng nhịp độ"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* 4 Chỉ số thực sự cần thiết: Hôm nay, Tuần này, Chuỗi ngày, Tổng hoàn thành */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-slate-100 dark:border-slate-800/80">
        <div>
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Hôm nay
          </span>
          <div className="text-lg font-semibold text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-0.5">
            {todayCount} <span className="text-xs font-normal text-slate-400 font-sans">việc</span>
          </div>
        </div>

        <div>
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Tuần này
          </span>
          <div className="text-lg font-semibold text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-0.5">
            {weekCount} <span className="text-xs font-normal text-slate-400 font-sans">việc</span>
          </div>
        </div>

        <div>
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Chuỗi liên tục
          </span>
          <div className="text-lg font-semibold text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-0.5">
            {currentStreak} <span className="text-xs font-normal text-slate-400 font-sans">ngày</span>
          </div>
        </div>

        <div>
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Tổng đã xong
          </span>
          <div className="text-lg font-semibold text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-0.5">
            {totalCompleted} <span className="text-xs font-normal text-slate-400 font-sans">việc</span>
          </div>
        </div>
      </div>

      {/* Bản đồ nhịp độ theo ngày */}
      <div className="pt-1">
        <ContributionHeatmap
          activityMap={activityMap}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
        />
      </div>

      {/* Bảng danh sách công việc đã làm (Khớp chính xác 100% với Heatmap) */}
      <CompletedTasksTable
        completedTasks={completedTasks}
        selectedDateKey={selectedDay?.dateKey || null}
        selectedDateFormatted={selectedDay?.formattedDate}
        onClearDateFilter={() => setSelectedDay(null)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
      />

      {/* Modal chia sẻ thành tích */}
      <ShareProductivityModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        completedTasks={completedTasks}
        streak={currentStreak}
        totalCompleted={totalCompleted}
        maxDayCount={weekCount}
        showToast={showToast}
      />
    </section>
  );
}
