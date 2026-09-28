import React from 'react';
import { ConfirmDialog } from './ConfirmDialog';
import { BatchPasteModal } from './BatchPasteModal';
import { MobileAddModal } from './MobileAddModal';
import { MobileGuideModal } from './MobileGuideModal';
import { GuideModal } from './GuideModal';
import { BackupModal } from './BackupModal';
import { FeedbackModal } from './FeedbackModal';
import { Project, ConfirmDialogState, MobileGuideTab } from '../../../types';

export interface ModalsContainerProps {
  confirmDialog: ConfirmDialogState | null;
  onCloseConfirmDialog: () => void;
  batchPasteProject: Project | null;
  batchPasteText: string;
  onBatchPasteTextChange: (text: string) => void;
  onCloseBatchPaste: () => void;
  onExecuteBatchPaste: () => void;
  showMobileAddModal: boolean;
  projects: Project[];
  mobileSelectedProjId: string;
  onMobileSelectedProjIdChange: (id: string) => void;
  mobileTaskTitle: string;
  onMobileTaskTitleChange: (title: string) => void;
  mobileTaskPinned: boolean;
  onMobileTaskPinnedChange: (pinned: boolean) => void;
  onCloseMobileAddModal: () => void;
  onSubmitMobileTask: (e: React.FormEvent) => void;
  showMobileGuideModal: boolean;
  mobileGuideTab: MobileGuideTab;
  onMobileGuideTabChange: (tab: MobileGuideTab) => void;
  onCloseMobileGuideModal: () => void;
  showGuideModal: boolean;
  onCloseGuideModal: () => void;
  showBackupModal: boolean;
  onCloseBackupModal: () => void;
  onExportBackup: () => void;
  onTriggerImportBackup: () => void;
  onResetSampleBackup: () => void;
  showFeedbackModal: boolean;
  onCloseFeedbackModal: () => void;
  totalTasksCount: number;
  showToast: (msg: string) => void;
}

export function ModalsContainer({
  confirmDialog,
  onCloseConfirmDialog,
  batchPasteProject,
  batchPasteText,
  onBatchPasteTextChange,
  onCloseBatchPaste,
  onExecuteBatchPaste,
  showMobileAddModal,
  projects,
  mobileSelectedProjId,
  onMobileSelectedProjIdChange,
  mobileTaskTitle,
  onMobileTaskTitleChange,
  mobileTaskPinned,
  onMobileTaskPinnedChange,
  onCloseMobileAddModal,
  onSubmitMobileTask,
  showMobileGuideModal,
  mobileGuideTab,
  onMobileGuideTabChange,
  onCloseMobileGuideModal,
  showGuideModal,
  onCloseGuideModal,
  showBackupModal,
  onCloseBackupModal,
  onExportBackup,
  onTriggerImportBackup,
  onResetSampleBackup,
  showFeedbackModal,
  onCloseFeedbackModal,
  totalTasksCount,
  showToast,
}: ModalsContainerProps) {
  return (
    <>
      <ConfirmDialog confirmDialog={confirmDialog} onClose={onCloseConfirmDialog} />

      <BatchPasteModal
        batchPasteProject={batchPasteProject}
        batchPasteText={batchPasteText}
        onTextChange={onBatchPasteTextChange}
        onClose={onCloseBatchPaste}
        onExecute={onExecuteBatchPaste}
      />

      <MobileAddModal
        isOpen={showMobileAddModal}
        projects={projects}
        selectedProjId={mobileSelectedProjId}
        onSelectedProjIdChange={onMobileSelectedProjIdChange}
        taskTitle={mobileTaskTitle}
        onTaskTitleChange={onMobileTaskTitleChange}
        isPinned={mobileTaskPinned}
        onIsPinnedChange={onMobileTaskPinnedChange}
        onClose={onCloseMobileAddModal}
        onSubmit={onSubmitMobileTask}
      />

      <MobileGuideModal
        isOpen={showMobileGuideModal}
        activeTab={mobileGuideTab}
        onTabChange={onMobileGuideTabChange}
        onClose={onCloseMobileGuideModal}
      />

      <GuideModal isOpen={showGuideModal} onClose={onCloseGuideModal} />

      <BackupModal
        isOpen={showBackupModal}
        onClose={onCloseBackupModal}
        onExport={onExportBackup}
        onTriggerImport={onTriggerImportBackup}
        onResetSample={onResetSampleBackup}
      />

      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={onCloseFeedbackModal}
        projectsCount={projects.length}
        totalTasksCount={totalTasksCount}
        showToast={showToast}
      />
    </>
  );
}
