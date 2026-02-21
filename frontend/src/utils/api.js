/**
 * VisionMetrix API Service
 * Maps 1-to-1 with backend routes in app/routers/measure.py
 *
 * Backend endpoints:
 *   POST /api/detect-a4        → { mm_per_pixel, message }
 *   POST /api/auto-measure     → { width_mm, height_mm, area_mm2, polygon_points }
 *   POST /api/manual-distance  → { distance_mm }
 *   POST /api/manual-polygon   → { area_mm2 }
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

/**
 * Warped image dimensions — must match backend a4_detector.py constants.
 * WARP_WIDTH  = 800 px
 * WARP_HEIGHT = int(800 * 297 / 210) = 1131 px
 */
export const WARP_DIMS = { width: 800, height: 1131 }

/**
 * Fetch the calibration warped frame and return a blob object-URL
 * (revoke when done to avoid memory leaks).
 * @param {string} sessionId
 * @returns {Promise<string>} object URL of the JPEG
 */
export async function getWarpedFrameUrl(sessionId) {
    let response
    try {
        response = await fetch(`${BASE_URL}/warped-frame/${encodeURIComponent(sessionId)}`)
    } catch {
        throw new Error('Cannot reach backend.')
    }
    if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.detail || `Failed to fetch warped frame (${response.status})`)
    }
    const blob = await response.blob()
    return URL.createObjectURL(blob)
}

/** Shared fetch wrapper — handles both HTTP errors and legacy JSON error fields */
async function apiFetch(endpoint, formData) {
    let response
    try {
        response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            body: formData,
        })
    } catch (networkErr) {
        throw new Error(
            'Cannot reach backend. Make sure the FastAPI server is running on port 8000.'
        )
    }

    let data
    try {
        data = await response.json()
    } catch {
        throw new Error(`Server returned a non-JSON response (status ${response.status}).`)
    }

    if (!response.ok) {
        // FastAPI HTTPException format: { detail: "..." }
        const msg = data?.detail || data?.error || `API error ${response.status}`
        throw new Error(msg)
    }

    // Legacy check: old endpoints returned { error: "..." } with status 200
    if (data?.error) {
        throw new Error(data.error)
    }

    return data
}

/**
 * Step 1 — Calibrate: detect A4 sheet and save scale for this session.
 * @param {string} sessionId
 * @param {Blob|File} imageBlob
 * @returns {{ mm_per_pixel: number, message: string }}
 */
export async function detectA4(sessionId, imageBlob) {
    const fd = new FormData()
    fd.append('session_id', sessionId)
    fd.append('file', imageBlob, 'capture.jpg')
    return apiFetch('/detect-a4', fd)
}

/**
 * Step 2a — Auto mode: detect the largest object and return its dimensions.
 * @param {string} sessionId
 * @param {Blob|File} imageBlob
 * @returns {{ width_mm, height_mm, area_mm2, polygon_points: number[][] }}
 */
export async function autoMeasure(sessionId, imageBlob) {
    const fd = new FormData()
    fd.append('session_id', sessionId)
    fd.append('file', imageBlob, 'capture.jpg')
    return apiFetch('/auto-measure', fd)
}

/**
 * Step 2b — Manual distance: measure distance between 2 clicked points.
 * @param {string} sessionId
 * @param {[number,number][]} points  Array of exactly 2 [x,y] pairs (warped image px)
 * @returns {{ distance_mm: number }}
 */
export async function manualDistance(sessionId, points) {
    const fd = new FormData()
    fd.append('session_id', sessionId)
    fd.append('points', JSON.stringify(points))
    return apiFetch('/manual-distance', fd)
}

/**
 * Step 2c — Manual polygon: compute area of polygon drawn by user.
 * @param {string} sessionId
 * @param {[number,number][]} points  Array of N≥3 [x,y] pairs (warped image px)
 * @returns {{ area_mm2: number }}
 */
export async function manualPolygon(sessionId, points) {
    const fd = new FormData()
    fd.append('session_id', sessionId)
    fd.append('points', JSON.stringify(points))
    return apiFetch('/manual-polygon', fd)
}

/** Generate a random session ID (persisted in sessionStorage) */
export function getOrCreateSessionId() {
    let sid = sessionStorage.getItem('vm_session_id')
    if (!sid) {
        sid = 'VM-' + Math.random().toString(36).slice(2, 10).toUpperCase()
        sessionStorage.setItem('vm_session_id', sid)
    }
    return sid
}

/**
 * Capture the current video frame as a JPEG Blob.
 * @param {HTMLVideoElement} videoElement
 * @returns {Promise<Blob>}
 */
export function captureCanvasBlob(videoElement) {
    return new Promise((resolve, reject) => {
        try {
            const canvas = document.createElement('canvas')
            canvas.width = videoElement.videoWidth || 1280
            canvas.height = videoElement.videoHeight || 720
            canvas.getContext('2d').drawImage(videoElement, 0, 0)
            canvas.toBlob(
                (blob) => {
                    if (blob) resolve(blob)
                    else reject(new Error('Failed to capture frame from video.'))
                },
                'image/jpeg',
                0.95,    // quality — higher = better edge detection
            )
        } catch (e) {
            reject(e)
        }
    })
}

/* ── Unit conversion ───────────────────────────────────────────────── */

export const UNITS = ['mm', 'cm', 'in']

const UNIT_CFG = {
    mm: { lenFactor: 1, areaFactor: 1, lenLabel: 'mm', areaLabel: 'mm²', lenDec: 1, areaDec: 1 },
    cm: { lenFactor: 0.1, areaFactor: 0.01, lenLabel: 'cm', areaLabel: 'cm²', lenDec: 2, areaDec: 2 },
    in: { lenFactor: 1 / 25.4, areaFactor: 1 / 645.16, lenLabel: 'in', areaLabel: 'in²', lenDec: 3, areaDec: 3 },
}

/**
 * Format a length value (given in mm) into a display string with the chosen unit.
 * @param {number} mm
 * @param {'mm'|'cm'|'in'} unit
 * @returns {string}  e.g. "152.3 mm", "15.23 cm", "5.996 in"
 */
export function fmtLen(mm, unit = 'mm') {
    if (mm == null) return '—'
    const c = UNIT_CFG[unit] || UNIT_CFG.mm
    return `${(mm * c.lenFactor).toFixed(c.lenDec)} ${c.lenLabel}`
}

/**
 * Format an area value (given in mm²) into a display string with the chosen unit.
 * @param {number} mm2
 * @param {'mm'|'cm'|'in'} unit
 * @returns {string}  e.g. "23,400 mm²", "234.00 cm²"
 */
export function fmtArea(mm2, unit = 'mm') {
    if (mm2 == null) return '—'
    const c = UNIT_CFG[unit] || UNIT_CFG.mm
    const val = mm2 * c.areaFactor
    return `${val.toLocaleString(undefined, { minimumFractionDigits: c.areaDec, maximumFractionDigits: c.areaDec })} ${c.areaLabel}`
}


