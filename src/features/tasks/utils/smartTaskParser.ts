import type { RecurrenceType, Task } from '../../../types';

export interface ParsedTaskMetadata {
  cleanTitle: string;
  estimatedMinutes?: number;
  isPinned?: boolean;
  status?: string;
  reminderAt?: string;
  recurrence?: Exclude<RecurrenceType, null>;
  hasSmartTokens: boolean;
  /** true khi người dùng chỉ gõ toàn token (VD: "!pin ~15m") — nơi gọi phải chặn tạo việc */
  isTitleEmpty: boolean;
}

export const MAX_ESTIMATE_MINUTES = 1440;

// JS `\b` chỉ hiểu ký tự ASCII nên không dùng được với "giờ", "phút" hay tiêu đề có dấu.
// Ranh giới token = đầu chuỗi/khoảng trắng phía trước + khoảng trắng/cuối chuỗi phía sau.
const START = '(^|\\s)';
const END = '(?=\\s|$)';

const TIME_TOKEN = new RegExp(
  `${START}~(\\d+(?:[.,]\\d+)?)\\s?(giờ|gio|g|hrs|hr|h|phút|phut|ph|p|mins|min|m)${END}`,
  'giu'
);
const PIN_TOKEN = new RegExp(`${START}(!pin|!ghim|!!|!p1|!1)${END}`, 'giu');
const STATUS_TOKEN = new RegExp(`${START}#(todo|backlog|doing|danglam|wip|review|cho|done|xong)${END}`, 'giu');
const RECURRENCE_TOKEN = new RegExp(`${START}@(daily|hangngay|weekdays|ngaythuong|weekly|hangtuan)${END}`, 'giu');
const SCHEDULE_TOKEN = new RegExp(`${START}@(today|homnay|tomorrow|ngaymai)${END}`, 'giu');

const STATUS_ALIASES: Record<string, string> = {
  todo: 'todo',
  backlog: 'todo',
  doing: 'doing',
  danglam: 'doing',
  wip: 'doing',
  review: 'review',
  cho: 'review',
  done: 'done',
  xong: 'done',
};

const RECURRENCE_ALIASES: Record<string, Exclude<RecurrenceType, null>> = {
  daily: 'daily',
  hangngay: 'daily',
  weekdays: 'weekdays',
  ngaythuong: 'weekdays',
  weekly: 'weekly',
  hangtuan: 'weekly',
};

const HOUR_UNITS = new Set(['giờ', 'gio', 'g', 'hrs', 'hr', 'h']);

/** Gom tất cả các lần xuất hiện của token, trả về giá trị đã bắt và chuỗi đã gỡ token */
function stripTokens(input: string, regex: RegExp): { rest: string; matches: string[][] } {
  const matches: string[][] = [];
  const rest = input.replace(regex, (...args: unknown[]) => {
    const groups = args.slice(1, -2) as string[];
    matches.push(groups.slice(1));
    return ' ';
  });
  return { rest, matches };
}

function computeTodayReminder(now: Date): Date {
  const target = new Date(now);
  if (now.getHours() >= 17) {
    // Sau 17:00 thì "hôm nay" = 1 tiếng nữa (làm tròn lên mốc 15 phút) thay vì một thời điểm đã qua
    target.setTime(now.getTime() + 60 * 60 * 1000);
    const m = target.getMinutes();
    target.setMinutes(Math.ceil(m / 15) * 15, 0, 0);
  } else {
    target.setHours(17, 0, 0, 0);
  }
  return target;
}

/**
 * Bộ phân tích cú pháp nhập nhanh 1 dòng.
 * - Thời lượng: ~15m, ~1h, ~1.5h, ~90p, ~45ph, ~1giờ, ~30phút (nhiều token được cộng dồn, kẹp 1..1440 phút)
 * - Ghim: !pin, !ghim, !!, !1, !p1
 * - Trạng thái: #todo #backlog → todo · #doing #danglam #wip → doing · #review #cho → review · #done #xong → done
 * - Lịch nhắc: @today/@homnay (17:00, hoặc +1h nếu đã quá 17:00), @tomorrow/@ngaymai (09:00 hôm sau)
 * - Lặp lại: @daily/@hangngay, @weekdays/@ngaythuong, @weekly/@hangtuan
 * Cố ý KHÔNG hỗ trợ "@mai" (trùng tên người "Mai") và "#tag" (Task chưa có trường tags).
 */
