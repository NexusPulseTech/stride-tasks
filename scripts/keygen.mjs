#!/usr/bin/env node
/**
 * Stride Tasks — công cụ phát hành bản quyền Ed25519 (chạy local, KHÔNG nằm trong bundle frontend).
 *
 *   npm run keygen -- init [--force]       Tạo cặp khóa: ghi private key vào .env.local, vá public key vào src/utils/licenseCrypto.ts
 *   npm run keygen -- issue --id <ID> --region <vn-ppp|emerging-ppp|global-us|team>
 *                          [--price 7.95] [--label "..."] [--seats 5] [--app-url https://...] [--out file.stride-license.json]
 *   npm run keygen -- verify <token | link kích hoạt>
 *   npm run keygen -- check                Kiểm tra private key trong .env.local khớp public key đang nhúng trong app
 *
 * Định dạng token phải giữ ĐỒNG NHẤT với src/utils/licenseCrypto.ts và cloudflare-worker/src/index.js.
 * Private key KHÔNG BAO GIỜ được in ra màn hình hay commit lên git (.env.local đã nằm trong .gitignore qua mẫu `.env*`).
 */
import { generateKeyPairSync, createPrivateKey, createPublicKey, sign, verify } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ENV_FILE = resolve(ROOT, '.env.local');
const CRYPTO_FILE = resolve(ROOT, 'src/utils/licenseCrypto.ts');
const ENV_KEY = 'STRIDE_ED25519_PRIVATE_KEY';
const PREFIX = 'STRIDE1';
const DEFAULT_APP_URL = 'https://tasks.nexuspulsetech.xyz';
const PUBKEY_LINE = /(\/\/ @stride-public-key-start\r?\n)[^\r\n]*(\r?\n\/\/ @stride-public-key-end)/;

// Giá sáng lập (100 bản quyền đầu), phải khớp PRICING_TIERS trong src/config/commerceConfig.ts
const REGION_PRESETS = {
  'vn-ppp': { price: 5.95, label: 'Vietnam PPP (149.000₫)' },
  'emerging-ppp': { price: 9.95, label: 'Emerging PPP ($9.95)' },
  'global-us': { price: 19, label: 'Global ($19)' },
  team: { price: 69, label: 'Team (honor-system)', plan: 'team', seats: 5 },
};

function die(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const name = arg.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) {
        flags[name] = true;
      } else {
        flags[name] = next;
        i++;
      }
    } else {
      positional.push(arg);
    }
  }
  return { positional, flags };
}

function readEnvPrivateKey() {
  if (process.env[ENV_KEY]) return process.env[ENV_KEY].trim();
  if (!existsSync(ENV_FILE)) return null;
  const line = readFileSync(ENV_FILE, 'utf8')
    .split(/\r?\n/)
    .find((l) => l.startsWith(`${ENV_KEY}=`));
  return line ? line.slice(ENV_KEY.length + 1).trim().replace(/^"|"$/g, '') : null;
}

function loadPrivateKey() {
  const b64 = readEnvPrivateKey();
  if (!b64) die(`Chưa có ${ENV_KEY} trong .env.local. Chạy: npm run keygen -- init`);
  try {
    return createPrivateKey({ key: Buffer.from(b64, 'base64'), format: 'der', type: 'pkcs8' });
  } catch {
    die(`${ENV_KEY} không phải khóa Ed25519 PKCS#8 (base64) hợp lệ.`);
  }
}

function publicKeyToB64Url(keyObject) {
  return createPublicKey(keyObject).export({ format: 'jwk' }).x;
}

function readEmbeddedPublicKey() {
  const source = readFileSync(CRYPTO_FILE, 'utf8');
  const match = source.match(/LICENSE_PUBLIC_KEY_B64URL = '([A-Za-z0-9_-]*)'/);
  return match ? match[1] : '';
}

function embedPublicKey(pub) {
  const source = readFileSync(CRYPTO_FILE, 'utf8');
  if (!PUBKEY_LINE.test(source)) die(`Không tìm thấy marker @stride-public-key trong ${CRYPTO_FILE}`);
  const next = source.replace(PUBKEY_LINE, `$1export const LICENSE_PUBLIC_KEY_B64URL = '${pub}';$2`);
  writeFileSync(CRYPTO_FILE, next);
}

function warnIfEnvTracked() {
  try {
    execFileSync('git', ['check-ignore', '-q', ENV_FILE], { cwd: ROOT, stdio: 'ignore' });
  } catch {
    console.warn('⚠ CẢNH BÁO: .env.local KHÔNG nằm trong .gitignore — tuyệt đối không commit file này!');
  }
}

function issueToken(privateKey, payload) {
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signingInput = `${PREFIX}.${payloadB64}`;
  const signature = sign(null, Buffer.from(signingInput, 'utf8'), privateKey);
  return `${signingInput}.${signature.toString('base64url')}`;
}

function verifyToken(rawToken, publicKeyB64Url) {
  let token = rawToken.trim();
  const marker = token.indexOf('activate=');
  if (marker !== -1) token = token.slice(marker + 'activate='.length);
  token = decodeURIComponent(token).replace(/\s+/g, '');
  const [prefix, payloadB64, sigB64] = token.split('.');
  if (prefix !== PREFIX || !payloadB64 || !sigB64) return null;
  const publicKey = createPublicKey({ key: { kty: 'OKP', crv: 'Ed25519', x: publicKeyB64Url }, format: 'jwk' });
  const ok = verify(null, Buffer.from(`${prefix}.${payloadB64}`, 'utf8'), publicKey, Buffer.from(sigB64, 'base64url'));
  return ok ? JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) : null;
}

