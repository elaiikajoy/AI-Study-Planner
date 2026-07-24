import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BrainCircuit, User, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) return toast.error('Please fill in all fields')
    if (password !== confirm) return toast.error('Passwords do not match')
    if (password.length < 6) return toast.error('Password must be at least 6 characters')
    setLoading(true)
    try {
      await register(name, email, password)
      toast.success('Account created! Let\'s start studying 🚀')
      navigate('/setup')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.1) 0%, transparent 70%)', top: '-10%', right: '-10%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.07) 0%, transparent 70%)', bottom: '-5%', left: '-5%', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 460, animation: 'slideUp 0.35s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 60, height: 60, borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, hsl(268,70%,55%), var(--accent-500))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem', boxShadow: '0 8px 30px var(--purple-glow)'
          }}>
            <BrainCircuit size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>Create your account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Start studying smarter today</p>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)',
          border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)',
          padding: '2rem', boxShadow: 'var(--shadow-lg)'
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { id: 'reg-name', label: 'Full Name', type: 'text', val: name, set: setName, ph: 'Your name', icon: User, auto: 'name' },
              { id: 'reg-email', label: 'Email address', type: 'email', val: email, set: setEmail, ph: 'you@example.com', icon: Mail, auto: 'email' },
            ].map(({ id, label, type, val, set, ph, icon: Icon, auto }) => (
              <div key={id} className="form-group">
                <label className="form-label">{label}</label>
                <div style={{ position: 'relative' }}>
                  <Icon size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input id={id} type={type} className="form-input" placeholder={ph} value={val} onChange={e => set(e.target.value)} style={{ paddingLeft: '2.4rem' }} autoComplete={auto} />
                </div>
              </div>
            ))}

            {[
              { id: 'reg-password', label: 'Password', val: password, set: setPassword, ph: 'Min. 6 characters', auto: 'new-password' },
              { id: 'reg-confirm', label: 'Confirm Password', val: confirm, set: setConfirm, ph: 'Repeat your password', auto: 'new-password' },
            ].map(({ id, label, val, set, ph, auto }) => (
              <div key={id} className="form-group">
                <label className="form-label">{label}</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input id={id} type={showPass ? 'text' : 'password'} className="form-input" placeholder={ph} value={val} onChange={e => set(e.target.value)} style={{ paddingLeft: '2.4rem', paddingRight: id === 'reg-confirm' ? '2.4rem' : undefined }} autoComplete={auto} />
                  {id === 'reg-confirm' && (
                    <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button id="register-submit-btn" type="submit" className="btn btn-primary btn-lg w-full" disabled={loading} style={{ marginTop: '0.5rem' }}>
              {loading ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Creating account...</> : 'Create Account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary-400)', fontWeight: 500 }}>Sign in →</Link>
        </p>
      </div>
    </div>
  )
}
