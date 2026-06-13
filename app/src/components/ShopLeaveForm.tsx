"use client"
import React, { useState } from "react"
import { useLangStore } from "../stores/langStore"
import { t } from "../lib/i18n"

type Props = {
  onSaved?: () => void
  leave?: {
    id: string
    leave_date: string
    leave_type: string
    reason?: string | null
    custom_description?: string | null
    notes?: string | null
  }
}

const LEAVE_TYPES = [
  { key: "Full Leave", icon: "🔴" },
  { key: "Half Day", icon: "🟡" },
  { key: "Festival Holiday", icon: "🎉" },
  { key: "Stock Unavailable", icon: "📦" },
  { key: "Transport Issue", icon: "🚌" },
  { key: "Emergency Closure", icon: "🚨" },
  { key: "Custom", icon: "✏️" },
]

const LEAVE_TYPE_KEYS: Record<string, string> = {
  "Full Leave": "leave.type.fullLeave",
  "Half Day": "leave.type.halfDay",
  "Festival Holiday": "leave.type.festivalHoliday",
  "Stock Unavailable": "leave.type.stockUnavailable",
  "Transport Issue": "leave.type.transportIssue",
  "Emergency Closure": "leave.type.emergencyClosure",
  "Custom": "leave.type.custom",
}

export default function ShopLeaveForm({ onSaved, leave }: Props) {
  const { lang } = useLangStore()
  const [leaveDate, setLeaveDate] = useState(leave?.leave_date ?? "")
  const [leaveType, setLeaveType] = useState(leave?.leave_type ?? LEAVE_TYPES[0].key)
  const [reason, setReason] = useState(leave?.reason ?? "")
  const [customDescription, setCustomDescription] = useState(leave?.custom_description ?? "")
  const [notes, setNotes] = useState(leave?.notes ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    if (!leaveDate) {
      setError(lang === 'ta' ? 'தேதியைத் தேர்ந்தெடுக்கவும்' : 'Please select a leave date')
      return
    }
    setLoading(true)
    try {
      const isEdit = !!leave
      const resp = await fetch("/api/shop_leaves", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEdit && { id: leave.id }),
          leave_date: leaveDate,
          leave_type: leaveType,
          reason: reason || null,
          custom_description: leaveType === "Custom" ? customDescription : null,
          notes: notes || null,
        }),
      })
      const txt = await resp.text()
      let json: any = null
      try { json = txt ? JSON.parse(txt) : null } catch { throw new Error(txt || "Failed to parse response") }
      if (!resp.ok) throw new Error(json?.error || `Failed to save (${resp.status})`)
      setLeaveDate("")
      setLeaveType(LEAVE_TYPES[0].key)
      setReason("")
      setCustomDescription("")
      setNotes("")
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      if (onSaved) onSaved()
    } catch (e: any) {
      setError(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Leave Type Chips */}
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={labelStyle}>{t(lang, 'leave.type')}</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.375rem' }}>
          {LEAVE_TYPES.map(lt => {
            const isSelected = leaveType === lt.key
            return (
              <button
                key={lt.key}
                type="button"
                onClick={() => setLeaveType(lt.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.25rem',
                  padding: '0.375rem 0.625rem', borderRadius: '20px',
                  border: `1.5px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: isSelected ? '#fff' : 'var(--color-text)',
                  fontSize: '0.7rem', fontWeight: isSelected ? 600 : 400,
                  cursor: 'pointer', transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <span>{lt.icon}</span>
                <span>{t(lang, LEAVE_TYPE_KEYS[lt.key])}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Date */}
      <div style={{ marginBottom: '0.625rem' }}>
        <label style={labelStyle}>{t(lang, 'leave.date')}</label>
        <input
          type="date"
          value={leaveDate}
          onChange={(e) => setLeaveDate(e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Reason */}
      <div style={{ marginBottom: '0.625rem' }}>
        <label style={labelStyle}>{t(lang, 'leave.reason')}</label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={lang === 'ta' ? 'காரணம் உள்ளிடவும்...' : 'Enter reason...'}
          style={inputStyle}
        />
      </div>

      {/* Custom Description */}
      {leaveType === "Custom" && (
        <div style={{ marginBottom: '0.625rem' }}>
          <label style={labelStyle}>{t(lang, 'leave.customDesc')}</label>
          <input
            type="text"
            value={customDescription}
            onChange={(e) => setCustomDescription(e.target.value)}
            style={inputStyle}
          />
        </div>
      )}

      {/* Notes */}
      <div style={{ marginBottom: '0.75rem' }}>
        <label style={labelStyle}>{t(lang, 'leave.notes')}</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: '0.5rem 0.75rem', borderRadius: '6px', marginBottom: '0.75rem',
          backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
          color: '#DC2626', fontSize: '0.75rem',
        }}>
          {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div style={{
          padding: '0.5rem 0.75rem', borderRadius: '6px', marginBottom: '0.75rem',
          backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0',
          color: '#166534', fontSize: '0.75rem',
        }}>
          {t(lang, 'leave.saved')}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        style={{
          padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none',
          backgroundColor: loading ? '#9CA3AF' : 'var(--color-primary)',
          color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: 600, fontSize: '0.8rem',
        }}
      >
        {loading ? t(lang, 'common.loading') : leave ? t(lang, 'common.update') : t(lang, 'common.save')}
      </button>
    </form>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.7rem', fontWeight: 500,
  color: 'var(--color-text-muted)', marginBottom: '0.15rem',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.5rem 0.625rem', borderRadius: '6px',
  border: '1px solid var(--color-border)', backgroundColor: 'var(--color-background)',
  color: 'var(--color-text)', fontSize: '0.8rem', boxSizing: 'border-box',
}
