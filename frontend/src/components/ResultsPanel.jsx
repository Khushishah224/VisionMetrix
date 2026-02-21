import { AlertCircle, CheckCircle2, Loader2, Ruler, Layers, Crosshair, Info } from 'lucide-react'
import { fmtLen, fmtArea } from '../utils/api'

/**
 * ResultsPanel — right sidebar showing:
 *  - How-to guide
 *  - Loading spinner
 *  - Error display
 *  - Measurement results
 */
export default function ResultsPanel({
    result, error, loading, mode, calibrated,
    mmPerPixel, sessionId, clickPoints, unit = 'mm', onClearError, onObjectSelect,
}) {
    return (
        <aside style={{
            borderLeft: '1px solid var(--clr-border)',
            background: 'var(--clr-surface)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
        }}>
            {/* Header */}
            <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--clr-border)',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '0.9rem',
                color: 'var(--clr-text)',
                display: 'flex', alignItems: 'center', gap: '8px',
            }}>
                <div style={{
                    width: 24, height: 24, borderRadius: '6px',
                    background: 'rgba(0,230,180,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Ruler size={13} color="var(--clr-accent)" />
                </div>
                Results
            </div>

            {/* Scrollable body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

                {/* ── Loading ─────────────────────────────── */}
                {loading && (
                    <div style={{
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        padding: '40px 20px', gap: '12px',
                    }}>
                        <Loader2 size={28} color="var(--clr-accent)"
                            style={{ animation: 'spin 1s linear infinite' }} />
                        <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>
                            Processing…
                        </span>
                    </div>
                )}

                {/* ── Error ────────────────────────────────── */}
                {!loading && error && (
                    <div style={{
                        background: 'rgba(239,68,68,0.08)',
                        border: '1px solid rgba(239,68,68,0.25)',
                        borderRadius: '10px',
                        padding: '14px',
                        marginBottom: '14px',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                            <AlertCircle size={15} color="#ef4444" style={{ flexShrink: 0, marginTop: '1px' }} />
                            <div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ef4444', marginBottom: '4px' }}>
                                    Error
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', lineHeight: 1.5 }}>
                                    {error}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClearError}
                            style={{
                                marginTop: '10px', background: 'none', border: '1px solid rgba(239,68,68,0.3)',
                                color: '#ef4444', borderRadius: '6px', padding: '4px 10px',
                                fontSize: '0.75rem', cursor: 'pointer', width: '100%',
                            }}
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {/* ── Result: Calibration ──────────────────── */}
                {!loading && result?.type === 'calibration' && (
                    <ResultCard
                        icon={CheckCircle2}
                        iconColor="#22c55e"
                        title="A4 Detected ✓"
                        color="rgba(34,197,94,0.1)"
                        borderColor="rgba(34,197,94,0.25)"
                    >
                        <MetricRow label="Scale" value={`${result.mm_per_pixel?.toFixed(4)} mm/px`} accent="#22c55e" />
                        <MetricRow label="Session" value={sessionId} mono />
                        <div style={{ marginTop: '10px', padding: '8px 10px', borderRadius: '6px', background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)', fontSize: '0.78rem', color: 'var(--clr-text-muted)', lineHeight: 1.5 }}>
                            ✅ Perspective corrected. Now choose a measurement mode and measure your object.
                        </div>
                    </ResultCard>
                )}

                {/* ── Result: Auto Detect (multi-object) ───── */}
                {!loading && result?.type === 'auto' && result.objects?.length > 0 && (() => {
                    const selId = result.selected_id ?? 0
                    const selObj = result.objects[selId] || result.objects[0]
                    return (
                        <ResultCard
                            icon={Crosshair}
                            iconColor="var(--clr-accent)"
                            title={`${result.objects.length} Object${result.objects.length !== 1 ? 's' : ''} Detected`}
                            color="rgba(0,230,180,0.07)"
                            borderColor="rgba(0,230,180,0.2)"
                        >
                            {/* Object selector badges */}
                            {result.objects.length > 1 && (
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px', alignItems: 'center' }}>
                                    {result.objects.map((obj, i) => {
                                        const isSel = i === selId
                                        return (
                                            <button key={i}
                                                onClick={() => onObjectSelect?.(i)}
                                                title={`${fmtLen(obj.width_mm, unit)} × ${fmtLen(obj.height_mm, unit)}`}
                                                style={{
                                                    width: 30, height: 30, borderRadius: '50%',
                                                    border: `2px solid ${isSel ? 'var(--clr-accent)' : 'rgba(0,230,180,0.3)'}`,
                                                    background: isSel ? 'var(--clr-accent)' : 'rgba(0,230,180,0.07)',
                                                    color: isSel ? '#060a14' : 'var(--clr-accent)',
                                                    fontWeight: 700, fontSize: '0.78rem',
                                                    cursor: 'pointer', transition: 'all 0.15s',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                }}
                                            >{i + 1}</button>
                                        )
                                    })}
                                    <span style={{ fontSize: '0.71rem', color: 'var(--clr-text-faint)' }}>
                                        tap to select
                                    </span>
                                </div>
                            )}

                            {/* Shape-type badge */}
                            {selObj.shape_type && (
                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                                    marginBottom: '10px', padding: '3px 10px', borderRadius: '20px',
                                    fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.03em',
                                    background: selObj.shape_type === 'circle'
                                        ? 'rgba(168,85,247,0.15)' : selObj.shape_type === 'ellipse'
                                            ? 'rgba(251,191,36,0.15)' : 'rgba(0,230,180,0.12)',
                                    color: selObj.shape_type === 'circle' ? '#c084fc'
                                        : selObj.shape_type === 'ellipse' ? '#fbbf24' : 'var(--clr-accent)',
                                    border: `1px solid ${selObj.shape_type === 'circle'
                                        ? 'rgba(168,85,247,0.3)' : selObj.shape_type === 'ellipse'
                                            ? 'rgba(251,191,36,0.3)' : 'rgba(0,230,180,0.25)'}`,
                                }}>
                                    {selObj.shape_type === 'circle' ? '⊙ Circle'
                                        : selObj.shape_type === 'ellipse' ? '⬭ Ellipse'
                                            : '⬡ Polygon'}
                                    {selObj.circularity != null && (
                                        <span style={{ opacity: 0.6, fontWeight: 400 }}>
                                            &nbsp;· circ {selObj.circularity}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Circle-specific metrics */}
                            {selObj.shape_type === 'circle' && (<>
                                <MetricRow label="Radius" value={fmtLen(selObj.radius_mm, unit)} accent="#c084fc" />
                                <MetricRow label="Diameter" value={fmtLen(selObj.diameter_mm, unit)} />
                                <MetricRow label="Circumference" value={fmtLen(selObj.circumference_mm, unit)} />
                                <MetricRow label="Area" value={fmtArea(selObj.area_mm2, unit)} />
                                <JSONBlock data={{
                                    shape: 'circle',
                                    radius: fmtLen(selObj.radius_mm, unit),
                                    diameter: fmtLen(selObj.diameter_mm, unit),
                                    circumference: fmtLen(selObj.circumference_mm, unit),
                                    area: fmtArea(selObj.area_mm2, unit),
                                }} />
                            </>)}

                            {/* Ellipse-specific metrics */}
                            {selObj.shape_type === 'ellipse' && (<>
                                <MetricRow label="Major axis" value={fmtLen(selObj.major_axis_mm, unit)} accent="#fbbf24" />
                                <MetricRow label="Minor axis" value={fmtLen(selObj.minor_axis_mm, unit)} />
                                <MetricRow label="Eccentricity" value={selObj.eccentricity?.toFixed(4)} />
                                <MetricRow label="Perimeter" value={fmtLen(selObj.perimeter_mm, unit)} />
                                <MetricRow label="Area" value={fmtArea(selObj.area_mm2, unit)} />
                                <JSONBlock data={{
                                    shape: 'ellipse',
                                    major_axis: fmtLen(selObj.major_axis_mm, unit),
                                    minor_axis: fmtLen(selObj.minor_axis_mm, unit),
                                    eccentricity: selObj.eccentricity,
                                    perimeter: fmtLen(selObj.perimeter_mm, unit),
                                    area: fmtArea(selObj.area_mm2, unit),
                                }} />
                            </>)}

                            {/* Polygon-specific metrics */}
                            {(!selObj.shape_type || selObj.shape_type === 'polygon') && (<>
                                <MetricRow label="Width (PCA)" value={fmtLen(selObj.width_mm, unit)} />
                                <MetricRow label="Height (PCA)" value={fmtLen(selObj.height_mm, unit)} />
                                <MetricRow label="Area" value={fmtArea(selObj.area_mm2, unit)} />
                                {selObj.angle_deg != null && (
                                    <MetricRow label="Rotation" value={`${selObj.angle_deg}°`} accent="var(--clr-text-muted)" />
                                )}
                                {selObj.polygon_points && (
                                    <MetricRow label="Polygon pts" value={selObj.polygon_points.length} />
                                )}
                                <JSONBlock data={{
                                    shape: 'polygon',
                                    width: fmtLen(selObj.width_mm, unit),
                                    height: fmtLen(selObj.height_mm, unit),
                                    area: fmtArea(selObj.area_mm2, unit),
                                    angle: `${selObj.angle_deg ?? '--'}°`,
                                    polygon_points: `[${selObj.polygon_points?.length} points]`,
                                }} />
                            </>)}
                        </ResultCard>
                    )
                })()}




                {/* ── Result: Manual Distance ──────────────── */}
                {!loading && result?.type === 'distance' && (
                    <ResultCard
                        icon={Ruler}
                        iconColor="#00b4ff"
                        title="Distance Measured"
                        color="rgba(0,180,255,0.07)"
                        borderColor="rgba(0,180,255,0.2)"
                    >
                        <div style={{
                            textAlign: 'center', padding: '16px 0',
                            fontFamily: 'var(--font-display)',
                        }}>
                            <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#00b4ff' }}>
                                {unit === 'mm'
                                    ? result.distance_mm?.toFixed(1)
                                    : unit === 'cm'
                                        ? (result.distance_mm / 10).toFixed(2)
                                        : (result.distance_mm / 25.4).toFixed(3)}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>
                                {unit === 'mm' ? 'millimeters' : unit === 'cm' ? 'centimeters' : 'inches'}
                            </div>
                        </div>
                        {/* Segment breakdown */}
                        <div style={{
                            background: 'rgba(0,180,255,0.06)',
                            border: '1px solid rgba(0,180,255,0.15)',
                            borderRadius: '6px', padding: '8px 10px',
                            display: 'flex', justifyContent: 'space-between',
                            fontSize: '0.8rem', fontWeight: 600,
                        }}>
                            <span style={{ color: 'var(--clr-text-muted)' }}>📏 Line segment</span>
                            <span style={{ color: '#00b4ff' }}>
                                {fmtLen(result.distance_mm, unit)}
                            </span>
                        </div>
                        {result.points && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-faint)', fontFamily: 'monospace', marginTop: '6px' }}>
                                P1: ({result.points[0]?.join(', ')}) · P2: ({result.points[1]?.join(', ')})
                            </div>
                        )}
                    </ResultCard>
                )}

                {/* ── Result: Manual Polygon ───────────────── */}
                {!loading && result?.type === 'polygon' && (
                    <ResultCard
                        icon={Layers}
                        iconColor="#a855f7"
                        title="Polygon Area"
                        color="rgba(168,85,247,0.07)"
                        borderColor="rgba(168,85,247,0.2)"
                    >
                        <div style={{
                            textAlign: 'center', padding: '16px 0',
                            fontFamily: 'var(--font-display)',
                        }}>
                            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#a855f7' }}>
                                {unit === 'mm'
                                    ? result.area_mm2?.toLocaleString()
                                    : unit === 'cm'
                                        ? (result.area_mm2 / 100).toFixed(2)
                                        : (result.area_mm2 / 645.16).toFixed(3)}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>
                                {unit === 'mm' ? 'mm² area' : unit === 'cm' ? 'cm² area' : 'in² area'}
                            </div>
                        </div>
                        <MetricRow label="Points used" value={result.points?.length} />

                        {/* Edge-by-edge length breakdown */}
                        {result.points && result.points.length >= 3 && (
                            <div style={{ marginTop: '10px' }}>
                                <div style={{
                                    fontSize: '0.72rem', fontWeight: 700,
                                    color: 'var(--clr-text-faint)', letterSpacing: '0.07em',
                                    textTransform: 'uppercase', marginBottom: '6px',
                                }}>
                                    Edge Lengths
                                </div>
                                {result.points.map((pt, i) => {
                                    const next = result.points[(i + 1) % result.points.length]
                                    const dx = next[0] - pt[0]   // warped px
                                    const dy = next[1] - pt[1]
                                    const mm = Math.hypot(dx, dy) * (210 / 800)
                                    return (
                                        <div key={i} style={{
                                            display: 'flex', justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '4px 8px',
                                            borderRadius: '5px',
                                            marginBottom: '3px',
                                            background: 'rgba(168,85,247,0.06)',
                                            fontSize: '0.78rem',
                                        }}>
                                            <span style={{ color: 'var(--clr-text-muted)' }}>
                                                Edge <span style={{ color: '#a855f7', fontWeight: 700 }}>{i + 1}</span> → <span style={{ color: '#a855f7', fontWeight: 700 }}>{(i + 1) % result.points.length + 1}</span>
                                            </span>
                                            <span style={{ color: 'var(--clr-text)', fontWeight: 600 }}>
                                                {fmtLen(mm, unit)}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </ResultCard>
                )}

                {/* ── How-to guide ─────────────────────────── */}
                {!loading && (!result || result?.type === 'calibration') && !error && (
                    <HowToGuide mode={mode} calibrated={calibrated} />
                )}

                {/* ── Point log ────────────────────────────── */}
                {clickPoints.length > 0 && !loading && (
                    <div style={{ marginTop: '14px' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--clr-text-faint)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
                            Placed Points
                        </div>
                        {clickPoints.map((pt, i) => (
                            <div key={i} style={{
                                display: 'flex', justifyContent: 'space-between',
                                fontSize: '0.75rem', color: 'var(--clr-text-muted)',
                                fontFamily: 'monospace', padding: '3px 0',
                                borderBottom: '1px solid var(--clr-border)',
                            }}>
                                <span style={{ color: mode === 'distance' ? '#00e6b4' : '#a855f7' }}>P{i + 1}</span>
                                <span>x: {(pt[0] * 800).toFixed(0)}  y: {(pt[1] * 1131).toFixed(0)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer — API info */}
            <div style={{
                padding: '10px 16px',
                borderTop: '1px solid var(--clr-border)',
                fontSize: '0.72rem', color: 'var(--clr-text-faint)',
                fontFamily: 'monospace',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                    {import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}
                </div>
            </div>
        </aside>
    )
}

/* ── Sub-components ──────────────────────────────────── */
function ResultCard({ icon: Icon, iconColor, title, color, borderColor, children }) {
    return (
        <div style={{
            background: color,
            border: `1px solid ${borderColor}`,
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '14px',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Icon size={15} color={iconColor} />
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--clr-text)' }}>
                    {title}
                </span>
            </div>
            {children}
        </div>
    )
}

function MetricRow({ label, value, accent, mono }) {
    return (
        <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '6px 0', borderBottom: '1px solid var(--clr-border)',
        }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)' }}>{label}</span>
            <span style={{
                fontSize: '0.82rem', fontWeight: 600,
                color: accent || 'var(--clr-text)',
                fontFamily: mono ? 'monospace' : 'inherit',
            }}>{value}</span>
        </div>
    )
}

function JSONBlock({ data }) {
    return (
        <pre style={{
            marginTop: '12px',
            background: 'var(--clr-bg)',
            border: '1px solid var(--clr-border)',
            borderRadius: '8px',
            padding: '10px 12px',
            fontSize: '0.72rem',
            fontFamily: 'monospace',
            color: 'var(--clr-text-muted)',
            overflowX: 'auto',
            lineHeight: 1.8,
        }}>
            {JSON.stringify(data, null, 2)}
        </pre>
    )
}

function HowToGuide({ mode, calibrated }) {
    const steps = [
        {
            done: false,
            num: '0',
            title: 'Physical Setup',
            detail: 'Place full A4 sheet flat on table. Put object fully inside A4 boundary. Hold camera perpendicular, ensure good lighting and clear A4 edges.',
        },
        {
            done: false,
            num: '1',
            title: 'Allow Camera',
            detail: 'Click "Start Camera" and accept the browser permission prompt.',
        },
        {
            done: calibrated,
            num: '2',
            title: 'Detect A4 (Mandatory)',
            detail: 'Click "Detect A4" — the frame is captured, A4 contour is located, perspective is corrected, and mm/px scale is stored in your session.',
        },
        {
            done: false,
            num: '3',
            title: mode === 'auto'
                ? 'Auto Detect Object'
                : mode === 'distance'
                    ? 'Click 2 Points (Line Mode)'
                    : 'Click 3+ Points (Polygon Mode)',
            detail: mode === 'auto'
                ? 'Place your object on A4. Click "Auto Detect Object" — the largest contour inside A4 is selected and width, height, area are returned.'
                : mode === 'distance'
                    ? 'Switch to "Line Mode". The warped top-down view is shown. Click 2 points on your object. Distance is computed automatically.'
                    : 'Switch to "Polygon Mode". The warped view is shown. Click 3+ points around your object, then hit "Measure Polygon" to get area.',
        },
    ]

    const modeColors = {
        auto: 'var(--clr-accent)',
        distance: '#00b4ff',
        polygon: '#a855f7',
    }

    return (
        <div>
            <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '0.72rem', fontWeight: 600, color: 'var(--clr-text-faint)',
                letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '14px',
            }}>
                <Info size={11} color="var(--clr-accent)" /> How to use
            </div>

            {steps.map((step, i) => (
                <div key={i} style={{
                    display: 'flex', gap: '10px', marginBottom: '12px', alignItems: 'flex-start',
                }}>
                    <div style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                        background: step.done ? 'rgba(34,197,94,0.15)' : 'var(--clr-surface2)',
                        border: `1.5px solid ${step.done ? '#22c55e' : 'var(--clr-border)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.62rem', fontWeight: 700,
                        color: step.done ? '#22c55e' : 'var(--clr-text-faint)',
                        marginTop: '1px',
                    }}>
                        {step.done ? '✓' : step.num}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{
                            fontSize: '0.8rem', fontWeight: 600,
                            color: step.done ? 'var(--clr-text-muted)' : 'var(--clr-text)',
                            textDecoration: step.done ? 'line-through' : 'none',
                            opacity: step.done ? 0.6 : 1,
                            marginBottom: '3px',
                        }}>
                            {step.title}
                        </div>
                        <div style={{
                            fontSize: '0.75rem', color: 'var(--clr-text-faint)',
                            lineHeight: 1.55,
                            opacity: step.done ? 0.5 : 1,
                        }}>
                            {step.detail}
                        </div>
                    </div>
                </div>
            ))}

            {/* Mode info card */}
            <div style={{
                marginTop: '14px',
                background: 'var(--clr-surface2)',
                border: `1px solid ${modeColors[mode]}40`,
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '0.76rem',
                color: 'var(--clr-text-muted)',
                lineHeight: 1.6,
            }}>
                <div style={{ color: modeColors[mode], fontWeight: 700, marginBottom: '5px' }}>
                    {mode === 'auto' && '⬡ Auto Detect Mode'}
                    {mode === 'distance' && '⟵ Line (Distance) Mode'}
                    {mode === 'polygon' && '⬡ Polygon (Area) Mode'}
                </div>
                {mode === 'auto' && (
                    <>
                        Best for boxes, rectangular objects, clear contrast.<br />
                        Uses Canny edge detection + contour filtering.<br />
                        Returns <code style={{ color: 'var(--clr-accent)' }}>width_mm</code>, <code style={{ color: 'var(--clr-accent)' }}>height_mm</code>, <code style={{ color: 'var(--clr-accent)' }}>area_mm²</code>.
                    </>
                )}
                {mode === 'distance' && (
                    <>
                        Best for specific edge measurements, irregular shapes.<br />
                        Views the <strong style={{ color: '#00b4ff' }}>warped (top-down) image</strong> for accurate clicks.<br />
                        Returns <code style={{ color: '#00b4ff' }}>distance_mm</code> via Euclidean distance.
                    </>
                )}
                {mode === 'polygon' && (
                    <>
                        Best for cloth, irregular regions, custom shapes.<br />
                        Views the <strong style={{ color: '#a855f7' }}>warped (top-down) image</strong> for accurate clicks.<br />
                        Returns <code style={{ color: '#a855f7' }}>area_mm²</code> via Shoelace formula.
                    </>
                )}
            </div>

            {/* A4 detection tips */}
            <div style={{
                marginTop: '12px',
                background: 'rgba(251,191,36,0.06)',
                border: '1px solid rgba(251,191,36,0.2)',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '0.73rem',
                color: 'var(--clr-text-faint)',
                lineHeight: 1.7,
            }}>
                <div style={{ color: '#fbbf24', fontWeight: 600, marginBottom: '4px' }}>
                    ⚠ If A4 detection fails
                </div>
                • A4 not fully visible in frame<br />
                • Poor or uneven lighting<br />
                • Background too similar to paper<br />
                • Camera too close or angled sharply
            </div>
        </div>
    )
}

