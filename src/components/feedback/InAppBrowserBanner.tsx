import React, { useMemo, useState } from 'react';
import { Copy, ExternalLink, X } from 'lucide-react';
import { useLanguage, formatMessage } from '../../i18n';
import { detectInAppBrowser, escapeLink, escapedHref, isEscapedVisit, platformOf } from '../../utils/inAppBrowser';

// Khóa mới, chỉ trong phiên (sessionStorage): bấm "Để sau" thì không hiện lại tới khi đóng tab
const DISMISS_KEY = 'STRIDE_INAPP_BANNER_DISMISSED_V1';

function readDismissed(): boolean {
  try {
    return window.sessionStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * A17 (bản tối thiểu): khi app mở trong trình duyệt có sẵn của TikTok, Instagram, Facebook, nhắc khách mở bằng
 * Safari/Chrome trước khi thêm việc hay bấm mua. Không tự chuyển trang, không gửi gì về máy chủ.
 */
export function InAppBrowserBanner() {
  const { t } = useLanguage();
  const s = t.inAppBrowser;

  const info = useMemo(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return null;
    if (isEscapedVisit(window.location.search)) return null;
    const app = detectInAppBrowser(navigator.userAgent);
    if (!app) return null;
    const platform = platformOf(navigator.userAgent);
    return { app, platform, link: escapeLink(window.location.href, app, platform) };
  }, []);

  const [dismissed, setDismissed] = useState(readDismissed);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  if (!info || dismissed) return null;

  const browser = info.platform === 'ios' ? 'Safari' : info.platform === 'android' ? 'Chrome' : s.yourBrowser;
  const pageLink = escapedHref(window.location.href);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageLink);
      setCopyState('copied');
      return;
    } catch {
      // Trình duyệt trong app thường chặn clipboard API: thử cách cũ
    }
    try {
      const area = document.createElement('textarea');
      area.value = pageLink;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(area);
      setCopyState(ok ? 'copied' : 'failed');
    } catch {
      setCopyState('failed');
    }
  };

  const dismiss = () => {
    try {
      window.sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // Không lưu được thì chỉ ẩn trong lần hiển thị này
    }
    setDismissed(true);
  };

  const title = formatMessage(s.title, { browser });

  return (
    <section
      aria-label={title}
      className="mb-3 rounded-xl border border-amber-300/80 dark:border-amber-800/70 bg-amber-50 dark:bg-amber-950/40 p-3 text-amber-950 dark:text-amber-100"
    >
      <div className="flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
          <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <h2 className="text-[13px] font-semibold leading-snug">{title}</h2>
          <p className="text-[12px] leading-relaxed text-amber-900 dark:text-amber-200">
            {formatMessage(s.body, { app: info.app, browser })}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {info.link && (
              <a
                href={info.link}
                className="h-10 px-3.5 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[12.5px] font-semibold"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                {formatMessage(s.openButton, { browser })}
              </a>
            )}
            <button
              type="button"
              onClick={copyLink}
              className="h-10 px-3.5 inline-flex items-center gap-1.5 rounded-lg border border-amber-400/70 dark:border-amber-700 bg-white dark:bg-transparent text-amber-900 dark:text-amber-100 text-[12.5px] font-semibold cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              {s.copyLink}
            </button>
          </div>
          <p className="text-[11.5px] text-amber-800 dark:text-amber-300">{s.manualHint}</p>
          {copyState === 'copied' && (
            <p role="status" className="text-[11.5px] font-medium">
              {formatMessage(s.copied, { browser })}
            </p>
          )}
          {copyState === 'failed' && (
            <p role="status" className="text-[11.5px]">
              {formatMessage(s.copyFailed, { browser })}{' '}
              <span className="font-mono break-all select-all">{pageLink}</span>
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="touch-hit p-1 text-amber-700/80 hover:text-amber-900 dark:text-amber-300 cursor-pointer shrink-0"
          title={s.notNow}
          aria-label={s.notNow}
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
