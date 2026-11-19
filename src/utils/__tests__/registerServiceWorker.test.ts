import { describe, it, expect, vi } from 'vitest';
import { registerServiceWorker, type ServiceWorkerRegistrar } from '../registerServiceWorker';

class FakeWorker {
  state = 'installing';
  private listeners: Array<() => void> = [];
  addEventListener(_type: 'statechange', listener: () => void) {
    this.listeners.push(listener);
  }
  setState(state: string) {
    this.state = state;
    this.listeners.forEach((l) => l());
  }
}

class FakeRegistration {
  private listeners: Array<() => void> = [];
  update = vi.fn(async () => undefined as unknown);
  constructor(public installing: FakeWorker | null, public active: FakeWorker | null = null) {}
  addEventListener(_type: 'updatefound', listener: () => void) {
    this.listeners.push(listener);
  }
  fireUpdateFound() {
    this.listeners.forEach((l) => l());
  }
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function setup(registrations: FakeRegistration[]) {
  const queue = [...registrations];
  const container: ServiceWorkerRegistrar = { register: vi.fn(async () => queue.shift()!) };
  const logger = { warn: vi.fn(), error: vi.fn() };
  const scheduled: Array<{ callback: () => void; delayMs: number }> = [];
  const schedule = (callback: () => void, delayMs: number) => {
    scheduled.push({ callback, delayMs });
  };
  return { container, logger, scheduled, schedule };
}

describe('registerServiceWorker', () => {
  it('registers the given URL and stays quiet when the install succeeds', async () => {
    const worker = new FakeWorker();
    const { container, logger, scheduled, schedule } = setup([new FakeRegistration(worker)]);
    await registerServiceWorker({ container, url: '/sw.js', logger, schedule });
    worker.setState('installed');
    worker.setState('activating');
    worker.setState('activated');
    expect(container.register).toHaveBeenCalledWith('/sw.js');
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
    expect(scheduled).toHaveLength(0);
  });

  it('logs a failed first install and registers again exactly once', async () => {
    const first = new FakeWorker();
    const second = new FakeWorker();
    const reg1 = new FakeRegistration(first);
    const reg2 = new FakeRegistration(second);
    const { container, logger, scheduled, schedule } = setup([reg1, reg2]);

    await registerServiceWorker({ container, url: '/sw.js', logger, schedule, retryDelayMs: 10_000 });
    reg1.fireUpdateFound(); // cùng worker với `installing`: không được tính hai lần
    first.setState('redundant');

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error.mock.calls[0][0]).toMatch(/install failed; offline mode is unavailable\. Retrying once in 10s/);
    expect(scheduled).toHaveLength(1);
    expect(scheduled[0].delayMs).toBe(10_000);

    scheduled[0].callback();
    await flush();
    expect(container.register).toHaveBeenCalledTimes(2);

    second.setState('redundant');
    expect(logger.error).toHaveBeenCalledTimes(2);
    expect(logger.error.mock.calls[1][0]).toMatch(/failed again/);
    expect(scheduled).toHaveLength(1);
  });

  it('checks for a failed update exactly once while the active worker keeps serving', async () => {
    const active = new FakeWorker();
    active.state = 'activated';
    const update = new FakeWorker();
    const reg = new FakeRegistration(update, active);
    const { container, logger, scheduled, schedule } = setup([reg]);

    await registerServiceWorker({ container, url: '/sw.js', logger, schedule });
    update.setState('redundant');

    expect(reg.update).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn.mock.calls[0][0]).toMatch(/update failed to install/);
    expect(logger.error).not.toHaveBeenCalled();
    expect(scheduled).toHaveLength(0);
    expect(container.register).toHaveBeenCalledTimes(1);

    // Lần update đó lại sinh worker mới và cũng hỏng: chỉ cảnh báo, không gọi update thêm
    const retry = new FakeWorker();
    reg.installing = retry;
    reg.fireUpdateFound();
    retry.setState('redundant');
    expect(reg.update).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledTimes(2);
    expect(logger.warn.mock.calls[1][0]).toMatch(/update failed again/);
  });

  it('logs a rejected update check instead of swallowing it', async () => {
    const active = new FakeWorker();
    active.state = 'activated';
    const update = new FakeWorker();
    const reg = new FakeRegistration(update, active);
    const error = new Error('network');
    reg.update.mockRejectedValueOnce(error);
    const { container, logger, schedule } = setup([reg]);

    await registerServiceWorker({ container, url: '/sw.js', logger, schedule });
    update.setState('redundant');
    await flush();

    expect(logger.warn).toHaveBeenCalledWith(expect.stringMatching(/update check failed/), error);
  });

  it('watches workers that arrive later through updatefound', async () => {
    const reg = new FakeRegistration(null);
    const { container, logger, scheduled, schedule } = setup([reg]);

    await registerServiceWorker({ container, url: '/sw.js', logger, schedule });
    const late = new FakeWorker();
    reg.installing = late;
    reg.fireUpdateFound();
    late.setState('redundant');

    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(scheduled).toHaveLength(1);
  });

  it('reports a rejected registration instead of swallowing it', async () => {
    const error = new Error('SecurityError');
    const container: ServiceWorkerRegistrar = { register: vi.fn(async () => Promise.reject(error)) };
    const logger = { warn: vi.fn(), error: vi.fn() };

    await expect(registerServiceWorker({ container, url: '/sw.js', logger })).resolves.toBeUndefined();
    expect(logger.warn).toHaveBeenCalledWith(expect.stringMatching(/registration failed/), error);
  });
});
