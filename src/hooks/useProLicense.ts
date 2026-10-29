import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  verifyLicenseToken,
  buildCertificateFile,
  extractTokenFromCertificate,
  isLicensePublicKeyConfigured,
  LicensePayload,
  LicensePlan,
  LicenseType,
  VerifiedLicense,
} from '../utils/licenseCrypto';
import {
  PAYWALL_ENABLED,
  COMMERCE_CONFIG,
  PRICING_TIERS,
  PricingRegionId,
  PricingTier,
  detectDefaultPricingRegion,
  generateOrderCode,
  getAvailableTiers,
} from '../config/commerceConfig';
import { INITIAL_PROJECTS } from '../constants';
import { Project } from '../types';
import { useLanguage, formatMessage } from '../i18n';

export const LICENSE_STORAGE_KEY = 'STRIDE_PRO_LICENSE_V2';
export const TRIAL_STORAGE_KEY = 'STRIDE_PRO_TRIAL_V1';
export const REGION_STORAGE_KEY = 'STRIDE_PRICING_REGION_V1';
export const PENDING_ORDER_STORAGE_KEY = 'STRIDE_PENDING_ORDER_V1';
export const PROJECT_LIMIT_BASELINE_KEY = 'STRIDE_PROJECT_LIMIT_BASELINE_V1';
/** Phát sự kiện này sau khi ghi trực tiếp vào LICENSE_STORAGE_KEY (VD: khôi phục backup) để hook verify lại */
export const LICENSE_CHANGED_EVENT = 'stride:license-changed';

export const FREE_PROJECT_LIMIT = 5;
const TRIAL_PASSES = 3;
const ORDER_MAX_AGE_MS = 72 * 60 * 60 * 1000;
const CLAIM_POLL_INTERVAL_MS = 6000;
const SAMPLE_PROJECT_IDS: ReadonlySet<string> = new Set(INITIAL_PROJECTS.map((p) => p.id));

export interface ProLicenseState {
  isPro: boolean;
  licenseType: 'free' | LicenseType;
  licenseId?: string;
  activatedAt?: string;
  pricePaidUsd?: number;
  regionLabel?: string;
  plan?: LicensePlan;
  seats?: number;
  isDevSimulation?: boolean;
}

/** Bản ghi lưu trên thiết bị: token đã ký + các trường hiển thị (phải khớp payload, nếu không sẽ bị reset) */
interface StoredLicenseRecord {
  token: string;
  licenseType: LicenseType;
  licenseKeyOrAddonId: string;
  activatedAt: string;
  pricePaidUsd: number;
  regionLabel: string;
  plan?: LicensePlan;
  seats?: number;
}

/** Kanban & Pomodoro miễn phí từ v3.1 (đối thủ đều cho miễn phí); trial chỉ còn cho báo cáo Markdown */
export type ProFeatureKey = 'kanban' | 'pomodoro' | 'markdownReport';

export interface ProTrialState {
  kanban: number;
  pomodoro: number;
  markdownReport: number;
  /** Ngày (YYYY-MM-DD) đã tiêu 1 lượt Kanban — trong cùng ngày kéo thả thoải mái */
  kanbanActiveDay?: string;
}

export interface PendingOrder {
  code: string;
  region: PricingRegionId;
  createdAt: string;
}

export interface ActionResult {
  ok: boolean;
  message: string;
}

export interface FeatureAccess {
  allowed: boolean;
  message?: string;
}

const FREE_LICENSE: ProLicenseState = { isPro: false, licenseType: 'free' };
const DEFAULT_TRIALS: ProTrialState = { kanban: TRIAL_PASSES, pomodoro: TRIAL_PASSES, markdownReport: TRIAL_PASSES };

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota / chế độ ẩn danh: trạng thái vẫn giữ trong bộ nhớ của phiên hiện tại
  }
}

function recordFromVerified(verified: VerifiedLicense): StoredLicenseRecord {
  const p = verified.payload;
  return {
    token: verified.token,
    licenseType: p.licenseType,
    licenseKeyOrAddonId: p.licenseKeyOrAddonId,
    activatedAt: p.activatedAt,
    pricePaidUsd: p.pricePaidUsd,
    regionLabel: p.regionLabel,
    plan: p.plan,
    seats: p.seats,
  };
}

function stateFromPayload(p: LicensePayload): ProLicenseState {
  return {
    isPro: true,
    licenseType: p.licenseType,
    licenseId: p.licenseKeyOrAddonId,
    activatedAt: p.activatedAt,
    pricePaidUsd: p.pricePaidUsd,
    regionLabel: p.regionLabel,
    plan: p.plan,
    seats: p.seats,
  };
}

