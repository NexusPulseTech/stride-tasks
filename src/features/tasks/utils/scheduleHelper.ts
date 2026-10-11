/**
 * SMART SCHEDULE & WORKLOAD MANAGEMENT ENGINE
 * Best-practice implementation grounded in Linear, Apple Reminders, Todoist, and Things 3.
 */

import { Project, Task } from '../../../types';

export interface SchedulePreset {
  id: string;
  label: string;
  sublabel: string;
  date: Date;
  isoString: string;
  category: 'today' | 'tomorrow' | 'weekend' | 'nextWeek' | 'relative';
  isPast?: boolean;
}

export interface WorkloadInsight {
  totalPending: number;
  todayCount: number;
  tomorrowCount: number;
  overdueCount: number;
  adviceMessage: string;
  isHeavyWorkload: boolean;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function toDateInputValue(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function toTimeInputValue(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Phân tích độ tải công việc (Workload analysis) khi người dùng có quá nhiều việc
 */
export function analyzeWorkload(projects: Project[], referenceDate: Date = new Date()): WorkloadInsight {
  const allTasks: Task[] = projects.flatMap((p) => p.tasks).filter((t) => t.status !== 'done');
  const now = referenceDate;
  const todayStr = toDateInputValue(now);

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = toDateInputValue(tomorrow);

  let todayCount = 0;
  let tomorrowCount = 0;
  let overdueCount = 0;

  for (const t of allTasks) {
    const timeTarget = t.reminderAt || t.deadline;
    if (!timeTarget) continue;

    const targetDate = new Date(timeTarget);
    if (isNaN(targetDate.getTime())) continue;

    const targetDateStr = toDateInputValue(targetDate);

    if (targetDate.getTime() < now.getTime() && !isSameDay(targetDate, now)) {
      overdueCount++;
    } else if (targetDateStr === todayStr) {
      todayCount++;
    } else if (targetDateStr === tomorrowStr) {
      tomorrowCount++;
    }
  }

  const isHeavyWorkload = todayCount >= 5 || overdueCount >= 3;
  let adviceMessage = '';

  if (overdueCount > 0 && todayCount >= 4) {
    adviceMessage = `Bạn đang có ${overdueCount} việc quá hạn và ${todayCount} việc hôm nay. Nên dời việc này sang Ngày mai hoặc Thứ Bảy để giảm tải.`;
  } else if (todayCount >= 5) {
    adviceMessage = `Hôm nay đã có ${todayCount} việc hẹn lịch. Gợi ý chọn buổi chiều muộn hoặc sáng mai để tránh dồn việc.`;
  } else if (todayCount === 0 && overdueCount === 0) {
    adviceMessage = 'Hôm nay chưa có việc nào hẹn giờ. Rất thích hợp để hoàn thành việc này trong ngày!';
  } else {
    adviceMessage = `Hôm nay có ${todayCount} việc hẹn giờ. Phân bổ khung giờ hợp lý giúp bạn duy trì nhịp độ làm việc.`;
  }

  return {
    totalPending: allTasks.length,
    todayCount,
    tomorrowCount,
    overdueCount,
    adviceMessage,
    isHeavyWorkload,
  };
}

/**
 * Sinh danh sách các khung giờ gợi ý thông minh chuẩn 1 chạm (One-tap presets)
 */
export function generateSchedulePresets(now: Date = new Date()): SchedulePreset[] {
  const presets: SchedulePreset[] = [];
  const currentHours = now.getHours();

  // 1. Hôm nay: Buổi sáng 09:00
  const todayMorning = new Date(now);
  todayMorning.setHours(9, 0, 0, 0);
  presets.push({
    id: 'today_morning',
    label: 'Sáng nay',
    sublabel: '09:00',
    date: todayMorning,
    isoString: todayMorning.toISOString(),
    category: 'today',
    isPast: currentHours >= 9,
  });

  // 2. Hôm nay: Buổi chiều 14:00
  const todayAfternoon = new Date(now);
  todayAfternoon.setHours(14, 0, 0, 0);
  presets.push({
    id: 'today_afternoon',
    label: 'Chiều nay',
    sublabel: '14:00',
    date: todayAfternoon,
    isoString: todayAfternoon.toISOString(),
    category: 'today',
    isPast: currentHours >= 14,
  });

  // 3. Hôm nay: Buổi tối 20:00
  const todayEvening = new Date(now);
  todayEvening.setHours(20, 0, 0, 0);
  presets.push({
    id: 'today_evening',
    label: 'Tối nay',
    sublabel: '20:00',
    date: todayEvening,
    isoString: todayEvening.toISOString(),
    category: 'today',
    isPast: currentHours >= 20,
  });

  // 4. Khẩn cấp / Tập trung nhanh: Sau 1 tiếng nữa (+1h)
  const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);
  in1Hour.setMinutes(Math.round(in1Hour.getMinutes() / 5) * 5, 0, 0);
  presets.push({
    id: 'in_1_hour',
    label: 'Sau 1 tiếng',
    sublabel: `${pad(in1Hour.getHours())}:${pad(in1Hour.getMinutes())}`,
    date: in1Hour,
    isoString: in1Hour.toISOString(),
    category: 'relative',
  });

  // 5. Sau 3 tiếng nữa (+3h)
  const in3Hours = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  in3Hours.setMinutes(Math.round(in3Hours.getMinutes() / 5) * 5, 0, 0);
  presets.push({
    id: 'in_3_hours',
    label: 'Sau 3 tiếng',
    sublabel: `${pad(in3Hours.getHours())}:${pad(in3Hours.getMinutes())}`,
    date: in3Hours,
    isoString: in3Hours.toISOString(),
    category: 'relative',
  });

  // 6. Sáng mai 09:00
  const tomorrowMorning = new Date(now);
  tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);
  tomorrowMorning.setHours(9, 0, 0, 0);
  presets.push({
    id: 'tomorrow_morning',
    label: 'Sáng mai',
    sublabel: '09:00',
    date: tomorrowMorning,
    isoString: tomorrowMorning.toISOString(),
    category: 'tomorrow',
  });

  // 7. Chiều mai 14:00
  const tomorrowAfternoon = new Date(now);
  tomorrowAfternoon.setDate(tomorrowAfternoon.getDate() + 1);
  tomorrowAfternoon.setHours(14, 0, 0, 0);
  presets.push({
    id: 'tomorrow_afternoon',
    label: 'Chiều mai',
    sublabel: '14:00',
    date: tomorrowAfternoon,
    isoString: tomorrowAfternoon.toISOString(),
    category: 'tomorrow',
  });

  // 8. Cuối tuần này (Thứ Bảy 09:00)
  const saturday = new Date(now);
  const dayOfWeek = saturday.getDay();
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
  saturday.setDate(saturday.getDate() + daysUntilSaturday);
  saturday.setHours(9, 0, 0, 0);
  presets.push({
    id: 'this_weekend',
    label: 'Thứ Bảy tuần này',
    sublabel: `${pad(saturday.getDate())}/${pad(saturday.getMonth() + 1)} · 09:00`,
    date: saturday,
    isoString: saturday.toISOString(),
    category: 'weekend',
  });

  // 9. Đầu tuần sau (Thứ Hai 09:00)
  const nextMonday = new Date(now);
  const daysUntilMonday = (1 - dayOfWeek + 7) % 7 || 7;
  nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
  nextMonday.setHours(9, 0, 0, 0);
  presets.push({
    id: 'next_week',
    label: 'Thứ Hai tuần sau',
    sublabel: `${pad(nextMonday.getDate())}/${pad(nextMonday.getMonth() + 1)} · 09:00`,
    date: nextMonday,
    isoString: nextMonday.toISOString(),
    category: 'nextWeek',
  });

  return presets;
}

/**
 * Định dạng nhãn lịch trình tinh tế, chuẩn Big Tech unboxed metadata (Linear / Things 3)
 */
export function formatScheduleBadge(
  reminderAt?: string,
  deadline?: string,
  now: Date = new Date()
): {
  label: string;
  status: 'overdue' | 'today' | 'tomorrow' | 'upcoming' | 'none';
  isOverdue: boolean;
  timeOnly?: string;
} {
  const targetStr = reminderAt || deadline;
  if (!targetStr) {
    return { label: '', status: 'none', isOverdue: false };
  }

  const targetDate = new Date(targetStr);
  if (isNaN(targetDate.getTime())) {
    return { label: '', status: 'none', isOverdue: false };
  }

  const hasTime = targetStr.includes('T') && targetStr.length > 10;
  const timeFormatted = hasTime
    ? `${pad(targetDate.getHours())}:${pad(targetDate.getMinutes())}`
    : '';

  const isToday = isSameDay(targetDate, now);

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = isSameDay(targetDate, tomorrow);

  const isPast = targetDate.getTime() < now.getTime();

  // Đã quá hạn
  if (isPast && !isToday) {
    const dateLabel = `${pad(targetDate.getDate())}/${pad(targetDate.getMonth() + 1)}`;
    return {
      label: timeFormatted ? `Quá hạn (${dateLabel} ${timeFormatted})` : `Quá hạn (${dateLabel})`,
      status: 'overdue',
      isOverdue: true,
      timeOnly: timeFormatted,
    };
  }

  if (isToday) {
    return {
      label: timeFormatted ? `Hôm nay, ${timeFormatted}` : 'Hôm nay',
      status: isPast ? 'overdue' : 'today',
      isOverdue: isPast,
      timeOnly: timeFormatted,
    };
  }

  if (isTomorrow) {
    return {
      label: timeFormatted ? `Mai, ${timeFormatted}` : 'Ngày mai',
      status: 'tomorrow',
      isOverdue: false,
      timeOnly: timeFormatted,
    };
  }

  // Trong vòng 6 ngày tới
  const diffDays = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 6 && diffDays > 0) {
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const dayName = dayNames[targetDate.getDay()];
    return {
      label: timeFormatted ? `${dayName}, ${timeFormatted}` : `${dayName}, ${pad(targetDate.getDate())}/${pad(targetDate.getMonth() + 1)}`,
      status: 'upcoming',
      isOverdue: false,
      timeOnly: timeFormatted,
    };
  }

  const fullDate = `${pad(targetDate.getDate())}/${pad(targetDate.getMonth() + 1)}`;
  return {
    label: timeFormatted ? `${fullDate}, ${timeFormatted}` : fullDate,
    status: 'upcoming',
    isOverdue: false,
    timeOnly: timeFormatted,
  };
}
