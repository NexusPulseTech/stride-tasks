import React from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle, X } from 'lucide-react';
import { useLanguage, formatMessage } from '../../../i18n';
import { RichText } from '../../../components/ui/RichText';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GuideSection {
  title: string;
  body?: string;
  items?: string[];
  note?: string;
}

const KBD_CLASS =
  'bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-mono text-[10px]';

export function GuideModal({ isOpen, onClose }: GuideModalProps) {
  const { t } = useLanguage();
  if (!isOpen) return null;

  const g = t.guide;
  const sections: GuideSection[] = [
    { title: g.s1Title, body: g.s1Body, items: [g.s1Item1, g.s1Item2, g.s1Item3] },
    {
      title: g.s2Title,
      body: g.s2Body,
      items: [
        formatMessage(g.s2Item1, { daily: t.taskRow.daily, weekdays: t.taskRow.weekdaysLong, weekly: t.taskRow.weekly }),
        g.s2Item2,
        formatMessage(g.s2Item3, { redo: t.taskRow.redo }),
      ],
    },
    { title: g.s3Title, body: g.s3Body },
    { title: g.s4Title, body: g.s4Body, note: formatMessage(g.s4Note, { backup: t.header.backupLabel }) },
    { title: g.s5Title, body: g.s5Body, items: [g.s5Item1, g.s5Item2, g.s5Item3, g.s5Item4] },
  ];
  const shortcuts: Array<[keys: string, label: string]> = [
    ['Ctrl + K', g.keyPalette],
    ['B', g.keyBoard],
    ['1 · 2 · 3', g.keyReview],
    ['Shift + Enter', g.keyFocusStart],
    ['/', g.keySearch],
    ['F', g.keyFocusMode],
    ['D', g.keyTheme],
    ['Ctrl + Z', g.keyUndo],
  ];
  const number = (index: number) => String(index + 1).padStart(2, '0') + '.';

  return createPortal(
    <div
      onClick={onClose}
      className="fixed inset-0 z-[99999] bg-slate-950/40 dark:bg-black/70 backdrop-blur-[3px] flex items-center justify-center p-3.5 sm:p-4 animate-in fade-in duration-100"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#161b22] rounded-2xl max-w-[480px] w-[calc(100vw-32px)] shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden max-h-[85vh] flex flex-col animate-in zoom-in-[0.98] duration-100"
      >
        {/* Header */}
        <div className="px-4.5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0">
              <HelpCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[13px] sm:text-[13.5px] font-semibold text-slate-900 dark:text-slate-100 truncate">
                {g.title}
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-normal truncate mt-0.5">{g.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title={t.common.closeEsc}
            aria-label={t.common.close}
          >
            <X className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-2.5 overflow-y-auto overflow-x-hidden text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {sections.map((section, index) => (
            <div
              key={section.title}
              className="p-3 bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 rounded-xl space-y-1"
            >
              <div className="font-semibold text-slate-900 dark:text-slate-100 text-[12px] flex items-center gap-1.5">
                <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">{number(index)}</span>
                <span>{section.title}</span>
              </div>
              {section.body && (
                <p className="text-slate-600 dark:text-slate-300">
                  <RichText text={section.body} />
                </p>
              )}
              {section.items && (
                <ul className="list-disc pl-4 space-y-0.5 text-[11.5px] text-slate-500 dark:text-slate-400 pt-0.5">
                  {section.items.map((item) => (
                    <li key={item}>
                      <RichText text={item} />
                    </li>
                  ))}
                </ul>
              )}
              {section.note && (
                <p className="text-[11.5px] text-slate-500 dark:text-slate-400 pt-0.5">
                  <RichText text={section.note} />
                </p>
              )}
            </div>
          ))}

          <div className="p-3 bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 rounded-xl space-y-1">
            <div className="font-semibold text-slate-900 dark:text-slate-100 text-[12px] flex items-center gap-1.5">
              <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">{number(sections.length)}</span>
              <span>{g.s6Title}</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1">
              {shortcuts.map(([keys, label]) => (
                <div key={keys}>
                  <kbd className={KBD_CLASS}>{keys}</kbd> {label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4.5 py-2.5 sm:py-3 bg-slate-50/70 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-7.5 px-3.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-950 rounded-lg text-xs font-medium cursor-pointer shadow-xs active:scale-[0.98] transition-all"
          >
            {t.common.close}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
