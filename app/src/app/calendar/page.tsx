"use client";

import React, { Suspense, useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DateClickArg } from '@fullcalendar/interaction';
import { colorForLeave } from '../../lib/leaveColors';
import { useLangStore } from '../../stores/langStore';
import { t } from '../../lib/i18n';
import { getCustomers } from '../customers/actions';

type Customer = { id: string; name: string };
type Entry = { id: string; customer_id: string; entry_date: string; status: string; notes?: string | null };
type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  backgroundColor: string;
  borderColor?: string;
  extendedProps?: Partial<Entry> & { isLeave?: boolean; leave_type?: string; leave_date?: string; customerName?: string };
};
type ShopLeaveRow = {
  id: string;
  leave_date: string;
  leave_type: string;
  reason?: string | null;
  custom_description?: string | null;
  notes?: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  Delivered: '#16a34a',
  'Half Supply': '#f59e0b',
  'No Supply': '#ef4444',
  Holiday: '#6b7280',
};

const STATUS_BG: Record<string, string> = {
  Delivered: '#dcfce7',
  'Half Supply': '#fef3c7',
  'No Supply': '#fee2e2',
  Holiday: '#f3f4f6',
};

// Customer color palette — distinct colors for each customer
const CUSTOMER_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#0ea5e9',
  '#14b8a6', '#84cc16', '#f97316', '#06b6d4', '#a855f7',
  '#e11d48', '#0891b2', '#65a30d', '#d946ef', '#0284c7',
];

function getCustomerColor(customerId: string, customers: Customer[]): string {
  const idx = customers.findIndex(c => c.id === customerId);
  return CUSTOMER_COLORS[idx % CUSTOMER_COLORS.length];
}

function getCustomerName(customerId: string, customers: Customer[]): string {
  return customers.find(c => c.id === customerId)?.name || 'Unknown';
}

const LEGEND_ITEMS = [
  { labelKey: 'cal.delivered', color: '#16a34a' },
  { labelKey: 'cal.status.halfSupply', color: '#f59e0b' },
  { labelKey: 'cal.status.noSupply', color: '#ef4444' },
  { labelKey: 'cal.status.holiday', color: '#6b7280' },
  { labelKey: 'cal.leave', color: '#9CA3AF' },
];

export default function CalendarPageWrapper() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Loading calendar...</div>}>
      <CalendarPage />
    </Suspense>
  );
}

