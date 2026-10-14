import { SubTask, Task, Project, StatusDefinition } from '../../../types';
import { isDoneStatus, isDoingStatus } from './statusCategory';

/**
 * THUẬT TOÁN ĐỆ QUY XÁC ĐỊNH BƯỚC HÀNH ĐỘNG TIẾP THEO (GTD NEXT ACTION & BOTTOM-UP RESOLVER)
 * Nguyên tắc:
 * 1. Nếu một việc cha có các việc con (subtasks), ta không bao giờ làm ngợp người dùng bằng toàn bộ cây việc.
 * 2. Hệ thống đệ quy tìm bước lá con sâu nhất (deepest uncompleted leaf) chưa làm.
 * 3. Khi bước con sâu nhất hoàn thành, hệ thống tự động nổi lên bước con ngang hàng tiếp theo
 *    hoặc bậc cao hơn 1 bậc cho đến khi tới việc cha gốc!
 */

export interface ActionableItem {
  id: string;                    // Id của việc cụ thể (subtask id hoặc task id)
  title: string;                 // Tiêu đề việc cần làm
  projectId: string;
  projectName: string;
  projectColor?: string;
  taskId: string;                // Id của task cha gốc
  taskTitle: string;
  isSubtask: boolean;
  subtaskId?: string;
  parentPath: string[];          // Đường dẫn phả hệ (VD: ["Phát triển web", "Giao diện", "Nút bấm"])
  depth: number;
  snoozeUntil?: string;
  snoozeLevel?: number;
  status: string;
  isPinned?: boolean;
  reminderAt?: string;
  deadline?: string;
}

/**
 * Tìm đệ quy bước lá con chưa hoàn thành đầu tiên trong cây subtasks
 */
export function findFirstActionableLeafSubtask(
  subs: SubTask[],
  parentChain: { id: string; title: string }[] = []
): { subtask: SubTask; parentChain: { id: string; title: string }[]; depth: number } | null {
  for (const sub of subs) {
    if (sub.completed) continue;

    // Nếu subtask này có các subtask con bên trong
    if (sub.subtasks && sub.subtasks.length > 0) {
      const hasUnfinishedChildren = sub.subtasks.some((c) => !c.completed);
      if (hasUnfinishedChildren) {
        // Đào sâu hơn vào nhánh con chưa xong
        const deeper = findFirstActionableLeafSubtask(sub.subtasks, [
          ...parentChain,
          { id: sub.id, title: sub.title },
        ]);
        if (deeper) return deeper;
      }
    }

    // Nếu không có con chưa xong hoặc là lá (leaf)
    return {
      subtask: sub,
      parentChain,
      depth: parentChain.length,
    };
  }

  return null;
}

/**
 * Trích xuất bước hành động trực tiếp khả thi nhất cho 1 Task
 */
export function resolveActionableItemForTask(
  task: Task,
  project: Project,
  statuses: StatusDefinition[]
): ActionableItem | null {
  if (isDoneStatus(task.status, statuses)) {
    return null;
  }

  // Nếu task có subtasks
  if (task.subtasks && task.subtasks.length > 0) {
    const leaf = findFirstActionableLeafSubtask(task.subtasks);
    if (leaf) {
      return {
        id: leaf.subtask.id,
        title: leaf.subtask.title,
        projectId: project.id,
        projectName: project.name,
        projectColor: project.color,
        taskId: task.id,
        taskTitle: task.title,
        isSubtask: true,
        subtaskId: leaf.subtask.id,
        parentPath: [task.title, ...leaf.parentChain.map((p) => p.title)],
        depth: leaf.depth + 1,
        snoozeUntil: leaf.subtask.snoozeUntil,
        snoozeLevel: leaf.subtask.snoozeLevel,
        status: leaf.subtask.status || 'todo',
        isPinned: leaf.subtask.isPinned,
        reminderAt: task.reminderAt,
        deadline: task.deadline,
      };
    }
  }

  // Nếu không có subtasks hoặc tất cả subtasks đã xong -> chính task này là hành động
  return {
    id: task.id,
    title: task.title,
    projectId: project.id,
    projectName: project.name,
    projectColor: project.color,
    taskId: task.id,
    taskTitle: task.title,
    isSubtask: false,
    parentPath: [task.title],
    depth: 0,
    snoozeUntil: task.snoozeUntil,
    snoozeLevel: task.snoozeLevel,
    status: task.status,
    isPinned: task.isPinned,
    reminderAt: task.reminderAt,
    deadline: task.deadline,
  };
}

/**
 * Kiểm tra xem một việc có đang trong thời gian hoãn (snooze) hay không
 */
