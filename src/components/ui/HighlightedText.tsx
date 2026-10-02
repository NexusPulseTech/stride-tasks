import React from 'react';

interface HighlightedTextProps {
  text: string;
  highlight: string;
  className?: string;
}

export function HighlightedText({ text, highlight, className = '' }: HighlightedTextProps) {
  if (!highlight || !highlight.trim()) {
    return <span className={className}>{text}</span>;
  }

  const query = highlight.trim().toLowerCase();
  const lowerText = text.toLowerCase();
  const parts: React.ReactNode[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    const matchIndex = lowerText.indexOf(query, startIndex);
    if (matchIndex === -1) {
      parts.push(text.slice(startIndex));
      break;
    }

    if (matchIndex > startIndex) {
      parts.push(text.slice(startIndex, matchIndex));
    }

    const matchedSegment = text.slice(matchIndex, matchIndex + query.length);
    parts.push(
      <mark
        key={`h_${matchIndex}`}
        className="bg-amber-200/80 dark:bg-amber-500/30 text-slate-900 dark:text-amber-100 rounded-xs px-0.5 font-medium"
      >
        {matchedSegment}
      </mark>
    );

    startIndex = matchIndex + query.length;
  }

  return <span className={className}>{parts}</span>;
}
