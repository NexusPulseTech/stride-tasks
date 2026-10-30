import { beforeAll, describe, expect, it } from 'vitest';
import {
  buildActivationLink,
  buildCertificateFile,
  extractTokenFromCertificate,
  LicensePayload,
  verifyLicenseToken,
} from '../licenseCrypto';

// Cặp khóa Ed25519 sinh tạm cho test: không đọc khóa riêng thật (.env.local)
let testPublicKey = '';
let testPrivateKey: CryptoKey;
let otherPrivateKey: CryptoKey;

const b64url = (bytes: ArrayBuffer | Uint8Array) => Buffer.from(bytes as ArrayBuffer).toString('base64url');

const payload: LicensePayload = {
  v: 1,
  product: 'stride-tasks',
  licenseType: 'license-key',
  licenseKeyOrAddonId: 'PL-test-order',
  activatedAt: '2026-10-31T00:00:00.000Z',
  pricePaidUsd: 19,
  regionLabel: 'Global (Polar)',
};

async function issue(body: unknown, key: CryptoKey = testPrivateKey, prefix = 'STRIDE1'): Promise<string> {
  const encoded = b64url(new TextEncoder().encode(JSON.stringify(body)));
  const signature = await crypto.subtle.sign({ name: 'Ed25519' }, key, new TextEncoder().encode(`${prefix}.${encoded}`));
  return `${prefix}.${encoded}.${b64url(signature)}`;
}

beforeAll(async () => {
  const pair = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])) as CryptoKeyPair;
  testPrivateKey = pair.privateKey;
  testPublicKey = b64url(await crypto.subtle.exportKey('raw', pair.publicKey));
  const other = (await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])) as CryptoKeyPair;
  otherPrivateKey = other.privateKey;
});

describe('verifyLicenseToken', () => {
  it('chấp nhận token ký đúng và trả về payload', async () => {
    const token = await issue(payload);
    const verified = await verifyLicenseToken(token, testPublicKey);
    expect(verified?.payload).toEqual(payload);
    expect(verified?.token).toBe(token);
  });

  it('chấp nhận link kích hoạt đầy đủ và token bị xuống dòng khi copy từ email', async () => {
    const token = await issue(payload);
    expect(await verifyLicenseToken(`https://tasks.nexuspulsetech.xyz/#activate=${token}`, testPublicKey)).not.toBeNull();
    expect(await verifyLicenseToken(`${token.slice(0, 30)}\n  ${token.slice(30)}`, testPublicKey)).not.toBeNull();
  });

  it('từ chối token bị sửa payload (ví dụ đổi giá)', async () => {
    const [prefix, , signature] = (await issue(payload)).split('.');
    const forged = b64url(new TextEncoder().encode(JSON.stringify({ ...payload, pricePaidUsd: 0 })));
    expect(await verifyLicenseToken(`${prefix}.${forged}.${signature}`, testPublicKey)).toBeNull();
  });

  it('từ chối token ký bằng khóa khác', async () => {
    expect(await verifyLicenseToken(await issue(payload, otherPrivateKey), testPublicKey)).toBeNull();
  });

  it('từ chối tiền tố sai', async () => {
    expect(await verifyLicenseToken(await issue(payload, testPrivateKey, 'STRIDE2'), testPublicKey)).toBeNull();
  });

  it('từ chối payload sai sản phẩm dù chữ ký đúng', async () => {
    expect(await verifyLicenseToken(await issue({ ...payload, product: 'other-app' }), testPublicKey)).toBeNull();
  });

  it('từ chối chuỗi rác và token thiếu phần', async () => {
    expect(await verifyLicenseToken('not-a-token', testPublicKey)).toBeNull();
    expect(await verifyLicenseToken('STRIDE1.abc', testPublicKey)).toBeNull();
  });

  it('mặc định dùng khóa công khai nhúng trong app, nên token ký bằng khóa test bị từ chối', async () => {
    expect(await verifyLicenseToken(await issue(payload))).toBeNull();
  });
});

describe('link kích hoạt và tệp chứng chỉ', () => {
  it('link kích hoạt bỏ dấu / thừa ở cuối origin và xác minh lại được', async () => {
    const token = await issue(payload);
    const link = buildActivationLink(token, 'https://tasks.nexuspulsetech.xyz//');
    expect(link).toBe(`https://tasks.nexuspulsetech.xyz/#activate=${token}`);
    expect(await verifyLicenseToken(link, testPublicKey)).not.toBeNull();
  });

  it('tệp .stride-license.json đọc ngược ra đúng token đã xác minh', async () => {
    const verified = await verifyLicenseToken(await issue(payload), testPublicKey);
    const file = buildCertificateFile(verified!);
    expect(JSON.parse(file)).toMatchObject({ format: 'stride-license', version: 1, pricePaidUsd: 19 });
    expect(extractTokenFromCertificate(file)).toBe(verified!.token);
  });

  it('tệp hỏng cú pháp hoặc thiếu token trả về null', () => {
    expect(extractTokenFromCertificate('{not json')).toBeNull();
    expect(extractTokenFromCertificate('{"format":"stride-license"}')).toBeNull();
    expect(extractTokenFromCertificate('null')).toBeNull();
  });
});
