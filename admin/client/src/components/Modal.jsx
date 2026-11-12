import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-xl',
  footer
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className={`relative w-full ${maxWidth} glass-panel rounded-window shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh]`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-separator/40 shrink-0">
          <h2 className="text-title text-label">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="btn-motion w-11 h-11 rounded-full flex items-center justify-center bg-surface-2 text-label-2 hover:text-label hover:bg-white/10"
            aria-label="Close dialog"
          >
            <X size={20} strokeWidth={1.75} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {/* Optional Footer */}
        {footer && (
          <div className="p-6 border-t border-separator/40 shrink-0 bg-surface/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
