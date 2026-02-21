import { useRef, useState, useEffect, useCallback } from 'react'
import {
  Camera, Crosshair, Ruler, Layers, RefreshCw,
  CheckCircle2, Loader2, ArrowLeft, ZapOff, Trash2,
  Play, Square, Info, AlertTriangle, Eye
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  detectA4, autoMeasure, manualDistance, manualPolygon,
  getOrCreateSessionId, captureCanvasBlob, getWarpedFrameUrl,
  UNITS,
} from '../utils/api'
import { useTheme } from '../context/ThemeContext'
import MeasurementCanvas from './MeasurementCanvas'
import ResultsPanel from './ResultsPanel'

/* ── Constants ─────────────────────────────────────────── */
const MODES = { AUTO: 'auto', DISTANCE: 'distance', POLYGON: 'polygon' }
const MODE_META = {
  [MODES.AUTO]: { icon: Crosshair, label: 'Auto Detect', color: 'var(--clr-accent)' },
  [MODES.DISTANCE]: { icon: Ruler, label: 'Line Mode', color: '#00b4ff' },
  [MODES.POLYGON]: { icon: Layers, label: 'Polygon Mode', color: '#a855f7' },
}

/* ══════════════════════════════════════════════════════════ */
export default function DemoPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const sessionId = getOrCreateSessionId()

  /* camera */
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState(null)

  /* calibration + manual view */
  const [mode, setMode] = useState(MODES.AUTO)
  const [calibrated, setCalibrated] = useState(false)
  const [mmPerPixel, setMmPerPixel] = useState(null)
  const [warpedUrl, setWarpedUrl] = useState(null)

  /* ui */
  const [unit, setUnit] = useState('mm')         // user unit preference
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [clickPoints, setClickPoints] = useState([])

  /* in manual mode show the warped snapshot instead of live video */
  const showWarped = mode !== MODES.AUTO && calibrated && warpedUrl

  /* ── Camera ──────────────────────────────────────────── */
  const startCamera = useCallback(async () => {
    setCameraError(null)
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: 'environment' },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraActive(true)
    } catch (e) {
      setCameraError(
        e.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser and try again.'
          : `Camera error: ${e.message}`
      )
    }
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraActive(false)
  }, [])

  /* Cleanup only on unmount — no auto-start */
  useEffect(() => {
    return () => {
      stopCamera()
      if (warpedUrl) URL.revokeObjectURL(warpedUrl)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Capture frame ───────────────────────────────────── */
  const captureFrame = useCallback(async () => {
    if (!videoRef.current || !cameraActive)
      throw new Error('Camera is not active.')
    return captureCanvasBlob(videoRef.current)
  }, [cameraActive])

  /* ── Step 1: Detect A4 ───────────────────────────────── */
  const handleCalibrate = async () => {
    setError(null)
    setLoading(true)
    setLoadingMsg('Detecting A4 sheet…')
    try {
      const blob = await captureFrame()
      const res = await detectA4(sessionId, blob)
      if (warpedUrl) URL.revokeObjectURL(warpedUrl)
      const newUrl = await getWarpedFrameUrl(sessionId)
      setMmPerPixel(res.mm_per_pixel)
      setCalibrated(true)
      setWarpedUrl(newUrl)
      setResult({ type: 'calibration', ...res })
      setClickPoints([])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  /* ── Step 2a: Auto Detect Objects ─────────────────────── */
  const handleAutoMeasure = async () => {
    setError(null)
    setLoading(true)
    setLoadingMsg('Detecting all objects…')
    try {
      const blob = await captureFrame()
      const res = await autoMeasure(sessionId, blob)
      // res = { objects: [...], count: N, selected_id: 0 }
      const first = res.objects?.[0] || {}
      setResult({
        type: 'auto',
        objects: res.objects || [],
        selected_id: 0,
        warped_b64: res.warped_b64, // exact frame used for detection
        ...first,   // flat fields from initial selection
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  /* ── Object selection in auto mode ──────────────────────── */
  const handleObjectSelect = useCallback((id) => {
    setResult(prev => {
      if (!prev?.objects) return prev
      const obj = prev.objects[id]
      if (!obj) return prev
      return { ...prev, selected_id: id, ...obj }
    })
  }, [])


  /* ── Step 2b/c: Manual (canvas clicks) ──────────────── */
  const handleCanvasPoints = useCallback(async (scaledPoints) => {
    if (!calibrated) {
      setError('Calibrate first — click "Detect A4" with A4 sheet in view.')
      return
    }
    setError(null)
    setLoading(true)
    setLoadingMsg('Computing measurement…')
    try {
      if (mode === MODES.DISTANCE && scaledPoints.length === 2) {
        const res = await manualDistance(sessionId, scaledPoints)
        setResult({ type: 'distance', ...res, points: scaledPoints })
      } else if (mode === MODES.POLYGON && scaledPoints.length >= 3) {
        const res = await manualPolygon(sessionId, scaledPoints)
        setResult({ type: 'polygon', ...res, points: scaledPoints })
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [calibrated, mode, sessionId])

  /* ── Reset ───────────────────────────────────────────── */
  const resetSession = () => {
    setResult(null); setClickPoints([]); setError(null)
    setCalibrated(false); setMmPerPixel(null)
    if (warpedUrl) URL.revokeObjectURL(warpedUrl)
    setWarpedUrl(null); setMode(MODES.AUTO)
    sessionStorage.removeItem('vm_session_id')
  }

  const switchMode = (m) => {
    setMode(m); setClickPoints([]); setResult(null); setError(null)
  }

  /* ── Hint text ───────────────────────────────────────── */
  const hintText = (() => {
    if (!cameraActive) return 'Click "Start Camera" to begin.'
    if (!calibrated) return 'STEP 1 — Place A4 in portrait (tall) orientation, all corners visible, then click "Detect A4".'
    if (mode === MODES.AUTO) return 'STEP 2 — Place your object on A4, then click "Auto Detect Object".'
    if (mode === MODES.DISTANCE) {
      if (clickPoints.length === 0) return 'Line Mode — click first point on the warped A4 image.'
      if (clickPoints.length === 1) return 'Line Mode — click second point to measure distance.'
      if (result?.type === 'distance') return `✓ ${clickPoints.length === 2 ? `Measured! Click anywhere to draw a new line.` : 'New line started.'}`
      return 'Measuring…'
    }
    if (mode === MODES.POLYGON) {
      if (clickPoints.length === 0) return 'Polygon Mode — click to place first point.'
      if (clickPoints.length < 3) return `Polygon Mode — ${clickPoints.length} pt${clickPoints.length > 1 ? 's' : ''} placed. Need at least 3. Keep clicking.`
      if (result?.type === 'polygon') return '✓ Polygon measured! Click anywhere to start a new polygon.'
      return `${clickPoints.length} points placed — click "Measure Polygon" or keep adding points.`
    }
    return ''
  })()


  /* ════════════════════ RENDER ════════════════════════════ */
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--clr-bg)',
      color: 'var(--clr-text)',
      fontFamily: 'var(--font-sans)',
      transition: 'background 0.35s ease, color 0.35s ease',
    }}>

      {/* ── Top Bar ──────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--clr-navbar-scrolled)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--clr-border)',
        padding: '0 24px', height: '60px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', color: 'var(--clr-text-muted)' }}>
            <ArrowLeft size={16} /><span style={{ fontSize: '0.85rem' }}>Home</span>
          </Link>
          <div style={{ width: 1, height: 18, background: 'var(--clr-border)' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem' }}>
            VisionMetrix <span className="gradient-text">Demo</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Unit selector */}
          <div style={{ display: 'flex', background: 'var(--clr-bg)', border: '1px solid var(--clr-border)', borderRadius: '7px', padding: '2px', gap: '2px' }}>
            {UNITS.map((u) => (
              <button key={u} onClick={() => setUnit(u)} style={{
                padding: '3px 9px', borderRadius: '5px', border: 'none',
                cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                background: unit === u ? 'var(--clr-surface2)' : 'transparent',
                color: unit === u ? 'var(--clr-accent)' : 'var(--clr-text-faint)',
                outline: unit === u ? '1px solid rgba(0,230,180,0.3)' : 'none',
                transition: 'all 0.15s',
              }}>
                {u === 'in' ? 'inch' : u}
              </button>
            ))}
          </div>

          {calibrated ? (
            <span style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              fontSize: '0.74rem', color: '#22c55e',
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
              borderRadius: '99px', padding: '3px 10px',
            }}>
              <CheckCircle2 size={11} /> Calibrated · {mmPerPixel?.toFixed(4)} mm/px
            </span>
          ) : (
            <span style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              fontSize: '0.74rem', color: 'var(--clr-text-faint)',
              background: 'var(--clr-surface)', border: '1px solid var(--clr-border)',
              borderRadius: '99px', padding: '3px 10px',
            }}>
              <ZapOff size={11} /> Not calibrated
            </span>
          )}

          <button onClick={resetSession} className="btn-ghost"
            style={{ padding: '5px 10px', fontSize: '0.78rem' }}>
            <Trash2 size={12} /> Reset
          </button>
        </div>
      </header>

      {/* ── Two-column layout ─────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', height: 'calc(100vh - 60px)' }} className="demo-layout">

        {/* ════ LEFT PANEL ══════════════════════════════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* ── Toolbar ──────────────────────────────────── */}
          <div style={{
            padding: '10px 16px', borderBottom: '1px solid var(--clr-border)',
            background: 'var(--clr-surface)',
            display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
          }}>

            {/* Camera start/stop */}
            {cameraActive ? (
              <button onClick={stopCamera} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#ef4444', borderRadius: '8px', padding: '6px 12px',
                cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500, whiteSpace: 'nowrap',
              }}>
                <Square size={11} fill="#ef4444" /> Stop Camera
              </button>
            ) : (
              <button onClick={startCamera} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'rgba(0,230,180,0.1)', border: '1px solid rgba(0,230,180,0.3)',
                color: 'var(--clr-accent)', borderRadius: '8px', padding: '6px 12px',
                cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500, whiteSpace: 'nowrap',
              }}>
                <Camera size={13} /> Start Camera
              </button>
            )}

            <div style={{ width: 1, height: 20, background: 'var(--clr-border)', flexShrink: 0 }} />

            {/* Mode pills */}
            <div style={{
              display: 'flex', background: 'var(--clr-bg)',
              borderRadius: '8px', padding: '3px',
              border: '1px solid var(--clr-border)', gap: '2px',
            }}>
              {Object.entries(MODE_META).map(([id, { icon: Icon, label }]) => (
                <button key={id} onClick={() => switchMode(id)} style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '5px 11px', borderRadius: '6px', border: 'none',
                  cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, whiteSpace: 'nowrap',
                  background: mode === id ? 'var(--clr-surface2)' : 'transparent',
                  color: mode === id ? 'var(--clr-text)' : 'var(--clr-text-muted)',
                  outline: mode === id ? `1.5px solid ${MODE_META[id].color}` : 'none',
                  transition: 'all 0.2s',
                }}>
                  <Icon size={12} /> {label}
                </button>
              ))}
            </div>

            {/* Action buttons */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={handleCalibrate}
                disabled={loading || !cameraActive}
                className="btn-secondary"
                style={{
                  padding: '6px 14px', fontSize: '0.82rem', gap: '6px', whiteSpace: 'nowrap',
                  opacity: (!cameraActive || loading) ? 0.45 : 1
                }}
              >
                <RefreshCw size={12} style={loading && loadingMsg.includes('A4') ? { animation: 'spin 1s linear infinite' } : {}} />
                Detect A4
              </button>

              {mode === MODES.AUTO && (
                <button
                  onClick={handleAutoMeasure}
                  disabled={loading || !calibrated || !cameraActive}
                  className="btn-primary"
                  style={{
                    padding: '6px 16px', fontSize: '0.82rem', gap: '6px', whiteSpace: 'nowrap',
                    opacity: (!calibrated || !cameraActive || loading) ? 0.45 : 1
                  }}
                >
                  {loading && loadingMsg.includes('object')
                    ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                    : <Play size={12} />}
                  Auto Detect Object
                </button>
              )}

              {mode !== MODES.AUTO && calibrated && warpedUrl && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  fontSize: '0.75rem', color: '#00b4ff',
                  background: 'rgba(0,180,255,0.1)', border: '1px solid rgba(0,180,255,0.3)',
                  borderRadius: '8px', padding: '5px 10px',
                }}>
                  <Eye size={12} /> Warped View
                </div>
              )}
            </div>
          </div>

          {/* ── Viewport ─────────────────────────────────── */}
          <div style={{
            flex: 1, position: 'relative', overflow: 'hidden',
            background: isDark ? '#050810' : '#dde4ee',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>

            {/* Live video */}
            <video
              ref={videoRef} muted playsInline
              style={{
                width: '100%', height: '100%', objectFit: 'contain',
                display: cameraActive ? 'block' : 'none',
                opacity: showWarped ? 0 : 1,
                transition: 'opacity 0.3s ease',
              }}
            />

            {/* Canvas — transparent overlay (auto) or warped image (manual) */}
            {(cameraActive || showWarped) && (
              <MeasurementCanvas
                mode={mode}
                points={clickPoints}
                onPointsChange={setClickPoints}
                onMeasure={handleCanvasPoints}
                onObjectSelect={handleObjectSelect}
                result={result}
                warpedSrc={mode !== MODES.AUTO
                  ? warpedUrl
                  : result?.objects?.length ? (result.warped_b64 || warpedUrl) : null}
                unit={unit}
              />
            )}

            {/* A4 placement guide (camera on, not yet calibrated) */}
            {cameraActive && !calibrated && !loading && mode === MODES.AUTO && (
              <A4PlacementGuide />
            )}

            {/* Scan line */}
            {cameraActive && mode === MODES.AUTO && !loading && <div className="scan-line" />}

            {/* Placeholders */}
            {!cameraActive && !cameraError && (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <Camera size={48} color="var(--clr-text-faint)" style={{ marginBottom: '16px' }} />
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem', color: 'var(--clr-text-muted)', marginBottom: '8px' }}>
                  Camera not started
                </p>
                <p style={{ fontSize: '0.84rem', color: 'var(--clr-text-faint)', marginBottom: '20px' }}>
                  Click "Start Camera" in the toolbar above to begin
                </p>
                <button onClick={startCamera} className="btn-primary">
                  <Camera size={14} /> Start Camera
                </button>
              </div>
            )}

            {!cameraActive && cameraError && (
              <div style={{ textAlign: 'center', padding: '40px', maxWidth: '420px' }}>
                <AlertTriangle size={44} color="#fbbf24" style={{ marginBottom: '16px' }} />
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1rem', color: 'var(--clr-text)', marginBottom: '10px' }}>
                  Camera unavailable
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
                  {cameraError}
                </p>
                <button onClick={startCamera} className="btn-primary" style={{ fontSize: '0.85rem' }}>
                  <RefreshCw size={13} /> Retry Camera
                </button>
              </div>
            )}

            {/* Loading overlay */}
            {loading && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.52)',
                backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '12px',
              }}>
                <Loader2 size={36} color="var(--clr-accent)" style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 500 }}>{loadingMsg}</span>
              </div>
            )}
          </div>

          {/* ── Hint bar ─────────────────────────────────── */}
          <div style={{
            padding: '7px 16px', background: 'var(--clr-surface)',
            borderTop: '1px solid var(--clr-border)',
            display: 'flex', alignItems: 'center', gap: '8px', minHeight: '34px',
          }}>
            <Info size={11} color="var(--clr-accent)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.76rem', color: 'var(--clr-text-faint)', flex: 1 }}>{hintText}</span>
            {clickPoints.length > 0 && (
              <button onClick={() => { setClickPoints([]); setResult(null) }} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--clr-text-faint)',
                display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.74rem', whiteSpace: 'nowrap',
              }}>
                <Trash2 size={10} /> Clear points
              </button>
            )}
          </div>
        </div>

        {/* ════ RIGHT PANEL ══════════════════════════════════ */}
        <ResultsPanel
          result={result}
          error={error}
          loading={loading}
          mode={mode}
          calibrated={calibrated}
          mmPerPixel={mmPerPixel}
          sessionId={sessionId}
          clickPoints={clickPoints}
          unit={unit}
          onClearError={() => setError(null)}
          onObjectSelect={handleObjectSelect}
        />
      </div>

      <style>{`
        @media (max-width: 900px) {
          .demo-layout {
            grid-template-columns: 1fr !important;
            grid-template-rows: auto auto;
            height: auto !important;
          }
        }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
      `}</style>
    </div>
  )
}

