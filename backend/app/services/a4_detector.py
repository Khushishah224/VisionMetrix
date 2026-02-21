# app/services/a4_detector.py

import cv2
import numpy as np

A4_WIDTH_MM  = 210
A4_HEIGHT_MM = 297
WARP_WIDTH   = 800
WARP_HEIGHT  = int(WARP_WIDTH * A4_HEIGHT_MM / A4_WIDTH_MM)   # ≈ 1131

# A4 true aspect ratio = longer / shorter side = 297/210 ≈ 1.414
A4_AR        = A4_HEIGHT_MM / A4_WIDTH_MM


def order_points(pts):
    """Order 4 points: top-left, top-right, bottom-right, bottom-left."""
    rect = np.zeros((4, 2), dtype="float32")
    s    = pts.sum(axis=1)
    diff = np.diff(pts, axis=1)
    rect[0] = pts[np.argmin(s)]       # top-left
    rect[2] = pts[np.argmax(s)]       # bottom-right
    rect[1] = pts[np.argmin(diff)]    # top-right
    rect[3] = pts[np.argmax(diff)]    # bottom-left
    return rect


def _quad_aspect_ratio(pts):
    """
    Compute the aspect ratio (longer/shorter side) of an ordered quad.
    Uses the average of opposite side-pairs to be robust to slight perspective.
    """
    pts = order_points(pts)
    # top side, bottom side
    w1 = np.linalg.norm(pts[1] - pts[0])
    w2 = np.linalg.norm(pts[2] - pts[3])
    # left side, right side
    h1 = np.linalg.norm(pts[3] - pts[0])
    h2 = np.linalg.norm(pts[2] - pts[1])
    avg_w = (w1 + w2) / 2
    avg_h = (h1 + h2) / 2
    if avg_w < 1 or avg_h < 1:
        return None
    return max(avg_w, avg_h) / min(avg_w, avg_h)


def _find_quad(edges, img_area):
    """
    Return the largest valid A4-like 4-point contour in edge map, or None.

    Validation rules (all must pass):
    ① Area ≥ 8 % of image    — A4 must be large in frame
    ② Area ≤ 97 % of image   — skip full-frame border artifacts
    ③ Aspect ratio 1.1–1.9   — A4 is ~1.414; allow ±0.3 tolerance for angle
       (accepts both portrait and landscape orientation)
    """
    kernel  = np.ones((3, 3), np.uint8)
    closed  = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel, iterations=2)
    cnts, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Largest contours first — A4 sheet is likely the biggest rectangle
    for c in sorted(cnts, key=cv2.contourArea, reverse=True)[:10]:
        area = cv2.contourArea(c)

        # ① Minimum size: at least 8% of the frame
        if area < 0.08 * img_area:
            continue

        # ② Skip full-frame artifacts
        if area > 0.97 * img_area:
            continue

        peri = cv2.arcLength(c, True)
        for eps in (0.02, 0.03, 0.04, 0.05):
            approx = cv2.approxPolyDP(c, eps * peri, True)
            if len(approx) == 4:
                pts = approx.reshape(4, 2).astype("float32")

                # ③ Aspect ratio check — reject non-A4 shapes (books, stickers, etc.)
                ar = _quad_aspect_ratio(pts)
                if ar is None:
                    continue
                # A4_AR ≈ 1.414; allow ±30 % tolerance
                if ar < A4_AR * 0.70 or ar > A4_AR * 1.30:
                    continue

                return pts   # ← first valid A4-like quad

    return None     # No suitable A4 candidate found


def detect_and_warp_a4(image):
    """
    Detect the A4 sheet in *image*, apply perspective warp and return:
        (warped BGR ndarray, mm_per_pixel float, M 3×3 perspective matrix)

    The extra return value M lets you map original-frame pixel coords into
    warped-frame pixel coords, enabling manual-mode clicking on the live view.

    Raises Exception("A4 not detected …") only if every strategy fails.
    """
    gray     = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    h, w     = gray.shape
    img_area = h * w

    # ── Strategy list ─────────────────────────────────────────────
    def _canny(blurred, lo, hi):
        return cv2.Canny(blurred, lo, hi)

    strategies = [
        lambda g: _canny(cv2.GaussianBlur(g, (5,  5),  0), 50, 150),
        lambda g: _canny(cv2.GaussianBlur(g, (11, 11), 0), 30, 100),
        lambda g: _canny(cv2.GaussianBlur(g, (21, 21), 0), 20,  80),
        lambda g: _canny(cv2.bilateralFilter(g, 9, 75, 75), 40, 120),
        lambda g: cv2.adaptiveThreshold(
            cv2.GaussianBlur(g, (7, 7), 0), 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 15, 4),
        lambda g: cv2.threshold(
            cv2.GaussianBlur(g, (5, 5), 0), 0, 255,
            cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1],
    ]

    pts = None
    for strategy in strategies:
        try:
            edges = strategy(gray)
            pts   = _find_quad(edges, img_area)
            if pts is not None:
                break
        except Exception:
            continue

    if pts is None:
        raise Exception(
            "A4 sheet not detected. "
            "Ensure the FULL A4 sheet is visible, well-lit, and clearly distinct "
            "from the background. Objects placed ON the A4 must not obscure its edges."
        )

    # ── Sub-pixel corner refinement ─────────────────────
    # Refines the 4 detected A4 corners to sub-pixel accuracy using
    # the local image gradient, reducing localization error from
    # ~2-3 px down to <0.5 px.  This is the biggest single accuracy
    # improvement for the perspective warp.
    try:
        corners_for_subpix = pts.reshape(-1, 1, 2).astype(np.float32)
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 40, 0.001)
        refined  = cv2.cornerSubPix(gray, corners_for_subpix, (11, 11), (-1, -1), criteria)
        pts = refined.reshape(4, 2)
    except Exception:
        pass   # if refinement fails, use original coarse corners

    # ── Perspective warp ──────────────────────────────────────────
    rect = order_points(pts)
    dst  = np.array([
        [0,              0],
        [WARP_WIDTH - 1, 0],
        [WARP_WIDTH - 1, WARP_HEIGHT - 1],
        [0,              WARP_HEIGHT - 1],
    ], dtype="float32")

    M      = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image, M, (WARP_WIDTH, WARP_HEIGHT))

    mm_per_pixel = A4_WIDTH_MM / WARP_WIDTH   # 210 / 800 = 0.2625 mm/px

    return warped, mm_per_pixel, M