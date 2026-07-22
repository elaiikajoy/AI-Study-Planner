import { useState, useEffect } from 'react'
import api from '../utils/api'
import { Plus, Trash2, CheckCircle2, Target, AlertTriangle } from 'lucide-react'
import { format, parseISO, differenceInDays } from 'date-fns'
import toast from 'react-hot-toast'

interface Subject { _id: string; name: string; color: string; icon: string }
interface Deadline {
  _id: string; title: string; type: string; subject: Subject
  dueDate: string; priority: string; estimatedHours: number
  status: string; notes: string
}

const TYPES = ['assignment','project','quiz','exam','lab','other']
const PRIORITIES = ['low','medium','high','critical']

const EMPTY: any = { subjectId: '', title: '', type: 'assignment', dueDate: '', priority: 'medium', estimatedHours: 2, notes: '' }

const priColor = (p: string) => ({ low:'var(--text-muted)', medium:'var(--warning-400)', high:'var(--danger-400)', critical:'hsl(351,94%,68%)' }[p] || 'var(--text-muted)')
const typeEmoji = (t: string) => ({ assignment:'📝', project:'🗂️', quiz:'⚡', exam:'📋', lab:'🔬', other:'📌' }[t] || '📌')

export default function DeadlinesPage() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<any>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState<'all'|'pending'|'completed'>('pending')

  useEffect(() => {
    Promise.all([api.get('/deadlines'), api.get('/subjects')])
      .then(([d, s]) => { setDeadlines(d.data); setSubjects(s.data) })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }, [])

  const openCreate = () => {
    setForm({ ...EMPTY, subjectId: subjects[0]?._id || '', dueDate: format(new Date(), 'yyyy-MM-dd') })
    setModalOpen(true)
  }

  const save = async () => {
    if (!form.title?.trim() || !form.subjectId || !form.dueDate) return toast.error('Title, subject, and due date are required')
    setSaving(true)
    try {
      const { data } = await api.post('/deadlines', form)
      setDeadlines(prev => [...prev, data].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()))
      toast.success('Deadline added! Schedule regenerated 🧠')
      setModalOpen(false)
    } catch (e: any) { toast.error(e.response?.data?.error || 'Failed to save') }
    finally { setSaving(false) }
  }

  const complete = async (id: string) => {
    try {
      const { data } = await api.patch(`/deadlines/${id}/complete`)
      setDeadlines(prev => prev.map(d => d._id === id ? data : d))
      toast.success('Deadline completed! 🎉')
    } catch { toast.error('Failed to update') }
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this deadline?')) return
    try {
      await api.delete(`/deadlines/${id}`)
      setDeadlines(prev => prev.filter(d => d._id !== id))
      toast.success('Deadline removed')
    } catch { toast.error('Failed to delete') }
  }

  const displayed = deadlines.filter(d =>
    filter === 'all' ? true :
    filter === 'completed' ? d.status === 'completed' :
    d.status !== 'completed'
  )

  return (
    <div>
      <div className="page-header" style={{ paddingBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Target size={22} color="var(--danger-400)" /> Deadlines
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              {deadlines.filter(d => d.status !== 'completed').length} pending · {deadlines.filter(d => d.status === 'completed').length} completed
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.25rem', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '0.25rem' }}>
              {(['pending','all','completed'] as const).map(f => (
                <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`} style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setFilter(f)}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            {subjects.length > 0 && <button id="add-deadline-btn" className="btn btn-danger" onClick={openCreate}><Plus size={16} /> Add Deadline</button>}
          </div>
        </div>
      </div>

      <div className="page-body">
        {loading ? <div className="loading-screen" style={{ minHeight: 300 }}><div className="spinner" /></div> :
         subjects.length === 0 ? (
           <div className="empty-state">
             <div className="empty-state-icon">📚</div>
             <h3>Add subjects first</h3>
             <p>You need at least one subject before adding deadlines</p>
           </div>
         ) : displayed.length === 0 ? (
           <div className="empty-state">
             <div className="empty-state-icon">✅</div>
             <h3>{filter === 'completed' ? 'No completed deadlines' : 'No pending deadlines'}</h3>
             <p>{filter === 'pending' ? "Add your assignments, exams, and projects to get started" : "All clear!"}</p>
             {filter !== 'completed' && <button className="btn btn-danger mt-2" onClick={openCreate}><Plus size={16} /> Add Deadline</button>}
           </div>
         ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {displayed.map(dl => {
              const days = differenceInDays(parseISO(dl.dueDate), new Date())
              const isOverdue = days < 0 && dl.status !== 'completed'
              const isUrgent = days <= 2 && days >= 0
              return (
                <div key={dl._id} style={{
                  background: 'var(--bg-elevated)',
                  border: `1px solid ${isOverdue ? 'rgba(244,63,94,0.3)' : isUrgent ? 'rgba(251,191,36,0.2)' : 'var(--border-subtle)'}`,
                  borderLeft: `4px solid ${dl.subject?.color || 'var(--primary-500)'}`,
                  borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem',
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  opacity: dl.status === 'completed' ? 0.6 : 1,
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>{typeEmoji(dl.type)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.95rem', textDecoration: dl.status === 'completed' ? 'line-through' : 'none' }}>{dl.title}</span>
                      <span className="badge badge-muted" style={{ fontSize: '0.7rem' }}>{dl.type}</span>
                      {isOverdue && <span className="badge badge-danger" style={{ fontSize: '0.7rem' }}>Overdue</span>}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: dl.subject?.color, display: 'inline-block' }} />
                        {dl.subject?.name}
                      </span>
                      <span>📅 {format(parseISO(dl.dueDate), 'MMM d, yyyy')}</span>
                      <span>⏱ ~{dl.estimatedHours}h</span>
                      <span style={{ color: priColor(dl.priority), fontWeight: 600 }}>{dl.priority}</span>
                      {days >= 0 && dl.status !== 'completed' && (
                        <span style={{ color: isUrgent ? 'var(--warning-400)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          {isUrgent && <AlertTriangle size={11} />}
                          {days === 0 ? 'Due today' : days === 1 ? 'Tomorrow' : `${days}d left`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                    {dl.status !== 'completed' && (
                      <button id={`complete-dl-${dl._id}`} className="btn btn-success btn-sm" onClick={() => complete(dl._id)}>
                        <CheckCircle2 size={13} /> Done
                      </button>
                    )}
                    <button id={`del-dl-${dl._id}`} className="btn btn-ghost btn-icon-sm" style={{ color: 'var(--danger-400)' }} onClick={() => remove(dl._id)}><Trash2 size={13} /></button>
                  </div>
                </div>
              )
            })}
          </div>
         )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal-box">
            <div className="modal-header">
              <h3>Add Deadline</h3>
              <button className="btn btn-ghost btn-icon-sm" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input id="dl-title-input" className="form-input" placeholder="e.g. Math Problem Set 3" value={form.title} onChange={e => setForm((f: any) => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Subject *</label>
                  <select id="dl-subject-select" className="form-select" value={form.subjectId} onChange={e => setForm((f: any) => ({ ...f, subjectId: e.target.value }))}>
                    {subjects.map(s => <option key={s._id} value={s._id}>{s.icon} {s.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select id="dl-type-select" className="form-select" value={form.type} onChange={e => setForm((f: any) => ({ ...f, type: e.target.value }))}>
                    {TYPES.map(t => <option key={t} value={t}>{typeEmoji(t)} {t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Due Date *</label>
                  <input id="dl-date-input" type="date" className="form-input" value={form.dueDate} onChange={e => setForm((f: any) => ({ ...f, dueDate: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select id="dl-priority-select" className="form-select" value={form.priority} onChange={e => setForm((f: any) => ({ ...f, priority: e.target.value }))}>
                    {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Estimated Hours</label>
                <input type="number" className="form-input" min={0.5} max={100} step={0.5} value={form.estimatedHours} onChange={e => setForm((f: any) => ({ ...f, estimatedHours: +e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Notes (optional)</label>
                <textarea className="form-textarea" value={form.notes} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} placeholder="Any additional details..." style={{ minHeight: 60 }} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
              <button id="save-dl-btn" className="btn btn-danger" onClick={save} disabled={saving}>
                {saving ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving...</> : 'Add Deadline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
