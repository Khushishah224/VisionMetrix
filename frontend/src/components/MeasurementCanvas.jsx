import { useRef, useEffect, useCallback, useState } from 'react'
import { WARP_DIMS, fmtLen, fmtArea } from '../utils/api'

/*
 * A4 is 210 mm wide × 297 mm tall → warped to WARP_DIMS (800 × 1131 px)
 * 1 warped pixel = 0.2625 mm
 */
const MM_PER_WARP_PX = 210 / WARP_DIMS.width    // ≈ 0.2625
const A4_AR = WARP_DIMS.width / WARP_DIMS.height  // ≈ 0.707 (portrait)

/**
 * Compute object-fit:contain layout rect for the warped A4 image
 * inside a given container.
 *
 * @returns {{ offsetX, offsetY, renderW, renderH }}
 *   offsetX/Y = top-left of the rendered image in container CSS pixels
 *   renderW/H = CSS pixel size of the rendered image
 */
function containRect(containerW, containerH) {
    const containerAR = containerW / containerH
    let renderW, renderH, offsetX, offsetY
    if (A4_AR <= containerAR) {
        // Portrait A4 narrower than landscape container → pillarbox (bars on sides)
        renderH = containerH
        renderW = containerH * A4_AR
        offsetX = (containerW - renderW) / 2
        offsetY = 0
    } else {
        // A4 wider than container (won't happen with typical landscape screens, but handled)
        renderW = containerW
        renderH = containerW / A4_AR
        offsetX = 0
        offsetY = (containerH - renderH) / 2
    }
    return {
        renderW: Math.round(renderW),
        renderH: Math.round(renderH),
        offsetX: Math.round(offsetX),
        offsetY: Math.round(offsetY),
    }
}

/* ── Module-level draw helpers (no closure issues) ─────────── */
function drawLabel(ctx, text, x, y, color, fontSize = '12px') {
    if (!text) return
    ctx.font = `600 ${fontSize} system-ui,sans-serif`
    const tw = ctx.measureText(text).width
    const pad = 7, rh = 20
    ctx.fillStyle = 'rgba(5,8,16,0.82)'
    rrect(ctx, x - tw / 2 - pad, y - rh / 2 - 2, tw + pad * 2, rh, 5)
    ctx.fill()
    ctx.fillStyle = color
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(text, x, y + 1)
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
}
function rrect(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath()
}

