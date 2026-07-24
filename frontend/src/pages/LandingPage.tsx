import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ArrowRight, BrainCircuit, CalendarDays, CheckCircle2, Clock3, Sparkles, Target, TrendingUp, WandSparkles } from 'lucide-react'

const highlights = [
    { title: 'Deadlines first', detail: 'Your schedule is arranged around due dates, not guesswork.', icon: Target },
    { title: 'Made for real life', detail: 'Only uses your available study windows so plans stay realistic.', icon: Clock3 },
    { title: 'Track momentum', detail: 'See what is next, what is done, and what needs attention.', icon: TrendingUp },
]

const proofPoints = [
    'Clean dashboard with guided next steps',
    'Calendar view for fast weekly scanning',
    'Pomodoro timer built into the workflow',
    'Dark, polished UI that feels premium on desktop and mobile',
]

export default function LandingPage() {
    const { user } = useAuth()
    const navigate = useNavigate()

    return (
        <main className="landing-shell marketing-shell">
            <section className="marketing-hero">
                <div className="marketing-copy animate-slide-up">
                    <div className="eyebrow-pill">
                        <Sparkles size={14} /> AI Study Planner for students who want clarity
                    </div>
                    <h1>
                        Turn deadlines into a <span className="gradient-text">clean, visual study plan</span>.
                    </h1>
                    <p className="landing-lead">
                        StudyAI helps you stay on top of subjects, deadlines, and daily study time with a dashboard that feels calm, premium, and easy to follow.
                    </p>

                    <div className="landing-actions">
                        <button className="btn btn-primary btn-lg" onClick={() => navigate(user ? '/dashboard' : '/register')}>
                            {user ? 'Open dashboard' : 'Get started'} <ArrowRight size={16} />
                        </button>
                        <Link to="/login" className="btn btn-ghost btn-lg">
                            Sign in
                        </Link>
                    </div>

                    <div className="proof-strip">
                        {proofPoints.map(point => (
                            <div key={point} className="proof-item">
                                <CheckCircle2 size={14} color="var(--success-400)" />
                                <span>{point}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="marketing-panel glass-card animate-fade-in">
                    <div className="marketing-panel-header">
                        <div>
                            <span className="panel-kicker">Designed for focus</span>
                            <h2>Everything you need in one study workspace</h2>
                        </div>
                        <div className="panel-badge">
                            <BrainCircuit size={14} />
                            Smart planner
                        </div>
                    </div>

                    <div className="mock-dashboard">
                        <div className="mock-card mock-card-accent">
                            <div className="mock-label">Today</div>
                            <div className="mock-title">3 sessions ready</div>
                            <div className="mock-subtitle">Balanced around your availability</div>
                        </div>
                        <div className="mock-card">
                            <div className="mock-label">Upcoming deadline</div>
                            <div className="mock-title">English project</div>
                            <div className="mock-subtitle">Due in 2 days</div>
                        </div>
                        <div className="mock-card">
                            <div className="mock-label">Streak</div>
                            <div className="mock-title">12 days</div>
                            <div className="mock-subtitle">Keep your momentum going</div>
                        </div>
                    </div>

                    <div className="mini-grid marketing-mini-grid">
                        {highlights.map(({ title, detail, icon: Icon }) => (
                            <div key={title} className="mini-card marketing-mini-card">
                                <Icon size={18} color="var(--primary-400)" />
                                <strong>{title}</strong>
                                <span>{detail}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="feature-band">
                <div className="section-heading">
                    <div>
                        <span className="panel-kicker">Why it works</span>
                        <h2>A study system that feels guided, not crowded</h2>
                    </div>
                    <p>Everything is organized so students can move from setup to action without getting lost.</p>
                </div>

                <div className="feature-grid">
                    <article className="feature-card card-glow">
                        <WandSparkles size={20} color="var(--accent-400)" />
                        <h3>Automatic scheduling</h3>
                        <p>Regenerate a weekly plan that fits around your available hours and deadlines.</p>
                    </article>
                    <article className="feature-card card-glow">
                        <CalendarDays size={20} color="var(--primary-400)" />
                        <h3>Calendar clarity</h3>
                        <p>See study sessions and deadlines in one calendar view so nothing slips through.</p>
                    </article>
                    <article className="feature-card card-glow">
                        <Clock3 size={20} color="var(--success-400)" />
                        <h3>Focus sessions</h3>
                        <p>Jump straight into Pomodoro mode whenever it is time to study.</p>
                    </article>
                </div>
            </section>

            <section className="landing-footer-cta marketing-cta">
                <div>
                    <span className="panel-kicker">Start simple</span>
                    <h2>A better study planner should look as good as it works.</h2>
                    <p>Sign up, add your subjects, and let the app build a study routine that feels structured and easy to follow.</p>
                </div>
                <div className="landing-actions">
                    <button className="btn btn-primary btn-lg" onClick={() => navigate(user ? '/dashboard' : '/register')}>
                        {user ? 'Continue' : 'Create account'} <ArrowRight size={16} />
                    </button>
                    <Link to="/login" className="btn btn-ghost btn-lg">Login</Link>
                </div>
            </section>
        </main>
    )
}