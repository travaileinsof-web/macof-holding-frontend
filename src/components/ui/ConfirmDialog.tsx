import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  icon?: React.ReactNode;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  isDangerous = false,
  isLoading = false,
  onConfirm,
  onCancel,
  icon,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div className="bg-gradient-to-br from-[#1e293b] via-[#1a1f35] to-[#0f172a] border border-slate-700/50 rounded-2xl shadow-2xl max-w-md w-full backdrop-blur-sm">
        {/* Header with gradient accent */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#cda434]/10 via-transparent to-transparent" />
          <div className="relative px-6 py-6 flex items-start gap-4">
            <div className={`flex-shrink-0 rounded-full p-3 ${isDangerous ? 'bg-red-500/10' : 'bg-[#cda434]/10'}`}>
              {icon || (
                <AlertCircle className={`h-6 w-6 ${isDangerous ? 'text-red-400' : 'text-[#cda434]'}`} />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white">{title}</h2>
            </div>
            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-slate-700/0 via-slate-700/50 to-slate-700/0" />

        {/* Message */}
        <div className="px-6 py-5">
          <p className="text-slate-300 text-sm leading-relaxed">{message}</p>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-slate-700/0 via-slate-700/50 to-slate-700/0" />

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-300 bg-slate-700/50 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-slate-600/50 hover:border-slate-600"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed border ${
              isDangerous
                ? 'bg-red-600 hover:bg-red-700 border-red-500/50 hover:border-red-500 hover:shadow-lg hover:shadow-red-500/20'
                : 'bg-[#cda434] hover:bg-[#cda434]/90 text-black border-[#cda434]/50 hover:border-[#cda434] hover:shadow-lg hover:shadow-[#cda434]/20'
            }`}
          >
            {isLoading ? 'Chargement...' : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
