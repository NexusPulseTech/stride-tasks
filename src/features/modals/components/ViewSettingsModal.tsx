import React from 'react';
import { X, Sliders, RotateCcw, EyeOff, Globe } from 'lucide-react';
import { useLanguage } from '../../../i18n';
import { ViewPreferences } from '../../../hooks/useViewPreferences';

export interface ViewSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: ViewPreferences;
  onUpdatePreference: (key: keyof ViewPreferences, value: any) => void;
  onToggleZenMode: () => void;
  onResetPreferences: () => void;
}

export function ViewSettingsModal({
  isOpen,
  onClose,
  preferences,
  onUpdatePreference,
  onToggleZenMode,
  onResetPreferences,
}: ViewSettingsModalProps) {
  const { t, language, setLanguage } = useLanguage();

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#151a23] rounded-2xl max-w-md w-full border border-slate-200/90 dark:border-slate-800 shadow-xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                {t.viewSettings.title}
              </h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                {t.viewSettings.subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Card: Chế độ Zen Mode đặc biệt (Không dùng icon AI, thiết kế rõ ràng dứt khoát) */}
          <div
            onClick={onToggleZenMode}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
              preferences.zenMode
                ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/70'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <div className="space-y-0.5 min-w-0 flex-1">
              <div className="flex items-center gap-1.5 font-medium text-xs text-slate-900 dark:text-slate-100">
                <EyeOff className={`w-3.5 h-3.5 shrink-0 ${preferences.zenMode ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`} />
                <span className="font-semibold">{t.viewSettings.zenModeTitle}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                {t.viewSettings.zenModeDesc}
              </p>
            </div>
            <div className="shrink-0">
              <div
                className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                  preferences.zenMode ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    preferences.zenMode ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Chọn Ngôn ngữ (Language Switcher - Chuẩn Segmented Control không bao giờ nhảy layout) */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800 rounded-xl space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
                  <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{t.viewSettings.languageTitle}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                  {t.viewSettings.languageDesc}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 p-1 bg-slate-200/60 dark:bg-slate-900/60 rounded-lg text-xs font-medium border border-slate-200/50 dark:border-slate-800 gap-1">
              <button
                type="button"
                onClick={() => setLanguage('vi')}
                className={`py-1.5 px-3 rounded-md transition-all text-center cursor-pointer text-xs font-medium ${
                  language === 'vi'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Tiếng Việt
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`py-1.5 px-3 rounded-md transition-all text-center cursor-pointer text-xs font-medium ${
                  language === 'en'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Danh sách các thành phần UI chi tiết */}
          <div className="space-y-1.5 pt-1">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
              {t.viewSettings.sectionsTitle}
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900/40">
              {/* Thống kê & Heatmap */}
              <label className="flex items-center justify-between p-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 cursor-pointer">
                <span className="text-xs text-slate-700 dark:text-slate-200">
                  {t.viewSettings.showHeatmap}
                </span>
                <input
                  type="checkbox"
                  checked={preferences.showStatsPanel}
                  onChange={(e) => onUpdatePreference('showStatsPanel', e.target.checked)}
                  className="rounded text-slate-900 dark:text-slate-100 focus:ring-slate-500 cursor-pointer"
                />
              </label>

              {/* Focus button */}
              <label className="flex items-center justify-between p-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 cursor-pointer">
                <span className="text-xs text-slate-700 dark:text-slate-200">
                  {t.viewSettings.showFocusButton}
                </span>
                <input
                  type="checkbox"
                  checked={preferences.showFocusButton}
                  onChange={(e) => onUpdatePreference('showFocusButton', e.target.checked)}
                  className="rounded text-slate-900 dark:text-slate-100 focus:ring-slate-500 cursor-pointer"
                />
              </label>

              {/* Reminder button */}
              <label className="flex items-center justify-between p-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 cursor-pointer">
                <span className="text-xs text-slate-700 dark:text-slate-200">
                  {t.viewSettings.showReminderButton}
                </span>
                <input
                  type="checkbox"
                  checked={preferences.showReminderButton}
                  onChange={(e) => onUpdatePreference('showReminderButton', e.target.checked)}
                  className="rounded text-slate-900 dark:text-slate-100 focus:ring-slate-500 cursor-pointer"
                />
              </label>

              {/* Streak Flame */}
              <label className="flex items-center justify-between p-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 cursor-pointer">
                <span className="text-xs text-slate-700 dark:text-slate-200">
                  {t.viewSettings.showStreakBadge}
                </span>
                <input
                  type="checkbox"
                  checked={preferences.showStreakBadge}
                  onChange={(e) => onUpdatePreference('showStreakBadge', e.target.checked)}
                  className="rounded text-slate-900 dark:text-slate-100 focus:ring-slate-500 cursor-pointer"
                />
              </label>

              {/* Add Project Bar */}
              <label className="flex items-center justify-between p-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 cursor-pointer">
                <span className="text-xs text-slate-700 dark:text-slate-200">
                  {t.viewSettings.showAddProjectBar}
                </span>
                <input
                  type="checkbox"
                  checked={preferences.showAddProjectBar}
                  onChange={(e) => onUpdatePreference('showAddProjectBar', e.target.checked)}
                  className="rounded text-slate-900 dark:text-slate-100 focus:ring-slate-500 cursor-pointer"
                />
              </label>

              {/* Filter Tabs */}
              <label className="flex items-center justify-between p-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 cursor-pointer">
                <span className="text-xs text-slate-700 dark:text-slate-200">
                  {t.viewSettings.showFilterTabs}
                </span>
                <input
                  type="checkbox"
                  checked={preferences.showFilterTabs}
                  onChange={(e) => onUpdatePreference('showFilterTabs', e.target.checked)}
                  className="rounded text-slate-900 dark:text-slate-100 focus:ring-slate-500 cursor-pointer"
                />
              </label>

              {/* Nút chuyển đổi ngôn ngữ trên Header */}
              <label className="flex items-center justify-between p-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 cursor-pointer">
                <span className="text-xs text-slate-700 dark:text-slate-200">
                  {t.viewSettings.showLanguageSwitcher}
                </span>
                <input
                  type="checkbox"
                  checked={preferences.showLanguageSwitcher}
                  onChange={(e) => onUpdatePreference('showLanguageSwitcher', e.target.checked)}
                  className="rounded text-slate-900 dark:text-slate-100 focus:ring-slate-500 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800/80">
          <button
            type="button"
            onClick={onResetPreferences}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.viewSettings.resetToDefault}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-950 font-medium text-xs rounded-lg transition-colors cursor-pointer"
          >
            {t.analytics.close}
          </button>
        </div>
      </div>
    </div>
  );
}
