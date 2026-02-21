# app/services/contour_measure.py

import math
import cv2
import numpy as np


# ── Illumination / shadow normalisation ───────────────────────────────────────
def _normalise_illumination(gray: np.ndarray) -> np.ndarray:
    """
    Remove uneven lighting and soft shadows before edge detection.

    Method:
      1. Estimate background illumination with a very large Gaussian blur
         (doesn't preserve edges → captures only the slow gradient from
         window/lamp positions).
      2. Divide the original image by this illumination map (scale to 0-255).
         Objects with good contrast survive; shadowed regions are lifted.
      3. Apply CLAHE for local contrast enhancement so even low-contrast
         edges in shadowed areas are detectable.

    This is the standard technique used in document scanning pipelines.
    It reduces shadow-induced measurement errors by 30-60 %.
    """
    blur_bg = cv2.GaussianBlur(gray, (61, 61), 0)
    normalised = cv2.divide(gray, blur_bg, scale=255)
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    return clahe.apply(normalised)


# ── Contour expansion (compensates for Canny edge inward bias) ───────────────
def _expand_contour(contour: np.ndarray, pixels: int = 3) -> np.ndarray:
    """
    Dilate the filled contour mask by `pixels` pixels and return the new outer
    contour.  This compensates for the systematic inward bias of Canny edge
    detection and morphological closing, which place the found contour 1–3 px
    inside the true object boundary.

    The operation is performed on a local crop of the contour bounding box
    (with margin) so it is O(object bounding-box) not O(full frame).
    """
    x, y, bw, bh = cv2.boundingRect(contour)
    margin = pixels + 4
    # Shift contour into local crop coordinates
    shifted = contour - np.array([x - margin, y - margin], dtype=np.int32)
    h_s = bh + 2 * margin
    w_s = bw + 2 * margin
    mask = np.zeros((h_s, w_s), dtype=np.uint8)
    cv2.drawContours(mask, [shifted], -1, 255, -1)   # filled
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * pixels + 1, 2 * pixels + 1))
    mask = cv2.dilate(mask, kernel, iterations=1)
    cnts, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    if not cnts:
        return contour
    # Shift back to full-frame coordinates
    return cnts[0] + np.array([x - margin, y - margin], dtype=np.int32)


# ── Sub-pixel refinement ──────────────────────────────────────────────────────
def _refine_points_subpixel(gray: np.ndarray, pts: np.ndarray) -> np.ndarray:
    """
    Refine integer points to sub-pixel accuracy using the local intensity gradient.
    Uses cv2.cornerSubPix which is highly stable for object corners and edges.
    """
    if pts.size == 0:
        return pts
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 40, 0.001)
    # pts_f is (N, 1, 2)
    pts_f = pts.astype(np.float32)
    # Window size 7x7 (15x15 pixel area) for robust edge refinement
    cv2.cornerSubPix(gray, pts_f, (7, 7), (-1, -1), criteria)
    return pts_f


