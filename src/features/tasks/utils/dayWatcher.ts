import { getTodayDateString } from './recurringHelper';

/** Kiểm lại ít nhất mỗi giờ: hẹn giờ của tab nền có thể bị trình duyệt hoãn hoặc trễ sau khi máy ngủ */
const MAX_CHECK_INTERVAL_MS = 60 * 60 * 1000;

export interface DayWatcherOptions {
  /** Nơi phát sự kiện `visibilitychange` (mặc định `document`) */
  target?: Pick<EventTarget, 'addEventListener' | 'removeEventListener'>;
  /** Trang đang hiện trên màn hình (mặc định theo `document.visibilityState`) */
  isVisible?: () => boolean;
}

/** Số mili giây tới 00:00:01 ngày mai theo giờ máy */
export function msUntilNextLocalDay(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
  return Math.max(1000, next.getTime() - now.getTime());
}

/**
 * Gọi `onNewDay` mỗi khi sang ngày mới theo giờ máy trong lúc app đang mở: lúc qua nửa đêm và khi người dùng quay
 * lại tab (máy ngủ qua đêm thì hẹn giờ không chạy). B12 F03: trước đây việc lặp lại chỉ làm mới khi mở lại app.
 * Trả về hàm dừng theo dõi.
 */
export function startDayWatcher(onNewDay: () => void, options: DayWatcherOptions = {}): () => void {
  const target = options.target ?? (typeof document !== 'undefined' ? document : undefined);
  const isVisible =
    options.isVisible ?? (() => typeof document === 'undefined' || document.visibilityState === 'visible');

  let lastDay = getTodayDateString();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;

  const check = () => {
    const today = getTodayDateString();
    if (today !== lastDay) {
      lastDay = today;
      onNewDay();
    }
  };

  const arm = () => {
    if (timer !== undefined) clearTimeout(timer);
    if (stopped) return;
    timer = setTimeout(() => {
      check();
      arm();
    }, Math.min(msUntilNextLocalDay(), MAX_CHECK_INTERVAL_MS));
  };

  const onVisibility = () => {
    if (stopped || !isVisible()) return;
    check();
    arm();
  };

  target?.addEventListener('visibilitychange', onVisibility);
  arm();

  return () => {
    stopped = true;
    if (timer !== undefined) clearTimeout(timer);
    target?.removeEventListener('visibilitychange', onVisibility);
  };
}
