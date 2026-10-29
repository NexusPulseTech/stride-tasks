/**
 * Mã hóa đầu-cuối cho đồng bộ đa thiết bị.
 *
 * - Mã đồng bộ = 16 byte ngẫu nhiên (128 bit), hiển thị dạng Base32 Crockford 26 ký tự: "7K2QX-9MZ4D-...".
 * - vaultId = SHA-256("stride-vault-v1:" ‖ mã) → định danh kho trên máy chủ; KHÔNG suy ngược được ra mã.
 * - Khóa = HKDF-SHA256(mã, salt "stride-sync-v1", info "aes-256-gcm") → AES-256-GCM, IV ngẫu nhiên 12 byte,
 *   additionalData = vaultId (ràng buộc bản mã với đúng kho).
 * - Bản rõ = [1 byte định dạng] ‖ dữ liệu: 0x01 = JSON, 0x02 = JSON nén gzip.
 *
 * Máy chủ chỉ thấy vaultId + bản mã → không đọc được công việc của người dùng (kể cả nhà phát triển).
 * Mất mã đồng bộ = không giải mã được bản trên cloud (dữ liệu trên thiết bị vẫn còn nguyên).
 */

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const CODE_BYTES = 16;
const CODE_LENGTH = 26; // ceil(128 / 5)
const FORMAT_JSON = 1;
const FORMAT_GZIP_JSON = 2;

const encoder = new TextEncoder();

function toArrayBufferView(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(bytes.length);
  out.set(bytes);
  return out;
}

function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += CROCKFORD[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += CROCKFORD[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(text: string): Uint8Array<ArrayBuffer> | null {
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of text) {
    const idx = CROCKFORD.indexOf(ch);
    if (idx === -1) return null;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return out.length >= CODE_BYTES ? toArrayBufferView(Uint8Array.from(out.slice(0, CODE_BYTES))) : null;
}

export function generateSyncCode(): string {
  const bytes = new Uint8Array(CODE_BYTES);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes);
}

/** Chấp nhận chữ thường, dấu cách, gạch nối, link #sync=…; quy đổi ký tự dễ nhầm (O→0, I/L→1). Trả về null nếu sai */
export function normalizeSyncCode(input: string): string | null {
  let value = (input || '').trim();
  const marker = value.indexOf('sync=');
  if (marker !== -1) value = value.slice(marker + 'sync='.length);
  value = value
    .toUpperCase()
    .replace(/[\s-]+/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
  if (value.length !== CODE_LENGTH || !base32Decode(value)) return null;
  return value;
}

/** "7K2QX9MZ4D…" → "7K2QX-9MZ4D-…" (5-5-5-5-6) để đọc/chép dễ hơn */
export function formatSyncCode(code: string): string {
  return [code.slice(0, 5), code.slice(5, 10), code.slice(10, 15), code.slice(15, 20), code.slice(20)].join('-');
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, '0')).join('');
}

export interface VaultKeys {
  vaultId: string;
  key: CryptoKey;
}

export async function deriveVaultKeys(code: string): Promise<VaultKeys> {
  const secret = base32Decode(code);
  if (!secret) throw new Error('invalid_sync_code');
  const prefix = encoder.encode('stride-vault-v1:');
  const idInput = new Uint8Array(prefix.length + secret.length);
  idInput.set(prefix);
  idInput.set(secret, prefix.length);
  const vaultId = toHex(await crypto.subtle.digest('SHA-256', idInput));

  const hkdfKey = await crypto.subtle.importKey('raw', secret, 'HKDF', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: toArrayBufferView(encoder.encode('stride-sync-v1')), info: toArrayBufferView(encoder.encode('aes-256-gcm')) },
    hkdfKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  return { vaultId, key };
}

// Base64 theo từng khối để không tràn stack với dữ liệu lớn
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

async function pipeThrough(data: Uint8Array<ArrayBuffer>, stream: CompressionStream | DecompressionStream): Promise<Uint8Array<ArrayBuffer>> {
  const response = new Response(new Blob([data]).stream().pipeThrough(stream));
  return new Uint8Array(await response.arrayBuffer());
}

export interface EncryptedEnvelope {
  iv: string;
  ciphertext: string;
}

export async function encryptSnapshot(keys: VaultKeys, data: unknown): Promise<EncryptedEnvelope> {
  const json = toArrayBufferView(encoder.encode(JSON.stringify(data)));
  const canGzip = typeof CompressionStream !== 'undefined';
  const body = canGzip ? await pipeThrough(json, new CompressionStream('gzip')) : json;
  const plain = new Uint8Array(body.length + 1);
  plain[0] = canGzip ? FORMAT_GZIP_JSON : FORMAT_JSON;
  plain.set(body, 1);

  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const cipher = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: toArrayBufferView(encoder.encode(keys.vaultId)) },
    keys.key,
    plain
  );
  return { iv: bytesToBase64(iv), ciphertext: bytesToBase64(new Uint8Array(cipher)) };
}

/** Ném lỗi 'decrypt_failed' khi sai mã / dữ liệu bị sửa (AES-GCM xác thực toàn vẹn) */
export async function decryptSnapshot<T>(keys: VaultKeys, envelope: EncryptedEnvelope): Promise<T> {
  let plain: Uint8Array<ArrayBuffer>;
  try {
    plain = new Uint8Array(
      await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: base64ToBytes(envelope.iv), additionalData: toArrayBufferView(encoder.encode(keys.vaultId)) },
        keys.key,
        base64ToBytes(envelope.ciphertext)
      )
    );
  } catch {
    throw new Error('decrypt_failed');
  }
  const format = plain[0];
  const body = plain.slice(1);
  if (format === FORMAT_GZIP_JSON) {
    if (typeof DecompressionStream === 'undefined') throw new Error('gzip_unsupported');
    const raw = await pipeThrough(body, new DecompressionStream('gzip'));
    return JSON.parse(new TextDecoder().decode(raw)) as T;
  }
  if (format === FORMAT_JSON) return JSON.parse(new TextDecoder().decode(body)) as T;
  throw new Error('unknown_format');
}
