"use client"
import React, { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import ShopLeaveForm from "../../components/ShopLeaveForm"
import { useLangStore } from "../../stores/langStore"
import { t } from "../../lib/i18n"

type LeaveRow = {
  id: string
  leave_date: string
  leave_type: string
  reason?: string | null
  custom_description?: string | null
  notes?: string | null
}

const LEAVE_ICONS: Record<string, string> = {
  "Full Leave": "🔴",
  "Half Day": "🟡",
  "Festival Holiday": "🎉",
  "Stock Unavailable": "📦",
  "Transport Issue": "🚌",
  "Emergency Closure": "🚨",
  "Custom": "✏️",
}

export default function LeavesPage() {
  const router = useRouter()
  const { lang } = useLangStore()
  const [leaves, setLeaves] = useState<LeaveRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingLeave, setEditingLeave] = useState<LeaveRow | null>(null)

  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`

  const fetchLeaves = useCallback(async () => {
    setLoading(true)
    try {
      const resp = await fetch("/api/shop_leaves")
      const data: LeaveRow[] = await resp.json()
      const filtered = data.filter(l => l.leave_date.startsWith(currentMonth))
      setLeaves(filtered)
    } catch {
      setLeaves([])
    } finally {
      setLoading(false)
    }
  }, [currentMonth])

  useEffect(() => { fetchLeaves() }, [fetchLeaves])

  const handleDelete = async (id: string) => {
    if (!confirm(t(lang, 'common.confirm'))) return
    try {
      await fetch(`/api/shop_leaves?id=${id}`, { method: 'DELETE' })
      fetchLeaves()
    } catch { /* swallow */ }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', gap: '0.5rem', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>{t(lang, 'leave.title')}</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <a href="/reports/leaves" style={{
            padding: '0.375rem 0.625rem', borderRadius: '6px', border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)', color: 'var(--color-text)',
            textDecoration: 'none', fontSize: '0.75rem', fontWeight: 500,
          }}>
            {t(lang, 'nav.reports')}
          </a>
          <button
            onClick={() => { setShowForm(!showForm); setEditingLeave(null) }}
            style={{
              padding: '0.375rem 0.75rem', borderRadius: '6px', border: 'none',
              backgroundColor: 'var(--color-primary)', color: '#fff',
              fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer',
            }}
          >
            {showForm ? t(lang, 'common.cancel') : `+ ${t(lang, 'common.add')}`}
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{
          backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: '8px', padding: '0.75rem', marginBottom: '0.75rem', maxWidth: '500px',
        }}>
          <h2 style={{ margin: '0 0 0.625rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)' }}>
            {editingLeave ? t(lang, 'leave.editTitle') : t(lang, 'leave.addTitle')}
          </h2>
          <ShopLeaveForm
            leave={editingLeave ?? undefined}
            onSaved={() => { fetchLeaves(); setShowForm(false); setEditingLeave(null) }}
          />
        </div>
      )}

      {/* Leave List */}
      <div style={{
        backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)',
        borderRadius: '8px', padding: '0.75rem',
      }}>
        <h2 style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)' }}>
          {t(lang, 'leave.listTitle')}
        </h2>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
            {t(lang, 'common.loading')}
          </p>
        ) : leaves.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
            {t(lang, 'leave.noLeaves')}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {leaves.map(l => {
              const icon = LEAVE_ICONS[l.leave_type] || "📝"
              const typeKey = `leave.type.${l.leave_type === 'Full Leave' ? 'fullLeave' : l.leave_type === 'Half Day' ? 'halfDay' : l.leave_type === 'Festival Holiday' ? 'festivalHoliday' : l.leave_type === 'Stock Unavailable' ? 'stockUnavailable' : l.leave_type === 'Transport Issue' ? 'transportIssue' : l.leave_type === 'Emergency Closure' ? 'emergencyClosure' : 'custom'}`
              return (
                <div key={l.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.5rem 0.625rem', borderRadius: '8px',
                  border: '1px solid var(--color-border)', gap: '0.5rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: '1rem', flexShrink: 0 }}>{icon}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text)' }}>
                        {new Date(l.leave_date + 'T00:00:00').toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        <span style={{ color: 'var(--color-text-muted)', margin: '0 0.25rem' }}>·</span>
                        {t(lang, typeKey)}
                      </div>
                      {(l.reason || l.custom_description) && (
                        <div style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {l.reason || l.custom_description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                    <button
                      onClick={() => { setEditingLeave(l); setShowForm(true) }}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--color-primary)', padding: '0.15rem', fontSize: '0.75rem',
                      }}
                      title={t(lang, 'common.edit')}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(l.id)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--color-no-supply)', padding: '0.15rem', fontSize: '0.75rem',
                      }}
                      title={t(lang, 'common.delete')}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
