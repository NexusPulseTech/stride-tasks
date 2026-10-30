/**
 * Lịch hỏi Worker xem đơn đã thanh toán chưa (claim): dày lúc đầu, thưa dần rồi dừng.
 * Giới hạn số request để vài tab để mở lâu không làm cạn hạn mức Worker (docs/05-api-contracts/02-fe-be-alignment-audit.md).
 * Một cửa sổ hỏi tối đa ~75 request; mở lại tab/cửa sổ thì bắt đầu cửa sổ mới.
 */
export const CLAIM_FAST_INTERVAL_MS = 6_000;
export const CLAIM_FAST_WINDOW_MS = 5 * 60_000;
export const CLAIM_SLOW_INTERVAL_MS = 60_000;
export const CLAIM_POLL_WINDOW_MS = 30 * 60_000;

/** Thời gian chờ tới lần hỏi kế tiếp tính từ đầu cửa sổ hỏi; `null` nghĩa là dừng cửa sổ này */
export function nextClaimDelay(elapsedMs: number): number | null {
  if (elapsedMs < CLAIM_FAST_WINDOW_MS) return CLAIM_FAST_INTERVAL_MS;
  if (elapsedMs < CLAIM_POLL_WINDOW_MS) return CLAIM_SLOW_INTERVAL_MS;
  return null;
}

/** Bí mật nhận bản quyền: 128 bit ngẫu nhiên (hex), chỉ lưu trên thiết bị, máy chủ chỉ biết băm SHA-256 */
export function generateClaimSecret(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return toHex(new Uint8Array(digest));
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
