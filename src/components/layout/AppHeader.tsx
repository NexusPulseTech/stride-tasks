import React from 'react';
import {
  Check,
  Flame,
  Target,
  Bell,
  BellOff,
  Activity,
  Upload,
  Smartphone,
  Volume2,
  VolumeX,
  HelpCircle,
  Download,
  Sun,
  Moon,
  Monitor,
  MessageSquareText,
} from 'lucide-react';
import { ThemeMode } from '../../hooks';

interface AppHeaderProps {
  totalTasks: number;
  totalDone: number;
  streak: number;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
  reminderEnabled: boolean;
  onToggleReminder: () => void;
  showStats: boolean;
  onToggleStats: () => void;
  onOpenBackupModal: () => void;
  onOpenMobileGuideModal: () => void;
  onOpenFeedback: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenGuideModal: () => void;
  onDownloadHtml: () => void;
  themeMode: ThemeMode;
  onCycleTheme: () => void;
}

export function AppHeader({
  totalTasks,
  totalDone,
  streak,
  isFocusMode,
  onToggleFocusMode,
  reminderEnabled,
  onToggleReminder,
  showStats,
  onToggleStats,
  onOpenBackupModal,
  onOpenMobileGuideModal,
  onOpenFeedback,
  isMuted,
  onToggleMute,
  onOpenGuideModal,
  onDownloadHtml,
  themeMode,
  onCycleTheme,
}: AppHeaderProps) {
  const getThemeTooltip = () => {
    switch (themeMode) {
      case 'system':
        return 'Giao diện: Theo hệ thống (Bấm để đổi sang Sáng)';
      case 'light':
        return 'Giao diện: Sáng (Bấm để đổi sang Tối)';
      case 'dark':
        return 'Giao diện: Tối (Bấm để đổi sang Theo hệ thống)';
      default:
        return 'Chuyển đổi giao diện Sáng / Tối / Hệ thống';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0e131b]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 pt-[env(safe-area-inset-top)] w-full overflow-hidden transition-colors">
      <div className="max-w-2xl mx-auto px-3 sm:px-4 h-11 sm:h-12 flex items-center justify-between flex-nowrap gap-1.5 sm:gap-2 w-full">
        {/* Logo and title */}
        <div className="flex items-center gap-2 shrink-0 min-w-0">
          <div className="w-5.5 h-5.5 rounded-md overflow-hidden bg-[#1d1d1f] dark:bg-white flex items-center justify-center shrink-0 shadow-2xs ring-1 ring-slate-200/70 dark:ring-slate-700/80">
            <img
              src="/stride-tasks-icon.svg"
              alt="Stride Tasks"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-semibold text-[13px] sm:text-[13.5px] tracking-tight text-slate-900 dark:text-slate-100 truncate">
            Stride Tasks
          </span>
          <span className="text-[11px] sm:text-[11.5px] text-slate-400 dark:text-slate-500 font-normal shrink-0 tabular-nums">
            · {totalDone}/{totalTasks}
          </span>
        </div>

        {/* Right action controls */}
        <div className="flex items-center gap-1 shrink-0 flex-nowrap">
          {/* Streak indicator */}
          <div
            className="flex items-center gap-1 px-2 h-7.5 rounded-lg bg-slate-100/90 dark:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0 tabular-nums select-none"
            title={`Chuỗi hoàn thành: ${streak} ngày liên tiếp`}
          >
            <Flame className="w-3.5 h-3.5 shrink-0 text-slate-500 dark:text-slate-400" strokeWidth={1.5} aria-hidden="true" />
            <span>{streak}d</span>
          </div>

          {/* Focus Mode button */}
          <button
            type="button"
            onClick={onToggleFocusMode}
            className={`h-7.5 px-2 sm:px-2.5 rounded-lg border text-xs font-medium transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              isFocusMode
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 border-slate-900 dark:border-slate-100 shadow-2xs font-semibold'
                : 'bg-white dark:bg-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200/90 dark:border-slate-700/80 shadow-2xs'
            }`}
            title="Chế độ Tập trung (Phím tắt: F hoặc Esc để thoát)"
            aria-label="Chế độ tập trung"
          >
            <Target
              className={`w-3.5 h-3.5 shrink-0 ${isFocusMode ? 'text-white dark:text-slate-950' : 'text-slate-600 dark:text-slate-400'}`}
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <span className="hidden sm:inline">{isFocusMode ? 'Đang tập trung' : 'Tập trung'}</span>
          </button>

          {/* Periodic Reminder button */}
          <button
            type="button"
            onClick={onToggleReminder}
            className={`h-7.5 w-7.5 rounded-lg border transition-colors cursor-pointer shrink-0 flex items-center justify-center ${
              reminderEnabled
                ? 'text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border-transparent'
            }`}
            title={
              reminderEnabled
                ? 'Đang bật nhắc nhở việc dở dang (Bấm để tắt)'
                : 'Bật nhắc nhở hệ thống cho việc đang làm'
            }
            aria-label="Cài đặt nhắc nhở"
          >
            {reminderEnabled ? (
              <Bell className="w-3.5 h-3.5 shrink-0 fill-current text-slate-800 dark:text-slate-200" strokeWidth={1.5} aria-hidden="true" />
            ) : (
              <BellOff className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            )}
          </button>

          {/* Theme Toggle (Light / Dark / System) - standard Monitor icon */}
          <button
            type="button"
            onClick={onCycleTheme}
            className="h-7.5 w-7.5 rounded-lg border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer shrink-0 flex items-center justify-center shadow-2xs"
            title={getThemeTooltip()}
            aria-label={getThemeTooltip()}
          >
            {themeMode === 'light' ? (
              <Sun className="w-3.5 h-3.5 shrink-0 text-slate-700 dark:text-slate-200" strokeWidth={1.75} aria-hidden="true" />
            ) : themeMode === 'dark' ? (
              <Moon className="w-3.5 h-3.5 shrink-0 text-slate-700 dark:text-slate-200" strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <Monitor className="w-3.5 h-3.5 shrink-0 text-slate-500 dark:text-slate-400" strokeWidth={1.5} aria-hidden="true" />
            )}
          </button>

          {/* Productivity & Rhythm Heatmap toggle */}
          <button
            type="button"
            onClick={onToggleStats}
            className={`h-7.5 w-7.5 sm:w-auto sm:px-2.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer shrink-0 ${
              showStats
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Xem bản đồ nhịp độ và nhật ký công việc hoàn thành"
            aria-label="Bản đồ nhịp độ và công việc đã làm"
          >
            <Activity className="w-3.5 h-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
            <span className="hidden sm:inline">Nhịp độ</span>
          </button>

          {/* Backup / Restore modal button */}
          <button
            type="button"
            onClick={onOpenBackupModal}
            className="h-7.5 w-7.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0 flex items-center justify-center"
            title="Sao lưu / Khôi phục dữ liệu (JSON)"
            aria-label="Sao lưu dữ liệu"
          >
            <Upload className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
          </button>

          {/* Feedback & Bug report button */}
          <button
            type="button"
            onClick={onOpenFeedback}
            className="h-7.5 w-7.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0 flex items-center justify-center"
            title="Góp ý & Báo lỗi ứng dụng"
            aria-label="Góp ý và báo lỗi"
          >
            <MessageSquareText className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
          </button>

          {/* Mobile Guide button (mobile only) */}
          <button
            type="button"
            onClick={onOpenMobileGuideModal}
            className="h-7.5 w-7.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0 sm:hidden flex items-center justify-center"
            title="Dùng trên điện thoại (PWA / Màn hình chính)"
            aria-label="Hướng dẫn dùng trên điện thoại"
          >
            <Smartphone className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
          </button>

          {/* Sound mute toggle (desktop only) */}
          <button
            type="button"
            onClick={onToggleMute}
            className={`h-7.5 w-7.5 rounded-lg transition-colors cursor-pointer shrink-0 hidden sm:flex items-center justify-center ${
              isMuted
                ? 'text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={isMuted ? 'Bật âm thanh chúc mừng' : 'Tắt âm thanh (Chế độ im lặng)'}
            aria-label={isMuted ? 'Bật âm thanh chúc mừng' : 'Tắt âm thanh'}
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            )}
          </button>

          {/* Desktop Guide button (desktop only) */}
          <button
            type="button"
            onClick={onOpenGuideModal}
            className="h-7.5 w-7.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0 hidden sm:flex items-center justify-center"
            title="Cách chạy app trên bất kỳ máy nào (Offline 100%)"
            aria-label="Hướng dẫn chạy offline"
          >
            <HelpCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
          </button>

          {/* Download HTML button (desktop only) */}
          <button
            type="button"
            onClick={onDownloadHtml}
            className="h-7.5 w-7.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0 hidden sm:flex items-center justify-center"
            title="Tải 1 file HTML duy nhất chạy offline"
            aria-label="Tải file HTML offline"
          >
            <Download className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
          </button>

        </div>
      </div>
    </header>
  );
}
