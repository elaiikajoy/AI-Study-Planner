import { useState, useEffect } from 'react'
import api from '../utils/api'
import { Plus, Trash2, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

interface Slot { _id: string; dayOfWeek: number; startTime: string; endTime: string; label: string }

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const DAY_ABBR = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const DAY_COLORS = ['#f43f5e','#f59e0b','#6366f1','#22d3ee','#34d399','#a78bfa','#fb923c']

const EMPTY = { dayOfWeek: 1, startTime: '18:00', endTime: '21:00', label: '' }

export default function AvailabilityPage() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => { api.get('/availability').then(r => setSlots(r.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false)) }, [])

  const save = async () => {
    if (!form.startTime || !form.endTime) return toast.error('Start and end time required')
    if (form.startTime >= form.endTime) return toast.error('End time must be after start time')
    setSaving(true)
    try {
      const { data } = await api.post('/availability', form)
      setSlots(prev => [...prev, data].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)))
      toast.success('Availability added! Schedule regenerated 📅')
      setModalOpen(false)
      setForm(EMPTY)
    } catch (e: any) { toast.error(e.response?.data?.error || 'Failed to save') }
    finally { setSaving(false) }
  }

  const remove = async (id: string) => {
    try {
      await api.delete(`/availability/${id}`)
      setSlots(prev => prev.filter(s => s._id !== id))
      toast.success('Slot removed')
    } catch { toast.error('Failed to delete') }
  }

  // Group by day
  const byDay = DAYS.reduce((acc, _, i) => { acc[i] = slots.filter(s => s.dayOfWeek === i); return acc }, {} as Record<number, Slot[]>)
  const totalHours = slots.reduce((acc, s) => {
    const diff = (parseInt(s.endTime) - parseInt(s.startTime)) // rough
    const [sh, sm] = s.startTime.split(':').map(Number)
    const [eh, em] = s.endTime.split(':').map(Number)
    return acc + (eh * 60 + em - sh * 60 - sm)
  }, 0)

  return (
    <div>
      <div className="page-header" style={{ paddingBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={22} color="var(--accent-400)" /> Availability
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {slots.length} slot{slots.length !== 1 ? 's' : ''} · ~{Math.round(totalHours / 60 * 10) / 10}h/week available
            </p>
          </div>
          <button id="add-slot-btn" className="btn btn-accent" onClick={() => setModalOpen(true)}><Plus size={16} /> Add Slot</button>
        </div>
      </div>

      <div className="page-body">
        {loading ? <div className="loading-screen" style={{ minHeight: 300 }}><div className="spinner" /></div> : (
          <>
            {slots.length === 0 && (
              <div className="empty-state" style={{ marginBottom: '2rem' }}>
                <div className="empty-state-icon">📅</div>
                <h3>No availability set</h3>
                <p>Tell the AI planner when you're free to study, and it'll do the rest</p>
                <button className="btn btn-accent mt-2" onClick={() => setModalOpen(true)}><Plus size={16} /> Add First Slot</button>
              </div>
            )}

            {/* Weekly Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.75rem' }}>
              {DAYS.map((day, i) => (
                <div key={day} style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em',
                    color: byDay[i]?.length > 0 ? DAY_COLORS[i] : 'var(--text-disabled)',
                    marginBottom: '0.5rem', textTransform: 'uppercase', textAlign: 'center'
                  }}>
                    {DAY_ABBR[i]}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {byDay[i]?.length > 0 ? byDay[i].map(slot => (
                      <div key={slot._id} style={{
                        background: `${DAY_COLORS[i]}18`,
                        border: `1px solid ${DAY_COLORS[i]}44`,
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.5rem',
                        fontSize: '0.72rem',
                        position: 'relative'
                      }}>
                        <div style={{ fontWeight: 600, color: DAY_COLORS[i], marginBottom: '0.15rem' }}>{slot.startTime}</div>
                        <div style={{ color: 'var(--text-muted)' }}>to {slot.endTime}</div>
                        {slot.label && <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.15rem' }}>{slot.label}</div>}
                        <button
                          id={`del-slot-${slot._id}`}
                          onClick={() => remove(slot._id)}
                          style={{ position: 'absolute', top: 4, right: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', opacity: 0.6, padding: 2 }}
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    )) : (
                      <div style={{ height: 50, border: '1px dashed var(--border-subtle)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '1rem', opacity: 0.2 }}>–</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {slots.length > 0 && (
              <div style={{ marginTop: '2rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {slots.map(s => (
                  <div key={s._id} style={{
                    background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                    borderLeft: `3px solid ${DAY_COLORS[s.dayOfWeek]}`,
                    borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem',
                    display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem'
                  }}>
                    <span style={{ fontWeight: 600, color: DAY_COLORS[s.dayOfWeek], minWidth: 32 }}>{DAY_ABBR[s.dayOfWeek]}</span>
                    <span style={{ color: 'var(--text-primary)' }}>{s.startTime} – {s.endTime}</span>
                    {s.label && <span style={{ color: 'var(--text-muted)' }}>{s.label}</span>}
                    <button id={`del-slot-list-${s._id}`} className="btn btn-ghost btn-icon-sm" style={{ color: 'var(--danger-400)' }} onClick={() => remove(s._id)}><Trash2 size={13} /></button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {modalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <h3>Add Availability Slot</h3>
              <button className="btn btn-ghost btn-icon-sm" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Day of Week</label>
                <select id="avail-day-select" className="form-select" value={form.dayOfWeek} onChange={e => setForm(f => ({ ...f, dayOfWeek: +e.target.value }))}>
                  {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
                </select>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input id="avail-start-input" type="time" className="form-input" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input id="avail-end-input" type="time" className="form-input" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Label (optional)</label>
                <input className="form-input" placeholder='e.g. "After school"' value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button id="save-slot-btn" className="btn btn-accent" onClick={save} disabled={saving}>
                {saving ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving...</> : 'Add Slot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
