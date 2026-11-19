import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as snooze from '../spacedSnooze';

const SRC_DIR = fileURLToPath(new URL('../../../../', import.meta.url));

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return name === '__tests__' ? [] : sourceFiles(full);
    return /\.(ts|tsx)$/.test(name) ? [full] : [];
  });
}

describe('F11: nhãn hệ số giãn cách lấy từ một hằng số', () => {
  it('không file nào viết cứng hệ số dạng "×2.3" hay "×2.2" (trước đây Smart schedule ghi ×2.3, code dùng 2.2)', () => {
    const offenders = sourceFiles(SRC_DIR).filter((file) => /×\s?\d/.test(readFileSync(file, 'utf8')));
    expect(offenders.map((f) => f.slice(SRC_DIR.length))).toEqual([]);
  });

  it('nhãn dùng chung khớp hệ số thật và xuất hiện trong lựa chọn thứ hai', () => {
    const mod = snooze as Record<string, unknown>;
    expect(mod.SNOOZE_GROWTH_FACTOR).toBe(2.2);
    expect(mod.SNOOZE_GROWTH_LABEL).toBe('×2.2');
    const [, good] = snooze.getAnkiSrs3Options(1);
    expect(good.subLabelEn).toContain(String(mod.SNOOZE_GROWTH_LABEL));
    expect(good.subLabelVi).toContain(String(mod.SNOOZE_GROWTH_LABEL));
  });
});
