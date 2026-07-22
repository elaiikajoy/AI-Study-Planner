import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme, THEME_OPTIONS, type ThemeMode } from '../context/ThemeContext'
import api from '../utils/api'
import { Settings, Save, User, Bell, Timer, Palette, Check } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { user, updateUser } = useAuth()
  const { theme, setTheme } = useTheme()

  const [form, setForm] = useState({
    name: user?.name || '',
    pomodoroFocusMinutes: user?.settings.pomodoroFocusMinutes || 25,
    pomodoroShortBreak: user?.settings.pomodoroShortBreak || 5,
    pomodoroLongBreak: user?.settings.pomodoroLongBreak || 15,
    dailyStudyLimitHours: user?.settings.dailyStudyLimitHours || 6,
    notificationsEnabled: user?.settings.notificationsEnabled ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)

  const saveProfile = async () => {
    setSavingProfile(true)
    try {
      const { data } = await api.put('/auth/profile', { name: form.name })
      updateUser({ name: data.user.name })
      toast.success('Profile updated!')
    } catch { toast.error('Failed to update profile') }
    finally { setSavingProfile(false) }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const settings = {
        pomodoroFocusMinutes: form.pomodoroFocusMinutes,
        pomodoroShortBreak: form.pomodoroShortBreak,
        pomodoroLongBreak: form.pomodoroLongBreak,
        dailyStudyLimitHours: form.dailyStudyLimitHours,
        notificationsEnabled: form.notificationsEnabled,
      }
      const { data } = await api.put('/settings', settings)
      updateUser({ settings: { ...user!.settings, ...data } })
      toast.success('Settings saved!')
    } catch { toast.error('Failed to save settings') }
    finally { setSaving(false) }
  }

  const SectionCard = ({ title, icon: Icon, iconColor, children }: any) => (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <Icon size={19} color={iconColor} />
        <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{title}</h2>
      </div>
      {children}
    </div>
  )

  const NumberInput = ({ id, label, min, max, value, onChange, suffix }: any) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input id={id} type="number" className="form-input" min={min} max={max} value={value} onChange={onChange} style={{ maxWidth: 100 }} />
        {suffix && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{suffix}</span>}
      </div>
    </div>
  )

  return (
    <div>
      <div className="page-header" style={{ paddingBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.6rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Settings size={24} color="var(--primary-400)" /> Settings & Themes
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
          Personalize your study aesthetic, timer preferences, and account goals
        </p>
      </div>

      <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 840 }}>
        {/* Theme Engine Visual Selector */}
        <SectionCard title="Visual Theme Engine" icon={Palette} iconColor="var(--accent-400)">
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Choose a visual design theme for your study workspace. Changes apply instantly across all components.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {THEME_OPTIONS.map((t) => {
              const isSelected = theme === t.id
              return (
                <div
                  key={t.id}
                  onClick={() => setTheme(t.id as ThemeMode)}
                  style={{
                    border: `2px solid ${isSelected ? 'var(--primary-500)' : 'var(--border-default)'}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: '1rem',
                    background: isSelected ? 'var(--primary-glow)' : 'var(--bg-elevated)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    boxShadow: isSelected ? 'var(--shadow-glow-primary)' : 'none'
                  }}
                >
                  {/* Selected Badge */}
                  {isSelected && (
                    <div style={{
                      position: 'absolute', top: 10, right: 10,
                      width: 22, height: 22, borderRadius: '50%',
                      background: 'var(--primary-500)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', color: '#fff'
                    }}>
                      <Check size={14} />
                    </div>
                  )}

                  {/* Visual Color Palette Preview Bar */}
                  <div style={{ display: 'flex', height: 44, borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '0.85rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ flex: 2, background: t.previewColors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#fff', fontWeight: 600 }}>BG</div>
                    <div style={{ flex: 2, background: t.previewColors.card, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#fff', fontWeight: 600 }}>Card</div>
                    <div style={{ flex: 1.5, background: t.previewColors.primary }} />
                    <div style={{ flex: 1.5, background: t.previewColors.accent }} />
                  </div>

                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                    {t.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    {t.description}
                  </div>
                </div>
              )
            })}
          </div>
        </SectionCard>

        {/* Profile */}
        <SectionCard title="Profile" icon={User} iconColor="var(--primary-400)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-500), var(--primary-500))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 700, color: '#fff', boxShadow: '0 4px 14px var(--accent-glow)' }}>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{user?.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user?.email}</div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Display Name</label>
              <input id="settings-name-input" className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" />
            </div>
            <button id="save-profile-btn" className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={saveProfile} disabled={savingProfile}>
              {savingProfile ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving...</> : <><Save size={14} /> Save Profile</>}
            </button>
          </div>
        </SectionCard>

        {/* Pomodoro */}
        <SectionCard title="Pomodoro Timer" icon={Timer} iconColor="var(--danger-400)">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
            <NumberInput id="focus-duration" label="Focus Duration" min={5} max={90} value={form.pomodoroFocusMinutes} onChange={(e: any) => setForm(f => ({ ...f, pomodoroFocusMinutes: +e.target.value }))} suffix="min" />
            <NumberInput id="short-break-duration" label="Short Break" min={1} max={30} value={form.pomodoroShortBreak} onChange={(e: any) => setForm(f => ({ ...f, pomodoroShortBreak: +e.target.value }))} suffix="min" />
            <NumberInput id="long-break-duration" label="Long Break" min={5} max={60} value={form.pomodoroLongBreak} onChange={(e: any) => setForm(f => ({ ...f, pomodoroLongBreak: +e.target.value }))} suffix="min" />
          </div>
          <button id="save-timer-settings-btn" className="btn btn-primary btn-sm" onClick={saveSettings} disabled={saving}>
            {saving ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving...</> : <><Save size={14} /> Save Timer</>}
          </button>
        </SectionCard>

        {/* Study Goals */}
        <SectionCard title="Study Goals" icon={Settings} iconColor="var(--success-400)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <NumberInput id="daily-limit" label="Daily Study Limit" min={1} max={16} value={form.dailyStudyLimitHours} onChange={(e: any) => setForm(f => ({ ...f, dailyStudyLimitHours: +e.target.value }))} suffix="hours/day" />
            <button id="save-goals-btn" className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={saveSettings} disabled={saving}>
              {saving ? 'Saving...' : <><Save size={14} /> Save Goals</>}
            </button>
          </div>
        </SectionCard>

        {/* Notifications */}
        <SectionCard title="Notifications" icon={Bell} iconColor="var(--warning-400)">
          <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
            <div style={{ position: 'relative', width: 44, height: 24 }}>
              <input
                id="notifications-toggle"
                type="checkbox"
                checked={form.notificationsEnabled}
                onChange={e => setForm(f => ({ ...f, notificationsEnabled: e.target.checked }))}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <div
                onClick={() => setForm(f => ({ ...f, notificationsEnabled: !f.notificationsEnabled }))}
                style={{
                  position: 'absolute', inset: 0, borderRadius: 12,
                  background: form.notificationsEnabled ? 'var(--primary-500)' : 'var(--border-default)',
                  cursor: 'pointer', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center',
                  padding: '0 3px',
                  justifyContent: form.notificationsEnabled ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Enable Notifications</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Receive reminders for upcoming deadlines and study sessions</div>
            </div>
          </label>
          <button id="save-notifications-btn" className="btn btn-primary btn-sm mt-3" style={{ alignSelf: 'flex-start' }} onClick={saveSettings} disabled={saving}>
            {saving ? 'Saving...' : <><Save size={14} /> Save Notifications</>}
          </button>
        </SectionCard>
      </div>
    </div>
  )
}
