/**
 * Cấu hình thương mại tập trung — đọc từ biến môi trường Vite LÚC BUILD (xem .env.example).
 *
 * Paywall mặc định TẮT: khi VITE_ENABLE_PAYWALL !== 'true', mọi tính năng (NLP, Kanban, Pomodoro,
 * Command Palette, Markdown Report, không giới hạn dự án) mở cho tất cả người dùng và mọi nút mua bị ẩn.
 * Chỉ bật khi đã có kênh thu tiền thật.
 */

export type PricingRegionId = 'vn-ppp' | 'emerging-ppp' | 'global-us';
export type CheckoutChannel = 'vietqr' | 'lemonsqueezy';

export interface PricingTier {
  id: PricingRegionId;
  flag: string;
  priceUsd: number;
  /** Giá hiển thị không phụ thuộc ngôn ngữ */
  priceDisplay: string;
  channel: CheckoutChannel;
  /** VietQR: URL ảnh/mẫu ảnh QR · LemonSqueezy: URL checkout */
  checkoutUrl: string;
  /** Kênh chỉ hiện nút mua khi đã cấu hình URL thật */
  isAvailable: boolean;
  keyPrefix: string;
}

const readEnv = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

export const PAYWALL_ENABLED = import.meta.env.VITE_ENABLE_PAYWALL === 'true';

export const COMMERCE_CONFIG = {
  /**
   * Ảnh VietQR. Có thể là ảnh tĩnh, hoặc mẫu có placeholder {amount} và {orderCode} để tạo QR động, VD:
   * https://img.vietqr.io/image/<BANK>-<ACCOUNT>-compact2.png?amount={amount}&addInfo={orderCode}&accountName=<TEN>
   */
  vietQrImageUrl: readEnv(import.meta.env.VITE_VIETQR_IMAGE_URL),
  /** URL gốc của Cloudflare Worker cấp bản quyền tự động (tùy chọn). App gọi `${url}/claim?order=<mã>` */
  licenseClaimUrl: readEnv(import.meta.env.VITE_LICENSE_CLAIM_URL).replace(/\/+$/, ''),
  lemonSqueezyCheckoutUrl: readEnv(import.meta.env.VITE_LEMONSQUEEZY_CHECKOUT_URL),
  lemonSqueezyCheckoutUrlEmerging: readEnv(import.meta.env.VITE_LEMONSQUEEZY_CHECKOUT_URL_EMERGING),
  supportEmail: readEnv(import.meta.env.VITE_SUPPORT_EMAIL) || 'support@nexuspulsetech.xyz',
  /** URL Worker đồng bộ mã hóa đầu-cuối (cloudflare-worker/). Rỗng → tính năng Sync bị ẩn */
  syncApiUrl: readEnv(import.meta.env.VITE_SYNC_API_URL).replace(/\/+$/, ''),
  vnPriceVnd: 199000,
  appOrigin: 'https://tasks.nexuspulsetech.xyz',
} as const;

export const PRICING_TIERS: Record<PricingRegionId, PricingTier> = {
  'vn-ppp': {
    id: 'vn-ppp',
    flag: '🇻🇳',
    priceUsd: 7.95,
    priceDisplay: '199.000₫',
    channel: 'vietqr',
    checkoutUrl: COMMERCE_CONFIG.vietQrImageUrl,
    isAvailable: COMMERCE_CONFIG.vietQrImageUrl.length > 0,
    keyPrefix: 'VN',
  },
  'emerging-ppp': {
    id: 'emerging-ppp',
    flag: '🌏',
    priceUsd: 14.95,
    priceDisplay: '$14.95',
    channel: 'lemonsqueezy',
    checkoutUrl: COMMERCE_CONFIG.lemonSqueezyCheckoutUrlEmerging,
    isAvailable: COMMERCE_CONFIG.lemonSqueezyCheckoutUrlEmerging.length > 0,
    keyPrefix: 'LS',
  },
  'global-us': {
    id: 'global-us',
    flag: '🌎',
    priceUsd: 25.95,
    priceDisplay: '$25.95',
    channel: 'lemonsqueezy',
    checkoutUrl: COMMERCE_CONFIG.lemonSqueezyCheckoutUrl,
    isAvailable: COMMERCE_CONFIG.lemonSqueezyCheckoutUrl.length > 0,
    keyPrefix: 'LS',
  },
};

export const PRICING_REGION_ORDER: PricingRegionId[] = ['vn-ppp', 'emerging-ppp', 'global-us'];

export function getAvailableTiers(): PricingTier[] {
  return PRICING_REGION_ORDER.map((id) => PRICING_TIERS[id]).filter((tier) => tier.isAvailable);
}

/** Mặc định 'global-us'; chỉ chọn 'vn-ppp' khi múi giờ Việt Nam hoặc ngôn ngữ trình duyệt là tiếng Việt */
export function detectDefaultPricingRegion(): PricingRegionId {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const lang = (typeof navigator !== 'undefined' ? navigator.language || '' : '').toLowerCase();
    if (tz === 'Asia/Ho_Chi_Minh' || tz === 'Asia/Saigon' || lang.startsWith('vi')) {
      return 'vn-ppp';
    }
  } catch {
    // Intl không khả dụng → dùng mặc định toàn cầu
  }
  return 'global-us';
}

const ORDER_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Mã đơn duy nhất gắn vào nội dung chuyển khoản / custom data checkout, VD: STRK7P2QX */
export function generateOrderCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let code = 'STR';
  for (const b of bytes) code += ORDER_ALPHABET[b % ORDER_ALPHABET.length];
  return code;
}

export const ORDER_CODE_PATTERN = /^STR[A-HJ-NP-Z2-9]{6}$/;

export function buildVietQrImageUrl(template: string, amountVnd: number, orderCode: string): string {
  return template
    .replace(/\{amount\}/g, encodeURIComponent(String(amountVnd)))
    .replace(/\{orderCode\}/g, encodeURIComponent(orderCode));
}

export function isDynamicVietQr(template: string): boolean {
  return template.includes('{orderCode}');
}

/** Gắn mã đơn vào checkout LemonSqueezy qua custom data để Worker nhận lại trong webhook */
export function buildLemonSqueezyCheckoutUrl(baseUrl: string, orderCode: string): string {
  try {
    const url = new URL(baseUrl);
    url.searchParams.set('checkout[custom][stride_ref]', orderCode);
    return url.toString();
  } catch {
    return baseUrl;
  }
}
