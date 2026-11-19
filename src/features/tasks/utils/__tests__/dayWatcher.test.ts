import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { startDayWatcher } from '../dayWatcher';

const ORIGINAL_TZ = process.env.TZ;
beforeAll(() => {
  process.env.TZ = 'Asia/Ho_Chi_Minh';
});
afterAll(() => {
  process.env.TZ = ORIGINAL_TZ;
});

// Trang giả: chỉ cần nghe và phát sự kiện visibilitychange
function fakePage(visible = true) {
  const target = new EventTarget();
  const page = {
    visible,
    target,
    isVisible: () => page.visible,
    show() {
      page.visible = true;
      target.dispatchEvent(new Event('visibilitychange'));
    },
  };
  return page;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
  vi.setSystemTime(new Date(2026, 10, 19, 23, 50, 0));
});
afterEach(() => {
  vi.useRealTimers();
});

describe('F03: làm mới việc lặp lại khi app để mở qua nửa đêm hoặc quay lại tab', () => {
  it('để app mở qua nửa đêm thì gọi làm mới đúng một lần', () => {
    const onNewDay = vi.fn();
    const page = fakePage();
    const stop = startDayWatcher(onNewDay, { target: page.target, isVisible: page.isVisible });
    vi.advanceTimersByTime(9 * 60 * 1000);
    expect(onNewDay).not.toHaveBeenCalled();
    vi.advanceTimersByTime(2 * 60 * 1000);
    expect(onNewDay).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(60 * 60 * 1000);
    expect(onNewDay).toHaveBeenCalledTimes(1);
    stop();
  });

  it('máy ngủ qua đêm (hẹn giờ không chạy), mở lại tab thì gọi làm mới', () => {
    const onNewDay = vi.fn();
    const page = fakePage(false);
    const stop = startDayWatcher(onNewDay, { target: page.target, isVisible: page.isVisible });
    vi.setSystemTime(new Date(2026, 10, 20, 7, 30, 0));
    page.show();
    expect(onNewDay).toHaveBeenCalledTimes(1);
    stop();
  });

  it('quay lại tab trong cùng ngày thì không gọi', () => {
    const onNewDay = vi.fn();
    const page = fakePage();
    const stop = startDayWatcher(onNewDay, { target: page.target, isVisible: page.isVisible });
    page.show();
    expect(onNewDay).not.toHaveBeenCalled();
    stop();
  });

  it('đã dừng thì không gọi nữa', () => {
    const onNewDay = vi.fn();
    const page = fakePage();
    const stop = startDayWatcher(onNewDay, { target: page.target, isVisible: page.isVisible });
    stop();
    vi.advanceTimersByTime(24 * 60 * 60 * 1000);
    page.show();
    expect(onNewDay).not.toHaveBeenCalled();
  });
});
