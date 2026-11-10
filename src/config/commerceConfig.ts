/**
 * Cấu hình thương mại tập trung, đọc từ biến môi trường Vite LÚC BUILD (xem .env.example).
 *
 * Paywall mặc định TẮT: khi VITE_ENABLE_PAYWALL !== 'true', mọi tính năng (NLP, Kanban, Pomodoro,
 * Command Palette, Markdown Report, không giới hạn dự án) mở cho tất cả người dùng và mọi nút mua bị ẩn.
 * Chỉ bật khi đã có kênh thu tiền thật.
 */

export type PricingRegionId = 'vn-ppp' | 'emerging-ppp' | 'global-us';
export type CheckoutChannel = 'vietqr' | 'lemonsqueezy' | 'polar';

export interface PricingTier {
  id: PricingRegionId;
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
  /** Checkout Link của Polar (ADR-0006). Có giá trị thì ưu tiên hơn LemonSqueezy */
  polarCheckoutUrl: readEnv(import.meta.env.VITE_POLAR_CHECKOUT_URL),
  polarCheckoutUrlEmerging: readEnv(import.meta.env.VITE_POLAR_CHECKOUT_URL_EMERGING),
  supportEmail: readEnv(import.meta.env.VITE_SUPPORT_EMAIL) || 'support@nexuspulsetech.xyz',
  /** URL Worker đồng bộ mã hóa đầu-cuối (cloudflare-worker/). Rỗng → tính năng Sync bị ẩn */
  syncApiUrl: readEnv(import.meta.env.VITE_SYNC_API_URL).replace(/\/+$/, ''),
  vnPriceVnd: 149000,
  appOrigin: 'https://tasks.nexuspulsetech.xyz',
} as const;

/** Kênh thẻ quốc tế: Polar nếu đã cấu hình, nếu không dùng LemonSqueezy cũ */
function cardChannel(polarUrl: string, lemonUrl: string): Pick<PricingTier, 'channel' | 'checkoutUrl' | 'isAvailable' | 'keyPrefix'> {
  if (polarUrl) return { channel: 'polar', checkoutUrl: polarUrl, isAvailable: true, keyPrefix: 'PL' };
  return { channel: 'lemonsqueezy', checkoutUrl: lemonUrl, isAvailable: lemonUrl.length > 0, keyPrefix: 'LS' };
}

// Giá Thành viên sáng lập cho 100 bản quyền đầu (docs/02-growth/marketing-kit/07-founding-offer-and-waitlist.md).
// Hết 100 suất: 199.000₫ / $14.95 / $29, đổi cùng lúc với PRICE_VND của Worker và giá trên cổng thanh toán.
export const PRICING_TIERS: Record<PricingRegionId, PricingTier> = {
  'vn-ppp': {
    id: 'vn-ppp',
    priceUsd: 5.95,
    priceDisplay: '149.000₫',
    channel: 'vietqr',
    checkoutUrl: COMMERCE_CONFIG.vietQrImageUrl,
    isAvailable: COMMERCE_CONFIG.vietQrImageUrl.length > 0,
    keyPrefix: 'VN',
  },
  'emerging-ppp': {
    id: 'emerging-ppp',
    priceUsd: 9.95,
    priceDisplay: '$9.95',
    ...cardChannel(COMMERCE_CONFIG.polarCheckoutUrlEmerging, COMMERCE_CONFIG.lemonSqueezyCheckoutUrlEmerging),
  },
  'global-us': {
    id: 'global-us',
    priceUsd: 19,
    priceDisplay: '$19',
    ...cardChannel(COMMERCE_CONFIG.polarCheckoutUrl, COMMERCE_CONFIG.lemonSqueezyCheckoutUrl),
  },
};

const PRICING_REGIONS: ReadonlySet<string> = new Set<PricingRegionId>(['vn-ppp', 'emerging-ppp', 'global-us']);

