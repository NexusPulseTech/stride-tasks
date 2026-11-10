/**
 * Lời mời nâng cấp theo khoảnh khắc giá trị (A13): chỉ hiện khi người dùng đã thật sự dùng app,
 * tối đa 2 lần, cách nhau ít nhất 30 ngày, tắt vĩnh viễn được, không chen vào lúc đang tập trung.
 * Tránh "nagging" (FTC 2022): không lặp lời mời tới khi người dùng chịu mua.
 */
export const UPGRADE_NUDGE_STORAGE_KEY = 'STRIDE_UPGRADE_NUDGE_V1';
export const NUDGE_MIN_COMPLETIONS = 20;
export const NUDGE_MIN_ACTIVE_DAYS = 3;
export const NUDGE_MAX_SHOWS = 2;
export const NUDGE_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;

/** Bản ghi lịch sử ví dụ có id bắt đầu bằng tiền tố này (useActivityLog), không tính là hoạt động thật */
const SEED_LOG_PREFIX = 'clog_seed_';

export interface UpgradeNudgeState {
  shownCount: number;
  lastShownAt?: string;
  optedOut?: boolean;
}

export interface UpgradeNudgeInput {
  /** Paywall đang bật, đã verify xong bản quyền và người dùng chưa là PRO */
  eligible: boolean;
  focusRunning: boolean;
  realCompletions: number;
  realActiveDays: number;
  state: UpgradeNudgeState;
  now: number;
}

export function realActivity(logs: ReadonlyArray<{ id: string; dateKey: string }>): {
  completions: number;
  activeDays: number;
} {
  const real = logs.filter((log) => !log.id.startsWith(SEED_LOG_PREFIX));
  return { completions: real.length, activeDays: new Set(real.map((log) => log.dateKey)).size };
}

export function shouldShowUpgradeNudge({
  eligible,
  focusRunning,
  realCompletions,
  realActiveDays,
  state,
  now,
}: UpgradeNudgeInput): boolean {
  if (!eligible || focusRunning || state.optedOut) return false;
  if (state.shownCount >= NUDGE_MAX_SHOWS) return false;
  if (realCompletions < NUDGE_MIN_COMPLETIONS || realActiveDays < NUDGE_MIN_ACTIVE_DAYS) return false;
  if (state.lastShownAt) {
    const last = Date.parse(state.lastShownAt);
    if (Number.isFinite(last) && now - last < NUDGE_COOLDOWN_MS) return false;
  }
  return true;
}

export function readUpgradeNudgeState(): UpgradeNudgeState {
  try {
    const raw = JSON.parse(localStorage.getItem(UPGRADE_NUDGE_STORAGE_KEY) || 'null');
    if (!raw || typeof raw !== 'object') return { shownCount: 0 };
    return {
      shownCount: typeof raw.shownCount === 'number' && Number.isFinite(raw.shownCount) ? Math.max(0, raw.shownCount) : 0,
      lastShownAt: typeof raw.lastShownAt === 'string' ? raw.lastShownAt : undefined,
      optedOut: raw.optedOut === true,
    };
  } catch {
    return { shownCount: 0 };
  }
}

export function writeUpgradeNudgeState(state: UpgradeNudgeState): void {
  try {
    localStorage.setItem(UPGRADE_NUDGE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Không ghi được (chế độ ẩn danh, hết quota): lời mời vẫn đóng trong phiên hiện tại
  }
}
