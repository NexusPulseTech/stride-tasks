import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Cloud, RefreshCw, Copy, Link2, ShieldCheck, Eye, EyeOff, Unplug, Trash2, Loader2, AlertTriangle, Crown } from 'lucide-react';
import { useLanguage, formatMessage, Translations } from '../../../i18n';
import type { SyncApi } from '../useSync';
import type { SyncErrorCode } from '../syncClient';
import { COMMERCE_CONFIG } from '../../../config/commerceConfig';

export interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  sync: SyncApi;
  /** Cho phép bật đồng bộ (PRO, hoặc đang thử nghiệm khi paywall tắt) */
  canUse: boolean;
  onOpenUpgrade?: () => void;
  /** Mã nhận từ link #sync=… để điền sẵn */
  prefillCode?: string | null;
  showToast: (msg: string) => void;
}

function errorText(s: Translations['sync'], code: SyncErrorCode | 'invalid_code' | null): string | null {
  switch (code) {
    case null:
      return null;
    case 'offline':
      return s.errOffline;
    case 'license_required':
      return s.errLicense;
    case 'vault_limit':
      return s.errVaultLimit;
    case 'too_large':
      return s.errTooLarge;
    case 'vault_not_found':
      return s.errNotFound;
    case 'decrypt_failed':
      return s.errDecrypt;
    case 'conflict_retry_exhausted':
      return s.errConflict;
    case 'invalid_code':
      return s.errInvalidCode;
    default:
      return s.errServer;
  }
}

export function SyncModal({ isOpen, onClose, sync, canUse, onOpenUpgrade, prefillCode, showToast }: SyncModalProps) {
  const { t, language } = useLanguage();
  const s = t.sync;
  const [joinInput, setJoinInput] = useState(prefillCode || '');
  const [localError, setLocalError] = useState<'invalid_code' | null>(null);
  const [busy, setBusy] = useState(false);
  const [revealCode, setRevealCode] = useState(false);
  const [confirming, setConfirming] = useState<'disconnect' | 'delete' | null>(null);

  useEffect(() => {
    if (prefillCode) setJoinInput(prefillCode);
  }, [prefillCode]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const copy = (text: string, message: string) => {
    navigator.clipboard?.writeText(text).then(() => showToast(message), () => {});
  };

  const run = async (action: () => Promise<boolean | 'invalid_code'>, successMessage: string) => {
    setBusy(true);
    setLocalError(null);
    const result = await action();
    setBusy(false);
    if (result === 'invalid_code') setLocalError('invalid_code');
    else if (result) showToast(successMessage);
  };

  const formattedTime = sync.lastSyncedAt
    ? new Date(sync.lastSyncedAt).toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' })
    : null;
  const message = errorText(s, localError ?? sync.error);
  const shareLink = sync.formattedCode ? `${COMMERCE_CONFIG.appOrigin}/#sync=${sync.formattedCode}` : '';

  return createPortal(
    <div
      className="fixed inset-0 z-[10004] flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={s.title}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-[#11141c] text-slate-800 dark:text-slate-100 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#B20015] text-white flex items-center justify-center shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold">{s.title}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{s.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 cursor-pointer shrink-0"
            aria-label={t.store.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <ul className="space-y-1.5">
            {[s.benefit1, s.benefit2, s.benefit3].map((benefit) => (
              <li key={benefit} className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>

          {!sync.enabled && !canUse && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 space-y-2">
              <p className="text-amber-700 dark:text-amber-300 font-medium">{s.proRequired}</p>
              {onOpenUpgrade && (
                <button
                  type="button"
                  onClick={onOpenUpgrade}
                  className="px-3 py-1.5 rounded-lg bg-[#B20015] hover:bg-[#9C0012] text-white font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>{s.upgradeButton}</span>
                </button>
              )}
            </div>
          )}

          {!sync.enabled && canUse && (
            <div className="space-y-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => run(sync.createVault, s.enabledToast)}
                className="w-full py-2.5 rounded-xl bg-[#B20015] hover:bg-[#9C0012] disabled:opacity-60 text-white font-bold inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cloud className="w-4 h-4" />}
                <span>{s.createButton}</span>
              </button>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (joinInput.trim()) run(() => sync.joinVault(joinInput), s.joinedToast);
                }}
                className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 space-y-2"
              >
                <label htmlFor="sync-join-code" className="font-semibold text-slate-700 dark:text-slate-200 block">
                  {s.joinTitle}
                </label>
                <div className="flex gap-2">
                  <input
                    id="sync-join-code"
                    value={joinInput}
                    onChange={(e) => setJoinInput(e.target.value)}
                    placeholder={s.joinPlaceholder}
                    spellCheck={false}
                    autoComplete="off"
                    className="flex-1 min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 font-mono text-[11px] uppercase outline-none focus:border-sky-500"
                  />
                  <button
                    type="submit"
                    disabled={busy || !joinInput.trim()}
                    className="px-3 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold disabled:opacity-50 cursor-pointer"
                  >
                    {s.joinButton}
                  </button>
                </div>
              </form>
            </div>
          )}

          {sync.enabled && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                <span className="flex items-center gap-2 font-medium" aria-live="polite">
                  {sync.status === 'syncing' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-sky-500" />
                  ) : (
                    <Cloud className={`w-4 h-4 ${sync.status === 'error' ? 'text-rose-500' : 'text-emerald-500'}`} />
                  )}
                  {sync.status === 'syncing'
                    ? s.statusSyncing
                    : formattedTime
                    ? formatMessage(s.statusSynced, { time: formattedTime })
                    : s.statusNever}
                </span>
                <button
                  type="button"
                  disabled={sync.status === 'syncing'}
                  onClick={() => void sync.syncNow()}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{s.syncNow}</span>
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{s.codeTitle}</span>
                  <button
                    type="button"
                    onClick={() => setRevealCode((v) => !v)}
                    className="text-slate-500 hover:text-slate-800 dark:hover:text-white inline-flex items-center gap-1 cursor-pointer"
                  >
                    {revealCode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{revealCode ? s.hideCode : s.showCode}</span>
                  </button>
                </div>
                <div className="font-mono text-sm tracking-wider break-all select-all bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2">
                  {revealCode ? sync.formattedCode : '•••••-•••••-•••••-•••••-••••••'}
                </div>
                <p className="text-[11px] text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{s.codeWarning}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => sync.formattedCode && copy(sync.formattedCode, s.codeCopied)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{s.copyCode}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => copy(shareLink, s.linkCopied)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>{s.copyLink}</span>
                  </button>
                </div>
              </div>

              {sync.clockSkewWarning && (
                <p className="text-[11px] text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{s.clockSkew}</span>
                </p>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (confirming !== 'disconnect') return setConfirming('disconnect');
                    setConfirming(null);
                    sync.disconnect();
                    showToast(s.disconnectedToast);
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Unplug className="w-3.5 h-3.5" />
                  <span>{confirming === 'disconnect' ? s.disconnectConfirm : s.disconnect}</span>
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (confirming !== 'delete') return setConfirming('delete');
                    setConfirming(null);
                    void run(sync.deleteCloudCopy, s.deletedToast);
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-rose-300 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{confirming === 'delete' ? s.deleteCloudConfirm : s.deleteCloud}</span>
                </button>
              </div>
            </div>
          )}

          {message && (
            <p className="text-rose-600 dark:text-rose-400 font-medium" role="alert">
              {message}
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
