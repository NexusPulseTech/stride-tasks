import { beforeEach, describe, expect, it, vi } from 'vitest';
import { env } from 'cloudflare:workers';
import { applySchema, bytesToB64, call, decodePayload, hmacSha256, issue, orderCode, randomHex, sha256Hex, testEnv, vaultId } from './helpers.js';

// Standard Webhooks: chữ ký = HMAC-SHA256("<id>.<timestamp>.<body>"), khóa là phần base64 sau "whsec_"
const polarKey = crypto.getRandomValues(new Uint8Array(24));
const POLAR_SECRET = `whsec_${bytesToB64(polarKey)}`;
const nowSec = () => Math.floor(Date.now() / 1000);
const polarOrderId = () => `ord_${randomHex(6)}`;

async function polar(body, { id = `msg_${randomHex(6)}`, ts = nowSec(), key = polarKey, sig, env } = {}) {
  const raw = JSON.stringify(body);
  const signature = sig ?? `v1,${bytesToB64(await hmacSha256(key, `${id}.${ts}.${raw}`))}`;
  return call('/webhooks/polar', {
    method: 'POST',
    raw,
    headers: { 'Content-Type': 'application/json', 'webhook-id': id, 'webhook-timestamp': String(ts), 'webhook-signature': signature },
    env: env ?? (await testEnv({ POLAR_WEBHOOK_SECRET: POLAR_SECRET })),
  });
}

// Số liệu theo đơn sandbox thật: tổng 1900 đã gồm thuế 173; refunded_amount không gồm thuế
const order = (ref, id, { total = 1900, status = 'paid', refunded = 0, refundedTax = 0, checkoutId = null } = {}) => ({
  id,
  status,
  paid: true,
  total_amount: total,
  refunded_amount: refunded,
  refunded_tax_amount: refundedTax,
  currency: 'usd',
  checkout_id: checkoutId,
  metadata: ref ? { reference_id: ref } : {},
  customer: { email: 'buyer@example.com' },
});
const paid = (ref, id, opts) => ({ type: 'order.paid', timestamp: new Date().toISOString(), data: order(ref, id, opts) });

async function registerPolar(code, tier = 'global-us') {
  const secret = randomHex();
  await call('/v1/orders', { method: 'POST', body: { orderCode: code, claimHash: await sha256Hex(secret), tier, provider: 'polar' } });
  return secret;
}
const claimJson = async (code, secret) => (await call(`/claim?order=${code}`, { headers: { 'X-Claim-Secret': secret } })).json();

beforeEach(applySchema);

describe('POST /webhooks/polar', () => {
  it('chữ ký sai trả 403', async () => {
    expect((await polar(paid(orderCode(), polarOrderId()), { sig: 'v1,AAAA' })).status).toBe(403);
  });

  it('timestamp lệch quá 5 phút trả 403', async () => {
    expect((await polar(paid(orderCode(), polarOrderId()), { ts: nowSec() - 3600 })).status).toBe(403);
  });

  it('thiếu POLAR_WEBHOOK_SECRET thì từ chối (fail-closed)', async () => {
    expect((await polar(paid(orderCode(), polarOrderId()), { env: await testEnv() })).status).toBe(403);
  });

  it('order.paid hợp lệ trả 202, gửi lại cùng webhook-id là duplicate, claim nhận token PL-<đơn> $19 Global', async () => {
    const code = orderCode();
    const id = polarOrderId();
    const webhookId = `msg_${randomHex(6)}`;
    const secret = await registerPolar(code);
    expect((await polar(paid(code, id), { id: webhookId })).status).toBe(202);
    const dup = await polar(paid(code, id), { id: webhookId });
    expect(dup.status).toBe(202);
    expect((await dup.json()).duplicate).toBe(true);

    const ready = await claimJson(code, secret);
    expect(ready.status).toBe('ready');
    expect(decodePayload(ready.token)).toMatchObject({ licenseKeyOrAddonId: `PL-${id}`, pricePaidUsd: 19, regionLabel: 'Global (Polar)' });
  });

  it('đơn bậc thị trường mới nổi ghi nhãn Emerging và giá $9.95', async () => {
    const code = orderCode();
    const id = polarOrderId();
    const secret = await registerPolar(code, 'emerging-ppp');
    expect((await polar(paid(code, id, { total: 995 }))).status).toBe(202);
    const ready = await claimJson(code, secret);
    expect(decodePayload(ready.token)).toMatchObject({ licenseKeyOrAddonId: `PL-${id}`, pricePaidUsd: 9.95, regionLabel: 'Emerging PPP (Polar)' });
  });

  it('hoàn một phần không thu hồi; hoàn toàn bộ thì thu hồi và token đó gọi đồng bộ bị 402', async () => {
    const code = orderCode();
    const id = polarOrderId();
    await registerPolar(code);
    await polar(paid(code, id));
    const partial = await polar({ type: 'order.refunded', data: order(code, id, { status: 'partially_refunded', refunded: 500, refundedTax: 50 }) });
    expect((await partial.json()).ignored).toBe('partial_refund');

    const full = await polar({ type: 'order.refunded', data: order(code, id, { status: 'refunded', refunded: 1727, refundedTax: 173 }) });
    expect(full.status).toBe(202);
    expect((await full.json()).revoked).toBe(true);

    const res = await call(`/sync/v1/vaults/${vaultId()}`, { headers: { Authorization: `Bearer ${await issue(`PL-${id}`)}` } });
    expect(res.status).toBe(402);
  });

  it('hoàn nhiều lần cộng đủ tiền hàng và thuế thì thu hồi dù trạng thái chưa đổi', async () => {
    const code = orderCode();
    const id = polarOrderId();
    await registerPolar(code);
    await polar(paid(code, id));
    const res = await polar({ type: 'order.refunded', data: order(code, id, { status: 'partially_refunded', refunded: 1727, refundedTax: 173 }) });
    expect((await res.json()).revoked).toBe(true);
  });

  it('secret dính ký tự xuống dòng khi nạp vẫn xác thực được', async () => {
    const res = await polar({ type: 'checkout.created', data: { id: 'x' } }, { env: await testEnv({ POLAR_WEBHOOK_SECRET: `${POLAR_SECRET}\r\n` }) });
    expect(res.status).toBe(202);
  });

  it('secret kiểu cũ (khóa là UTF-8 của cả chuỗi) vẫn xác thực được', async () => {
    const legacy = 'whsec_legacy-plain-secret';
    const res = await polar(
      { type: 'checkout.created', data: { id: 'x' } },
      { key: new TextEncoder().encode(legacy), env: await testEnv({ POLAR_WEBHOOK_SECRET: legacy }) }
    );
    expect(res.status).toBe(202);
  });
});

