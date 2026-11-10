import { describe, expect, it } from 'vitest';
import { EMERGING_COUNTRIES, tierForCountry } from '../src/pricing.js';
import { call, testEnv } from './helpers.js';

const REGIONAL_URL = 'https://buy.polar.sh/polar_cl_regional_test';
const pricing = async (cf, env) => (await call('/v1/pricing', { cf, headers: { Origin: 'https://tasks.nexuspulsetech.xyz' }, env })).json();

describe('tierForCountry (phân loại thu nhập World Bank)', () => {
  it('Việt Nam có bậc riêng, nước thu nhập trung bình nhận giá mới nổi, nước thu nhập cao nhận giá quốc tế', () => {
    expect(tierForCountry('VN')).toBe('vn-ppp');
    for (const c of ['IN', 'ID', 'PH', 'BR', 'MX', 'EG', 'NG', 'PK', 'TH']) expect(tierForCountry(c)).toBe('emerging-ppp');
    for (const c of ['US', 'DE', 'JP', 'SG', 'KR', 'GB', 'AU', 'RU', '']) expect(tierForCountry(c)).toBe('global-us');
    expect(tierForCountry('in')).toBe('emerging-ppp');
  });

  it('danh sách gồm đúng 131 mã hai chữ cái viết hoa', () => {
    expect(EMERGING_COUNTRIES.size).toBe(131);
    for (const c of EMERGING_COUNTRIES) expect(c).toMatch(/^[A-Z]{2}$/);
  });
});

describe('GET /v1/pricing', () => {
  it('nước mới nổi nhận link giá vùng; nước thu nhập cao không nhận', async () => {
    const env = await testEnv({ POLAR_CHECKOUT_URL_EMERGING: REGIONAL_URL });
    expect(await pricing({ country: 'IN' }, env)).toEqual({ country: 'IN', tier: 'emerging-ppp', regionalCheckoutUrl: REGIONAL_URL });
    expect(await pricing({ country: 'VN' }, env)).toEqual({ country: 'VN', tier: 'vn-ppp', regionalCheckoutUrl: REGIONAL_URL });
    expect(await pricing({ country: 'US' }, env)).toEqual({ country: 'US', tier: 'global-us', regionalCheckoutUrl: null });
  });

  it('không xác định được nước (XX, Tor, thiếu) thì giá quốc tế', async () => {
    const env = await testEnv({ POLAR_CHECKOUT_URL_EMERGING: REGIONAL_URL });
    for (const cf of [{ country: 'XX' }, { country: 'T1' }, undefined]) {
      expect(await pricing(cf, env)).toEqual({ country: null, tier: 'global-us', regionalCheckoutUrl: null });
    }
  });

  it('chưa cấu hình link giá vùng thì trả null, app tự dùng giá quốc tế', async () => {
    expect((await pricing({ country: 'IN' }, await testEnv())).regionalCheckoutUrl).toBeNull();
  });

  it('không lưu cache và cho phép origin của app', async () => {
    const res = await call('/v1/pricing', { cf: { country: 'IN' }, headers: { Origin: 'https://tasks.nexuspulsetech.xyz' } });
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.headers.get('access-control-allow-origin')).toBe('https://tasks.nexuspulsetech.xyz');
  });
});
