/**
 * Cloudflare Worker MẪU — cấp bản quyền Stride Tasks PRO tự động 24/7 (kể cả 2 giờ sáng).
 *
 * Luồng VietQR (199.000₫):
 *   App tạo mã đơn STRxxxxxx → hiện QR (nội dung CK = mã đơn) → khách chuyển khoản
 *   → SePay gọi POST /webhook/sepay → Worker kiểm tra số tiền + mã đơn → ký token Ed25519 → lưu KV
 *   → App đang hỏi GET /claim?order=STRxxxxxx mỗi 6 giây → nhận token → tự kích hoạt PRO.
 * Luồng LemonSqueezy ($25.95 / $14.95):
 *   App mở checkout kèm checkout[custom][stride_ref]=STRxxxxxx → LemonSqueezy gọi POST /webhook/lemonsqueezy
 *   (event order_created) → ký token → lưu KV theo mã đơn → App claim như trên; nếu cấu hình Resend, gửi kèm
 *   email chứa link kích hoạt 1-click để khách dùng trên thiết bị khác.
 *
 * Đồng bộ đa thiết bị (PRO, mã hóa đầu-cuối):
 *   App mã hóa toàn bộ dữ liệu bằng AES-256-GCM với khóa sinh từ mã đồng bộ (không bao giờ gửi lên máy chủ),
 *   rồi GET/PUT/DELETE /sync/v1/vaults/<vaultId>. Worker chỉ lưu bản mã trong D1 + version để khóa lạc quan
 *   (PUT kèm expectedVersion; lệch → 409, app tự kéo lại & hợp nhất). Mỗi request kèm "Authorization: Bearer <token PRO>",
 *   Worker xác minh chữ ký Ed25519 bằng public key (LICENSE_PUBLIC_KEY) và giới hạn số kho / bản quyền.
 *
 * Định dạng token phải ĐỒNG NHẤT với src/utils/licenseCrypto.ts và scripts/keygen.mjs:
 *   STRIDE1.<base64url(JSON payload)>.<base64url(Ed25519(privateKey, "STRIDE1.<payload>"))>
 *
 * ── Triển khai ──────────────────────────────────────────────────────────────────────────────
 * Xem hướng dẫn đầy đủ: cloudflare-worker/README.md (wrangler.example.toml + schema.sql đi kèm).
 * 1. cd cloudflare-worker && cp wrangler.example.toml wrangler.toml && npx wrangler d1 execute stride-sync --remote --file=schema.sql
 * 2. wrangler.toml:
 *      name = "stride-license"
 *      main = "src/index.js"
 *      compatibility_date = "2026-10-01"
 *      [[kv_namespaces]]
 *      binding = "LICENSES"
 *      id = "<id từ: npx wrangler kv namespace create LICENSES>"
 *      [vars]
 *      PRICE_VND = "199000"
 *      APP_URL = "https://tasks.nexuspulsetech.xyz"
 *      ALLOWED_ORIGINS = "https://tasks.nexuspulsetech.xyz,https://tauri.localhost,tauri://localhost"
 *      MAIL_FROM = "Stride Tasks <license@nexuspulsetech.xyz>"
 * 3. Bí mật (không bao giờ ghi vào wrangler.toml):
 *      npx wrangler secret put STRIDE_ED25519_PRIVATE_KEY     # cùng giá trị trong .env.local (npm run keygen -- init)
 *      npx wrangler secret put SEPAY_API_KEY                  # API Key cấu hình ở webhook SePay
 *      npx wrangler secret put LEMONSQUEEZY_SIGNING_SECRET    # Signing secret của webhook LemonSqueezy
 *      npx wrangler secret put RESEND_API_KEY                 # (tùy chọn) gửi email link kích hoạt
 * 4. npx wrangler deploy → đặt URL Worker vào biến VITE_LICENSE_CLAIM_URL của app rồi build lại.
 * 5. SePay: Webhook URL = https://<worker>/webhook/sepay, chứng thực "API Key".
 *    LemonSqueezy: Settings → Webhooks → URL https://<worker>/webhook/lemonsqueezy, sự kiện order_created.
 *
 * Lưu ý: đây là mẫu tham khảo — hãy đối chiếu tên trường webhook với tài liệu hiện hành của SePay/LemonSqueezy
 * và chạy thử bằng giao dịch thật giá trị nhỏ trước khi mở bán.
 */

