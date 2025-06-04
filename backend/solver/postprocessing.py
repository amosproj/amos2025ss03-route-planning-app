from typing import List
from solver.models import Route, RouteMetrics, EnrichedRoute
from solver.util import to_minutes

def extract_enriched_metrics(
    routes: List[Route],
    time_matrix: List[List[int]],
    distance_matrix: List[List[float]],
    location_ids: List[str],
) -> List[Route]:
    enriched_routes = []

    for route in routes:
        appts = route.appointments
        total_travel_time = 0
        total_travel_distance = 0.0
        total_service_time = 0
        total_idle_time = 0

        for i in range(len(appts) - 1):
            from_id = appts[i].location.id
            to_id = appts[i + 1].location.id

            from_index = location_ids.index(from_id)
            to_index = location_ids.index(to_id)

            travel_time = time_matrix[from_index][to_index]
            travel_distance = distance_matrix[from_index][to_index]

            total_travel_time += travel_time
            total_travel_distance += travel_distance

            current_service = appts[i].service_time
            total_service_time += current_service

            current_end = to_minutes(appts[i].appointment_start) + current_service
            next_start = to_minutes(appts[i + 1].appointment_start)
            wait_time = max(0, next_start - current_end)
            total_idle_time += wait_time

        total_service_time += appts[-1].service_time

        total_travel_distance_km = total_travel_distance / 1000.0

        metrics = RouteMetrics(
            route_id=route.route_id,
            vehicle_id=route.vehicle_id if route.vehicle_id is not None else -1,
            num_appointments=len(appts),
            total_travel_time_min=total_travel_time,
            total_travel_distance_km=total_travel_distance_km,
            total_service_time_min=total_service_time,
            total_idle_time_min=total_idle_time,
        )

        enriched_routes.append(EnrichedRoute(
            route_id=route.route_id,
            vehicle_id=route.vehicle_id,
            distance_traveled=route.distance_traveled,
            time_traveled=route.time_traveled,
            appointments=appts,
            route_metrics=metrics
        ))

    return enriched_routes
