import type { SystemNotificationResult } from '../../../utils/systemNotification';

/** Kênh nhắc việc đang chạy thật: thông báo hệ thống, hoặc chỉ banner trong app (B14) */
export type ReminderChannel = 'system' | 'in-app';

export type ReminderEnableToast = 'periodicReminderOn' | 'systemNotifyFailed' | 'inAppReminderOn';

/**
 * Kết quả khi người dùng bật nhắc việc. Chỉ báo "đã bật nhắc định kỳ" khi thông báo xác nhận hiện được thật;
 * quyền đã cấp mà không hiện được thì nói rõ chỉ còn nhắc trong app; chưa cấp quyền thì báo nhắc trong app.
 * `permission: 'error'` là khi chính `requestPermission()` ném lỗi.
 */
export function resolveReminderEnable(
  permission: NotificationPermission | 'unsupported' | 'error',
  confirmation?: SystemNotificationResult
): { channel: ReminderChannel; toast: ReminderEnableToast } {
  if (permission === 'granted' && confirmation === 'shown') return { channel: 'system', toast: 'periodicReminderOn' };
  if (permission === 'granted' || permission === 'error') return { channel: 'in-app', toast: 'systemNotifyFailed' };
  return { channel: 'in-app', toast: 'inAppReminderOn' };
}

/**
 * Kênh sau một lần gửi nhắc định kỳ hoặc theo lịch. `warnUser` chỉ bật đúng lần chuyển từ hệ thống sang lỗi,
 * để người dùng biết một lần mà không bị lặp toast ở mỗi chu kỳ.
 */
export function nextReminderChannel(
  previous: ReminderChannel,
  result: SystemNotificationResult
): { channel: ReminderChannel; warnUser: boolean } {
  if (result === 'shown') return { channel: 'system', warnUser: false };
  return { channel: 'in-app', warnUser: result === 'failed' && previous === 'system' };
}
