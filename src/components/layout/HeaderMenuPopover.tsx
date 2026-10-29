import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Sliders,
  Sun,
  Moon,
  Monitor,
  Globe,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Upload,
  Download,
  HelpCircle,
  MessageSquareText,
  Github,
  EyeOff,
  Eye,
  Trash2,
  RotateCcw,
  Crown,
  ShieldCheck,
  Smartphone,
  Cloud,
  Command,
  FileText,
} from 'lucide-react';
import { ThemeMode } from '../../hooks';
import { ViewPreferences } from '../../hooks/useViewPreferences';
import { useLanguage } from '../../i18n';
import { APP_VERSION } from '../../constants';

export interface HeaderMenuPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  themeMode: ThemeMode;
  onCycleTheme: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  reminderEnabled: boolean;
  onToggleReminder: () => void;
  viewPreferences: ViewPreferences;
  onToggleZenMode: () => void;
  onOpenViewSettings: () => void;
  onOpenBackupModal: () => void;
  onOpenGuideModal: () => void;
  onOpenFeedback: () => void;
  onDownloadHtml: () => void;
  onClearSampleData?: () => void;
  onResetSample?: () => void;
  isPro?: boolean;
  onOpenStoreModal?: () => void;
  canInstallPWA?: boolean;
  onInstallPWA?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenMarkdownReport?: () => void;
  onOpenSync?: () => void;
  syncState?: 'off' | 'on' | 'error';
}

