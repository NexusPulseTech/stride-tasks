import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Upload,
  Download,
  X,
  ShieldCheck,
  RotateCcw,
  Trash2,
  History,
  Copy,
  Check,
  ArrowRightLeft,
  Search,
  Sparkles,
  ClipboardPaste,
  CheckCircle2,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { Project } from '../../../types';
import {
  getSnapshotVault,
  deepScanAllRecoverySources,
  DiscoveredRecoverySource,
  ALL_RECOVERY_STORAGE_KEYS,
} from '../../../utils/persistentStorage';

interface AutoBackupData {
  timestamp: string;
  projectCount: number;
  taskCount: number;
  historyCount?: number;
  projects: Project[];
  completedLogs?: any[];
  customStatuses?: any[];
}

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
  onTriggerImport: () => void;
  onResetSample: () => void;
  autoBackupData?: AutoBackupData | null;
  onRestoreAutoBackup?: () => void;
  onClearAllData?: () => void;
  onRestoreSnapshot?: (projects: Project[], label?: string) => void;
  onDirectPasteRestore?: (rawJson: string) => void;
  onGetFullBackupJson?: () => string;
  onDownloadSourceZip?: () => void;
  onDownloadHtml?: () => void;
  initialTab?: 'backup' | 'vault' | 'transfer';
}

interface JsonPreview {
  valid: boolean;
  projectCount: number;
  taskCount: number;
  logCount: number;
  version?: string;
  errorMessage?: string;
}

function parseAndValidateJson(raw: string): JsonPreview {
  const trimmed = raw.trim();
  if (!trimmed) return { valid: false, projectCount: 0, taskCount: 0, logCount: 0 };
  try {
    const parsed = JSON.parse(trimmed);
    let projects: any[] = [];
    let logs: any[] = [];
    let ver = '';

    if (parsed && typeof parsed === 'object' && parsed.data && Array.isArray(parsed.data.projects)) {
      projects = parsed.data.projects;
      logs = Array.isArray(parsed.data.completedLogs) ? parsed.data.completedLogs : [];
      ver = parsed.version || '2.1';
    } else if (Array.isArray(parsed) && parsed.length > 0) {
      projects = parsed;
    } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.projects)) {
      projects = parsed.projects;
      logs = Array.isArray(parsed.completedLogs) ? parsed.completedLogs : [];
    } else {
      return {
        valid: false,
        projectCount: 0,
        taskCount: 0,
        logCount: 0,
        errorMessage: 'JSON không chứa danh sách dự án (cần có mảng projects hoặc data).',
      };
    }

    let totalTasks = 0;
    projects.forEach((p) => {
      totalTasks += (p.tasks || []).length;
    });

    return {
      valid: true,
      projectCount: projects.length,
      taskCount: totalTasks,
      logCount: logs.length,
      version: ver,
    };
  } catch (e: any) {
    return {
      valid: false,
      projectCount: 0,
      taskCount: 0,
      logCount: 0,
      errorMessage: 'Cú pháp JSON không hợp lệ hoặc chuỗi bị đứt đoạn khi copy.',
    };
  }
}

