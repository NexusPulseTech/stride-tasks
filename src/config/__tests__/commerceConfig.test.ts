import { describe, expect, it } from 'vitest';
import {
  buildPolarCheckoutUrl,
  isGeoPricingFresh,
  parseGeoPricing,
  PricingRegionId,
  PricingTier,
  resolveTier,
} from '../commerceConfig';

const tier = (id: PricingRegionId, isAvailable = true): PricingTier => ({
  id,
  priceUsd: 0,
  priceDisplay: id,
  channel: id === 'vn-ppp' ? 'vietqr' : 'polar',
  checkoutUrl: isAvailable ? `https://buy.example/${id}` : '',
  isAvailable,
  keyPrefix: 'PL',
});
const tiers = (vietQr = false, emergingInBuild = true) => ({
  'vn-ppp': tier('vn-ppp', vietQr),
  'emerging-ppp': tier('emerging-ppp', emergingInBuild),
  'global-us': tier('global-us'),
});
const REGIONAL = 'https://buy.polar.sh/polar_cl_regional';

describe('resolveTier: đúng một giá theo vùng máy chủ xác định', () => {
  it('nước thu nhập cao chỉ thấy giá quốc tế, kể cả khi có link giá vùng', () => {
    expect(resolveTier('global-us', REGIONAL, tiers())?.id).toBe('global-us');
  });

  it('nước mới nổi dùng link giá vùng do máy chủ trả, ưu tiên hơn link trong bundle', () => {
    const t = resolveTier('emerging-ppp', REGIONAL, tiers());
    expect(t?.id).toBe('emerging-ppp');
    expect(t?.checkoutUrl).toBe(REGIONAL);
    expect(t?.channel).toBe('polar');
  });

  it('máy chủ chưa trả link thì dùng link trong bundle; thiếu cả hai thì giá quốc tế', () => {
    expect(resolveTier('emerging-ppp', null, tiers())?.checkoutUrl).toBe('https://buy.example/emerging-ppp');
    expect(resolveTier('emerging-ppp', null, tiers(false, false))?.id).toBe('global-us');
  });

  it('Việt Nam: VietQR nếu đã bật, chưa bật thì giá thị trường mới nổi', () => {
    expect(resolveTier('vn-ppp', REGIONAL, tiers(true))?.id).toBe('vn-ppp');
    expect(resolveTier('vn-ppp', REGIONAL, tiers(false))?.checkoutUrl).toBe(REGIONAL);
  });
});

describe('parseGeoPricing: khớp hợp đồng GET /v1/pricing', () => {
  const now = new Date('2026-11-10T08:00:00.000Z');

  it('nhận đúng phản hồi của Worker và gắn thời điểm lấy', () => {
    expect(parseGeoPricing({ country: 'IN', tier: 'emerging-ppp', regionalCheckoutUrl: REGIONAL }, now)).toEqual({
      country: 'IN',
      tier: 'emerging-ppp',
      regionalCheckoutUrl: REGIONAL,
      fetchedAt: now.toISOString(),
    });
  });

  it('bậc lạ, dữ liệu hỏng thì bỏ; link không phải https và mã nước sai thì thành null', () => {
    expect(parseGeoPricing({ country: 'IN', tier: 'cheap', regionalCheckoutUrl: null })).toBeNull();
    expect(parseGeoPricing('nope')).toBeNull();
    expect(parseGeoPricing(null)).toBeNull();
    expect(parseGeoPricing({ country: 'india', tier: 'global-us', regionalCheckoutUrl: 'javascript:alert(1)' }, now)).toMatchObject({
      country: null,
      regionalCheckoutUrl: null,
    });
  });

  it('kết quả đã nhớ hết hạn sau 7 ngày', () => {
    const geo = parseGeoPricing({ country: 'US', tier: 'global-us', regionalCheckoutUrl: null, fetchedAt: '2026-11-01T08:00:00.000Z' })!;
    expect(isGeoPricingFresh(geo, new Date('2026-11-07T08:00:00.000Z'))).toBe(true);
    expect(isGeoPricingFresh(geo, new Date('2026-11-09T08:00:00.000Z'))).toBe(false);
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
