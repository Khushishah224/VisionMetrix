import { Camera, Cpu, BarChart3, ChevronRight } from 'lucide-react'

const steps = [
    {
        number: '01',
        icon: Camera,
        iconColor: '#00e6b4',
        title: 'Capture Image',
        desc: 'Place your object on an A4 sheet and take a photo. Any standard camera or webcam works — no special hardware required.',
        detail: 'Upload via API → FastAPI receives the image → Session ID generated',
    },
    {
        number: '02',
        icon: Cpu,
        iconColor: '#00b4ff',
        title: 'Vision Processing',
        desc: 'OpenCV detects the A4 contour, applies perspective homography, extracts object boundaries and computes pixel scale.',
        detail: 'Contour detect → Warp transform → Scale calibrate → Object isolate',
    },
    {
        number: '03',
        icon: BarChart3,
        iconColor: '#a855f7',
        title: 'Measurement Results',
        desc: 'Receive width, height, area in millimeters and polygon coordinates in a clean JSON response — ready for downstream use.',
        detail: 'Width mm · Height mm · Area mm² · Polygon points',
    },
]

function StepCard({ step, index }) {
    const Icon = step.icon
    const isLast = index === steps.length - 1

    return (
        <div style={{ display: 'flex', gap: '0', position: 'relative' }}>
            {/* Step number column */}
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0',
                    marginRight: '24px',
                    minWidth: '48px',
                }}
            >
                {/* Circle */}
                <div
                    style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        border: `2px solid ${step.iconColor}`,
                        background: `${step.iconColor}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        zIndex: 1,
                        position: 'relative',
                    }}
                >
                    <Icon size={20} color={step.iconColor} strokeWidth={1.8} />
                </div>

                {/* Connector line */}
                {!isLast && (
                    <div
                        style={{
                            width: '2px',
                            flex: 1,
                            minHeight: '40px',
                            background: `linear-gradient(to bottom, ${step.iconColor}60, transparent)`,
                            marginTop: '4px',
                        }}
                    />
                )}
            </div>

            {/* Content */}
            <div
                className={`animate-slide-right delay-${index * 200 + 100}`}
                style={{ paddingBottom: isLast ? '0' : '36px', flex: 1 }}
            >
                {/* Number tag */}
                <span
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700,
                        fontSize: '0.7rem',
                        color: step.iconColor,
                        letterSpacing: '0.12em',
                        marginBottom: '6px',
                        display: 'block',
                    }}
                >
                    STEP {step.number}
                </span>

                <h3
                    style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700,
                        fontSize: '1.15rem',
                        color: 'var(--clr-text)',
                        marginBottom: '10px',
                    }}
                >
                    {step.title}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--clr-text-muted)', lineHeight: 1.7, marginBottom: '12px' }}>
                    {step.desc}
                </p>

                {/* Code-style detail pill */}
                <div
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        background: 'var(--clr-surface)',
                        border: '1px solid var(--clr-border)',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        color: 'var(--clr-text-faint)',
                        fontFamily: 'monospace',
                        gap: '6px',
                    }}
                >
                    <ChevronRight size={11} color="var(--clr-accent)" />
                    {step.detail}
                </div>
            </div>
        </div>
    )
}

export default function HowItWorksSection() {
    return (
        <section
            id="how-it-works"
            style={{
                paddingTop: '96px',
                paddingBottom: '96px',
                background: 'linear-gradient(180deg, transparent 0%, var(--clr-surface2) 50%, transparent 100%)',
            }}
        >
            <div className="section-container">
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '80px',
                        alignItems: 'start',
                    }}
                    className="hiw-grid"
                >
                    {/* Left — Steps */}
                    <div>
                        <div className="section-divider" style={{ margin: '0 0 20px 0' }} />
                        <span className="badge animate-fade-down" style={{ marginBottom: '16px' }}>
                            How It Works
                        </span>
                        <h2
                            className="animate-fade-up"
                            style={{
                                fontSize: 'clamp(1.8rem, 3vw, 2.4rem)',
                                fontWeight: 800,
                                color: 'var(--clr-text)',
                                marginBottom: '14px',
                            }}
                        >
                            From camera to{' '}
                            <span className="gradient-text">measurements</span>
                            <br />in milliseconds
                        </h2>
                        <p
                            className="animate-fade-up delay-100"
                            style={{
                                fontSize: '0.95rem',
                                color: 'var(--clr-text-muted)',
                                lineHeight: 1.75,
                                marginBottom: '40px',
                                maxWidth: '400px',
                            }}
                        >
                            A streamlined three-step pipeline powered by OpenCV and FastAPI
                            converts a camera image into precise real-world measurements.
                        </p>

                        {/* Steps */}
                        <div>
                            {steps.map((step, i) => (
                                <StepCard key={step.number} step={step} index={i} />
                            ))}
                        </div>
                    </div>

                    {/* Right — API Preview */}
                    <div className="animate-slide-right delay-200">
                        <div
                            style={{
                                background: 'var(--clr-surface)',
                                border: '1px solid var(--clr-border)',
                                borderRadius: 'var(--radius-xl)',
                                overflow: 'hidden',
                            }}
                        >
                            {/* API card header */}
                            <div
                                style={{
                                    padding: '14px 20px',
                                    borderBottom: '1px solid var(--clr-border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                }}
                            >
                                <div
                                    style={{
                                        width: '26px', height: '26px',
                                        borderRadius: '6px',
                                        background: 'rgba(0, 230, 180, 0.15)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}
                                >
                                    <Cpu size={13} color="var(--clr-accent)" />
                                </div>
                                <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--clr-text-muted)' }}>
                                    POST /api/measure/auto
                                </span>
                                <span
                                    style={{
                                        marginLeft: 'auto',
                                        background: 'rgba(0, 230, 180, 0.12)',
                                        color: 'var(--clr-accent)',
                                        fontSize: '0.65rem',
                                        fontWeight: 600,
                                        padding: '2px 8px',
                                        borderRadius: '99px',
                                    }}
                                >
                                    200 OK
                                </span>
                            </div>

                            {/* API response */}
                            <div style={{ padding: '20px', overflowX: 'auto' }}>
                                <pre
                                    style={{
                                        fontFamily: 'monospace',
                                        fontSize: '0.82rem',
                                        lineHeight: 1.9,
                                        color: 'var(--clr-text)',
                                    }}
                                >
                                    <span style={{ color: 'var(--clr-text-faint)' }}>{'{'}</span>{'\n'}
                                    {'  '}<span style={{ color: '#00b4ff' }}>"session_id"</span>
                                    <span style={{ color: 'var(--clr-text-faint)' }}>: </span>
                                    <span style={{ color: '#00e6b4' }}>"A7F2"</span>,{'\n'}
                                    {'  '}<span style={{ color: '#00b4ff' }}>"mode"</span>
                                    <span style={{ color: 'var(--clr-text-faint)' }}>: </span>
                                    <span style={{ color: '#00e6b4' }}>"auto"</span>,{'\n'}
                                    {'  '}<span style={{ color: '#00b4ff' }}>"scale_px_per_mm"</span>
                                    <span style={{ color: 'var(--clr-text-faint)' }}>: </span>
                                    <span style={{ color: '#fbbf24' }}>2.31</span>,{'\n'}
                                    {'  '}<span style={{ color: '#00b4ff' }}>"measurement"</span>
                                    <span style={{ color: 'var(--clr-text-faint)' }}>: {'{'}</span>{'\n'}
                                    {'    '}<span style={{ color: '#00b4ff' }}>"width_mm"</span>
                                    <span style={{ color: 'var(--clr-text-faint)' }}>: </span>
                                    <span style={{ color: '#fbbf24' }}>74.2</span>,{'\n'}
                                    {'    '}<span style={{ color: '#00b4ff' }}>"height_mm"</span>
                                    <span style={{ color: 'var(--clr-text-faint)' }}>: </span>
                                    <span style={{ color: '#fbbf24' }}>52.8</span>,{'\n'}
                                    {'    '}<span style={{ color: '#00b4ff' }}>"area_mm2"</span>
                                    <span style={{ color: 'var(--clr-text-faint)' }}>: </span>
                                    <span style={{ color: '#fbbf24' }}>3921.4</span>,{'\n'}
                                    {'    '}<span style={{ color: '#00b4ff' }}>"polygon"</span>
                                    <span style={{ color: 'var(--clr-text-faint)' }}>: </span>
                                    <span style={{ color: 'var(--clr-text-faint)' }}>[...]</span>{'\n'}
                                    {'  '}<span style={{ color: 'var(--clr-text-faint)' }}>{'}'}</span>{'\n'}
                                    <span style={{ color: 'var(--clr-text-faint)' }}>{'}'}</span>
                                </pre>
                            </div>

                            {/* Footer note */}
                            <div
                                style={{
                                    padding: '12px 20px',
                                    borderTop: '1px solid var(--clr-border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '0.75rem',
                                    color: 'var(--clr-text-faint)',
                                }}
                            >
                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#27c93f' }} />
                                FastAPI · OpenCV · NumPy · Python 3.10+
                            </div>
                        </div>

                        {/* Tech stack badges */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
                            {['FastAPI', 'OpenCV', 'NumPy', 'Homography', 'Contours'].map((tech) => (
                                <span
                                    key={tech}
                                    style={{
                                        background: 'var(--clr-surface)',
                                        border: '1px solid var(--clr-border)',
                                        borderRadius: '6px',
                                        padding: '4px 10px',
                                        fontSize: '0.75rem',
                                        color: 'var(--clr-text-muted)',
                                    }}
                                >
                                    {tech}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        @media (max-width: 900px) {
          .hiw-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
        }
      `}</style>
        </section>
    )
}
