import { Link } from 'react-router-dom'
import { Play, LogIn, Zap, ArrowRight, CheckCircle2 } from 'lucide-react'

const highlights = [
    'No setup required — start measuring in seconds',
    'Works with any camera or uploaded image',
    'Sub-millimeter accuracy with A4 reference',
    'FastAPI backend with clean JSON responses',
]

export default function CtaSection() {
    return (
        <section
            id="cta"
            style={{
                paddingTop: '96px',
                paddingBottom: '96px',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Background blobs */}
            <div
                className="blob"
                style={{
                    width: '600px', height: '600px',
                    background: 'rgba(0, 230, 180, 0.05)',
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    animationDelay: '-2s',
                }}
            />

            <div className="section-container" style={{ position: 'relative', zIndex: 1 }}>
                {/* Main CTA card */}
                <div
                    className="animate-fade-up"
                    style={{
                        background: 'linear-gradient(135deg, rgba(0, 230, 180, 0.08) 0%, rgba(0, 180, 255, 0.06) 50%, var(--clr-surface2) 100%)',
                        border: '1px solid rgba(0, 230, 180, 0.2)',
                        borderRadius: 'var(--radius-xl)',
                        padding: 'clamp(36px, 6vw, 64px)',
                        textAlign: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    {/* Top accent line */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0, left: '15%', right: '15%',
                            height: '2px',
                            background: 'linear-gradient(90deg, transparent, var(--clr-accent), var(--clr-accent2), transparent)',
                            borderRadius: '0 0 99px 99px',
                        }}
                    />

                    {/* Icon */}
                    <div
                        className="animate-pulse-glow"
                        style={{
                            width: '56px', height: '56px',
                            borderRadius: '14px',
                            background: 'linear-gradient(135deg, #00e6b4 0%, #00b4ff 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 24px',
                        }}
                    >
                        <Zap size={24} color="var(--clr-bg)" strokeWidth={2.5} />
                    </div>

                    {/* Headline */}
                    <h2
                        style={{
                            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                            fontWeight: 800,
                            color: 'var(--clr-text)',
                            marginBottom: '14px',
                        }}
                    >
                        Ready to measure{' '}
                        <span className="gradient-text">with precision?</span>
                    </h2>

                    <p
                        style={{
                            fontSize: '1.05rem',
                            color: 'var(--clr-text-muted)',
                            maxWidth: '480px',
                            margin: '0 auto 36px',
                            lineHeight: 1.75,
                        }}
                    >
                        Try VisionMetrix demo instantly — no account needed.
                    </p>

                    {/* Highlights */}
                    <div
                        className="animate-fade-up delay-200"
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '24px',
                            flexWrap: 'wrap',
                            marginBottom: '36px',
                        }}
                    >
                        {highlights.map((item) => (
                            <div
                                key={item}
                                style={{ display: 'flex', alignItems: 'center', gap: '7px' }}
                            >
                                <CheckCircle2 size={14} color="var(--clr-accent)" />
                                <span style={{ fontSize: '0.83rem', color: 'var(--clr-text-muted)' }}>{item}</span>
                            </div>
                        ))}
                    </div>

                    {/* Buttons */}
                    <div
                        className="animate-fade-up delay-300"
                        style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}
                    >
                        <Link
                            to="/demo"
                            className="btn-primary"
                            id="cta-demo-btn"
                            style={{ padding: '13px 28px', fontSize: '0.95rem' }}
                        >
                            <Play size={16} strokeWidth={2.5} />
                            Launch Demo
                        </Link>
                        <Link
                            to="/auth"
                            className="btn-secondary"
                            id="cta-signin-btn"
                            style={{ padding: '12px 26px', fontSize: '0.95rem' }}
                        >
                            <LogIn size={15} />
                            Sign In for More
                            <ArrowRight size={14} />
                        </Link>
                    </div>

                    {/* Sub-text */}
                    <p
                        className="animate-fade-up delay-400"
                        style={{
                            fontSize: '0.78rem',
                            color: 'var(--clr-text-faint)',
                            marginTop: '20px',
                        }}
                    >
                        Phase 1 — Measurement Engine · Phase 2 coming soon with auth & analytics
                    </p>
                </div>

                {/* Roadmap preview strip */}
                <div
                    id="roadmap"
                    className="animate-fade-up delay-500"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '12px',
                        marginTop: '24px',
                    }}
                >
                    {[
                        { phase: 'Phase 1', label: 'Measurement Engine', status: 'complete', color: '#00e6b4' },
                        { phase: 'Phase 2', label: 'Auth + Analytics', status: 'planned', color: '#00b4ff' },
                        { phase: 'Phase 3', label: 'Advanced CV', status: 'future', color: '#a855f7' },
                        { phase: 'Phase 4', label: 'AI Refinement', status: 'research', color: '#fbbf24' },
                    ].map(({ phase, label, status, color }) => (
                        <div
                            key={phase}
                            style={{
                                background: 'var(--clr-surface)',
                                border: '1px solid var(--clr-border)',
                                borderRadius: 'var(--radius-md)',
                                padding: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                            }}
                        >
                            <div
                                style={{
                                    width: '8px', height: '8px',
                                    borderRadius: '50%',
                                    background: status === 'complete' ? color : 'transparent',
                                    border: `2px solid ${color}`,
                                    flexShrink: 0,
                                    ...(status === 'complete' && { boxShadow: `0 0 8px ${color}80` }),
                                }}
                            />
                            <div>
                                <div style={{ fontSize: '0.7rem', color, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                                    {phase}
                                </div>
                                <div style={{ fontSize: '0.82rem', color: 'var(--clr-text-muted)', marginTop: '2px' }}>{label}</div>
                            </div>
                            {status === 'complete' && (
                                <CheckCircle2 size={14} color={color} style={{ marginLeft: 'auto' }} />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