function CalendarPage() {
  const searchParams = useSearchParams();
  const initialCustomer = searchParams.get('customer') || '';
  const { lang } = useLangStore();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>(initialCustomer);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeEntry, setActiveEntry] = useState<Entry | null>(null);
  const [currentView, setCurrentView] = useState<string>('dayGridMonth');

  async function fetchCustomers() {
    const rows = await getCustomers();
    setCustomers(rows as Customer[]);
  }

  useEffect(() => { fetchCustomers(); }, []);

  const handleCustomerChange = useCallback((customerId: string) => {
    setSelectedCustomer(customerId);
    const url = new URL(window.location.href);
    if (customerId) {
      url.searchParams.set('customer', customerId);
    } else {
      url.searchParams.delete('customer');
    }
    window.history.replaceState({}, '', url.toString());
  }, []);

  const loadLeaves = useCallback(async (month?: string) => {
    try {
      const m = month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      const resp = await fetch(`/api/shop_leaves/report?month=${m}`);
      const txt = await resp.text();
      let json: { rows?: ShopLeaveRow[] } | null = null;
      try { json = txt ? JSON.parse(txt) : null; } catch { return; }
      const leaves = json?.rows || [];
      const leaveEvents: CalendarEvent[] = leaves.map((l) => ({
        id: `leave-${l.id}`,
        title: `🏖️ ${l.leave_type}`,
        start: l.leave_date,
        backgroundColor: colorForLeave(l.leave_type),
        borderColor: colorForLeave(l.leave_type),
        extendedProps: { ...l, isLeave: true },
      }));
      setEvents(prev => {
        const nonLeaves = prev.filter(e => !e.extendedProps?.isLeave);
        return [...nonLeaves, ...leaveEvents];
      });
    } catch { /* swallow */ }
  }, []);

  const fetchEntries = useCallback(async (customerId?: string) => {
    const params = new URLSearchParams();
    if (customerId) params.set('customer_id', customerId);
    const res = await fetch(`/api/calendar/entries?${params.toString()}`);
    const rows: Entry[] = await res.json();
    const entryEvents: CalendarEvent[] = rows.map(r => ({
      id: r.id,
      title: r.status,
      start: r.entry_date,
      backgroundColor: STATUS_COLORS[r.status] || '#6b7280',
      borderColor: STATUS_COLORS[r.status] || '#6b7280',
      extendedProps: { ...r, customerName: getCustomerName(r.customer_id, customers) },
    }));
    setEvents(prev => {
      const leaveEvents = prev.filter(e => e.extendedProps?.isLeave);
      return [...entryEvents, ...leaveEvents];
    });
  }, [customers]);

  useEffect(() => { fetchEntries(selectedCustomer || undefined); }, [selectedCustomer, fetchEntries]);
  useEffect(() => { loadLeaves(); }, [loadLeaves]);

  // Build date -> entries map for day cell coloring
  const dateStatusMap = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    events.filter(e => !e.extendedProps?.isLeave).forEach(e => {
      if (!map[e.start]) map[e.start] = {};
      const status = e.title;
      map[e.start][status] = (map[e.start][status] || 0) + 1;
    });
    return map;
  }, [events]);

  // Build date -> customer colors map for day cell dots
  const dateCustomerColors = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    events.filter(e => !e.extendedProps?.isLeave && e.extendedProps?.customer_id).forEach(e => {
      if (!map[e.start]) map[e.start] = new Set();
      map[e.start].add(getCustomerColor(e.extendedProps!.customer_id!, customers));
    });
    return map;
  }, [events, customers]);

  function handleDateClick(arg: DateClickArg) {
    const found = events.find(
      e => e.start === arg.dateStr && !e.extendedProps?.isLeave &&
        (!selectedCustomer || e.extendedProps?.customer_id === selectedCustomer)
    );
    setActiveEntry(
      found
        ? (found.extendedProps as Entry)
        : { id: '', customer_id: selectedCustomer || '', entry_date: arg.dateStr, status: 'Delivered', notes: '' }
    );
    setModalOpen(true);
  }

  async function saveEntry(entry: Entry | null) {
    if (!entry) return;
    await fetch('/api/calendar/upsert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    setModalOpen(false);
    fetchEntries(selectedCustomer || undefined);
    loadLeaves();
  }

  const entryEvents = events.filter(e => !e.extendedProps?.isLeave);
  const leaveEvents = events.filter(e => e.extendedProps?.isLeave);
  const summary = {
    delivered: entryEvents.filter(e => e.title === 'Delivered').length,
    half: entryEvents.filter(e => e.title === 'Half Supply').length,
    noSupply: entryEvents.filter(e => e.title === 'No Supply').length,
    holiday: entryEvents.filter(e => e.title === 'Holiday').length,
    leaves: leaveEvents.length,
  };

  return (
    <div>
      <style>{`
        .pkk-day-cell { position: relative; min-height: 3.5rem; }
        .pkk-day-bg { position: absolute; inset: 2px; border-radius: 4px; opacity: 0.18; pointer-events: none; }
        .pkk-day-dots { display: flex; gap: 3px; flex-wrap: wrap; margin-top: 2px; justify-content: center; }
        .pkk-day-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
        .pkk-event-chip { display: flex; align-items: center; gap: 3px; padding: 1px 4px; border-radius: 3px; font-size: 0.55rem; line-height: 1.3; margin-bottom: 1px; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
        .pkk-event-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
        .pkk-event-label { overflow: hidden; text-overflow: ellipsis; }
        .fc .fc-daygrid-day-number { font-size: 0.7rem; padding: 2px 6px; }
        .fc .fc-col-header-cell-cushion { font-size: 0.7rem; padding: 4px 0; }
        @media (max-width: 640px) {
          .pkk-day-cell { min-height: 2.5rem; }
          .pkk-event-chip { font-size: 0.5rem; padding: 0 3px; }
          .fc .fc-daygrid-day-number { font-size: 0.6rem; }
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', gap: '0.5rem', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>{t(lang, 'cal.title')}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select
            value={selectedCustomer}
            onChange={e => handleCustomerChange(e.target.value)}
            style={{
              padding: '0.375rem 0.5rem', borderRadius: '6px',
              border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)', fontSize: '0.75rem',
            }}
          >
            <option value="">{t(lang, 'cal.allCustomers')}</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
            {[
              { key: 'dayGridMonth', label: t(lang, 'cal.month') },
              { key: 'timeGridWeek', label: t(lang, 'cal.week') },
            ].map(v => (
              <button
                key={v.key}
                onClick={() => setCurrentView(v.key)}
                style={{
                  padding: '0.3rem 0.625rem', fontSize: '0.7rem', fontWeight: 500, border: 'none', cursor: 'pointer',
                  backgroundColor: currentView === v.key ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: currentView === v.key ? '#fff' : 'var(--color-text)',
                }}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary counts */}
      <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {[
          { label: t(lang, 'cal.delivered'), count: summary.delivered, color: '#16a34a' },
          { label: t(lang, 'cal.half'), count: summary.half, color: '#f59e0b' },
          { label: t(lang, 'cal.noSupply'), count: summary.noSupply, color: '#ef4444' },
          { label: t(lang, 'cal.holiday'), count: summary.holiday, color: '#6b7280' },
          { label: t(lang, 'cal.leave'), count: summary.leaves, color: '#9CA3AF' },
        ].map(s => (
          <div key={s.label} style={{
            display: 'flex', alignItems: 'center', gap: '0.25rem',
            padding: '0.25rem 0.5rem', borderRadius: '6px', whiteSpace: 'nowrap',
            backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)',
            fontSize: '0.65rem', flexShrink: 0,
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: s.color, flexShrink: 0 }} />
            <span style={{ color: 'var(--color-text-muted)' }}>{s.label}</span>
            <span style={{ fontWeight: 600 }}>{s.count}</span>
          </div>
        ))}
      </div>

      {/* Legend — status + customer colors */}
      <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', marginBottom: '0.5rem', alignItems: 'center' }}>
        {LEGEND_ITEMS.map(item => (
          <div key={item.labelKey} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.6rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: item.color, flexShrink: 0 }} />
            <span style={{ color: 'var(--color-text-muted)' }}>{t(lang, item.labelKey)}</span>
          </div>
        ))}
        {customers.length > 0 && (
          <>
            <span style={{ width: '1px', height: '12px', backgroundColor: 'var(--color-border)', margin: '0 0.25rem' }} />
            {customers.slice(0, 8).map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.6rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getCustomerColor(c.id, customers), flexShrink: 0 }} />
                <span style={{ color: 'var(--color-text-muted)' }}>{c.name}</span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Calendar */}
      <div style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '8px',
        padding: '0.5rem',
      }}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={currentView}
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek' }}
          views={{
            dayGridMonth: { type: 'dayGridMonth', buttonText: 'Month' },
            timeGridWeek: { type: 'timeGridWeek', buttonText: 'Week', allDaySlot: false },
          }}
          events={events}
          dateClick={handleDateClick}
          height={currentView === 'timeGridWeek' ? 500 : 580}
          slotMinTime="05:00:00"
          slotMaxTime="22:00:00"
          dayCellClassNames={(arg) => {
            const dateStr = arg.dateStr;
            const statuses = dateStatusMap[dateStr];
            if (!statuses) return '';
            // Pick dominant status (most entries)
            const dominant = Object.entries(statuses).sort((a, b) => b[1] - a[1])[0][0];
            const bgClass: Record<string, string> = {
              Delivered: 'pkk-cell-delivered',
              'Half Supply': 'pkk-cell-half',
              'No Supply': 'pkk-cell-nosupply',
              Holiday: 'pkk-cell-holiday',
            };
            return bgClass[dominant] || '';
          }}
          dayCellContent={(arg) => {
            const dateStr = arg.dateStr;
            const dayEvents = events.filter(e => e.start === dateStr && !e.extendedProps?.isLeave);
            const customerDots = dateCustomerColors[dateStr];
            if (dayEvents.length === 0 && !customerDots) return arg.dayNumberText;

            return (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                <span>{arg.dayNumberText}</span>
                {dayEvents.length > 0 && (
                  <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '1px' }}>
                    {dayEvents.slice(0, 4).map(e => {
                      const cid = e.extendedProps?.customer_id;
                      const dotColor = cid ? getCustomerColor(cid, customers) : STATUS_COLORS[e.title] || '#6b7280';
                      return (
                        <span
                          key={e.id}
                          title={`${getCustomerName(cid || '', customers)}: ${e.title}`}
                          style={{
                            width: '6px', height: '6px', borderRadius: '50%',
                            backgroundColor: dotColor, flexShrink: 0,
                          }}
                        />
                      );
                    })}
                    {dayEvents.length > 4 && (
                      <span style={{ fontSize: '0.45rem', color: 'var(--color-text-muted)' }}>+{dayEvents.length - 4}</span>
                    )}
                  </div>
                )}
              </div>
            );
          }}
          eventContent={(arg) => {
            const ep = arg.event.extendedProps as any;
            if (ep?.isLeave) {
              return (
                <div className="pkk-event-chip" style={{ backgroundColor: arg.event.backgroundColor, color: '#fff' }}>
                  <span>{arg.event.title}</span>
                </div>
              );
            }
            const cid = ep?.customer_id;
            const cName = ep?.customerName || getCustomerName(cid || '', customers);
            const dotColor = cid ? getCustomerColor(cid, customers) : '#fff';
            const statusColor = STATUS_COLORS[arg.event.title] || '#6b7280';
            return (
              <div className="pkk-event-chip" style={{ backgroundColor: statusColor, color: '#fff' }}>
                <span className="pkk-event-dot" style={{ backgroundColor: dotColor }} />
                <span className="pkk-event-label">{cName}</span>
              </div>
            );
          }}
        />
      </div>

      {/* Modal */}
      {modalOpen && activeEntry && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)' }} onClick={() => setModalOpen(false)} />
          <div style={{
            position: 'relative', width: '100%', maxWidth: '28rem',
            backgroundColor: 'var(--color-surface)', borderRadius: '12px 12px 0 0',
            padding: '1rem', boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
          }}>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>
              {t(lang, 'cal.editTitle')} — {activeEntry.entry_date}
            </h2>

            <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--color-text-muted)', marginBottom: '0.15rem' }}>{t(lang, 'cal.customer')}</label>
                <select
                  value={activeEntry.customer_id}
                  onChange={e => setActiveEntry({ ...activeEntry, customer_id: e.target.value })}
                  style={{ width: '100%', padding: '0.375rem', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-background)', color: 'var(--color-text)', fontSize: '0.8rem' }}
                >
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--color-text-muted)', marginBottom: '0.15rem' }}>{t(lang, 'cal.status')}</label>
                <select
                  value={activeEntry.status}
                  onChange={e => setActiveEntry({ ...activeEntry, status: e.target.value })}
                  style={{ width: '100%', padding: '0.375rem', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-background)', color: 'var(--color-text)', fontSize: '0.8rem' }}
                >
                   <option>{t(lang, 'cal.status.delivered')}</option>
                   <option>{t(lang, 'cal.status.halfSupply')}</option>
                   <option>{t(lang, 'cal.status.noSupply')}</option>
                   <option>{t(lang, 'cal.status.holiday')}</option>
                </select>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '0.65rem', color: 'var(--color-text-muted)', marginBottom: '0.15rem' }}>{t(lang, 'cal.notes')}</label>
                <textarea
                  value={activeEntry.notes ?? ''}
                  onChange={e => setActiveEntry({ ...activeEntry, notes: e.target.value })}
                  rows={2}
                  style={{ width: '100%', padding: '0.375rem', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-background)', color: 'var(--color-text)', fontSize: '0.8rem', resize: 'vertical' }}
                />
              </div>
            </div>

            <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                onClick={() => setModalOpen(false)}
                style={{ padding: '0.375rem 0.75rem', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', cursor: 'pointer', fontWeight: 500, fontSize: '0.8rem' }}
              >
                {t(lang, 'cal.cancel')}
              </button>
              <button
                onClick={() => saveEntry(activeEntry)}
                style={{ padding: '0.375rem 1rem', borderRadius: '6px', border: 'none', backgroundColor: 'var(--color-primary)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}
              >
                {t(lang, 'cal.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
