import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { apiOrigins, buildCsp, cspPlugin, FRAME_GUARD_SCRIPT, inlineScriptHashes } from './csp';

const sha = (s: string) => `'sha256-${createHash('sha256').update(s, 'utf8').digest('base64')}'`;

/** Chạy đúng bước transformIndexHtml mà Vite gọi lúc build */
const transform = (html: string): string => {
  const hook = cspPlugin(['https://tasks-api.nexuspulsetech.xyz']).transformIndexHtml;
  if (!hook || typeof hook === 'function') throw new Error('transformIndexHtml phải có dạng { order, handler }');
  return (hook.handler as unknown as (h: string) => string)(html);
};

describe('inlineScriptHashes', () => {
  it('băm đúng script inline, giữ nguyên khoảng trắng', () => {
    const body = "\n      (function() { document.documentElement.classList.add('dark'); })();\n    ";
    expect(inlineScriptHashes(`<head><script>${body}</script></head>`)).toEqual([sha(body)]);
  });

  it('bỏ qua script có src, khối JSON-LD và script rỗng', () => {
    const html = [
      '<script type="module" crossorigin src="/assets/index.js"></script>',
      '<script type="application/ld+json">{"@type":"WebApplication"}</script>',
      '<script defer src="https://static.cloudflareinsights.com/beacon.min.js"></script>',
      '<script>   </script>',
    ].join('');
    expect(inlineScriptHashes(html)).toEqual([]);
  });
});

describe('apiOrigins', () => {
  it('chỉ lấy origin https hợp lệ và bỏ trùng', () => {
    expect(
      apiOrigins(['https://tasks-api.nexuspulsetech.xyz', 'https://tasks-api.nexuspulsetech.xyz/v1/', 'http://localhost:3000/__worker', '', undefined, 'not a url'])
    ).toEqual(['https://tasks-api.nexuspulsetech.xyz']);
  });
});

describe('buildCsp', () => {
  it('chặn mặc định, chỉ mở đúng nguồn app cần', () => {
    const csp = buildCsp(["'sha256-abc'"], ['https://tasks-api.nexuspulsetech.xyz']);
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'sha256-abc' https://static.cloudflareinsights.com");
    expect(csp).toContain("connect-src 'self' https://tasks-api.nexuspulsetech.xyz https://cloudflareinsights.com");
    expect(csp).toContain("object-src 'none'");
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).not.toContain("'unsafe-inline'");
    expect(csp).toContain("style-src 'self';");
  });
});

describe('cspPlugin', () => {
  const page = '<html><head>\n    <meta charset="UTF-8" />\n    <script>theme()</script>\n  </head><body></body></html>';

  it('đặt thẻ CSP đầu tiên, ngay sau là script chống nhúng, và băm cả hai script inline', () => {
    const out = transform(page);
    const csp = /<meta http-equiv="Content-Security-Policy" content="([^"]+)"/.exec(out)?.[1] ?? '';
    expect(csp).toContain(sha(FRAME_GUARD_SCRIPT));
    expect(csp).toContain(sha('theme()'));
    expect(csp).toContain("connect-src 'self' https://tasks-api.nexuspulsetech.xyz");
    const order = ['<meta charset', 'http-equiv="Content-Security-Policy"', FRAME_GUARD_SCRIPT, 'theme()'].map((s) => out.indexOf(s));
    expect(order.every((at, i) => at >= 0 && (i === 0 || at > order[i - 1]))).toBe(true);
    expect(out.split(FRAME_GUARD_SCRIPT)).toHaveLength(2);
  });

  it('thiếu <meta charset> thì dừng build thay vì phát hành bản không có CSP', () => {
    expect(() => transform('<html><head><script>theme()</script></head></html>')).toThrow(/meta charset/);
  });
});