export function parseSmartTaskInput(rawInput: string, now: Date = new Date()): ParsedTaskMetadata {
  let working = (rawInput || '').normalize('NFC').trim();
  let hasSmartTokens = false;

  // 1. Thời lượng dự kiến — cộng dồn mọi token
  const time = stripTokens(working, TIME_TOKEN);
  let estimatedMinutes: number | undefined;
  let totalMinutes = 0;
  for (const [numStr, unitRaw] of time.matches) {
    const val = parseFloat(numStr.replace(',', '.'));
    if (!Number.isFinite(val) || val <= 0) continue;
    const unit = unitRaw.toLowerCase();
    totalMinutes += HOUR_UNITS.has(unit) ? val * 60 : val;
  }
  if (time.matches.length > 0) {
    working = time.rest;
    hasSmartTokens = true;
    const rounded = Math.round(totalMinutes);
    if (rounded >= 1) {
      estimatedMinutes = Math.min(MAX_ESTIMATE_MINUTES, rounded);
    }
  }

  // 2. Ghim ưu tiên
  const pin = stripTokens(working, PIN_TOKEN);
  let isPinned: boolean | undefined;
  if (pin.matches.length > 0) {
    working = pin.rest;
    isPinned = true;
    hasSmartTokens = true;
  }

  // 3. Trạng thái — token cuối cùng thắng
  const statusParse = stripTokens(working, STATUS_TOKEN);
  let status: string | undefined;
  if (statusParse.matches.length > 0) {
    working = statusParse.rest;
    const last = statusParse.matches[statusParse.matches.length - 1][0].toLowerCase();
    status = STATUS_ALIASES[last];
    hasSmartTokens = true;
  }

  // 4. Lặp lại
  const recParse = stripTokens(working, RECURRENCE_TOKEN);
  let recurrence: Exclude<RecurrenceType, null> | undefined;
  if (recParse.matches.length > 0) {
    working = recParse.rest;
    const last = recParse.matches[recParse.matches.length - 1][0].toLowerCase();
    recurrence = RECURRENCE_ALIASES[last];
    hasSmartTokens = true;
  }

  // 5. Lịch nhắc
  const schedParse = stripTokens(working, SCHEDULE_TOKEN);
  let reminderAt: string | undefined;
  if (schedParse.matches.length > 0) {
    working = schedParse.rest;
    const last = schedParse.matches[schedParse.matches.length - 1][0].toLowerCase();
    let target: Date;
    if (last === 'tomorrow' || last === 'ngaymai') {
      target = new Date(now);
      target.setDate(target.getDate() + 1);
      target.setHours(9, 0, 0, 0);
    } else {
      target = computeTodayReminder(now);
    }
    reminderAt = target.toISOString();
    hasSmartTokens = true;
  }

  const cleanTitle = working.replace(/\s+/g, ' ').trim();

  return {
    cleanTitle,
    estimatedMinutes,
    isPinned,
    status,
    reminderAt,
    recurrence,
    hasSmartTokens,
    isTitleEmpty: cleanTitle.length === 0,
  };
}

export function hasParsedMetadata(parsed: ParsedTaskMetadata): boolean {
  return (
    parsed.estimatedMinutes !== undefined ||
    Boolean(parsed.isPinned) ||
    parsed.status !== undefined ||
    parsed.reminderAt !== undefined ||
    parsed.recurrence !== undefined
  );
}

/**
 * Áp dụng metadata đã phân tích vào đối tượng Task mới.
 * Trả về task = null khi tiêu đề rỗng sau khi gỡ token (không được tạo việc không tên).
 */
export function buildSmartTask(
  rawTitle: string,
  defaultStatus = 'todo'
): { task: Task | null; hasSmartTokens: boolean; isDone: boolean } {
  const parsed = parseSmartTaskInput(rawTitle);
  if (parsed.isTitleEmpty) {
    return { task: null, hasSmartTokens: parsed.hasSmartTokens, isDone: false };
  }

  const finalStatus = parsed.status || defaultStatus;
  const isDone = finalStatus === 'done';
  const nowIso = new Date().toISOString();

  const task: Task = {
    id: 't_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7),
    title: parsed.cleanTitle,
    status: finalStatus,
    completedAt: isDone ? nowIso : undefined,
    estimatedMinutes: parsed.estimatedMinutes,
    isPinned: parsed.isPinned,
    reminderAt: parsed.reminderAt,
    recurrence: parsed.recurrence,
    subtasks: [],
    updatedAt: nowIso,
  };

  return { task, hasSmartTokens: parsed.hasSmartTokens, isDone };
}

/**
 * Tóm tắt ngắn các thuộc tính đã nhận diện (dùng cho toast) bằng ký hiệu trung lập ngôn ngữ,
 * VD: "~90m · 📌 · #doing · 🔔 17:00 27/10 · ↻ daily". Trả về '' nếu không có gì.
 */
export function summarizeSmartTask(task: Task): string {
  const parts: string[] = [];
  if (task.estimatedMinutes) parts.push(`~${task.estimatedMinutes}m`);
  if (task.isPinned) parts.push('📌');
  if (task.status && task.status !== 'todo') parts.push(`#${task.status}`);
  if (task.reminderAt) {
    const d = new Date(task.reminderAt);
    parts.push(`🔔 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${d.getDate()}/${d.getMonth() + 1}`);
  }
  if (task.recurrence) parts.push(`↻ ${task.recurrence}`);
  return parts.join(' · ');
}
