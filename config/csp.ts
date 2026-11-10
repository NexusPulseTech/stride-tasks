import { createHash } from 'node:crypto';
import type { Plugin } from 'vite';

/**
 * Content Security Policy cho bản web (task B04). Chèn bằng thẻ meta vì GitHub Pages không đặt được header.
 * Chỉ chạy khi build: dev server của Vite cần script inline cho React refresh.
 */

const SCRIPT_TAG = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const DATA_SCRIPT_TYPE = /\btype\s*=\s*["']?application\/(ld\+)?json/i;

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
    // React đặt style qua CSSOM (không bị CSP chặn); 'unsafe-inline' cho thuộc tính style tĩnh như trong <noscript>
    'style-src': ["'self'", "'unsafe-inline'"],
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
        const csp = buildCsp(inlineScriptHashes(html), apiOrigins(apiUrls));
        const meta = `<meta http-equiv="Content-Security-Policy" content="${csp}" />`;
        // Thẻ CSP phải đứng trước mọi script nên đặt ngay sau khai báo charset
        return html.replace(/(<meta\s+charset=[^>]*>)/i, `$1\n    ${meta}`);
      },
    },
  };
}