describe('GET /checkout/success (Success URL của Polar)', () => {
  const success = (checkoutId, n) => call(`/checkout/success?checkout_id=${checkoutId}${n === undefined ? '' : `&n=${n}`}`);

  it('trước khi webhook tới thì hiện trang chờ tự tải lại, không lưu cache', async () => {
    const checkoutId = crypto.randomUUID();
    const res = await success(checkoutId);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('no-store');
    expect(res.headers.get('referrer-policy')).toBe('no-referrer');
    const html = await res.text();
    expect(html).toContain('http-equiv="refresh"');
    expect(html).toContain(`checkout_id=${checkoutId}&amp;n=1`);
  });

  it('sau order.paid thì chuyển hướng về app kèm token trong fragment #activate', async () => {
    const code = orderCode();
    const id = polarOrderId();
    const checkoutId = crypto.randomUUID();
    await registerPolar(code);
    expect((await polar(paid(code, id, { checkoutId }))).status).toBe(202);

    const res = await success(checkoutId, 2);
    expect(res.status).toBe(302);
    const location = res.headers.get('location');
    expect(location.startsWith('https://tasks.nexuspulsetech.xyz/#activate=STRIDE1.')).toBe(true);
    expect(decodePayload(location.split('#activate=')[1])).toMatchObject({ licenseKeyOrAddonId: `PL-${id}`, pricePaidUsd: 19 });
  });

  it('mua thẳng từ Checkout Link (không qua app, không có reference_id) vẫn nhận được bản quyền', async () => {
    const id = polarOrderId();
    const checkoutId = crypto.randomUUID();
    expect((await polar(paid(null, id, { checkoutId, total: 0 }))).status).toBe(202);
    const res = await success(checkoutId);
    expect(res.status).toBe(302);
    expect(decodePayload(res.headers.get('location').split('#activate=')[1])).toMatchObject({ licenseKeyOrAddonId: `PL-${id}`, pricePaidUsd: 0 });
  });

  it('chờ quá 40 lần thì hướng dẫn gửi mã cho hỗ trợ', async () => {
    const checkoutId = crypto.randomUUID();
    const res = await success(checkoutId, 40);
    const html = await res.text();
    expect(html).not.toContain('http-equiv="refresh"');
    expect(html).toContain('support@nexuspulsetech.xyz');
    expect(html).toContain(checkoutId);
  });

  it('checkout_id sai định dạng trả 400', async () => {
    expect((await success('not-a-uuid')).status).toBe(400);
  });
});

