/**
 * Đăng ký service worker cho bản web production (B11).
 *
 * - Không nuốt lỗi: `register` bị từ chối (chế độ riêng tư, http, trình duyệt chặn) thì cảnh báo kèm lỗi.
 * - (a) Lần cài ĐẦU thất bại (worker đang cài thành `redundant`, chưa có bản active): app mất chế độ ngoại
 *   tuyến. Ghi lỗi rồi gọi lại `register()` đúng một lần sau `retryDelayMs`. Không dùng `update()` ở đây vì
 *   spec (Install bước 12.3) gỡ registration khi không còn worker nào, và `update()` bước 3 từ chối với
 *   InvalidStateError khi newestWorker là null. Lần mở app sau vẫn đăng ký lại như bình thường.
 * - (b) Bản cập nhật cài thất bại khi đã có bản active: bản cũ vẫn phục vụ. Cảnh báo rồi gọi
 *   `registration.update()` đúng một lần; lỗi của lần đó cũng được ghi lại.
 *
 * Kiểu dữ liệu tối thiểu để test được bằng đối tượng giả; `navigator.serviceWorker` thật thỏa mãn.
 */

interface WorkerLike {
  state: string;
  addEventListener(type: 'statechange', listener: () => void): void;
}

interface RegistrationLike {
  installing: WorkerLike | null;
  active: WorkerLike | null;
  addEventListener(type: 'updatefound', listener: () => void): void;
  update(): Promise<unknown>;
}

export interface ServiceWorkerRegistrar {
  register(url: string): Promise<RegistrationLike>;
}

export interface RegisterServiceWorkerOptions {
  container: ServiceWorkerRegistrar;
  url: string;
  logger?: Pick<Console, 'warn' | 'error'>;
  retryDelayMs?: number;
  schedule?: (callback: () => void, delayMs: number) => void;
}

export const SW_RETRY_DELAY_MS = 10_000;

export function registerServiceWorker({
  container,
  url,
  logger = console,
  retryDelayMs = SW_RETRY_DELAY_MS,
  schedule = (callback, delayMs) => {
    setTimeout(callback, delayMs);
  },
}: RegisterServiceWorkerOptions): Promise<void> {
  let retriedInstall = false;
  let retriedUpdate = false;
  // `register` trả về worker đang cài và Chrome còn bắn `updatefound` cho chính worker đó: chỉ theo dõi một lần
  const watched = new Set<WorkerLike>();

  const attempt = async (): Promise<void> => {
    let registration: RegistrationLike;
    try {
      registration = await container.register(url);
    } catch (error) {
      logger.warn('[sw] Service worker registration failed; offline mode is unavailable in this browser.', error);
      return;
    }

    const watch = (worker: WorkerLike | null) => {
      if (!worker || watched.has(worker)) return;
      watched.add(worker);
      worker.addEventListener('statechange', () => {
        if (worker.state !== 'redundant') return;
        if (registration.active) {
          if (retriedUpdate) {
            logger.warn('[sw] Service worker update failed again; the current version keeps serving until the next visit.');
            return;
          }
          retriedUpdate = true;
          logger.warn('[sw] A service worker update failed to install; the current version keeps serving. Checking for the update once more.');
          registration.update().catch((error) => {
            logger.warn('[sw] Service worker update check failed.', error);
          });
          return;
        }
        if (retriedInstall) {
          logger.error('[sw] Service worker install failed again; offline mode stays unavailable until the next visit.');
          return;
        }
        retriedInstall = true;
        logger.error(
          `[sw] Service worker install failed; offline mode is unavailable. Retrying once in ${Math.round(retryDelayMs / 1000)}s.`
        );
        schedule(() => {
          void attempt();
        }, retryDelayMs);
      });
    };

    watch(registration.installing);
    registration.addEventListener('updatefound', () => watch(registration.installing));
  };

  return attempt();
}
