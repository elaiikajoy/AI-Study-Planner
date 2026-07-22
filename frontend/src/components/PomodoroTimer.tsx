import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import { X, Play, Pause, RotateCcw, CheckCircle2, Coffee, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

type Phase = 'focus' | 'short-break' | 'long-break'

interface Props {
  onClose: () => void
  initialSubject?: { _id: string; name: string; color: string; icon: string } | null
}

const PHASE_LABELS: Record<Phase, string> = {
  'focus': 'Focus Session', 'short-break': 'Short Break', 'long-break': 'Long Break'
}
const PHASE_COLORS: Record<Phase, string> = {
  'focus': 'var(--primary-400)', 'short-break': 'var(--accent-400)', 'long-break': 'var(--success-400)'
}
const PHASE_BG: Record<Phase, string> = {
  'focus': 'rgba(99,102,241,0.15)', 'short-break': 'rgba(34,211,238,0.1)', 'long-break': 'rgba(52,211,153,0.1)'
}

export default function PomodoroTimer({ onClose, initialSubject }: Props) {
  const { user } = useAuth()
  const settings = user?.settings || { pomodoroFocusMinutes: 25, pomodoroShortBreak: 5, pomodoroLongBreak: 15 }

  const PHASE_DURATIONS: Record<Phase, number> = {
    'focus': settings.pomodoroFocusMinutes * 60,
    'short-break': settings.pomodoroShortBreak * 60,
    'long-break': settings.pomodoroLongBreak * 60
  }

  const [phase, setPhase] = useState<Phase>('focus')
  const [timeLeft, setTimeLeft] = useState(PHASE_DURATIONS['focus'])
  const [running, setRunning] = useState(false)
  const [pomodorosCompleted, setPomodorosCompleted] = useState(0)
  const [subjects, setSubjects] = useState<any[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string>(initialSubject?._id || '')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    api.get('/subjects').then(r => setSubjects(r.data)).catch(() => {})
  }, [])

  const switchPhase = useCallback((nextPhase: Phase) => {
    setPhase(nextPhase)
    setTimeLeft(PHASE_DURATIONS[nextPhase])
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
  }, [PHASE_DURATIONS])

  const handleComplete = useCallback(async () => {
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)

    if (phase === 'focus') {
      const newCount = pomodorosCompleted + 1
      setPomodorosCompleted(newCount)
      toast.success(`Pomodoro #${newCount} complete! 🍅`, { duration: 3000 })
      try {
        await api.post('/planner/session', {
          subjectId: selectedSubject || null,
          durationMinutes: settings.pomodoroFocusMinutes,
          pomodorosCompleted: 1
        })
      } catch {}
      switchPhase(newCount % 4 === 0 ? 'long-break' : 'short-break')
    } else {
      toast('Break time over! Back to focus 💪', { icon: '⚡' })
      switchPhase('focus')
    }
  }, [phase, pomodorosCompleted, selectedSubject, settings.pomodoroFocusMinutes, switchPhase])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { handleComplete(); return 0 }
          return t - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, handleComplete])

  const total = PHASE_DURATIONS[phase]
  const progress = ((total - timeLeft) / total) * 100
  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0')
  const secs = String(timeLeft % 60).padStart(2, '0')

  // SVG circle
  const R = 90
  const CIRCUMFERENCE = 2 * Math.PI * R
  const strokeDash = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) { if (!running) onClose() } }}>
      <div className="modal-box" style={{ maxWidth: 420, textAlign: 'center' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>🍅 Pomodoro Timer</h3>
          <button className="btn btn-ghost btn-icon-sm" onClick={onClose} id="pomodoro-close-btn"><X size={16} /></button>
        </div>

        {/* Phase Tabs */}
        <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)', padding: '0.25rem', marginBottom: '1.5rem' }}>
          {(['focus','short-break','long-break'] as Phase[]).map(p => (
            <button
              key={p}
              id={`pomodoro-phase-${p}`}
              style={{ flex: 1, padding: '0.4rem', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: phase === p ? 600 : 400, background: phase === p ? PHASE_BG[p] : 'transparent', color: phase === p ? PHASE_COLORS[p] : 'var(--text-muted)', transition: 'all 0.15s' }}
              onClick={() => { if (!running) switchPhase(p) }}
            >
              {p === 'focus' ? '🎯 Focus' : p === 'short-break' ? '☕ Short' : '🌙 Long'}
            </button>
          ))}
        </div>

        {/* Circular Timer */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1rem' }}>
          <svg width={220} height={220} viewBox="0 0 220 220">
            {/* Background glow */}
            <circle cx={110} cy={110} r={R} fill="none" stroke="var(--border-subtle)" strokeWidth={10} />
            <circle
              cx={110} cy={110} r={R}
              fill="none"
              stroke={PHASE_COLORS[phase]}
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDash}
              transform="rotate(-90 110 110)"
              style={{ transition: 'stroke-dashoffset 1s linear', filter: `drop-shadow(0 0 8px ${PHASE_COLORS[phase]})` }}
            />
          </svg>
          {/* Time Display */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 800, color: PHASE_COLORS[phase], letterSpacing: '0.05em', lineHeight: 1 }}>
              {mins}:{secs}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{PHASE_LABELS[phase]}</div>
          </div>
        </div>

        {/* Pomodoro count */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} style={{
              width: 14, height: 14, borderRadius: '50%',
              background: i < (pomodorosCompleted % 4) ? 'var(--danger-400)' : 'var(--border-default)',
              boxShadow: i < (pomodorosCompleted % 4) ? '0 0 8px var(--danger-glow)' : 'none',
              transition: 'all 0.3s'
            }} />
          ))}
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.25rem', alignSelf: 'center' }}>#{Math.floor(pomodorosCompleted / 4) * 4 + (pomodorosCompleted % 4) + 1}</span>
        </div>

        {/* Subject Selector */}
        {subjects.length > 0 && (
          <div className="form-group" style={{ marginBottom: '1.25rem', textAlign: 'left' }}>
            <label className="form-label">Studying</label>
            <select id="pomodoro-subject-select" className="form-select" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
              <option value="">— No subject —</option>
              {subjects.map((s: any) => <option key={s._id} value={s._id}>{s.icon} {s.name}</option>)}
            </select>
          </div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            id="pomodoro-reset-btn"
            className="btn btn-ghost"
            onClick={() => { setRunning(false); setTimeLeft(PHASE_DURATIONS[phase]) }}
            title="Reset"
          >
            <RotateCcw size={18} />
          </button>
          <button
            id="pomodoro-start-btn"
            className="btn btn-primary btn-lg"
            style={{ minWidth: 120, background: running ? 'transparent' : undefined, border: running ? '1px solid var(--primary-500)' : 'none', color: running ? 'var(--primary-400)' : 'white', boxShadow: running ? 'none' : '0 4px 15px var(--primary-glow)' }}
            onClick={() => setRunning(r => !r)}
          >
            {running ? <><Pause size={18} /> Pause</> : <><Play size={18} /> {timeLeft === PHASE_DURATIONS[phase] ? 'Start' : 'Resume'}</>}
          </button>
          <button
            id="pomodoro-done-btn"
            className="btn btn-ghost"
            onClick={handleComplete}
            title={phase === 'focus' ? 'Complete session' : 'End break'}
          >
            {phase === 'focus' ? <CheckCircle2 size={18} color="var(--success-400)" /> : <Zap size={18} color="var(--warning-400)" />}
          </button>
        </div>

        {pomodorosCompleted > 0 && (
          <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            🍅 {pomodorosCompleted} pomodoro{pomodorosCompleted !== 1 ? 's' : ''} completed today
          </p>
        )}
      </div>
    </div>
  )
}
