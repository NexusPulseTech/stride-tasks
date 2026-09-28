import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface Position {
  top: number;
  right: number;
}

interface PortalMenuProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  widthClass?: string;
}

/**
 * PORTAL MENU (Radix / Floating-UI Best Practice)
 * Renders floating dropdown menus directly into document.body via React Portal.
 * 
 * Solves:
 * 1. Stacking Context & Z-Index issues: Menu sits on top of all cards and headers (z-[9999]).
 * 2. Overflow Clipping: Bypasses any parent overflow-hidden or overflow-x-hidden.
 * 3. Auto-alignment: Positions menu accurately beneath trigger button and handles edge collisions.
 */
export function PortalMenu({
  isOpen,
  onClose,
  triggerRef,
  children,
  widthClass = 'w-44',
}: PortalMenuProps) {
  const [position, setPosition] = useState<Position>({ top: 0, right: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const updatePosition = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const margin = 6;
      
      // Calculate viewport coordinates
      let top = rect.bottom + margin;
      let right = window.innerWidth - rect.right;

      // Ensure menu doesn't overflow bottom of viewport
      const estimatedHeight = 220;
      if (top + estimatedHeight > window.innerHeight && rect.top - estimatedHeight > 0) {
        top = rect.top - estimatedHeight - margin;
      }

      // Ensure menu doesn't overflow left/right
      if (right < 8) right = 8;

      setPosition({ top, right });
    };

    updatePosition();

    // Listen for resize and scroll to reposition or close smoothly
    const handleScrollOrResize = () => {
      updatePosition();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        onClose();
      }
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, triggerRef, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        right: `${position.right}px`,
        zIndex: 99999,
      }}
      className={`${widthClass} bg-white dark:bg-[#1c212c] rounded-xl shadow-2xl border border-slate-200/90 dark:border-slate-700/80 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100 select-none text-slate-800 dark:text-slate-100`}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
}