/* ══════════════════════════════════════════════════════════════ */
export default function MeasurementCanvas({
    mode, points, onPointsChange, onMeasure, onObjectSelect,
    result, warpedSrc, unit = 'mm',
}) {
    const canvasRef = useRef(null)
    const imageRef = useRef(null)
    const drawAllRef = useRef(null)   // stable ref to latest drawAll
    const layoutRef = useRef(null)   // current contain-layout rect

    const [hover, setHover] = useState(null)   // { rx, ry } — image-relative 0-1

    /* ── Pre-load warped JPEG ──────────────────────────────────── */
    useEffect(() => {
        imageRef.current = null
        if (!warpedSrc) { drawAllRef.current?.(); return }
        const img = new Image()
        img.onload = () => { imageRef.current = img; drawAllRef.current?.() }
        img.onerror = () => console.warn('MeasurementCanvas: warped frame failed to load')
        img.src = warpedSrc
    }, [warpedSrc])

    /* ── Canvas buffer = container DOM size (both modes) ──────────
     *
     * We do NOT inflate by DPR — canvas visuals are fine at CSS resolution.
     * ResizeObserver keeps width/height in sync with layout changes.
     */
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const sync = () => {
            const w = canvas.offsetWidth, h = canvas.offsetHeight
            if (!w || !h) return
            if (canvas.width !== w || canvas.height !== h) {
                canvas.width = w; canvas.height = h
            }
            drawAllRef.current?.()
        }
        const ro = new ResizeObserver(sync)
        ro.observe(canvas)
        sync()
        return () => ro.disconnect()
    }, [])

    /* ── Redraw whenever relevant state changes ────────────────── */
    useEffect(() => { drawAllRef.current?.() }, [mode, points, result, hover, unit, warpedSrc])

    /* ── Image-relative (0-1) → canvas CSS pixel ──────────────────
     *
     * In MANUAL mode: uses the contain-layout offset so points land on
     *   the image (not the letterbox).
     * In AUTO mode: simple ratio over full canvas.
     */
    const toAbs = useCallback((rx, ry) => {
        if (mode !== 'auto' && layoutRef.current) {
            const { offsetX, offsetY, renderW, renderH } = layoutRef.current
            return [offsetX + rx * renderW, offsetY + ry * renderH]
        }
        const c = canvasRef.current
        return c ? [rx * c.width, ry * c.height] : [0, 0]
    }, [mode])

    /* ── Snap: is hover near first polygon point? ──────────────── */
    const isNearFirst = useCallback((h) => {
        if (mode !== 'polygon' || points.length < 3 || !h) return false
        const [hx, hy] = toAbs(h.rx, h.ry)
        const [fx, fy] = toAbs(points[0][0], points[0][1])
        return Math.hypot(hx - fx, hy - fy) < 18
    }, [mode, points, toAbs])

    /* ── Real-world segment length ──────────────────────────────── */
    const segLenLabel = useCallback(([rx1, ry1], [rx2, ry2]) => {
        const dxPx = (rx2 - rx1) * WARP_DIMS.width     // warped-image pixel Δx
        const dyPx = (ry2 - ry1) * WARP_DIMS.height    // warped-image pixel Δy
        const mm = Math.hypot(dxPx, dyPx) * MM_PER_WARP_PX
        return fmtLen(mm, unit)
    }, [unit])

    /* ════════════════════ MASTER DRAW ═════════════════════════════ */
    const drawAll = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        const W = canvas.width
        const H = canvas.height
        ctx.clearRect(0, 0, W, H)

        /* ── AUTO MODE ─────────────────────────────────────────────
         * When objects have been detected:
         *   ① Show warped frame as background (same contain-layout as manual).
         *   ② Draw ALL objects with numbered badges.
         *   ③ Selected object → bright teal + measurement label.
         *   ④ Others → dimmed dashed outline only.
         * Before detection: transparent overlay (live video shows through).
         */
        if (mode === 'auto') {
            const objects = result?.objects
            if (!objects?.length) return   // transparent before detection

            // Warped background (same contain-layout as manual modes)
            const layout = containRect(W, H)
            layoutRef.current = layout
            const { offsetX, offsetY, renderW, renderH } = layout

            ctx.fillStyle = '#060a14'
            ctx.fillRect(0, 0, W, H)
            if (imageRef.current) {
                ctx.drawImage(imageRef.current, offsetX, offsetY, renderW, renderH)
            }

            const sx = renderW / WARP_DIMS.width
            const sy = renderH / WARP_DIMS.height
            const warpToCanvas = ([wx, wy]) => [offsetX + wx * sx, offsetY + wy * sy]

            objects.forEach((obj, i) => {
                const isSel = i === (result.selected_id ?? 0)
                const BRIGHT = '#00e6b4'
                const color = isSel ? BRIGHT : 'rgba(0,230,180,0.45)'

                if (obj.polygon_points?.length) {
                    // ── Draw shape outline ─────────────────────────────────
                    const er = obj.ellipse_render
                    const isRound = obj.shape_type === 'circle' || obj.shape_type === 'ellipse'

                    ctx.beginPath()
                    if (isRound && er) {
                        // Smooth ellipse / circle — ctx.ellipse uses canvas-space radii
                        const [ecx, ecy] = warpToCanvas([er.cx, er.cy])
                        const erx = er.rx * sx   // semi-major → canvas px
                        const ery = er.ry * sy   // semi-minor → canvas px
                        const eRad = (er.angle_deg ?? 0) * Math.PI / 180
                        ctx.ellipse(ecx, ecy, erx, ery, eRad, 0, Math.PI * 2)
                    } else if (obj.polygon_points?.length) {
                        obj.polygon_points.map(warpToCanvas).forEach(([x, y], j) =>
                            j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y))
                        ctx.closePath()
                    }
                    ctx.strokeStyle = color
                    ctx.lineWidth = isSel ? 2.5 : 1.5
                    ctx.setLineDash(isSel ? [] : [5, 4])
                    ctx.stroke(); ctx.setLineDash([])
                    ctx.fillStyle = isSel ? 'rgba(0,230,180,0.12)' : 'rgba(0,230,180,0.03)'
                    ctx.fill()

                    // ── Badge + label ─────────────────────────────────────
                    if (obj.centroid) {
                        const [bx, by] = warpToCanvas(obj.centroid)
                        const r = isSel ? 15 : 12
                        ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2)
                        ctx.fillStyle = isSel ? BRIGHT : 'rgba(0,230,180,0.5)'; ctx.fill()
                        ctx.font = `bold ${isSel ? 12 : 10}px system-ui,sans-serif`
                        ctx.fillStyle = '#060a14'
                        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
                        ctx.fillText(i + 1, bx, by)
                        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'

                        if (isSel) {
                            // Shape-aware measurement label
                            let labelText = ''
                            if (obj.shape_type === 'circle' && obj.diameter_mm != null) {
                                labelText = `⊙ ⌀${fmtLen(obj.diameter_mm, unit)}`
                            } else if (obj.shape_type === 'ellipse' && obj.major_axis_mm != null) {
                                labelText = `⬭ ${fmtLen(obj.major_axis_mm, unit)} × ${fmtLen(obj.minor_axis_mm, unit)}`
                            } else if (obj.width_mm != null) {
                                labelText = `${fmtLen(obj.width_mm, unit)} × ${fmtLen(obj.height_mm, unit)}`
                            }
                            if (labelText) drawLabel(ctx, labelText, bx, by - r - 14, BRIGHT)
                        }
                    }
                }   // end if polygon_points
            })


            if (objects.length > 1) {
                ctx.font = '11px system-ui,sans-serif'
                ctx.fillStyle = 'rgba(255,255,255,0.4)'
                ctx.textAlign = 'center'
                ctx.fillText('Click an object to select it', offsetX + renderW / 2, offsetY + renderH + 14)
                ctx.textAlign = 'left'
            }
            return
        }


        /* ── MANUAL MODES ──────────────────────────────────────────
         *
         * Canvas draws the warped image at contain-layout size/position.
         * Letterbox areas get a dark fill.
         * All drawn elements (dots, lines, labels) use toAbs() which
         * maps image-relative (0-1) → canvas CSS pixel with letterbox offset.
         */
        const layout = containRect(W, H)
        layoutRef.current = layout
        const { offsetX, offsetY, renderW, renderH } = layout

        // 1. Fill canvas black (letterbox) ───────────────────────
        ctx.fillStyle = '#060a14'
        ctx.fillRect(0, 0, W, H)

        // 2. Draw warped A4 image — correct size, centered, no stretch ──
        if (imageRef.current) {
            ctx.drawImage(imageRef.current, offsetX, offsetY, renderW, renderH)
        } else {
            // Loading placeholder
            ctx.fillStyle = 'rgba(0,180,255,0.04)'
            ctx.fillRect(offsetX, offsetY, renderW, renderH)
            ctx.strokeStyle = 'rgba(0,180,255,0.15)'; ctx.lineWidth = 1
            ctx.strokeRect(offsetX, offsetY, renderW, renderH)
            ctx.fillStyle = 'rgba(255,255,255,0.3)'
            ctx.font = '13px system-ui'; ctx.textAlign = 'center'
            ctx.fillText('Loading warped frame…', offsetX + renderW / 2, offsetY + renderH / 2)
            ctx.textAlign = 'left'
        }

        const absPoints = points.map(([rx, ry]) => toAbs(rx, ry))
        const isDistance = mode === 'distance'
        const lineColor = isDistance ? '#00e6b4' : '#a855f7'
        // hasMeasured: only true when the CURRENT points produced a result
        // (cleared points = not measured → allows new drawing)
        const hasMeasured = (isDistance && result?.type === 'distance' && points.length === 2) ||
            (!isDistance && result?.type === 'polygon' && points.length >= 3)

        // 3. Connecting lines between placed points ───────────────
        if (absPoints.length >= 2) {
            ctx.beginPath()
            absPoints.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y))
            if (!isDistance && absPoints.length >= 3) {
                ctx.closePath(); ctx.fillStyle = `${lineColor}14`; ctx.fill()
            }
            ctx.strokeStyle = lineColor; ctx.lineWidth = 2.5
            ctx.setLineDash(hasMeasured ? [] : [8, 5]); ctx.stroke(); ctx.setLineDash([])

            // 4. Segment length labels on each edge ─────────────────
            const segs = isDistance
                ? [[absPoints[0], absPoints[1], points[0], points[1]]]
                : absPoints.map((p, i) => [
                    p, absPoints[(i + 1) % absPoints.length],
                    points[i], points[(i + 1) % points.length],
                ])
            segs.forEach(([ap1, ap2, rp1, rp2], idx) => {
                if (!isDistance && idx === absPoints.length - 1 && absPoints.length < 3) return
                // Distance: when measured, skip frontend-computed label.
                // The backend result label (step 6) is the authoritative one.
                if (isDistance && hasMeasured) return
                const mx = (ap1[0] + ap2[0]) / 2
                const my = (ap1[1] + ap2[1]) / 2
                drawLabel(ctx, segLenLabel(rp1, rp2), mx, my - 11, lineColor, '11px')
            })

        }

        // 5. Live preview line (last point → cursor) ─────────────
        const showPreview = hover && absPoints.length > 0 && !hasMeasured &&
            !(isDistance && points.length >= 2)
        if (showPreview) {
            const last = absPoints[absPoints.length - 1]
            const [hx, hy] = toAbs(hover.rx, hover.ry)
            const snap = isNearFirst(hover)
            ctx.beginPath(); ctx.moveTo(last[0], last[1]); ctx.lineTo(hx, hy)
            ctx.strokeStyle = snap ? '#22c55e' : `${lineColor}90`
            ctx.lineWidth = 1.5; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([])
            drawLabel(ctx, segLenLabel(points[points.length - 1], [hover.rx, hover.ry]),
                hx + 14, hy - 6, `${lineColor}cc`, '11px')
            if (snap && points.length >= 3) {
                const [fx, fy] = toAbs(points[0][0], points[0][1])
                ctx.beginPath(); ctx.arc(fx, fy, 14, 0, Math.PI * 2)
                ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2; ctx.stroke()
                ctx.fillStyle = 'rgba(34,197,94,0.13)'; ctx.fill()
            }
        }

        // 6. Final result labels ──────────────────────────────────
        if (isDistance && absPoints.length === 2 && result?.distance_mm != null) {
            const mx = (absPoints[0][0] + absPoints[1][0]) / 2
            const my = (absPoints[0][1] + absPoints[1][1]) / 2
            drawLabel(ctx, fmtLen(result.distance_mm, unit), mx, my - 20, '#00e6b4', '13px')
        }
        if (!isDistance && absPoints.length >= 3 && result?.area_mm2 != null) {
            const cx = absPoints.reduce((s, [x]) => s + x, 0) / absPoints.length
            const cy = absPoints.reduce((s, [, y]) => s + y, 0) / absPoints.length
            drawLabel(ctx, `Area: ${fmtArea(result.area_mm2, unit)}`, cx, cy, '#a855f7', '13px')
        }

        // 7. Indexed point dots ───────────────────────────────────
        absPoints.forEach(([x, y], i) => {
            const isFirst = i === 0 && mode === 'polygon' && points.length >= 3
            const col = isFirst ? '#22c55e' : lineColor
            ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fillStyle = `${col}28`; ctx.fill()
            ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill()
            ctx.font = 'bold 9px system-ui,sans-serif'; ctx.fillStyle = '#fff'
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(i + 1, x, y)
            ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
        })

        // 8. Cursor endpoint indicator ────────────────────────────
        if (hover && !hasMeasured) {
            const [hx, hy] = toAbs(hover.rx, hover.ry)
            ctx.beginPath(); ctx.arc(hx, hy, 4, 0, Math.PI * 2); ctx.fillStyle = lineColor; ctx.fill()
            ctx.beginPath(); ctx.arc(hx, hy, 9, 0, Math.PI * 2)
            ctx.strokeStyle = `${lineColor}55`; ctx.lineWidth = 1.5; ctx.stroke()
        }
    }, [mode, points, result, hover, unit, toAbs, isNearFirst, segLenLabel])

    /* Keep ref always current */
    drawAllRef.current = drawAll
    useEffect(() => { drawAllRef.current?.() }, [drawAll])

    /* ── Click handler ─────────────────────────────────────────── */
    const handleClick = useCallback((e) => {
        const canvas = canvasRef.current
        const rect = canvas.getBoundingClientRect()
        const cssX = e.clientX - rect.left
        const cssY = e.clientY - rect.top
        const lay = layoutRef.current
        if (!lay) return

        // ── AUTO MODE: click selects nearest detected object ──
        if (mode === 'auto') {
            const objects = result?.objects
            if (!objects?.length || !onObjectSelect) return

            // Convert canvas CSS click → warped-image pixel
            const wx = (cssX - lay.offsetX) / lay.renderW * WARP_DIMS.width
            const wy = (cssY - lay.offsetY) / lay.renderH * WARP_DIMS.height

            let closest = 0, minDist = Infinity
            objects.forEach((obj, i) => {
                if (!obj.centroid) return
                const d = Math.hypot(wx - obj.centroid[0], wy - obj.centroid[1])
                if (d < minDist) { minDist = d; closest = i }
            })
            onObjectSelect(closest)
            return
        }

        // ── MANUAL MODES ──
        const rx = (cssX - lay.offsetX) / lay.renderW
        const ry = (cssY - lay.offsetY) / lay.renderH
        if (rx < 0 || rx > 1 || ry < 0 || ry > 1) return

        const measuredDone =
            (mode === 'distance' && points.length >= 2) ||
            (mode === 'polygon' && result?.type === 'polygon' && points.length >= 3)
        const base = measuredDone ? [] : points
        const next = [...base, [rx, ry]]
        onPointsChange(next)

        if (mode === 'distance' && next.length === 2) {
            onMeasure(next.map(([rx, ry]) => [
                rx * WARP_DIMS.width,
                ry * WARP_DIMS.height,
            ]))
        }
    }, [mode, points, result, onPointsChange, onMeasure, onObjectSelect])

    /* ── Mouse move ────────────────────────────────────────────── */
    const handleMouseMove = useCallback((e) => {
        const canvas = canvasRef.current
        const rect = canvas.getBoundingClientRect()
        const lay = layoutRef.current
        if (!lay) return

        const rx = (e.clientX - rect.left - lay.offsetX) / lay.renderW
        const ry = (e.clientY - rect.top - lay.offsetY) / lay.renderH

        if (mode === 'auto') return  // layout updated above; no hover dot needed

        setHover({
            rx: Math.max(0, Math.min(1, rx)),
            ry: Math.max(0, Math.min(1, ry)),
            inImage: rx >= 0 && rx <= 1 && ry >= 0 && ry <= 1,
        })
    }, [mode])

    const handleMouseLeave = useCallback(() => setHover(null), [])

    const showPolygonBtn = mode === 'polygon' && points.length >= 3 &&
        !(result?.type === 'polygon' && points.length >= 3)
    const lineColor = mode === 'distance' ? '#00e6b4' : '#a855f7'

    return (
        <div style={{ position: 'absolute', inset: 0 }}>
            <canvas
                ref={canvasRef}
                onClick={handleClick}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{
                    position: 'absolute', inset: 0,
                    width: '100%', height: '100%',
                    cursor: mode === 'auto' && result?.objects?.length
                        ? 'pointer'
                        : mode === 'auto' ? 'default' : 'crosshair',
                    display: 'block',
                }}
            />

            {/* Polygon button */}
            {showPolygonBtn && (
                <button
                    onClick={() => onMeasure(points.map(([rx, ry]) => [
                        rx * WARP_DIMS.width,
                        ry * WARP_DIMS.height,
                    ]))}
                    style={{
                        position: 'absolute', bottom: 56, left: '50%', transform: 'translateX(-50%)',
                        background: 'rgba(168,85,247,0.9)', color: '#fff', border: 'none',
                        borderRadius: '8px', padding: '9px 20px', fontWeight: 700,
                        fontSize: '0.85rem', cursor: 'pointer', backdropFilter: 'blur(6px)',
                        boxShadow: '0 4px 20px rgba(168,85,247,0.4)',
                        display: 'flex', alignItems: 'center', gap: '6px',
                    }}
                >
                    ⬡ Measure Polygon ({points.length} pts)
                </button>
            )}

            {/* Warped view badge */}
            {mode !== 'auto' && warpedSrc && (
                <div style={{
                    position: 'absolute', top: 10, left: 10,
                    background: `rgba(${mode === 'distance' ? '0,230,180' : '168,85,247'},0.12)`,
                    border: `1px solid rgba(${mode === 'distance' ? '0,230,180' : '168,85,247'},0.35)`,
                    borderRadius: '6px', padding: '4px 10px',
                    fontSize: '0.7rem', color: lineColor, fontWeight: 600,
                    backdropFilter: 'blur(6px)',
                }}>
                    📐 Warped top-down view — click to measure
                </div>
            )}

            {/* Not calibrated */}
            {mode !== 'auto' && !warpedSrc && (
                <div style={{
                    position: 'absolute', top: 10, left: 10,
                    background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)',
                    borderRadius: '6px', padding: '4px 10px',
                    fontSize: '0.7rem', color: '#fbbf24', fontWeight: 600,
                }}>
                    ⚠ Detect A4 first to enable manual mode
                </div>
            )}
        </div>
    )
}
