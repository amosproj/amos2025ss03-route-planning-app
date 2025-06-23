import os
import time
import hashlib
import logging
import requests
import numpy as np

from typing import List, Optional
from solver.models import Location, DistanceAndDurationMatrices
from redis_client import RedisClient

# Configure logger
logger = logging.getLogger(__name__)

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
        logger.warning("Redis client not initialized.")
        return None

    key = make_pair_key(origin, destination)
    try:
        data = redis_client.hgetall(key)
        if data:
            return {
                "distance": int(data["distance"]),
                "duration": int(data["duration"])
            }
        return None
    except Exception as e:
        logger.error(f"Redis HGETALL failed for key {key}: {e}")
        return None

# Function to cache distance and duration using Redis Hash with TTL
def set_cached_pair(origin: Location, destination: Location, distance: int, duration: int, ttl: int = 30 * 24 * 3600):
    redis_client = RedisClient.get_client()
    if not redis_client:
        logger.warning("Redis client not initialized.")
        return

    key = make_pair_key(origin, destination)
    try:
        redis_client.hset(key, mapping={
            "distance": distance,
            "duration": duration
        })
        redis_client.expire(key, ttl)
    except Exception as e:
        logger.error(f"Redis HSET/EXPIRE failed for key {key}: {e}")

# Retry wrapper for Google API
def fetch_with_retry(url: str, retries: int = 2, delay: int = 1) -> Optional[dict]:
    for attempt in range(retries):
        try:
            response = requests.get(url, timeout=5)
            data = response.json()
            if data.get("status") == "OK":
                return data
            logger.warning(f"Google API status not OK: {data.get('status')}")
        except Exception as e:
            logger.error(f"API request failed (attempt {attempt + 1}): {e}")
        time.sleep(delay)
    return None

# Main function with optional Redis caching
def get_distance_matrix_with_cache(locations: List[Location]) -> DistanceAndDurationMatrices:
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    if not api_key:
        raise EnvironmentError("Google Maps API key not set")

    redis_client = RedisClient.get_client()
    use_cache = redis_client is not None

    n = len(locations)
    distance_matrix = np.full((n, n), -1, dtype=int)
    duration_matrix = np.full((n, n), -1, dtype=int)
    coordinates = [f"{loc.lat},{loc.lng}" for loc in locations]

    pairs_to_fetch = []
    cache_hits = 0
    cache_misses = 0

    for i in range(n):
        for j in range(n):
            if i == j:
                distance_matrix[i][j] = 0
                duration_matrix[i][j] = 0
                continue

            cached = get_cached_pair(locations[i], locations[j]) if use_cache else None

            if cached:
                distance_matrix[i][j] = cached["distance"]
                duration_matrix[i][j] = cached["duration"]
                cache_hits += 1
            else:
                pairs_to_fetch.append((i, j))
                cache_misses += 1

    hit_rate = (cache_hits / (cache_hits + cache_misses)) * 100 if (cache_hits + cache_misses) else 0
    logger.info(
        f"Cache Efficiency: {cache_hits} hits, {cache_misses} misses "
        f"(Total lookups: {cache_hits + cache_misses}, Hit rate: {hit_rate:.2f}%), "
        f"Locations: {n}"
    )
    
    max_elements = 100
    max_destinations = 25
    max_origins = max_elements // max_destinations

    for origin_start in range(0, n, max_origins):
        origin_end = min(origin_start + max_origins, n)
        origin_coords = coordinates[origin_start:origin_end]

        for dest_start in range(0, n, max_destinations):
            dest_end = min(dest_start + max_destinations, n)
            dest_coords = coordinates[dest_start:dest_end]

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

            data = fetch_with_retry(url)
            if not data:
                logger.warning("Skipping batch due to failed fetch after retries.")
                continue

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
                        if use_cache:
                            set_cached_pair(locations[oi], locations[dj], dist, dur)
                    else:
                        logger.warning(f"Element status not OK for {oi} → {dj}: {element.get('status')}")

    return DistanceAndDurationMatrices(
        location_ids=[loc.id for loc in locations],
        distance_matrix=distance_matrix.tolist(),
        duration_matrix=duration_matrix.tolist(),
    )
