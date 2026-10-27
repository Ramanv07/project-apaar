import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'max-w-2xl'
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 transition-all"
      onClick={onClose}
    >
      <div
        className={`relative w-full ${maxWidth} bg-white dark:bg-[#16181d] rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xl transition-all my-8 overflow-hidden`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-[#121316]/50">
          <div>
            <h3 className="text-base font-bold text-zinc-950 dark:text-white font-display">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#1f2128] transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
