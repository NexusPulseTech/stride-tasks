import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  MessageSquare,
  Mail,
  Copy,
  Check,
} from 'lucide-react';
import { triggerHaptic } from '../../../utils';
import { useLanguage, formatMessage } from '../../../i18n';
import { COMMERCE_CONFIG } from '../../../config/commerceConfig';
import { APP_VERSION } from '../../../constants';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectsCount: number;
  totalTasksCount: number;
  showToast: (msg: string) => void;
}

export function FeedbackModal({
  isOpen,
  onClose,
  projectsCount,
  totalTasksCount,
  showToast,
}: FeedbackModalProps) {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'bug' | 'feature'>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Hộp thư hỗ trợ trên domain sản phẩm (chuyển tiếp về hộp thư của founder), không lộ email cá nhân
  const targetEmail = COMMERCE_CONFIG.supportEmail;
  const f = t.feedback;

  const getSystemDiagnostics = () => {
    return [
      f.diagHeading,
      formatMessage(f.diagTime, { value: new Date().toLocaleString(language === 'vi' ? 'vi-VN' : undefined) }),
      formatMessage(f.diagPlatform, { value: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A' }),
      formatMessage(f.diagScreen, {
        value:
          typeof window !== 'undefined'
            ? `${window.innerWidth}x${window.innerHeight} (DPR: ${window.devicePixelRatio || 1})`
            : 'N/A',
      }),
      formatMessage(f.diagData, { projects: projectsCount, tasks: totalTasksCount }),
      formatMessage(f.diagApp, { version: APP_VERSION }),
    ].join('\n');
  };

  const getFullReportText = () => {
    const typeLabel = activeTab === 'bug' ? f.typeBug : f.typeFeature;
    let body = `## [${typeLabel}] ${title.trim() || f.untitled}\n\n`;
    body += `### ${f.contentHeading}\n${description.trim() || f.noDescription}\n\n`;
    if (includeDiagnostics) {
      body += `${getSystemDiagnostics()}\n`;
    }
    return body;
  };

  const handleSendEmail = () => {
    triggerHaptic();
    const subjectPrefix = activeTab === 'bug' ? f.subjectBug : f.subjectFeature;
    const subject = encodeURIComponent(`${subjectPrefix} ${title.trim() || f.subjectFallback}`);
    const body = encodeURIComponent(getFullReportText());
    const mailtoUrl = `mailto:${targetEmail}?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;
    showToast(t.toast.feedbackOpeningEmail);
  };

  const handleCopyReport = () => {
    triggerHaptic();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(getFullReportText());
      setCopied(true);
      showToast(t.toast.feedbackCopied);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[99999] bg-slate-950/40 dark:bg-black/70 backdrop-blur-[3px] flex items-center justify-center p-3.5 sm:p-4 animate-in fade-in duration-100"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#161b22] rounded-2xl max-w-[460px] w-[calc(100vw-32px)] shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden max-h-[88vh] flex flex-col animate-in zoom-in-[0.98] duration-100"
      >
        {/* Header - Apple HIG Clean Style */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6.5 h-6.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
              <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <h3 className="text-[13px] sm:text-[13.5px] font-semibold text-slate-900 dark:text-slate-100">
              {f.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-6.5 h-6.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            title={t.common.closeEsc}
            aria-label={t.common.close}
          >
            <X className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        {/* Apple Segmented Control */}
        <div className="px-4 pt-3 pb-1 shrink-0">
          <div className="flex bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('bug')}
              className={`flex-1 py-1 rounded-md text-center transition-all cursor-pointer ${
                activeTab === 'bug'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {f.tabBug}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('feature')}
              className={`flex-1 py-1 rounded-md text-center transition-all cursor-pointer ${
                activeTab === 'feature'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {f.tabFeature}
            </button>
          </div>
        </div>

        {/* Body Form */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
              {activeTab === 'bug' ? f.bugTitleLabel : f.featureTitleLabel}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                activeTab === 'bug'
                  ? f.bugTitlePlaceholder
                  : f.featureTitlePlaceholder
              }
              className="w-full h-8 px-2.5 bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-slate-800 dark:focus:border-slate-400 shadow-2xs"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
              {activeTab === 'bug' ? f.bugDetailLabel : f.featureDetailLabel}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder={
                activeTab === 'bug'
                  ? f.bugDetailPlaceholder
                  : f.featureDetailPlaceholder
              }
              className="w-full p-2.5 bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-slate-800 dark:focus:border-slate-400 shadow-2xs resize-none"
            />
          </div>

          {/* Device diagnostic info row */}
          <label className="flex items-center gap-2 pt-0.5 text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeDiagnostics}
              onChange={(e) => setIncludeDiagnostics(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-0 cursor-pointer"
            />
            <span>{f.includeDiagnostics}</span>
          </label>
        </div>

        {/* Footer actions - Apple Clean Layout */}
        <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyReport}
            className="h-7.5 px-2.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
            title={f.copyTitle}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.5} /> : <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />}
            <span>{copied ? f.copied : t.common.copy}</span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSendEmail}
              className="h-7.5 px-3 text-xs font-medium text-white dark:text-slate-950 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-[0.98] transition-all"
              title={formatMessage(f.sendTitle, { email: targetEmail })}
            >
              <Mail className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>{f.send}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