export function isCurrentlySnoozed(snoozeUntil?: string): boolean {
  if (!snoozeUntil) return false;
  const time = new Date(snoozeUntil).getTime();
  if (isNaN(time)) return false;
  return time > Date.now();
}

/**
 * Định dạng đếm ngược thời gian hoãn
 */
export function formatSnoozeCountdown(
  snoozeUntil?: string,
  language: 'vi' | 'en' = 'vi'
): { isDue: boolean; text: string; hoursLeft: number } | null {
  if (!snoozeUntil) return null;
  const target = new Date(snoozeUntil).getTime();
  if (isNaN(target)) return null;

  const now = Date.now();
  const diffMs = target - now;

  if (diffMs <= 0) {
    return {
      isDue: true,
      text: language === 'vi' ? 'Đến hạn làm lại' : 'Due for action',
      hoursLeft: 0,
    };
  }

  const totalMinutes = Math.floor(diffMs / (60 * 1000));
  const totalHours = Math.floor(diffMs / (60 * 60 * 1000));
  const days = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;

  if (days >= 1) {
    const text =
      language === 'vi'
        ? `Còn ${days} ngày${remainingHours > 0 ? ` ${remainingHours}h` : ''}`
        : `${days}d${remainingHours > 0 ? ` ${remainingHours}h` : ''} left`;
    return { isDue: false, text, hoursLeft: totalHours };
  }

  if (totalHours >= 1) {
    const text =
      language === 'vi'
        ? `Còn ${totalHours} giờ`
        : `${totalHours}h left`;
    return { isDue: false, text, hoursLeft: totalHours };
  }

  const text =
    language === 'vi'
      ? `Còn ${Math.max(1, totalMinutes)} phút`
      : `${Math.max(1, totalMinutes)}m left`;
  return { isDue: false, text, hoursLeft: 1 };
}

/**
 * Gợi ý các mốc hoãn đếm ngược (Spaced Repetition Presets)
 * Quy tắc:
 * - Mặc định luôn có option "1 ngày nữa" (+1 ngày làm mốc chuẩn)
 * - Tùy chọn tiếp theo nhân lũy tiến:
 *   Nếu chưa từng hoãn: 1 ngày, 2 ngày, 3 ngày, 7 ngày.
 *   Nếu đã hoãn lần 1 (1 ngày): gợi ý 1 ngày, 3 ngày (1x3), 9 ngày (3x3).
 *   Nếu đã hoãn lần 2 (3 ngày): gợi ý 1 ngày, 9 ngày, 21 ngày.
 */
export interface SnoozePresetOption {
  days: number;
  labelVi: string;
  labelEn: string;
  nextLevel: number;
}

/**
 * MÔ HÌNH NHẮC LẶP CẤP SỐ NHÂN CHUẨN ANKIWEB (SM-2 / FSRS SPACED REPETITION)
 * Nguyên lý Toán học AnkiWeb:
 * - Khoảng cách nhắc tiếp theo tăng theo cấp số nhân: I(n) = round(I(n-1) × EF) với Ease Factor EF ≈ 2.2 - 2.5
 * - Chuỗi cấp số nhân chuẩn: 1 ngày -> 3 ngày -> 7 ngày -> 16 ngày -> 35 ngày -> 77 ngày -> 170 ngày -> 365 ngày
 * - Option 1 (Phím 1 - Again): days = 0, reset lập tức về Mức 1 (dù đang ở mức cao nhất), tự động Ghim ưu tiên lên đầu.
 * - Option 2 (Phím 2 / Space - Good): Tăng 1 cấp (currentLevel + 1), nhân khoảng cách theo cấp số nhân chuẩn.
 * - Option 3 (Phím 3 - Easy): Nhảy vượt 2 cấp (currentLevel + 2) với hệ số Easy Bonus dành cho việc chưa gấp.
 */
export interface AnkiSrsOption {
  optionNumber: 1 | 2 | 3;
  type: 'again' | 'medium' | 'spaced';
  ankiRatingVi: string;   // 'Lặp lại ngay (Again)'
  ankiRatingEn: string;   // 'Repeat now (Again)'
  labelVi: string;
  labelEn: string;
  subLabelVi: string;
  subLabelEn: string;
  intervalTagVi: string;
  intervalTagEn: string;
  days: number;           // 0 = ngay bây giờ
  nextLevel: number;
  autoPin: boolean;       // Option 1 luôn auto pin
  badgeColor: string;
}

const ANKI_EXPONENTIAL_BASE_DAYS = [1, 3, 7, 16, 35];
const ANKI_EASE_FACTOR = 2.2;
const ANKI_MAX_INTERVAL_DAYS = 365;

