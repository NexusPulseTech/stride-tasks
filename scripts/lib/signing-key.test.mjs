// Test nguồn khóa ký (B10). Chỉ dùng khóa sinh tạm và thư mục tạm, không đọc .env.local thật.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { generateKeyPairSync } from 'node:crypto';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  ENV_KEY,
  ENV_KEY_FILE,
  KeyError,
  parseKeyText,
  isInsideDir,
  assertOutsideRepo,
  resolvePrivateKey,
  toPrivateKeyObject,
  publicKeyB64Url,
  readEmbeddedPublicKey,
  writeNewKeyFile,
} from './signing-key.mjs';

const newKeyB64 = () => generateKeyPairSync('ed25519').privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64');
const assign = (name, value) => `${name}=${value}`;

let base; // thư mục tạm chứa "repo" giả và vùng ngoài repo
let root;
let outside;
beforeEach(() => {
  base = mkdtempSync(join(tmpdir(), 'stride-key-test-'));
  root = join(base, 'repo');
  outside = join(base, 'keys');
  mkdirSync(root);
  mkdirSync(outside);
});
afterEach(() => rmSync(base, { recursive: true, force: true }));

const opts = (extra = {}) => {
  const warnings = [];
  return { warnings, args: { env: {}, root, warn: (m) => warnings.push(m), readStdin: async () => '', ...extra } };
};

describe('parseKeyText', () => {
  it('nhận một dòng base64', () => {
    expect(parseKeyText('abc123==\n')).toBe('abc123==');
  });
  it('nhận dòng gán biến giữa các dòng khác, bỏ dấu nháy, BOM, CRLF và chú thích', () => {
    const text = `\uFEFF# ghi chú\r\nOTHER=1\r\n${assign(ENV_KEY, '"abc123=="')}\r\n`;
    expect(parseKeyText(text)).toBe('abc123==');
  });
  it('trả null khi rỗng hoặc mơ hồ (nhiều dòng mà không có dòng gán biến)', () => {
    expect(parseKeyText('')).toBeNull();
    expect(parseKeyText('aaa\nbbb')).toBeNull();
  });
});

describe('isInsideDir và assertOutsideRepo', () => {
  it('từ chối tệp trong repo và chính thư mục repo', () => {
    expect(() => assertOutsideRepo(join(root, 'x.key'), root)).toThrow(KeyError);
    expect(() => assertOutsideRepo(join(root, 'sub', '..', 'x.key'), root)).toThrow(KeyError);
    // thư mục con có tên bắt đầu bằng ".." vẫn nằm trong repo
    expect(() => assertOutsideRepo(join(root, '..cache', 'x.key'), root)).toThrow(KeyError);
    expect(isInsideDir(root, root)).toBe(true);
  });
  it('chấp nhận tệp ngoài repo, kể cả thư mục anh em có tên bắt đầu giống repo', () => {
    expect(assertOutsideRepo(join(outside, 'x.key'), root)).toBe(join(outside, 'x.key'));
    expect(isInsideDir(root, `${root}-keys`)).toBe(false);
    expect(isInsideDir(root, join(root, '..', 'keys', 'x.key'))).toBe(false);
  });
  it.runIf(process.platform === 'win32')('Windows: khác hoa thường vẫn tính là trong repo', () => {
    expect(() => assertOutsideRepo(join(root.toUpperCase(), 'x.key'), root)).toThrow(KeyError);
  });
  it('từ chối đường dẫn đi vòng qua liên kết thư mục trỏ vào repo', () => {
    const link = join(outside, 'link-to-repo');
    symlinkSync(root, link, process.platform === 'win32' ? 'junction' : 'dir');
    expect(() => assertOutsideRepo(join(link, 'x.key'), root)).toThrow(KeyError);
  });
});