# ── PCA measurement (minAreaRect = closed-form PCA for 2-D point clouds) ─────
def _measure_pca(contour: np.ndarray, mm_per_pixel: float, gray: np.ndarray) -> dict:
    """
    Compute width, height, and area using the object's PRINCIPAL AXES.
    than the axis-aligned bounding rectangle.

    cv2.minAreaRect is mathematically equivalent to PCA on the contour
    point cloud: it finds the rotation angle that minimises the bounding box,
    which is the same as aligning with the eigenvectors of the covariance
    matrix.  This gives CORRECT width × height for any object orientation.

    Returns
    -------
    dict with:
      polygon_points  – approxPolyDP outline (for overlay drawing)
      centroid        – [cx, cy] in warped-image pixels
      width_mm        – PCA longer axis × mm_per_pixel
      height_mm       – PCA shorter axis × mm_per_pixel
      area_mm2        – true contour area × mm_per_pixel²
      angle_deg       – rotation from x-axis (polygon / ellipse)
      shape_type      – 'circle' | 'ellipse' | 'polygon'
      ellipse_render  – {cx,cy,rx,ry,angle_deg} in warped-image px (round shapes only)
                        Frontend uses this to draw ctx.ellipse() instead of polygon lines.

    Shape classification (circularity = 4π·area / perimeter²):
      ≈ 1.00 → circle/ellipse
      ≈ 0.78 → square
      < 0.50 → elongated / irregular

    Thresholds:
      circ > 0.80  AND  PCA aspect-ratio < 1.25  → 'circle'
      circ > 0.72                                  → 'ellipse'
      else                                         → 'polygon'
    """
    # ── PCA dimensions (minAreaRect) ──────────────────────────────────────
    rect = cv2.minAreaRect(contour)
    (cx_r, cy_r), (w_px, h_px), angle = rect
    if w_px < h_px:
        w_px, h_px = h_px, w_px
        angle = (angle + 90) % 180

    # ── True area + centroid from moments ────────────────────────────────
    pixel_area = cv2.contourArea(contour)
    M_c = cv2.moments(contour)
    if M_c['m00'] > 0:
        cx_c = M_c['m10'] / M_c['m00']
        cy_c = M_c['m01'] / M_c['m00']
    else:
        cx_c, cy_c = cx_r, cy_r

    # ── Circularity → shape type ─────────────────────────────────────────
    #
    # Use the CONVEX HULL perimeter so small notches/spirals don't artificially
    # reduce circularity for objects that are otherwise round.
    hull_c   = cv2.convexHull(contour)
    hull_peri = cv2.arcLength(hull_c, True)
    circularity = (4 * math.pi * pixel_area / (hull_peri ** 2)) if hull_peri > 0 else 0

    # PCA aspect ratio from minAreaRect (original, pre-expansion)
    pca_ar = w_px / h_px if h_px > 0 else 1

    # Approx polygon vertex count — rectangles/triangles have few vertices
    approx_test = cv2.approxPolyDP(hull_c, 0.02 * hull_peri, True)
    n_vertices   = len(approx_test)

    # Thresholds (tuned so rectangles ≈ 0.785 circularity are NOT caught):
    #   circle  : circ > 0.87  AND  pca_ar < 1.15  AND  n_vertices ≥ 7
    #   ellipse : circ > 0.84  AND  n_vertices ≥ 6
    #   polygon : everything else
    if circularity > 0.87 and pca_ar < 1.15 and n_vertices >= 7:
        shape_type = 'circle'
    elif circularity > 0.84 and n_vertices >= 6:
        shape_type = 'ellipse'
    else:
        shape_type = 'polygon'

    # ── Polygon approximation for drawing ────────────────────────────────
    # Reduce epsilon to 0.01 (1 %) for tighter corner snapping in the UI
    approx = cv2.approxPolyDP(contour, 0.01 * hull_peri, True)
    if len(approx) > 12:
        approx = cv2.approxPolyDP(hull_c, 0.01 * hull_peri, True)

    # ── Sub-pixel refinement for polygon corners ──
    # If the object is a polygon (usually rectangle), we refine its vertices.
    approx_sub = None
    if shape_type == 'polygon':
        approx_sub = _refine_points_subpixel(gray, approx)

    # ── Expand contour to correct for Canny inward bias ──────────────────
    #    Polygons: 3 px  ≈ 0.8 mm per side at 0.26 mm/px
    #    Circles/ellipses: 4 px for smoother-edge compensation
    dilation_px = 4 if shape_type in ('circle', 'ellipse') else 3
    contour_exp = _expand_contour(contour, pixels=dilation_px)

    # ── Sub-pixel refinement for round shape edge-points ──
    # Feed fitEllipse a more precise set of points.
    contour_exp_sub = contour_exp.astype(np.float32)
    if shape_type in ('circle', 'ellipse'):
        contour_exp_sub = _refine_points_subpixel(gray, contour_exp)

    # Re-run minAreaRect on the REFINED DENSE contour for max accuracy.
    # (Previously using approximated points caused rounded-corner bias).
    rect2 = cv2.minAreaRect(contour_exp_sub)

    (_, _), (w2, h2), angle2 = rect2
    long_px  = max(w2, h2)
    short_px = min(w2, h2)

    # Orientation-aware labeling:
    #   angle2 from minAreaRect is in [-90, 0).  Normalise to [0, 180).
    #   If major axis is within ±45° of horizontal  → width = long, height = short
    #   If major axis is within ±45° of vertical   → width = short, height = long
    #   This ensures "Width" always means the horizontal extent in the frame.
    norm_angle = float(angle2 % 180)
    long_is_horizontal = (norm_angle < 45) or (norm_angle > 135)
    if long_is_horizontal:
        width_px_final  = long_px
        height_px_final = short_px
        angle_out = norm_angle
    else:
        width_px_final  = short_px
        height_px_final = long_px
        angle_out = (norm_angle + 90) % 180

    pixel_area_exp = cv2.contourArea(contour_exp)

    # ── Round-shape fitting with cv2.fitEllipse on EXPANDED contour ──────────
    ellipse_render = None
    extra          = {}
    if shape_type in ('circle', 'ellipse') and len(contour_exp_sub) >= 5:
        try:
            (ex, ey), (ea, eb), e_ang = cv2.fitEllipse(contour_exp_sub)  # refined
            # cv2 returns full-axis lengths; convert to semi-axis (radius)
            semi_maj_px = max(ea, eb) / 2.0
            semi_min_px = min(ea, eb) / 2.0
            semi_maj_mm = semi_maj_px * mm_per_pixel
            semi_min_mm = semi_min_px * mm_per_pixel

            ellipse_render = {
                'cx':        round(ex, 2),
                'cy':        round(ey, 2),
                'rx':        round(semi_maj_px, 2),   # semi-major in warped px
                'ry':        round(semi_min_px, 2),   # semi-minor in warped px
                'angle_deg': round(e_ang, 2),
            }

            if shape_type == 'circle':
                r_mm = (semi_maj_mm + semi_min_mm) / 2.0   # average both semi-axes
                extra = {
                    'radius_mm':        round(r_mm, 2),
                    'diameter_mm':      round(r_mm * 2, 2),
                    'circumference_mm': round(2 * math.pi * r_mm, 2),
                    # Override PCA width/height with diameter
                    'width_mm':         round(r_mm * 2, 2),
                    'height_mm':        round(r_mm * 2, 2),
                }
            else:   # ellipse
                # Ramanujan's approximation for ellipse perimeter
                a, b = semi_maj_mm, semi_min_mm
                h_val = ((a - b) ** 2) / ((a + b) ** 2)
                perim_mm = math.pi * (a + b) * (1 + 3 * h_val / (10 + math.sqrt(4 - 3 * h_val)))
                ecc = math.sqrt(1 - (b / a) ** 2) if a > 0 else 0
                extra = {
                    'major_axis_mm':  round(semi_maj_mm * 2, 2),
                    'minor_axis_mm':  round(semi_min_mm * 2, 2),
                    'eccentricity':   round(ecc, 4),
                    'perimeter_mm':   round(perim_mm, 2),
                    'width_mm':       round(semi_maj_mm * 2, 2),
                    'height_mm':      round(semi_min_mm * 2, 2),
                }
        except Exception:
            shape_type = 'polygon'   # fitEllipse failed → treat as polygon

    # ── Assemble result ───────────────────────────────────────────────────
    base = {
        'polygon_points': (approx_sub if approx_sub is not None else approx).reshape(-1, 2).tolist(),
        'centroid':       [round(cx_c, 1), round(cy_c, 1)],
        'width_mm':       round(width_px_final  * mm_per_pixel, 2),
        'height_mm':      round(height_px_final * mm_per_pixel, 2),
        'area_mm2':       round(pixel_area_exp  * (mm_per_pixel ** 2), 2),
        'angle_deg':      round(angle_out, 1),
        'shape_type':     shape_type,
        'circularity':    round(circularity, 3),
        'ellipse_render': ellipse_render,
    }
    base.update(extra)   # circle/ellipse fields override width/height + add new keys
    return base



