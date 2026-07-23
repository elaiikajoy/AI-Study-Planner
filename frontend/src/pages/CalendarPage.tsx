import { useState, useEffect } from 'react'
import api from '../utils/api'
import { format, startOfMonth, endOfMonth, startOfWeek, addDays, isSameMonth, isToday, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import toast from 'react-hot-toast'

interface Event {
  id: string; title: string; subtitle?: string; type: 'study' | 'deadline'
  color: string; date: string; time?: string
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const from = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
    const to = format(endOfMonth(currentMonth), 'yyyy-MM-dd')
    const load = async () => {
      setLoading(true)
      try {
        const [planRes, dlRes] = await Promise.all([
          api.get(`/planner/schedule?from=${from}&to=${to}`),
          api.get('/deadlines')
        ])
        const planEvents: Event[] = planRes.data.map((p: any) => ({
          id: p._id, title: `${p.subject?.icon} ${p.subject?.name}`,
          subtitle: p.deadline ? `→ ${p.deadline.title}` : '',
          type: 'study', color: p.subject?.color || 'var(--primary-500)',
          date: p.date, time: p.startTime
        }))
        const dlEvents: Event[] = dlRes.data
          .filter((d: any) => d.status !== 'completed')
          .filter((d: any) => {
            const eventDate = format(parseISO(d.dueDate), 'yyyy-MM-dd')
            return eventDate >= from && eventDate <= to
          })
          .map((d: any) => ({
            id: d._id, title: `📅 ${d.title}`,
            type: 'deadline', color: d.subject?.color || 'var(--danger-500)',
            date: format(parseISO(d.dueDate), 'yyyy-MM-dd')
          }))
        setEvents([...planEvents, ...dlEvents])
      } catch { toast.error('Failed to load calendar') }
      finally { setLoading(false) }
    }
    load()
  }, [currentMonth])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })

  const weeks: Date[][] = []
  let day = startDate
  while (day <= monthEnd) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) { week.push(day); day = addDays(day, 1) }
    weeks.push(week)
  }
  while (weeks.length < 5) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) { week.push(day); day = addDays(day, 1) }
    weeks.push(week)
  }

  const getEvents = (d: Date) => events.filter(e => e.date === format(d, 'yyyy-MM-dd'))

  return (
    <div>
      <div className="page-header" style={{ paddingBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarDays size={22} color="var(--accent-400)" /> Calendar
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="btn btn-ghost btn-icon-sm" id="cal-prev" onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))}><ChevronLeft size={16} /></button>
            <span style={{ fontWeight: 600, fontSize: '1rem', minWidth: 160, textAlign: 'center' }}>{format(currentMonth, 'MMMM yyyy')}</span>
            <button className="btn btn-ghost btn-icon-sm" id="cal-next" onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))}><ChevronRight size={16} /></button>
            <button className="btn btn-ghost btn-sm" id="cal-today" onClick={() => setCurrentMonth(new Date())}>Today</button>
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* Legend */}
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--primary-500)' }} />Study Session</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--danger-500)' }} />Deadline Due</span>
        </div>

        {loading ? <div className="loading-screen" style={{ minHeight: 400 }}><div className="spinner" /></div> : (
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            {/* Day Headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border-subtle)' }}>
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                <div key={d} style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d}</div>
              ))}
            </div>

            {/* Weeks */}
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: wi < weeks.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                {week.map((d, di) => {
                  const dayEvents = getEvents(d)
                  const deadlineEvents = dayEvents.filter(e => e.type === 'deadline')
                  const studyEvents = dayEvents.filter(e => e.type === 'study')
                  const inMonth = isSameMonth(d, currentMonth)
                  const today = isToday(d)
                  const maxVisible = 3
                  const visibleDeadlines = deadlineEvents.slice(0, maxVisible)
                  const visibleStudy = studyEvents.slice(0, Math.max(0, maxVisible - visibleDeadlines.length))
                  const overflow = dayEvents.length - visibleDeadlines.length - visibleStudy.length
                  return (
                    <div key={di} style={{
                      minHeight: 110, padding: '0.5rem',
                      borderRight: di < 6 ? '1px solid var(--border-subtle)' : 'none',
                      background: today ? 'rgba(99,102,241,0.04)' : 'transparent',
                      opacity: inMonth ? 1 : 0.3
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.85rem', fontWeight: today ? 700 : 400,
                        color: today ? '#fff' : 'var(--text-secondary)',
                        background: today ? 'var(--primary-500)' : 'transparent',
                        marginBottom: '0.35rem'
                      }}>
                        {format(d, 'd')}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {visibleDeadlines.map(ev => (
                          <div key={ev.id} style={{
                            fontSize: '0.62rem', fontWeight: 600,
                            background: `${ev.color}28`, border: `1px solid ${ev.color}66`,
                            borderLeft: `3px solid ${ev.color}`,
                            borderRadius: 3, padding: '0.18rem 0.3rem',
                            color: 'var(--text-primary)', overflow: 'hidden',
                            textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                          }}>
                            {ev.title}
                          </div>
                        ))}
                        {visibleStudy.map(ev => (
                          <div key={ev.id} style={{
                            fontSize: '0.62rem', fontWeight: 500,
                            background: `${ev.color}18`, border: `1px solid ${ev.color}33`,
                            borderLeft: `3px solid ${ev.color}`,
                            borderRadius: 3, padding: '0.15rem 0.3rem',
                            color: 'var(--text-primary)', overflow: 'hidden',
                          }}>
                            <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
                              {ev.time && <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{ev.time}</span>}
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</span>
                            </div>
                            {ev.subtitle && (
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.58rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {ev.subtitle}
                              </div>
                            )}
                          </div>
                        ))}
                        {overflow > 0 && (
                          <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>+{overflow} more</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
