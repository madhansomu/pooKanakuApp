'use client';

import { useConfirmStore } from '../stores/confirmStore';

export default function ConfirmDialog() {
  const { open, message, resolveConfirm } = useConfirmStore();

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={() => resolveConfirm(false)} />
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '24rem',
        backgroundColor: 'var(--color-surface)',
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        padding: '1.5rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      }}>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text)', lineHeight: 1.5 }}>
          {message}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
          <button
            onClick={() => resolveConfirm(false)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => resolveConfirm(true)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#dc2626',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
