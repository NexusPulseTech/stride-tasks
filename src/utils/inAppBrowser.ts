/**
 * Nhận diện trình duyệt có sẵn trong app mạng xã hội (A17, bản tối thiểu) và dựng link thoát ra Safari/Chrome.
 *
 * Vì sao: dữ liệu Stride nằm trong bộ nhớ của trình duyệt đang mở. Trình duyệt trong TikTok, Instagram, Facebook
 * có bộ nhớ riêng, khách mở lại bằng Safari/Chrome sẽ thấy app trống; trang thanh toán mở bằng cửa sổ mới cũng có thể
 * bị chặn. Mẫu User-Agent theo mã nguồn thư viện inapp-spy 5.0.10 (regexAppName.ts); Zalo chưa có vì chưa đo UA thật.
 * Link thoát chỉ dùng khi khách bấm (Chrome và iOS cần cử chỉ người dùng), không tự chuyển trang.
 */

export type InAppApp = 'TikTok' | 'Instagram' | 'Threads' | 'Messenger' | 'Facebook';
export type Platform = 'ios' | 'android' | 'other';

/** Tham số gắn vào link thoát: thấy nó thì không hiện banner nữa (tránh báo nhầm sau khi đã thoát). */
export const ESCAPE_PARAM = 'ext';

const RULES: [InAppApp, RegExp][] = [
  ['TikTok', /musical_ly|Bytedance/i],
  ['Instagram', /Instagram/i],
  ['Threads', /Barcelona/i],
  ['Messenger', /Messenger|Orca-Android/i],
  ['Facebook', /FBAN|FBAV|FB_IAB|FB4A|\bFacebook\b/i],
];

export function detectInAppBrowser(userAgent: string): InAppApp | null {
  const ua = String(userAgent || '');
  for (const [app, pattern] of RULES) {
    if (pattern.test(ua)) return app;
  }
  return null;
}

export function platformOf(userAgent: string): Platform {
  const ua = String(userAgent || '');
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'other';
}

export function isEscapedVisit(search: string): boolean {
  try {
    return new URLSearchParams(search).get(ESCAPE_PARAM) === '1';
  } catch {
    return false;
  }
}

/** Link hiện tại kèm ?ext=1, bỏ phần #. */
export function escapedHref(currentHref: string): string {
  const url = new URL(currentHref);
  url.searchParams.set(ESCAPE_PARAM, '1');
  url.hash = '';
  return url.toString();
}

/**
 * Link mở trang này bằng trình duyệt thật, hoặc null nếu không có cách tin được (khi đó chỉ còn hướng dẫn ••• và Copy link).
 * - Android: intent của Chrome, có link dự phòng (chỉ nhận https) nếu máy không có Chrome.
 * - iPhone trong Instagram: instagram://extbrowser (Instagram mở bằng trình duyệt ngoài, có hộp xác nhận).
 * - iPhone nơi khác (iOS 17 trở lên): x-safari-https://.
 */
export function escapeLink(currentHref: string, app: InAppApp, platform: Platform): string | null {
  const target = new URL(escapedHref(currentHref));
  if (target.protocol !== 'https:') return null;
  const rest = `${target.host}${target.pathname}${target.search}`;
  if (platform === 'android') {
    return `intent://${rest}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(target.toString())};end`;
  }
  if (platform === 'ios') {
    if (app === 'Instagram') return `instagram://extbrowser/?url=${encodeURIComponent(target.toString())}`;
    return `x-safari-https://${rest}`;
  }
  return null;
}
