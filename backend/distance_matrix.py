import os
import time
import hashlib
import logging
import requests
import numpy as np
from typing import List, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed

from solver.models import Location, DistanceAndDurationMatrices
from redis_client import RedisClient

# Configure logger
logger = logging.getLogger(__name__)


# Generate a unique Redis cache key for a location pair using hashed coordinates
def make_pair_key(origin: Location, destination: Location, precision=5) -> str:
    origin_lat = round(origin.lat, precision)
    origin_lng = round(origin.lng, precision)
    dest_lat = round(destination.lat, precision)
    dest_lng = round(destination.lng, precision)
    raw_key = f"{origin_lat},{origin_lng}-{dest_lat},{dest_lng}"
    hashed_key = hashlib.md5(raw_key.encode()).hexdigest()
    return f"cache:distance_matrix:{hashed_key}"


# Cache a distance-duration pair in Redis with optional TTL (default: 30 days)
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


# Google API call with retry and exponential backoff
def fetch_with_retry(url: str, retries: int = 3, base_delay: int = 1) -> Optional[dict]:
    for attempt in range(retries):
        try:
            response = requests.get(url, timeout=5)
            data = response.json()
            if data.get("status") == "OK":
                return data
            logger.warning(f"Google API status not OK (attempt {attempt + 1}): {data.get('status')}")
        except Exception as e:
            logger.error(f"API request failed (attempt {attempt + 1}): {e}")

        # Wait with exponential backoff: 1s, 2s, 4s...
        delay = base_delay * (2 ** attempt)
        logger.info(f"Retrying in {delay} seconds...")
        time.sleep(delay)

    logger.error(f"All {retries} retries failed for URL: {url}")
    return None


# Main function to build distance & duration matrix, using Redis cache + Google API batching
def get_distance_matrix_with_cache(locations: List[Location]) -> DistanceAndDurationMatrices:
    # Start time of the operation
    start_time = time.time()
    
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    if not api_key:
        raise EnvironmentError("Google Maps API key not set")

    redis_client = RedisClient.get_client()
    use_cache = redis_client is not None

    n = len(locations)
    distance_matrix = np.full((n, n), -1, dtype=int)
    duration_matrix = np.full((n, n), -1, dtype=int)
    coordinates = [f"{loc.lat},{loc.lng}" for loc in locations]

    # Cache check: use Redis pipeline to batch get cached values
    pairs_to_fetch = []
    cache_hits = 0
    cache_misses = 0
    pair_indices = []
    pair_keys = []

    if use_cache:
        pipe = redis_client.pipeline()
        for i in range(n):
            for j in range(n):
                if i == j:
                    distance_matrix[i][j] = 0
                    duration_matrix[i][j] = 0
                    continue
                key = make_pair_key(locations[i], locations[j])
                pair_indices.append((i, j))
                pair_keys.append(key)
                pipe.hgetall(key)

        redis_results = pipe.execute()

        # Process results from Redis
        for (i, j), data in zip(pair_indices, redis_results):
            if data and "distance" in data and "duration" in data:
                distance_matrix[i][j] = int(data["distance"])
                duration_matrix[i][j] = int(data["duration"])
                cache_hits += 1
            else:
                pairs_to_fetch.append((i, j))
                cache_misses += 1
    else:
        # If no Redis, treat all as cache misses
        for i in range(n):
            for j in range(n):
                if i == j:
                    distance_matrix[i][j] = 0
                    duration_matrix[i][j] = 0
                    continue
                pairs_to_fetch.append((i, j))
                cache_misses += 1

    # Log cache performance
    hit_rate = (cache_hits / (cache_hits + cache_misses)) * 100 if (cache_hits + cache_misses) else 0
    logger.info(
        f"Cache Efficiency: {cache_hits} hits, {cache_misses} misses "
        f"(Total lookups: {cache_hits + cache_misses}, Hit rate: {hit_rate:.2f}%), "
        f"Locations: {n}"
    )

    # Google API batching constraints
    max_elements = 100
    max_destinations = 25
    max_origins = max_elements // max_destinations

    batch_requests = []

    # Create all necessary origin-destination batch requests
    for origin_start in range(0, n, max_origins):
        origin_end = min(origin_start + max_origins, n)
        origin_coords = coordinates[origin_start:origin_end]

        for dest_start in range(0, n, max_destinations):
            dest_end = min(dest_start + max_destinations, n)
            dest_coords = coordinates[dest_start:dest_end]

            # Collect only uncached pairs
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
            batch_requests.append((origin_start, dest_start, sub_pairs, url))

    # Helper function to process a single batch request
    def process_batch(origin_start, dest_start, sub_pairs, url):
        data = fetch_with_retry(url)
        return (origin_start, dest_start, sub_pairs, data)

    # Run all Google API batches in parallel (up to 10 threads)
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [
            executor.submit(process_batch, origin_start, dest_start, sub_pairs, url)
            for origin_start, dest_start, sub_pairs, url in batch_requests
        ]

        for future in as_completed(futures):
            origin_start, dest_start, sub_pairs, data = future.result()
            if not data:
                logger.warning("Skipping batch due to failed fetch after retries.")
                continue

            rows = data.get("rows", [])
            for i, row in enumerate(rows):
                for j, element in enumerate(row.get("elements", [])):
                    oi = origin_start + i
                    dj = dest_start + j
                    if (oi, dj) not in sub_pairs:
                        continue
                    if element.get("status") == "OK":
                        dist = element["distance"]["value"]
                        dur = element["duration"]["value"] // 60  # seconds to minutes
                        distance_matrix[oi][dj] = dist
                        duration_matrix[oi][dj] = dur
                        if use_cache:
                            set_cached_pair(locations[oi], locations[dj], dist, dur)
                    else:
                        logger.warning(f"Element status not OK for {oi} → {dj}: {element.get('status')}")

    # Final matrix validation
    missing_entries = np.sum(distance_matrix == -1)
    if missing_entries > 0:
        raise RuntimeError(
            f"Distance matrix build failed: {missing_entries} elements are still missing."
        )

    # Log total time taken for the operation
    elapsed_time = time.time() - start_time
    logger.info(f"Distance matrix computation completed in {elapsed_time:.2f} seconds.")

    return DistanceAndDurationMatrices(
        location_ids=[loc.id for loc in locations],
        distance_matrix=distance_matrix.tolist(),
        duration_matrix=duration_matrix.tolist(),
    )
