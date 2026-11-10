import { describe, expect, it } from 'vitest';
import {
  NUDGE_COOLDOWN_MS,
  NUDGE_MIN_ACTIVE_DAYS,
  NUDGE_MIN_COMPLETIONS,
  realActivity,
  shouldShowUpgradeNudge,
  type UpgradeNudgeInput,
} from '../upgradeNudge';

const NOW = Date.parse('2026-11-10T12:00:00Z');
const READY: UpgradeNudgeInput = {
  eligible: true,
  focusRunning: false,
  realCompletions: NUDGE_MIN_COMPLETIONS,
  realActiveDays: NUDGE_MIN_ACTIVE_DAYS,
  state: { shownCount: 0 },
  now: NOW,
};

describe('realActivity', () => {
  it('ignores example history', () => {
    const logs = [
      { id: 'clog_seed_0_1', dateKey: '2026-11-09' },
      { id: 'clog_seed_1_2', dateKey: '2026-11-08' },
      { id: 'clog_abc', dateKey: '2026-11-09' },
      { id: 'clog_def', dateKey: '2026-11-10' },
      { id: 'clog_ghi', dateKey: '2026-11-10' },
    ];
    expect(realActivity(logs)).toEqual({ completions: 3, activeDays: 2 });
  });
});

describe('shouldShowUpgradeNudge', () => {
  it('shows once the user has real activity on enough days', () => {
    expect(shouldShowUpgradeNudge(READY)).toBe(true);
  });

  it('waits for real use', () => {
    expect(shouldShowUpgradeNudge({ ...READY, realCompletions: NUDGE_MIN_COMPLETIONS - 1 })).toBe(false);
    expect(shouldShowUpgradeNudge({ ...READY, realActiveDays: NUDGE_MIN_ACTIVE_DAYS - 1 })).toBe(false);
  });

  it('never shows to PRO users, during focus, or after opting out', () => {
    expect(shouldShowUpgradeNudge({ ...READY, eligible: false })).toBe(false);
    expect(shouldShowUpgradeNudge({ ...READY, focusRunning: true })).toBe(false);
    expect(shouldShowUpgradeNudge({ ...READY, state: { shownCount: 0, optedOut: true } })).toBe(false);
  });

  it('shows at most twice, at least 30 days apart', () => {
    const recent = new Date(NOW - NUDGE_COOLDOWN_MS + 60_000).toISOString();
    const old = new Date(NOW - NUDGE_COOLDOWN_MS - 60_000).toISOString();
    expect(shouldShowUpgradeNudge({ ...READY, state: { shownCount: 1, lastShownAt: recent } })).toBe(false);
    expect(shouldShowUpgradeNudge({ ...READY, state: { shownCount: 1, lastShownAt: old } })).toBe(true);
    expect(shouldShowUpgradeNudge({ ...READY, state: { shownCount: 2, lastShownAt: old } })).toBe(false);
  });
});