describe('resolvePrivateKey', () => {
  it('không có nguồn nào thì trả null', async () => {
    const { args } = opts();
    expect(await resolvePrivateKey(args)).toBeNull();
  });

  it('.env.local cũ vẫn dùng được nhưng luôn cảnh báo', async () => {
    const key = newKeyB64();
    writeFileSync(join(root, '.env.local'), `${assign(ENV_KEY, key)}\n`);
    const { args, warnings } = opts();
    expect(await resolvePrivateKey(args)).toEqual({ b64: key, source: 'env-local' });
    expect(warnings.length).toBe(1);
  });

  it('biến môi trường giá trị được ưu tiên hơn .env.local', async () => {
    const key = newKeyB64();
    writeFileSync(join(root, '.env.local'), `${assign(ENV_KEY, newKeyB64())}\n`);
    const { args } = opts({ env: { [ENV_KEY]: ` ${key} ` } });
    expect(await resolvePrivateKey(args)).toEqual({ b64: key, source: 'env' });
  });

  it('đường dẫn tệp ở biến môi trường hoặc trong .env.local được ưu tiên hơn biến giá trị', async () => {
    const key = newKeyB64();
    const file = join(outside, 'signing.key');
    writeFileSync(file, `${key}\n`);
    const fromEnv = opts({ env: { [ENV_KEY_FILE]: file, [ENV_KEY]: newKeyB64() } });
    expect(await resolvePrivateKey(fromEnv.args)).toEqual({ b64: key, source: 'file', path: file });

    // .env.local lưu bằng PowerShell 5.1 hay Notepad cũ có BOM ở đầu tệp, dòng đầu vẫn phải đọc được
    writeFileSync(join(root, '.env.local'), `\uFEFF${assign(ENV_KEY_FILE, file)}\r\n`);
    const fromEnvLocal = opts();
    expect(await resolvePrivateKey(fromEnvLocal.args)).toEqual({ b64: key, source: 'file', path: file });
    expect(fromEnvLocal.warnings).toEqual([]);
  });

  it('--key-file thắng biến môi trường; cảnh báo nếu .env.local còn dòng khóa', async () => {
    const key = newKeyB64();
    const file = join(outside, 'flag.key');
    writeFileSync(file, `${assign(ENV_KEY, key)}\n`); // chép nguyên dòng cũ cũng được
    writeFileSync(join(root, '.env.local'), `${assign(ENV_KEY, newKeyB64())}\n`);
    const { args, warnings } = opts({ flags: { 'key-file': file }, env: { [ENV_KEY_FILE]: join(outside, 'khac.key') } });
    expect(await resolvePrivateKey(args)).toEqual({ b64: key, source: 'file', path: file });
    expect(warnings.length).toBe(1);
  });

  it('--key-stdin đọc từ stdin và thắng mọi nguồn khác', async () => {
    const key = newKeyB64();
    const { args } = opts({ flags: { 'key-stdin': true }, env: { [ENV_KEY]: newKeyB64() }, readStdin: async () => `${key}\r\n` });
    expect(await resolvePrivateKey(args)).toEqual({ b64: key, source: 'stdin' });
  });

  it('báo lỗi rõ khi cấu hình sai: thiếu đường dẫn, tệp trong repo, tệp không có, stdin rỗng', async () => {
    await expect(resolvePrivateKey(opts({ flags: { 'key-file': true } }).args)).rejects.toThrow(KeyError);
    writeFileSync(join(root, 'in-repo.key'), `${newKeyB64()}\n`);
    await expect(resolvePrivateKey(opts({ flags: { 'key-file': join(root, 'in-repo.key') } }).args)).rejects.toThrow(KeyError);
    await expect(resolvePrivateKey(opts({ flags: { 'key-file': join(outside, 'khong-co.key') } }).args)).rejects.toThrow(KeyError);
    await expect(resolvePrivateKey(opts({ flags: { 'key-stdin': true } }).args)).rejects.toThrow(KeyError);
  });

  it('thông báo lỗi không bao giờ chứa giá trị khóa', async () => {
    const key = newKeyB64();
    const file = join(outside, 'two-lines.key');
    writeFileSync(file, `${key}\n${key}\n`);
    const error = await resolvePrivateKey(opts({ flags: { 'key-file': file } }).args).catch((e) => e);
    expect(error).toBeInstanceOf(KeyError);
    expect(error.message).not.toContain(key);
  });
});

describe('khóa và public key', () => {
  it('khóa Ed25519 hợp lệ cho ra public key base64url 43 ký tự', () => {
    const pub = publicKeyB64Url(toPrivateKeyObject(newKeyB64()));
    expect(pub).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });
  it('từ chối dữ liệu rác và khóa không phải Ed25519', () => {
    expect(() => toPrivateKeyObject('khong-phai-khoa')).toThrow(KeyError);
    const ecKey = generateKeyPairSync('ec', { namedCurve: 'prime256v1' }).privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64');
    expect(() => toPrivateKeyObject(ecKey)).toThrow(KeyError);
  });
  it('đọc public key đang nhúng trong app', () => {
    mkdirSync(join(root, 'src', 'utils'), { recursive: true });
    writeFileSync(join(root, 'src', 'utils', 'licenseCrypto.ts'), "export const LICENSE_PUBLIC_KEY_B64URL = 'abc_DEF-123';\n");
    expect(readEmbeddedPublicKey(root)).toBe('abc_DEF-123');
  });
});

describe('writeNewKeyFile', () => {
  it('ghi ra ngoài repo, không ghi đè khi thiếu force, ghi đè khi có force', () => {
    const file = join(outside, 'sub', 'new.key');
    const first = newKeyB64();
    expect(writeNewKeyFile(file, first, { root })).toBe(file);
    expect(readFileSync(file, 'utf8')).toBe(`${first}\n`);
    expect(() => writeNewKeyFile(file, newKeyB64(), { root })).toThrow(KeyError);
    const second = newKeyB64();
    writeNewKeyFile(file, second, { root, force: true });
    expect(readFileSync(file, 'utf8')).toBe(`${second}\n`);
  });
  it('từ chối ghi khóa vào trong repo', () => {
    expect(() => writeNewKeyFile(join(root, 'new.key'), newKeyB64(), { root })).toThrow(KeyError);
  });
});
