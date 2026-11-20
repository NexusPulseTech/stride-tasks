export const MODAL_DIALOG_SELECTOR = '[role="dialog"][aria-modal="true"]';

/**
 * Phần tử DOM để gắn thanh Undo. B15: khi đang mở hộp thoại `aria-modal` (Daily Focus, ô báo cáo sau Shutdown Ritual),
 * phần còn lại của trang bị trình đọc màn hình coi là không dùng được, nên thanh Undo phải nằm trong hộp thoại trên
 * cùng (z-index cao nhất, bằng nhau thì hộp mở sau). Không có hộp thoại thì gắn vào body như cũ.
 */
export function undoSnackbarHost(doc: Pick<Document, 'body' | 'querySelectorAll'>): Element {
  let best: Element | null = null;
  let bestZ = -Infinity;
  for (const el of Array.from(doc.querySelectorAll(MODAL_DIALOG_SELECTOR))) {
    const z = Number((el as HTMLElement).style?.zIndex) || 0;
    if (z >= bestZ) {
      best = el;
      bestZ = z;
    }
  }
  return best ?? doc.body;
}