/* ── A4 Placement Guide overlay ──────────────────────── */
function A4PlacementGuide() {
  const A4_W = 180, A4_H = Math.round(180 * 297 / 210)  // portrait px sizes for guide

  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '14px',
    }}>
      {/* A4 rectangle visual */}
      <div style={{ position: 'relative' }}>
        {/* Width label (top) */}
        <div style={{
          position: 'absolute', top: '-22px', left: '50%', transform: 'translateX(-50%)',
          fontSize: '0.68rem', color: '#00e6b4', fontWeight: 700,
          whiteSpace: 'nowrap', letterSpacing: '0.04em',
          textShadow: '0 0 8px rgba(0,0,0,0.8)',
        }}>
          ←— 210 mm —→
        </div>

        {/* A4 box */}
        <div style={{
          width: A4_W, height: A4_H,
          border: '2px dashed rgba(0,230,180,0.65)',
          borderRadius: '3px',
          background: 'rgba(0,230,180,0.04)',
          position: 'relative',
          animation: 'float 3s ease-in-out infinite',
        }}>
          {/* Corner marks */}
          {[['0%', '0%'], ['0%', '100%'], ['100%', '0%'], ['100%', '100%']].map(([t, l], i) => (
            <div key={i} style={{
              position: 'absolute', top: t, left: l,
              width: 10, height: 10,
              borderTop: i < 2 ? '2px solid #00e6b4' : 'none',
              borderBottom: i >= 2 ? '2px solid #00e6b4' : 'none',
              borderLeft: i % 2 === 0 ? '2px solid #00e6b4' : 'none',
              borderRight: i % 2 === 1 ? '2px solid #00e6b4' : 'none',
              transform: `translate(${i % 2 === 1 ? '-100%' : '0'}, ${i < 2 ? '0' : '-100%'})`,
            }} />
          ))}

          {/* Object placeholder inside A4 */}
          <div style={{
            position: 'absolute', inset: '20px',
            border: '1px dashed rgba(255,200,100,0.4)',
            borderRadius: '2px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '0.62rem', color: 'rgba(255,200,100,0.8)', textAlign: 'center', lineHeight: 1.4 }}>
              📦 place<br />object<br />here
            </span>
          </div>
        </div>

        {/* Height label (right) */}
        <div style={{
          position: 'absolute', top: '50%', right: '-58px',
          transform: 'translateY(-50%) rotate(90deg)',
          fontSize: '0.68rem', color: '#00e6b4', fontWeight: 700,
          whiteSpace: 'nowrap', textShadow: '0 0 8px rgba(0,0,0,0.8)',
        }}>
          ←— 297 mm —→
        </div>
      </div>

      {/* Instruction pill */}
      <div style={{
        background: 'rgba(5,8,16,0.72)', color: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(0,230,180,0.2)',
        borderRadius: '8px', padding: '7px 16px',
        fontSize: '0.76rem', textAlign: 'center', lineHeight: 1.6,
        maxWidth: '280px',
      }}>
        Hold A4 in <b style={{ color: '#00e6b4' }}>portrait</b> (tall) orientation.<br />
        All 4 corners must be visible. → click <b>"Detect A4"</b>
      </div>
    </div>
  )
}
