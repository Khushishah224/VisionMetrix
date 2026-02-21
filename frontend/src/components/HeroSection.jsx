import { Link } from 'react-router-dom'
import { ArrowRight, Play, Ruler, Eye, Layers } from 'lucide-react'

/* ─── Floating metric badge ─────────────────────────────────────── */
function MetricBadge({ label, value, unit, secondaryLabel, secondaryValue, secondaryUnit, style, className }) {
    return (
        <div
            className={`glass animate-fade-up ${className || ''}`}
            style={{
                position: 'absolute',
                borderRadius: '12px',
                padding: '12px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                minWidth: '140px',
                backdropFilter: 'blur(16px)',
                border: '1px solid var(--clr-border)',
                boxShadow: '0 8px 32px -8px rgba(0,0,0,0.3)',
                ...style,
            }}
        >
            <div>
                <span style={{ fontSize: '0.65rem', color: 'var(--clr-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                    {label}
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem', color: 'var(--clr-accent)' }}>
                        {value}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)' }}>{unit}</span>
                </div>
            </div>

            {(secondaryLabel && secondaryValue) && (
                <div style={{ paddingTop: '8px', borderTop: '1px solid var(--clr-border)' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--clr-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                        {secondaryLabel}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'rgba(0,180,255,1)' }}>
                            {secondaryValue}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--clr-text-muted)' }}>{secondaryUnit}</span>
                    </div>
                </div>
            )}
        </div>
    )
}

