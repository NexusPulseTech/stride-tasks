import { describe, expect, it } from 'vitest';
import { en } from '../en';
import { vi } from '../vi';
import { formatMessage, pluralize } from '../index';

const VIETNAMESE = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
const EMOJI = /\p{Extended_Pictographic}/u;
// Mũi tên và ký hiệu chữ thường dùng trong giao diện, không phải emoji
const TEXT_SYMBOLS = /[↔→←↑↓↻·•©®™]/g;

type Entry = [path: string, value: string];

function flatten(value: unknown, prefix = ''): Entry[] {
  if (typeof value === 'string') return [[prefix, value]];
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) => flatten(child, prefix ? `${prefix}.${key}` : key));
  }
  return [];
}

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');

describe('i18n catalog', () => {
  const enEntries = flatten(en);
  const viEntries = flatten(vi);
  const viByKey = new Map(viEntries);

  it('has the same keys in English and Vietnamese', () => {
    expect(viEntries.map(([key]) => key).sort()).toEqual(enEntries.map(([key]) => key).sort());
  });

  it('uses the same placeholders in both languages', () => {
    const mismatched = enEntries
      .filter(([key, text]) => placeholders(text) !== placeholders(viByKey.get(key) ?? ''))
      .map(([key]) => key);
    expect(mismatched).toEqual([]);
  });

  it('keeps Vietnamese out of the English catalog', () => {
    expect(enEntries.filter(([, text]) => VIETNAMESE.test(text)).map(([key]) => key)).toEqual([]);
  });

  it('has no emoji in either language', () => {
    const withEmoji = [...enEntries, ...viEntries]
      .filter(([, text]) => EMOJI.test(text.replace(TEXT_SYMBOLS, '')))
      .map(([key]) => key);
    expect(withEmoji).toEqual([]);
  });
});

describe('formatMessage and pluralize', () => {
  it('replaces known placeholders and keeps unknown ones', () => {
    expect(formatMessage('{a} and {b}', { a: 1 })).toBe('1 and {b}');
  });

  it('uses the singular form only for exactly one', () => {
    expect(pluralize(1, '{count} task', '{count} tasks')).toBe('1 task');
    expect(pluralize(0, '{count} task', '{count} tasks')).toBe('0 tasks');
    expect(pluralize(3, '{range}: {count} task', '{range}: {count} tasks', { range: 'This week' })).toBe(
      'This week: 3 tasks'
    );
  });
});