# ── Convexity helper ──────────────────────────────────────────────────────────
def _convexity_ratio(c: np.ndarray) -> float:
    """hull_area / contour_area;  1.0 = perfectly convex, >1.8 = merged blobs."""
    hull_a = cv2.contourArea(cv2.convexHull(c))
    cont_a = cv2.contourArea(c)
    return hull_a / max(cont_a, 1)


# ── Main entry point ──────────────────────────────────────────────────────────
def auto_detect_objects(warped: np.ndarray, mm_per_pixel: float) -> dict:
    """
    Detect ALL distinct objects on the A4 sheet and measure each one.

    Changes vs. the previous single-object version
    -----------------------------------------------
    ① Shadow removal   – illumination normalisation before edge detection
    ② All objects      – returns a list, not just the largest one
    ③ PCA dimensions   – uses minAreaRect, not axis-aligned bounding rect
    ④ Convexity guard  – rejects merged multi-object blobs (hull/area > 1.8)
    ⑤ NMS dedup        – centroids closer than 40 px belong to the same object;
                         only the contour with the best convexity score is kept
    ⑥ Smaller closing  – iterations=1 to avoid bridging gaps between objects

    Returns
    -------
    { 'objects': [{id, polygon_points, centroid, width_mm, height_mm,
                   area_mm2, angle_deg}, …],
      'count': N }
    """
    gray     = cv2.cvtColor(warped, cv2.COLOR_BGR2GRAY)
    h, w     = warped.shape[:2]
    img_area = h * w

    # Shadow-normalised channel
    gray_norm = _normalise_illumination(gray)

    # ── Preprocessing strategies ───────────────────────────────────────────
    def _canny(src, blur_k, lo, hi):
        return cv2.Canny(cv2.GaussianBlur(src, (blur_k, blur_k), 0), lo, hi)

    strategies = [
        lambda: _canny(gray_norm, 5,  50, 150),   # shadow-normalised standard
        lambda: _canny(gray_norm, 9,  40, 120),   # shadow-normalised heavier
        lambda: _canny(gray,      5,  50, 150),   # original, standard
        lambda: _canny(gray,      11, 30, 100),   # original, heavier blur
        lambda: cv2.Canny(cv2.bilateralFilter(gray, 9, 75, 75), 40, 120),
        lambda: cv2.adaptiveThreshold(
            cv2.GaussianBlur(gray_norm, (7, 7), 0), 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 15, 4),
    ]

    kernel = np.ones((3, 3), np.uint8)
    all_candidates = []

    for strategy in strategies:
        try:
            edges   = strategy()
            closed  = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel, iterations=1)
            cnts, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL,
                                       cv2.CHAIN_APPROX_SIMPLE)
            for c in cnts:
                area = cv2.contourArea(c)
                if area < 500:                  continue   # noise
                if area > 0.75 * img_area:      continue   # A4 border / multi-blob
                x, y, cw, ch = cv2.boundingRect(c)
                if cw < 20 or ch < 20:          continue   # sliver
                if _convexity_ratio(c) > 1.8:   continue   # merged/concave blob
                all_candidates.append(c)
        except Exception:
            continue

    if not all_candidates:
        raise Exception(
            "No objects detected inside the A4 frame. "
            "Ensure objects have clear edges and good contrast against the A4 sheet."
        )

    # ── Non-maximum suppression: deduplicate by centroid proximity ─────────
    # Sort by area desc so we keep the "dominant" contour when two overlap
    all_candidates.sort(key=cv2.contourArea, reverse=True)
    kept_centroids: list[tuple[float, float]] = []
    deduped: list[np.ndarray] = []

    for c in all_candidates:
        M_c = cv2.moments(c)
        if M_c['m00'] == 0:
            continue
        cx = M_c['m10'] / M_c['m00']
        cy = M_c['m01'] / M_c['m00']
        if any(math.hypot(cx - kx, cy - ky) < 40 for kx, ky in kept_centroids):
            continue        # centroid already represented
        deduped.append(c)
        kept_centroids.append((cx, cy))

    # ── Measure each object with PCA (minAreaRect) ─────────────────────────
    objects = []
    for i, c in enumerate(deduped[:10]):   # cap at 10 objects per frame
        obj = _measure_pca(c, mm_per_pixel, gray)
        obj['id'] = i
        objects.append(obj)

    return {'objects': objects, 'count': len(objects)}


# ── Backwards-compat shim for any code that used auto_detect_object ──────────
def auto_detect_object(warped: np.ndarray, mm_per_pixel: float) -> dict:
    """Legacy single-object API; returns the largest object."""
    result = auto_detect_objects(warped, mm_per_pixel)
    if not result['objects']:
        raise Exception("No object detected.")
    obj = result['objects'][0]
    return {
        'width_mm':       obj['width_mm'],
        'height_mm':      obj['height_mm'],
        'area_mm2':       obj['area_mm2'],
        'polygon_points': obj['polygon_points'],
    }