export function BackupModal({
  isOpen,
  onClose,
  onExport,
  onTriggerImport,
  onResetSample,
  autoBackupData,
  onRestoreAutoBackup,
  onClearAllData,
  onRestoreSnapshot,
  onDirectPasteRestore,
  onGetFullBackupJson,
  onDownloadSourceZip,
  onDownloadHtml,
  initialTab = 'backup',
}: BackupModalProps) {
  const [pasteText, setPasteText] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPasteArea, setShowPasteArea] = useState(false);
  const [activeTab, setActiveTab] = useState<'backup' | 'vault' | 'transfer'>(initialTab);
  const [discoveredSources, setDiscoveredSources] = useState<DiscoveredRecoverySource[]>([]);
  const [hasScanned, setHasScanned] = useState(false);

  const snapshots = getSnapshotVault();

  const formattedAutoDate = autoBackupData?.timestamp
    ? new Date(autoBackupData.timestamp).toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : null;

  const jsonPreview = useMemo(() => parseAndValidateJson(pasteText), [pasteText]);

  const getCleanJsonPayload = (): string => {
    if (onGetFullBackupJson) {
      try {
        const full = onGetFullBackupJson();
        if (full) return full;
      } catch (e) {}
    }
    for (const key of ALL_RECOVERY_STORAGE_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw) return raw;
    }
    return '';
  };

  const handleCopyClipboardBackup = () => {
    try {
      const candidate = getCleanJsonPayload();
      if (!candidate) return;

      if (navigator?.clipboard?.writeText) {
        navigator.clipboard
          .writeText(candidate)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
          })
          .catch(() => {
            fallbackCopy(candidate);
          });
      } else {
        fallbackCopy(candidate);
      }
    } catch (e) {
      const candidate = getCleanJsonPayload();
      if (candidate) fallbackCopy(candidate);
    }
  };

  const fallbackCopy = (text: string) => {
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.left = '-9999px';
      el.style.top = '-9999px';
      document.body.appendChild(el);
      el.focus();
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {}
  };

  const handlePasteFromClipboard = async () => {
    setShowPasteArea(true);
    try {
      if (navigator?.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setPasteText(text.trim());
        }
      }
    } catch (e) {
      // Browser permissions or mobile constraints
    }
  };

  const handleApplyPaste = () => {
    if (!pasteText.trim()) return;
    if (onDirectPasteRestore) {
      onDirectPasteRestore(pasteText.trim());
      setPasteText('');
      setShowPasteArea(false);
    }
  };

  const handleRunDeepScan = () => {
    const results = deepScanAllRecoverySources();
    setDiscoveredSources(results);
    setHasScanned(true);
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[99999] bg-slate-950/40 dark:bg-black/70 backdrop-blur-[3px] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-100"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#161b22] rounded-2xl max-w-[520px] w-[calc(100vw-32px)] shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden max-h-[88vh] flex flex-col animate-in zoom-in-[0.98] duration-100"
      >
        {/* Header */}
        <div className="px-4.5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 shrink-0" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[13px] sm:text-[14px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                Bảo Vệ & Đồng Bộ Dữ Liệu
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-normal truncate mt-0.5">
                Cơ chế Zero Data Loss · Snapshot Vault · Chuyển đổi tức thời
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Đóng (Esc)"
            aria-label="Đóng"
          >
            <X className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-4.5 pt-2 pb-0 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 text-xs shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`pb-2 font-medium border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'backup'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>Sao lưu & Đồng bộ tức thời</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vault')}
            className={`pb-2 font-medium border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'vault'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <History className="w-3 h-3" />
            <span>Snapshot Vault ({snapshots.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('transfer')}
            className={`pb-2 font-medium border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'transfer'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <ArrowRightLeft className="w-3 h-3" />
            <span>Chuyển Domain / Cứu Hộ</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-3 overflow-y-auto overflow-x-hidden text-xs text-slate-600 dark:text-slate-300">
          {activeTab === 'backup' && (
            <>
              {/* Mục 1: Đồng bộ tức thời siêu tốc qua Clipboard (Không cần tải file) */}
              <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 rounded-xl space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>Đồng bộ nhanh Mobile ↔ Máy tính (Copy / Paste Text)</span>
                    </div>
                    <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 mt-0.5 leading-snug">
                      Không cần tải file về máy. Chỉ cần Copy mã dữ liệu và Paste sang thiết bị khác là xong!
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                  {/* Nút 1: Copy Clipboard */}
                  <button
                    type="button"
                    onClick={handleCopyClipboardBackup}
                    className="h-8.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-[0.98] cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300 shrink-0 animate-bounce" />
                        <span className="text-[11.5px]">Đã sao chép vào Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-[11.5px]">1-Chạm: Sao chép mã JSON</span>
                      </>
                    )}
                  </button>

                  {/* Nút 2: Mở ô Dán */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasteArea(!showPasteArea);
                      if (!showPasteArea && !pasteText) {
                        handlePasteFromClipboard();
                      }
                    }}
                    className="h-8.5 px-3 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-blue-900 dark:text-blue-200 font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-[0.98] cursor-pointer"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="text-[11.5px]">{showPasteArea ? 'Thu gọn ô dán dữ liệu' : 'Dán & Khôi phục dữ liệu'}</span>
                  </button>
                </div>

                {/* Vùng Paste & Preview */}
                {showPasteArea && (
                  <div className="p-2.5 bg-white dark:bg-slate-900 border border-blue-100 dark:border-blue-900/50 rounded-lg space-y-2 animate-in fade-in zoom-in-[0.99] duration-150">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <span>Dán chuỗi JSON đã sao chép từ máy khác:</span>
                      </label>
                      <button
                        type="button"
                        onClick={handlePasteFromClipboard}
                        className="text-[10.5px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <ClipboardPaste className="w-3 h-3" />
                        <span>Dán từ clipboard</span>
                      </button>
                    </div>

                    <textarea
                      rows={3}
                      value={pasteText}
                      onChange={(e) => setPasteText(e.target.value)}
                      placeholder='Dán đoạn text JSON (bắt đầu bằng { "version": ... } hoặc [ { "id": ... } ]) vào đây...'
                      className="w-full p-2 bg-slate-50 dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] font-mono resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
                    />

                    {/* Live Preview Result */}
                    {pasteText.trim().length > 0 && (
                      <div className="pt-0.5">
                        {jsonPreview.valid ? (
                          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center justify-between gap-2">
                            <div className="min-w-0 flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 text-[11px] font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span className="truncate">
                                Hợp lệ: {jsonPreview.projectCount} dự án · {jsonPreview.taskCount} việc
                                {jsonPreview.logCount > 0 ? ` · ${jsonPreview.logCount} lịch sử` : ''}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={handleApplyPaste}
                              className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-md text-[11px] flex items-center gap-1 transition-all shrink-0 cursor-pointer shadow-xs active:scale-[0.98]"
                            >
                              <RotateCcw className="w-3 h-3 shrink-0" />
                              <span>Áp dụng ngay</span>
                            </button>
                          </div>
                        ) : (
                          <div className="p-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg flex items-center gap-1.5 text-rose-700 dark:text-rose-300 text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                            <span>{jsonPreview.errorMessage || 'Dữ liệu JSON không đúng cấu trúc.'}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Mục 2: Bộ nhớ kép an toàn */}
              <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/60 rounded-xl space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                      <span>Bộ nhớ kép an toàn (IndexedDB + LocalStorage)</span>
                    </div>
                    <p className="text-[11px] text-emerald-800/80 dark:text-emerald-400/80 mt-1 leading-snug">
                      {autoBackupData ? (
                        <>
                          Bản sao lưu gần nhất: <span className="font-semibold">{formattedAutoDate}</span> ({autoBackupData.projectCount} dự án · {autoBackupData.taskCount} việc).
                        </>
                      ) : (
                        <>Dữ liệu được tự động bảo vệ an toàn trên trình duyệt và tự động phục hồi nếu có sự cố.</>
                      )}
                    </p>
                  </div>
                  {autoBackupData && onRestoreAutoBackup && (
                    <button
                      type="button"
                      onClick={onRestoreAutoBackup}
                      className="h-7 px-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-medium rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-2xs active:scale-[0.98] shrink-0"
                    >
                      <RotateCcw className="w-3 h-3 shrink-0" />
                      <span>Khôi phục</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Mục 3: Xuất file JSON truyền thống */}
              <div className="p-3 bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5 shrink-0 text-slate-700 dark:text-slate-300" strokeWidth={1.5} />
                    <span>Xuất tệp sao lưu (.JSON)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Lưu toàn bộ dự án, việc con, tiến độ và lịch sử vào ổ đĩa
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onExport}
                  className="h-7.5 px-3 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-950 text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-xs active:scale-[0.98] shrink-0"
                >
                  <Download className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                  <span>Tải .json</span>
                </button>
              </div>

              {/* Mục 4: Khôi phục từ tệp JSON */}
              <div className="p-3 bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 shrink-0 text-slate-700 dark:text-slate-300" strokeWidth={1.5} />
                    <span>Khôi phục từ tệp (.JSON)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Nhập dữ liệu sao lưu từ tệp tin đã lưu trước đó
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onTriggerImport}
                  className="h-7.5 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs active:scale-[0.98] shrink-0"
                >
                  <Upload className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                  <span>Chọn tệp...</span>
                </button>
              </div>
            </>
          )}

          {activeTab === 'vault' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Hệ thống tự động lưu trữ tới 20 phiên bản gần nhất vào Snapshot Vault:
                </p>
                <button
                  type="button"
                  onClick={handleRunDeepScan}
                  className="h-6.5 px-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded text-[10.5px] font-medium flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Search className="w-3 h-3" />
                  <span>Quét sâu mọi bản lưu</span>
                </button>
              </div>

              {hasScanned && discoveredSources.length > 0 && (
                <div className="p-2.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 font-semibold text-blue-900 dark:text-blue-300 text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Tìm thấy {discoveredSources.length} nguồn dữ liệu khả dụng trên máy của bạn:</span>
                  </div>
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto">
                    {discoveredSources.map((src, i) => (
                      <div
                        key={i}
                        className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between gap-2 text-[10.5px]"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {src.label} ({src.taskCount} việc · {src.projectCount} dự án)
                          </p>
                          <p className="text-slate-400 text-[10px]">
                            {new Date(src.timestamp).toLocaleString('vi-VN')}
                          </p>
                        </div>
                        {onRestoreSnapshot && (
                          <button
                            type="button"
                            onClick={() => onRestoreSnapshot(src.projects, src.label)}
                            className="h-6 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-medium flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span>Khôi phục</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {snapshots.length === 0 ? (
                <div className="p-6 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  Chưa có bản snapshot nào trong phiên này. Hãy nhấp &ldquo;Quét sâu mọi bản lưu&rdquo; ở góc trên để tìm lại các bản lưu cũ!
                </div>
              ) : (
                <div className="space-y-1.5 max-h-[260px] overflow-y-auto">
                  {snapshots.map((snap) => (
                    <div
                      key={snap.id}
                      className="p-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 rounded-lg flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 text-[11px] truncate">
                          {snap.label || 'Tự động sao lưu'} · {snap.taskCount} việc
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(snap.timestamp).toLocaleString('vi-VN')}
                        </p>
                      </div>
                      {onRestoreSnapshot && (
                        <button
                          type="button"
                          onClick={() => onRestoreSnapshot(snap.projects, snap.label)}
                          className="h-6.5 px-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-medium rounded flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Khôi phục</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'transfer' && (
            <div className="space-y-3">
              <div className="p-2.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/60 rounded-xl text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
                💡 <strong>Chuyển dữ liệu giữa các Domain / Cứu dữ liệu cũ:</strong>
                Khi bạn chuyển từ domain cũ (như <code>task.nexuspulsetech.xyz</code> hoặc <code>nexuspulsetech.github.io</code>) sang <code>tasks.nexuspulsetech.xyz</code>, trình duyệt phân tách bộ nhớ riêng.
                <br />
                <strong>Cách lấy lại toàn bộ công việc cũ:</strong>
                <ol className="list-decimal pl-4 mt-1 space-y-0.5">
                  <li>Mở tab trình duyệt chứa đường dẫn cũ mà bạn từng tạo task.</li>
                  <li>Mở menu ➔ Bảo Vệ Dữ Liệu ➔ Bấm nút sao chép dữ liệu bên dưới.</li>
                  <li>Quay lại tab mới này và Dán chuỗi đó vào ô để khôi phục ngay lập tức!</li>
                </ol>
              </div>

              <div>
                <button
                  type="button"
                  onClick={handleCopyClipboardBackup}
                  className="w-full h-8.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã sao chép mã dữ liệu vào bộ nhớ tạm!' : '1-Click: Sao chép toàn bộ dữ liệu ra Clipboard'}</span>
                </button>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    Dán chuỗi JSON khôi phục trực tiếp vào đây:
                  </label>
                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    className="text-[10.5px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <ClipboardPaste className="w-3 h-3" />
                    <span>Dán từ clipboard</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Dán chuỗi dữ liệu JSON vào đây..."
                  className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                />

                {pasteText.trim().length > 0 && jsonPreview.valid && (
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Hợp lệ: {jsonPreview.projectCount} dự án · {jsonPreview.taskCount} việc</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleApplyPaste}
                  disabled={!pasteText.trim() || !jsonPreview.valid}
                  className="w-full h-8 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Áp dụng khôi phục dữ liệu ngay</span>
                </button>
              </div>
            </div>
          )}

          {/* Mục Đặt lại & Xóa toàn bộ */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500 dark:text-slate-400">Dữ liệu mẫu chuẩn:</span>
              <button
                type="button"
                onClick={onResetSample}
                className="text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 underline cursor-pointer transition-colors"
              >
                Khôi phục dữ liệu mẫu ban đầu
              </button>
            </div>

            {onClearAllData && (
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 dark:text-slate-500">Làm mới hoàn toàn:</span>
                <button
                  type="button"
                  onClick={onClearAllData}
                  className="text-rose-500 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3 h-3 shrink-0" />
                  <span>Xóa toàn bộ dự án & việc</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4.5 py-2.5 sm:py-3 bg-slate-50/70 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-7.5 px-3.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-950 rounded-lg text-xs font-medium cursor-pointer shadow-xs active:scale-[0.98] transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
