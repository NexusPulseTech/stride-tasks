import { describe, it, expect, vi } from 'vitest';
import { showSystemNotification, type NotificationEnv, type NotificationRegistrationLike } from '../systemNotification';

function makeCtor(permission: NotificationPermission, throws = false) {
  const calls: Array<{ title: string; options?: NotificationOptions }> = [];
  class FakeNotification {
    static permission = permission;
    constructor(title: string, options?: NotificationOptions) {
      if (throws) throw new TypeError("Failed to construct 'Notification': Illegal constructor.");
      calls.push({ title, options });
    }
  }
  return { Ctor: FakeNotification as unknown as NonNullable<NotificationEnv['Notification']>, calls };
}

function makeRegistration(active: boolean, fail = false): NotificationRegistrationLike & { showNotification: ReturnType<typeof vi.fn> } {
  return {
    active: active ? {} : null,
    showNotification: vi.fn(async () => {
      if (fail) throw new TypeError('No notification permission has been granted for this origin.');
    }),
  };
}

const opts = { body: 'Body', icon: '/icon-192.png' };

describe('showSystemNotification', () => {
  it('uses the active service worker registration when there is one, not the constructor', async () => {
    const { Ctor, calls } = makeCtor('granted');
    const registration = makeRegistration(true);
    const logger = { warn: vi.fn() };
    const result = await showSystemNotification('Title', opts, {
      Notification: Ctor,
      serviceWorker: { getRegistration: async () => registration },
      logger,
    });
    expect(result).toBe('shown');
    expect(registration.showNotification).toHaveBeenCalledWith('Title', opts);
    expect(calls).toHaveLength(0);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('falls back to the constructor when there is no service worker (dev build, desktop)', async () => {
    const { Ctor, calls } = makeCtor('granted');
    const result = await showSystemNotification('Title', opts, {
      Notification: Ctor,
      serviceWorker: { getRegistration: async () => undefined },
      logger: { warn: vi.fn() },
    });
    expect(result).toBe('shown');
    expect(calls).toEqual([{ title: 'Title', options: opts }]);
  });

  it('falls back to the constructor when the registration has no active worker yet', async () => {
    const { Ctor, calls } = makeCtor('granted');
    const registration = makeRegistration(false);
    const result = await showSystemNotification('Title', opts, {
      Notification: Ctor,
      serviceWorker: { getRegistration: async () => registration },
      logger: { warn: vi.fn() },
    });
    expect(result).toBe('shown');
    expect(registration.showNotification).not.toHaveBeenCalled();
    expect(calls).toHaveLength(1);
  });

  it('reports failed and warns when the constructor throws, as on mobile browsers without a service worker', async () => {
    const { Ctor } = makeCtor('granted', true);
    const logger = { warn: vi.fn() };
    const result = await showSystemNotification('Title', opts, { Notification: Ctor, logger });
    expect(result).toBe('failed');
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(String(logger.warn.mock.calls[0][1])).toContain('Illegal constructor');
  });

  it('reports failed and warns when showNotification rejects', async () => {
    const { Ctor, calls } = makeCtor('granted');
    const registration = makeRegistration(true, true);
    const logger = { warn: vi.fn() };
    const result = await showSystemNotification('Title', opts, {
      Notification: Ctor,
      serviceWorker: { getRegistration: async () => registration },
      logger,
    });
    expect(result).toBe('failed');
    expect(calls).toHaveLength(0);
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });

  it('still tries the constructor when getRegistration itself rejects, and logs that', async () => {
    const { Ctor, calls } = makeCtor('granted');
    const logger = { warn: vi.fn() };
    const result = await showSystemNotification('Title', opts, {
      Notification: Ctor,
      serviceWorker: { getRegistration: async () => Promise.reject(new Error('SecurityError')) },
      logger,
    });
    expect(result).toBe('shown');
    expect(calls).toHaveLength(1);
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });

  it('returns denied without showing anything when permission is not granted', async () => {
    for (const permission of ['default', 'denied'] as NotificationPermission[]) {
      const { Ctor, calls } = makeCtor(permission);
      const registration = makeRegistration(true);
      const result = await showSystemNotification('Title', opts, {
        Notification: Ctor,
        serviceWorker: { getRegistration: async () => registration },
        logger: { warn: vi.fn() },
      });
      expect(result).toBe('denied');
      expect(calls).toHaveLength(0);
      expect(registration.showNotification).not.toHaveBeenCalled();
    }
  });

  it('returns unsupported when the Notification API does not exist', async () => {
    expect(await showSystemNotification('Title', opts, {})).toBe('unsupported');
  });
});
