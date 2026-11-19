#!/usr/bin/env node
/**
 * Stride Tasks: kiểm chế độ ngoại tuyến thật (B11). Không cần thư viện, điều khiển Chrome qua giao thức DevTools.
 *
 *   npm run check:offline                              Kiểm production
 *   npm run check:offline -- http://localhost:4317/    Kiểm bản build local (vite preview)
 *
 * Pha 1, có mạng: hồ sơ Chrome tạm, chặn Cloudflare analytics, mở app, chờ service worker activated, điều khiển trang
 * và cache precache có mục.
 * Pha 2, mất mạng thật: mở lại cùng hồ sơ qua proxy chết (kể cả localhost) nên cả trang lẫn service worker đều không
 * có mạng. App phải mở được, yêu cầu mạng phải thất bại, gõ phím thật một việc mới, việc còn sau khi tải lại, và
 * hộp Daily Focus (chunk tải lười) mở được.
 *
 * Biến môi trường: CHROME_PATH (đường dẫn Chrome), OFFLINE_CHECK_KEEP=1 (giữ hồ sơ tạm để xem lại).
 * Thoát mã 0 khi đạt, 1 khi lỗi (in lý do và các dòng console [sw] của app).
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const TARGET = new URL(process.argv[2] || 'https://tasks.nexuspulsetech.xyz/');
const OVERALL_TIMEOUT_MS = 180_000;
const SHELL_READY = `!!document.querySelector('input[placeholder^="New category"]')`;
const BLOCKED = ['*cloudflareinsights.com*', '*/cdn-cgi/rum*'];
// Proxy chết: cổng 9 không có gì lắng nghe; <-loopback> bỏ ngoại lệ mặc định để localhost cũng mất mạng
const DEAD_PROXY = ['--proxy-server=http://127.0.0.1:9', '--proxy-bypass-list=<-loopback>'];

function defaultChrome() {
  if (process.platform === 'win32') {
    const candidates = [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
    ];
    return candidates.find((p) => existsSync(p)) || candidates[0];
  }
  if (process.platform === 'darwin') return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  return 'google-chrome';
}

const CHROME = process.env.CHROME_PATH || defaultChrome();
const swLogs = [];

/** Lỗi kiểm đã in lý do; lỗi khác (CDP, mạng nội bộ) thì in nguyên văn ở cuối */
class CheckFailure extends Error {}

function fail(message, detail) {
  console.error(`\nLỖI: ${message}`);
  if (detail) console.error(detail);
  if (swLogs.length) console.error('Console [sw] của app:\n  ' + swLogs.join('\n  '));
  throw new CheckFailure(message);
}

