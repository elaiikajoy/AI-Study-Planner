import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme, THEME_OPTIONS, type ThemeMode } from '../context/ThemeContext'
import {
  LayoutDashboard, BookOpen, Clock, CalendarDays,
  Target, BarChart3, Settings, Bell, LogOut,
  BrainCircuit, Menu, X, Timer, ChevronDown, Flame
} from 'lucide-react'

const navItems = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/planner',      icon: BrainCircuit,    label: 'AI Planner' },
  { to: '/subjects',     icon: BookOpen,        label: 'Subjects' },
  { to: '/deadlines',    icon: Target,          label: 'Deadlines' },
  { to: '/availability', icon: Clock,           label: 'Availability' },
  { to: '/calendar',     icon: CalendarDays,    label: 'Calendar' },
  { to: '/progress',     icon: BarChart3,       label: 'Progress' },
  { to: '/settings',     icon: Settings,        label: 'Settings' },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false)
  const themeRef = useRef<HTMLDivElement>(null)

  const currentPage = navItems.find(item => item.to === location.pathname) || {
    label: 'Study Space',
    icon: BrainCircuit
  }
  const CurrentIcon = currentPage.icon

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setThemeDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const currentThemeObj = THEME_OPTIONS.find(t => t.id === theme) || THEME_OPTIONS[0]

  return (
    <div className="app-layout">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 99, backdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div style={{ padding: '1.4rem 1.25rem 1rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--primary-500), var(--purple-500))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px var(--primary-glow)'
              }}>
                <BrainCircuit size={22} color="#ffffff" />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  StudyAI
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>Smart Planner</div>
              </div>
            </div>
            {sidebarOpen && (
              <button className="btn btn-ghost btn-icon-sm" onClick={() => setSidebarOpen(false)} style={{ border: 'none' }}>
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* User Card Header */}
        <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-500), var(--primary-500))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.9rem', fontWeight: 700, color: '#ffffff', flexShrink: 0,
              boxShadow: '0 2px 8px var(--accent-glow)'
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Flame size={12} color="var(--warning-400)" />
                <span style={{ color: 'var(--warning-400)', fontWeight: 600 }}>{user?.studyStreak || 0}</span> day streak
              </div>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <div style={{ flex: 1, padding: '0.75rem 0.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.65rem 0.875rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--primary-400)' : 'var(--text-secondary)',
                background: isActive ? 'var(--primary-glow)' : 'transparent',
                border: `1px solid ${isActive ? 'var(--border-default)' : 'transparent'}`,
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              })}
              onMouseEnter={e => {
                const target = e.currentTarget
                if (!target.style.background.includes('var(--primary-glow)')) {
                  target.style.background = 'var(--glass-hover)'
                  target.style.color = 'var(--text-primary)'
                }
              }}
              onMouseLeave={e => {
                const target = e.currentTarget
                if (!target.getAttribute('aria-current')) {
                  target.style.background = 'transparent'
                  target.style.color = 'var(--text-secondary)'
                }
              }}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}

          {/* Quick Pomodoro Launcher Link */}
          <NavLink
            to="/planner"
            state={{ openPomodoro: true }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.65rem 0.875rem', borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem', fontWeight: 500,
              color: 'var(--accent-400)',
              background: 'var(--accent-glow)',
              border: '1px solid var(--accent-400)',
              textDecoration: 'none',
              marginTop: '0.5rem'
            }}
          >
            <Timer size={18} />
            Pomodoro Focus Mode
          </NavLink>
        </div>

        {/* Sidebar Footer Controls */}
        <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
          <button
            id="sidebar-logout-btn"
            className="btn btn-ghost w-full"
            style={{ justifyContent: 'flex-start', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--danger-400)' }}
            onClick={handleLogout}
          >
            <LogOut size={17} />
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content Workspace */}
      <main className="main-content">
        {/* Top Header Bar */}
        <header className="top-header">
          {/* Left: Mobile Menu Toggle & Page Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <button className="btn btn-ghost btn-icon mobile-menu-btn" onClick={() => setSidebarOpen(true)} style={{ display: 'none' }}>
              <Menu size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <CurrentIcon size={20} color="var(--primary-400)" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{currentPage.label}</h2>
            </div>
          </div>

          {/* Right: Actions (Theme Quick Switcher, Streak Badge, Notifications) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Theme Selector Pill & Dropdown */}
            <div style={{ position: 'relative' }} ref={themeRef}>
              <button
                id="header-theme-switcher"
                className="btn btn-ghost btn-sm"
                onClick={() => setThemeDropdownOpen(o => !o)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.4rem 0.75rem' }}
                title="Switch Theme"
              >
                <div style={{
                  width: 14, height: 14, borderRadius: '50%',
                  background: currentThemeObj.previewColors.primary,
                  boxShadow: `0 0 8px ${currentThemeObj.previewColors.primary}`
                }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{currentThemeObj.name}</span>
                <ChevronDown size={14} style={{ transform: themeDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              {/* Dropdown Menu */}
              {themeDropdownOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                  width: 220, background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.5rem', boxShadow: 'var(--shadow-lg)',
                  zIndex: 200, display: 'flex', flexDirection: 'column', gap: '4px'
                }}>
                  <div style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Select UI Theme
                  </div>
                  {THEME_OPTIONS.map(t => {
                    const isSelected = t.id === theme
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          setTheme(t.id as ThemeMode)
                          setThemeDropdownOpen(false)
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.65rem',
                          padding: '0.5rem 0.65rem', borderRadius: 'var(--radius-sm)',
                          border: isSelected ? '1px solid var(--primary-500)' : '1px solid transparent',
                          background: isSelected ? 'var(--primary-glow)' : 'transparent',
                          color: isSelected ? 'var(--primary-400)' : 'var(--text-primary)',
                          cursor: 'pointer', textAlign: 'left', width: '100%',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{
                          width: 16, height: 16, borderRadius: '50%',
                          background: t.previewColors.primary, flexShrink: 0,
                          boxShadow: `0 0 6px ${t.previewColors.primary}`
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{t.name}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Streak Badge */}
            <div className="badge badge-warning" style={{ padding: '0.35rem 0.75rem', gap: '0.35rem', cursor: 'pointer' }} onClick={() => navigate('/progress')}>
              <Flame size={14} color="var(--warning-400)" />
              <span style={{ fontWeight: 700 }}>{user?.studyStreak || 0}</span>
            </div>

            {/* Notification Button */}
            <button
              id="header-notification-btn"
              className="btn btn-ghost btn-icon-sm"
              onClick={() => navigate('/settings')}
              title="Settings & Notifications"
            >
              <Bell size={17} />
            </button>
          </div>
        </header>

        <Outlet />
      </main>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
