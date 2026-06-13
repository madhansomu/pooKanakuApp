'use client';

import { useToastStore } from '../stores/toastStore';

const ICONS: Record<string, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

const BG_COLORS: Record<string, string> = {
  success: '#16a34a',
  error: '#dc2626',
  warning: '#f59e0b',
  info: '#2563eb',
};

export default function Toast() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '22rem' }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 0.875rem',
            borderRadius: '8px',
            backgroundColor: BG_COLORS[toast.type],
            color: '#fff',
            fontSize: '0.8rem',
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            animation: 'pkk-toast-in 0.25s ease-out',
            cursor: 'pointer',
          }}
          onClick={() => removeToast(toast.id)}
        >
          <span style={{ fontSize: '1rem', flexShrink: 0 }}>{ICONS[toast.type]}</span>
          <span style={{ flex: 1 }}>{toast.message}</span>
          <span style={{ opacity: 0.7, fontSize: '0.9rem' }}>✕</span>
        </div>
      ))}
      <style>{`
        @keyframes pkk-toast-in {
          from { opacity: 0; transform: translateY(-0.5rem); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
