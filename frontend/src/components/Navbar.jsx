import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Zap, Sun, Moon } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    const onScroll = () => {
      // Robust scroll detection across different browsers and layout modes
      const scrollPos = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
      setScrolled(scrollPos > 10)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll() // Initial check

    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navLinks = [
    { label: 'Product', href: '#features' },
    { label: 'Solutions', href: '#use-cases' },
    { label: 'How It Works', href: '#how-it-works' },
    // { label: 'Roadmap', href: '#roadmap' },
  ]

  const isDark = theme === 'dark'

  return (
    <header
      className={`navbar ${scrolled ? 'scrolled' : ''}`}
      style={{
        transition: 'all 0.3s ease',
        zIndex: 1000,
      }}
    >
      <div className="section-container">
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: scrolled ? '64px' : '76px', // Smoother height transition
            transition: 'height 0.3s ease',
          }}
        >
          {/* ── Logo ──────────────────────────────── */}
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
            }}
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
                fontSize: '1.25rem',
                color: 'var(--clr-text)',
                letterSpacing: '-0.02em',
                transition: 'color 0.35s ease',
              }}
            >
              VisionMetrix
            </span>
          </Link>

          {/* ── Desktop Nav links ─────────────────── */}
          <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} className="nav-link">
                {link.label}
              </a>
            ))}
          </div>

          {/* ── Right side: toggle + CTAs ─────────── */}
          <div className="nav-cta" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

            {/* Theme toggle button */}
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />

            {/* <Link to="/auth" className="btn-ghost" id="nav-signin-btn">
              Sign In
            </Link> */}
            <Link
              to="/demo"
              className="btn-primary"
              id="nav-demo-btn"
              style={{ padding: '8px 20px', fontSize: '0.85rem' }}
            >
              Start Demo
            </Link>
          </div>

          {/* ── Mobile hamburger ──────────────────── */}
          <div className="mobile-actions" style={{ display: 'none', alignItems: 'center', gap: '8px' }}>
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--clr-text)',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              id="mobile-menu-btn"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </nav>

        {/* ── Mobile menu drawer ──────────────────── */}
        {menuOpen && (
          <div
            className="glass"
            style={{
              borderRadius: '12px',
              padding: '16px',
              marginTop: '8px',
              marginBottom: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  padding: '10px 12px',
                  fontSize: '0.9rem',
                  color: 'var(--clr-text-muted)',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  transition: 'all 0.2s',
                }}
              >
                {link.label}
              </a>
            ))}
            <div style={{ height: '1px', background: 'var(--clr-border)', margin: '8px 0' }} />
            <Link
              to="/auth"
              className="btn-ghost"
              onClick={() => setMenuOpen(false)}
              style={{ justifyContent: 'center' }}
            >
              Sign In
            </Link>
            <Link
              to="/demo"
              className="btn-primary"
              onClick={() => setMenuOpen(false)}
              style={{ justifyContent: 'center' }}
            >
              Start Demo
            </Link>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .nav-cta { display: none !important; }
          .mobile-actions { display: flex !important; }
        }
      `}</style>
    </header>
  )
}

/* ── Theme Toggle Component (Icon Only) ─────────────────────────────────────── */
function ThemeToggle({ isDark, onToggle }) {
  return (
    <button
      onClick={onToggle}
      id="theme-toggle-btn"
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        color: isDark ? 'var(--clr-accent)' : '#5a6a7e',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)'
        e.currentTarget.style.background = isDark ? 'rgba(0, 230, 180, 0.1)' : 'rgba(0, 158, 122, 0.1)'
        e.currentTarget.style.borderColor = 'var(--clr-accent)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'
        e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isDark ? 'rotate(0deg)' : 'rotate(360deg)',
        }}
      >
        {isDark ? (
          <Moon size={20} strokeWidth={2} />
        ) : (
          <Sun size={20} strokeWidth={2} />
        )}
      </div>
    </button>
  )
}
