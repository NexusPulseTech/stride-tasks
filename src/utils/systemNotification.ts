/**
 * Hiện thông báo hệ thống và trả về kết quả THẬT (B14).
 *
 * Trên gần như mọi trình duyệt di động, constructor `new Notification()` ném TypeError; phải dùng
 * `ServiceWorkerRegistration.showNotification()` (MDN, trang Notification()). Trước B14 app gọi constructor
 * trong `try { } catch (e) {}` nên trên Android nhắc việc không bao giờ hiện mà app vẫn báo "đã bật".
 *
 * Thứ tự: service worker đang active thì dùng `showNotification`; không có thì dùng constructor (bản dev,
 * desktop không có SW). Lỗi không bị nuốt: ghi `warn` kèm lỗi và trả `failed` để giao diện nói đúng sự thật.
 *
 * Kiểu dữ liệu tối thiểu để test được bằng đối tượng giả; `window.Notification` và `navigator.serviceWorker`
 * thật thỏa mãn.
 */

export type SystemNotificationResult = 'shown' | 'unsupported' | 'denied' | 'failed';

export interface NotificationRegistrationLike {
  active: unknown;
  showNotification(title: string, options?: NotificationOptions): Promise<void>;
}

export interface NotificationEnv {
  Notification?: {
    readonly permission: NotificationPermission;
    new (title: string, options?: NotificationOptions): unknown;
  };
  serviceWorker?: { getRegistration(): Promise<NotificationRegistrationLike | undefined> };
  logger?: { warn: (...args: unknown[]) => void };
}

export function browserNotificationEnv(): NotificationEnv {
  if (typeof window === 'undefined') return {};
  return {
    Notification: 'Notification' in window ? window.Notification : undefined,
    serviceWorker:
      typeof navigator !== 'undefined' && 'serviceWorker' in navigator
        ? (navigator.serviceWorker as unknown as NotificationEnv['serviceWorker'])
        : undefined,
    logger: console,
  };
}

export async function showSystemNotification(
  title: string,
  options: NotificationOptions = {},
  env: NotificationEnv = browserNotificationEnv()
): Promise<SystemNotificationResult> {
  const NotificationCtor = env.Notification;
  const logger = env.logger ?? console;
  if (!NotificationCtor) return 'unsupported';
  if (NotificationCtor.permission !== 'granted') return 'denied';

  let registration: NotificationRegistrationLike | undefined;
  try {
    registration = await env.serviceWorker?.getRegistration();
  } catch (error) {
    logger.warn('[notify] serviceWorker.getRegistration() failed, falling back to the Notification constructor', error);
  }

  if (registration?.active) {
    try {
      await registration.showNotification(title, options);
      return 'shown';
    } catch (error) {
      logger.warn('[notify] registration.showNotification() failed', error);
      return 'failed';
    }
  }

  try {
    new NotificationCtor(title, options);
    return 'shown';
  } catch (error) {
    logger.warn('[notify] Notification constructor failed (mobile browsers need an active service worker)', error);
    return 'failed';
  }
}