/** Kết quả GET /v1/pricing của Worker (A12): máy chủ quyết định bậc giá theo quốc gia của IP, người mua không tự chọn */
export interface GeoPricing {
  /** Mã ISO 3166-1 alpha-2; null khi máy chủ không xác định được */
  country: string | null;
  tier: PricingRegionId;
  /** Link checkout giá vùng, máy chủ chỉ trả cho nước đủ điều kiện */
  regionalCheckoutUrl: string | null;
  /** Thời điểm lấy (ISO); app nhớ trong GEO_PRICING_MAX_AGE_MS */
  fetchedAt: string;
}

export const GEO_PRICING_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** Kiểm tra phản hồi của Worker (hoặc bản đã lưu) đúng hợp đồng; sai bất kỳ trường nào thì bỏ */
export function parseGeoPricing(raw: unknown, now: Date = new Date()): GeoPricing | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.tier !== 'string' || !PRICING_REGIONS.has(r.tier)) return null;
  const country = typeof r.country === 'string' && /^[A-Z]{2}$/.test(r.country) ? r.country : null;
  const url = typeof r.regionalCheckoutUrl === 'string' && /^https:\/\/\S+$/.test(r.regionalCheckoutUrl) ? r.regionalCheckoutUrl : null;
  const fetchedAt = typeof r.fetchedAt === 'string' && !Number.isNaN(Date.parse(r.fetchedAt)) ? r.fetchedAt : now.toISOString();
  return { country, tier: r.tier as PricingRegionId, regionalCheckoutUrl: url, fetchedAt };
}

export function isGeoPricingFresh(geo: GeoPricing, now: Date = new Date()): boolean {
  return now.getTime() - Date.parse(geo.fetchedAt) < GEO_PRICING_MAX_AGE_MS;
}

/**
 * Bậc giá DUY NHẤT hiển thị cho người dùng, theo vùng máy chủ đã xác định (hoặc suy đoán khi chưa có).
 * - vn-ppp: VietQR nếu đã bật; chưa bật thì giá thị trường mới nổi qua thẻ.
 * - emerging-ppp: link giá vùng do máy chủ trả; dự phòng link trong cấu hình build; thiếu cả hai thì giá quốc tế.
 * - global-us: giá quốc tế.
 */
export function resolveTier(
  region: PricingRegionId,
  regionalCheckoutUrl: string | null,
  tiers: Record<PricingRegionId, PricingTier> = PRICING_TIERS
): PricingTier | undefined {
  const global = tiers['global-us'].isAvailable ? tiers['global-us'] : undefined;
  if (region === 'vn-ppp' && tiers['vn-ppp'].isAvailable) return tiers['vn-ppp'];
  if (region === 'global-us') return global;
  const emerging = tiers['emerging-ppp'];
  if (regionalCheckoutUrl) return { ...emerging, channel: 'polar', checkoutUrl: regionalCheckoutUrl, isAvailable: true, keyPrefix: 'PL' };
  return emerging.isAvailable ? emerging : global;
}

/** Suy đoán khi chưa hỏi được máy chủ: 'vn-ppp' khi múi giờ Việt Nam hoặc ngôn ngữ trình duyệt là tiếng Việt, còn lại 'global-us' */
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

/** Polar chép reference_id của Checkout Link vào metadata đơn, Worker dùng để nối với đơn chờ */
export function buildPolarCheckoutUrl(baseUrl: string, orderCode: string): string {
  try {
    const url = new URL(baseUrl);
    url.searchParams.set('reference_id', orderCode);
    return url.toString();
  } catch {
    return baseUrl;
  }
}

export function buildCardCheckoutUrl(tier: PricingTier, orderCode: string): string {
  return tier.channel === 'polar' ? buildPolarCheckoutUrl(tier.checkoutUrl, orderCode) : buildLemonSqueezyCheckoutUrl(tier.checkoutUrl, orderCode);
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