/** Mọi trường hiển thị đã lưu phải trùng khớp payload đã ký — sửa bất kỳ trường nào trong DevTools đều bị phát hiện */
function storedFieldsMatch(stored: StoredLicenseRecord, payload: LicensePayload): boolean {
  return (
    stored.licenseType === payload.licenseType &&
    stored.licenseKeyOrAddonId === payload.licenseKeyOrAddonId &&
    stored.activatedAt === payload.activatedAt &&
    stored.pricePaidUsd === payload.pricePaidUsd &&
    stored.regionLabel === payload.regionLabel &&
    (stored.plan ?? undefined) === (payload.plan ?? undefined) &&
    (stored.seats ?? undefined) === (payload.seats ?? undefined)
  );
}

function readTrials(): ProTrialState {
  const stored = readJson<Partial<ProTrialState>>(TRIAL_STORAGE_KEY);
  if (!stored || typeof stored !== 'object') return DEFAULT_TRIALS;
  const clamp = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(TRIAL_PASSES, Math.floor(v))) : TRIAL_PASSES);
  return {
    kanban: clamp(stored.kanban),
    pomodoro: clamp(stored.pomodoro),
    markdownReport: clamp(stored.markdownReport),
    kanbanActiveDay: typeof stored.kanbanActiveDay === 'string' ? stored.kanbanActiveDay : undefined,
  };
}

function readInitialRegion(): PricingRegionId {
  try {
    const saved = localStorage.getItem(REGION_STORAGE_KEY) as PricingRegionId | null;
    if (saved && PRICING_TIERS[saved]) return saved;
  } catch {
    // ignore
  }
  return detectDefaultPricingRegion();
}

function readPendingOrder(): PendingOrder | null {
  const order = readJson<PendingOrder>(PENDING_ORDER_STORAGE_KEY);
  if (!order || typeof order.code !== 'string' || typeof order.createdAt !== 'string') return null;
  if (Date.now() - Date.parse(order.createdAt) > ORDER_MAX_AGE_MS) return null;
  return order;
}

export function countBillableProjects(projects: Project[]): number {
  return projects.filter((p) => !SAMPLE_PROJECT_IDS.has(p.id)).length;
}

interface UseProLicenseOptions {
  /** Hiển thị thông báo phát sinh ngoài thao tác người dùng (tự kích hoạt sau thanh toán, phát hiện sửa dữ liệu) */
  notify?: (message: string) => void;
}

