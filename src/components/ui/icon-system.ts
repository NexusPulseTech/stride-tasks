/**
 * ICON DESIGN SYSTEM STANDARD
 * Grounded in research from Linear, Apple SF Symbols, and GitHub Primer:
 * 
 * 1. Unified Optical Weight:
 *    - Default stroke: 1.5 (Standard for SaaS / Linear / Raycast precision UI)
 *    - Micro stroke: 1.75 - 2 (For <= 14px icons to preserve legibility on low-DPI screens)
 *    - Action/Bold stroke: 2 - 2.5 (Exclusively for checkmarks or prominent indicators)
 * 
 * 2. Unified Size Scale (4px/8px alignment):
 *    - micro: 12px (size-3) - nested indicators, micro tags
 *    - sm:    14px (size-3.5) - secondary buttons, list item actions, metadata
 *    - base:  16px (size-4) - primary buttons, toolbars, menu items, inputs
 *    - lg:    20px (size-5) - prominent headers, floating action buttons
 *    - xl:    24px (size-6) - empty states, illustrations
 * 
 * 3. Rotational Accordion Discipline:
 *    - Never conditionally swap `<ChevronDown>` and `<ChevronRight>`.
 *    - Always render `<ChevronRight className="transition-transform duration-200 {expanded ? 'rotate-90' : ''}" />`
 *      to ensure hardware-accelerated 60fps rotation without DOM recreation or layout jitter.
 * 
 * 4. Accessibility & Semantics:
 *    - All decorative SVGs must have `aria-hidden="true"` and `shrink-0`.
 *    - Icon-only buttons must provide explicit `title` and `aria-label`.
 *    - System theme uses `<Monitor>` (universal standard), not `<Laptop>`.
 *    - No raw Unicode characters (e.g. ✕) or emojis (e.g. 📁) where standardized SVG icons exist.
 */

export const ICON_SIZES = {
  micro: 'w-3 h-3 shrink-0',
  sm: 'w-3.5 h-3.5 shrink-0',
  base: 'w-4 h-4 shrink-0',
  lg: 'w-5 h-5 shrink-0',
  xl: 'w-6 h-6 shrink-0',
} as const;

export const ICON_STROKES = {
  thin: 1.25,
  regular: 1.5,
  medium: 1.75,
  bold: 2,
  heavy: 2.5,
} as const;
