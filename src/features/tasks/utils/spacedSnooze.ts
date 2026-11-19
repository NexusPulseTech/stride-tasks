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
  wakeAt?: string;               // Lúc việc quay lại Due Today (hết hoãn hoặc tới ngày hẹn); chỉ có ở tab Snoozed
}

/**
 * Thời điểm đến hạn sớm nhất (giờ nhắc hoặc hạn chót) theo giờ máy. Hạn chót chỉ có ngày thì tính tới cuối ngày đó.
 */
export function getDueTime(item: Pick<ActionableItem, 'reminderAt' | 'deadline'>): number | null {
  const times: number[] = [];
  if (item.reminderAt) {
    const t = new Date(item.reminderAt).getTime();
    if (!isNaN(t)) times.push(t);
  }
  if (item.deadline) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(item.deadline);
    const t = m
      ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 23, 59, 59, 999).getTime()
      : new Date(item.deadline).getTime();
    if (!isNaN(t)) times.push(t);
  }
  return times.length > 0 ? Math.min(...times) : null;
}

/**
 * Lúc việc quay lại Due Today: hết thời gian hoãn, và tới đầu ngày của giờ nhắc/hạn chót nếu ngày đó còn ở tương lai.
 * Trả null khi việc đang thuộc Due Today (B12 F06: trước đây việc hẹn ngày mai hay năm sau vẫn đứng đầu Due Today).
 * Việc đã ghim (kể cả bằng "1 · Remind Now") thì người dùng muốn thấy ngay, nên ngày hẹn ở tương lai không giấu nó.
 */
export function getWakeTime(
  item: Pick<ActionableItem, 'snoozeUntil' | 'reminderAt' | 'deadline' | 'isPinned'>,
  now: number = Date.now()
): number | null {
  let wake = 0;
  if (item.snoozeUntil) {
    const t = new Date(item.snoozeUntil).getTime();
    if (!isNaN(t) && t > now) wake = t;
  }
  const due = getDueTime(item);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  if (!item.isPinned && due !== null && due > endOfToday.getTime()) {
    const startOfDueDay = new Date(due);
    startOfDueDay.setHours(0, 0, 0, 0);
    wake = Math.max(wake, startOfDueDay.getTime());
  }
  return wake > now ? wake : null;
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
 * LỊCH ÔN GIÃN DẦN: lấy ý tưởng giãn cách cấp số nhân như Anki, nhưng KHÔNG phải SM-2 hay FSRS.
 * - Thang cố định, chung cho mọi việc; không có hệ số dễ (ease) riêng từng việc như SM-2. Bậc chỉ đổi theo nút người dùng chọn.
 * - Sau bậc 5, mỗi bậc nhân 2,2 (ANKI_EASE_FACTOR), tối đa 365 ngày.
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

  // OPTION 2 (Good): lên 1 bậc trên thang giãn dần (bậc hiện tại -> bậc + 1)
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
    subLabelVi: `Cấp số nhân ×2.2 • Lên Mức ${opt2NextLevel}`,
    subLabelEn: `Exponential ×2.2 • To Lvl ${opt2NextLevel}`,
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
  return options.map((opt) => ({
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
 * - Lọc ra toàn bộ uncompleted items (lá con sâu nhất được ưu tiên theo GTD)
 * - Loại bỏ các việc đang bị snooze và việc hẹn sang ngày sau (chúng nằm ở tab Snoozed)
 * - Sắp xếp theo độ ưu tiên: Ghim > Đến hẹn hôm nay/Quá hạn (sớm nhất trước) > Đang làm > Việc con sâu nhất
 */
export function getDailyFocusQueue(
  projects: Project[],
  statuses: StatusDefinition[],
  limit: number = 100
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

  // Nhóm đang active: không bị hoãn (hoặc hoãn đã hết) và không hẹn sang ngày sau
  const now = Date.now();
  const activeItems = allActionables.filter((item) => getWakeTime(item, now) === null);

  // Sắp xếp ưu tiên:
  activeItems.sort((a, b) => {
    // 1. Việc ghim lên đầu
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    // 2. Việc đến hạn hôm nay hoặc quá hạn (việc hẹn ngày sau đã bị lọc ra), sớm nhất trước
    const aDue = getDueTime(a);
    const bDue = getDueTime(b);
    if (aDue !== null && bDue === null) return -1;
    if (aDue === null && bDue !== null) return 1;
    if (aDue !== null && bDue !== null && aDue !== bDue) return aDue - bDue;

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
 * Việc đang hoãn (snoozeUntil > now) và việc hẹn sang ngày sau, sắp theo lúc quay lại Due Today
 */
export function getSnoozedItemsQueue(
  projects: Project[],
  statuses: StatusDefinition[]
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

  // Việc đang hoãn và việc hẹn sang ngày sau, kèm lúc quay lại Due Today để đếm ngược
  const now = Date.now();
  const snoozedItems: ActionableItem[] = [];
  for (const item of allActionables) {
    const wake = getWakeTime(item, now);
    if (wake !== null) snoozedItems.push({ ...item, wakeAt: new Date(wake).toISOString() });
  }

  snoozedItems.sort((a, b) => new Date(a.wakeAt!).getTime() - new Date(b.wakeAt!).getTime());

  return snoozedItems;
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
