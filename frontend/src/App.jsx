import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import LandingPage from './pages/LandingPage'
import DemoPage from './components/DemoPage'

/* ── Stub page for future phases ── */
function StubPage({ title, note }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--clr-bg)',
        color: 'var(--clr-text)',
        fontFamily: 'var(--font-display)',
        transition: 'background 0.35s ease, color 0.35s ease',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontSize: '0.75rem',
            color: 'var(--clr-accent)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: '12px',
          }}
        >
          Coming in Phase 2
        </div>
        <h1 style={{ fontSize: '2rem', marginBottom: '12px' }}>{title}</h1>
        <p style={{ color: 'var(--clr-text-muted)', marginBottom: '24px', maxWidth: '360px' }}>
          {note}
        </p>
        <a href="/" className="btn-primary">← Back to Home</a>
      </div>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route
            path="/auth"
            element={
              <StubPage
                title="Sign In"
                note="Authentication will be available with Phase 2 platform launch."
              />
            }
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
