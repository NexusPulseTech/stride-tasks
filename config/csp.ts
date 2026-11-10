import { createHash } from 'node:crypto';
import type { Plugin } from 'vite';

/**
 * Content Security Policy cho bản web (task B04). Chèn bằng thẻ meta vì GitHub Pages không đặt được header.
 * Chỉ chạy khi build: dev server của Vite cần script inline cho React refresh.
 */

const SCRIPT_TAG = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const DATA_SCRIPT_TYPE = /\btype\s*=\s*["']?application\/(ld\+)?json/i;
const CHARSET_META = /(<meta\s+charset=[^>]*>)/i;

/**
 * Thẻ meta CSP không nhận frame-ancestors, nên chống clickjacking bằng script: trang bị nhúng vào khung thì ẩn toàn bộ
 * và thử thoát ra cửa sổ chính. Script không chạy thì trang vẫn hiện bình thường, app không bao giờ bị trắng vì lớp này.
 * Header frame-ancestors thật đặt ở Cloudflare (runbook triển khai, mục header bảo mật).
 */
export const FRAME_GUARD_SCRIPT =
  "if(window.top!==window.self){document.documentElement.style.display='none';try{window.top.location.href=window.self.location.href}catch(e){}}";

/** SHA-256 của mọi script inline được thực thi; bỏ qua script có src và khối dữ liệu JSON-LD */
export function inlineScriptHashes(html: string): string[] {
  const hashes: string[] = [];
  for (const [, attrs, body] of html.matchAll(SCRIPT_TAG)) {
    if (/\bsrc\s*=/i.test(attrs) || DATA_SCRIPT_TYPE.test(attrs) || !body.trim()) continue;
    hashes.push(`'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`);
  }
  return hashes;
}

/** Origin hợp lệ (https) từ các URL API cấu hình lúc build, để connect-src luôn khớp với nơi app gọi tới */
export function apiOrigins(urls: Array<string | undefined>): string[] {
  const origins = new Set<string>();
  for (const url of urls) {
    try {
      const parsed = new URL(String(url || ''));
      if (parsed.protocol === 'https:') origins.add(parsed.origin);
    } catch {
      // URL rỗng hoặc sai: bỏ qua
    }
  }
  return [...origins];
}

export function buildCsp(scriptHashes: string[], connectOrigins: string[]): string {
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': ["'self'", ...scriptHashes, 'https://static.cloudflareinsights.com'],
    // React đặt style qua CSSOM nên không cần 'unsafe-inline'; HTML tĩnh dùng class thay cho thuộc tính style
    'style-src': ["'self'"],
    'img-src': ["'self'", 'data:', 'blob:', 'https://img.vietqr.io'],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'", ...connectOrigins, 'https://cloudflareinsights.com'],
    'manifest-src': ["'self'"],
    'worker-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  };
  return Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(' ')}`)
    .join('; ');
}

export function cspPlugin(apiUrls: Array<string | undefined>): Plugin {
  return {
    name: 'stride-csp',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        // Thiếu charset thì không có chỗ chèn: dừng build, không bao giờ phát hành bản thiếu CSP
        if (!CHARSET_META.test(html)) throw new Error('stride-csp: index.html thiếu <meta charset>, không chèn được CSP');
        // Chèn script chống nhúng trước để mã băm của nó có trong CSP
        const guarded = html.replace(CHARSET_META, `$1\n    <script>${FRAME_GUARD_SCRIPT}</script>`);
        const csp = buildCsp(inlineScriptHashes(guarded), apiOrigins(apiUrls));
        const meta = `<meta http-equiv="Content-Security-Policy" content="${csp}" />`;
        // Thẻ CSP phải đứng trước mọi script nên đặt ngay sau khai báo charset
        return guarded.replace(CHARSET_META, `$1\n    ${meta}`);
      },
    },
  };
}
