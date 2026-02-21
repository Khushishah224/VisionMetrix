# app/services/manual_measure.py

import numpy as np

def measure_distance(points, mm_per_pixel):

    p1 = np.array(points[0])
    p2 = np.array(points[1])

    pixel_distance = np.linalg.norm(p1 - p2)

    real_distance = pixel_distance * mm_per_pixel

    return round(real_distance,2)


def measure_polygon(points, mm_per_pixel):

    pts = np.array(points)

    pixel_area = 0.5 * abs(
        np.dot(pts[:,0], np.roll(pts[:,1], 1)) -
        np.dot(pts[:,1], np.roll(pts[:,0], 1))
    )

    real_area = pixel_area * (mm_per_pixel ** 2)

    return round(real_area,2)