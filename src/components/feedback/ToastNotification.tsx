import React from 'react';
import { Check } from 'lucide-react';

interface ToastNotificationProps {
  message: string | null;
  isVisible: boolean;
}

export function ToastNotification({ message, isVisible }: ToastNotificationProps) {
  if (!message || !isVisible) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1d1d1f] dark:bg-[#1f242d] text-white px-3.5 py-2 rounded-full shadow-2xl text-[11.5px] font-medium flex items-center gap-1.5 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-150 border border-white/10 dark:border-slate-700">
      <Check className="w-3.5 h-3.5 shrink-0 text-emerald-400" strokeWidth={2.25} aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
