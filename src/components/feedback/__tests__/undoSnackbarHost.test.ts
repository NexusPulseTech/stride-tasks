import { describe, expect, it } from 'vitest';
import { undoSnackbarHost } from '../undoSnackbarHost';

// Tài liệu giả tối thiểu: chỉ cần body và querySelectorAll cho hộp thoại aria-modal
function fakeDoc(dialogs: string[]) {
  const body = { name: 'body' } as unknown as HTMLElement;
  const nodes = dialogs.map((name) => ({ name }) as unknown as Element);
  return {
    body,
    querySelectorAll: (selector: string) => {
      expect(selector).toContain('aria-modal="true"');
      return nodes as unknown as NodeListOf<Element>;
    },
  } as unknown as Pick<Document, 'body' | 'querySelectorAll'>;
}
const nameOf = (el: Element) => (el as unknown as { name: string }).name;

describe('B15: thanh Undo nằm trong hộp thoại aria-modal đang mở', () => {
  it('không có hộp thoại thì gắn vào body như cũ', () => {
    expect(nameOf(undoSnackbarHost(fakeDoc([])))).toBe('body');
  });

  it('đang mở ô báo cáo sau Shutdown Ritual (trên Daily Focus) thì gắn vào hộp thoại trên cùng', () => {
    expect(nameOf(undoSnackbarHost(fakeDoc(['daily-focus', 'markdown-report'])))).toBe('markdown-report');
  });

  it('chỉ mở Daily Focus thì gắn vào Daily Focus (Undo của nút Done)', () => {
    expect(nameOf(undoSnackbarHost(fakeDoc(['daily-focus'])))).toBe('daily-focus');
  });
});
