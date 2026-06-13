'use client';

import React, { useEffect, useState } from 'react';
import { getFlowers, deleteFlower } from './actions';
import FlowerForm from '../../components/flowers/FlowerForm';
import { useLangStore } from '../../stores/langStore';
import { t } from '../../lib/i18n';

export default function FlowersPage() {
  const [flowers, setFlowers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFlower, setEditingFlower] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { lang } = useLangStore();

  const fetchFlowers = async () => {
    setLoading(true);
    const data = await getFlowers();
    setFlowers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchFlowers();
  }, []);

  const handleEdit = (f: any) => {
    setEditingFlower(f);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t(lang, 'confirm.deleteFlower'))) {
      await deleteFlower(id);
      fetchFlowers();
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingFlower(null);
    fetchFlowers();
  };

  const filteredFlowers = flowers.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.unit.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', gap: '0.5rem', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>{t(lang, 'flower.title')}</h1>
        <button 
          onClick={() => setIsFormOpen(true)}
          style={{
            padding: '0.5rem 0.75rem', backgroundColor: 'var(--color-primary)', color: '#fff',
            borderRadius: '6px', border: 'none', fontWeight: 500, cursor: 'pointer',
            fontSize: '0.8rem',
          }}
        >
          + {t(lang, 'flower.add')}
        </button>
      </div>

      <div style={{
        backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: '8px', padding: '0.75rem', overflowX: 'auto'
      }}>
        <div style={{ marginBottom: '0.5rem' }}>
          <input 
            type="text" 
            placeholder={t(lang, 'common.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '0.375rem 0.5rem', width: '100%', maxWidth: '250px',
              borderRadius: '6px', border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-background)', color: 'var(--color-text)',
              fontSize: '0.8rem',
            }}
          />
        </div>
        {loading ? (
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '1rem' }}>{t(lang, 'common.loading')}</p>
        ) : filteredFlowers.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '1rem', fontSize: '0.8rem' }}>
            {t(lang, 'flower.noFlowers')}
          </p>
        ) : (
          <div className="pkk-table-wrap" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                  <th style={thStyle}>{t(lang, 'flower.name')}</th>
                  <th style={thStyle}>{t(lang, 'flower.unit')}</th>
                  <th style={thStyle}>{t(lang, 'flower.rate')}</th>
                  <th style={thStyle}>{t(lang, 'flower.status')}</th>
                  <th style={thStyle}>{t(lang, 'common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredFlowers.map(f => (
                  <tr key={f.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td data-label="Flower" style={{ ...tdStyle, fontWeight: 500 }}>{f.name}</td>
                    <td data-label="Unit" style={tdStyle}>{f.unit}</td>
                    <td data-label="Rate" style={tdStyle}>₹{f.default_rate}</td>
                    <td data-label="Status" style={tdStyle}>
                      <span style={{
                        padding: '0.15rem 0.375rem', borderRadius: '3px', fontSize: '0.65rem',
                        backgroundColor: f.status === 'Active' ? '#dcfce7' : '#fee2e2',
                        color: f.status === 'Active' ? '#166534' : '#991b1b'
                      }}>
                        {f.status}
                      </span>
                    </td>
                    <td data-label="" className="pkk-mobile-actions" style={tdStyle}>
                      <button onClick={() => handleEdit(f)} style={actionBtnStyle}>✏️</button>
                      <button onClick={() => handleDelete(f.id)} style={{ ...actionBtnStyle, color: 'var(--color-no-supply)' }}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isFormOpen && (
        <FlowerForm flower={editingFlower} onClose={handleCloseForm} />
      )}
    </div>
  );
}

const thStyle = { padding: '0.5rem 0.625rem', color: 'var(--color-text-muted)', fontSize: '0.7rem', fontWeight: 500 };
const tdStyle = { padding: '0.5rem 0.625rem', color: 'var(--color-text)', fontSize: '0.75rem' };
const actionBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', padding: '0.15rem' };
