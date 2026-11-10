/*
 * Giá theo quốc gia trên trang đích (A13). Hỏi cùng máy chủ giá với app (/v1/pricing);
 * lỗi mạng hay máy chủ không trả lời thì giữ nguyên giá tĩnh trong HTML.
 * Bảng PRICES phải khớp PRICING_TIERS trong src/config/commerceConfig.ts (test: src/config/__tests__/sitePricing.test.ts).
 */
(function () {
  'use strict';
  var API = 'https://tasks-api.nexuspulsetech.xyz/v1/pricing';
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

  if (!window.fetch) return;
  fetch(API, { cache: 'no-store', credentials: 'omit' })
    .then(function (res) {
      return res.ok ? res.json() : null;
    })
    .then(function (geo) {
      if (geo && typeof geo.tier === 'string') apply(geo);
    })
    .catch(function () {});
})();
