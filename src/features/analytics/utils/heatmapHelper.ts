import { getLevelFromCount, getTodayKey } from '../hooks/useActivityLog';

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

const MONTH_NAMES = [
  'Thg 1', 'Thg 2', 'Thg 3', 'Thg 4', 'Thg 5', 'Thg 6',
  'Thg 7', 'Thg 8', 'Thg 9', 'Thg 10', 'Thg 11', 'Thg 12',
];

const VI_WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

function formatDateVi(d: Date): string {
  const dayName = VI_WEEKDAYS[d.getDay()];
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return `${dayName}, ${day}/${month}/${year}`;
}

export function generateHeatmapWeeks(
  activityMap: Record<string, number>,
  weeksCount: number = 22
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
        weekMonthLabel = MONTH_NAMES[mIdx];
      }

      const count = activityMap[dateKey] || 0;
      days.push({
        dateKey,
        count,
        level: getLevelFromCount(count),
        isToday: dateKey === todayKey,
        formattedDate: formatDateVi(curDate),
      });
    }

    weeks.push({
      days,
      monthLabel: weekMonthLabel,
    });
  }

  return weeks;
}
