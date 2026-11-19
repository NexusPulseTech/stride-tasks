/**
 * Stride Tasks: nạp khóa ký bản quyền Ed25519 cho các script chạy local (keygen.mjs, worker-secrets.mjs).
 * Khóa không cần nằm trong thư mục repo. Thứ tự tìm khóa:
 *   1. --key-stdin              ống từ trình quản lý mật khẩu, hoặc dán khi được hỏi (chữ không hiện)
 *   2. --key-file <đường dẫn>   tệp nằm NGOÀI repo
 *   3. STRIDE_ED25519_PRIVATE_KEY_FILE   đường dẫn tệp ngoài repo, đặt ở biến môi trường hoặc một dòng trong .env.local
 *   4. STRIDE_ED25519_PRIVATE_KEY        giá trị khóa trong biến môi trường (như cũ)
 *   5. .env.local có dòng khóa  chỉ để chuyển tiếp, luôn in cảnh báo
 * Không hàm nào in giá trị khóa. Xem docs/06-security-privacy/02-secrets-and-key-management.md.
 */
import { createPrivateKey, createPublicKey } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ENV_KEY = 'STRIDE_ED25519_PRIVATE_KEY';
export const ENV_KEY_FILE = 'STRIDE_ED25519_PRIVATE_KEY_FILE';
export const KEY_DOC = 'docs/06-security-privacy/02-secrets-and-key-management.md';
export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const SOURCE_LABEL = {
  stdin: 'stdin',
  file: 'tệp ngoài repo',
  env: `biến môi trường ${ENV_KEY}`,
  'env-local': '.env.local trong repo',
};

/** Lỗi cấu hình khóa: thông báo an toàn để in (không chứa giá trị khóa). */
export class KeyError extends Error {}

/**
 * Lấy giá trị khóa từ nội dung tệp hoặc stdin: một dòng base64, hoặc dòng `STRIDE_ED25519_PRIVATE_KEY=...`
 * (cho phép chép nguyên dòng cũ từ .env.local). Bỏ BOM, CRLF, dòng chú thích, dấu nháy bao ngoài.
 */
