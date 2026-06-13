'use client';

import React, { useEffect, useState } from 'react';
import { getPayments, deletePayment } from './actions';
import PaymentForm from '../../components/payments/PaymentForm';
import { useLangStore } from '../../stores/langStore';
import { useConfirmStore } from '../../stores/confirmStore';
import { t } from '../../lib/i18n';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { lang } = useLangStore();
  const showConfirm = useConfirmStore(s => s.showConfirm);

  const fetchPayments = async () => {
    setLoading(true);
    const data = await getPayments();
    setPayments(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleDelete = async (id: string) => {
    if (await showConfirm(t(lang, 'confirm.deletePayment'))) {
      await deletePayment(id);
      fetchPayments();
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    fetchPayments();
  };

  // Calculate totals
  const totalPayments = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', gap: '0.5rem', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>{t(lang, 'pay.title')}</h1>
        <button
          onClick={() => setIsFormOpen(true)}
          style={{
            padding: '0.5rem 0.75rem', backgroundColor: 'var(--color-primary)', color: '#fff',
            borderRadius: '6px', border: 'none', fontWeight: 500, cursor: 'pointer',
            fontSize: '0.8rem',
          }}
        >
          {t(lang, 'pay.record')}
        </button>
      </div>

      {/* Summary card */}
      <div style={{
        backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: '8px', padding: '0.5rem 0.75rem', marginBottom: '0.75rem',
        display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>{t(lang, 'pay.totalPayments')}</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#2E7D32' }}>₹{totalPayments.toLocaleString()}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>{t(lang, 'pay.count')}</div>
          <div style={{ fontSize: '1rem', fontWeight: 700 }}>{payments.length}</div>
        </div>
      </div>

      {/* Payments table */}
      <div style={{
        backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: '8px', padding: '0.75rem', overflowX: 'auto'
      }}>
        {loading ? (
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '1rem' }}>{t(lang, 'common.loading')}</p>
        ) : payments.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '1rem', fontSize: '0.8rem' }}>
            {t(lang, 'pay.noPayments')}
          </p>
        ) : (
          <div className="pkk-table-wrap" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                  <th style={thStyle}>{t(lang, 'pay.date')}</th>
                  <th style={thStyle}>{t(lang, 'pay.customer')}</th>
                  <th style={thStyle}>{t(lang, 'pay.amount')}</th>
                  <th style={thStyle}>{t(lang, 'pay.method')}</th>
                  <th style={thStyle}>{t(lang, 'pay.invoice')}</th>
                  <th style={thStyle}>{t(lang, 'common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td data-label="Date" style={{ ...tdStyle, fontWeight: 500 }}>
                      {new Date(p.payment_date).toLocaleDateString()}
                    </td>
                    <td data-label="Customer" style={tdStyle}>{p.customers?.name || '-'}</td>
                    <td data-label="Amount" style={{ ...tdStyle, fontWeight: 700, color: '#2E7D32' }}>
                      ₹{p.amount?.toLocaleString()}
                    </td>
                    <td data-label="Method" style={tdStyle}>
                      <span style={{
                        padding: '0.15rem 0.375rem', borderRadius: '3px', fontSize: '0.65rem',
                        backgroundColor: 'var(--color-muted)', color: 'var(--color-text)'
                      }}>
                        {p.payment_method || '-'}
                      </span>
                    </td>
                    <td data-label="Invoice" style={{ ...tdStyle, fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                      {p.invoices
                        ? new Date(p.invoices.billing_month).toLocaleDateString('default', { month: 'short', year: 'numeric' })
                        : '-'}
                    </td>
                    <td data-label="" className="pkk-mobile-actions" style={tdStyle}>
                      <button onClick={() => handleDelete(p.id)} style={{ ...actionBtnStyle, color: 'var(--color-no-supply)' }}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isFormOpen && (
        <PaymentForm onClose={handleCloseForm} />
      )}
    </div>
  );
}

const thStyle = { padding: '0.5rem 0.625rem', color: 'var(--color-text-muted)', fontSize: '0.7rem', fontWeight: 500 };
const tdStyle = { padding: '0.5rem 0.625rem', color: 'var(--color-text)', fontSize: '0.75rem' };
const actionBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', padding: '0.15rem' };
