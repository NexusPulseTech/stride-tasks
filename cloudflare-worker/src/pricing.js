/**
 * Giá theo sức mua (PPP) do máy chủ quyết định từ quốc gia của IP (A12). Người mua thấy một giá, không tự chọn bậc.
 *
 * Thị trường mới nổi = các nước thu nhập thấp, trung bình thấp và trung bình cao theo phân loại của World Bank
 * (api.worldbank.org/v2/country, lấy ngày 2026-11-10, 131 nước). World Bank cập nhật phân loại mỗi tháng 7: xem lại
 * danh sách khi đó. Thu nhập cao và nước không xác định nhận giá quốc tế.
 */
export const EMERGING_COUNTRIES = new Set([
  'AF', 'AL', 'AM', 'AO', 'AR', 'AZ', 'BA', 'BD', 'BF', 'BI', 'BJ', 'BO', 'BR', 'BT', 'BW', 'BY', 'BZ', 'CD', 'CF', 'CG',
  'CI', 'CM', 'CN', 'CO', 'CU', 'CV', 'DJ', 'DM', 'DO', 'DZ', 'EC', 'EG', 'ER', 'ET', 'FJ', 'FM', 'GA', 'GD', 'GE', 'GH',
  'GM', 'GN', 'GQ', 'GT', 'GW', 'HN', 'HT', 'ID', 'IN', 'IQ', 'IR', 'JM', 'JO', 'KE', 'KG', 'KH', 'KI', 'KM', 'KP', 'KZ',
  'LA', 'LB', 'LC', 'LK', 'LR', 'LS', 'LY', 'MA', 'MD', 'ME', 'MG', 'MH', 'MK', 'ML', 'MM', 'MN', 'MR', 'MU', 'MV', 'MW',
  'MX', 'MY', 'MZ', 'NA', 'NE', 'NG', 'NI', 'NP', 'PE', 'PG', 'PH', 'PK', 'PS', 'PY', 'RS', 'RW', 'SB', 'SD', 'SL', 'SN',
  'SO', 'SR', 'SS', 'ST', 'SV', 'SY', 'SZ', 'TD', 'TG', 'TH', 'TJ', 'TL', 'TM', 'TN', 'TO', 'TR', 'TV', 'TZ', 'UA', 'UG',
  'UZ', 'VC', 'VE', 'VN', 'VU', 'WS', 'XK', 'YE', 'ZA', 'ZM', 'ZW',
]);

const COUNTRY_CODE = /^[A-Z]{2}$/;
// Cloudflare dùng XX khi không xác định được nước và T1 cho mạng Tor
const UNKNOWN_COUNTRIES = new Set(['XX', 'T1']);

/** Việt Nam có bậc riêng (VietQR); app tự rơi về giá thị trường mới nổi khi kênh VietQR chưa mở */
export function tierForCountry(country) {
  const code = String(country || '').toUpperCase();
  if (code === 'VN') return 'vn-ppp';
  if (EMERGING_COUNTRIES.has(code)) return 'emerging-ppp';
  return 'global-us';
}

export function countryOf(request) {
  const raw = String(request.cf?.country || request.headers.get('CF-IPCountry') || '').toUpperCase();
  return COUNTRY_CODE.test(raw) && !UNKNOWN_COUNTRIES.has(raw) ? raw : null;
}

/**
 * Hợp đồng GET /v1/pricing (docs/05-api-contracts/openapi.yaml). Link checkout giá vùng chỉ trả cho nước đủ điều kiện,
 * nên không cần nằm trong bundle công khai của app.
 */
export function pricingForRequest(request, env) {
  const country = countryOf(request);
  const tier = country ? tierForCountry(country) : 'global-us';
  const regional = tier === 'global-us' ? '' : String(env.POLAR_CHECKOUT_URL_EMERGING || '').trim();
  return { country, tier, regionalCheckoutUrl: /^https:\/\/\S+$/.test(regional) ? regional : null };
}