export function calculateAnkiExponentialDays(stepLevel: number): number {
  const lvl = Math.max(1, Math.floor(stepLevel));
  if (lvl <= ANKI_EXPONENTIAL_BASE_DAYS.length) {
    return ANKI_EXPONENTIAL_BASE_DAYS[lvl - 1];
  }
  const base = ANKI_EXPONENTIAL_BASE_DAYS[ANKI_EXPONENTIAL_BASE_DAYS.length - 1];
  const power = lvl - ANKI_EXPONENTIAL_BASE_DAYS.length;
  return Math.min(ANKI_MAX_INTERVAL_DAYS, Math.round(base * Math.pow(ANKI_EASE_FACTOR, power)));
}

function formatAnkiIntervalLabels(days: number): {
  textVi: string;
  textEn: string;
  tagVi: string;
  tagEn: string;
} {
  if (days <= 1) {
    return {
      textVi: '1 ngày nữa (Ngày mai)',
      textEn: 'In 1 day (Tomorrow)',
      tagVi: '+1 ngày',
      tagEn: '+1d',
    };
  }
  if (days === 7) {
    return {
      textVi: '1 tuần nữa (+7 ngày)',
      textEn: 'In 1 week (+7 days)',
      tagVi: '+7 ngày',
      tagEn: '+7d',
    };
  }
  if (days >= 30 && days < 365) {
    const months = Math.round((days / 30) * 10) / 10;
    return {
      textVi: `${days} ngày nữa (~${months} tháng)`,
      textEn: `In ${days} days (~${months} mo)`,
      tagVi: `+${days} ngày`,
      tagEn: `+${days}d`,
    };
  }
  if (days >= 365) {
    return {
      textVi: '365 ngày nữa (1 năm)',
      textEn: 'In 365 days (1 year)',
      tagVi: '+1 năm',
      tagEn: '+1y',
    };
  }
  return {
    textVi: `${days} ngày nữa`,
    textEn: `In ${days} days`,
    tagVi: `+${days} ngày`,
    tagEn: `+${days}d`,
  };
}

export function getAnkiSrs3Options(level: number = 1): [AnkiSrsOption, AnkiSrsOption, AnkiSrsOption] {
  const currentLvl = Math.max(1, level || 1);

  // OPTION 1: CỐ ĐỊNH Ở MỌI MỨC (Dù task đang ở mức cao, chọn 1 lập tức trở về Mức 1 & Ghim làm ngay)
  const option1: AnkiSrsOption = {
    optionNumber: 1,
    type: 'again',
    ankiRatingVi: 'Lặp lại ngay (Again)',
    ankiRatingEn: 'Repeat now (Again)',
    labelVi: 'Nhắc ngay & Ghim làm',
    labelEn: 'Remind now & Pin to Top',
    subLabelVi: 'Reset về Mức 1 • Ghim lên đầu',
    subLabelEn: 'Reset to Lvl 1 • Pin to Top',
    intervalTagVi: 'Ngay bây giờ',
    intervalTagEn: 'Immediate',
    days: 0,
    nextLevel: 1,
    autoPin: true,
    badgeColor: 'rose',
  };

  // OPTION 2 (Good): Nhân theo cấp số nhân chuẩn Anki SM-2 (bậc hiện tại -> bậc + 1)
  const opt2Days = calculateAnkiExponentialDays(currentLvl);
  const opt2NextLevel = currentLvl + 1;
  const opt2Formatted = formatAnkiIntervalLabels(opt2Days);

  // OPTION 3 (Easy): Nhảy bậc cấp số nhân (Easy Bonus -> bậc + 2)
  const opt3Days = calculateAnkiExponentialDays(currentLvl + 1);
  const opt3NextLevel = currentLvl + 2;
  const opt3Formatted = formatAnkiIntervalLabels(opt3Days);

  const option2: AnkiSrsOption = {
    optionNumber: 2,
    type: 'medium',
    ankiRatingVi: 'Chuẩn cấp số nhân (Good)',
    ankiRatingEn: 'Exponential (Good)',
    labelVi: opt2Formatted.textVi,
    labelEn: opt2Formatted.textEn,
    subLabelVi: `Cấp số nhân ×2.3 • Lên Mức ${opt2NextLevel}`,
    subLabelEn: `Exponential ×2.3 • To Lvl ${opt2NextLevel}`,
    intervalTagVi: opt2Formatted.tagVi,
    intervalTagEn: opt2Formatted.tagEn,
    days: opt2Days,
    nextLevel: opt2NextLevel,
    autoPin: false,
    badgeColor: 'blue',
  };

  const option3: AnkiSrsOption = {
    optionNumber: 3,
    type: 'spaced',
    ankiRatingVi: 'Dãn xa vượt cấp (Easy)',
    ankiRatingEn: 'Easy Bonus (Easy)',
    labelVi: opt3Formatted.textVi,
    labelEn: opt3Formatted.textEn,
    subLabelVi: `Nhảy 2 bậc • Lên Mức ${opt3NextLevel}`,
    subLabelEn: `Skip 2 levels • To Lvl ${opt3NextLevel}`,
    intervalTagVi: opt3Formatted.tagVi,
    intervalTagEn: opt3Formatted.tagEn,
    days: opt3Days,
    nextLevel: opt3NextLevel,
    autoPin: false,
    badgeColor: 'emerald',
  };

  return [option1, option2, option3];
}

