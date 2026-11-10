import React from 'react';

export interface RichToken {
  type: 'text' | 'strong' | 'code';
  value: string;
}

/**
 * Tách chuỗi dịch có định dạng tối thiểu: **đậm** và `mã`.
 * Không phân tích HTML nên chuỗi dịch không thể chèn thẻ hay script vào trang.
 */
export function splitRichText(text: string): RichToken[] {
  return text
    .split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
    .filter(Boolean)
    .map((part): RichToken => {
      if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) {
        return { type: 'strong', value: part.slice(2, -2) };
      }
      if (part.length > 2 && part.startsWith('`') && part.endsWith('`')) {
        return { type: 'code', value: part.slice(1, -1) };
      }
      return { type: 'text', value: part };
    });
}

const CODE_CLASS =
  'font-mono text-[11px] px-1 py-px rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200';

export function RichText({ text }: { text: string }) {
  return (
    <>
      {splitRichText(text).map((token, index) => {
        if (token.type === 'strong') {
          return (
            <strong key={index} className="font-semibold">
              {token.value}
            </strong>
          );
        }
        if (token.type === 'code') {
          return (
            <code key={index} className={CODE_CLASS}>
              {token.value}
            </code>
          );
        }
        return <React.Fragment key={index}>{token.value}</React.Fragment>;
      })}
    </>
  );
}
