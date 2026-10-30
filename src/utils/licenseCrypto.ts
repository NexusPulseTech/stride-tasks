/**
 * Stride Tasks, xác thực bản quyền ngoại tuyến bằng chữ ký Ed25519 (bất đối xứng).
 *
 * Token: STRIDE1.<base64url(JSON payload)>.<base64url(chữ ký 64 byte)>
 * Chữ ký = Ed25519(privateKey, UTF-8 của chuỗi "STRIDE1.<payload>")
 *
 * Bundle frontend CHỈ chứa public key → không ai tự tạo được token hợp lệ.
 * Private key nằm ngoài repo (.env.local / secret của Cloudflare Worker) và chỉ được dùng bởi
 * scripts/keygen.mjs hoặc cloudflare-worker/src/index.js.
 */

export const LICENSE_TOKEN_PREFIX = 'STRIDE1';

// Tự động cập nhật bởi `npm run keygen -- init`. Không sửa tay trừ khi xoay vòng khóa.
// @stride-public-key-start
export const LICENSE_PUBLIC_KEY_B64URL = 'NKyqP_mvnNyPll7Oqxz-oApOCdv0YWsWTffRbx4ZclE';
// @stride-public-key-end

export type LicenseType = 'license-key' | 'ms-store-lifetime';
export type LicensePlan = 'personal' | 'team';

export interface LicensePayload {
  v: 1;
  product: 'stride-tasks';
  licenseType: LicenseType;
  /** Mã định danh giao dịch/bản quyền, VD: "VN-STRAB12CD", "LS-123456", "MANUAL-0001" */
  licenseKeyOrAddonId: string;
  activatedAt: string;
  pricePaidUsd: number;
  regionLabel: string;
  plan?: LicensePlan;
  seats?: number;
}

export interface VerifiedLicense {
  token: string;
  payload: LicensePayload;
}

export interface LicenseCertificateFile {
  format: 'stride-license';
  version: 1;
  /** Token đã ký, trường DUY NHẤT được dùng để xác thực */
  token: string;
  /** Các trường dưới đây chỉ để con người đọc; khi nhập lại sẽ lấy từ payload đã verify */
  licenseKeyOrAddonId: string;
  activatedAt: string;
  pricePaidUsd: number;
  regionLabel: string;
  plan?: LicensePlan;
}

const LICENSE_TYPES: ReadonlySet<string> = new Set(['license-key', 'ms-store-lifetime']);
const LICENSE_PLANS: ReadonlySet<string> = new Set(['personal', 'team']);

export function isLicensePublicKeyConfigured(): boolean {
  return LICENSE_PUBLIC_KEY_B64URL.length > 0;
}

// ---------------------------------------------------------------------------
// Base64url & UTF-8 helpers
// ---------------------------------------------------------------------------
export function base64UrlToBytes(input: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[A-Za-z0-9_-]*$/.test(input)) return null;
  try {
    const b64 = input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (input.length % 4)) % 4);
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

function utf8Encode(text: string): Uint8Array<ArrayBuffer> {
  const encoded = new TextEncoder().encode(text);
  const out = new Uint8Array(encoded.length);
  out.set(encoded);
  return out;
}

