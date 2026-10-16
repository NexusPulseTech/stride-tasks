import React, { useState, useRef } from 'react';
import {
  Check,
  Flame,
  Target,
  Activity,
  Sliders,
  Sun,
  Moon,
  Monitor,
  Globe,
} from 'lucide-react';
import { ThemeMode } from '../../hooks';
import { ViewPreferences } from '../../hooks/useViewPreferences';
import { useLanguage } from '../../i18n';
import { HeaderMenuPopover } from './HeaderMenuPopover';

export interface AppHeaderProps {
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
  onOpenViewSettings: () => void;
  viewPreferences: ViewPreferences;
  onToggleZenMode?: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenGuideModal: () => void;
  onDownloadHtml: () => void;
  themeMode: ThemeMode;
  onCycleTheme: () => void;
  onClearSampleData?: () => void;
  onResetSample?: () => void;
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
  onOpenViewSettings,
  viewPreferences,
  onToggleZenMode = () => {},
  isMuted,
  onToggleMute,
  onOpenGuideModal,
  onDownloadHtml,
  themeMode,
  onCycleTheme,
  onClearSampleData,
  onResetSample,
}: AppHeaderProps) {
  const { t, language, toggleLanguage } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0e131b]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 pt-[env(safe-area-inset-top)] w-full transition-colors select-none">
      <div className="max-w-2xl mx-auto px-2.5 sm:px-4 h-11 sm:h-12 flex items-center justify-between gap-1.5 sm:gap-2 w-full">
        {/* Left Zone: Brand & Compact Progress - Khóa kích thước cố định không đẩy nút bên phải */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 overflow-hidden">
          <div className="w-5.5 h-5.5 rounded-md bg-[#1d1d1f] dark:bg-white flex items-center justify-center text-white dark:text-slate-900 shrink-0 shadow-2xs">
            <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
          </div>
          <span className="font-semibold text-[13px] sm:text-[13.5px] tracking-tight text-slate-900 dark:text-slate-100 truncate">
            {t.common.appTitle}
          </span>
          <span className="text-[11px] sm:text-[11.5px] text-slate-400 dark:text-slate-500 font-normal shrink-0 font-mono tabular-nums">
            · {totalDone}/{totalTasks}
          </span>
        </div>

        {/* Right Zone: Essential Fast Actions + Unified Popover Menu (Cố định độ rộng từng nút) */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 relative flex-nowrap">
          {/* Streak Badge chuẩn chuyên nghiệp */}
          {viewPreferences.showStreakBadge && !viewPreferences.zenMode && (
            <div
              className="flex items-center justify-center gap-1 px-2 h-7.5 rounded-lg bg-slate-100/90 dark:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-300 shrink-0 font-mono tabular-nums select-none border border-slate-200/50 dark:border-slate-700/50"
              title={`${streak} ${t.header.streakDays}`}
            >
              <Flame className="w-3.5 h-3.5 shrink-0 text-amber-500 dark:text-amber-400" strokeWidth={1.75} aria-hidden="true" />
              <span>{streak}d</span>
            </div>
          )}

          {/* Focus Mode button - Khóa cố định sm:w-[92px] để chuyển VI/EN không nhảy */}
          {viewPreferences.showFocusButton && !viewPreferences.zenMode && (
            <button
              type="button"
              onClick={onToggleFocusMode}
              className={`h-7.5 w-7.5 sm:w-[92px] sm:px-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-1.5 ${
                isFocusMode
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 border-slate-900 dark:border-slate-100 shadow-2xs font-semibold'
                  : 'bg-white dark:bg-slate-800/70 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200/90 dark:border-slate-700/80 shadow-2xs'
              }`}
              title={t.header.focusTooltip}
              aria-label={t.header.focusMode}
            >
              <Target
                className={`w-3.5 h-3.5 shrink-0 ${isFocusMode ? 'text-white dark:text-slate-950' : 'text-slate-600 dark:text-slate-400'}`}
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span className="hidden sm:inline truncate">{t.header.focusMode}</span>
            </button>
          )}

          {/* Stats & Rhythm Heatmap button - Khóa cố định sm:w-[76px] */}
          {viewPreferences.showStatsPanel && !viewPreferences.zenMode && (
            <button
              type="button"
              onClick={onToggleStats}
              className={`h-7.5 w-7.5 sm:w-[76px] sm:px-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer shrink-0 border ${
                showStats
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100 font-semibold'
                  : 'bg-white dark:bg-slate-800/70 border-slate-200/90 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 shadow-2xs'
              }`}
              title={t.header.analyticsTooltip}
              aria-label={t.header.analyticsTooltip}
            >
              <Activity className="w-3.5 h-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
              <span className="hidden sm:inline truncate">{language === 'vi' ? 'Nhịp độ' : 'Stats'}</span>
            </button>
          )}

          {/* Quick Language Switcher Button - Khóa cố định w-[50px] */}
          {viewPreferences.showLanguageSwitcher && !viewPreferences.zenMode && (
            <button
              type="button"
              onClick={toggleLanguage}
              className="h-7.5 w-[50px] px-1.5 rounded-lg border border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-mono text-[11px] font-semibold transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-1 shadow-2xs"
              title={language === 'vi' ? 'Chuyển sang English (Switch to English)' : 'Chuyển sang Tiếng Việt (Switch to Vietnamese)'}
              aria-label="Switch Language"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.75} />
              <span className="font-bold">{language.toUpperCase()}</span>
            </button>
          )}

          {/* Unified Menu & Settings Button - Khóa cố định md:w-[78px] */}
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className={`h-7.5 w-7.5 md:w-[78px] md:px-2 rounded-lg border transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-1 shadow-2xs ${
              isMenuOpen || viewPreferences.zenMode
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 border-slate-900 dark:border-slate-100 font-semibold'
                : 'border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={t.header.menuTooltip}
            aria-label={t.header.menuTooltip}
            aria-expanded={isMenuOpen}
          >
            <Sliders className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span className="hidden md:inline text-xs font-medium truncate">
              {viewPreferences.zenMode ? 'Zen' : t.header.menuTitle}
            </span>
          </button>

          {/* Floating Menu Popover */}
          <HeaderMenuPopover
            isOpen={isMenuOpen}
            onClose={() => setIsMenuOpen(false)}
            anchorRef={menuButtonRef}
            themeMode={themeMode}
            onCycleTheme={onCycleTheme}
            isMuted={isMuted}
            onToggleMute={onToggleMute}
            reminderEnabled={reminderEnabled}
            onToggleReminder={onToggleReminder}
            viewPreferences={viewPreferences}
            onToggleZenMode={onToggleZenMode}
            onOpenViewSettings={onOpenViewSettings}
            onOpenBackupModal={onOpenBackupModal}
            onOpenGuideModal={onOpenGuideModal}
            onOpenFeedback={onOpenFeedback}
            onDownloadHtml={onDownloadHtml}
            onClearSampleData={onClearSampleData}
            onResetSample={onResetSample}
          />
        </div>
      </div>
    </header>
  );
}
