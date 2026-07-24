import { useNavigate } from 'react-router-dom'
import { ArrowRight, BookOpen, CalendarDays, CheckCircle2, Clock, Target, Zap } from 'lucide-react'

const setupSteps = [
    {
        title: 'Add Subjects',
        description: 'Capture the subjects the planner should optimize for, plus difficulty and weekly target hours.',
        icon: BookOpen,
        to: '/subjects',
    },
    {
        title: 'Set Availability',
        description: 'Define only the time windows where the planner is allowed to place sessions.',
        icon: Clock,
        to: '/availability',
    },
    {
        title: 'Add Deadlines',
        description: 'Record due dates, priority level, and estimated hours for each task.',
        icon: Target,
        to: '/deadlines',
    },
    {
        title: 'Review Planner',
        description: 'Check the generated weekly schedule and adjust before you start studying.',
        icon: CalendarDays,
        to: '/dashboard',
    },
]

const checklist = [
    'Every subject has a difficulty level',
    'Availability windows are defined by day',
    'Deadlines have priority and estimated effort',
    'Study goal matches the actual weekly capacity',
]

export default function SetupPage() {
    const navigate = useNavigate()

    return (
        <main className="setup-shell">
            <section className="setup-hero card-glow animate-slide-up">
                <div className="setup-copy">
                    <div className="eyebrow-pill">
                        <Zap size={14} /> First-time setup
                    </div>
                    <h1>Give the planner the facts, then let it generate the work.</h1>
                    <p>
                        The system works best when you give it a clean input: subjects, availability, deadlines, and a realistic study goal.
                        Once those are set, the AI can rank urgency and fill the week without guessing.
                    </p>

                    <div className="setup-checklist">
                        {checklist.map(item => (
                            <div key={item} className="setup-check-item">
                                <CheckCircle2 size={16} color="var(--success-400)" />
                                <span>{item}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <aside className="setup-panel glass-card">
                    <div className="panel-header">
                        <div>
                            <span className="panel-kicker">Setup order</span>
                            <h2>Recommended sequence</h2>
                        </div>
                        <div className="panel-badge">
                            <CheckCircle2 size={14} />
                            Ready to plan
                        </div>
                    </div>

                    <div className="setup-timeline">
                        {setupSteps.map((step, index) => {
                            const Icon = step.icon
                            return (
                                <button key={step.title} className="setup-step" onClick={() => navigate(step.to)}>
                                    <div className="setup-step-index">{index + 1}</div>
                                    <div className="setup-step-icon">
                                        <Icon size={18} color="white" />
                                    </div>
                                    <div className="setup-step-copy">
                                        <strong>{step.title}</strong>
                                        <span>{step.description}</span>
                                    </div>
                                    <ArrowRight size={16} className="setup-step-arrow" />
                                </button>
                            )
                        })}
                    </div>

                    <div className="setup-actions">
                        <button className="btn btn-primary btn-lg" onClick={() => navigate('/dashboard')}>
                            Continue to dashboard <ArrowRight size={16} />
                        </button>
                        <button className="btn btn-ghost btn-lg" onClick={() => navigate('/planner')}>
                            Preview planner
                        </button>
                    </div>
                </aside>
            </section>
        </main>
    )
}