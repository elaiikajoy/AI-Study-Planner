import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, BookOpen, Clock, CalendarDays,
  Target, BarChart3, Settings, Bell, LogOut,
  BrainCircuit, Menu, X, Timer
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
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99, backdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '1.5rem 1.25rem 1rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 38, height: 38, borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--primary-500), hsl(268,70%,55%))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 15px var(--primary-glow)'
            }}>
              <BrainCircuit size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                StudyAI
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Smart Planner</div>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-500), var(--primary-500))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.9rem', fontWeight: 700, color: '#fff', flexShrink: 0
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                🔥 {user?.studyStreak || 0} day streak
              </div>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <div style={{ flex: 1, padding: '0.75rem 0.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
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
                background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                border: `1px solid ${isActive ? 'rgba(99,102,241,0.2)' : 'transparent'}`,
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              })}
              onMouseEnter={e => {
                const target = e.currentTarget
                if (!target.style.background.includes('rgba(99')) {
                  target.style.background = 'rgba(255,255,255,0.05)'
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
              <Icon size={17} />
              {label}
            </NavLink>
          ))}

          {/* Pomodoro Quick Access */}
          <NavLink
            to="/planner"
            state={{ openPomodoro: true }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.65rem 0.875rem', borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem', fontWeight: 400,
              color: 'var(--accent-400)',
              background: 'rgba(34,211,238,0.06)',
              border: '1px solid rgba(34,211,238,0.1)',
              textDecoration: 'none',
              marginTop: '0.25rem'
            }}
          >
            <Timer size={17} />
            Pomodoro Timer
          </NavLink>
        </div>

        {/* Bottom Actions */}
        <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
          <button
            id="sidebar-notifications-btn"
            className="btn btn-ghost w-full"
            style={{ justifyContent: 'flex-start', gap: '0.75rem', marginBottom: '0.5rem', fontSize: '0.875rem' }}
            onClick={() => navigate('/settings')}
          >
            <Bell size={17} />
            Notifications
          </button>
          <button
            id="sidebar-logout-btn"
            className="btn btn-ghost w-full"
            style={{ justifyContent: 'flex-start', gap: '0.75rem', fontSize: '0.875rem', color: 'var(--danger-400)' }}
            onClick={handleLogout}
          >
            <LogOut size={17} />
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {/* Mobile Header */}
        <div style={{
          display: 'none',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.875rem 1rem',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(8,10,18,0.9)',
          backdropFilter: 'blur(10px)',
          position: 'sticky', top: 0, zIndex: 90
        }} className="mobile-header">
          <button className="btn btn-ghost btn-icon" id="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BrainCircuit size={18} color="var(--primary-400)" />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem' }}>StudyAI</span>
          </div>
          <div style={{ width: 38 }} />
        </div>

        <Outlet />
      </main>

      <style>{`
        @media (max-width: 768px) { .mobile-header { display: flex !important; } }
      `}</style>
    </div>
  )
}