export function parseKeyText(text) {
  const lines = String(text ?? '')
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
  const assigned = lines.find((l) => l.startsWith(`${ENV_KEY}=`));
  const raw = assigned ? assigned.slice(ENV_KEY.length + 1) : lines.length === 1 ? lines[0] : '';
  const value = raw.trim().replace(/^(["'])(.*)\1$/, '$2').trim();
  return value || null;
}

/** `target` có nằm trong `root` (hoặc chính là `root`) không. Trên Windows so sánh không phân biệt hoa thường. */
export function isInsideDir(root, target) {
  const rel = relative(root, target);
  return rel === '' || (rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
}

function realOrSelf(p) {
  try {
    return realpathSync.native(p);
  } catch {
    return p;
  }
}

/** Trả về đường dẫn tuyệt đối nếu tệp nằm ngoài repo; ném KeyError nếu nằm trong (kể cả đi vòng qua symlink, junction). */
export function assertOutsideRepo(path, root = REPO_ROOT) {
  const abs = resolve(path);
  const candidates = [abs, realOrSelf(abs), resolve(realOrSelf(dirname(abs)), basename(abs))];
  const roots = [resolve(root), realOrSelf(resolve(root))];
  if (candidates.some((c) => roots.some((r) => isInsideDir(r, c)))) {
    throw new KeyError(`Tệp khóa phải nằm ngoài thư mục repo (${resolve(root)}), không dùng được: ${abs}`);
  }
  return abs;
}

function readEnvLocalVar(root, name) {
  const file = resolve(root, '.env.local');
  if (!existsSync(file)) return null;
  const line = readFileSync(file, 'utf8')
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .find((l) => l.startsWith(`${name}=`));
  if (!line) return null;
  const value = line.slice(name.length + 1).trim().replace(/^(["'])(.*)\1$/, '$2').trim();
  return value || null;
}

/** Đọc khóa từ stdin: ống thì đọc tới hết; bàn phím thì tắt hiện chữ, dừng ở Enter. */
export async function readStdinSecret({ stdin = process.stdin, stderr = process.stderr } = {}) {
  if (!stdin.isTTY) {
    let data = '';
    stdin.setEncoding('utf8');
    for await (const chunk of stdin) data += chunk;
    return data;
  }
  stderr.write('Dán khóa riêng (base64) rồi nhấn Enter. Chữ sẽ không hiện ra: ');
  return new Promise((resolvePromise, reject) => {
    let buffer = '';
    const finish = (error) => {
      stdin.removeListener('data', onData);
      stdin.setRawMode(false);
      stdin.pause();
      stderr.write('\n');
      // bỏ mã điều khiển dán (bracketed paste) nếu terminal có gửi
      if (error) reject(error);
      else resolvePromise(buffer.replace(/\u001b\[[0-9;]*[~A-Za-z]/g, ''));
    };
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n') return finish();
        if (ch === '\u0003') return finish(new KeyError('Đã hủy.'));
        if (ch === '\u007f' || ch === '\b') buffer = buffer.slice(0, -1);
        else buffer += ch;
      }
    };
    stdin.setEncoding('utf8');
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on('data', onData);
  });
}

/**
 * Tìm khóa riêng theo thứ tự ở đầu file. Trả về { b64, source, path? } hoặc null nếu không có nguồn nào.
 * Các tham số env, root, readStdin, warn cho phép test chạy với dữ liệu tạm, không đụng .env.local thật.
 */
export async function resolvePrivateKey({
  flags = {},
  env = process.env,
  root = REPO_ROOT,
  readStdin = readStdinSecret,
  warn = (message) => console.warn(message),
} = {}) {
  const leftoverWarning = () => {
    if (readEnvLocalVar(root, ENV_KEY)) {
      warn(`⚠ .env.local vẫn còn dòng ${ENV_KEY}: xóa dòng đó sau khi kiểm "Khớp" (xem ${KEY_DOC}).`);
    }
  };

  if (flags['key-stdin']) {
    const value = parseKeyText(await readStdin());
    if (!value) throw new KeyError('Không nhận được khóa nào từ stdin.');
    leftoverWarning();
    return { b64: value, source: 'stdin' };
  }

  if (flags['key-file'] === true) throw new KeyError('Thiếu đường dẫn sau --key-file.');
  const file =
    (typeof flags['key-file'] === 'string' && flags['key-file']) || env[ENV_KEY_FILE] || readEnvLocalVar(root, ENV_KEY_FILE);
  if (file) {
    const abs = assertOutsideRepo(file, root);
    if (!existsSync(abs)) throw new KeyError(`Không thấy tệp khóa: ${abs}`);
    const value = parseKeyText(readFileSync(abs, 'utf8'));
    if (!value) throw new KeyError(`Tệp khóa phải có đúng một dòng base64, hoặc một dòng ${ENV_KEY}=<giá trị>: ${abs}`);
    leftoverWarning();
    return { b64: value, source: 'file', path: abs };
  }

  if (env[ENV_KEY] && env[ENV_KEY].trim()) return { b64: env[ENV_KEY].trim(), source: 'env' };

  const legacy = readEnvLocalVar(root, ENV_KEY);
  if (legacy) {
    warn(`⚠ Đang đọc khóa ký từ .env.local trong repo. Hãy chuyển khóa ra ngoài repo rồi xóa dòng này (xem ${KEY_DOC}).`);
    return { b64: legacy, source: 'env-local' };
  }
  return null;
}

/** Base64 PKCS#8 DER → KeyObject Ed25519; ném KeyError (không kèm giá trị) nếu sai định dạng hoặc sai thuật toán. */
export function toPrivateKeyObject(b64) {
  let key;
  try {
    key = createPrivateKey({ key: Buffer.from(b64, 'base64'), format: 'der', type: 'pkcs8' });
  } catch {
    throw new KeyError(`${ENV_KEY} không phải khóa PKCS#8 (base64) hợp lệ.`);
  }
  if (key.asymmetricKeyType !== 'ed25519') throw new KeyError(`${ENV_KEY} không phải khóa Ed25519.`);
  return key;
}

/** Public key dạng base64url (thành phần `x` của JWK), đúng dạng nhúng trong app. */
export function publicKeyB64Url(keyObject) {
  return createPublicKey(keyObject).export({ format: 'jwk' }).x;
}

/** Public key đang nhúng trong src/utils/licenseCrypto.ts ('' nếu chưa có). */
export function readEmbeddedPublicKey(root = REPO_ROOT) {
  const source = readFileSync(resolve(root, 'src/utils/licenseCrypto.ts'), 'utf8');
  const match = source.match(/LICENSE_PUBLIC_KEY_B64URL = '([A-Za-z0-9_-]*)'/);
  return match ? match[1] : '';
}

/** Ghi khóa riêng mới ra tệp ngoài repo; không ghi đè nếu thiếu force. Quyền 600 khi tạo mới (hệ Unix). */
export function writeNewKeyFile(path, b64, { force = false, root = REPO_ROOT } = {}) {
  const abs = assertOutsideRepo(path, root);
  mkdirSync(dirname(abs), { recursive: true });
  try {
    writeFileSync(abs, `${b64}\n`, { mode: 0o600, flag: force ? 'w' : 'wx' });
  } catch (error) {
    if (error.code === 'EEXIST') {
      throw new KeyError(`Tệp đã tồn tại: ${abs}. Dùng --force nếu thật sự muốn ghi đè (khóa cũ trong tệp sẽ mất).`);
    }
    throw error;
  }
  return abs;
}
