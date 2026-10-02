import { useState, useCallback } from 'react';

export interface ViewPreferences {
  zenMode: boolean;               // Chế độ tối giản hoàn toàn
  showStatsPanel: boolean;        // Hiện/Ẩn bản đồ nhịp độ & thống kê
  showFocusButton: boolean;       // Hiện nút Focus Mode trên header
  showReminderButton: boolean;    // Hiện nút Reminder trên header
  showStreakBadge: boolean;       // Hiện huy hiệu Streak Flame
  showAddProjectBar: boolean;     // Hiện thanh Add Project ở đầu
  showFilterTabs: boolean;        // Hiện bộ lọc Tất cả / Đang làm / Đã xong
  showLanguageSwitcher: boolean;  // Hiện nút chuyển EN/VI trên header
}

const VIEW_PREFERENCES_KEY = 'stride_tasks_view_preferences_v1';

const DEFAULT_PREFERENCES: ViewPreferences = {
  zenMode: false,
  showStatsPanel: true,
  showFocusButton: true,
  showReminderButton: true,
  showStreakBadge: true,
  showAddProjectBar: true,
  showFilterTabs: true,
  showLanguageSwitcher: true,
};

export function useViewPreferences() {
  const [preferences, setPreferences] = useState<ViewPreferences>(() => {
    try {
      const stored = localStorage.getItem(VIEW_PREFERENCES_KEY);
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch (e) {}
    return DEFAULT_PREFERENCES;
  });

  const updatePreference = useCallback(<K extends keyof ViewPreferences>(key: K, value: ViewPreferences[K]) => {
    setPreferences((prev) => {
      const next = { ...prev, [key]: value };
      try {
        localStorage.setItem(VIEW_PREFERENCES_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }, []);

  const toggleZenMode = useCallback(() => {
    setPreferences((prev) => {
      const nextZen = !prev.zenMode;
      const next: ViewPreferences = {
        ...prev,
        zenMode: nextZen,
        // Khi bật Zen Mode: Tự động ẩn các thanh phụ trợ
        showStatsPanel: nextZen ? false : prev.showStatsPanel,
      };
      try {
        localStorage.setItem(VIEW_PREFERENCES_KEY, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences(DEFAULT_PREFERENCES);
    try {
      localStorage.setItem(VIEW_PREFERENCES_KEY, JSON.stringify(DEFAULT_PREFERENCES));
    } catch (e) {}
  }, []);

  return {
    preferences,
    updatePreference,
    toggleZenMode,
    resetPreferences,
  };
}
