import { getLevelFromCount, getTodayKey } from '../hooks/useActivityLog';
import type { Language } from '../../../i18n/types';

export interface HeatmapDay {
  dateKey: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  isToday: boolean;
  formattedDate: string;
}

export interface HeatmapWeek {
  days: (HeatmapDay | null)[];
  monthLabel?: string;
}

/** Nhãn ngắn theo ngôn ngữ giao diện; thứ trong tuần bắt đầu từ Chủ nhật như Date.getDay(). */
const LABELS: Record<Language, { months: string[]; weekdays: string[] }> = {
  vi: {
    months: ['Thg 1', 'Thg 2', 'Thg 3', 'Thg 4', 'Thg 5', 'Thg 6', 'Thg 7', 'Thg 8', 'Thg 9', 'Thg 10', 'Thg 11', 'Thg 12'],
    weekdays: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
  },
  en: {
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  },
};

export function heatmapWeekdayLabel(dayIndex: number, language: Language): string {
  return LABELS[language].weekdays[dayIndex];
}

export function formatHeatmapDate(d: Date, language: Language): string {
  const { months, weekdays } = LABELS[language];
  const dayName = weekdays[d.getDay()];
  if (language === 'vi') return `${dayName}, ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  return `${dayName}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function generateHeatmapWeeks(
  activityMap: Record<string, number>,
  weeksCount: number = 22,
  language: Language = 'en'
): HeatmapWeek[] {
  const todayKey = getTodayKey();
  const today = new Date();

  // Tìm ngày Thứ Bảy cuối tuần hiện tại
  const endOfWeek = new Date(today);
  const currentDayOfWeek = endOfWeek.getDay(); // 0 = CN, 6 = T7
  endOfWeek.setDate(endOfWeek.getDate() + (6 - currentDayOfWeek));

  // Lùi lại số tuần mong muốn
  const startDay = new Date(endOfWeek);
  startDay.setDate(startDay.getDate() - (weeksCount * 7 - 1));

  const weeks: HeatmapWeek[] = [];
  let currentMonthIndex = -1;

  for (let w = 0; w < weeksCount; w++) {
    const days: (HeatmapDay | null)[] = [];
    let weekMonthLabel: string | undefined = undefined;

    for (let d = 0; d < 7; d++) {
      const curDate = new Date(startDay);
      curDate.setDate(startDay.getDate() + (w * 7 + d));

      // Không hiển thị các ngày trong tương lai sau hôm nay
      if (curDate.getTime() > today.getTime() && curDate.getDate() !== today.getDate()) {
        days.push(null);
        continue;
      }

      const year = curDate.getFullYear();
      const month = String(curDate.getMonth() + 1).padStart(2, '0');
      const day = String(curDate.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      // Xác định nhãn tháng khi chuyển tháng
      const mIdx = curDate.getMonth();
      if (d === 0 && mIdx !== currentMonthIndex) {
        currentMonthIndex = mIdx;
        weekMonthLabel = LABELS[language].months[mIdx];
      }

      const count = activityMap[dateKey] || 0;
      days.push({
        dateKey,
        count,
        level: getLevelFromCount(count),
        isToday: dateKey === todayKey,
        formattedDate: formatHeatmapDate(curDate, language),
      });
    }

    weeks.push({
      days,
      monthLabel: weekMonthLabel,
    });
  }

  return weeks;
}
