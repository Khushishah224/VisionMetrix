### `POST /api/detect-a4`
**Purpose:** Calibrate measurement scale using A4 reference sheet
**Input:** `session_id` (form field), `file` (image upload)
**Output:**
```json
{
  "mm_per_pixel": 0.2625,
  "message": "A4 detected and perspective corrected successfully."
}
```

### `POST /api/auto-measure`
**Purpose:** Detect and measure all objects on A4 sheet
**Input:** `session_id` (form field), `file` (image upload)
**Output:**
```json
{
  "objects": [
    {
      "id": 0,
      "width_mm": 85.4,
      "height_mm": 54.2,
      "area_mm2": 4629.3,
      "shape_type": "polygon",
      "polygon_points": [[x1,y1], [x2,y2]],
      "centroid": [400, 565],
      "angle_deg": 15.3,
      "circularity": 0.891
    }
  ],
  "count": 1,
  "selected_id": 0,
  "warped_b64": "data:image/png;base64,..."
}
```

### `POST /api/manual-distance`
**Purpose:** Measure distance between two user-clicked points
**Input:** `session_id`, `points`
**Output:** `{"distance_mm": 127.8}`

### `POST /api/manual-polygon`
**Purpose:** Measure area of user-drawn polygon
**Input:** `session_id`, `points`
**Output:** `{"area_mm2": 8540.6}`

### `GET /api/warped-frame/{session_id}`
**Purpose:** Retrieve calibrated warped A4 image for manual mode overlay
**Output:** PNG image (binary)

### `GET /api/warp-dims`
**Purpose:** Get fixed warped image dimensions for frontend scaling
**Output:** `{"warp_width": 800, "warp_height": 1131}`

---