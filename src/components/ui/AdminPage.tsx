import React from 'react';
import { RefreshCw } from 'lucide-react';
import { createPortal } from 'react-dom';
/**
 * AdminPage — Wrapper stable avec blocage d'interactions et hauteur minimale garantie.
 */
export function AdminPage({
  loading,
  children,
  className = '',
}: {
  loading: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative min-h-[200px] ${className}`}>
      {loading && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-[#0f172a]/70 z-20 rounded-lg pointer-events-auto select-none"
          aria-busy="true"
        >
          <RefreshCw className="h-8 w-8 text-[#cda434] animate-spin" />
        </div>
      )}

      {/* Empêche les clics et le focus clavier sous l'overlay pendant le chargement */}
      <div 
        className={loading ? 'pointer-events-none select-none' : undefined}
        aria-hidden={loading || undefined}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * SaveButton — Bouton à structure DOM 100% fixe (icône + libellé).
 */
export function SaveButton({
  saving,
  onClick,
  label = 'Sauvegarder',
  savingLabel = 'Sauvegarde...',
  disabled,
  className = '',
  Icon,
}: {
  saving: boolean;
  onClick: () => void;
  label?: string;
  savingLabel?: string;
  disabled?: boolean;
  className?: string;
  Icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled ?? saving}
      className={`inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${className}`}
    >
      <span className="relative flex items-center justify-center h-4 w-4 shrink-0">
        {Icon && (
          <Icon
            className={`h-4 w-4 absolute transition-opacity duration-150 ${
              saving ? 'opacity-0' : 'opacity-100'
            }`}
          />
        )}
        <RefreshCw
          className={`h-4 w-4 absolute animate-spin transition-opacity duration-150 ${
            saving ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </span>
      <span>{saving ? savingLabel : label}</span>
    </button>
  );
}