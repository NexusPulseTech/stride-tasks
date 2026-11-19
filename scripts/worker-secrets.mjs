#!/usr/bin/env node
/**
 * Stride Tasks: nạp secret cho Cloudflare Worker mà không in giá trị ra màn hình. Founder tự chạy:
 *
 *   npm run worker:secrets                    Khóa ký bản quyền + secret webhook Polar (dán khi được hỏi)
 *   npm run worker:secrets -- --key-only      Chỉ nạp khóa ký bản quyền
 *   npm run worker:secrets -- --webhook-only  Chỉ nạp lại secret webhook Polar
 *
 * Khóa ký đọc giống `npm run keygen`: --key-stdin, --key-file <tệp ngoài repo>, biến STRIDE_ED25519_PRIVATE_KEY_FILE
 * (môi trường hoặc một dòng trong .env.local), biến STRIDE_ED25519_PRIVATE_KEY, cuối cùng là dòng khóa cũ trong .env.local.
 * Trước khi nạp, script tự kiểm khóa khớp public key đang nhúng trong app; không khớp thì dừng, không nạp gì.
 * Secret webhook lấy ở Polar → Settings → Webhooks → endpoint "Stride Worker". Không dán secret vào chat hay file.
 */
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ENV_KEY,
  ENV_KEY_FILE,
  KEY_DOC,
  SOURCE_LABEL,
  KeyError,
  resolvePrivateKey,
  toPrivateKeyObject,
  publicKeyB64Url,
  readEmbeddedPublicKey,
} from './lib/signing-key.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WORKER_DIR = resolve(ROOT, 'cloudflare-worker');
const WRANGLER = 'wrangler@4.153.0';

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

const args = process.argv.slice(2);
const keyOnly = args.includes('--key-only');
const webhookOnly = args.includes('--webhook-only');
const keyFileAt = args.indexOf('--key-file');
const flags = {
  'key-stdin': args.includes('--key-stdin'),
  'key-file': keyFileAt === -1 ? undefined : args[keyFileAt + 1] && !args[keyFileAt + 1].startsWith('--') ? args[keyFileAt + 1] : true,
};

if (!webhookOnly) {
  // Khóa đến qua ống thì stdin đã hết, lời nhắc dán secret webhook phía sau không đọc được bàn phím
  if (flags['key-stdin'] && !process.stdin.isTTY && !keyOnly) {
    die('Khóa đọc từ ống (stdin) thì chạy kèm --key-only; nạp secret webhook ở một lượt riêng với --webhook-only.');
  }

  let found;
  let pub;
  try {
    found = await resolvePrivateKey({ flags });
    if (!found) die(`Chưa có khóa ký. Dùng --key-file <tệp ngoài repo>, --key-stdin, hoặc đặt ${ENV_KEY_FILE}. Xem ${KEY_DOC}`);
    pub = publicKeyB64Url(toPrivateKeyObject(found.b64));
  } catch (error) {
    if (error instanceof KeyError) die(error.message);
    throw error;
  }
  const embedded = readEmbeddedPublicKey(ROOT);
  if (!embedded || embedded !== pub) die('Khóa ký không khớp public key đang nhúng trong app. Dừng, không nạp gì.');

  console.log(`✔ Khóa khớp app (đọc từ ${SOURCE_LABEL[found.source]}). Nạp ${ENV_KEY}, không in giá trị...`);
  const keyResult = wrangler(['secret', 'put', ENV_KEY], { input: found.b64, stdio: ['pipe', 'inherit', 'inherit'] });
  if (keyResult.status !== 0) die(`wrangler không nạp được ${ENV_KEY}`);
}

if (!keyOnly) {
  console.log('\nNạp POLAR_WEBHOOK_SECRET: dán secret lấy ở Polar → Settings → Webhooks khi wrangler hỏi.');
  const hookResult = wrangler(['secret', 'put', 'POLAR_WEBHOOK_SECRET'], { stdio: 'inherit' });
  if (hookResult.status !== 0) die('wrangler không nạp được POLAR_WEBHOOK_SECRET');
}

console.log('\nSecret đang có trên Worker (chỉ tên):');
wrangler(['secret', 'list'], { stdio: 'inherit' });
