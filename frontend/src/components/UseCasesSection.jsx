import { Package, Scissors, Box, Layers, ArrowRight } from 'lucide-react'

const useCases = [
    {
        id: 'parcel',
        icon: Package,
        iconColor: '#00e6b4',
        label: 'Parcel & Logistics',
        title: 'Instant Parcel Dimensioning',
        desc: 'Automate parcel size measurement for shipping cost calculation and label generation. Eliminate manual tape measures.',
        tags: ['Shipping', 'Logistics', 'E-Commerce'],
        gradient: 'linear-gradient(135deg, rgba(0,230,180,0.15) 0%, rgba(0,180,255,0.08) 100%)',
        accentColor: '#00e6b4',
    },
    {
        id: 'textile',
        icon: Scissors,
        iconColor: '#a855f7',
        label: 'Textile & Fashion',
        title: 'Precision Textile Sizing',
        desc: 'Measure garment patterns, fabric pieces, and accessories with high-precision measurement before cutting.',
        tags: ['Textile', 'Fashion', 'Pattern Making'],
        gradient: 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(0,230,180,0.06) 100%)',
        accentColor: '#a855f7',
    },
    {
        id: 'manufacturing',
        icon: Box,
        iconColor: '#00b4ff',
        label: 'Manufacturing & QA',
        title: 'Component QA Inspection',
        desc: 'Verify dimensional tolerances for manufactured components. Detect out-of-spec parts instantly with camera-based QA.',
        tags: ['QA', 'Manufacturing', 'Inspection'],
        gradient: 'linear-gradient(135deg, rgba(0,180,255,0.15) 0%, rgba(168,85,247,0.06) 100%)',
        accentColor: '#00b4ff',
    },
    {
        id: 'research',
        icon: Layers,
        iconColor: '#fbbf24',
        label: 'Research & Education',
        title: 'Academic CV Research',
        desc: 'A complete working example of homography, contour detection, and pixel-to-real scaling — ideal for computer vision courses.',
        tags: ['Education', 'Research', 'OpenCV'],
        gradient: 'linear-gradient(135deg, rgba(251,191,36,0.12) 0%, rgba(0,230,180,0.06) 100%)',
        accentColor: '#fbbf24',
    },
]

function UseCaseCard({ uc, index }) {
    const Icon = uc.icon
    return (
        <div
            id={`usecase-${uc.id}`}
            className={`feature-card animate-fade-up delay-${index * 100 + 200}`}
            style={{
                background: `${uc.gradient}, var(--clr-surface)`,
                cursor: 'default',
            }}
        >
            {/* Label badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <div
                    style={{
                        width: '36px', height: '36px',
                        borderRadius: '9px',
                        background: `${uc.accentColor}18`,
                        border: `1px solid ${uc.accentColor}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    <Icon size={17} color={uc.accentColor} strokeWidth={1.8} />
                </div>
                <span
                    style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: uc.accentColor,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                    }}
                >
                    {uc.label}
                </span>
            </div>

            <h3
                style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: '1.05rem',
                    color: 'var(--clr-text)',
                    marginBottom: '10px',
                }}
            >
                {uc.title}
            </h3>

            <p style={{ fontSize: '0.875rem', color: 'var(--clr-text-muted)', lineHeight: 1.7, marginBottom: '18px' }}>
                {uc.desc}
            </p>

            {/* Tags */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {uc.tags.map((tag) => (
                    <span
                        key={tag}
                        style={{
                            fontSize: '0.7rem',
                            color: uc.accentColor,
                            background: `${uc.accentColor}12`,
                            border: `1px solid ${uc.accentColor}25`,
                            borderRadius: '4px',
                            padding: '3px 8px',
                            fontWeight: 500,
                        }}
                    >
                        {tag}
                    </span>
                ))}
            </div>
        </div>
    )
}

export default function UseCasesSection() {
    return (
        <section
            id="use-cases"
            style={{
                paddingTop: '96px',
                paddingBottom: '96px',
            }}
        >
            <div className="section-container">
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '56px' }}>
                    <div className="section-divider" />
                    <span className="badge animate-fade-down" style={{ display: 'inline-flex', marginBottom: '16px' }}>
                        Application Fields
                    </span>
                    <h2
                        className="animate-fade-up"
                        style={{
                            fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)',
                            fontWeight: 800,
                            color: 'var(--clr-text)',
                            marginBottom: '14px',
                        }}
                    >
                        Built for{' '}
                        <span className="gradient-text">Every Industry</span>
                    </h2>
                    <p
                        className="animate-fade-up delay-100"
                        style={{
                            fontSize: '1rem',
                            color: 'var(--clr-text-muted)',
                            maxWidth: '480px',
                            margin: '0 auto',
                            lineHeight: 1.75,
                        }}
                    >
                        From logistics to textile to manufacturing — VisionMetrix adapts to
                        any workflow where dimensional accuracy matters.
                    </p>
                </div>

                {/* Cards grid */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                        gap: '20px',
                    }}
                >
                    {useCases.map((uc, i) => (
                        <UseCaseCard key={uc.id} uc={uc} index={i} />
                    ))}
                </div>

                {/* Bottom highlight banner */}
                <div
                    className="animate-fade-up delay-600 glass"
                    style={{
                        marginTop: '48px',
                        borderRadius: 'var(--radius-xl)',
                        padding: '32px 36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '20px',
                        background: 'linear-gradient(135deg, rgba(0, 230, 180, 0.06) 0%, rgba(0, 180, 255, 0.04) 100%)',
                        borderColor: 'rgba(0, 230, 180, 0.2)',
                    }}
                >
                    <div>
                        <div
                            style={{
                                fontFamily: 'var(--font-display)',
                                fontWeight: 700,
                                fontSize: '1.1rem',
                                color: 'var(--clr-text)',
                                marginBottom: '6px',
                            }}
                        >
                            Don't see your use case?
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--clr-text-muted)' }}>
                            VisionMetrix is extensible — the measurement API can integrate into any custom workflow.
                        </p>
                    </div>
                    <a
                        href="http://localhost:8000/docs"
                        className="btn-primary"
                        id="usecase-cta-btn"
                        style={{ flexShrink: 0 }}
                    >
                        Explore the API
                        <ArrowRight size={15} />
                    </a>
                </div>
            </div>
        </section>
    )
}
