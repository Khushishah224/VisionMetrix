import { Crosshair, RotateCcw, Ruler, ScanLine, MousePointer, Database } from 'lucide-react'

const features = [
    {
        icon: Crosshair,
        iconBg: 'rgba(0, 230, 180, 0.12)',
        iconColor: '#00e6b4',
        title: 'A4 Reference Detection',
        desc: 'Automatically detects the A4 sheet boundary using contour approximation — your universal calibration target, always available.',
    },
    {
        icon: RotateCcw,
        iconBg: 'rgba(0, 180, 255, 0.12)',
        iconColor: '#00b4ff',
        title: 'Perspective Correction',
        desc: 'Applies homography transform to convert any angled camera shot into a perfect top-down rectified view.',
    },
    {
        icon: Ruler,
        iconBg: 'rgba(168, 85, 247, 0.12)',
        iconColor: '#a855f7',
        title: 'Pixel→mm Scaling',
        desc: 'Derives real-world scale using A4 width (210mm) as reference. Consistent, accurate measurements every session.',
    },
    {
        icon: ScanLine,
        iconBg: 'rgba(0, 230, 180, 0.12)',
        iconColor: '#00e6b4',
        title: 'Auto Object Detection',
        desc: 'Isolates the largest valid object inside the A4 boundary. Returns width, height, area, and polygon coordinates.',
    },
    {
        icon: MousePointer,
        iconBg: 'rgba(251, 191, 36, 0.12)',
        iconColor: '#fbbf24',
        title: 'Manual Measurement Mode',
        desc: 'Click two points for distance, or select multiple points to compute polygon area using the Shoelace formula.',
    },
    {
        icon: Database,
        iconBg: 'rgba(0, 180, 255, 0.12)',
        iconColor: '#00b4ff',
        title: 'Session Scale Memory',
        desc: 'Scale is stored per session — re-detect A4 once, then measure freely without repeating calibration.',
    },
]

function FeatureCard({ feature, index }) {
    const Icon = feature.icon
    return (
        <div
            className={`feature-card animate-fade-up delay-${(index % 3) * 100 + 200}`}
            id={`feature-card-${index}`}
        >
            {/* Icon */}
            <div
                className="feature-icon"
                style={{ background: feature.iconBg }}
            >
                <Icon size={20} color={feature.iconColor} strokeWidth={1.8} />
            </div>

            {/* Title */}
            <h3
                style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    fontSize: '1rem',
                    color: 'var(--clr-text)',
                    marginBottom: '10px',
                }}
            >
                {feature.title}
            </h3>

            {/* Description */}
            <p style={{ fontSize: '0.88rem', color: 'var(--clr-text-muted)', lineHeight: 1.7 }}>
                {feature.desc}
            </p>

            {/* Bottom accent */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: `linear-gradient(90deg, ${feature.iconColor}40 0%, transparent 100%)`,
                    borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
                }}
            />
        </div>
    )
}

export default function FeaturesSection() {
    return (
        <section id="features" style={{ paddingTop: '96px', paddingBottom: '96px' }}>
            <div className="section-container">
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '56px' }}>
                    <div className="section-divider" />
                    <span
                        className="badge animate-fade-down"
                        style={{ display: 'inline-flex', marginBottom: '16px' }}
                    >
                        Core Capabilities
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
                        <span className="gradient-text">Precision Engineering</span>
                    </h2>
                    <p
                        className="animate-fade-up delay-100"
                        style={{
                            fontSize: '1rem',
                            color: 'var(--clr-text-muted)',
                            maxWidth: '520px',
                            margin: '0 auto',
                            lineHeight: 1.75,
                        }}
                    >
                        A complete computer vision pipeline from camera capture to real-world measurement —
                        designed with accuracy and scalability at its core.
                    </p>
                </div>

                {/* Grid */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '20px',
                    }}
                >
                    {features.map((feature, i) => (
                        <FeatureCard key={feature.title} feature={feature} index={i} />
                    ))}
                </div>

                {/* Stats row */}
                <div
                    className="animate-fade-up delay-500"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                        gap: '16px',
                        marginTop: '48px',
                    }}
                >
                    {[
                        { value: '±1.5cm', label: 'Max Auto Error' },
                        { value: '±5mm', label: 'Max Line Error' },
                        { value: '< 200ms', label: 'Detection Speed' },
                        { value: '2', label: 'Measure Modes' },
                    ].map(({ value, label }) => (
                        <div key={label} className="stat-card">
                            <div
                                style={{
                                    fontFamily: 'var(--font-display)',
                                    fontWeight: 700,
                                    fontSize: '1.5rem',
                                    color: 'var(--clr-accent)',
                                    marginBottom: '4px',
                                }}
                            >
                                {value}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>{label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
