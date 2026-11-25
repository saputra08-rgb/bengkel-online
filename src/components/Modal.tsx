import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  printable?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  title,
  onClose,
  children,
  maxWidth = 'max-w-2xl',
  printable = false,
}) => {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-[#1b1714]/65 backdrop-blur-[2px] p-0 sm:p-4 ${
        printable ? 'print-only-modal' : 'no-print'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`w-full ${maxWidth} max-h-[88vh] sm:max-h-[90vh] overflow-y-auto bg-[#fffdfa] border border-[#e9e0d4] rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl ${
          printable ? 'print-only-card' : ''
        }`}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[#dfd5c7] sm:hidden no-print" />
        <div className="flex items-center justify-between gap-3 pb-3 mb-4 border-b border-[#e9e0d4] no-print">
          <h2 className="text-lg font-bold tracking-tight text-[#211f1c]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="w-9 h-9 rounded-lg bg-[#eee5d9] hover:bg-[#e2d6c5] text-[#342b23] flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
