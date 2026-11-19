import type { Project } from '../../../types';
import type { ActionableItem } from './spacedSnooze';

export interface WorkloadBudget {
  estimatedMinutes: number;
  unestimatedCount: number;
  focusedMinutes: number;
  isOverloaded: boolean;
}

/** Ngưỡng tập trung thực tế mỗi ngày (6 giờ) */
export const DAILY_FOCUS_CAP_MINUTES = 360;

/**
 * Quỹ tải của hôm nay (B12 F08): cộng ước tính của đúng các việc đang ở Due Today, mỗi việc một lần (bước con tính
 * theo ước tính của việc cha), và phút Focus của hôm nay trong nhật ký tập trung. Trước đây cộng mọi việc chưa xong
 * ở mọi dự án (kể cả việc đang hoãn) và phút Focus cộng dồn của mọi việc, nên backlog lớn luôn báo quá tải.
 */
export function computeWorkloadBudget(projects: Project[], dueItems: ActionableItem[], focusTodayMinutes: number): WorkloadBudget {
  const estimates = new Map<string, number | undefined>();
  for (const p of projects) {
    for (const t of p.tasks) estimates.set(`${p.id}/${t.id}`, t.estimatedMinutes);
  }

  let estimatedMinutes = 0;
  let unestimatedCount = 0;
  const counted = new Set<string>();
  for (const item of dueItems) {
    const key = `${item.projectId}/${item.taskId}`;
    if (counted.has(key)) continue;
    counted.add(key);
    const est = estimates.get(key);
    if (est) estimatedMinutes += est;
    else unestimatedCount += 1;
  }

  return {
    estimatedMinutes,
    unestimatedCount,
    focusedMinutes: Math.max(0, Math.round(focusTodayMinutes || 0)),
    isOverloaded: estimatedMinutes > DAILY_FOCUS_CAP_MINUTES,
  };
}
