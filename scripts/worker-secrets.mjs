#!/usr/bin/env node
/**
 * Stride Tasks: nạp secret cho Cloudflare Worker mà không in giá trị ra màn hình. Founder tự chạy:
 *
 *   npm run worker:secrets                Khóa ký bản quyền (đọc từ .env.local) + secret webhook Polar (dán khi được hỏi)
 *   npm run worker:secrets -- --key-only      Chỉ nạp khóa ký bản quyền
 *   npm run worker:secrets -- --webhook-only  Chỉ nạp lại secret webhook Polar
 *
 * Trước khi nạp, kiểm tra khóa trong .env.local khớp public key đang nhúng trong app (npm run keygen -- check).
 * Secret webhook lấy ở Polar → Settings → Webhooks → endpoint "Stride Worker". Không dán secret vào chat hay file.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WORKER_DIR = resolve(ROOT, 'cloudflare-worker');
const WRANGLER = 'wrangler@4.151.0';
const ENV_KEY = 'STRIDE_ED25519_PRIVATE_KEY';

function die(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

// Account ID đọc từ cloudflare-worker/wrangler.toml (đã gitignore), không ghi trong repo public
const env = { ...process.env, WRANGLER_SEND_METRICS: 'false' };

function wrangler(args, options) {
  // Tham số chỉ gồm tên lệnh và tên secret cố định, ghép thành một chuỗi để Windows chạy được npx.cmd qua shell
  return spawnSync(`npx --yes ${WRANGLER} ${args.join(' ')}`, {
    cwd: WORKER_DIR,
    env,
    shell: true,
    ...options,
  });
}

if (!process.argv.includes('--webhook-only')) {
  const check = spawnSync(process.execPath, [resolve(ROOT, 'scripts/keygen.mjs'), 'check'], { stdio: 'inherit' });
  if (check.status !== 0) die('Khóa trong .env.local không khớp app. Dừng, không nạp gì.');

  let privateKey;
  try {
    privateKey = readFileSync(resolve(ROOT, '.env.local'), 'utf8').match(new RegExp(`^${ENV_KEY}=(.+)$`, 'm'))?.[1].trim();
  } catch {
    die('Không đọc được .env.local');
  }
  if (!privateKey) die(`Không thấy ${ENV_KEY} trong .env.local`);

  console.log(`Nạp ${ENV_KEY} (đọc từ .env.local, không in ra)...`);
  const keyResult = wrangler(['secret', 'put', ENV_KEY], { input: privateKey, stdio: ['pipe', 'inherit', 'inherit'] });
  if (keyResult.status !== 0) die(`wrangler không nạp được ${ENV_KEY}`);
}

if (!process.argv.includes('--key-only')) {
  console.log('\nNạp POLAR_WEBHOOK_SECRET: dán secret lấy ở Polar → Settings → Webhooks khi wrangler hỏi.');
  const hookResult = wrangler(['secret', 'put', 'POLAR_WEBHOOK_SECRET'], { stdio: 'inherit' });
  if (hookResult.status !== 0) die('wrangler không nạp được POLAR_WEBHOOK_SECRET');
}

console.log('\nSecret đang có trên Worker (chỉ tên):');
wrangler(['secret', 'list'], { stdio: 'inherit' });
