import os
from typing import List, Any

import numpy as np
import requests

from models import Location, MatrixElement, DistanceMatrixResponse


def build_location_string(locations: List[Location]) -> str:
    return "|".join([f"{loc.lat},{loc.lng}" for loc in locations])

def get_full_distance_matrix(locations: List[Location]) -> DistanceMatrixResponse:
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    if not api_key:
        raise EnvironmentError("API key not set")

    location_str = build_location_string(locations)
    url = (
        f"https://maps.googleapis.com/maps/api/distancematrix/json?"
        f"origins={location_str}&destinations={location_str}&"
        f"mode=driving&units=metric&key={api_key}"
    )

    response = requests.get(url)
    data = response.json()

    if data["status"] != "OK":
        raise ValueError(data.get("error_message", "Distance Matrix API error"))

    print(data)
    matrix = []
    for i, row in enumerate(data["rows"]):
        from_id = locations[i].id
        for j, element in enumerate(row["elements"]):
            to_id = locations[j].id
            if element["status"] == "OK":
                matrix.append(MatrixElement(
                    from_id=from_id,
                    to_id=to_id,
                    distance_text=element["distance"]["text"],
                    distance_value=element["distance"]["value"],
                    duration_text=element["duration"]["text"],
                    duration_value=element["duration"]["value"]
                ))
            else:
                matrix.append(MatrixElement(
                    from_id=from_id,
                    to_id=to_id,
                    distance_text="N/A",
                    distance_value=0,
                    duration_text="N/A",
                    duration_value=0
                ))

    return DistanceMatrixResponse(matrix=matrix)

def get_distance_matrix_2d(locations: List[Location]) -> Any:
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    if not api_key:
        raise EnvironmentError("API key not set")

    location_str = build_location_string(locations)
    print(location_str)
    url = (
        f"https://maps.googleapis.com/maps/api/distancematrix/json?"
        f"origins={location_str}&destinations={location_str}&"
        f"mode=driving&units=metric&key={api_key}"
    )

    response = requests.get(url)
    data = response.json()

    if data["status"] != "OK":
        raise ValueError(data.get("error_message", "Distance Matrix API error"))

    n = len(locations)
    distance_matrix = np.zeros((n, n), dtype=int)
    duration_matrix = np.zeros((n, n), dtype=int)

    for i, row in enumerate(data["rows"]):
        for j, element in enumerate(row["elements"]):
            if element["status"] == "OK":
                distance_matrix[i][j] = element["distance"]["value"]  # meters
                duration_matrix[i][j] = element["duration"]["value"]  # seconds
            else:
                distance_matrix[i][j] = -1  # or float('inf')
                duration_matrix[i][j] = -1

    print(distance_matrix)
    print(duration_matrix)

    return {
        "ids": [loc.id for loc in locations],
        "distance_matrix": distance_matrix.tolist(),
        "duration_matrix": duration_matrix.tolist()
    }