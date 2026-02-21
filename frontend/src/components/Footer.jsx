import { Link } from 'react-router-dom'
import { Zap, Github, ExternalLink, Heart } from 'lucide-react'

const footerLinks = {
    Product: [
        { label: 'Features', href: '#features' },
        { label: 'How It Works', href: '#how-it-works' },
        { label: 'Use Cases', href: '#use-cases' },
        { label: 'Demo', href: '/demo', isRoute: true },
    ],
    Platform: [
        { label: 'Roadmap', href: '#roadmap' },
        { label: 'Phase 2 Preview', href: '#cta' },
        { label: 'API Docs', href: '#' },
        { label: 'Sign In', href: '/auth', isRoute: true },
    ],
    Technology: [
        { label: 'OpenCV', href: 'https://opencv.org', external: true },
        { label: 'FastAPI', href: 'https://fastapi.tiangolo.com', external: true },
        { label: 'React + Vite', href: 'https://vitejs.dev', external: true },
        { label: 'Python 3.10+', href: 'https://python.org', external: true },
    ],
}

export default function Footer() {
    return (
        <footer
            style={{
                borderTop: '1px solid var(--clr-border)',
                background: 'var(--clr-bg2)',
                paddingTop: '60px',
                paddingBottom: '32px',
            }}
        >
            <div className="section-container">
                {/* Top grid */}
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1.6fr 1fr 1fr 1fr',
                        gap: '40px',
                        marginBottom: '48px',
                    }}
                    className="footer-grid"
                >
                    {/* Brand column */}
                    <div>
                        {/* Logo */}
                        <Link
                            to="/"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '16px' }}
                        >
                            <img
                                src="/assets/favicon/favicon.png"
                                alt="VisionMetrix"
                                style={{
                                    width: '42px',
                                    height: '42px',
                                    objectFit: 'contain',
                                    borderRadius: '6px',
                                    transform: 'translateY(1px)',
                                }}
                            />
                            <span
                                style={{
                                    fontFamily: 'var(--font-display)',
                                    fontWeight: 700,
                                    fontSize: '1rem',
                                    color: 'var(--clr-text)',
                                }}
                            >
                                VisionMetrix
                            </span>
                        </Link>

                        <p style={{ fontSize: '0.87rem', color: 'var(--clr-text-muted)', lineHeight: 1.75, maxWidth: '260px', marginBottom: '20px' }}>
                            A vision-based measurement & analytics platform. Precision computer
                            vision for every industry.
                        </p>

                        {/* GitHub */}
                        <a
                            href="https://github.com"
                            target="_blank"
                            rel="noreferrer"
                            id="footer-github-btn"
                            className="btn-secondary"
                            style={{ padding: '7px 14px', fontSize: '0.8rem', width: 'fit-content' }}
                        >
                            <Github size={14} />
                            GitHub Project
                            <ExternalLink size={11} />
                        </a>
                    </div>

                    {/* Link columns */}
                    {Object.entries(footerLinks).map(([category, links]) => (
                        <div key={category}>
                            <h4
                                style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    color: 'var(--clr-text)',
                                    letterSpacing: '0.1em',
                                    textTransform: 'uppercase',
                                    marginBottom: '16px',
                                }}
                            >
                                {category}
                            </h4>
                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {links.map(({ label, href, isRoute, external }) => (
                                    <li key={label}>
                                        {isRoute ? (
                                            <Link to={href} className="footer-link">
                                                {label}
                                            </Link>
                                        ) : external ? (
                                            <a href={href} className="footer-link" target="_blank" rel="noreferrer">
                                                {label}
                                            </a>
                                        ) : (
                                            <a href={href} className="footer-link">
                                                {label}
                                            </a>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Divider */}
                <div className="h-divider" style={{ marginBottom: '24px' }} />

                {/* Bottom bar */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px',
                    }}
                >
                    <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-faint)' }}>
                        © 2026 VisionMetrix · Built with
                        {' '}<Heart size={11} color="#ff5f56" style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} />{' '}
                        and OpenCV
                    </span>

                    {/* Phase status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div
                            style={{
                                width: '7px', height: '7px', borderRadius: '50%',
                                background: '#00e6b4',
                                boxShadow: '0 0 6px #00e6b480',
                                animation: 'pulse-glow 2s ease-in-out infinite',
                            }}
                        />
                        <span style={{ fontSize: '0.78rem', color: 'var(--clr-text-faint)' }}>
                            Phase 1 Active · Phase 2 in Development
                        </span>
                    </div>
                </div>
            </div>

            <style>{`
        @media (max-width: 900px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 32px !important;
          }
        }
        @media (max-width: 560px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
        </footer>
    )
}
