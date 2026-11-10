import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PRICING_TIERS } from '../commerceConfig';

// Trang đích và app phải hiện cùng một giá cho cùng một quốc gia (A13)
const ROOT = resolve(import.meta.dirname, '../../..');
const read = (path: string) => readFileSync(resolve(ROOT, path), 'utf8');

function scriptPrice(source: string, tier: string): string | undefined {
  const match = source.match(new RegExp(`'${tier}': \\{ now: '([^']+)'`));
  return match?.[1];
}

function staticPrices(html: string): string[] {
  return [...html.matchAll(/<span data-price>([^<]+)<\/span>/g)].map((m) => m[1]);
}

describe('landing page regional pricing', () => {
  const script = read('public/site-pricing.js');

  it('uses the same prices as the app', () => {
    expect(scriptPrice(script, 'global-us')).toBe(PRICING_TIERS['global-us'].priceDisplay);
    expect(scriptPrice(script, 'emerging-ppp')).toBe(PRICING_TIERS['emerging-ppp'].priceDisplay);
  });

  it('starts from the global price in English and the regional price in Vietnamese', () => {
    const en = staticPrices(read('public/en/index.html'));
    const vi = staticPrices(read('public/vi/index.html'));
    expect(en.length).toBeGreaterThan(0);
    expect(vi.length).toBeGreaterThan(0);
    expect(new Set(en)).toEqual(new Set([PRICING_TIERS['global-us'].priceDisplay]));
    expect(new Set(vi)).toEqual(new Set([PRICING_TIERS['emerging-ppp'].priceDisplay]));
  });

  it('loads the pricing script on both landing pages', () => {
    for (const page of ['public/en/index.html', 'public/vi/index.html']) {
      expect(read(page)).toContain('src="/site-pricing.js');
    }
  });
});
