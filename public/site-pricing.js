/*
 * Giá theo quốc gia trên trang đích (A13). Hỏi cùng máy chủ giá với app (/v1/pricing);
 * lỗi mạng hay máy chủ không trả lời thì giữ nguyên giá tĩnh trong HTML.
 * Bảng PRICES phải khớp PRICING_TIERS trong src/config/commerceConfig.ts (test: src/config/__tests__/sitePricing.test.ts).
 *
 * A14: để đợt khách lớn (Show HN) không tiêu hết hạn mức Worker, chỉ hỏi máy chủ khi bảng giá sắp vào màn hình,
 * và nhớ kết quả 24 giờ trong localStorage (khóa riêng của trang đích, không đụng khóa của app).
 */
(function () {
  'use strict';
  var API = 'https://tasks-api.nexuspulsetech.xyz/v1/pricing';
  var CACHE_KEY = 'STRIDE_SITE_PRICING_V1';
  var CACHE_MS = 24 * 60 * 60 * 1000;
  var PRICES = {
    'global-us': { now: '$19', later: '$29' },
    'emerging-ppp': { now: '$9.95', later: '$14.95' },
  };

  function countryName(code, lang) {
    try {
      return new Intl.DisplayNames([lang], { type: 'region' }).of(code) || code;
    } catch (e) {
      return code;
    }
  }

  function apply(geo) {
    // Giá vùng chỉ khi máy chủ trả link thanh toán giá vùng, giống resolveTier trong app
    var regional =
      geo.tier !== 'global-us' &&
      typeof geo.regionalCheckoutUrl === 'string' &&
      geo.regionalCheckoutUrl.indexOf('https://') === 0;
    var price = PRICES[regional ? 'emerging-ppp' : 'global-us'];
    var lang = document.documentElement.lang === 'vi' ? 'vi' : 'en';
    var country = typeof geo.country === 'string' && /^[A-Z]{2}$/.test(geo.country) ? countryName(geo.country, lang) : null;

    document.querySelectorAll('[data-price]').forEach(function (el) {
      el.textContent = price.now;
    });
    document.querySelectorAll('[data-price-later]').forEach(function (el) {
      el.textContent = price.later;
    });
    if (!country) return;
    document.querySelectorAll('[data-price-region]').forEach(function (el) {
      var template = el.getAttribute(regional ? 'data-text-regional' : 'data-text-global');
      if (template) el.textContent = template.replace('{country}', country);
    });
  }

  function readCache() {
    try {
      var saved = JSON.parse(window.localStorage.getItem(CACHE_KEY) || 'null');
      var age = saved && typeof saved.at === 'number' ? Date.now() - saved.at : -1;
      if (age < 0 || age > CACHE_MS || !saved.geo || typeof saved.geo.tier !== 'string') return null;
      return saved.geo;
    } catch (e) {
      return null;
    }
  }

  function writeCache(geo) {
    try {
      var keep = { country: geo.country, tier: geo.tier, regionalCheckoutUrl: geo.regionalCheckoutUrl };
      window.localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), geo: keep }));
    } catch (e) {}
  }

  function fetchPricing() {
    if (!window.fetch) return;
    fetch(API, { cache: 'no-store', credentials: 'omit' })
      .then(function (res) {
        return res.ok ? res.json() : null;
      })
      .then(function (geo) {
        if (geo && typeof geo.tier === 'string') {
          writeCache(geo);
          apply(geo);
        }
      })
      .catch(function () {});
  }

  var cached = readCache();
  if (cached) {
    apply(cached);
    return;
  }
  // Giá chỉ nằm trong mục #pricing: người không kéo tới đó thì không cần hỏi máy chủ
  var section = document.getElementById('pricing');
  if (!section || !('IntersectionObserver' in window)) {
    fetchPricing();
    return;
  }
  var observer = new IntersectionObserver(
    function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          observer.disconnect();
          fetchPricing();
          return;
        }
      }
    },
    { rootMargin: '800px 0px' }
  );
  observer.observe(section);
})();
