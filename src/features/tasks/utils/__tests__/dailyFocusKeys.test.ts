import { describe, expect, it } from 'vitest';
import type { ActionableItem } from '../spacedSnooze';
import { resolveFocusShortcut } from '../dailyFocusKeys';

const item = (id: string): ActionableItem => ({
  id,
  title: id,
  projectId: 'p1',
  projectName: 'P',
  taskId: id,
  taskTitle: id,
  isSubtask: false,
  parentPath: [id],
  depth: 0,
  status: 'todo',
});

describe('F09: phím 1, 2, 3 chỉ tác động ở tab Due Today', () => {
  it('ở Due Today, phím 2 áp lựa chọn thứ hai cho việc đầu tiên', () => {
    expect(resolveFocusShortcut('2', 'due', [item('a'), item('b')])).toEqual({ item: item('a'), optionIndex: 1 });
  });

  it('ở tab Snoozed, phím 1, 2, 3 không làm gì (trước đây dời hoặc đưa việc đang hoãn về ngay, không hoàn tác được)', () => {
    for (const key of ['1', '2', '3']) expect(resolveFocusShortcut(key, 'snoozed', [item('s')])).toBeNull();
  });

  it('phím khác hoặc danh sách trống thì không làm gì', () => {
    expect(resolveFocusShortcut('4', 'due', [item('a')])).toBeNull();
    expect(resolveFocusShortcut('1', 'due', [])).toBeNull();
  });
});
