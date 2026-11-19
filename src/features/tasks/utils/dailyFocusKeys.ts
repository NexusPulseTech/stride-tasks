import type { ActionableItem } from './spacedSnooze';

export type DailyFocusTab = 'due' | 'snoozed';

/**
 * Phím 1, 2, 3 trong Daily Focus áp cho việc nào, với lựa chọn thứ mấy (0, 1, 2).
 * B15 F09: chỉ ở tab Due Today. Ở tab Snoozed, phím từng dời thêm hoặc đưa việc đang hoãn về ngay mà người dùng không
 * thấy rõ đang tác động vào việc nào; ở đó vẫn bấm được nút trên từng việc.
 */
export function resolveFocusShortcut(
  key: string,
  activeTab: DailyFocusTab,
  currentList: ActionableItem[]
): { item: ActionableItem; optionIndex: 0 | 1 | 2 } | null {
  if (activeTab !== 'due') return null;
  const optionIndex = key === '1' ? 0 : key === '2' ? 1 : key === '3' ? 2 : -1;
  if (optionIndex < 0) return null;
  const item = currentList[0];
  if (!item) return null;
  return { item, optionIndex: optionIndex as 0 | 1 | 2 };
}
