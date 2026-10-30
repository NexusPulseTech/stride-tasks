import { beforeEach, describe, expect, it } from 'vitest';
import {
  applySchema,
  call,
  decodePayload,
  hmacHex,
  issue,
  LEMONSQUEEZY_SIGNING_SECRET,
  orderCode,
  randomHex,
  SEPAY_API_KEY,
  sha256Hex,
  testEnv,
  vaultId,
} from './helpers.js';

const register = async (code, secret, tier = 'vn-ppp', provider = 'vietqr') =>
  call('/v1/orders', { method: 'POST', body: { orderCode: code, claimHash: await sha256Hex(secret), tier, provider } });
const claim = (code, secret, env) => call(`/claim?order=${code}`, { headers: secret ? { 'X-Claim-Secret': secret } : {}, env });
const sepay = (amount, content) =>
  call('/webhook/sepay', {
    method: 'POST',
    headers: { Authorization: `Apikey ${SEPAY_API_KEY}` },
    body: { id: crypto.getRandomValues(new Uint32Array(1))[0], transferType: 'in', transferAmount: amount, content },
  });

beforeEach(applySchema);

describe('POST /v1/orders', () => {
  it('đăng ký đơn trả 201, gửi lại cùng hash trả 200, hash khác trả 409', async () => {
    const code = orderCode();
    const secret = randomHex();
    expect((await register(code, secret)).status).toBe(201);
    expect((await register(code, secret)).status).toBe(200);
    expect((await register(code, randomHex())).status).toBe(409);
  });

  it('mã đơn hoặc hash sai định dạng thì trả 400', async () => {
    const res = await call('/v1/orders', { method: 'POST', body: { orderCode: 'BAD', claimHash: 'x', tier: 'vn-ppp', provider: 'vietqr' } });
    expect(res.status).toBe(400);
  });

  it('CORS preflight cho phép POST và header X-Claim-Secret', async () => {
    const res = await call('/v1/orders', { method: 'OPTIONS', headers: { Origin: 'https://tasks.nexuspulsetech.xyz' } });
    expect(res.headers.get('access-control-allow-methods')).toMatch(/POST/);
    expect(res.headers.get('access-control-allow-headers')).toMatch(/X-Claim-Secret/i);
  });
});

describe('GET /claim', () => {
  it('thiếu bí mật trả 401, sai bí mật trả 403, đúng bí mật khi chưa trả tiền thì pending', async () => {
    const code = orderCode();
    const secret = randomHex();
    await register(code, secret);
    expect((await claim(code)).status).toBe(401);
    expect((await claim(code, randomHex())).status).toBe(403);
    const res = await claim(code, secret);
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe('pending');
  });

  it('vượt rate limit trả 429 kèm Retry-After', async () => {
    const env = await testEnv({ CLAIM_LIMITER: { limit: async () => ({ success: false }) } });
    const res = await claim(orderCode(), randomHex(), env);
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('60');
  });
});

describe('VietQR qua SePay', () => {
  it('chuyển thiếu không phát hành; đủ 149.000₫ thì phát hành token VN-<mã> giá 5.95; người không có bí mật bị chặn', async () => {
    const code = orderCode();
    const secret = randomHex();
    await register(code, secret);
    await sepay(100000, `CK ${code}`);
    expect((await (await claim(code, secret)).json()).status).toBe('pending');

    expect((await sepay(149000, `Thanh toan ${code}`)).status).toBe(200);
    const ready = await (await claim(code, secret)).json();
    expect(ready.status).toBe('ready');
    expect(decodePayload(ready.token)).toMatchObject({ licenseKeyOrAddonId: `VN-${code}`, pricePaidUsd: 5.95 });
    expect((await claim(code, randomHex())).status).toBe(403);
  });

  it('đơn đã trả tiền nhưng chưa đăng ký bí mật thì claim trả 403 (cấp qua hỗ trợ)', async () => {
    const code = orderCode();
    await sepay(149000, `CK ${code}`);
    expect((await claim(code, randomHex())).status).toBe(403);
  });
});

describe('hoàn tiền LemonSqueezy', () => {
  it('webhook hoàn tiền có chữ ký đúng thì thu hồi; token đó gọi đồng bộ bị 402 license_revoked', async () => {
    const lsOrder = crypto.getRandomValues(new Uint32Array(1))[0];
    const raw = JSON.stringify({ meta: { event_name: 'order_refunded' }, data: { id: lsOrder, attributes: {} } });
    const signature = await hmacHex(new TextEncoder().encode(LEMONSQUEEZY_SIGNING_SECRET), raw);
    const hook = await call('/webhook/lemonsqueezy', { method: 'POST', raw, headers: { 'Content-Type': 'application/json', 'X-Signature': signature } });
    expect(hook.status).toBe(200);

    const res = await call(`/sync/v1/vaults/${vaultId()}`, { headers: { Authorization: `Bearer ${await issue(`LS-${lsOrder}`)}` } });
    expect(res.status).toBe(402);
    expect((await res.json()).error).toBe('license_revoked');
  });
});
