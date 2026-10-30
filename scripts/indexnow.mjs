#!/usr/bin/env node
/**
 * Stride Tasks: báo URL mới hoặc vừa sửa cho các công cụ tìm kiếm dùng IndexNow (Bing, Yandex, Seznam, Naver...).
 *
 *   npm run indexnow -- init                         Tạo file khóa public/<key>.txt (khóa IndexNow công khai theo thiết kế)
 *   npm run indexnow -- check                        Kiểm tra site thật đã trả đúng file khóa
 *   npm run indexnow -- submit [url ...] [--dry-run] Gửi các URL chỉ định, mặc định là mọi URL trong public/sitemap.xml
 *
 * Chỉ gửi khi trang thật sự thêm, sửa hoặc xóa. Gửi lặp URL không đổi dễ bị coi là spam (HTTP 429).
 * Đặc tả: https://www.indexnow.org/documentation
 */
import { randomBytes } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = resolve(ROOT, 'public');
const SITE_ORIGIN = 'https://tasks.nexuspulsetech.xyz';
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const KEY_FILE = /^([0-9a-f]{32})\.txt$/;

// Ý nghĩa mã phản hồi theo đặc tả IndexNow
const RESPONSES = {
  200: 'Đã nhận URL.',
  202: 'Đã nhận URL, khóa đang chờ xác minh.',
  400: 'Sai định dạng yêu cầu.',
  403: 'Khóa không hợp lệ: không tìm thấy file khóa hoặc nội dung không khớp.',
  422: 'URL không thuộc host, hoặc khóa không khớp.',
  429: 'Gửi quá nhiều, bị coi là spam. Chỉ gửi URL thật sự thay đổi.',
};

function die(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

function findKey() {
  const keys = readdirSync(PUBLIC_DIR)
    .map((name) => name.match(KEY_FILE)?.[1])
    .filter(Boolean);
  if (keys.length > 1) die(`Có ${keys.length} file khóa IndexNow trong public/, chỉ giữ một.`);
  return keys[0] ?? null;
}

function sitemapUrls() {
  const xml = readFileSync(resolve(PUBLIC_DIR, 'sitemap.xml'), 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim());
}

function init() {
  const existing = findKey();
  if (existing) {
    console.log(`Đã có khóa: public/${existing}.txt`);
    return;
  }
  const key = randomBytes(16).toString('hex');
  writeFileSync(resolve(PUBLIC_DIR, `${key}.txt`), key, 'utf8');
  console.log(`✔ Đã tạo public/${key}.txt. Deploy xong thì chạy: npm run indexnow -- check`);
}

async function check(key) {
  const url = `${SITE_ORIGIN}/${key}.txt`;
  const res = await fetch(url, { redirect: 'manual' });
  const body = (await res.text()).trim();
  if (res.status !== 200 || body !== key) {
    die(`${url} trả về HTTP ${res.status}, nội dung ${body === key ? 'khớp' : 'không khớp'} khóa.`);
  }
  console.log(`✔ ${url} trả đúng khóa.`);
}

async function submit(key, urls, dryRun) {
  const host = new URL(SITE_ORIGIN).host;
  const foreign = urls.filter((url) => new URL(url).host !== host);
  if (foreign.length) die(`URL không thuộc ${host}: ${foreign.join(', ')}`);

  const payload = { host, key, keyLocation: `${SITE_ORIGIN}/${key}.txt`, urlList: urls };
  if (dryRun) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });
  const note = RESPONSES[res.status] ?? 'Mã phản hồi không có trong đặc tả.';
  if (res.status !== 200 && res.status !== 202) die(`IndexNow HTTP ${res.status}: ${note}`);
  console.log(`✔ IndexNow HTTP ${res.status}: ${note} (${urls.length} URL)`);
}

const [command, ...rest] = process.argv.slice(2);
const dryRun = rest.includes('--dry-run');
const urlArgs = rest.filter((arg) => !arg.startsWith('--'));

if (command === 'init') {
  init();
} else if (command === 'check' || command === 'submit') {
  const key = findKey();
  if (!key) die('Chưa có khóa. Chạy: npm run indexnow -- init');
  if (command === 'check') await check(key);
  else await submit(key, urlArgs.length ? urlArgs : sitemapUrls(), dryRun);
} else {
  die('Lệnh: init | check | submit [url ...] [--dry-run]');
}
