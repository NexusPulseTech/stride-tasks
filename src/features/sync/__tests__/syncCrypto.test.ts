import { describe, expect, it } from 'vitest';
import {
  decryptSnapshot,
  deriveVaultKeys,
  encryptSnapshot,
  formatSyncCode,
  generateSyncCode,
  normalizeSyncCode,
} from '../syncCrypto';

const data = { v: 1, projects: [{ id: 'p1', name: 'Học', tasks: [{ id: 't1', title: 'Ôn chương 3' }] }], logs: [] };

describe('syncCrypto', () => {
  it('sinh mã 26 ký tự và chuẩn hóa được từ dạng có gạch nối, chữ thường', () => {
    const code = generateSyncCode();
    expect(code).toHaveLength(26);
    expect(normalizeSyncCode(formatSyncCode(code).toLowerCase())).toBe(code);
  });

  it('chuẩn hóa được cả link #sync=', () => {
    const code = generateSyncCode();
    expect(normalizeSyncCode(`https://tasks.nexuspulsetech.xyz/#sync=${formatSyncCode(code)}`)).toBe(code);
  });

  it('vaultId là 64 ký tự hex và không chứa mã đồng bộ', async () => {
    const code = generateSyncCode();
    const keys = await deriveVaultKeys(code);
    expect(keys.vaultId).toMatch(/^[0-9a-f]{64}$/);
    expect(keys.vaultId).not.toContain(code.toLowerCase());
  });

  it('giải mã đúng dữ liệu đã mã hóa (AES-256-GCM + gzip)', async () => {
    const keys = await deriveVaultKeys(generateSyncCode());
    const envelope = await encryptSnapshot(keys, data);
    expect(await decryptSnapshot(keys, envelope)).toEqual(data);
  });

  it('từ chối giải mã bằng mã đồng bộ khác', async () => {
    const envelope = await encryptSnapshot(await deriveVaultKeys(generateSyncCode()), data);
    const otherKeys = await deriveVaultKeys(generateSyncCode());
    await expect(decryptSnapshot(otherKeys, envelope)).rejects.toThrow('decrypt_failed');
  });

  it('từ chối bản mã bị sửa dù chỉ 1 ký tự (xác thực toàn vẹn)', async () => {
    const keys = await deriveVaultKeys(generateSyncCode());
    const envelope = await encryptSnapshot(keys, data);
    const c = envelope.ciphertext;
    const tampered = { ...envelope, ciphertext: c.slice(0, 20) + (c[20] === 'A' ? 'B' : 'A') + c.slice(21) };
    await expect(decryptSnapshot(keys, tampered)).rejects.toThrow('decrypt_failed');
  });
});
