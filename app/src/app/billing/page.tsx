'use client';

import React, { useEffect, useState } from 'react';
import { getInvoices, generateInvoices, deleteInvoice } from './actions';
import Link from 'next/link';
import { useLangStore } from '../../stores/langStore';
import { useToastStore } from '../../stores/toastStore';
import { useConfirmStore } from '../../stores/confirmStore';
import { t } from '../../lib/i18n';

export default function BillingPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const { lang } = useLangStore();
  const addToast = useToastStore(s => s.addToast);
  const showConfirm = useConfirmStore(s => s.showConfirm);

  const fetchInvoices = async () => {
    setLoading(true);
    const data = await getInvoices();
    setInvoices(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleGenerate = async () => {
    if (!await showConfirm(`${t(lang, 'bill.generateConfirm')} ${selectedMonth}?`)) return;
    setGenerating(true);
    try {
      const results = await generateInvoices(selectedMonth);
      const generated = results.filter(r => !r.skipped).length;
      const skipped = results.filter(r => r.skipped).length;
      addToast(`${t(lang, 'bill.generateDone')} ${generated} ${t(lang, 'bill.invoice')} ${skipped} ${t(lang, 'bill.generateSkipped')}`, 'success');
      fetchInvoices();
    } catch (e: any) {
      addToast(t(lang, 'bill.generateError') + (e.message || e), 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (await showConfirm(t(lang, 'bill.deleteConfirm'))) {
      await deleteInvoice(id);
      fetchInvoices();
    }
  };

  // Filter by month
  const filteredInvoices = invoices.filter(inv => inv.billing_month?.startsWith(selectedMonth));

  // Summary
  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const totalPaid = filteredInvoices.reduce((sum, inv) => sum + (inv.paid_amount || 0), 0);
  const totalOutstanding = filteredInvoices.reduce((sum, inv) => sum + (inv.outstanding_amount || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', gap: '0.5rem', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>{t(lang, 'bill.title')}</h1>
      </div>

      {/* Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'center' }}>
        <div style={{
          backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: '8px', padding: '0.5rem 0.625rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}>
          <label style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>{t(lang, 'bill.monthLabel')}</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            style={{
              padding: '0.25rem', borderRadius: '4px',
              border: '1px solid var(--color-border)', backgroundColor: 'var(--color-background)',
              color: 'var(--color-text)', fontSize: '0.7rem'
            }}
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          style={{
            padding: '0.5rem 0.75rem', backgroundColor: generating ? '#9CA3AF' : 'var(--color-primary)',
            color: '#fff', borderRadius: '6px', border: 'none', fontWeight: 600, cursor: generating ? 'not-allowed' : 'pointer',
            fontSize: '0.8rem',
          }}
        >
          {generating ? t(lang, 'bill.generating') : t(lang, 'bill.generate')}
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        {[
          { label: t(lang, 'bill.total'), value: totalAmount, color: 'var(--color-text)' },
          { label: t(lang, 'bill.paid'), value: totalPaid, color: '#2E7D32' },
          { label: t(lang, 'bill.owed'), value: totalOutstanding, color: '#E53935' },
        ].map(s => (
          <div key={s.label} style={{
            backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: '8px', padding: '0.375rem 0.625rem', flex: 1, minWidth: '80px',
          }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>{s.label}</div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: s.color }}>₹{s.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Invoice table */}
      <div style={{
        backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: '8px', padding: '0.75rem', overflowX: 'auto'
      }}>
        {loading ? (
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '1rem' }}>{t(lang, 'common.loading')}</p>
        ) : filteredInvoices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
              {t(lang, 'bill.noInvoices')}
            </p>
          </div>
        ) : (
          <div className="pkk-table-wrap" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                  <th style={thStyle}>{t(lang, 'bill.customer')}</th>
                  <th style={thStyle}>{t(lang, 'bill.month')}</th>
                  <th style={thStyle}>{t(lang, 'bill.total')}</th>
                  <th style={thStyle}>{t(lang, 'bill.paid')}</th>
                  <th style={thStyle}>{t(lang, 'bill.owed')}</th>
                  <th style={thStyle}>{t(lang, 'bill.status')}</th>
                  <th style={thStyle}>{t(lang, 'common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map(inv => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td data-label="Customer" style={{ ...tdStyle, fontWeight: 500 }}>
                      {inv.customers?.name || '-'}
                    </td>
                    <td data-label="Month" style={{ ...tdStyle, fontSize: '0.7rem' }}>
                      {new Date(inv.billing_month).toLocaleDateString('default', { month: 'short', year: 'numeric' })}
                    </td>
                    <td data-label="Total" style={{ ...tdStyle, fontWeight: 600 }}>₹{inv.total_amount?.toLocaleString()}</td>
                    <td data-label="Paid" style={{ ...tdStyle, color: '#2E7D32', fontSize: '0.7rem' }}>₹{inv.paid_amount?.toLocaleString()}</td>
                    <td data-label="Owed" style={{ ...tdStyle, color: '#E53935', fontWeight: 600, fontSize: '0.7rem' }}>₹{inv.outstanding_amount?.toLocaleString()}</td>
                    <td data-label="Status" style={tdStyle}>
                      <span style={{
                        padding: '0.15rem 0.375rem', borderRadius: '3px', fontSize: '0.6rem', fontWeight: 500,
                        backgroundColor: inv.status === 'Paid' ? '#dcfce7' : inv.status === 'Partially Paid' ? '#fef3c7' : '#fee2e2',
                        color: inv.status === 'Paid' ? '#166534' : inv.status === 'Partially Paid' ? '#92400e' : '#991b1b',
                      }}>
                        {inv.status}
                      </span>
                    </td>
                    <td data-label="" className="pkk-mobile-actions" style={tdStyle}>
                      <Link href={`/billing/${inv.id}`} style={{ ...actionBtnStyle, color: 'var(--color-primary)', textDecoration: 'none', fontSize: '0.75rem' }}>
                        {t(lang, 'bill.view')}
                      </Link>
                      <button onClick={() => handleDelete(inv.id)} style={{ ...actionBtnStyle, color: 'var(--color-no-supply)' }}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const thStyle = { padding: '0.5rem 0.625rem', color: 'var(--color-text-muted)', fontSize: '0.7rem', fontWeight: 500 };
const tdStyle = { padding: '0.5rem 0.625rem', color: 'var(--color-text)', fontSize: '0.75rem' };
const actionBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', padding: '0.15rem', fontSize: '0.75rem' };
