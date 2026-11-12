import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

export default function Sheet({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
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
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Sheet Panel */}
      <div className="relative w-full max-w-lg h-full glass-panel flex flex-col z-10 shadow-2xl animate-in slide-in-from-right duration-250 ease-ios border-l border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-separator/40 shrink-0">
          <div>
            <h2 className="text-title text-label">{title}</h2>
            {description && <p className="text-subheadline text-label-2 mt-1">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-motion w-11 h-11 rounded-full flex items-center justify-center bg-surface-2 text-label-2 hover:text-label hover:bg-white/10"
            aria-label="Close sheet"
          >
            <X size={20} strokeWidth={1.75} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-6 border-t border-separator/40 shrink-0 bg-surface/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