function cmdInit(flags) {
  if (readEnvPrivateKey() && !flags.force) {
    die('Đã có private key trong .env.local. Dùng --force để XOAY VÒNG khóa (mọi bản quyền cũ sẽ mất hiệu lực sau khi build lại).');
  }
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const der = privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64');
  const pub = publicKey.export({ format: 'jwk' }).x;

  const lines = existsSync(ENV_FILE) ? readFileSync(ENV_FILE, 'utf8').split(/\r?\n/) : [];
  const kept = lines.filter((l) => !l.startsWith(`${ENV_KEY}=`) && l.trim() !== '');
  kept.push(`${ENV_KEY}=${der}`);
  writeFileSync(ENV_FILE, kept.join('\n') + '\n');
  embedPublicKey(pub);
  warnIfEnvTracked();

  console.log('\n✔ Đã tạo cặp khóa Ed25519.');
  console.log(`  • Private key: ghi vào .env.local (${ENV_KEY}) — KHÔNG in ra màn hình.`);
  console.log(`  • Public key : ${pub}  → đã nhúng vào src/utils/licenseCrypto.ts`);
  console.log('\n  Việc cần làm ngay:');
  console.log('  1. Sao lưu .env.local vào trình quản lý mật khẩu (mất private key = không phát hành thêm được bản quyền).');
  console.log('  2. Nạp cùng giá trị vào Cloudflare Worker: npx wrangler secret put STRIDE_ED25519_PRIVATE_KEY');
  console.log('  3. Build & deploy lại app để public key mới có hiệu lực.\n');
}

function cmdIssue(flags) {
  const region = flags.region;
  const preset = REGION_PRESETS[region];
  if (!preset) die(`--region phải là một trong: ${Object.keys(REGION_PRESETS).join(', ')}`);
  const id = typeof flags.id === 'string' ? flags.id.trim() : '';
  if (!id) die('Thiếu --id (VD: --id VN-STRAB12CD hoặc --id MANUAL-0001)');

  const privateKey = loadPrivateKey();
  const pub = publicKeyToB64Url(privateKey);
  const embedded = readEmbeddedPublicKey();
  if (embedded !== pub) die('Private key trong .env.local KHÔNG khớp public key đang nhúng trong app. Chạy: npm run keygen -- check');

  const price = flags.price !== undefined ? Number(flags.price) : preset.price;
  if (!Number.isFinite(price) || price < 0) die('--price không hợp lệ');
  const payload = {
    v: 1,
    product: 'stride-tasks',
    licenseType: 'license-key',
    licenseKeyOrAddonId: id,
    activatedAt: new Date().toISOString(),
    pricePaidUsd: price,
    regionLabel: typeof flags.label === 'string' ? flags.label : preset.label,
  };
  const plan = preset.plan;
  if (plan) payload.plan = plan;
  const seats = flags.seats !== undefined ? Number(flags.seats) : preset.seats;
  if (seats !== undefined) {
    if (!Number.isInteger(seats) || seats < 1) die('--seats phải là số nguyên dương');
    payload.seats = seats;
  }

  const token = issueToken(privateKey, payload);
  const appUrl = (typeof flags['app-url'] === 'string' ? flags['app-url'] : DEFAULT_APP_URL).replace(/\/+$/, '');
  console.log('\n✔ Đã phát hành bản quyền:');
  console.log(JSON.stringify(payload, null, 2));
  console.log(`\nLink kích hoạt 1-click:\n${appUrl}/#activate=${token}\n`);
  console.log(`Token:\n${token}\n`);

  if (typeof flags.out === 'string') {
    const file = {
      format: 'stride-license',
      version: 1,
      token,
      licenseKeyOrAddonId: payload.licenseKeyOrAddonId,
      activatedAt: payload.activatedAt,
      pricePaidUsd: payload.pricePaidUsd,
      regionLabel: payload.regionLabel,
      plan: payload.plan,
    };
    writeFileSync(resolve(process.cwd(), flags.out), JSON.stringify(file, null, 2) + '\n');
    console.log(`Đã ghi tệp chứng chỉ: ${flags.out}\n`);
  }
}

function cmdVerify(positional) {
  const input = positional[1];
  if (!input) die('Cách dùng: npm run keygen -- verify <token | link>');
  const embedded = readEmbeddedPublicKey();
  if (!embedded) die('App chưa có public key. Chạy: npm run keygen -- init');
  const payload = verifyToken(input, embedded);
  if (!payload) die('Token KHÔNG hợp lệ với public key hiện tại.');
  console.log('\n✔ Token hợp lệ:\n' + JSON.stringify(payload, null, 2) + '\n');
}

function cmdCheck() {
  const embedded = readEmbeddedPublicKey();
  const pub = publicKeyToB64Url(loadPrivateKey());
  if (!embedded) die('App chưa nhúng public key (LICENSE_PUBLIC_KEY_B64URL rỗng).');
  if (embedded !== pub) die(`Không khớp!\n  app : ${embedded}\n  .env: ${pub}`);
  console.log(`\n✔ Khớp. Public key: ${pub}\n`);
}

const { positional, flags } = parseArgs(process.argv.slice(2));
switch (positional[0]) {
  case 'init':
    cmdInit(flags);
    break;
  case 'issue':
    cmdIssue(flags);
    break;
  case 'verify':
    cmdVerify(positional);
    break;
  case 'check':
    cmdCheck();
    break;
  default:
    console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 14).join('\n').replace(/^ \*\/?/gm, ''));
}