async function launch(profile, extraArgs = []) {
  const args = [
    '--headless',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--disable-sync',
    '--disable-component-update',
    '--lang=en-US',
    '--window-size=1280,900',
    // Runner Ubuntu mới chặn sandbox của Chrome; chỉ tắt sandbox trên CI Linux
    ...(process.env.CI && process.platform === 'linux' ? ['--no-sandbox'] : []),
    ...extraArgs,
    'about:blank',
  ];
  // Pha 2 dùng lại hồ sơ của pha 1: xóa file cổng cũ để không đọc nhầm cổng của Chrome đã tắt
  const portFile = join(profile, 'DevToolsActivePort');
  rmSync(portFile, { force: true });
  const proc = spawn(CHROME, args, { stdio: 'ignore' });
  let spawnError = null;
  proc.on('error', (err) => { spawnError = err; });

  let port = null;
  for (let i = 0; i < 150 && !port; i++) {
    if (spawnError) fail(`Không chạy được Chrome (${CHROME}). Đặt CHROME_PATH nếu Chrome nằm chỗ khác.`, spawnError.message);
    if (existsSync(portFile)) port = Number(readFileSync(portFile, 'utf8').split('\n')[0]);
    if (!port) await sleep(200);
  }
  if (!port) { proc.kill(); fail('Chrome không mở cổng DevTools'); }

  let page = null;
  for (let i = 0; i < 50 && !page; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      page = list.find((t) => t.type === 'page');
    } catch { /* chưa sẵn sàng */ }
    if (!page) await sleep(200);
  }
  if (!page) { proc.kill(); fail('Không thấy tab trong Chrome'); }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let seq = 0;
  const pending = new Map();
  const listeners = new Map();
  ws.onmessage = (event) => {
    const msg = JSON.parse(String(event.data));
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject, method } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(`${method}: ${msg.error.message}`)); else resolve(msg.result);
    } else if (msg.method) (listeners.get(msg.method) || []).forEach((fn) => fn(msg.params));
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject, method });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const on = (method, fn) => { if (!listeners.has(method)) listeners.set(method, []); listeners.get(method).push(fn); };
  const close = async () => {
    try { ws.close(); } catch { /* đã đóng */ }
    proc.kill();
    await new Promise((resolve) => { if (proc.exitCode !== null) resolve(); else { proc.once('exit', resolve); setTimeout(resolve, 3000); } });
  };

  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  const waitFor = async (expression, timeoutMs, label) => {
    const t0 = Date.now();
    while (Date.now() - t0 < timeoutMs) {
      if (await evaluate(expression).catch(() => false)) return;
      await sleep(250);
    }
    fail(`Hết giờ chờ: ${label}`);
  };
  const click = async (expression, label) => {
    const p = await evaluate(`(() => { const el = (${expression}); if (!el) return null; el.scrollIntoView({ block: 'center', behavior: 'instant' }); const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
    if (!p) fail(`Không thấy: ${label}`);
    for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) {
      await send('Input.dispatchMouseEvent', { type, x: p.x, y: p.y, button: type === 'mouseMoved' ? 'none' : 'left', clickCount: type === 'mouseMoved' ? 0 : 1 });
    }
  };
  // Gõ phím thật từng ký tự (React không nhận giá trị gán thẳng vào ô nhập)
  const typeKeys = async (text) => {
    for (const ch of text) {
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: ch, text: ch, unmodifiedText: ch });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key: ch });
    }
  };
  const pressEnter = async () => {
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, text: '\r' });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
  };

  await send('Runtime.enable');
  on('Runtime.consoleAPICalled', (p) => {
    const text = p.args.map((a) => a.value ?? a.description ?? '').join(' ');
    if (text.startsWith('[sw]')) swLogs.push(`${p.type}: ${text}`);
  });
  await send('Page.enable');
  await send('Network.enable');
  return { send, evaluate, waitFor, click, typeKeys, pressEnter, close };
}

const SW_STATE = `(async () => {
  const reg = await navigator.serviceWorker.getRegistration();
  let precache = 0;
  for (const key of (await caches.keys()).filter((k) => k.startsWith('workbox-precache'))) precache += (await (await caches.open(key)).keys()).length;
  return JSON.stringify({ active: reg && reg.active ? reg.active.state : null, controller: !!navigator.serviceWorker.controller, precache });
})()`;

async function onlinePhase(profile) {
  const b = await launch(profile);
  try {
    await b.send('Network.setBlockedURLs', { urls: BLOCKED });
    await b.send('Page.navigate', { url: TARGET.href });
    await b.waitFor(SHELL_READY, 30_000, 'app mở khi có mạng');
    let state = null;
    let reloaded = false;
    const t0 = Date.now();
    while (Date.now() - t0 < 45_000) {
      state = JSON.parse(await b.evaluate(SW_STATE));
      if (state.active === 'activated' && state.controller && state.precache > 0) break;
      if (state.active === 'activated' && !state.controller && !reloaded) {
        reloaded = true;
        await b.send('Page.reload', {});
        await b.waitFor(SHELL_READY, 30_000, 'app mở lại sau khi tải lại');
      }
      await sleep(1000);
    }
    if (!(state.active === 'activated' && state.controller && state.precache > 0)) {
      fail('Service worker không activated hoặc không điều khiển trang sau 45 giây, app sẽ không chạy ngoại tuyến', JSON.stringify(state));
    }
    console.log(`OK  pha 1: service worker activated, điều khiển trang, precache ${state.precache} mục`);
  } finally {
    await b.close();
  }
}

async function offlinePhase(profile) {
  const b = await launch(profile, DEAD_PROXY);
  try {
    await b.send('Page.navigate', { url: TARGET.href });
    await b.waitFor(SHELL_READY, 30_000, 'app mở khi mất mạng');
    if (!(await b.evaluate('!!navigator.serviceWorker.controller'))) fail('Trang mở khi mất mạng nhưng không do service worker phục vụ');
    const probe = await b.evaluate(`fetch(new URL('/__offline_probe_' + Date.now() + '.txt', location.origin), { cache: 'no-store' }).then((r) => 'HTTP ' + r.status).catch(() => 'network-error')`);
    if (probe !== 'network-error') fail(`Mạng vẫn còn trong pha ngoại tuyến (${probe}), kết quả kiểm không đáng tin`);
    console.log('OK  pha 2: app mở khi mất mạng, do service worker phục vụ, yêu cầu mạng thất bại');

    const title = `Offline check ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`;
    await b.click(`document.querySelector('input[placeholder^="Enter a task"]')`, 'ô nhập việc');
    await b.typeKeys(title);
    await b.pressEnter();
    const saved = `document.body.innerText.includes(${JSON.stringify(title)}) && Object.keys(localStorage).some((k) => (localStorage.getItem(k) || '').includes(${JSON.stringify(title)}))`;
    await b.waitFor(saved, 10_000, 'việc gõ khi mất mạng hiện ra và được lưu');
    await b.send('Page.reload', {});
    await b.waitFor(SHELL_READY, 30_000, 'app mở lại khi mất mạng');
    await b.waitFor(`document.body.innerText.includes(${JSON.stringify(title)})`, 10_000, 'việc vẫn còn sau khi tải lại');
    console.log(`OK  gõ việc "${title}" khi mất mạng, việc còn sau khi tải lại`);

    await b.click(`[...document.querySelectorAll('button')].find((el) => /^Daily Focus$/.test(el.getAttribute('aria-label') || el.getAttribute('title') || ''))`, 'nút Daily Focus');
    await b.waitFor(`(() => { const d = document.querySelector('[role=dialog]'); return !!d && d.innerText.length > 50; })()`, 10_000, 'hộp Daily Focus (chunk tải lười) mở khi mất mạng');
    console.log('OK  hộp Daily Focus (chunk tải lười) mở khi mất mạng');
  } finally {
    await b.close();
  }
}

const profile = mkdtempSync(join(tmpdir(), 'stride-offline-'));
const watchdog = setTimeout(() => { console.error(`\nLỖI: quá ${OVERALL_TIMEOUT_MS / 1000} giây`); process.exit(1); }, OVERALL_TIMEOUT_MS);
let ok = false;
try {
  console.log(`Kiểm ngoại tuyến: ${TARGET.href}`);
  await onlinePhase(profile);
  await offlinePhase(profile);
  ok = true;
  console.log('\nĐẠT: app chạy ngoại tuyến thật.');
} catch (err) {
  if (!(err instanceof CheckFailure)) console.error('\nLỖI không mong đợi:', err);
} finally {
  clearTimeout(watchdog);
  if (process.env.OFFLINE_CHECK_KEEP === '1') console.log(`Giữ hồ sơ tạm: ${profile}`);
  else rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
}
process.exit(ok ? 0 : 1);
