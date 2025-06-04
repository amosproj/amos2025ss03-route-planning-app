import os
from typing import List
import numpy as np
import requests

from solver.models import Location, DistanceAndDurationMatrices


def get_distance_matrix_2d(locations: List[Location]) -> DistanceAndDurationMatrices:
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    if not api_key:
        raise EnvironmentError("Google Maps API key not set")

    n = len(locations)
    distance_matrix = np.full((n, n), -1, dtype=int)
    duration_matrix = np.full((n, n), -1, dtype=int)

    # API limit: 100 elements per request = origins × destinations
    max_elements = 100
    max_destinations = 25
    max_origins = max_elements // max_destinations

    # Prepare formatted coordinates
    coordinates = [f"{loc.lat},{loc.lng}" for loc in locations]

    for origin_start in range(0, n, max_origins):
        origin_end = min(origin_start + max_origins, n)
        origin_batch = coordinates[origin_start:origin_end]

        for dest_start in range(0, n, max_destinations):
            dest_end = min(dest_start + max_destinations, n)
            dest_batch = coordinates[dest_start:dest_end]

            url = (
                f"https://maps.googleapis.com/maps/api/distancematrix/json?"
                f"origins={'|'.join(origin_batch)}&destinations={'|'.join(dest_batch)}&"
                f"mode=driving&units=metric&key={api_key}"
            )

            response = requests.get(url)
            data = response.json()

            if data.get("status") != "OK":
                raise ValueError(data.get("error_message", f"Distance Matrix API error: {data.get('status')}"))

            rows = data.get("rows", [])
            for i, row in enumerate(rows):
                for j, element in enumerate(row.get("elements", [])):
                    origin_idx = origin_start + i
                    dest_idx = dest_start + j
                    if element.get("status") == "OK":
                        distance_matrix[origin_idx][dest_idx] = element["distance"]["value"]  # in meters
                        duration_matrix[origin_idx][dest_idx] = element["duration"]["value"] // 60  # seconds → minutes


    ids = [loc.id for loc in locations]
    response = DistanceAndDurationMatrices(
        location_ids=ids,
        distance_matrix=distance_matrix.tolist(),
        duration_matrix=duration_matrix.tolist()
    )

    return response