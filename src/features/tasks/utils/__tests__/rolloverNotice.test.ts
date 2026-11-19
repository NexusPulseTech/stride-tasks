import { describe, expect, it } from 'vitest';
import { en } from '../../../../i18n/en';
import { vi } from '../../../../i18n/vi';
import { rolloverNotice } from '../rolloverNotice';

describe('B15: thông báo làm mới việc lặp lại dùng đúng số ít, số nhiều', () => {
  it('tiếng Anh: 1 việc dùng số ít, nhiều việc dùng số nhiều (trước đây "Refreshed 1 recurring tasks")', () => {
    expect(rolloverNotice(en.toast, 1)).toBe('Refreshed 1 recurring task for today.');
    expect(rolloverNotice(en.toast, 3)).toBe('Refreshed 3 recurring tasks for today.');
  });

  it('tiếng Việt: câu đúng với cả 1 và nhiều việc', () => {
    expect(rolloverNotice(vi.toast, 1)).toBe('Đã tự động làm mới 1 việc lặp lại cho ngày hôm nay.');
    expect(rolloverNotice(vi.toast, 3)).toBe('Đã tự động làm mới 3 việc lặp lại cho ngày hôm nay.');
  });
});
