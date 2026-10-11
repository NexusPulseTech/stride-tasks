import React, { useState, useEffect } from 'react';
import { RotateCcw, X, ShieldAlert, ArrowRightLeft, Trash2 } from 'lucide-react';
import { Project } from '../../../types';
import { scanLegacyData, getSnapshotVault, countTotalTasks, isSampleTemplate } from '../../../utils/persistentStorage';

interface EmergencyRecoveryBannerProps {
  currentProjects: Project[];
  onRestore: (projects: Project[], label?: string) => void;
  onOpenBackupModal?: () => void;
  onClearSampleData?: () => void;
}

export function EmergencyRecoveryBanner({ currentProjects, onRestore, onOpenBackupModal, onClearSampleData }: EmergencyRecoveryBannerProps) {
  const [recoverableProjects, setRecoverableProjects] = useState<Project[] | null>(null);
  const [taskCount, setTaskCount] = useState<number>(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Khi danh sách hiện tại là mẫu template ban đầu
    if (isSampleTemplate(currentProjects)) {
      // 1. Thử tìm trong Snapshot Vault
      const vault = getSnapshotVault();
      for (const snap of vault) {
        if (!isSampleTemplate(snap.projects) && countTotalTasks(snap.projects) > 0) {
          setRecoverableProjects(snap.projects);
          setTaskCount(snap.taskCount || countTotalTasks(snap.projects));
          return;
        }
      }

      // 2. Thử tìm trong các key sao lưu cũ (legacy keys)
      const legacy = scanLegacyData();
      if (legacy && !isSampleTemplate(legacy) && countTotalTasks(legacy) > 0) {
        setRecoverableProjects(legacy);
        setTaskCount(countTotalTasks(legacy));
        return;
      }
    } else {
      setRecoverableProjects(null);
    }
  }, [currentProjects]);

  if (dismissed) return null;

  // Nếu tìm thấy bản lưu cũ của người dùng
  if (recoverableProjects && taskCount > 0) {
    return (
      <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-xl flex items-center justify-between gap-3 shadow-xs animate-in slide-in-from-top-2 duration-200">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 truncate">
              Phát hiện dữ liệu công việc cũ ({taskCount} việc)!
            </p>
            <p className="text-[11px] text-amber-700/90 dark:text-amber-400/90 truncate">
              Hệ thống tìm thấy bản sao lưu an toàn trước đó của bạn trên trình duyệt này.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onRestore(recoverableProjects, `Bản sao lưu ${taskCount} công việc`)}
            className="h-7.5 px-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs active:scale-[0.98]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Khôi phục ngay</span>
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="w-7.5 h-7.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-200/50 dark:hover:bg-amber-900/40 flex items-center justify-center cursor-pointer transition-colors"
            title="Bỏ qua"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Nếu đang hiển thị template mẫu (chưa có task thật hoặc vừa đổi domain)
  if (isSampleTemplate(currentProjects) && (onOpenBackupModal || onClearSampleData)) {
    return (
      <div className="mb-3 p-2.5 px-3 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl flex items-center justify-between gap-3 text-xs text-blue-900 dark:text-blue-200 animate-in fade-in duration-150 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-2 min-w-0">
          <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="truncate text-[11.5px]">
            Đang hiển thị mẫu ban đầu ({currentProjects.length} danh mục). Bạn có thể xóa mẫu để bắt đầu trang trắng hoặc lấy lại dữ liệu cũ.
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {onClearSampleData && (
            <button
              type="button"
              onClick={onClearSampleData}
              className="h-6.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/70 rounded text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
              title="Xóa toàn bộ các dự án & việc mẫu để bắt đầu không gian làm việc trống"
            >
              <Trash2 className="w-3 h-3 shrink-0" />
              <span>Xóa dữ liệu mẫu</span>
            </button>
          )}
          {onOpenBackupModal && (
            <button
              type="button"
              onClick={onOpenBackupModal}
              className="h-6.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Lấy lại dữ liệu cũ</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            title="Đóng"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
