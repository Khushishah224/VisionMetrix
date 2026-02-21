# app/routers/measure.py

import json
import base64
import cv2
import numpy as np

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Path
from fastapi.responses import Response

from app.utils.image_utils import read_image
from app.services.a4_detector import detect_and_warp_a4, WARP_WIDTH, WARP_HEIGHT
from app.services.contour_measure import auto_detect_objects
from app.services.manual_measure import measure_distance, measure_polygon
from app.services.session_store import set_session, get_session, set_scale, get_scale

router = APIRouter()


# ── GET /api/warped-frame/{session_id} ──────────────────────────────
@router.get("/warped-frame/{session_id}")
async def get_warped_frame(session_id: str = Path(...)):
    """
    Return the perspective-corrected (warped) JPEG captured during calibration.
    The frontend uses this image in manual mode so click coordinates are
    already in warped-image space (0–{WARP_WIDTH} × 0–{WARP_HEIGHT}).
    """
    session = get_session(session_id)
    if not session or not session.get("warped_bytes"):
        raise HTTPException(
            status_code=404,
            detail="No calibration data found. Call /detect-a4 first."
        )
    return Response(
        content=session["warped_bytes"],
        media_type="image/png",
        headers={"Cache-Control": "no-cache", "X-Warp-Width": str(WARP_WIDTH),
                 "X-Warp-Height": str(WARP_HEIGHT)},
    )


# ── GET /api/warp-dims ──────────────────────────────────────────────
@router.get("/warp-dims")
async def get_warp_dims():
    """Return the fixed warped image dimensions so the frontend can scale coords."""
    return {"warp_width": WARP_WIDTH, "warp_height": WARP_HEIGHT}


def _require_session(session_id: str) -> dict:
    """Raise 400 if calibration hasn't been done yet."""
    session = get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=400,
            detail="Session not calibrated. Call /detect-a4 first."
        )
    return session


def _decode_warped(warped_bytes: bytes):
    """Decode stored JPEG bytes back to a BGR ndarray."""
    arr = np.frombuffer(warped_bytes, np.uint8)
    return cv2.imdecode(arr, cv2.IMREAD_COLOR)


# ── POST /api/detect-a4 ──────────────────────────────────────────────
@router.post("/detect-a4")
async def detect_a4(
    session_id: str  = Form(...),
    file:        UploadFile = File(...),
):
    """
    Detect the A4 sheet in the uploaded image.
    Stores the warped (perspective-corrected) frame + mm/px scale in session.
    Returns: { mm_per_pixel, message }
    """
    image = read_image(await file.read())

    try:
        warped, mm_per_pixel, M = detect_and_warp_a4(image)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Encode warped frame as lossless PNG for storage.
    # PNG avoids JPEG compression artifacts on object edges,
    # which improves click accuracy in manual modes.
    _, warped_buf = cv2.imencode(".png", warped)
    set_session(session_id, mm_per_pixel, warped_buf.tobytes(), M)

    return {
        "mm_per_pixel": round(mm_per_pixel, 6),
        "message": "A4 detected and perspective corrected successfully."
    }


# ── POST /api/auto-measure ───────────────────────────────────────────
@router.post("/auto-measure")
async def auto_measure(
    session_id: str       = Form(...),
    file:        UploadFile = File(...),
):
    """
    Auto-detect the largest object in the current frame.

    Strategy:
      1. Try to detect A4 in the new frame and get a fresh warp.
      2. If that fails (e.g. user moved camera), fall back to the
         warped image captured during calibration.
    Returns: { width_mm, height_mm, area_mm2, polygon_points }
    """
    session = _require_session(session_id)
    mm_per_pixel = session["mm_per_pixel"]

    image = read_image(await file.read())

    # Try fresh A4 detection on the new frame
    warped = None
    try:
        warped, mm_per_pixel_fresh, _M = detect_and_warp_a4(image)
        mm_per_pixel = mm_per_pixel_fresh   # use fresh scale if available
    except Exception:
        # Fall back to stored warped frame from calibration
        if session.get("warped_bytes"):
            warped = _decode_warped(session["warped_bytes"])
        else:
            raise HTTPException(
                status_code=422,
                detail=(
                    "Could not detect A4 in the current frame and no "
                    "calibration image was stored. Please recalibrate."
                )
            )

    try:
        result = auto_detect_objects(warped, mm_per_pixel)
        
        # Encode warped frame as base64 so frontend can show THIS exact frame
        # behind the overlays, ensuring perfect alignment.
        _, buffer = cv2.imencode(".png", warped)
        warped_b64 = base64.b64encode(buffer).decode("utf-8")
        
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Object detection failed: {e}")

    # Tag as multi-object result; first object is initially selected
    return {
        **result, 
        "selected_id": 0,
        "warped_b64": f"data:image/png;base64,{warped_b64}"
    }


# ── POST /api/manual-distance ────────────────────────────────────────
@router.post("/manual-distance")
async def manual_distance(
    session_id: str = Form(...),
    points:     str = Form(...),
):
    """
    Compute the real-world distance between two clicked points.
    `points` must be a JSON array of exactly 2 [x, y] pairs
    in warped-image pixel coordinates (warped width = 800 px).
    Returns: { distance_mm }
    """
    session = _require_session(session_id)
    mm_per_pixel = session["mm_per_pixel"]

    try:
        pts = json.loads(points)
        if len(pts) != 2:
            raise ValueError("Exactly 2 points required.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid points: {e}")

    distance = measure_distance(pts, mm_per_pixel)
    return {"distance_mm": distance}


# ── POST /api/manual-polygon ─────────────────────────────────────────
@router.post("/manual-polygon")
async def manual_polygon(
    session_id: str = Form(...),
    points:     str = Form(...),
):
    """
    Compute the real-world area of a polygon drawn by the user.
    `points` must be a JSON array of ≥ 3 [x, y] pairs
    in warped-image pixel coordinates.
    Returns: { area_mm2 }
    """
    session = _require_session(session_id)
    mm_per_pixel = session["mm_per_pixel"]

    try:
        pts = json.loads(points)
        if len(pts) < 3:
            raise ValueError("At least 3 points required.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid points: {e}")

    area = measure_polygon(pts, mm_per_pixel)
    return {"area_mm2": area}


# ── POST /api/upload-measure ─────────────────────────────────────────
@router.post("/upload-measure")
async def upload_measure(
    session_id: str       = Form(...),
    file:        UploadFile = File(...),
):
    """
    Combined workflow for static image uploads:
    1. Detect A4 in the uploaded file.
    2. Perspective-warp the A4 area to 800x1131.
    3. Auto-detect objects in that warped frame.
    4. Return measurements + the warped frame as base64.
    """
    image = read_image(await file.read())

    # 1 & 2. Detect & Warp
    try:
        warped, mm_per_pixel, M = detect_and_warp_a4(image)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"A4 Detection Failed: {e}")

    # Update session with these values so manual mode works on this image too
    _, warped_buf = cv2.imencode(".png", warped)
    set_session(session_id, mm_per_pixel, warped_buf.tobytes(), M)

    # 3. Measure
    try:
        result = auto_detect_objects(warped, mm_per_pixel)
        _, buffer = cv2.imencode(".png", warped)
        warped_b64 = base64.b64encode(buffer).decode("utf-8")
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Object detection failed: {e}")

    return {
        **result,
        "selected_id": 0,
        "mm_per_pixel": round(mm_per_pixel, 6),
        "warped_b64": f"data:image/png;base64,{warped_b64}",
        "message": "Image uploaded and processed successfully."
    }
