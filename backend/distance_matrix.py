import os
from typing import List, Optional
import numpy as np
import requests
from solver.models import Location, DistanceAndDurationMatrices
from redis_client import RedisClient
import hashlib

# Function to create a unique key for origin-destination pairs
def make_pair_key(origin: Location, destination: Location, precision=5) -> str:
    origin_lat = round(origin.lat, precision)
    origin_lng = round(origin.lng, precision)
    dest_lat = round(destination.lat, precision)
    dest_lng = round(destination.lng, precision)

    raw_key = f"{origin_lat},{origin_lng}-{dest_lat},{dest_lng}"
    hashed_key = hashlib.md5(raw_key.encode()).hexdigest()
    return f"cache:distance_matrix:{hashed_key}"

# Function to get cached distance and duration from Redis Hash
def get_cached_pair(origin: Location, destination: Location) -> Optional[dict]:
    redis_client = RedisClient.get_client()
    if not redis_client:
        print("⚠️ Redis client not initialized.")
        return None

    key = make_pair_key(origin, destination)
    try:
        data = redis_client.hgetall(key)
        if data:
            print(f"✅ Cache HIT for {origin.id} → {destination.id}")
            return {
                "distance": int(data["distance"]),
                "duration": int(data["duration"])
            }
        else:
            print(f"🔍 Cache MISS for {origin.id} → {destination.id}")
            return None
    except Exception as e:
        print(f"❌ Redis HGETALL failed for key {key}: {e}")
        return None


# Function to cache distance and duration using Redis Hash with TTL
def set_cached_pair(origin: Location, destination: Location, distance: int, duration: int, ttl: int = 30 * 24 * 3600):
    redis_client = RedisClient.get_client()
    if not redis_client:
        print("⚠️ Redis client not initialized.")
        return

    key = make_pair_key(origin, destination)
    try:
        redis_client.hset(key, mapping={
            "distance": distance,
            "duration": duration
        })
        redis_client.expire(key, ttl)
        print(f"📦 Cached {origin.id} → {destination.id} with distance={distance}, duration={duration}")
    except Exception as e:
        print(f"❌ Redis HSET/EXPIRE failed for key {key}: {e}")


# Function to get the distance and duration matrix for a list of locations
def get_distance_matrix_with_cache(locations: List[Location]) -> DistanceAndDurationMatrices:
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    if not api_key:
        raise EnvironmentError("Google Maps API key not set")

    n = len(locations)
    distance_matrix = np.full((n, n), -1, dtype=int)
    duration_matrix = np.full((n, n), -1, dtype=int)

    coordinates = [f"{loc.lat},{loc.lng}" for loc in locations]

    # Prepare uncached origin-destination index pairs
    pairs_to_fetch = []

    for i in range(n):
        for j in range(n):
            if i == j:
                distance_matrix[i][j] = 0
                duration_matrix[i][j] = 0
                continue

            cached = get_cached_pair(locations[i], locations[j])
            if cached:
                distance_matrix[i][j] = cached["distance"]
                duration_matrix[i][j] = cached["duration"]
            else:
                pairs_to_fetch.append((i, j))

    # Fetch uncached pairs using API in batches
    max_elements = 100
    max_destinations = 25
    max_origins = max_elements // max_destinations

    # Group into batch calls
    for origin_start in range(0, n, max_origins):
        origin_end = min(origin_start + max_origins, n)
        origin_batch = locations[origin_start:origin_end]
        origin_coords = coordinates[origin_start:origin_end]

        for dest_start in range(0, n, max_destinations):
            dest_end = min(dest_start + max_destinations, n)
            dest_batch = locations[dest_start:dest_end]
            dest_coords = coordinates[dest_start:dest_end]

            # Filter only needed pairs for this submatrix
            sub_pairs = [
                (i, j)
                for i in range(origin_start, origin_end)
                for j in range(dest_start, dest_end)
                if (i, j) in pairs_to_fetch
            ]
            if not sub_pairs:
                continue

            url = (
                f"https://maps.googleapis.com/maps/api/distancematrix/json?"
                f"origins={'|'.join(origin_coords)}&destinations={'|'.join(dest_coords)}&"
                f"mode=driving&units=metric&key={api_key}"
            )

            response = requests.get(url)
            data = response.json()

            if data.get("status") != "OK":
                raise ValueError(data.get("error_message", f"Distance Matrix API error: {data.get('status')}"))

            rows = data.get("rows", [])
            for i, row in enumerate(rows):
                for j, element in enumerate(row.get("elements", [])):
                    oi = origin_start + i
                    dj = dest_start + j
                    if (oi, dj) not in pairs_to_fetch:
                        continue
                    if element.get("status") == "OK":
                        dist = element["distance"]["value"]
                        dur = element["duration"]["value"] // 60
                        distance_matrix[oi][dj] = dist
                        duration_matrix[oi][dj] = dur
                        set_cached_pair(locations[oi], locations[dj], dist, dur)

    return DistanceAndDurationMatrices(
        location_ids=[loc.id for loc in locations],
        distance_matrix=distance_matrix.tolist(),
        duration_matrix=duration_matrix.tolist(),
    )



def get_distance_matrix(locations: List[Location]) -> DistanceAndDurationMatrices:
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