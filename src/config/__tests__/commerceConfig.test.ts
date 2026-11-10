import { describe, expect, it } from 'vitest';
import { buildPolarCheckoutUrl, PricingRegionId, PricingTier, resolveActiveTier } from '../commerceConfig';

const tier = (id: PricingRegionId): PricingTier => ({
  id,
  flag: '',
  priceUsd: 0,
  priceDisplay: id,
  channel: id === 'vn-ppp' ? 'vietqr' : 'polar',
  checkoutUrl: `https://buy.example/${id}`,
  isAvailable: true,
  keyPrefix: 'PL',
});

describe('resolveActiveTier', () => {
  const cardOnly = [tier('global-us'), tier('emerging-ppp')];

  it('dùng đúng vùng của người dùng khi vùng đó đang bán', () => {
    expect(resolveActiveTier('emerging-ppp', cardOnly)?.id).toBe('emerging-ppp');
    expect(resolveActiveTier('vn-ppp', [...cardOnly, tier('vn-ppp')])?.id).toBe('vn-ppp');
  });

  it('Việt Nam chưa bật VietQR thì hiện giá thị trường mới nổi, không rơi về giá toàn cầu', () => {
    expect(resolveActiveTier('vn-ppp', cardOnly)?.id).toBe('emerging-ppp');
  });

  it('vùng không bán và không có lựa chọn thay thế thì lấy bậc đầu tiên; không có bậc nào thì undefined', () => {
    expect(resolveActiveTier('vn-ppp', [tier('global-us')])?.id).toBe('global-us');
    expect(resolveActiveTier('global-us', [])).toBeUndefined();
  });
});

describe('buildPolarCheckoutUrl', () => {
  it('gắn reference_id vào Checkout Link để Worker nối đơn với thiết bị mua', () => {
    expect(buildPolarCheckoutUrl('https://buy.polar.sh/polar_cl_abc', 'STRK7P2QX')).toBe('https://buy.polar.sh/polar_cl_abc?reference_id=STRK7P2QX');
  });

  it('URL hỏng thì trả nguyên văn thay vì ném lỗi', () => {
    expect(buildPolarCheckoutUrl('not a url', 'STRK7P2QX')).toBe('not a url');
  });
});
