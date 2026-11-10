import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { apiOrigins, buildCsp, inlineScriptHashes } from './csp';

const sha = (s: string) => `'sha256-${createHash('sha256').update(s, 'utf8').digest('base64')}'`;

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
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
  });
});
