'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getInvoiceById, getInvoicePDF } from '../actions';
import { useToastStore } from '../../../stores/toastStore';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.invoiceId as string;

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const addToast = useToastStore(s => s.addToast);

  useEffect(() => {
    async function load() {
      const data = await getInvoiceById(invoiceId);
      setInvoice(data);
      setLoading(false);
    }
    load();
  }, [invoiceId]);

  const handleDownloadPDF = async () => {
    setDownloadingPdf(true);
    try {
      const base64 = await getInvoicePDF(invoiceId);
      if (!base64) {
        addToast('Failed to generate PDF', 'error');
        return;
      }
      // Convert base64 to blob and trigger download
      const binaryStr = atob(base64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      addToast('Error generating PDF', 'error');
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) return <p>Loading invoice...</p>;
  if (!invoice) return <p>Invoice not found.</p>;

  const customer = invoice.customers;
  const items = invoice.invoice_items || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
            Invoice
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            {new Date(invoice.billing_month).toLocaleDateString('default', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleDownloadPDF} disabled={downloadingPdf} style={{
            ...btnStyle,
            backgroundColor: downloadingPdf ? '#9CA3AF' : 'var(--color-primary)',
            color: '#fff',
            border: 'none',
          }}>
            {downloadingPdf ? 'Generating...' : '📄 Download PDF'}
          </button>
          <button onClick={() => window.print()} style={btnStyle}>
            🖨️ Print
          </button>
          <button onClick={() => router.push('/billing')} style={btnStyle}>
            ← Back
          </button>
        </div>
      </div>

      {/* Invoice card */}
      <div className="pkk-invoice-card" style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        padding: '2rem',
        maxWidth: '800px',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '2px solid var(--color-border)' }}>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>🌺 PooKanakuApp</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Flower Ledger Pro</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              display: 'inline-block',
              padding: '0.375rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: 600,
              backgroundColor: invoice.status === 'Paid' ? '#dcfce7' : invoice.status === 'Partially Paid' ? '#fef3c7' : '#fee2e2',
              color: invoice.status === 'Paid' ? '#166534' : invoice.status === 'Partially Paid' ? '#92400e' : '#991b1b',
            }}>
              {invoice.status}
            </div>
          </div>
        </div>

        {/* Customer info + billing period */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          <div>
            <h3 style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Bill To</h3>
            <div style={{ fontWeight: 600, fontSize: '1rem' }}>{customer?.name}</div>
            {customer?.phone_number && <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{customer.phone_number}</div>}
            {customer?.address && <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{customer.address}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <h3 style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Billing Period</h3>
            <div style={{ fontWeight: 600 }}>
              {new Date(invoice.billing_month).toLocaleDateString('default', { month: 'long', year: 'numeric' })}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Invoice ID: {invoice.id.slice(0, 8)}...
            </div>
          </div>
        </div>

        {/* Line items table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
              <th style={thStyle}>Flower Type</th>
              <th style={thStyle}>Unit</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Quantity</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Rate</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any) => (
              <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={tdStyle}>{item.flower_types?.name || '-'}</td>
                <td style={tdStyle}>{item.flower_types?.unit || '-'}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{item.total_quantity?.toFixed(2)}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>₹{item.average_rate?.toFixed(2)}</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>₹{item.item_total?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '280px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.875rem' }}>
              <span>Total Amount</span>
              <span style={{ fontWeight: 600 }}>₹{invoice.total_amount?.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.875rem', color: '#2E7D32' }}>
              <span>Paid</span>
              <span style={{ fontWeight: 600 }}>₹{invoice.paid_amount?.toLocaleString()}</span>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0',
              borderTop: '2px solid var(--color-border)', marginTop: '0.25rem',
            }}>
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>Outstanding</span>
              <span style={{ fontWeight: 700, fontSize: '1.125rem', color: '#E53935' }}>₹{invoice.outstanding_amount?.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const thStyle = { padding: '0.75rem', color: 'var(--color-text-muted)', fontSize: '0.875rem', fontWeight: 500 };
const tdStyle = { padding: '0.75rem', color: 'var(--color-text)', fontSize: '0.875rem' };
const btnStyle = {
  padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', cursor: 'pointer',
  fontWeight: 500, fontSize: '0.875rem',
};