/* ─── CV Preview Card ────────────────────────────────────────────── */
function CvPreviewCard() {
    return (
        <div
            className="demo-card animate-slide-right delay-400 animate-float"
            style={{ maxWidth: '480px', width: '100%', position: 'relative' }}
        >
            {/* Card header */}
            <div
                style={{
                    padding: '12px 18px',
                    borderBottom: '1px solid var(--clr-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <div style={{ display: 'flex', gap: '6px' }}>
                    {['#ff5f56', '#ffbd2e', '#27c93f'].map((c) => (
                        <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                    ))}
                </div>
                <span className="badge" style={{ fontSize: '0.65rem', padding: '3px 8px' }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--clr-accent)', animation: 'pulse-glow 2s infinite' }} />
                    LIVE ANALYSIS
                </span>
                <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-faint)' }}>Session #A7F2</div>
            </div>

            {/* CV viewport simulation */}
            <div
                style={{
                    position: 'relative',
                    height: '240px',
                    background: 'linear-gradient(160deg, var(--clr-surface2) 0%, var(--clr-surface) 100%)',
                    overflow: 'hidden',
                }}
            >
                <div className="scan-line" />

                {/* Grid overlay */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: 'linear-gradient(rgba(0,230,180,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(0,230,180,0.07) 1px, transparent 1px)',
                        backgroundSize: '32px 32px',
                    }}
                />

                {/* Simulated A4 paper frame */}
                <div
                    style={{
                        position: 'absolute',
                        top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '180px', height: '130px',
                        border: '2px solid rgba(0, 230, 180, 0.5)',
                        borderRadius: '4px',
                    }}
                >
                    {/* Corner marks */}
                    {[
                        { top: '-6px', left: '-6px', borderColor: 'var(--clr-accent)', borderStyle: 'solid', borderWidth: '2px 0 0 2px', width: 14, height: 14 },
                        { top: '-6px', right: '-6px', borderColor: 'var(--clr-accent)', borderStyle: 'solid', borderWidth: '2px 2px 0 0', width: 14, height: 14 },
                        { bottom: '-6px', left: '-6px', borderColor: 'var(--clr-accent)', borderStyle: 'solid', borderWidth: '0 0 2px 2px', width: 14, height: 14 },
                        { bottom: '-6px', right: '-6px', borderColor: 'var(--clr-accent)', borderStyle: 'solid', borderWidth: '0 2px 2px 0', width: 14, height: 14 },
                    ].map((s, i) => (
                        <div key={i} style={{ position: 'absolute', ...s, borderRadius: '1px' }} />
                    ))}

                    {/* Detected object */}
                    <div
                        style={{
                            position: 'absolute',
                            top: '20px', left: '30px',
                            width: '70px', height: '50px',
                            border: '1.5px solid rgba(0, 180, 255, 0.8)',
                            borderRadius: '3px',
                            background: 'rgba(0, 180, 255, 0.06)',
                        }}
                    >
                        {/* Dimension lines */}
                        <div style={{ position: 'absolute', bottom: '-16px', left: 0, right: 0, height: '1px', background: 'rgba(0,230,180,0.5)' }}>
                            <span style={{ position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)', fontSize: '7px', color: 'var(--clr-accent)', whiteSpace: 'nowrap' }}>74.2 mm</span>
                        </div>
                        <div style={{ position: 'absolute', right: '-20px', top: 0, bottom: 0, width: '1px', background: 'rgba(0,230,180,0.5)' }}>
                            <span style={{ position: 'absolute', left: '4px', top: '50%', transform: 'translateY(-50%)', fontSize: '7px', color: 'var(--clr-accent)', whiteSpace: 'nowrap' }}>52.8 mm</span>
                        </div>
                    </div>
                </div>

                {/* A4 label */}
                <div style={{ position: 'absolute', bottom: '10px', right: '12px', fontSize: '0.65rem', color: 'var(--clr-text-faint)', letterSpacing: '0.1em' }}>
                    A4 REF ✓
                </div>
            </div>

            {/* Measurement readout */}
            <div style={{ padding: '16px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                {[
                    { label: 'Width', value: '74.2', unit: 'mm' },
                    { label: 'Height', value: '52.8', unit: 'mm' },
                    { label: 'Area', value: '3,919', unit: 'mm²' },
                ].map(({ label, value, unit }) => (
                    <div key={label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--clr-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--clr-text)' }}>
                            {value}
                            <span style={{ fontSize: '0.65rem', color: 'var(--clr-text-muted)', marginLeft: '2px' }}>{unit}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

/* ─── Hero Section ───────────────────────────────────────────────── */
export default function HeroSection() {
    return (
        <section
            id="hero"
            className="grid-bg"
            style={{
                position: 'relative',
                paddingTop: '120px',
                paddingBottom: '100px',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
            }}
        >
            {/* Background blobs */}
            <div
                className="blob"
                style={{
                    width: '500px', height: '500px',
                    background: 'rgba(0, 230, 180, 0.07)',
                    top: '-100px', left: '-150px',
                }}
            />
            <div
                className="blob"
                style={{
                    width: '380px', height: '380px',
                    background: 'rgba(0, 180, 255, 0.06)',
                    bottom: '-80px', right: '-100px',
                    animationDelay: '-4s',
                }}
            />

            <div className="section-container" style={{ width: '100%' }}>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '60px',
                        alignItems: 'center',
                    }}
                    className="hero-grid"
                >
                    {/* Left — Text content */}
                    <div>
                        {/* Tag */}
                        <div className="badge animate-fade-down" style={{ marginBottom: '28px' }}>
                            <Eye size={11} />
                            Computer Vision Platform
                        </div>

                        {/* Headline */}
                        <h1
                            className="animate-fade-up"
                            style={{
                                fontSize: 'clamp(2.6rem, 5vw, 4rem)',
                                fontWeight: 800,
                                color: 'var(--clr-text)',
                                marginBottom: '8px',
                            }}
                        >
                            Precision in
                        </h1>
                        <h1
                            className="gradient-text animate-fade-up delay-100"
                            style={{
                                fontSize: 'clamp(2.6rem, 5vw, 4rem)',
                                fontWeight: 800,
                                marginBottom: '24px',
                            }}
                        >
                            Every Pixel.
                        </h1>

                        {/* Sub */}
                        <p
                            className="animate-fade-up delay-200"
                            style={{
                                fontSize: '1.05rem',
                                color: 'var(--clr-text-muted)',
                                lineHeight: 1.75,
                                maxWidth: '440px',
                                marginBottom: '36px',
                            }}
                        >
                            Automated real-world object measurement using computer vision + homography.
                            Point your camera at any object — get millimeter-level dimensions instantly.
                        </p>

                        {/* Actions */}
                        <div className="animate-fade-up delay-300" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <Link to="/demo" className="btn-primary animate-pulse-glow" id="hero-start-demo-btn">
                                <Play size={15} strokeWidth={2.5} />
                                Try Demo Free
                            </Link>
                            <a href="#features" className="btn-secondary" id="hero-learn-more-btn">
                                See How It Works
                                <ArrowRight size={15} />
                            </a>
                        </div>

                        {/* Trust badges */}
                        <div
                            className="animate-fade-up delay-500"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '24px',
                                marginTop: '40px',
                                flexWrap: 'wrap',
                            }}
                        >
                            {[
                                { icon: Ruler, text: '±1-5mm Line Accuracy' },
                                { icon: Layers, text: 'No hardware needed' },
                                { icon: Eye, text: 'OpenCV powered' },
                            ].map(({ icon: Icon, text }) => (
                                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                    <Icon size={14} color="var(--clr-accent)" />
                                    <span style={{ fontSize: '0.82rem', color: 'var(--clr-text-muted)' }}>{text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right — CV Preview Card */}
                    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                        <CvPreviewCard />

                        {/* Floating badges */}
                        <MetricBadge
                            className="badge-precision"
                            label="Manual Error"
                            value="±1-5"
                            unit="mm"
                            secondaryLabel="Auto Error"
                            secondaryValue="±1-1.5"
                            secondaryUnit="cm"
                            style={{ bottom: '-50px', right: '-70px', zIndex: 10 }}
                        />
                        <MetricBadge
                            className="badge-scale"
                            label="Fixed Scale"
                            value="2.3"
                            unit="px/mm"
                            style={{ top: '-40px', left: '-20px', zIndex: 10 }}
                        />
                    </div>
                </div>

                {/* Scroll indicator */}
                <div
                    className="animate-fade-in delay-800"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        marginTop: '64px',
                    }}
                >
                    <span style={{ fontSize: '0.72rem', color: 'var(--clr-text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                        Scroll to explore
                    </span>
                    <div
                        style={{
                            width: '1px',
                            height: '48px',
                            background: 'linear-gradient(to bottom, var(--clr-accent), transparent)',
                            animation: 'float 2s ease-in-out infinite',
                        }}
                    />
                </div>
            </div>

            {/* Mobile responsive override */}
            <style>{`
        @media (max-width: 900px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
            text-align: center;
          }
          .hero-grid > div:first-child > *:not(:last-child) {
            margin-left: auto;
            margin-right: auto;
          }
          .hero-grid > div:first-child .btn-primary,
          .hero-grid > div:first-child .btn-secondary {
            text-align: center;
          }
          .hero-grid > div:last-child {
            display: flex;
            justify-content: center;
          }
          /* Responsive positioning for swapped badges */
          .badge-precision {
            right: -10px !important;
            bottom: -30px !important;
          }
          .badge-scale {
            left: -10px !important;
            top: -20px !important;
          }
        }
        @media (max-width: 480px) {
          .badge-precision {
            right: 0 !important;
            bottom: -20px !important;
            transform: scale(0.9);
          }
          .badge-scale {
            left: 0 !important;
            top: -15px !important;
            transform: scale(0.9);
          }
        }
      `}</style>
        </section>
    )
}
