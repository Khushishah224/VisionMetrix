# app/services/session_store.py
"""
Simple in-memory session store.
Stores per-session calibration data so the A4 detection step
(which is expensive and can fail) only needs to run once.
"""
import numpy as np

_sessions: dict = {}


def set_session(session_id: str, mm_per_pixel: float,
                warped_bytes: bytes, perspective_matrix=None):
    """
    Save calibration data for a session.
      mm_per_pixel       — real-world scale (mm per warped pixel)
      warped_bytes       — JPEG bytes of the perspective-corrected A4 image
      perspective_matrix — 3×3 numpy array returned by cv2.getPerspectiveTransform
                           Lets you map original-frame pixel coords → warped coords.
    """
    _sessions[session_id] = {
        "mm_per_pixel":       mm_per_pixel,
        "warped_bytes":       warped_bytes,
        "perspective_matrix": perspective_matrix,   # numpy float32 (3,3)
    }


def get_session(session_id: str) -> dict | None:
    """Return the full session dict or None if not calibrated."""
    return _sessions.get(session_id)


# ── Legacy helpers kept for backwards compatibility ─────────────────
def set_scale(session_id: str, mm_per_pixel: float):
    if session_id in _sessions:
        _sessions[session_id]["mm_per_pixel"] = mm_per_pixel
    else:
        _sessions[session_id] = {
            "mm_per_pixel": mm_per_pixel,
            "warped_bytes": None,
            "perspective_matrix": None,
        }


def get_scale(session_id: str) -> float | None:
    s = _sessions.get(session_id)
    return s["mm_per_pixel"] if s else None