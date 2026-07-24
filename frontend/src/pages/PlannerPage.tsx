import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import api from '../utils/api'
import { format, addDays, subDays, startOfWeek, endOfWeek } from 'date-fns'
import { BrainCircuit, ChevronLeft, ChevronRight, RefreshCw, CheckCircle2, Timer, SkipForward } from 'lucide-react'
import toast from 'react-hot-toast'
import PomodoroTimer from '../components/PomodoroTimer'

interface StudyPlan {
  _id: string
  subject: { _id: string; name: string; color: string; icon: string }
  deadline?: { title: string; dueDate: string }
  date: string; startTime: string; endTime: string
  durationMinutes: number; status: string; notes: string
}

export default function PlannerPage() {
  const location = useLocation()
  const [plans, setPlans] = useState<StudyPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [pomodoroOpen, setPomodoroOpen] = useState(false)
  const [pomodoroSubject, setPomodoroSubject] = useState<any>(null)

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
  const fromStr = format(weekStart, 'yyyy-MM-dd')
  const toStr = format(weekEnd, 'yyyy-MM-dd')

  useEffect(() => {
    if (location.state?.openPomodoro) setPomodoroOpen(true)
    if (location.state?.subjectId) setPomodoroSubject(location.state.subjectId)
  }, [location.state])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/planner/schedule?from=${fromStr}&to=${toStr}`)
      setPlans(data)
    } catch { toast.error('Failed to load schedule') }
    finally { setLoading(false) }
  }, [fromStr, toStr])

  useEffect(() => { load() }, [load])

  const regenerate = async () => {
    setRegenerating(true)
    try {
      await api.post('/planner/regenerate')
      toast.success('Schedule regenerated! 🧠')
      await load()
    } catch { toast.error('Failed to regenerate') }
    finally { setRegenerating(false) }
  }

  const updateStatus = async (id: string, action: 'complete' | 'skip') => {
    try {
      if (action === 'complete') {
        await api.patch(`/planner/schedule/${id}/complete`, {})
        toast.success('Session completed! 🎉')
      } else {
        await api.patch(`/planner/schedule/${id}/skip`)
      }
      setPlans(prev => prev.map(p => p._id === id ? { ...p, status: action === 'complete' ? 'completed' : 'skipped' } : p))
    } catch { toast.error('Failed to update') }
  }

  // Build week days
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i)
    const dateStr = format(d, 'yyyy-MM-dd')
    return { date: d, dateStr, plans: plans.filter(p => p.date === dateStr) }
  })

  const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const completedToday = plans.filter(p => p.date === format(new Date(), 'yyyy-MM-dd') && p.status === 'completed').length
  const totalToday = plans.filter(p => p.date === format(new Date(), 'yyyy-MM-dd')).length

  return (
    <div>
      <div className="page-header" style={{ paddingBottom: '1.25rem' }}>

        <div className="card-glow" style={{ marginTop: '1rem' }}>
          <div className="section-heading" style={{ marginBottom: '0.9rem' }}>
            <div>
              <span className="panel-kicker">AI logic</span>
              <h2>How the schedule is generated</h2>
            </div>
            <p>
              The planner reads subjects, deadlines, and availability, then scores each task before placing sessions inside valid time windows.
            </p>
          </div>
          <div className="rule-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <article className="rule-card card" style={{ padding: '1rem' }}>
              <h3>Priority score</h3>
              <p>Difficulty weight + deadline urgency weight + priority boost.</p>
            </article>
            <article className="rule-card card" style={{ padding: '1rem' }}>
              <h3>Conflict rule</h3>
              <p>Critical items first, then earlier due dates, then harder subjects.</p>
            </article>
            <article className="rule-card card" style={{ padding: '1rem' }}>
              <h3>Time rule</h3>
              <p>Only schedule inside availability and never exceed the daily limit.</p>
            </article>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BrainCircuit size={22} color="var(--primary-400)" /> AI Study Planner
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')} · {completedToday}/{totalToday} done today
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button id="planner-pomodoro-btn" className="btn btn-accent btn-sm" onClick={() => setPomodoroOpen(true)}>
              <Timer size={15} /> Pomodoro
            </button>
            <button id="planner-regenerate-btn" className="btn btn-primary btn-sm" onClick={regenerate} disabled={regenerating}>
              <RefreshCw size={14} style={{ animation: regenerating ? 'spin 0.7s linear infinite' : 'none' }} />
              {regenerating ? 'Regenerating...' : 'Regenerate'}
            </button>
          </div>
        </div>

        {/* Week Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
          <button className="btn btn-ghost btn-icon-sm" id="planner-prev-week" onClick={() => setWeekStart(d => subDays(d, 7))}><ChevronLeft size={16} /></button>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', minWidth: 180, textAlign: 'center' }}>
            Week of {format(weekStart, 'MMMM d, yyyy')}
          </span>
          <button className="btn btn-ghost btn-icon-sm" id="planner-next-week" onClick={() => setWeekStart(d => addDays(d, 7))}><ChevronRight size={16} /></button>
          <button className="btn btn-ghost btn-sm" id="planner-today-btn" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>Today</button>
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="loading-screen" style={{ minHeight: 400 }}><div className="spinner" /></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.5rem', overflowX: 'auto' }}>
            {days.map(({ date, dateStr, plans: dayPlans }, i) => {
              const isToday = dateStr === format(new Date(), 'yyyy-MM-dd')
              return (
                <div key={dateStr} style={{
                  minWidth: 130,
                  background: isToday ? 'rgba(99,102,241,0.05)' : 'var(--bg-elevated)',
                  border: `1px solid ${isToday ? 'rgba(99,102,241,0.2)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-md)', overflow: 'hidden'
                }}>
                  {/* Day Header */}
                  <div style={{
                    padding: '0.75rem', textAlign: 'center',
                    borderBottom: '1px solid var(--border-subtle)',
                    background: isToday ? 'rgba(99,102,241,0.1)' : 'transparent'
                  }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: isToday ? 'var(--primary-400)' : 'var(--text-muted)', textTransform: 'uppercase' }}>{DAY_NAMES[i]}</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: isToday ? 'var(--primary-400)' : 'var(--text-primary)', lineHeight: 1.2 }}>
                      {format(date, 'd')}
                    </div>
                    {dayPlans.length > 0 && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        {Math.round(dayPlans.reduce((acc, p) => acc + p.durationMinutes, 0) / 60 * 10) / 10}h
                      </div>
                    )}
                  </div>

                  {/* Sessions */}
                  <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', minHeight: 100 }}>
                    {dayPlans.length === 0 ? (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-disabled)', textAlign: 'center', padding: '1rem 0', opacity: 0.5 }}>Free</div>
                    ) : dayPlans.map(plan => (
                      <div key={plan._id} style={{
                        background: `${plan.subject?.color}18`,
                        border: `1px solid ${plan.subject?.color}44`,
                        borderLeft: `3px solid ${plan.subject?.color}`,
                        borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.5rem',
                        opacity: plan.status === 'completed' || plan.status === 'skipped' ? 0.5 : 1,
                        position: 'relative'
                      }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          {plan.subject?.icon} {plan.subject?.name}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          {plan.startTime}–{plan.endTime}
                        </div>
                        {plan.status === 'scheduled' && isToday && (
                          <div style={{ display: 'flex', gap: '0.2rem', marginTop: '0.3rem' }}>
                            <button
                              id={`plan-week-complete-${plan._id}`}
                              onClick={() => updateStatus(plan._id, 'complete')}
                              style={{ flex: 1, background: 'rgba(52,211,153,0.2)', border: 'none', borderRadius: 3, cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              title="Complete"
                            >
                              <CheckCircle2 size={10} color="var(--success-400)" />
                            </button>
                            <button
                              id={`plan-week-skip-${plan._id}`}
                              onClick={() => updateStatus(plan._id, 'skip')}
                              style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 3, cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              title="Skip"
                            >
                              <SkipForward size={10} color="var(--text-muted)" />
                            </button>
                          </div>
                        )}
                        {plan.status === 'completed' && <CheckCircle2 size={10} color="var(--success-400)" style={{ position: 'absolute', top: 4, right: 4 }} />}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {plans.length === 0 && !loading && (
          <div className="empty-state" style={{ marginTop: '2rem' }}>
            <div className="empty-state-icon">🤖</div>
            <h3>No schedule yet</h3>
            <p>Add subjects, set your availability, and add deadlines to generate your AI study plan</p>
            <button className="btn btn-primary mt-2" onClick={regenerate}><RefreshCw size={15} /> Generate Schedule</button>
          </div>
        )}
      </div>

      {pomodoroOpen && <PomodoroTimer onClose={() => setPomodoroOpen(false)} initialSubject={pomodoroSubject} />}
    </div>
  )
}
