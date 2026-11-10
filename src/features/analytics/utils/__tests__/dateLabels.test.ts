import { describe, expect, it } from 'vitest';
import { formatHeatmapDate, generateHeatmapWeeks, heatmapWeekdayLabel } from '../heatmapHelper';
import { formatCompletedTime } from '../completedTasksHelper';

const EN = { today: 'Today', yesterday: 'Yesterday', language: 'en' as const };
const VI = { today: 'Hôm nay', yesterday: 'Hôm qua', language: 'vi' as const };

describe('heatmap labels', () => {
  const tuesday = new Date(2026, 10, 10);

  it('formats a day in the interface language', () => {
    expect(formatHeatmapDate(tuesday, 'en')).toBe('Tue, Nov 10, 2026');
    expect(formatHeatmapDate(tuesday, 'vi')).toBe('T3, 10/11/2026');
  });

  it('labels weekdays per language', () => {
    expect(heatmapWeekdayLabel(1, 'en')).toBe('Mon');
    expect(heatmapWeekdayLabel(1, 'vi')).toBe('T2');
  });

  it('shows English month labels to English users', () => {
    const labels = generateHeatmapWeeks({}, 22, 'en')
      .map((week) => week.monthLabel)
      .filter((label): label is string => Boolean(label));
    expect(labels.length).toBeGreaterThan(0);
    expect(labels.every((label) => /^[A-Z][a-z]{2}$/.test(label))).toBe(true);
  });
});

describe('completed time', () => {
  it('uses the given words for today and yesterday', () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    expect(formatCompletedTime(now.toISOString(), EN)).toMatch(/^Today, \d{2}:\d{2}$/);
    expect(formatCompletedTime(yesterday.toISOString(), VI)).toMatch(/^Hôm qua, \d{2}:\d{2}$/);
  });

  it('writes older dates with a month name in English and day/month in Vietnamese', () => {
    const older = new Date(2026, 0, 5, 9, 30).toISOString();
    expect(formatCompletedTime(older, EN)).toBe('09:30 · Jan 5');
    expect(formatCompletedTime(older, VI)).toBe('09:30 · 05/01');
  });
});
