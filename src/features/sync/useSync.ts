import { useState, useEffect, useCallback, useRef } from 'react';
import { deriveVaultKeys, formatSyncCode, generateSyncCode, normalizeSyncCode, VaultKeys } from './syncCrypto';
import { SyncError, SyncErrorCode, deleteVault, runSync } from './syncClient';
import { SyncSnapshot, mergeSnapshots } from './syncMerge';
import { SYNC_CONFIG_KEY, clearTombstones, setTombstoneTracking } from './tombstones';

export type SyncStatus = 'idle' | 'syncing' | 'error';

interface StoredSyncConfig {
  code: string;
  connectedAt: string;
  lastSyncedAt?: string;
  version?: number;
}

const DEBOUNCE_MS = 2500;
const INTERVAL_MS = 60_000;
const SKEW_WARNING_MS = 5 * 60_000;

function readConfig(): StoredSyncConfig | null {
  try {
    const raw = localStorage.getItem(SYNC_CONFIG_KEY);
    const parsed = raw ? (JSON.parse(raw) as StoredSyncConfig) : null;
    return parsed && typeof parsed.code === 'string' && normalizeSyncCode(parsed.code) ? parsed : null;
  } catch {
    return null;
  }
}

function writeConfig(config: StoredSyncConfig | null): void {
  try {
    if (config) localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(config));
    else localStorage.removeItem(SYNC_CONFIG_KEY);
  } catch {
    // Chế độ ẩn danh chặn storage: đồng bộ vẫn chạy trong phiên hiện tại
  }
}

export interface UseSyncOptions {
  /** URL Worker đồng bộ; rỗng → tính năng ẩn hoàn toàn */
  apiUrl: string;
  licenseToken: string | null;
  /** Được phép dùng (PRO, hoặc paywall đang tắt, máy chủ vẫn là nơi quyết định cuối cùng) */
  canUse: boolean;
  getLocalSnapshot: () => SyncSnapshot;
  applySnapshot: (snapshot: SyncSnapshot) => void;
  isLocalPristine: () => boolean;
  /** Đổi giá trị khi dữ liệu cục bộ đổi → tự đồng bộ sau vài giây */
  changeSignal: unknown;
}

