"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { useLangStore } from "../../stores/langStore"
import { useAuthStore } from "../../stores/authStore"
import { useUIStore } from "../../stores/uiStore"
import { useToastStore } from "../../stores/toastStore"
import { useConfirmStore } from "../../stores/confirmStore"
import { t, type Lang } from "../../lib/i18n"
import { supabase } from "../../lib/supabase"
import { logoutAction } from "../login/actions"

export default function SettingsPage() {
  const router = useRouter()
  const { lang, setLang } = useLangStore()
  const { darkMode, toggleDarkMode } = useUIStore()
  const { user, initialized, loading } = useAuthStore()
  const addToast = useToastStore(s => s.addToast)
  const showConfirm = useConfirmStore(s => s.showConfirm)

  const handleLogout = async () => {
    const confirmed = await showConfirm(t(lang, 'settings.logoutConfirm'))
    if (!confirmed) return
    try {
      await supabase.auth.signOut()
      await logoutAction()
      addToast(t(lang, 'settings.loggedOut'), 'success')
      window.location.href = '/login'
    } catch {
      addToast(t(lang, 'settings.logoutError'), 'error')
    }
  }

  if (!loading && !initialized) {
    return (
      <div style={{ maxWidth: '480px', padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
        {t(lang, 'common.loading')}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '480px' }}>
      <h1 style={{ margin: '0 0 0.75rem', fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text)' }}>
        {t(lang, 'settings.title')}
      </h1>

      {/* Profile Section */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>{t(lang, 'settings.profile')}</h2>
        {loading ? (
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{t(lang, 'common.loading')}</p>
        ) : user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              backgroundColor: 'var(--color-primary)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.25rem', fontWeight: 700, flexShrink: 0,
            }}>
              {(user.full_name || user.email).charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)' }}>
                {user.full_name || 'Admin'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{user.email}</div>
              <div style={{
                display: 'inline-block', marginTop: '0.15rem', padding: '0.1rem 0.375rem',
                borderRadius: '4px', fontSize: '0.6rem', fontWeight: 500,
                backgroundColor: '#dcfce7', color: '#166534',
              }}>
                {user.role}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preferences */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>{t(lang, 'settings.preferences')}</h2>

        {/* Language */}
        <div style={rowStyle}>
          <div>
            <div style={rowLabelStyle}>{t(lang, 'settings.language')}</div>
          </div>
          <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
            {([['en', 'English'], ['ta', 'தமிழ்']] as [Lang, string][]).map(([code, label]) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                style={{
                  padding: '0.375rem 0.75rem', fontSize: '0.75rem', fontWeight: 500,
                  border: 'none', cursor: 'pointer',
                  backgroundColor: lang === code ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: lang === code ? '#fff' : 'var(--color-text)',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div style={rowStyle}>
          <div>
            <div style={rowLabelStyle}>{t(lang, 'settings.theme')}</div>
          </div>
          <button
            onClick={toggleDarkMode}
            style={{
              padding: '0.375rem 0.75rem', borderRadius: '6px',
              border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500,
            }}
          >
            {darkMode ? `🌙 ${t(lang, 'settings.themeDark')}` : `☀️ ${t(lang, 'settings.themeLight')}`}
          </button>
        </div>
      </div>

      {/* App Info */}
      <div style={sectionStyle}>
        <h2 style={sectionTitleStyle}>{t(lang, 'settings.appInfo')}</h2>
        <div style={rowStyle}>
          <div style={rowLabelStyle}>{t(lang, 'settings.version')}</div>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>1.0.0</span>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        style={{
          width: '100%', padding: '0.625rem', marginTop: '0.5rem',
          borderRadius: '8px', border: '1px solid #EF4444',
          backgroundColor: '#FEF2F2', color: '#DC2626',
          cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
        }}
      >
        {t(lang, 'settings.logout')}
      </button>
    </div>
  )
}

const sectionStyle: React.CSSProperties = {
  backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)',
  borderRadius: '8px', padding: '0.75rem', marginBottom: '0.75rem',
}

const sectionTitleStyle: React.CSSProperties = {
  margin: '0 0 0.625rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)',
}

const rowStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '0.5rem 0', borderTop: '1px solid var(--color-border)',
}

const rowLabelStyle: React.CSSProperties = {
  fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text)',
}
