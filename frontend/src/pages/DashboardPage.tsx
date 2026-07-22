import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import { format, parseISO } from 'date-fns'
import {
  Flame, Clock, CheckCircle2, Target, BookOpen,
  BrainCircuit, ChevronRight, AlertTriangle, TrendingUp, Zap, Timer
} from 'lucide-react'
import toast from 'react-hot-toast'

interface StudyPlan {
  _id: string
  subject: { name: string; color: string; icon: string }
  deadline?: { title: string; dueDate: string }
  date: string
  startTime: string
  endTime: string
  durationMinutes: number
  status: string
  notes: string
}

interface Deadline {
  _id: string
  title: string
  subject: { name: string; color: string }
  dueDate: string
  priority: string
  type: string
  status: string
}

interface ProgressSummary {
  streak: number
  totalStudyHours: number
  today: { minutes: number; sessions: number }
  week: { minutes: number; sessions: number }
  deadlines: { completed: number; total: number; overdue: number }
  completionRate: number
}

const priorityColors: Record<string, string> = {
  low: 'var(--text-muted)', medium: 'var(--warning-400)',
  high: 'var(--danger-400)', critical: 'hsl(351,94%,68%)'
}

const daysUntil = (dateStr: string) => {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [todayPlan, setTodayPlan] = useState<StudyPlan[]>([])
  const [upcoming, setUpcoming] = useState<Deadline[]>([])
  const [summary, setSummary] = useState<ProgressSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  useEffect(() => {
    const load = async () => {
      try {
        const [planRes, dlRes, progRes] = await Promise.all([
          api.get(`/planner/schedule?date=${todayStr}`),
          api.get('/deadlines?upcoming=true'),
          api.get('/progress/summary')
        ])
        setTodayPlan(planRes.data)
        setUpcoming(dlRes.data.slice(0, 5))
        setSummary(progRes.data)
      } catch {
        toast.error('Could not load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleComplete = async (planId: string) => {
    try {
      await api.patch(`/planner/schedule/${planId}/complete`, { pomodorosCompleted: 0 })
      setTodayPlan(prev => prev.map(p => p._id === planId ? { ...p, status: 'completed' } : p))
      toast.success('Session completed! 🎉')
    } catch { toast.error('Failed to mark complete') }
  }

  if (loading) return (
    <div className="loading-screen" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <div className="spinner" />
    </div>
  )

  const hoursToday = Math.round((summary?.today.minutes || 0) / 60 * 10) / 10
  const dailyGoalMins = (user?.settings.dailyStudyLimitHours || 6) * 60
  const progressPct = Math.min(100, Math.round(((summary?.today.minutes || 0) / dailyGoalMins) * 100))

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ paddingBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.2rem' }}>{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <button id="dashboard-regenerate-btn" className="btn btn-primary btn-sm" onClick={async () => {
            const t = toast.loading('Regenerating schedule...')
            try { await api.post('/planner/regenerate'); toast.success('Schedule updated!', { id: t }); window.location.reload() }
            catch { toast.error('Failed to regenerate', { id: t }) }
          }}>
            <Zap size={15} /> Regenerate Plan
          </button>
        </div>
      </div>

      <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {/* Stats Row */}
        <div className="grid-4">
          {[
            { icon: Flame, label: 'Study Streak', value: `${user?.studyStreak || 0}`, unit: 'days', color: 'var(--warning-400)', bg: 'rgba(251,191,36,0.1)' },
            { icon: Clock, label: "Today's Study", value: hoursToday.toString(), unit: 'hours', color: 'var(--primary-400)', bg: 'rgba(99,102,241,0.1)' },
            { icon: TrendingUp, label: 'This Week', value: Math.round((summary?.week.minutes || 0) / 60 * 10) / 10 + '', unit: 'hours', color: 'var(--accent-400)', bg: 'rgba(34,211,238,0.1)' },
            { icon: CheckCircle2, label: 'Completion Rate', value: `${summary?.completionRate || 0}`, unit: '%', color: 'var(--success-400)', bg: 'rgba(52,211,153,0.1)' },
          ].map(({ icon: Icon, label, value, unit, color, bg }) => (
            <div key={label} className="stat-card">
              <div className="stat-icon" style={{ background: bg }}>
                <Icon size={18} color={color} />
              </div>
              <div className="stat-value" style={{ color }}>{value}<span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400 }}> {unit}</span></div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>

        {/* Daily Progress Bar */}
        <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Target size={16} color="var(--primary-400)" />
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Daily Study Goal</span>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{hoursToday}h / {user?.settings.dailyStudyLimitHours || 6}h</span>
          </div>
          <div className="progress-bar" style={{ height: 8 }}>
            <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {progressPct >= 100 ? '🎉 Daily goal achieved!' : `${progressPct}% of daily goal completed`}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Today's Study Plan */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BrainCircuit size={18} color="var(--primary-400)" /> Today's Plan
              </h2>
              <button className="btn btn-ghost btn-sm" id="dashboard-view-planner-btn" onClick={() => navigate('/planner')}>
                View all <ChevronRight size={14} />
              </button>
            </div>

            {todayPlan.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                <div className="empty-state-icon">📅</div>
                <h3>No sessions today</h3>
                <p>Add deadlines and set your availability to generate a plan</p>
                <button className="btn btn-primary btn-sm mt-2" onClick={() => navigate('/availability')}>Set Availability</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {todayPlan.map(plan => (
                  <div key={plan._id} style={{
                    background: plan.status === 'completed' ? 'rgba(52,211,153,0.05)' : 'var(--bg-elevated)',
                    border: `1px solid ${plan.status === 'completed' ? 'rgba(52,211,153,0.2)' : 'var(--border-subtle)'}`,
                    borderLeft: `3px solid ${plan.subject?.color || 'var(--primary-500)'}`,
                    borderRadius: 'var(--radius-md)', padding: '0.875rem 1rem',
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    opacity: plan.status === 'completed' ? 0.7 : 1,
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{plan.subject?.icon} {plan.subject?.name}</span>
                        {plan.status === 'completed' && <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Done</span>}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {plan.startTime} – {plan.endTime} · {plan.durationMinutes}min
                        {plan.deadline && <> · {plan.deadline.title}</>}
                      </div>
                    </div>
                    {plan.status === 'scheduled' && (
                      <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                        <button
                          id={`plan-timer-${plan._id}`}
                          className="btn btn-ghost btn-icon-sm"
                          title="Start Pomodoro"
                          onClick={() => navigate('/planner', { state: { openPomodoro: true, subjectId: plan.subject } })}
                        >
                          <Timer size={14} />
                        </button>
                        <button
                          id={`plan-complete-${plan._id}`}
                          className="btn btn-success btn-sm"
                          onClick={() => handleComplete(plan._id)}
                        >
                          <CheckCircle2 size={13} /> Done
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Deadlines */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Target size={18} color="var(--danger-400)" /> Upcoming Deadlines
              </h2>
              <button className="btn btn-ghost btn-sm" id="dashboard-view-deadlines-btn" onClick={() => navigate('/deadlines')}>
                View all <ChevronRight size={14} />
              </button>
            </div>

            {upcoming.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                <div className="empty-state-icon">✅</div>
                <h3>All clear!</h3>
                <p>No upcoming deadlines. Great job staying on top!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {upcoming.map(dl => {
                  const days = daysUntil(dl.dueDate)
                  const isUrgent = days <= 2
                  return (
                    <div key={dl._id} style={{
                      background: 'var(--bg-elevated)',
                      border: `1px solid ${isUrgent ? 'rgba(244,63,94,0.2)' : 'var(--border-subtle)'}`,
                      borderLeft: `3px solid ${dl.subject?.color || 'var(--danger-500)'}`,
                      borderRadius: 'var(--radius-md)', padding: '0.875rem 1rem',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {isUrgent && <AlertTriangle size={12} style={{ display: 'inline', marginRight: 4, color: 'var(--danger-400)' }} />}
                            {dl.title}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {dl.subject?.name} · {format(parseISO(dl.dueDate), 'MMM d')}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: isUrgent ? 'var(--danger-400)' : days <= 5 ? 'var(--warning-400)' : 'var(--text-muted)' }}>
                            {days <= 0 ? 'Overdue' : days === 1 ? 'Tomorrow' : `${days}d left`}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: priorityColors[dl.priority] }}>{dl.priority}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Quick Actions</h2>
          <div className="grid-4">
            {[
              { label: 'Add Subject', icon: BookOpen, color: 'var(--primary-400)', bg: 'rgba(99,102,241,0.1)', to: '/subjects', id: 'qa-subjects' },
              { label: 'Add Deadline', icon: Target, color: 'var(--danger-400)', bg: 'rgba(244,63,94,0.1)', to: '/deadlines', id: 'qa-deadlines' },
              { label: 'Set Availability', icon: Clock, color: 'var(--accent-400)', bg: 'rgba(34,211,238,0.1)', to: '/availability', id: 'qa-availability' },
              { label: 'View Progress', icon: TrendingUp, color: 'var(--success-400)', bg: 'rgba(52,211,153,0.1)', to: '/progress', id: 'qa-progress' },
            ].map(({ label, icon: Icon, color, bg, to, id }) => (
              <button
                key={id}
                id={id}
                className="card"
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1.5rem 1rem', cursor: 'pointer', border: 'none', background: 'var(--bg-elevated)', textAlign: 'center' }}
                onClick={() => navigate(to)}
              >
                <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={20} color={color} />
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
