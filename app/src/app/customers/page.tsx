'use client';

import React, { useEffect, useState } from 'react';
import { getCustomers, deleteCustomer } from './actions';
import CustomerForm from '../../components/customers/CustomerForm';
import { useLangStore } from '../../stores/langStore';
import { useConfirmStore } from '../../stores/confirmStore';
import { t } from '../../lib/i18n';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { lang } = useLangStore();
  const showConfirm = useConfirmStore(s => s.showConfirm);

  const fetchCustomers = async () => {
    setLoading(true);
    const data = await getCustomers();
    setCustomers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleEdit = (c: any) => {
    setEditingCustomer(c);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (await showConfirm(t(lang, 'confirm.deleteCustomer'))) {
      await deleteCustomer(id);
      fetchCustomers();
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCustomer(null);
    fetchCustomers();
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone_number?.includes(searchTerm) ||
    c.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', gap: '0.5rem', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>{t(lang, 'cust.title')}</h1>
        <button 
          onClick={() => setIsFormOpen(true)}
          style={{
            padding: '0.5rem 0.75rem', backgroundColor: 'var(--color-primary)', color: '#fff',
            borderRadius: '6px', border: 'none', fontWeight: 500, cursor: 'pointer',
            fontSize: '0.8rem',
          }}
        >
          {t(lang, 'cust.add')}
        </button>
      </div>

      <div style={{
        backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: '8px', padding: '0.75rem',
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
        ) : filteredCustomers.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '1rem', fontSize: '0.8rem' }}>
            {t(lang, 'cust.noCustomers')}
          </p>
        ) : (
          <div className="pkk-table-wrap" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                  <th style={thStyle}>{t(lang, 'cust.name')}</th>
                  <th style={thStyle}>{t(lang, 'cust.category')}</th>
                  <th style={thStyle}>{t(lang, 'cust.phone')}</th>
                  <th style={thStyle}>{t(lang, 'cust.req')}</th>
                  <th style={thStyle}>{t(lang, 'common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td data-label="Name" style={tdStyle}>
                      <div style={{ fontWeight: 500, fontSize: '0.8rem' }}>{c.name}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{c.address}</div>
                    </td>
                    <td data-label="Category" style={tdStyle}>
                      <span style={{
                        padding: '0.15rem 0.375rem', borderRadius: '3px', fontSize: '0.65rem',
                        backgroundColor: 'var(--color-muted)', color: 'var(--color-text)'
                      }}>
                        {c.category}
                      </span>
                    </td>
                    <td data-label="Phone" style={{ ...tdStyle, fontSize: '0.75rem' }}>{c.phone_number || '-'}</td>
                    <td data-label="Requirement" style={{ ...tdStyle, fontSize: '0.75rem' }}>{c.daily_requirement || '-'}</td>
                    <td data-label="" className="pkk-mobile-actions" style={tdStyle}>
                      <button onClick={() => handleEdit(c)} style={actionBtnStyle}>✏️</button>
                      <button onClick={() => handleDelete(c.id)} style={{ ...actionBtnStyle, color: 'var(--color-no-supply)' }}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isFormOpen && (
        <CustomerForm customer={editingCustomer} onClose={handleCloseForm} />
      )}
    </div>
  );
}

const thStyle = { padding: '0.5rem 0.625rem', color: 'var(--color-text-muted)', fontSize: '0.7rem', fontWeight: 500 };
const tdStyle = { padding: '0.5rem 0.625rem', color: 'var(--color-text)', fontSize: '0.75rem' };
const actionBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', padding: '0.15rem' };
