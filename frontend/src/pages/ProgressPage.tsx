import { useState, useEffect } from 'react'
import api from '../utils/api'
import { BarChart3, Flame, Clock, CheckCircle2, TrendingUp, Target } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import toast from 'react-hot-toast'

interface Summary {
  streak: number; totalStudyHours: number
  today: { minutes: number; sessions: number }
  week: { minutes: number; sessions: number }
  month: { minutes: number; sessions: number }
  deadlines: { completed: number; total: number; overdue: number }
  completionRate: number
}

interface HistoryEntry {
  date: string; totalMinutes: number; sessions: number
  subjects: Record<string, number>
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
      <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-primary)' }}>{label}</div>
      <div style={{ color: 'var(--primary-400)' }}>{Math.round(payload[0].value)} min</div>
    </div>
  )
  return null
}

export default function ProgressPage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [historyDays, setHistoryDays] = useState(14)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [sumRes, histRes] = await Promise.all([
          api.get('/progress/summary'),
          api.get(`/progress/history?days=${historyDays}`)
        ])
        setSummary(sumRes.data)
        setHistory(histRes.data)
      } catch { toast.error('Failed to load progress') }
      finally { setLoading(false) }
    }
    load()
  }, [historyDays])

  const chartData = history.map(h => ({
    date: h.date.slice(5), // MM-DD
    minutes: h.totalMinutes,
    sessions: h.sessions
  }))

  if (loading) return <div className="loading-screen" style={{ minHeight: 'calc(100vh - 64px)' }}><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header" style={{ paddingBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart3 size={22} color="var(--success-400)" /> Progress Tracking
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Your learning journey at a glance</p>
      </div>

      <div className="page-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {/* Streak Banner */}
        {(summary?.streak || 0) > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(251,146,60,0.08))',
            border: '1px solid rgba(251,191,36,0.25)', borderRadius: 'var(--radius-lg)',
            padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem'
          }}>
            <Flame size={36} color="var(--warning-400)" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--warning-400)' }}>
                {summary?.streak} Day Streak! 🔥
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>Keep it up! You're building a powerful study habit.</p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid-4">
          {[
            { icon: Clock, label: 'Total Study Hours', value: `${summary?.totalStudyHours?.toFixed(1) || 0}h`, color: 'var(--primary-400)', bg: 'rgba(99,102,241,0.1)' },
            { icon: TrendingUp, label: 'This Week', value: `${((summary?.week.minutes || 0) / 60).toFixed(1)}h`, color: 'var(--accent-400)', bg: 'rgba(34,211,238,0.1)' },
            { icon: Target, label: 'Completion Rate', value: `${summary?.completionRate || 0}%`, color: 'var(--success-400)', bg: 'rgba(52,211,153,0.1)' },
            { icon: CheckCircle2, label: 'Deadlines Done', value: `${summary?.deadlines.completed}/${summary?.deadlines.total}`, color: 'var(--purple-400)', bg: 'rgba(167,139,250,0.1)' },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="stat-card">
              <div className="stat-icon" style={{ background: bg }}><Icon size={18} color={color} /></div>
              <div className="stat-value" style={{ color }}>{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1.1rem' }}>Study Minutes per Day</h2>
            <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', padding: '0.25rem' }}>
              {[7, 14, 30].map(d => (
                <button key={d} className={`btn btn-sm ${historyDays === d ? 'btn-primary' : 'btn-ghost'}`} style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setHistoryDays(d)}>
                  {d}d
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="minutes" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={`hsl(${243 - i * 3}, 75%, ${55 + (i % 3) * 5}%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {chartData.length === 0 && <div className="empty-state" style={{ padding: '2rem' }}><p>No study data in this period</p></div>}
        </div>

        {/* Deadline Stats */}
        <div className="card">
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>Deadline Overview</h2>
          <div className="grid-3">
            {[
              { label: 'Completed', value: summary?.deadlines.completed || 0, color: 'var(--success-400)' },
              { label: 'Pending', value: (summary?.deadlines.total || 0) - (summary?.deadlines.completed || 0) - (summary?.deadlines.overdue || 0), color: 'var(--warning-400)' },
              { label: 'Overdue', value: summary?.deadlines.overdue || 0, color: 'var(--danger-400)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign: 'center', padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-display)', color }}>{value}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{label}</div>
              </div>
            ))}
          </div>
          {(summary?.deadlines.total || 0) > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                <span>Overall completion</span>
                <span>{summary?.completionRate}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${summary?.completionRate}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
