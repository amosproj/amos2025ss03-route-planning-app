import os
from typing import List

import numpy as np
import requests

from solver.models import Location, MatrixElement, DistanceMatrixResponse, DistanceAndDurationMatrices


def build_location_string(locations: List[Location]) -> str:
    return "|".join([f"{loc.lat},{loc.lng}" for loc in locations])

def get_full_distance_matrix(locations: List[Location]) -> DistanceMatrixResponse:
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    if not api_key:
        raise EnvironmentError("API key not set")

    matrix = []
    max_elements = 100
    max_destinations = max_elements  # since we'll send 1 origin per request

    destination_strings = [f"{loc.lat},{loc.lng}" for loc in locations]

    for i, origin in enumerate(locations):
        origin_str = f"{origin.lat},{origin.lng}"
        from_id = origin.id

        for j in range(0, len(locations), max_destinations):
            dest_batch = destination_strings[j:j + max_destinations]
            dest_ids = locations[j:j + max_destinations]
            dest_str = "|".join(dest_batch)

            url = (
                f"https://maps.googleapis.com/maps/api/distancematrix/json?"
                f"origins={origin_str}&destinations={dest_str}&"
                f"mode=driving&units=metric&key={api_key}"
            )

            response = requests.get(url)
            data = response.json()

            if data["status"] != "OK":
                raise ValueError(data.get("error_message", "Distance Matrix API error"))

            elements = data["rows"][0]["elements"]

            for offset, element in enumerate(elements):
                to_id = dest_ids[offset].id
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

def get_distance_matrix_2d(locations: List[Location]) -> DistanceAndDurationMatrices:
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    if not api_key:
        raise EnvironmentError("API key not set")

    n = len(locations)
    distance_matrix = np.zeros((n, n), dtype=int)
    duration_matrix = np.zeros((n, n), dtype=int)

    # Google API limit: max 100 elements = origins x destinations
    max_elements = 100
    max_destinations = max_elements  # because we only send 1 origin per batch

    # Pre-format all destination strings
    destination_strings = [
        f"{loc.lat},{loc.lng}" for loc in locations
    ]

    for i, origin in enumerate(locations):
        origin_str = f"{origin.lat},{origin.lng}"

        for j in range(0, n, max_destinations):
            # Slice destination batch
            dest_batch = destination_strings[j:j + max_destinations]
            dest_str = "|".join(dest_batch)

            url = (
                f"https://maps.googleapis.com/maps/api/distancematrix/json?"
                f"origins={origin_str}&destinations={dest_str}&"
                f"mode=driving&units=metric&key={api_key}"
            )

            response = requests.get(url)
            data = response.json()

            if data["status"] != "OK":
                raise ValueError(data.get("error_message", "Distance Matrix API error"))

            elements = data["rows"][0]["elements"]
            for offset, element in enumerate(elements):
                dest_index = j + offset
                if element["status"] == "OK":
                    distance_matrix[i][dest_index] = element["distance"]["value"]
                    duration_matrix[i][dest_index] = element["duration"]["value"] // 60  # seconds → minutes
                else:
                    distance_matrix[i][dest_index] = -1
                    duration_matrix[i][dest_index] = -1

    ids = [loc.id for loc in locations]
    response = DistanceAndDurationMatrices(
        ids=ids,
        distance_matrix=distance_matrix.tolist(),
        duration_matrix=duration_matrix.tolist()
    )
    return response