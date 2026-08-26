"use client";

import type { ReactNode } from "react";

export function Modal({
  onClose,
  width = 460,
  children,
}: {
  onClose: () => void;
  width?: number;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-10"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.16)] p-[22px] max-h-[80vh] overflow-auto"
        style={{ width }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalHeader({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="text-[15px] font-semibold">{title}</div>
      <button
        onClick={onClose}
        className="border-none bg-transparent p-1 flex text-ink-muted"
        aria-label="Cerrar"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