const PREFIX = 'STRIDE1';
const ORDER_IN_TEXT = /STR[A-HJ-NP-Z2-9]{6}/;
const ORDER_EXACT = /^STR[A-HJ-NP-Z2-9]{6}$/;
const RECORD_TTL_SECONDS = 60 * 60 * 24 * 90;
const DEFAULT_APP_URL = 'https://tasks.nexuspulsetech.xyz';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (request.method === 'OPTIONS') return withCors(request, env, new Response(null, { status: 204 }));
      if (request.method === 'POST' && url.pathname === '/webhook/sepay') return await handleSepay(request, env);
      if (request.method === 'POST' && url.pathname === '/webhook/lemonsqueezy') return await handleLemonSqueezy(request, env);
      if (request.method === 'GET' && url.pathname === '/claim') return withCors(request, env, await handleClaim(url, env));
      const vaultMatch = url.pathname.match(/^\/sync\/v1\/vaults\/([0-9a-f]{64})$/);
      if (vaultMatch) return withCors(request, env, await handleVault(request, env, vaultMatch[1]));
      return new Response('Not found', { status: 404 });
    } catch (err) {
      console.error('stride-license error', err);
      return json({ success: false, error: 'internal_error' }, 500);
    }
  },
};

// ─── SePay (chuyển khoản VietQR) ──────────────────────────────────────────────────────────────
async function handleSepay(request, env) {
  const auth = request.headers.get('Authorization') || '';
  if (!env.SEPAY_API_KEY || !timingSafeEqual(auth, `Apikey ${env.SEPAY_API_KEY}`)) {
    return json({ success: false, error: 'unauthorized' }, 401);
  }

  const body = await request.json();
  if (body.transferType !== 'in') return json({ success: true, ignored: 'outgoing_transfer' });

  const txId = String(body.id ?? body.referenceCode ?? '');
  if (!txId) return json({ success: false, error: 'missing_transaction_id' }, 400);
  // SePay có thể gửi lại webhook → xử lý idempotent theo mã giao dịch
  if (await env.LICENSES.get(`sepay:${txId}`)) return json({ success: true, duplicate: true });

  const text = `${body.code ?? ''} ${body.content ?? ''} ${body.description ?? ''}`.toUpperCase();
  const match = text.match(ORDER_IN_TEXT);
  const amount = Number(body.transferAmount);
  const price = Number(env.PRICE_VND || 199000);

  if (!match || !(amount >= price)) {
    // Trả 200 để SePay không gửi lại; giao dịch được ghi lại để đối soát và cấp mã thủ công
    await env.LICENSES.put(
      `sepay:${txId}`,
      JSON.stringify({ status: 'unmatched', amount, content: text.slice(0, 200), at: new Date().toISOString() }),
      { expirationTtl: RECORD_TTL_SECONDS }
    );
    return json({ success: true, matched: false });
  }

  const orderCode = match[0];
  if (!(await env.LICENSES.get(`order:${orderCode}`))) {
    const token = await issueToken(env, {
      licenseKeyOrAddonId: `VN-${orderCode}`,
      pricePaidUsd: 7.95,
      regionLabel: 'Vietnam PPP (199.000₫)',
    });
    await env.LICENSES.put(
      `order:${orderCode}`,
      JSON.stringify({ token, channel: 'sepay', transactionId: txId, createdAt: new Date().toISOString() }),
      { expirationTtl: RECORD_TTL_SECONDS }
    );
  }
  await env.LICENSES.put(`sepay:${txId}`, JSON.stringify({ status: 'issued', orderCode }), {
    expirationTtl: RECORD_TTL_SECONDS,
  });
  return json({ success: true });
}

// ─── LemonSqueezy (thẻ quốc tế, Merchant of Record) ───────────────────────────────────────────
async function handleLemonSqueezy(request, env) {
  const raw = await request.text();
  const signature = request.headers.get('X-Signature') || '';
  if (!env.LEMONSQUEEZY_SIGNING_SECRET || !(await verifyHmacSha256Hex(env.LEMONSQUEEZY_SIGNING_SECRET, raw, signature))) {
    return json({ error: 'invalid_signature' }, 401);
  }

  const event = JSON.parse(raw);
  if (event?.meta?.event_name !== 'order_created') return json({ ignored: true });
  const attrs = event.data?.attributes || {};
  if (attrs.status !== 'paid') return json({ ignored: 'not_paid' });

  const orderId = String(event.data?.id || '');
  const ref = String(event.meta?.custom_data?.stride_ref || '').toUpperCase();
  const recordKey = ORDER_EXACT.test(ref) ? `order:${ref}` : `lsorder:${orderId}`;
  if (await env.LICENSES.get(recordKey)) return json({ ok: true, duplicate: true });

  const pricePaidUsd = Math.round(Number(attrs.total_usd || 0)) / 100; // LemonSqueezy trả về cent
  const token = await issueToken(env, {
    licenseKeyOrAddonId: `LS-${orderId}`,
    pricePaidUsd,
    regionLabel: pricePaidUsd > 0 && pricePaidUsd < 20 ? 'Emerging PPP (LemonSqueezy)' : 'Global (LemonSqueezy)',
  });
  await env.LICENSES.put(
    recordKey,
    JSON.stringify({ token, channel: 'lemonsqueezy', orderId, createdAt: new Date().toISOString() }),
    { expirationTtl: RECORD_TTL_SECONDS }
  );

  if (env.RESEND_API_KEY && attrs.user_email) {
    await sendActivationEmail(env, attrs.user_email, token).catch((err) => console.error('email failed', err));
  }
  return json({ ok: true });
}

