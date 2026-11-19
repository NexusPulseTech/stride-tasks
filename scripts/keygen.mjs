#!/usr/bin/env node
/**
 * Stride Tasks: công cụ phát hành bản quyền Ed25519 (chạy local, KHÔNG nằm trong bundle frontend).
 *
 *   npm run keygen -- init --out <tệp ngoài repo> [--force]   Tạo cặp khóa: ghi private key ra tệp ngoài repo, vá public key vào src/utils/licenseCrypto.ts
 *   npm run keygen -- issue --id <ID> --region <vn-ppp|emerging-ppp|global-us|team>
 *                          [--price 7.95] [--label "..."] [--seats 5] [--app-url https://...] [--out file.stride-license.json]
 *   npm run keygen -- verify <token | link kích hoạt>
 *   npm run keygen -- check                Kiểm tra private key khớp public key đang nhúng trong app
 *
 * issue và check cần private key, đọc theo thứ tự: --key-stdin, --key-file <tệp ngoài repo>,
 * biến STRIDE_ED25519_PRIVATE_KEY_FILE (môi trường hoặc một dòng trong .env.local), biến STRIDE_ED25519_PRIVATE_KEY,
 * cuối cùng là dòng khóa cũ trong .env.local (có cảnh báo). Xem docs/06-security-privacy/02-secrets-and-key-management.md.
 *
 * Định dạng token phải giữ ĐỒNG NHẤT với src/utils/licenseCrypto.ts và cloudflare-worker/src/index.js.
 * Private key KHÔNG BAO GIỜ được in ra màn hình hay commit lên git.
 */
import { generateKeyPairSync, createPublicKey, sign, verify } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
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
  writeNewKeyFile,
} from './lib/signing-key.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CRYPTO_FILE = resolve(ROOT, 'src/utils/licenseCrypto.ts');
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

// Cờ không nhận giá trị: không được nuốt tham số đứng sau (VD: "--key-stdin check")
const BOOLEAN_FLAGS = new Set(['force', 'key-stdin']);

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const name = arg.slice(2);
      const next = argv[i + 1];
      if (BOOLEAN_FLAGS.has(name) || next === undefined || next.startsWith('--')) {
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

async function loadPrivateKey(flags) {
  const found = await resolvePrivateKey({ flags });
  if (!found) {
    die(`Chưa có khóa riêng. Dùng --key-file <tệp ngoài repo>, --key-stdin, hoặc đặt ${ENV_KEY_FILE}. Xem ${KEY_DOC}`);
  }
  return { key: toPrivateKeyObject(found.b64), source: found.source };
}

function embedPublicKey(pub) {
  const source = readFileSync(CRYPTO_FILE, 'utf8');
  if (!PUBKEY_LINE.test(source)) die(`Không tìm thấy marker @stride-public-key trong ${CRYPTO_FILE}`);
  const next = source.replace(PUBKEY_LINE, `$1export const LICENSE_PUBLIC_KEY_B64URL = '${pub}';$2`);
  writeFileSync(CRYPTO_FILE, next);
}

function issueToken(privateKey, payload) {
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const signingInput = `${PREFIX}.${payloadB64}`;
  const signature = sign(null, Buffer.from(signingInput, 'utf8'), privateKey);
  return `${signingInput}.${signature.toString('base64url')}`;
}

function verifyToken(rawToken, embeddedPub) {
  let token = rawToken.trim();
  const marker = token.indexOf('activate=');
  if (marker !== -1) token = token.slice(marker + 'activate='.length);
  token = decodeURIComponent(token).replace(/\s+/g, '');
  const [prefix, payloadB64, sigB64] = token.split('.');
  if (prefix !== PREFIX || !payloadB64 || !sigB64) return null;
  const publicKey = createPublicKey({ key: { kty: 'OKP', crv: 'Ed25519', x: embeddedPub }, format: 'jwk' });
  const ok = verify(null, Buffer.from(`${prefix}.${payloadB64}`, 'utf8'), publicKey, Buffer.from(sigB64, 'base64url'));
  return ok ? JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) : null;
}