export function HeaderMenuPopover({
  isOpen,
  onClose,
  anchorRef,
  themeMode,
  onCycleTheme,
  isMuted,
  onToggleMute,
  reminderEnabled,
  onToggleReminder,
  viewPreferences,
  onToggleZenMode,
  onOpenViewSettings,
  onOpenBackupModal,
  onOpenGuideModal,
  onOpenFeedback,
  onDownloadHtml,
  onClearSampleData,
  onResetSample,
  isPro = false,
  onOpenStoreModal,
  canInstallPWA = false,
  onInstallPWA,
  onOpenCommandPalette,
  onOpenMarkdownReport,
  onOpenSync,
  syncState = 'off',
}: HeaderMenuPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const { t, language, setLanguage } = useLanguage();
  const [coords, setCoords] = useState<{ top: number; right: number }>({ top: 52, right: 12 });

  const updatePosition = useCallback(() => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const top = Math.max(8, rect.bottom + 6);
    const right = Math.max(8, window.innerWidth - rect.right);
    setCoords({ top, right });
  }, [anchorRef]);

  // Đóng khi click ngoài hoặc bấm phím Escape & cập nhật tọa độ chuẩn Portal
  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, anchorRef, updatePosition]);

  if (!isOpen) return null;

  const getThemeText = () => {
    switch (themeMode) {
      case 'light':
        return language === 'vi' ? 'Sáng' : 'Light';
      case 'dark':
        return language === 'vi' ? 'Tối' : 'Dark';
      default:
        return language === 'vi' ? 'Hệ thống' : 'System';
    }
  };

  return createPortal(
    <div
      ref={popoverRef}
      role="menu"
      aria-orientation="vertical"
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: `${coords.top}px`,
        right: `${coords.right}px`,
        maxHeight: `calc(100vh - ${coords.top + 12}px)`,
        zIndex: 10000,
      }}
      className="w-72 max-w-[calc(100vw-1rem)] bg-white dark:bg-[#161b22] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-y-auto overflow-x-hidden z-[10000] animate-in fade-in zoom-in-95 duration-150 text-slate-800 dark:text-slate-100 select-none"
    >
      {/* Header Menu Title */}
      <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40 sticky top-0 z-10 backdrop-blur-xs">
        <span className="text-xs font-semibold text-slate-900 dark:text-slate-200">
          {t.header.menuTitle}
        </span>
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenViewSettings();
          }}
          className="text-[11px] font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
        >
          <Sliders className="w-3 h-3" />
          <span>{t.viewSettings.title}</span>
        </button>
      </div>

      <div className="p-2 space-y-1 text-xs">
        {/* Nhóm 1: Ngôn ngữ & Theme (Chuyển nhanh) */}
        <div className="p-1 bg-slate-50/70 dark:bg-slate-800/30 rounded-xl space-y-1.5 border border-slate-100 dark:border-slate-800/60">
          {/* Language Switch */}
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.viewSettings.languageTitle}</span>
            </span>
            <div className="flex items-center p-0.5 bg-slate-200/60 dark:bg-slate-900/60 rounded-lg text-[11px]">
              <button
                type="button"
                onClick={() => setLanguage('vi')}
                className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                  language === 'vi'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Tiếng Việt
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                  language === 'en'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Theme Switcher Button */}
          <button
            type="button"
            onClick={onCycleTheme}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800/80 transition-colors text-left cursor-pointer"
          >
            <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5">
              {themeMode === 'light' ? (
                <Sun className="w-3.5 h-3.5 text-amber-500" />
              ) : themeMode === 'dark' ? (
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
              ) : (
                <Monitor className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>{t.header.themeLabel}</span>
            </span>
            <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-800">
              {getThemeText()}
            </span>
          </button>
        </div>

        {/* Nhóm 2: Chức năng nâng cao & Trải nghiệm */}
        <div className="py-1 space-y-0.5">
          {/* Zen Mode toggle */}
          <button
            type="button"
            onClick={() => {
              onToggleZenMode();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors text-left cursor-pointer"
          >
            <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
              {viewPreferences.zenMode ? (
                <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>{t.viewSettings.zenModeTitle}</span>
            </span>
            <span
              className={`text-[10.5px] px-1.5 py-0.5 rounded font-mono font-medium ${
                viewPreferences.zenMode
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'text-slate-400'
              }`}
            >
              {viewPreferences.zenMode ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Reminder toggle */}
          <button
            type="button"
            onClick={onToggleReminder}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors text-left cursor-pointer"
          >
            <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
              {reminderEnabled ? (
                <Bell className="w-3.5 h-3.5 text-slate-900 dark:text-slate-100" />
              ) : (
                <BellOff className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>{t.header.reminderTooltip}</span>
            </span>
            <span
              className={`text-[10.5px] px-1.5 py-0.5 rounded font-mono font-medium ${
                reminderEnabled
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-400'
              }`}
            >
              {reminderEnabled ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Sound toggle */}
          <button
            type="button"
            onClick={onToggleMute}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-colors text-left cursor-pointer"
          >
            <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
              )}
              <span>{t.header.soundLabel}</span>
            </span>
            <span className="text-[10.5px] font-mono text-slate-400">
              {isMuted ? (language === 'vi' ? 'Tắt' : 'Muted') : (language === 'vi' ? 'Bật' : 'On')}
            </span>
          </button>
        </div>

        {/* Nhóm 3: Tiện ích dữ liệu & Ngoại tuyến */}
        <div className="pt-1 border-t border-slate-100 dark:border-slate-800/80 space-y-0.5">
          {/* Command Palette Ctrl+K */}
          {onOpenCommandPalette && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCommandPalette();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 transition-colors text-left cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Command className="w-3.5 h-3.5 text-slate-400" />
                <span>{language === 'vi' ? 'Thanh lệnh nhanh (Command)' : 'Command Palette'}</span>
              </span>
              <kbd className="text-[10px] font-mono text-slate-400 border border-slate-200 dark:border-slate-700 rounded px-1">
                Ctrl+K
              </kbd>
            </button>
          )}

          {/* Xuất Báo cáo Tiến độ Markdown (Obsidian / Notion / Standup) */}
          {onOpenMarkdownReport && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenMarkdownReport();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 transition-colors text-left cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-emerald-500" />
                <span>{language === 'vi' ? 'Xuất báo cáo tiến độ (.MD)' : 'Export Markdown Report'}</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                Obsidian
              </span>
            </button>
          )}

          {/* Backup / Restore JSON */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenBackupModal();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 transition-colors text-left cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>{t.header.backupLabel}</span>
          </button>

          {/* User Guide */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenGuideModal();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 transition-colors text-left cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>{t.header.guideLabel}</span>
          </button>

          {/* Feedback */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenFeedback();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 transition-colors text-left cursor-pointer"
          >
            <MessageSquareText className="w-3.5 h-3.5 text-slate-400" />
            <span>{t.header.feedbackLabel}</span>
          </button>

          {/* Xóa sạch dữ liệu mẫu (Trang trắng) */}
          {onClearSampleData && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onClearSampleData();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors text-left cursor-pointer font-medium"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>Xóa dữ liệu mẫu (Trang trắng)</span>
            </button>
          )}

          {/* Khôi phục lại mẫu ban đầu */}
          {onResetSample && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onResetSample();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300 transition-colors text-left cursor-pointer text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{t.header.restoreSampleData}</span>
            </button>
          )}

          {/* Đồng bộ đa thiết bị mã hóa đầu-cuối */}
          {onOpenSync && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSync();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 transition-colors text-left cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Cloud className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span>{t.sync.menuLabel}</span>
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  syncState === 'on' ? 'bg-emerald-500' : syncState === 'error' ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-600'
                }`}
                aria-hidden="true"
              />
            </button>
          )}

          {/* Bản quyền PRO Vĩnh Viễn (Đa Nền Tảng & PPP) */}
          {onOpenStoreModal && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenStoreModal();
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/25 transition-colors text-left cursor-pointer font-semibold"
            >
              <span className="flex items-center gap-2">
                <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>{t.store.entryLabel}</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300">
                {isPro ? t.store.proActiveShort : 'PRO'}
              </span>
            </button>
          )}

          {/* Cài đặt ứng dụng PWA / Windows */}
          {canInstallPWA && onInstallPWA && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onInstallPWA();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800/60 text-emerald-600 dark:text-emerald-400 font-medium transition-colors text-left cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5 shrink-0" />
              <span>{language === 'vi' ? 'Cài đặt ứng dụng lên máy (App)' : 'Install Desktop / Mobile App'}</span>
            </button>
          )}

          {/* Tải trang HTML Offline */}
          {onDownloadHtml && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onDownloadHtml();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 transition-colors text-left cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>{language === 'vi' ? 'Tải tệp HTML độc lập chạy offline' : 'Download Offline Single HTML'}</span>
            </button>
          )}

          {/* Chính sách bảo mật */}
          <a
            href="/privacy.html"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 transition-colors text-left cursor-pointer no-underline"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>{language === 'vi' ? 'Chính sách bảo mật' : 'Privacy Policy'}</span>
          </a>

          {/* GitHub Repository */}
          <a
            href="https://github.com/NexusPulseTech/stride-tasks"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-100/80 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 transition-colors text-left cursor-pointer no-underline"
          >
            <span className="flex items-center gap-2">
              <Github className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.header.githubLabel}</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">v{APP_VERSION}</span>
          </a>
        </div>
      </div>
    </div>,
    document.body
  );
}
