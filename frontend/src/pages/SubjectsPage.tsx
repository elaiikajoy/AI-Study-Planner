import { useState, useEffect } from 'react'
import api from '../utils/api'
import { Plus, Trash2, Edit2, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'

interface Subject {
  _id: string; name: string; difficulty: string; color: string
  weeklyHoursTarget: number; notes: string; icon: string
}

const COLORS = ['#6366f1','#22d3ee','#34d399','#f59e0b','#f43f5e','#a78bfa','#fb923c','#e879f9','#2dd4bf','#60a5fa']
const ICONS = ['📚','📖','🧪','🔬','💻','🎨','📐','🌍','🧠','⚗️','📊','🎼','🏛️','📝','🔭']
const DIFFICULTIES = ['low','medium','high']

const EMPTY: Partial<Subject> = { name: '', difficulty: 'medium', color: '#6366f1', weeklyHoursTarget: 2, notes: '', icon: '📚' }

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Subject | null>(null)
  const [form, setForm] = useState<Partial<Subject>>(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => { api.get('/subjects').then(r => setSubjects(r.data)).catch(() => toast.error('Failed to load subjects')).finally(() => setLoading(false)) }, [])

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModalOpen(true) }
  const openEdit = (s: Subject) => { setEditing(s); setForm({ ...s }); setModalOpen(true) }

  const save = async () => {
    if (!form.name?.trim()) return toast.error('Subject name is required')
    setSaving(true)
    try {
      if (editing) {
        const { data } = await api.put(`/subjects/${editing._id}`, form)
        setSubjects(prev => prev.map(s => s._id === editing._id ? data : s))
        toast.success('Subject updated!')
      } else {
        const { data } = await api.post('/subjects', form)
        setSubjects(prev => [...prev, data])
        toast.success('Subject added! Schedule regenerated 🧠')
      }
      setModalOpen(false)
    } catch (e: any) { toast.error(e.response?.data?.error || 'Failed to save') }
    finally { setSaving(false) }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this subject? Related study plans will be removed.')) return
    try {
      await api.delete(`/subjects/${id}`)
      setSubjects(prev => prev.filter(s => s._id !== id))
      toast.success('Subject removed')
    } catch { toast.error('Failed to delete') }
  }

  const difficultyBadge = (d: string) => ({
    low: 'badge-success', medium: 'badge-warning', high: 'badge-danger'
  }[d] || 'badge-muted')

  return (
    <div>
      <div className="page-header" style={{ paddingBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={22} color="var(--primary-400)" /> Subjects
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{subjects.length} subject{subjects.length !== 1 ? 's' : ''} enrolled</p>
          </div>
          <button id="add-subject-btn" className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Add Subject</button>
        </div>
      </div>

      <div className="page-body">
        {loading ? <div className="loading-screen" style={{ minHeight: 300 }}><div className="spinner" /></div> :
         subjects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📚</div>
            <h3>No subjects yet</h3>
            <p>Add your first subject to get started with smart study planning</p>
            <button className="btn btn-primary mt-2" onClick={openCreate}><Plus size={16} /> Add Subject</button>
          </div>
        ) : (
          <div className="grid-3">
            {subjects.map(s => (
              <div key={s._id} className="card" style={{ borderTop: `3px solid ${s.color}`, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: `${s.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>{s.icon}</div>
                    <div>
                      <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{s.name}</h3>
                      <span className={`badge ${difficultyBadge(s.difficulty)}`}>{s.difficulty}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button id={`edit-subject-${s._id}`} className="btn btn-ghost btn-icon-sm" onClick={() => openEdit(s)}><Edit2 size={13} /></button>
                    <button id={`del-subject-${s._id}`} className="btn btn-ghost btn-icon-sm" style={{ color: 'var(--danger-400)' }} onClick={() => remove(s._id)}><Trash2 size={13} /></button>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  <span>⏱ {s.weeklyHoursTarget}h/week</span>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: s.color, alignSelf: 'center' }} />
                </div>
                {s.notes && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>{s.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <h3>{editing ? 'Edit Subject' : 'Add New Subject'}</h3>
              <button className="btn btn-ghost btn-icon-sm" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Icon Picker */}
              <div className="form-group">
                <label className="form-label">Icon</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {ICONS.map(ic => (
                    <button key={ic} type="button" onClick={() => setForm(f => ({ ...f, icon: ic }))}
                      style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', border: `2px solid ${form.icon === ic ? 'var(--primary-500)' : 'var(--border-default)'}`, background: form.icon === ic ? 'rgba(99,102,241,0.1)' : 'transparent', fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.15s' }}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Subject Name *</label>
                <input id="subject-name-input" className="form-input" placeholder="e.g. Mathematics" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Difficulty</label>
                  <select id="subject-difficulty-select" className="form-select" value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}>
                    {DIFFICULTIES.map(d => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Weekly Hours Target</label>
                  <input type="number" className="form-input" min={1} max={40} value={form.weeklyHoursTarget} onChange={e => setForm(f => ({ ...f, weeklyHoursTarget: +e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Color Label</label>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                      style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: `3px solid ${form.color === c ? 'white' : 'transparent'}`, cursor: 'pointer', transition: 'all 0.15s' }} />
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes (optional)</label>
                <textarea className="form-textarea" placeholder="Any notes about this subject..." value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ minHeight: 60 }} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button id="save-subject-btn" className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving...</> : editing ? 'Save Changes' : 'Add Subject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
