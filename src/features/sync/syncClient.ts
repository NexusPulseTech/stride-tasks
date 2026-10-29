import { VaultKeys, decryptSnapshot, encryptSnapshot, EncryptedEnvelope } from './syncCrypto';
import { SyncSnapshot, mergeSnapshots, normalizeSnapshot, snapshotsEqual } from './syncMerge';

export type SyncErrorCode =
  | 'offline'
  | 'license_required'
  | 'vault_limit'
  | 'too_large'
  | 'vault_not_found'
  | 'decrypt_failed'
  | 'conflict_retry_exhausted'
  | 'server_error';

export class SyncError extends Error {
  constructor(public readonly code: SyncErrorCode) {
    super(code);
  }
}

interface RemoteVault extends EncryptedEnvelope {
  version: number;
}

interface ApiOptions {
  baseUrl: string;
  licenseToken: string | null;
}

const MAX_CONFLICT_RETRIES = 4;

function headers(opts: ApiOptions, json = false): HeadersInit {
  const h: Record<string, string> = {};
  if (opts.licenseToken) h.Authorization = `Bearer ${opts.licenseToken}`;
  if (json) h['Content-Type'] = 'application/json';
  return h;
}

function mapStatus(status: number): SyncError {
  if (status === 401 || status === 402) return new SyncError('license_required');
  if (status === 403) return new SyncError('vault_limit');
  if (status === 413) return new SyncError('too_large');
  return new SyncError('server_error');
}

async function request(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, { ...init, cache: 'no-store' });
  } catch {
    throw new SyncError('offline');
  }
}

/** Lệch giờ thiết bị so với máy chủ (ms). LWW dựa vào đồng hồ thiết bị nên lệch lớn cần cảnh báo người dùng */
function readSkew(res: Response, data: { serverTime?: string } | null): number | null {
  const serverIso = data?.serverTime || res.headers.get('Date');
  const server = serverIso ? Date.parse(serverIso) : NaN;
  return Number.isNaN(server) ? null : Date.now() - server;
}

async function getVault(opts: ApiOptions, vaultId: string): Promise<{ vault: RemoteVault | null; skewMs: number | null }> {
  const res = await request(`${opts.baseUrl}/sync/v1/vaults/${vaultId}`, { method: 'GET', headers: headers(opts) });
  const data = (await res.json().catch(() => null)) as (RemoteVault & { serverTime?: string }) | null;
  if (res.status === 404) return { vault: null, skewMs: readSkew(res, data) };
  if (!res.ok || !data) throw mapStatus(res.status);
  return { vault: { version: data.version, iv: data.iv, ciphertext: data.ciphertext }, skewMs: readSkew(res, data) };
}

async function putVault(
  opts: ApiOptions,
  vaultId: string,
  expectedVersion: number,
  envelope: EncryptedEnvelope
): Promise<{ ok: true; version: number } | { ok: false; conflict: true }> {
  const res = await request(`${opts.baseUrl}/sync/v1/vaults/${vaultId}`, {
    method: 'PUT',
    headers: headers(opts, true),
    body: JSON.stringify({ expectedVersion, ...envelope }),
  });
  if (res.status === 409) return { ok: false, conflict: true };
  const data = (await res.json().catch(() => null)) as { version?: number } | null;
  if (!res.ok || typeof data?.version !== 'number') throw mapStatus(res.status);
  return { ok: true, version: data.version };
}

export async function deleteVault(opts: ApiOptions, vaultId: string): Promise<void> {
  const res = await request(`${opts.baseUrl}/sync/v1/vaults/${vaultId}`, { method: 'DELETE', headers: headers(opts) });
  if (!res.ok && res.status !== 404) throw mapStatus(res.status);
}

export interface SyncRunOptions extends ApiOptions {
  keys: VaultKeys;
  /** Chụp trạng thái cục bộ NGAY tại thời điểm đồng bộ (gọi lại sau mỗi lần thử khi xung đột) */
  getLocal: () => SyncSnapshot;
  /** Ghi kết quả hợp nhất vào app (chỉ gọi khi khác dữ liệu hiện có) */
  applyMerged: (snapshot: SyncSnapshot) => void;
  /** Kết nối thiết bị mới vào kho có sẵn: kho phải tồn tại, và dữ liệu mẫu cục bộ bị thay bằng dữ liệu kho */
  mode: 'sync' | 'join';
  localIsPristine: boolean;
}

export interface SyncRunResult {
  version: number;
  pulled: boolean;
  pushed: boolean;
  skewMs: number | null;
}

/**
 * Một vòng đồng bộ: kéo bản mã → giải mã → hợp nhất với dữ liệu cục bộ → áp vào app → đẩy lên với khóa lạc quan
 * theo version (máy chủ từ chối 409 nếu thiết bị khác vừa ghi → kéo lại & hợp nhất lại, tối đa vài lần).
 */
export async function runSync(opts: SyncRunOptions): Promise<SyncRunResult> {
  let pulled = false;
  for (let attempt = 0; attempt < MAX_CONFLICT_RETRIES; attempt++) {
    const { vault, skewMs } = await getVault(opts, opts.keys.vaultId);
    if (!vault && opts.mode === 'join') throw new SyncError('vault_not_found');

    const local = normalizeSnapshot(opts.getLocal());
    let remote: SyncSnapshot | null = null;
    if (vault) {
      try {
        remote = normalizeSnapshot(await decryptSnapshot<SyncSnapshot>(opts.keys, vault));
      } catch {
        throw new SyncError('decrypt_failed');
      }
    }

    // Thiết bị mới chỉ có dữ liệu mẫu → lấy nguyên dữ liệu kho, không trộn dữ liệu mẫu vào kho chung
    const merged = remote
      ? opts.localIsPristine && attempt === 0
        ? remote
        : mergeSnapshots(local, remote)
      : local;

    if (!snapshotsEqual(merged, local)) {
      opts.applyMerged(merged);
      pulled = true;
    }

    if (remote && snapshotsEqual(merged, remote)) {
      return { version: vault!.version, pulled, pushed: false, skewMs };
    }

    const envelope = await encryptSnapshot(opts.keys, merged);
    const result = await putVault(opts, opts.keys.vaultId, vault ? vault.version : 0, envelope);
    if (result.ok) return { version: result.version, pulled, pushed: true, skewMs };
    // 409: thiết bị khác vừa ghi → vòng lặp kéo lại bản mới nhất và hợp nhất tiếp
  }
  throw new SyncError('conflict_retry_exhausted');
}