function utf8Decode(bytes: Uint8Array): string {
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

// ---------------------------------------------------------------------------
// Ed25519 verify: Web Crypto trước, fallback @noble/ed25519 (tải động) cho trình duyệt cũ
// ---------------------------------------------------------------------------
async function verifyEd25519(
  signature: Uint8Array<ArrayBuffer>,
  message: Uint8Array<ArrayBuffer>,
  publicKey: Uint8Array<ArrayBuffer>
): Promise<boolean> {
  const subtle = typeof crypto !== 'undefined' ? crypto.subtle : undefined;
  if (subtle) {
    let key: CryptoKey | null = null;
    try {
      key = await subtle.importKey('raw', publicKey, { name: 'Ed25519' }, false, ['verify']);
    } catch {
      key = null; // Trình duyệt chưa hỗ trợ Ed25519 trong Web Crypto → dùng noble
    }
    if (key) {
      try {
        return await subtle.verify({ name: 'Ed25519' }, key, signature, message);
      } catch {
        return false;
      }
    }
  }
  try {
    const ed = await import('@noble/ed25519');
    return await ed.verifyAsync(signature, message, publicKey);
  } catch {
    return false;
  }
}

function isValidPayload(value: unknown): value is LicensePayload {
  if (!value || typeof value !== 'object') return false;
  const p = value as Record<string, unknown>;
  if (p.v !== 1 || p.product !== 'stride-tasks') return false;
  if (typeof p.licenseType !== 'string' || !LICENSE_TYPES.has(p.licenseType)) return false;
  if (typeof p.licenseKeyOrAddonId !== 'string' || p.licenseKeyOrAddonId.trim().length === 0) return false;
  if (typeof p.activatedAt !== 'string' || Number.isNaN(Date.parse(p.activatedAt))) return false;
  if (typeof p.pricePaidUsd !== 'number' || !Number.isFinite(p.pricePaidUsd) || p.pricePaidUsd < 0) return false;
  if (typeof p.regionLabel !== 'string') return false;
  if (p.plan !== undefined && (typeof p.plan !== 'string' || !LICENSE_PLANS.has(p.plan))) return false;
  if (p.seats !== undefined && (typeof p.seats !== 'number' || !Number.isInteger(p.seats) || p.seats < 1)) return false;
  return true;
}

/**
 * Chuẩn hóa đầu vào người dùng: chấp nhận token trần, link kích hoạt đầy đủ
 * (https://.../#activate=<token>) hoặc token bị xuống dòng khi copy từ email.
 */
export function normalizeLicenseToken(raw: string): string {
  let value = (raw || '').trim();
  const marker = value.indexOf('activate=');
  if (marker !== -1) {
    value = value.slice(marker + 'activate='.length);
    const amp = value.indexOf('&');
    if (amp !== -1) value = value.slice(0, amp);
  }
  try {
    value = decodeURIComponent(value);
  } catch {
    // giữ nguyên nếu không phải chuỗi URL-encoded
  }
  return value.replace(/\s+/g, '');
}

/**
 * Xác thực token Ed25519. Trả về null nếu sai định dạng, sai chữ ký hoặc payload không hợp lệ.
 * `publicKeyB64Url` chỉ đổi khác mặc định trong test (cặp khóa sinh tạm, không dùng khóa thật).
 */
export async function verifyLicenseToken(
  raw: string,
  publicKeyB64Url: string = LICENSE_PUBLIC_KEY_B64URL
): Promise<VerifiedLicense | null> {
  if (!publicKeyB64Url) return null;
  const token = normalizeLicenseToken(raw);
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [prefix, payloadB64, signatureB64] = parts;
  if (prefix !== LICENSE_TOKEN_PREFIX || !payloadB64 || !signatureB64) return null;

  const payloadBytes = base64UrlToBytes(payloadB64);
  const signature = base64UrlToBytes(signatureB64);
  const publicKey = base64UrlToBytes(publicKeyB64Url);
  if (!payloadBytes || !signature || signature.length !== 64 || !publicKey || publicKey.length !== 32) {
    return null;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(utf8Decode(payloadBytes));
  } catch {
    return null;
  }
  if (!isValidPayload(payload)) return null;

  const ok = await verifyEd25519(signature, utf8Encode(`${prefix}.${payloadB64}`), publicKey);
  return ok ? { token, payload } : null;
}

export function buildActivationLink(token: string, appOrigin: string): string {
  return `${appOrigin.replace(/\/+$/, '')}/#activate=${token}`;
}

export function buildCertificateFile(verified: VerifiedLicense): string {
  const { payload } = verified;
  const file: LicenseCertificateFile = {
    format: 'stride-license',
    version: 1,
    token: verified.token,
    licenseKeyOrAddonId: payload.licenseKeyOrAddonId,
    activatedAt: payload.activatedAt,
    pricePaidUsd: payload.pricePaidUsd,
    regionLabel: payload.regionLabel,
    plan: payload.plan,
  };
  return JSON.stringify(file, null, 2);
}

/**
 * Đọc token từ nội dung tệp .stride-license.json.
 * Trả về null khi JSON hỏng cú pháp hoặc không có trường token.
 */
export function extractTokenFromCertificate(rawJson: string): string | null {
  try {
    const parsed = JSON.parse(rawJson) as Partial<LicenseCertificateFile> | null;
    if (!parsed || typeof parsed !== 'object' || typeof parsed.token !== 'string') return null;
    return parsed.token;
  } catch {
    return null;
  }
}
