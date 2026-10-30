// Tiện ích dùng chung cho test Worker. Chạy trong runtime Workers nên chỉ dùng WebCrypto, giống production.
import { createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { env } from 'cloudflare:workers';
import schema from '../schema.sql?raw';
import worker from '../src/index.js';

const encoder = new TextEncoder();

export const bytesToB64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
export const bytesToB64Url = (bytes) => bytesToB64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const toHex = (bytes) => [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
export const randomHex = (byteLength = 16) => toHex(crypto.getRandomValues(new Uint8Array(byteLength)));
export const vaultId = () => randomHex(32);

// Dữ liệu KV/D1 chỉ cô lập theo từng file test, nên mỗi test tự sinh mã đơn riêng (đúng định dạng STR + 6 ký tự)
const ORDER_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const orderCode = () => 'STR' + Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => ORDER_ALPHABET[b % 32]).join('');

export async function sha256Hex(text) {
  return toHex(await crypto.subtle.digest('SHA-256', encoder.encode(text)));
}

export async function hmacSha256(keyBytes, message) {
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', key, encoder.encode(message));
}
export const hmacHex = async (keyBytes, message) => toHex(await hmacSha256(keyBytes, message));

// Một cặp khóa test cho cả isolate: Worker cache khóa theo isolate, nên mọi test dùng chung cặp này
const keys = (async () => {
  const pair = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
  return {
    privateKey: pair.privateKey,
    publicB64Url: bytesToB64Url(await crypto.subtle.exportKey('raw', pair.publicKey)),
    privatePkcs8B64: bytesToB64(await crypto.subtle.exportKey('pkcs8', pair.privateKey)),
  };
})();

export const SEPAY_API_KEY = 'sepay-test-key';
export const LEMONSQUEEZY_SIGNING_SECRET = 'ls-test-secret';

export async function testEnv(overrides = {}) {
  const k = await keys;
  return {
    DB: env.DB,
    LICENSES: env.LICENSES,
    APP_URL: env.APP_URL,
    ALLOWED_ORIGINS: env.ALLOWED_ORIGINS,
    PRICE_VND: env.PRICE_VND,
    PRICE_VND_USD: env.PRICE_VND_USD,
    SYNC_MAX_VAULTS_PER_LICENSE: env.SYNC_MAX_VAULTS_PER_LICENSE,
    SYNC_REQUIRE_LICENSE: env.SYNC_REQUIRE_LICENSE,
    LICENSE_PUBLIC_KEY: k.publicB64Url,
    STRIDE_ED25519_PRIVATE_KEY: k.privatePkcs8B64,
    SEPAY_API_KEY,
    LEMONSQUEEZY_SIGNING_SECRET,
    ...overrides,
  };
}

/** Token cùng định dạng Worker phát hành, ký bằng khóa test */
export async function issue(licenseKeyOrAddonId, pricePaidUsd = 7.95) {
  const k = await keys;
  const body = { v: 1, product: 'stride-tasks', licenseType: 'license-key', licenseKeyOrAddonId, activatedAt: new Date().toISOString(), pricePaidUsd, regionLabel: 'test' };
  const payload = bytesToB64Url(encoder.encode(JSON.stringify(body)));
  const signature = await crypto.subtle.sign({ name: 'Ed25519' }, k.privateKey, encoder.encode(`STRIDE1.${payload}`));
  return `STRIDE1.${payload}.${bytesToB64Url(signature)}`;
}

export function decodePayload(token) {
  const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(part), (c) => c.charCodeAt(0))));
}

// schema.sql có dấu ";" trong comment nên bỏ comment trước khi tách câu lệnh
export async function applySchema() {
  const statements = schema
    .replace(/--[^\n]*/g, '')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
  for (const sql of statements) await env.DB.prepare(sql).run();
}

export async function call(path, { method = 'GET', headers = {}, body, raw, env: e } = {}) {
  const init = { method, headers: { ...headers } };
  if (raw !== undefined) {
    init.body = raw;
  } else if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers['Content-Type'] = 'application/json';
  }
  const ctx = createExecutionContext();
  const res = await worker.fetch(new Request(`https://w.example${path}`, init), e ?? (await testEnv()), ctx);
  await waitOnExecutionContext(ctx);
  return res;
}
