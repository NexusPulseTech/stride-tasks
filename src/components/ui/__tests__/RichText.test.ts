import { describe, expect, it } from 'vitest';
import { splitRichText } from '../RichText';

describe('splitRichText', () => {
  it('splits bold and code segments', () => {
    expect(splitRichText('Press **Share**, then type `!pin`.')).toEqual([
      { type: 'text', value: 'Press ' },
      { type: 'strong', value: 'Share' },
      { type: 'text', value: ', then type ' },
      { type: 'code', value: '!pin' },
      { type: 'text', value: '.' },
    ]);
  });

  it('keeps markup-looking text as plain text', () => {
    expect(splitRichText('<img src=x onerror=alert(1)> **ok**')).toEqual([
      { type: 'text', value: '<img src=x onerror=alert(1)> ' },
      { type: 'strong', value: 'ok' },
    ]);
  });

  it('leaves unmatched markers alone', () => {
    expect(splitRichText('a ** b ` c')).toEqual([{ type: 'text', value: 'a ** b ` c' }]);
  });
});