export function useSync(options: UseSyncOptions) {
  const optsRef = useRef(options);
  optsRef.current = options;

  const [config, setConfig] = useState<StoredSyncConfig | null>(readConfig);
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [error, setError] = useState<SyncErrorCode | null>(null);
  const [skewMs, setSkewMs] = useState<number | null>(null);

  const keysRef = useRef<{ code: string; keys: VaultKeys } | null>(null);
  const runningRef = useRef(false);
  const rerunRef = useRef(false);
  const configRef = useRef(config);
  configRef.current = config;

  const available = options.apiUrl.length > 0;
  const enabled = available && config !== null;

  useEffect(() => {
    setTombstoneTracking(enabled);
  }, [enabled]);

  const keysFor = useCallback(async (code: string): Promise<VaultKeys> => {
    if (keysRef.current?.code === code) return keysRef.current.keys;
    const keys = await deriveVaultKeys(code);
    keysRef.current = { code, keys };
    return keys;
  }, []);

  /** Áp kết quả hợp nhất, trộn thêm một lần với trạng thái mới nhất để không mất thay đổi người dùng vừa gõ trong lúc đồng bộ */
  const applyMerged = useCallback((merged: SyncSnapshot) => {
    const latest = optsRef.current.getLocalSnapshot();
    optsRef.current.applySnapshot(mergeSnapshots(latest, merged));
  }, []);

  const execute = useCallback(
    async (code: string, mode: 'sync' | 'join'): Promise<boolean> => {
      if (runningRef.current) {
        rerunRef.current = true;
        return false;
      }
      runningRef.current = true;
      setStatus('syncing');
      try {
        const opts = optsRef.current;
        const result = await runSync({
          baseUrl: opts.apiUrl.replace(/\/+$/, ''),
          licenseToken: opts.licenseToken,
          keys: await keysFor(code),
          getLocal: opts.getLocalSnapshot,
          applyMerged,
          mode,
          localIsPristine: opts.isLocalPristine(),
        });
        const next: StoredSyncConfig = {
          ...(configRef.current ?? { code, connectedAt: new Date().toISOString() }),
          code,
          version: result.version,
          lastSyncedAt: new Date().toISOString(),
        };
        writeConfig(next);
        setConfig(next);
        setSkewMs(result.skewMs);
        setError(null);
        setStatus('idle');
        return true;
      } catch (e) {
        setError(e instanceof SyncError ? e.code : 'server_error');
        setStatus('error');
        return false;
      } finally {
        runningRef.current = false;
        if (rerunRef.current) {
          rerunRef.current = false;
          const current = configRef.current;
          if (current) setTimeout(() => void execute(current.code, 'sync'), 0);
        }
      }
    },
    [applyMerged, keysFor]
  );

  const syncNow = useCallback(() => {
    const current = configRef.current;
    if (!current || !optsRef.current.apiUrl) return Promise.resolve(false);
    return execute(current.code, 'sync');
  }, [execute]);

  /** Bật đồng bộ trên thiết bị này với một mã mới (tạo kho mã hóa mới trên cloud) */
  const createVault = useCallback(async (): Promise<boolean> => {
    if (!optsRef.current.canUse) {
      setError('license_required');
      setStatus('error');
      return false;
    }
    const code = generateSyncCode();
    const draft: StoredSyncConfig = { code, connectedAt: new Date().toISOString() };
    configRef.current = draft;
    setTombstoneTracking(true);
    const ok = await execute(code, 'sync');
    if (!ok) {
      configRef.current = null;
      setConfig(null);
      writeConfig(null);
      setTombstoneTracking(false);
    }
    return ok;
  }, [execute]);

  /** Kết nối thiết bị này vào kho đã có bằng mã đồng bộ (hoặc link #sync=…) */
  const joinVault = useCallback(
    async (input: string): Promise<boolean | 'invalid_code'> => {
      const code = normalizeSyncCode(input);
      if (!code) return 'invalid_code';
      if (!optsRef.current.canUse) {
        setError('license_required');
        setStatus('error');
        return false;
      }
      const draft: StoredSyncConfig = { code, connectedAt: new Date().toISOString() };
      configRef.current = draft;
      setTombstoneTracking(true);
      const ok = await execute(code, 'join');
      if (!ok) {
        configRef.current = null;
        setConfig(null);
        writeConfig(null);
        setTombstoneTracking(false);
      }
      return ok;
    },
    [execute]
  );

  /** Ngắt đồng bộ trên thiết bị này (dữ liệu trên máy vẫn giữ nguyên, bản cloud vẫn còn cho thiết bị khác) */
  const disconnect = useCallback(() => {
    writeConfig(null);
    configRef.current = null;
    setConfig(null);
    keysRef.current = null;
    clearTombstones();
    setTombstoneTracking(false);
    setError(null);
    setStatus('idle');
  }, []);

  /** Xóa vĩnh viễn bản mã hóa trên cloud rồi ngắt đồng bộ */
  const deleteCloudCopy = useCallback(async (): Promise<boolean> => {
    const current = configRef.current;
    if (!current) return false;
    try {
      const keys = await keysFor(current.code);
      await deleteVault({ baseUrl: optsRef.current.apiUrl.replace(/\/+$/, ''), licenseToken: optsRef.current.licenseToken }, keys.vaultId);
      disconnect();
      return true;
    } catch (e) {
      setError(e instanceof SyncError ? e.code : 'server_error');
      setStatus('error');
      return false;
    }
  }, [disconnect, keysFor]);

  // Tự đồng bộ: khi dữ liệu đổi (debounce), khi quay lại tab, khi có mạng trở lại, và định kỳ khi tab đang mở
  const firstSignalRef = useRef(true);
  useEffect(() => {
    if (!enabled) return;
    if (firstSignalRef.current) {
      firstSignalRef.current = false;
      void syncNow();
      return;
    }
    const timer = window.setTimeout(() => void syncNow(), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [enabled, options.changeSignal, syncNow]);

  useEffect(() => {
    if (!enabled) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') void syncNow();
    };
    const onOnline = () => void syncNow();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void syncNow();
    }, INTERVAL_MS);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
      window.clearInterval(interval);
    };
  }, [enabled, syncNow]);

  return {
    available,
    enabled,
    status,
    error,
    lastSyncedAt: config?.lastSyncedAt ?? null,
    formattedCode: config ? formatSyncCode(config.code) : null,
    clockSkewWarning: skewMs !== null && Math.abs(skewMs) > SKEW_WARNING_MS,
    createVault,
    joinVault,
    syncNow,
    disconnect,
    deleteCloudCopy,
  };
}

export type SyncApi = ReturnType<typeof useSync>;