// ─── App claim ────────────────────────────────────────────────────────────────────────────────
async function handleClaim(url, env) {
  const order = (url.searchParams.get('order') || '').toUpperCase();
  if (!ORDER_EXACT.test(order)) return json({ status: 'invalid' }, 400);
  const record = await env.LICENSES.get(`order:${order}`, 'json');
  if (!record) return json({ status: 'pending' });
  return json({ status: 'ready', token: record.token, activationUrl: `${appUrl(env)}/#activate=${record.token}` });
}

// ─── Đồng bộ mã hóa đầu-cuối (D1) ────────────────────────────────────────────────────────────
// Giới hạn hàng D1 ~2 MB → bản mã base64 tối đa ~1,9 MB (dữ liệu đã nén gzip trước khi mã hóa nên dư dùng)
const MAX_CIPHERTEXT_CHARS = 1_900_000;

async function handleVault(request, env, vaultId) {
  if (!env.DB) return json({ error: 'sync_not_configured' }, 503);
  const license = await authorizeSync(request, env);
  if (license.error) return json({ error: license.error, serverTime: new Date().toISOString() }, license.status);

  if (request.method === 'GET') {
    const row = await env.DB.prepare('SELECT version, iv, ciphertext, updated_at FROM vaults WHERE id = ?1').bind(vaultId).first();
    const serverTime = new Date().toISOString();
    if (!row) return json({ error: 'not_found', serverTime }, 404);
    return json({ version: row.version, iv: row.iv, ciphertext: row.ciphertext, updatedAt: row.updated_at, serverTime });
  }

  if (request.method === 'DELETE') {
    await env.DB.prepare('DELETE FROM vaults WHERE id = ?1').bind(vaultId).run();
    return new Response(null, { status: 204 });
  }

  if (request.method === 'PUT') {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'invalid_json' }, 400);
    }
    const { expectedVersion, iv, ciphertext } = body || {};
    if (!Number.isInteger(expectedVersion) || expectedVersion < 0) return json({ error: 'invalid_version' }, 400);
    if (typeof iv !== 'string' || !/^[A-Za-z0-9+/]{16}$/.test(iv)) return json({ error: 'invalid_iv' }, 400);
    if (typeof ciphertext !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(ciphertext)) return json({ error: 'invalid_ciphertext' }, 400);
    if (ciphertext.length > MAX_CIPHERTEXT_CHARS) return json({ error: 'too_large' }, 413);
    const now = new Date().toISOString();

    if (expectedVersion === 0) {
      // Kho mới: kiểm tra hạn mức số kho trên mỗi bản quyền (chống chia sẻ một bản quyền cho quá nhiều người)
      if (license.id) {
        const limit = Number(env.SYNC_MAX_VAULTS_PER_LICENSE || 3);
        const owned = await env.DB.prepare('SELECT COUNT(*) AS n FROM vaults WHERE license_id = ?1').bind(license.id).first();
        if (owned && owned.n >= limit) return json({ error: 'vault_limit' }, 403);
      }
      const inserted = await env.DB.prepare(
        'INSERT INTO vaults (id, version, iv, ciphertext, size, license_id, created_at, updated_at) VALUES (?1, 1, ?2, ?3, ?4, ?5, ?6, ?6) ON CONFLICT(id) DO NOTHING'
      )
        .bind(vaultId, iv, ciphertext, ciphertext.length, license.id, now)
        .run();
      if (!inserted.meta || inserted.meta.changes === 0) return json({ error: 'conflict' }, 409);
      return json({ version: 1, serverTime: now });
    }

    const updated = await env.DB.prepare(
      'UPDATE vaults SET version = version + 1, iv = ?2, ciphertext = ?3, size = ?4, updated_at = ?5 WHERE id = ?1 AND version = ?6'
    )
      .bind(vaultId, iv, ciphertext, ciphertext.length, now, expectedVersion)
      .run();
    if (!updated.meta || updated.meta.changes === 0) return json({ error: 'conflict' }, 409);
    return json({ version: expectedVersion + 1, serverTime: now });
  }

  return json({ error: 'method_not_allowed' }, 405);
}

