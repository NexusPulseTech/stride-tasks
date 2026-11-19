import { describe, it, expect } from 'vitest';
import { resolveReminderEnable, nextReminderChannel } from '../reminderChannel';

describe('resolveReminderEnable', () => {
  it('says periodic reminders are on only when the confirmation notification actually showed', () => {
    expect(resolveReminderEnable('granted', 'shown')).toEqual({ channel: 'system', toast: 'periodicReminderOn' });
  });

  it('tells the truth when permission is granted but the system notification failed (mobile without a service worker)', () => {
    expect(resolveReminderEnable('granted', 'failed')).toEqual({ channel: 'in-app', toast: 'systemNotifyFailed' });
    expect(resolveReminderEnable('granted', 'unsupported')).toEqual({ channel: 'in-app', toast: 'systemNotifyFailed' });
  });

  it('treats a throwing requestPermission as a failure, not as success', () => {
    expect(resolveReminderEnable('error')).toEqual({ channel: 'in-app', toast: 'systemNotifyFailed' });
  });

  it('falls back to in-app reminders when permission is refused or the API is missing', () => {
    for (const p of ['denied', 'default', 'unsupported'] as const) {
      expect(resolveReminderEnable(p)).toEqual({ channel: 'in-app', toast: 'inAppReminderOn' });
    }
  });
});

describe('nextReminderChannel', () => {
  it('stays on system while notifications show', () => {
    expect(nextReminderChannel('system', 'shown')).toEqual({ channel: 'system', warnUser: false });
    expect(nextReminderChannel('in-app', 'shown')).toEqual({ channel: 'system', warnUser: false });
  });

  it('warns the user once, on the first failure after the system channel worked', () => {
    expect(nextReminderChannel('system', 'failed')).toEqual({ channel: 'in-app', warnUser: true });
    expect(nextReminderChannel('in-app', 'failed')).toEqual({ channel: 'in-app', warnUser: false });
  });

  it('moves to in-app quietly when permission was revoked or the API disappeared', () => {
    expect(nextReminderChannel('system', 'denied')).toEqual({ channel: 'in-app', warnUser: false });
    expect(nextReminderChannel('system', 'unsupported')).toEqual({ channel: 'in-app', warnUser: false });
  });
});
