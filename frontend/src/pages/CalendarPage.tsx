import { useState, useEffect } from 'react'
import api from '../utils/api'
import { format, startOfMonth, endOfMonth, startOfWeek, addDays, isSameMonth, isToday, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import toast from 'react-hot-toast'

interface Event {
  id: string; title: string; type: 'study' | 'deadline'
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
          type: 'study', color: p.subject?.color || 'var(--primary-500)',
          date: p.date, time: p.startTime
        }))
        const dlEvents: Event[] = dlRes.data
          .filter((d: any) => d.status !== 'completed')
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
  while (day <= monthEnd || weeks.length < 5) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) { week.push(day); day = addDays(day, 1) }
    weeks.push(week)
    if (day > monthEnd && weeks.length >= 4) break
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
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--danger-500)' }} />Deadline</span>
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
                  const inMonth = isSameMonth(d, currentMonth)
                  const today = isToday(d)
                  return (
                    <div key={di} style={{
                      minHeight: 100, padding: '0.5rem',
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
                        {dayEvents.slice(0, 3).map(ev => (
                          <div key={ev.id} style={{
                            fontSize: '0.65rem', fontWeight: 500,
                            background: `${ev.color}20`, border: `1px solid ${ev.color}44`,
                            borderLeft: `3px solid ${ev.color}`,
                            borderRadius: 3, padding: '0.15rem 0.3rem',
                            color: 'var(--text-primary)', overflow: 'hidden',
                            textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                          }}>
                            {ev.time && <span style={{ color: 'var(--text-muted)', marginRight: '0.2rem' }}>{ev.time}</span>}
                            {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>+{dayEvents.length - 3} more</div>
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
