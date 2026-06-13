'use client';

import React, { useEffect, useState } from 'react';
import { getExpenses, deleteExpense } from './actions';
import ExpenseForm from '../../components/expenses/ExpenseForm';
import { useLangStore } from '../../stores/langStore';
import { useConfirmStore } from '../../stores/confirmStore';
import { t } from '../../lib/i18n';

export default function ExpensesPage() {
  const { lang } = useLangStore();
  const showConfirm = useConfirmStore(s => s.showConfirm);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const fetchExpenses = async () => {
    setLoading(true);
    const data = await getExpenses();
    setExpenses(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleDelete = async (id: string) => {
    if (await showConfirm(t(lang, 'confirm.deleteExpense'))) {
      await deleteExpense(id);
      fetchExpenses();
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    fetchExpenses();
  };

  const filteredExpenses = expenses.filter(e => e.expense_date?.startsWith(selectedMonth));
  const monthlyTotal = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const categoryBreakdown = filteredExpenses.reduce((acc: Record<string, number>, e) => {
    const cat = e.category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + (e.amount || 0);
    return acc;
  }, {});

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', gap: '0.5rem', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>{t(lang, 'exp.title')}</h1>
        <button
          onClick={() => setIsFormOpen(true)}
          style={{
            padding: '0.5rem 0.75rem', backgroundColor: 'var(--color-primary)', color: '#fff',
            borderRadius: '6px', border: 'none', fontWeight: 500, cursor: 'pointer',
            fontSize: '0.8rem',
          }}
        >
          {t(lang, 'exp.add')}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <div style={{
          backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: '8px', padding: '0.5rem 0.625rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}>
          <label style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>{t(lang, 'common.monthLabel')}</label>
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

        <div style={{
          backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: '8px', padding: '0.5rem 0.625rem',
        }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>{t(lang, 'exp.monthlyTotal')}</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#F57C00' }}>₹{monthlyTotal.toLocaleString()}</div>
        </div>
      </div>

      {Object.keys(categoryBreakdown).length > 0 && (
        <div style={{
          backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: '8px', padding: '0.5rem 0.625rem', marginBottom: '0.75rem',
        }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>{t(lang, 'exp.byCategory')}</div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => (
              <span key={cat} style={{
                padding: '0.15rem 0.375rem', borderRadius: '3px', fontSize: '0.65rem',
                backgroundColor: 'var(--color-muted)', color: 'var(--color-text)',
              }}>
                {cat}: ₹{amount.toLocaleString()}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{
        backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: '8px', padding: '0.75rem', overflowX: 'auto'
      }}>
        {loading ? (
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '1rem' }}>{t(lang, 'common.loading')}</p>
        ) : filteredExpenses.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '1rem', fontSize: '0.8rem' }}>
            {t(lang, 'exp.noExpenses')}
          </p>
        ) : (
          <div className="pkk-table-wrap" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                  <th style={thStyle}>{t(lang, 'exp.date')}</th>
                  <th style={thStyle}>{t(lang, 'exp.category')}</th>
                  <th style={thStyle}>{t(lang, 'exp.description')}</th>
                  <th style={thStyle}>{t(lang, 'exp.amount')}</th>
                  <th style={thStyle}>{t(lang, 'common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td data-label="Date" style={{ ...tdStyle, fontWeight: 500 }}>
                      {new Date(e.expense_date).toLocaleDateString()}
                    </td>
                    <td data-label="Category" style={tdStyle}>
                      <span style={{
                        padding: '0.15rem 0.375rem', borderRadius: '3px', fontSize: '0.65rem',
                        backgroundColor: 'var(--color-muted)', color: 'var(--color-text)'
                      }}>
                        {e.category}
                      </span>
                    </td>
                    <td data-label="Description" style={{ ...tdStyle, color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>
                      {e.description || '-'}
                    </td>
                    <td data-label="Amount" style={{ ...tdStyle, fontWeight: 700, color: '#F57C00' }}>
                      ₹{e.amount?.toLocaleString()}
                    </td>
                    <td data-label="" className="pkk-mobile-actions" style={tdStyle}>
                      <button onClick={() => handleDelete(e.id)} style={{ ...actionBtnStyle, color: 'var(--color-no-supply)' }}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isFormOpen && (
        <ExpenseForm onClose={handleCloseForm} />
      )}
    </div>
  );
}

const thStyle = { padding: '0.5rem 0.625rem', color: 'var(--color-text-muted)', fontSize: '0.7rem', fontWeight: 500 };
const tdStyle = { padding: '0.5rem 0.625rem', color: 'var(--color-text)', fontSize: '0.75rem' };
const actionBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', padding: '0.15rem' };
