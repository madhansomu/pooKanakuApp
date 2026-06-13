'use client';

import React, { useState, useEffect } from 'react';
import { createSupply, updateSupply, getCustomersForDropdown, getFlowersForDropdown } from '../../app/supply/actions';

interface SupplyFormProps {
  onClose: () => void;
  supply?: any;
}

export default function SupplyForm({ onClose, supply }: SupplyFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customers, setCustomers] = useState<any[]>([]);
  const [flowers, setFlowers] = useState<any[]>([]);

  const [selectedFlowerId, setSelectedFlowerId] = useState('');
  const [unitRate, setUnitRate] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [totalAmount, setTotalAmount] = useState<number>(0);

  useEffect(() => {
    async function loadData() {
      const [c, f] = await Promise.all([getCustomersForDropdown(), getFlowersForDropdown()]);
      setCustomers(c);
      setFlowers(f);
      if (supply) {
        setSelectedFlowerId(supply.flower_type_id);
        setUnitRate(supply.unit_rate);
        setQuantity(supply.quantity);
      } else if (f.length > 0) {
        setSelectedFlowerId(f[0].id);
        setUnitRate(f[0].default_rate);
      }
    }
    loadData();
  }, [supply]);

  useEffect(() => {
    setTotalAmount(quantity * unitRate);
  }, [quantity, unitRate]);

  const handleFlowerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedFlowerId(id);
    const flower = flowers.find(f => f.id === id);
    if (flower) {
      setUnitRate(flower.default_rate);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = supply
      ? await updateSupply(supply.id, formData)
      : await createSupply(formData);

    if (result.success) {
      onClose();
    } else {
      setError(result.error || 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'var(--color-surface)',
        borderRadius: '12px',
        padding: '2rem',
        width: '100%',
        maxWidth: '400px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 1.5rem', color: 'var(--color-text)' }}>
          {supply ? 'Edit Supply' : 'Record Daily Supply'}
        </h2>

        {error && (
          <div style={{ color: 'red', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#fee2e2', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Date *</label>
            <input name="supply_date" type="date" required defaultValue={supply?.supply_date ?? new Date().toISOString().split('T')[0]} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Customer *</label>
            <select name="customer_id" defaultValue={supply?.customer_id} required style={inputStyle}>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Flower Type *</label>
            <select name="flower_type_id" value={selectedFlowerId} onChange={handleFlowerChange} required style={inputStyle}>
              {flowers.map(f => <option key={f.id} value={f.id}>{f.name} ({f.unit})</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Quantity *</label>
              <input name="quantity" type="number" step="0.01" value={quantity} onChange={e => setQuantity(parseFloat(e.target.value) || 0)} required style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Unit Rate (₹) *</label>
              <input name="unit_rate" type="number" step="0.01" value={unitRate} onChange={e => setUnitRate(parseFloat(e.target.value) || 0)} required style={inputStyle} />
            </div>
          </div>

          <div style={{
            padding: '1rem',
            backgroundColor: 'var(--color-muted)',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '0.5rem'
          }}>
            <span style={{ fontWeight: 500, color: 'var(--color-text-muted)' }}>Total Amount:</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>₹{totalAmount.toFixed(2)}</span>
          </div>

          <div>
            <label style={labelStyle}>Remarks</label>
            <input name="remarks" defaultValue={supply?.remarks ?? ''} style={inputStyle} placeholder="Optional notes" />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={onClose} style={btnStyle('var(--color-muted)', 'var(--color-text)')}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={btnStyle('var(--color-primary)', '#fff')}>
              {loading ? 'Saving...' : supply ? 'Update Record' : 'Save Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 };
const inputStyle = {
  width: '100%', padding: '0.5rem', borderRadius: '6px',
  border: '1px solid var(--color-border)', backgroundColor: 'var(--color-background)',
  color: 'var(--color-text)'
};
const btnStyle = (bg: string, color: string) => ({
  padding: '0.5rem 1rem', borderRadius: '6px', border: 'none',
  backgroundColor: bg, color: color, cursor: 'pointer', fontWeight: 500
});