// KV lưu đệm cả kết quả "chưa có" tới 60 giây ở từng edge, nên bản ghi đơn đặt ở D1 (đọc ngay sau ghi); KV chỉ là bản dự phòng
describe('bản ghi đơn trên D1 (A11)', () => {
  const success = (checkoutId) => call(`/checkout/success?checkout_id=${checkoutId}`);
  const d1Order = (key) => env.DB.prepare('SELECT record, expires_at FROM orders WHERE record_key = ?1').bind(key).first();

  it('order.paid ghi bản ghi đơn và ánh xạ checkout vào D1, kèm bản chép KV', async () => {
    const code = orderCode();
    const id = polarOrderId();
    const checkoutId = crypto.randomUUID();
    await registerPolar(code);
    expect((await polar(paid(code, id, { checkoutId }))).status).toBe(202);

    const row = await d1Order(`order:${code}`);
    expect(JSON.parse(row.record)).toMatchObject({ channel: 'polar', orderId: id });
    expect(new Date(row.expires_at).getTime() - Date.now()).toBeGreaterThan(89 * 86400 * 1000);
    const link = await env.DB.prepare('SELECT record_key FROM checkouts WHERE checkout_id = ?1').bind(checkoutId).first();
    expect(link.record_key).toBe(`order:${code}`);
    expect(await env.LICENSES.get(`order:${code}`)).not.toBeNull();
    expect(await env.LICENSES.get(`plcheckout:${checkoutId}`)).toBe(`order:${code}`);
  });

  it('bản ghi cũ chỉ có trong KV vẫn claim được và Success URL vẫn chuyển hướng', async () => {
    const code = orderCode();
    const secret = randomHex();
    const checkoutId = crypto.randomUUID();
    const token = await issue('PL-legacy');
    await env.LICENSES.put(`order:${code}`, JSON.stringify({ token, channel: 'polar', claimHash: await sha256Hex(secret) }));
    await env.LICENSES.put(`plcheckout:${checkoutId}`, `order:${code}`);

    expect((await claimJson(code, secret)).status).toBe('ready');
    expect((await success(checkoutId)).status).toBe(302);
  });

  it('hai webhook cho cùng đơn với webhook-id khác nhau chạy song song chỉ giữ đúng một token', async () => {
    const code = orderCode();
    const id = polarOrderId();
    const secret = await registerPolar(code);
    const responses = await Promise.all([polar(paid(code, id)), polar(paid(code, id))]);
    const bodies = await Promise.all(responses.map((r) => r.json()));
    expect(responses.map((r) => r.status)).toEqual([202, 202]);
    expect(bodies.filter((b) => !b.duplicate)).toHaveLength(1);

    const ready = await claimJson(code, secret);
    expect(JSON.parse((await d1Order(`order:${code}`)).record).token).toBe(ready.token);
    expect(await env.LICENSES.get(`order:${code}`)).toContain(ready.token);
  });

  it('không có binding D1 thì vẫn cấp bản quyền qua KV', async () => {
    const e = await testEnv({ POLAR_WEBHOOK_SECRET: POLAR_SECRET, DB: undefined });
    const code = orderCode();
    const id = polarOrderId();
    const secret = randomHex();
    await call('/v1/orders', { method: 'POST', body: { orderCode: code, claimHash: await sha256Hex(secret), tier: 'global-us', provider: 'polar' }, env: e });
    expect((await polar(paid(code, id), { env: e })).status).toBe(202);
    const res = await call(`/claim?order=${code}`, { headers: { 'X-Claim-Secret': secret }, env: e });
    expect((await res.json()).status).toBe('ready');
    expect(await d1Order(`order:${code}`)).toBeNull();
  });

  it('đơn giá vùng thanh toán từ nước thu nhập cao vẫn được cấp, nhưng ghi log ppp_country_mismatch', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const code = orderCode();
      const id = polarOrderId();
      const secret = await registerPolar(code, 'emerging-ppp');
      const body = paid(code, id, { total: 995 });
      body.data.billing_address = { country: 'US' };
      expect((await polar(body)).status).toBe(202);
      expect((await claimJson(code, secret)).status).toBe('ready');
      expect(warn).toHaveBeenCalledWith('ppp_country_mismatch', { orderId: id, tier: 'emerging-ppp', billingCountry: 'US' });

      warn.mockClear();
      const okCode = orderCode();
      await registerPolar(okCode, 'emerging-ppp');
      const okBody = paid(okCode, polarOrderId(), { total: 995 });
      okBody.data.billing_address = { country: 'IN' };
      await polar(okBody);
      expect(warn).not.toHaveBeenCalledWith('ppp_country_mismatch', expect.anything());
    } finally {
      warn.mockRestore();
    }
  });

  it('hàng D1 đã quá hạn giữ thì không còn cấp token', async () => {
    const code = orderCode();
    const secret = randomHex();
    const record = JSON.stringify({ token: await issue('PL-expired'), channel: 'polar', claimHash: await sha256Hex(secret) });
    await env.DB.prepare('INSERT INTO orders (record_key, record, created_at, expires_at) VALUES (?1, ?2, ?3, ?3)')
      .bind(`order:${code}`, record, '2020-01-01T00:00:00.000Z')
      .run();
    expect((await claimJson(code, secret)).status).toBe('pending');
  });
});
