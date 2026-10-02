import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  MessageSquare,
  Github,
  Mail,
  Copy,
  Check,
} from 'lucide-react';
import { triggerHaptic } from '../../../utils';

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
  const [activeTab, setActiveTab] = useState<'bug' | 'feature'>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [includeDiagnostics, setIncludeDiagnostics] = useState(true);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const targetEmail = 'khoahocteamtrieudo@gmail.com';

  const getSystemDiagnostics = () => {
    return [
      '### THÔNG SỐ HỆ THỐNG',
      `- Thời gian: ${new Date().toLocaleString('vi-VN')}`,
      `- Nền tảng: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}`,
      `- Màn hình: ${typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight} (DPR: ${window.devicePixelRatio || 1})` : 'N/A'}`,
      `- Dữ liệu: ${projectsCount} danh mục, ${totalTasksCount} công việc`,
      `- Ứng dụng: Solo Checklist v4.6 (Local-First Offline Core)`,
    ].join('\n');
  };

  const getFullReportText = () => {
    const typeLabel = activeTab === 'bug' ? 'BÁO LỖI' : 'GÓP Ý CẢI TIẾN';
    let body = `## [${typeLabel}] ${title.trim() || 'Chưa đặt tiêu đề'}\n\n`;
    body += `### Nội dung:\n${description.trim() || 'Không có mô tả chi tiết.'}\n\n`;
    if (includeDiagnostics) {
      body += `${getSystemDiagnostics()}\n`;
    }
    return body;
  };

  const handleSendEmail = () => {
    triggerHaptic();
    const subjectPrefix = activeTab === 'bug' ? '[Báo lỗi Solo Checklist]' : '[Góp ý Solo Checklist]';
    const subject = encodeURIComponent(`${subjectPrefix} ${title.trim() || 'Phản hồi người dùng'}`);
    const body = encodeURIComponent(getFullReportText());
    const mailtoUrl = `mailto:${targetEmail}?subject=${subject}&body=${body}`;
    window.location.href = mailtoUrl;
    showToast('Đang mở ứng dụng Email để gửi...');
  };

  const handleOpenGithub = () => {
    triggerHaptic();
    const issueTitle = encodeURIComponent(`[${activeTab === 'bug' ? 'Bug' : 'Feedback'}] ${title.trim() || 'Phản hồi người dùng'}`);
    const issueBody = encodeURIComponent(getFullReportText());
    const githubUrl = `https://github.com/PhuccNguyen/stride-tasks/issues/new?title=${issueTitle}&body=${issueBody}`;
    window.open(githubUrl, '_blank', 'noopener,noreferrer');
    showToast('Đang mở trang tạo GitHub Issue...');
  };

  const handleCopyReport = () => {
    triggerHaptic();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(getFullReportText());
      setCopied(true);
      showToast('Đã sao chép nội dung vào bộ nhớ tạm!');
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
              Góp ý & Báo lỗi
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-6.5 h-6.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            title="Đóng (Esc)"
            aria-label="Đóng"
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
              Báo sự cố kỹ thuật
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
              Góp ý tính năng
            </button>
          </div>
        </div>

        {/* Body Form */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
              {activeTab === 'bug' ? 'Tóm tắt sự cố:' : 'Tiêu đề đề xuất:'}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                activeTab === 'bug'
                  ? 'Ví dụ: Nút đánh dấu không phản hồi ở danh sách con...'
                  : 'Ví dụ: Thêm phím tắt di chuyển công việc...'
              }
              className="w-full h-8 px-2.5 bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-slate-800 dark:focus:border-slate-400 shadow-2xs"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
              {activeTab === 'bug' ? 'Chi tiết mô tả sự cố:' : 'Mô tả chi tiết ý tưởng:'}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder={
                activeTab === 'bug'
                  ? 'Mô tả ngắn gọn các bước bạn thực hiện khi gặp sự cố...'
                  : 'Nêu ngắn gọn cách tính năng này giúp nâng cao hiệu quả công việc...'
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
            <span>Tự động đính kèm thông số kỹ thuật (hệ điều hành, trình duyệt)</span>
          </label>
        </div>

        {/* Footer actions - Apple Clean Layout */}
        <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyReport}
            className="h-7.5 px-2.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Sao chép toàn bộ nội dung"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.5} /> : <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />}
            <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleOpenGithub}
              className="h-7.5 px-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
              title="Gửi báo cáo qua GitHub Issues"
            >
              <Github className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>GitHub</span>
            </button>
            <button
              type="button"
              onClick={handleSendEmail}
              className="h-7.5 px-3 text-xs font-medium text-white dark:text-slate-950 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-[0.98] transition-all"
              title={`Gửi email trực tiếp đến ${targetEmail}`}
            >
              <Mail className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Gửi Email</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