export function getSpacedSnoozeOptions(currentLevel: number = 1): SnoozePresetOption[] {
  const options = getAnkiSrs3Options(currentLevel);
  return options
    .filter((opt) => opt.days > 0)
    .map((opt) => ({
      days: opt.days,
      labelVi: opt.labelVi,
      labelEn: opt.labelEn,
      nextLevel: opt.nextLevel,
    }));
}

/**
 * Tính ngày giờ kết thúc hoãn
 */
export function calculateSnoozeTarget(days: number): string {
  const target = new Date();
  target.setDate(target.getDate() + days);
  // Đặt vào đầu ngày làm việc tiếp theo: 09:00 sáng
  target.setHours(9, 0, 0, 0);
  return target.toISOString();
}

/**
 * Lọc hàng đợi công việc cần tập trung hôm nay (Daily Focus Queue)
 * - Lọc ra top uncompleted items (lá con sâu nhất được ưu tiên)
 * - Loại bỏ các việc đang bị snooze trong tương lai
 * - Sắp xếp theo độ ưu tiên: Đến hẹn/Quá hạn > Ghim > Đang làm > Việc khác
 */
export function getDailyFocusQueue(
  projects: Project[],
  statuses: StatusDefinition[],
  limit: number = 3
): ActionableItem[] {
  const allActionables: ActionableItem[] = [];

  for (const project of projects) {
    for (const task of project.tasks) {
      const actionable = resolveActionableItemForTask(task, project, statuses);
      if (actionable) {
        allActionables.push(actionable);
      }
    }
  }

  // Tách nhóm: Nhóm đang active (không bị hoãn hoặc hoãn đã hết hạn) và nhóm đang ngủ
  const now = Date.now();
  const activeItems = allActionables.filter((item) => {
    if (!item.snoozeUntil) return true;
    const time = new Date(item.snoozeUntil).getTime();
    return isNaN(time) || time <= now;
  });

  // Sắp xếp ưu tiên:
  activeItems.sort((a, b) => {
    // 1. Việc ghim lên đầu
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    // 2. Việc có lịch hẹn hôm nay/quá hạn
    const aDue = a.reminderAt || a.deadline;
    const bDue = b.reminderAt || b.deadline;
    if (aDue && !bDue) return -1;
    if (!aDue && bDue) return 1;

    // 3. Trạng thái đang làm (doing)
    const aDoing = isDoingStatus(a.status, statuses);
    const bDoing = isDoingStatus(b.status, statuses);
    if (aDoing && !bDoing) return -1;
    if (!aDoing && bDoing) return 1;

    // 4. Bước con sâu hơn ưu tiên giải quyết trước để gỡ nghẽn
    return b.depth - a.depth;
  });

  return activeItems.slice(0, limit);
}

/**
 * Trích xuất danh sách các việc chưa Done đang đến hạn nhắc Anki SRS
 */
export function getTasksDueForAnkiReview(
  projects: Project[],
  statuses: StatusDefinition[]
): {
  item: ActionableItem;
  options: [AnkiSrsOption, AnkiSrsOption, AnkiSrsOption];
}[] {
  const list: { item: ActionableItem; options: [AnkiSrsOption, AnkiSrsOption, AnkiSrsOption] }[] = [];
  const now = Date.now();

  for (const project of projects) {
    for (const task of project.tasks) {
      if (isDoneStatus(task.status, statuses)) continue;
      const actionable = resolveActionableItemForTask(task, project, statuses);
      if (!actionable) continue;

      // Nếu đang trong thời gian hoãn chưa tới hạn -> bỏ qua
      if (actionable.snoozeUntil) {
        const t = new Date(actionable.snoozeUntil).getTime();
        if (!isNaN(t) && t > now) {
          continue;
        }
      }

      const options = getAnkiSrs3Options(actionable.snoozeLevel || 1);
      list.push({ item: actionable, options });
    }
  }

  return list;
}
