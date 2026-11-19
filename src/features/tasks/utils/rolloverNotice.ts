import { pluralize } from '../../../i18n';
import type { Translations } from '../../../i18n';

/**
 * Câu thông báo sau khi làm mới việc lặp lại cho ngày mới, đúng số ít và số nhiều theo ngôn ngữ (B15: trước đây luôn
 * dùng dạng số nhiều, nên tiếng Anh ra "Refreshed 1 recurring tasks").
 */
export function rolloverNotice(toast: Translations['toast'], count: number): string {
  return pluralize(count, toast.recurringRolledOverOne, toast.recurringRolledOver);
}
