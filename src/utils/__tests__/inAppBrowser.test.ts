import { describe, expect, it } from 'vitest';
import { detectInAppBrowser, escapeLink, escapedHref, isEscapedVisit, platformOf } from '../inAppBrowser';

// Mẫu User-Agent rút gọn, giữ đúng phần nhận diện của từng app
const UA = {
  tiktokIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 musical_ly_34.1.0 JsSdk/2.0 NetType/WIFI Channel/App Store ByteLocale/en Region/VN BytedanceWebview/d8a21c6',
  tiktokAndroid:
    'Mozilla/5.0 (Linux; Android 14; Pixel 7 Build/UQ1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/131.0.0.0 Mobile Safari/537.36 trill_340100 JsSdk/1.0 NetType/WIFI Channel/googleplay AppName/musical_ly app_version/34.1.0 ByteLocale/en Region/VN BytedanceWebview/d8a21c6',
  instagramIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 340.0.0.22.109 (iPhone15,2; iOS 17_5; en_US; en; scale=3.00; 1179x2556; 621413112)',
  facebookIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/480.0.0.42.105;FBBV/650000000;FBDV/iPhone15,2;FBMD/iPhone;FBSN/iOS;FBSV/17.5;FBSS/3;FBID/phone;FBLC/en_US;FBOP/5]',
  facebookAndroid:
    'Mozilla/5.0 (Linux; Android 14; Pixel 7 Build/UQ1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/131.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/480.0.0.42.105;]',
  messengerIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/MessengerForiOS;FBAV/480.0.0.40.106;FBBV/1;FBDV/iPhone15,2]',
  safariIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  chromeAndroid:
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
  chromeDesktop:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
};

describe('detectInAppBrowser', () => {
  it('nhận ra trình duyệt trong TikTok, Instagram, Facebook, Messenger', () => {
    expect(detectInAppBrowser(UA.tiktokIos)).toBe('TikTok');
    expect(detectInAppBrowser(UA.tiktokAndroid)).toBe('TikTok');
    expect(detectInAppBrowser(UA.instagramIos)).toBe('Instagram');
    expect(detectInAppBrowser(UA.facebookIos)).toBe('Facebook');
    expect(detectInAppBrowser(UA.facebookAndroid)).toBe('Facebook');
    expect(detectInAppBrowser(UA.messengerIos)).toBe('Messenger');
  });

  it('không báo nhầm với Safari, Chrome trên điện thoại và máy tính', () => {
    expect(detectInAppBrowser(UA.safariIos)).toBeNull();
    expect(detectInAppBrowser(UA.chromeAndroid)).toBeNull();
    expect(detectInAppBrowser(UA.chromeDesktop)).toBeNull();
    expect(detectInAppBrowser('')).toBeNull();
  });
});

describe('platformOf', () => {
  it('phân biệt iPhone, Android và còn lại', () => {
    expect(platformOf(UA.tiktokIos)).toBe('ios');
    expect(platformOf(UA.facebookAndroid)).toBe('android');
    expect(platformOf(UA.chromeDesktop)).toBe('other');
  });
});

describe('isEscapedVisit và escapedHref', () => {
  it('nhận ?ext=1 là lượt đã thoát ra trình duyệt', () => {
    expect(isEscapedVisit('?ext=1')).toBe(true);
    expect(isEscapedVisit('?lang=en&ext=1')).toBe(true);
    expect(isEscapedVisit('?ext=0')).toBe(false);
    expect(isEscapedVisit('')).toBe(false);
  });

  it('gắn ext=1, giữ tham số cũ, bỏ phần #', () => {
    expect(escapedHref('https://tasks.nexuspulsetech.xyz/?lang=en&upgrade=pro#x')).toBe(
      'https://tasks.nexuspulsetech.xyz/?lang=en&upgrade=pro&ext=1'
    );
  });
});

describe('escapeLink', () => {
  const href = 'https://tasks.nexuspulsetech.xyz/?lang=en';

  it('Android: intent của Chrome kèm link dự phòng https', () => {
    expect(escapeLink(href, 'TikTok', 'android')).toBe(
      'intent://tasks.nexuspulsetech.xyz/?lang=en&ext=1#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=https%3A%2F%2Ftasks.nexuspulsetech.xyz%2F%3Flang%3Den%26ext%3D1;end'
    );
  });

  it('iPhone: x-safari-https, riêng Instagram dùng extbrowser', () => {
    expect(escapeLink(href, 'TikTok', 'ios')).toBe('x-safari-https://tasks.nexuspulsetech.xyz/?lang=en&ext=1');
    expect(escapeLink(href, 'Instagram', 'ios')).toBe(
      'instagram://extbrowser/?url=https%3A%2F%2Ftasks.nexuspulsetech.xyz%2F%3Flang%3Den%26ext%3D1'
    );
  });

  it('không có link khi không rõ nền tảng hoặc không phải https', () => {
    expect(escapeLink(href, 'Facebook', 'other')).toBeNull();
    expect(escapeLink('http://localhost:5173/', 'TikTok', 'android')).toBeNull();
  });
});
