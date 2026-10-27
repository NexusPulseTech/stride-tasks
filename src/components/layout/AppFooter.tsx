import React from 'react';
import { Sun, Moon, Monitor, Crown } from 'lucide-react';
import { ThemeMode } from '../../hooks';
import { useLanguage } from '../../i18n';

interface AppFooterProps {
  onOpenMobileGuide: () => void;
  onOpenGuide: () => void;
  onOpenBackup: () => void;
  onOpenFeedback: () => void;
  onOpenStoreModal?: () => void;
  themeMode: ThemeMode;
  onSetThemeMode: (mode: ThemeMode) => void;
}

export function AppFooter({
  onOpenMobileGuide,
  onOpenGuide,
  onOpenBackup,
  onOpenFeedback,
  onOpenStoreModal,
  themeMode,
  onSetThemeMode,
}: AppFooterProps) {
  const { t, language } = useLanguage();

  return (
    <footer className="text-center text-[11px] text-slate-400 dark:text-slate-500 pt-6 pb-4 space-y-2.5">
      <p>{t.footer.tagline}</p>
      
      {/* Quick Theme Switcher in Footer */}
      <div className="flex items-center justify-center gap-1 text-[11px] pt-0.5">
        <span className="text-slate-400 dark:text-slate-500 mr-1 select-none">{t.footer.themeLabel}</span>
        <div className="inline-flex items-center bg-slate-200/60 dark:bg-slate-800/80 p-0.5 rounded-lg">
          <button
            type="button"
            onClick={() => onSetThemeMode('system')}
            className={`px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer transition-all ${
              themeMode === 'system'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-medium shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            title={t.header.themeTooltipSystem}
            aria-label={t.header.themeTooltipSystem}
          >
            <Monitor className="w-3 h-3 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            <span>{t.footer.themeSystem}</span>
          </button>
          <button
            type="button"
            onClick={() => onSetThemeMode('light')}
            className={`px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer transition-all ${
              themeMode === 'light'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-medium shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            title={t.header.themeTooltipLight}
            aria-label={t.header.themeTooltipLight}
          >
            <Sun className="w-3 h-3 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            <span>{t.footer.themeLight}</span>
          </button>
          <button
            type="button"
            onClick={() => onSetThemeMode('dark')}
            className={`px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer transition-all ${
              themeMode === 'dark'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-medium shadow-2xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            title={t.header.themeTooltipDark}
            aria-label={t.header.themeTooltipDark}
          >
            <Moon className="w-3 h-3 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            <span>{t.footer.themeDark}</span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 pt-1 text-slate-500 dark:text-slate-400 flex-wrap">
        {onOpenStoreModal && (
          <>
            <button
              type="button"
              onClick={onOpenStoreModal}
              className="hover:underline text-amber-600 dark:text-amber-400 font-semibold cursor-pointer inline-flex items-center gap-1"
            >
              <Crown className="w-3 h-3" />
              <span>{t.store.entryLabel}</span>
            </button>
            <span aria-hidden="true">·</span>
          </>
        )}
        <button
          type="button"
          onClick={onOpenMobileGuide}
          className="hover:underline hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
        >
          {t.footer.pwa}
        </button>
        <span aria-hidden="true">·</span>
        <button
          type="button"
          onClick={onOpenGuide}
          className="hover:underline hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
        >
          {t.footer.offlineGuide}
        </button>
        <span aria-hidden="true">·</span>
        <button
          type="button"
          onClick={onOpenBackup}
          className="hover:underline hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
        >
          {t.footer.backupData}
        </button>
        <span aria-hidden="true">·</span>
        <button
          type="button"
          onClick={onOpenFeedback}
          className="hover:underline hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
        >
          {t.footer.feedback}
        </button>
        <span aria-hidden="true">·</span>
        <a
          href="/privacy.html"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
        >
          {language === 'vi' ? 'Bảo mật (Privacy)' : 'Privacy Policy'}
        </a>
        <span aria-hidden="true">·</span>
        <a
          href="https://github.com/NexusPulseTech/stride-tasks"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer font-medium text-slate-600 dark:text-slate-300"
          title={t.footer.github}
        >
          {t.header.githubLabel}
        </a>
      </div>
    </footer>
  );
}
