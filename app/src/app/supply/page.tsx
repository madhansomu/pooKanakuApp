'use client';

import React, { useEffect, useState } from 'react';
import { getSupplies, deleteSupply } from './actions';
import SupplyForm from '../../components/supply/SupplyForm';
import { useLangStore } from '../../stores/langStore';
import { t } from '../../lib/i18n';

export default function SupplyPage() {
  const [supplies, setSupplies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupply, setEditingSupply] = useState<any>(null);

  const { lang } = useLangStore();

  const fetchSupplies = async () => {
    setLoading(true);
    const data = await getSupplies();
    setSupplies(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSupplies();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm(t(lang, 'confirm.deleteSupply'))) {
      await deleteSupply(id);
      fetchSupplies();
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    fetchSupplies();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', gap: '0.5rem', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>{t(lang, 'supply.title')}</h1>
        <button 
          onClick={() => setIsFormOpen(true)}
          style={{
            padding: '0.5rem 0.75rem', backgroundColor: 'var(--color-primary)', color: '#fff',
            borderRadius: '6px', border: 'none', fontWeight: 500, cursor: 'pointer',
            fontSize: '0.8rem',
          }}
        >
          {t(lang, 'supply.add')}
        </button>
      </div>

      <div style={{
        backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: '8px', padding: '0.75rem', overflowX: 'auto'
      }}>
        {loading ? (
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '1rem' }}>{t(lang, 'common.loading')}</p>
        ) : supplies.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '1rem', fontSize: '0.8rem' }}>
            {t(lang, 'supply.noRecords')}
          </p>
        ) : (
          <div className="pkk-table-wrap" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                  <th style={thStyle}>{t(lang, 'supply.date')}</th>
                  <th style={thStyle}>{t(lang, 'supply.customer')}</th>
                  <th style={thStyle}>{t(lang, 'supply.flower')}</th>
                  <th style={thStyle}>{t(lang, 'supply.qtyRate')}</th>
                  <th style={thStyle}>{t(lang, 'supply.total')}</th>
                  <th style={thStyle}>{t(lang, 'common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {supplies.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td data-label="Date" style={{ ...tdStyle, fontWeight: 500 }}>
                      {new Date(s.supply_date).toLocaleDateString()}
                    </td>
                    <td data-label="Customer" style={tdStyle}>{s.customers?.name}</td>
                    <td data-label="Flower" style={tdStyle}>{s.flower_types?.name}</td>
                    <td data-label="Qty/Rate" style={{ ...tdStyle, fontSize: '0.7rem' }}>
                      {s.quantity} {s.flower_types?.unit} @ ₹{s.unit_rate}
                    </td>
                    <td data-label="Total" style={{ ...tdStyle, fontWeight: 700, color: 'var(--color-primary)' }}>
                      ₹{s.total_amount}
                    </td>
                    <td data-label="" className="pkk-mobile-actions" style={tdStyle}>
                      <button onClick={() => setEditingSupply(s)} style={actionBtnStyle}>✏️</button>
                      <button onClick={() => handleDelete(s.id)} style={{ ...actionBtnStyle, color: 'var(--color-no-supply)' }}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isFormOpen && (
        <SupplyForm onClose={handleCloseForm} />
      )}
      {editingSupply && (
        <SupplyForm supply={editingSupply} onClose={() => { setEditingSupply(null); fetchSupplies(); }} />
      )}
    </div>
  );
}

const thStyle = { padding: '0.5rem 0.625rem', color: 'var(--color-text-muted)', fontSize: '0.7rem', fontWeight: 500 };
const tdStyle = { padding: '0.5rem 0.625rem', color: 'var(--color-text)', fontSize: '0.75rem' };
const actionBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', padding: '0.15rem' };
