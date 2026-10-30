import { beforeEach, describe, expect, it } from 'vitest';
import { applySchema, bytesToB64, call, issue, testEnv, vaultId } from './helpers.js';

const APP_ORIGIN = 'https://tasks.nexuspulsetech.xyz';
const blob = (n = 1) => ({ iv: bytesToB64(new Uint8Array(12).fill(n)), ciphertext: btoa(`cipher-${n}`) });

function vault(id, { method = 'GET', token, body, origin, env } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (origin) headers.Origin = origin;
  return call(`/sync/v1/vaults/${id}`, { method, headers, body, env });
}
const put = (id, token, expectedVersion, n = 1) => vault(id, { method: 'PUT', token, body: { expectedVersion, ...blob(n) } });

beforeEach(applySchema);

describe('kho đồng bộ mã hóa', () => {
  it('không có token PRO thì trả 401', async () => {
    expect((await vault(vaultId())).status).toBe(401);
  });

  it('token bị sửa chữ ký thì trả 402', async () => {
    const token = await issue('VN-STRTEST01');
    expect((await vault(vaultId(), { token: token.slice(0, -4) + 'AAAA' })).status).toBe(402);
  });

  it('kho chưa tồn tại thì trả 404 kèm serverTime', async () => {
    const res = await vault(vaultId(), { token: await issue('VN-STRTEST01') });
    expect(res.status).toBe(404);
    expect((await res.json()).serverTime).toBeTruthy();
  });

  it('ghi theo khóa lạc quan: tạo, chặn tạo trùng, ghi tiếp, chặn bản cũ, đọc bản mới nhất', async () => {
    const token = await issue('VN-STRTEST01');
    const id = vaultId();
    expect((await (await put(id, token, 0, 1)).json()).version).toBe(1);
    expect((await put(id, token, 0, 9)).status).toBe(409);
    expect((await (await put(id, token, 1, 2)).json()).version).toBe(2);
    expect((await put(id, token, 1, 3)).status).toBe(409);
    const latest = await (await vault(id, { token })).json();
    expect(latest.version).toBe(2);
    expect(latest.ciphertext).toBe(blob(2).ciphertext);
  });

  it('IV sai định dạng thì trả 400', async () => {
    const res = await vault(vaultId(), { method: 'PUT', token: await issue('VN-STRTEST01'), body: { expectedVersion: 0, iv: 'xx', ciphertext: 'AAAA' } });
    expect(res.status).toBe(400);
  });

  it('bản mã quá lớn thì trả 413', async () => {
    const res = await vault(vaultId(), {
      method: 'PUT',
      token: await issue('VN-STRTEST01'),
      body: { expectedVersion: 0, iv: blob().iv, ciphertext: 'A'.repeat(1_900_004) },
    });
    expect(res.status).toBe(413);
  });

  it('giới hạn số kho theo bản quyền; bản quyền khác vẫn tạo được kho riêng', async () => {
    const token = await issue('VN-STRQUOTA1');
    for (let i = 0; i < 3; i++) expect((await put(vaultId(), token, 0)).status).toBe(200);
    expect((await put(vaultId(), token, 0)).status).toBe(403);
    expect((await put(vaultId(), await issue('LS-424242'), 0)).status).toBe(200);
  });

  it('xóa kho trả 204, đọc lại trả 404', async () => {
    const token = await issue('VN-STRTEST01');
    const id = vaultId();
    await put(id, token, 0);
    expect((await vault(id, { method: 'DELETE', token })).status).toBe(204);
    expect((await vault(id, { token })).status).toBe(404);
  });

  it('CORS cho phép PUT và DELETE từ domain của app', async () => {
    const res = await vault(vaultId(), { token: await issue('VN-STRTEST01'), origin: APP_ORIGIN });
    expect(res.headers.get('access-control-allow-origin')).toBe(APP_ORIGIN);
    expect(res.headers.get('access-control-allow-methods')).toContain('PUT');
    expect(res.headers.get('access-control-allow-methods')).toContain('DELETE');
  });

  it('SYNC_REQUIRE_LICENSE=false cho dùng thử không cần token', async () => {
    const res = await vault(vaultId(), { env: await testEnv({ SYNC_REQUIRE_LICENSE: 'false' }) });
    expect(res.status).toBe(404);
  });

  it('vaultId sai định dạng thì route trả 404', async () => {
    expect((await vault('not-a-vault-id', { token: await issue('VN-STRTEST01') })).status).toBe(404);
  });
});