/** Đồng bộ chỉ dành cho PRO: xác minh token Ed25519 bằng public key (đặt SYNC_REQUIRE_LICENSE="false" để mở thử nghiệm) */
async function authorizeSync(request, env) {
  const header = request.headers.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    return env.SYNC_REQUIRE_LICENSE === 'false' ? { id: null } : { error: 'license_required', status: 401 };
  }
  const payload = await verifyLicenseToken(env, token);
  if (!payload) return { error: 'license_invalid', status: 402 };
  return { id: String(payload.licenseKeyOrAddonId) };
}

let verifyKeyPromise = null;
async function verifyLicenseToken(env, token) {
  if (!env.LICENSE_PUBLIC_KEY) return null;
  const [prefix, payloadB64, sigB64] = token.split('.');
  if (prefix !== PREFIX || !payloadB64 || !sigB64) return null;
  verifyKeyPromise ??= crypto.subtle.importKey('raw', base64UrlToBytes(env.LICENSE_PUBLIC_KEY), { name: 'Ed25519' }, false, ['verify']);
  try {
    const ok = await crypto.subtle.verify(
      { name: 'Ed25519' },
      await verifyKeyPromise,
      base64UrlToBytes(sigB64),
      new TextEncoder().encode(`${prefix}.${payloadB64}`)
    );
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payloadB64)));
    return payload && payload.product === 'stride-tasks' ? payload : null;
  } catch {
    return null;
  }
}

function base64UrlToBytes(input) {
  return base64ToBytes(input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (input.length % 4)) % 4));
}

// ─── Ký token Ed25519 ─────────────────────────────────────────────────────────────────────────
let signingKeyPromise = null;
function getSigningKey(env) {
  if (!env.STRIDE_ED25519_PRIVATE_KEY) throw new Error('Missing STRIDE_ED25519_PRIVATE_KEY secret');
  signingKeyPromise ??= crypto.subtle.importKey(
    'pkcs8',
    base64ToBytes(env.STRIDE_ED25519_PRIVATE_KEY.trim()),
    { name: 'Ed25519' },
    false,
    ['sign']
  );
  return signingKeyPromise;
}

async function issueToken(env, { licenseKeyOrAddonId, pricePaidUsd, regionLabel }) {
  const payload = {
    v: 1,
    product: 'stride-tasks',
    licenseType: 'license-key',
    licenseKeyOrAddonId,
    activatedAt: new Date().toISOString(),
    pricePaidUsd,
    regionLabel,
  };
  const encoder = new TextEncoder();
  const payloadB64 = bytesToBase64Url(encoder.encode(JSON.stringify(payload)));
  const signingInput = `${PREFIX}.${payloadB64}`;
  const signature = await crypto.subtle.sign({ name: 'Ed25519' }, await getSigningKey(env), encoder.encode(signingInput));
  return `${signingInput}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

async function sendActivationEmail(env, to, token) {
  const link = `${appUrl(env)}/#activate=${token}`;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.MAIL_FROM || 'Stride Tasks <license@nexuspulsetech.xyz>',
      to: [to],
      subject: 'Stride Tasks PRO — link kích hoạt / activation link',
      html: `<p>Cảm ơn bạn đã mua Stride Tasks PRO! / Thank you for purchasing Stride Tasks PRO!</p>
<p><a href="${link}">Kích hoạt PRO trên thiết bị này / Activate PRO on this device</a></p>
<p>Mở link này trên từng thiết bị bạn dùng. Hãy giữ email này để kích hoạt lại khi cần.<br/>
Open this link on each device you use. Keep this email to re-activate later.</p>`,
    }),
  });
  if (!res.ok) throw new Error(`Resend HTTP ${res.status}`);
}

// ─── Tiện ích ─────────────────────────────────────────────────────────────────────────────────
function appUrl(env) {
  return (env.APP_URL || DEFAULT_APP_URL).replace(/\/+$/, '');
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function withCors(request, env, response) {
  const origin = request.headers.get('Origin') || '';
  const allowed = String(env.ALLOWED_ORIGINS || DEFAULT_APP_URL)
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const headers = new Headers(response.headers);
  if (allowed.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Vary', 'Origin');
    headers.set('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    headers.set('Access-Control-Max-Age', '86400');
  }
  return new Response(response.body, { status: response.status, headers });
}

function timingSafeEqual(a, b) {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

async function verifyHmacSha256Hex(secret, message, signatureHex) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(message)));
  const hex = Array.from(mac, (b) => b.toString(16).padStart(2, '0')).join('');
  return timingSafeEqual(hex, signatureHex.trim().toLowerCase());
}

function base64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToBase64Url(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