async function cmdInit(flags) {
  if (typeof flags.out !== 'string') {
    die(`Thiếu --out <tệp ngoài repo> để ghi khóa riêng mới (VD: --out ../stride-keys/license-signing.key). Xem ${KEY_DOC}`);
  }
  // Không đọc stdin ở đây; nguồn hỏng (VD: biến trỏ tới tệp chưa có) không chặn việc tạo khóa mới
  const existing = await resolvePrivateKey({ flags: { 'key-file': flags['key-file'] }, warn: () => {} }).catch((error) => {
    if (error instanceof KeyError) return null;
    throw error;
  });
  if (existing && !flags.force) {
    die(`Đã có khóa ký (nguồn: ${SOURCE_LABEL[existing.source]}). Dùng --force để XOAY VÒNG khóa (mọi bản quyền cũ sẽ mất hiệu lực sau khi build lại).`);
  }
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const der = privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64');
  const pub = publicKey.export({ format: 'jwk' }).x;

  const keyFile = writeNewKeyFile(flags.out, der, { force: Boolean(flags.force) });
  embedPublicKey(pub);

  console.log('\n✔ Đã tạo cặp khóa Ed25519.');
  console.log(`  • Private key: ghi vào ${keyFile} (ngoài repo), KHÔNG in ra màn hình.`);
  console.log(`  • Public key : ${pub}  → đã nhúng vào src/utils/licenseCrypto.ts`);
  console.log('\n  Việc cần làm ngay:');
  console.log('  1. Chép khóa trong tệp vào trình quản lý mật khẩu (mất private key = không phát hành thêm được bản quyền).');
  console.log(`  2. Nạp vào Cloudflare Worker: npm run worker:secrets -- --key-only --key-file "${keyFile}"`);
  console.log('  3. Build và deploy lại app để public key mới có hiệu lực.');
  console.log('  4. Xóa tệp khóa: mặc định khóa chỉ nằm trong trình quản lý mật khẩu, khi cần ký thì dùng --key-stdin.');
  console.log(`     Dự phòng (ký nhiều lần liền nhau): giữ tệp và đặt ${ENV_KEY_FILE}=${keyFile}, xong việc thì xóa.`);
  console.log(`     Xem ${KEY_DOC}\n`);
}

async function cmdIssue(flags) {
  const region = flags.region;
  const preset = REGION_PRESETS[region];
  if (!preset) die(`--region phải là một trong: ${Object.keys(REGION_PRESETS).join(', ')}`);
  const id = typeof flags.id === 'string' ? flags.id.trim() : '';
  if (!id) die('Thiếu --id (VD: --id VN-STRAB12CD hoặc --id MANUAL-0001)');

  const { key: privateKey } = await loadPrivateKey(flags);
  const pub = publicKeyB64Url(privateKey);
  const embedded = readEmbeddedPublicKey();
  if (embedded !== pub) die('Private key đang dùng KHÔNG khớp public key đang nhúng trong app. Chạy: npm run keygen -- check');

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

async function cmdCheck(flags) {
  const embedded = readEmbeddedPublicKey();
  const { key, source } = await loadPrivateKey(flags);
  const pub = publicKeyB64Url(key);
  if (!embedded) die('App chưa nhúng public key (LICENSE_PUBLIC_KEY_B64URL rỗng).');
  if (embedded !== pub) die(`Không khớp!\n  app : ${embedded}\n  khóa: ${pub}`);
  console.log(`\n✔ Khớp (khóa đọc từ ${SOURCE_LABEL[source]}). Public key: ${pub}\n`);
}

function printHelp() {
  const source = readFileSync(fileURLToPath(import.meta.url), 'utf8');
  const block = source.slice(source.indexOf('/**') + 3, source.indexOf('*/'));
  console.log(block.replace(/^ \* ?/gm, '').trim());
}

const { positional, flags } = parseArgs(process.argv.slice(2));
const COMMANDS = {
  init: () => cmdInit(flags),
  issue: () => cmdIssue(flags),
  verify: () => cmdVerify(positional),
  check: () => cmdCheck(flags),
};
try {
  const command = COMMANDS[positional[0]];
  if (command) await command();
  else printHelp();
} catch (error) {
  if (error instanceof KeyError) die(error.message);
  throw error;
}