export function useProLicense({ notify }: UseProLicenseOptions = {}) {
  const { t } = useLanguage();
  const tRef = useRef(t);
  tRef.current = t;
  const notifyRef = useRef(notify);
  notifyRef.current = notify;

  const [license, setLicense] = useState<ProLicenseState>(FREE_LICENSE);
  const [isVerifying, setIsVerifying] = useState(true);
  const verifiedRef = useRef<VerifiedLicense | null>(null);
  const licenseRef = useRef(license);
  licenseRef.current = license;

  const [trials, setTrials] = useState<ProTrialState>(readTrials);
  const trialsRef = useRef(trials);
  trialsRef.current = trials;

  const [pricingRegion, setPricingRegionState] = useState<PricingRegionId>(readInitialRegion);
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(readPendingOrder);

  const availableTiers = useMemo(() => getAvailableTiers(), []);
  const currentTier: PricingTier = PRICING_TIERS[pricingRegion];
  const priceLabel = currentTier.priceDisplay;

  const applyVerified = useCallback((verified: VerifiedLicense | null) => {
    verifiedRef.current = verified;
    setLicense(verified ? stateFromPayload(verified.payload) : FREE_LICENSE);
  }, []);

  // Verify lại bản quyền đã lưu: lúc khởi động, khi tab khác/DevTools sửa storage, khi khôi phục backup, khi quay lại tab
  const reverifyStoredLicense = useCallback(async () => {
    if (licenseRef.current.isDevSimulation) return;
    const stored = readJson<StoredLicenseRecord>(LICENSE_STORAGE_KEY);
    if (!stored) {
      applyVerified(null);
      setIsVerifying(false);
      return;
    }
    const verified = typeof stored.token === 'string' ? await verifyLicenseToken(stored.token) : null;
    if (!verified || !storedFieldsMatch(stored, verified.payload)) {
      writeJson(LICENSE_STORAGE_KEY, null);
      const wasPro = licenseRef.current.isPro || Boolean(stored.token);
      applyVerified(null);
      if (wasPro) notifyRef.current?.(tRef.current.license.tamperedReset);
    } else {
      applyVerified(verified);
    }
    setIsVerifying(false);
  }, [applyVerified]);

  useEffect(() => {
    reverifyStoredLicense();
    const onStorage = (e: StorageEvent) => {
      if (e.key === LICENSE_STORAGE_KEY || e.key === null) reverifyStoredLicense();
    };
    const onLicenseChanged = () => reverifyStoredLicense();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') reverifyStoredLicense();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(LICENSE_CHANGED_EVENT, onLicenseChanged);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(LICENSE_CHANGED_EVENT, onLicenseChanged);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reverifyStoredLicense]);

  const setPricingRegion = useCallback((next: PricingRegionId) => {
    setPricingRegionState(next);
    try {
      localStorage.setItem(REGION_STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  /** Kích hoạt bằng token Ed25519 hoặc link https://…/#activate=<token> */
  const activateWithToken = useCallback(
    async (raw: string): Promise<ActionResult> => {
      const tr = tRef.current.license;
      if (!isLicensePublicKeyConfigured()) return { ok: false, message: tr.notConfigured };
      const verified = await verifyLicenseToken(raw);
      if (!verified) return { ok: false, message: tr.invalidToken };
      writeJson(LICENSE_STORAGE_KEY, recordFromVerified(verified));
      applyVerified(verified);
      return { ok: true, message: formatMessage(tr.activated, { region: verified.payload.regionLabel }) };
    },
    [applyVerified]
  );

  const importCertificate = useCallback(
    async (rawJson: string): Promise<ActionResult> => {
      const tr = tRef.current.license;
      const token = extractTokenFromCertificate(rawJson);
      if (!token) return { ok: false, message: tr.corruptCertificate };
      const result = await activateWithToken(token);
      return result.ok ? result : { ok: false, message: tr.invalidCertificate };
    },
    [activateWithToken]
  );

  const exportCertificate = useCallback((): boolean => {
    const verified = verifiedRef.current;
    if (!verified) return false;
    const blob = new Blob([buildCertificateFile(verified)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stride-tasks-pro-${verified.payload.licenseKeyOrAddonId}.stride-license.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  }, []);

  // ---------------------------------------------------------------------------
  // Đơn hàng VietQR / LemonSqueezy: mã đơn duy nhất + tự claim bản quyền từ Cloudflare Worker
  // ---------------------------------------------------------------------------
  const startOrder = useCallback((region: PricingRegionId): PendingOrder => {
    const order: PendingOrder = { code: generateOrderCode(), region, createdAt: new Date().toISOString() };
    setPendingOrder(order);
    writeJson(PENDING_ORDER_STORAGE_KEY, order);
    return order;
  }, []);

  const clearOrder = useCallback(() => {
    setPendingOrder(null);
    writeJson(PENDING_ORDER_STORAGE_KEY, null);
  }, []);

  const canAutoClaim = COMMERCE_CONFIG.licenseClaimUrl.length > 0;

  useEffect(() => {
    if (!pendingOrder || license.isPro || !canAutoClaim) return;
    let cancelled = false;
    const tick = async () => {
      if (document.visibilityState === 'hidden') return;
      if (Date.now() - Date.parse(pendingOrder.createdAt) > ORDER_MAX_AGE_MS) {
        clearOrder();
        return;
      }
      try {
        const res = await fetch(
          `${COMMERCE_CONFIG.licenseClaimUrl}/claim?order=${encodeURIComponent(pendingOrder.code)}`,
          { cache: 'no-store' }
        );
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { status?: string; token?: string };
        if (data.status === 'ready' && typeof data.token === 'string' && !cancelled) {
          const result = await activateWithToken(data.token);
          if (result.ok) {
            clearOrder();
            notifyRef.current?.(tRef.current.license.claimActivated);
          }
        }
      } catch {
        // Mất mạng / Worker tạm lỗi → thử lại ở nhịp sau
      }
    };
    tick();
    const id = window.setInterval(tick, CLAIM_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [pendingOrder, license.isPro, canAutoClaim, activateWithToken, clearOrder]);

  // ---------------------------------------------------------------------------
  // Soft-gate: chỉ áp dụng khi PAYWALL_ENABLED; trừ lượt khi người dùng thực sự nhận giá trị
  // ---------------------------------------------------------------------------
  const featureLabel = useCallback((feature: ProFeatureKey): string => {
    const tr = tRef.current.license;
    if (feature === 'kanban') return tr.featureKanban;
    if (feature === 'pomodoro') return tr.featurePomodoro;
    return tr.featureMarkdown;
  }, []);

  const canUseProFeature = useCallback((feature: ProFeatureKey): boolean => {
    if (!PAYWALL_ENABLED || licenseRef.current.isPro) return true;
    const current = trialsRef.current;
    if (feature === 'kanban' && current.kanbanActiveDay === todayKey()) return true;
    return current[feature] > 0;
  }, []);

  const consumeProFeature = useCallback(
    (feature: ProFeatureKey): FeatureAccess => {
      if (!PAYWALL_ENABLED || licenseRef.current.isPro) return { allowed: true };
      const current = trialsRef.current;
      const today = todayKey();
      if (feature === 'kanban' && current.kanbanActiveDay === today) return { allowed: true };

      const label = featureLabel(feature);
      const remaining = current[feature];
      if (remaining <= 0) {
        return {
          allowed: false,
          message: formatMessage(tRef.current.license.trialExhausted, { feature: label, price: priceLabel }),
        };
      }
      const next: ProTrialState = {
        ...current,
        [feature]: remaining - 1,
        ...(feature === 'kanban' ? { kanbanActiveDay: today } : {}),
      };
      trialsRef.current = next;
      setTrials(next);
      writeJson(TRIAL_STORAGE_KEY, next);
      return {
        allowed: true,
        message: formatMessage(tRef.current.license.trialUsed, { feature: label, count: remaining - 1 }),
      };
    },
    [featureLabel, priceLabel]
  );

  /**
   * Grandfathering: lần ĐẦU paywall có hiệu lực trên thiết bị này, người dùng đã có ≥ FREE_PROJECT_LIMIT
   * dự án thật (không tính dự án mẫu) được giữ quyền tạo dự án không giới hạn.
   */
  const [isGrandfathered, setIsGrandfathered] = useState<boolean>(
    () => readJson<{ grandfathered: boolean }>(PROJECT_LIMIT_BASELINE_KEY)?.grandfathered === true
  );

  const ensureProjectLimitBaseline = useCallback((projects: Project[]) => {
    if (!PAYWALL_ENABLED) return;
    if (readJson(PROJECT_LIMIT_BASELINE_KEY)) return;
    const grandfathered = countBillableProjects(projects) >= FREE_PROJECT_LIMIT;
    writeJson(PROJECT_LIMIT_BASELINE_KEY, { grandfathered, evaluatedAt: new Date().toISOString() });
    setIsGrandfathered(grandfathered);
  }, []);

  const checkProjectLimit = useCallback(
    (projects: Project[]): FeatureAccess => {
      if (!PAYWALL_ENABLED || licenseRef.current.isPro || isGrandfathered) return { allowed: true };
      if (countBillableProjects(projects) < FREE_PROJECT_LIMIT) return { allowed: true };
      return {
        allowed: false,
        message: formatMessage(tRef.current.license.projectLimit, { limit: FREE_PROJECT_LIMIT, price: priceLabel }),
      };
    },
    [isGrandfathered, priceLabel]
  );

  // ---------------------------------------------------------------------------
  // Công cụ nhà phát triển — `import.meta.env.DEV` được Vite thay bằng `false` khi build production,
  // nên toàn bộ nhánh này bị loại khỏi bundle phát hành (dead-code elimination).
  // ---------------------------------------------------------------------------
  const devTools = useMemo(() => {
    if (!import.meta.env.DEV) return null;
    return {
      simulatePro: () => {
        verifiedRef.current = null;
        setLicense({
          isPro: true,
          licenseType: 'license-key',
          licenseId: 'DEV-SIMULATION',
          activatedAt: new Date().toISOString(),
          pricePaidUsd: 0,
          regionLabel: 'Developer simulation',
          isDevSimulation: true,
        });
        return tRef.current.license.devSimulated;
      },
      deactivate: () => {
        writeJson(LICENSE_STORAGE_KEY, null);
        applyVerified(null);
        return tRef.current.license.devDeactivated;
      },
      resetTrials: () => {
        trialsRef.current = DEFAULT_TRIALS;
        setTrials(DEFAULT_TRIALS);
        writeJson(TRIAL_STORAGE_KEY, DEFAULT_TRIALS);
        writeJson(PROJECT_LIMIT_BASELINE_KEY, null);
        setIsGrandfathered(false);
        return tRef.current.license.devTrialsReset;
      },
    };
  }, [applyVerified]);

  return {
    license,
    /** Token Ed25519 đã verify (gửi kèm khi đồng bộ để máy chủ xác nhận PRO) */
    licenseToken: license.isPro && !license.isDevSimulation ? verifiedRef.current?.token ?? null : null,
    isVerifying,
    trials,
    isGrandfathered,
    pricingRegion,
    setPricingRegion,
    currentTier,
    availableTiers,
    canAutoClaim,
    pendingOrder,
    startOrder,
    clearOrder,
    activateWithToken,
    importCertificate,
    exportCertificate,
    canUseProFeature,
    consumeProFeature,
    checkProjectLimit,
    ensureProjectLimitBaseline,
    devTools,
  };
}

export type ProLicenseApi = ReturnType<typeof useProLicense>;
