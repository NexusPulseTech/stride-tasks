import { useState, useEffect, useCallback } from 'react';
import { StatusDefinition } from '../../../types';

export const DEFAULT_STATUSES: StatusDefinition[] = [
  { id: 'todo', label: 'Chờ', category: 'todo', color: '#64748b' },
  { id: 'doing', label: 'Đang làm', category: 'doing', color: '#2563eb' },
  { id: 'review', label: 'Đang duyệt', category: 'doing', color: '#d97706' },
  { id: 'testing', label: 'Kiểm thử', category: 'doing', color: '#8b5cf6' },
  { id: 'blocked', label: 'Bị nghẽn', category: 'doing', color: '#dc2626' },
  { id: 'paused', label: 'Tạm dừng', category: 'doing', color: '#ea580c' },
  { id: 'done', label: 'Đã xong', category: 'done', color: '#16a34a' },
];

export const STRIDE_CUSTOM_STATUSES_KEY = 'STRIDE_CUSTOM_STATUSES_V1';

export function useStatusManager() {
  const [statuses, setStatuses] = useState<StatusDefinition[]>(() => {
    try {
      const saved = localStorage.getItem(STRIDE_CUSTOM_STATUSES_KEY);
      if (saved) {
        const parsed: StatusDefinition[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Hợp nhất default + custom không trùng ID
          const customOnly = parsed.filter(
            (p) => p && p.id && !DEFAULT_STATUSES.some((d) => d.id === p.id)
          );
          return [...DEFAULT_STATUSES, ...customOnly];
        }
      }
    } catch (e) {
      console.warn('Failed to load custom statuses from localStorage', e);
    }
    return DEFAULT_STATUSES;
  });

  useEffect(() => {
    try {
      const customOnly = statuses.filter((s) => s.isCustom);
      localStorage.setItem(STRIDE_CUSTOM_STATUSES_KEY, JSON.stringify(customOnly));
    } catch (e) {
      console.warn('Failed to save custom statuses to localStorage', e);
    }
  }, [statuses]);

  const addCustomStatus = useCallback(
    (label: string, category: 'todo' | 'doing' | 'done', color: string): StatusDefinition | null => {
      const trimmed = label.trim();
      if (!trimmed) return null;

      const newStatus: StatusDefinition = {
        id: 'st_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
        label: trimmed,
        category,
        color,
        isCustom: true,
      };

      setStatuses((prev) => [...prev, newStatus]);
      return newStatus;
    },
    []
  );

  const deleteCustomStatus = useCallback((id: string) => {
    setStatuses((prev) => prev.filter((s) => s.id !== id || !s.isCustom));
  }, []);

  const getStatus = useCallback(
    (id?: string): StatusDefinition => {
      if (!id) return DEFAULT_STATUSES[0];
      const found = statuses.find((s) => s.id === id);
      if (found) return found;

      // Fallback nếu truyền chuỗi legacy hoặc không tồn tại
      if (id === 'done') return DEFAULT_STATUSES.find((s) => s.id === 'done') || DEFAULT_STATUSES[6];
      if (id === 'doing') return DEFAULT_STATUSES.find((s) => s.id === 'doing') || DEFAULT_STATUSES[1];
      if (id === 'review') return DEFAULT_STATUSES.find((s) => s.id === 'review') || DEFAULT_STATUSES[2];
      if (id === 'blocked') return DEFAULT_STATUSES.find((s) => s.id === 'blocked') || DEFAULT_STATUSES[4];
      return DEFAULT_STATUSES[0];
    },
    [statuses]
  );

  return {
    statuses,
    addCustomStatus,
    deleteCustomStatus,
    getStatus,
  };
}
