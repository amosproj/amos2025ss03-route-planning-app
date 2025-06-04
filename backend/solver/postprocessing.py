from typing import List
from solver.models import Route, RouteMetrics
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
            current = appts[i]
            nxt = appts[i + 1]

            from_index = location_ids.index(current.location.id)
            to_index = location_ids.index(nxt.location.id)

            travel_time = time_matrix[from_index][to_index]
            travel_distance = distance_matrix[from_index][to_index]

            # Add appointment-level travel info
            current.travel_time_to_next_min = travel_time
            current.travel_distance_to_next_km = round(travel_distance / 1000.0, 2)

            total_travel_time += travel_time
            total_travel_distance += travel_distance

            total_service_time += current.service_time

            current_end = to_minutes(current.appointment_start) + current.service_time
            next_start = to_minutes(nxt.appointment_start)
            wait_time = max(0, next_start - current_end)
            total_idle_time += wait_time

        # Handle last appointment service time
        last_appt = appts[-1]
        total_service_time += last_appt.service_time
        last_appt.travel_time_to_next_min = None
        last_appt.travel_distance_to_next_km = None

        total_travel_distance_km = round(total_travel_distance / 1000.0, 2)

        metrics = RouteMetrics(
            route_id=route.route_id,
            vehicle_id=route.vehicle_id if route.vehicle_id is not None else -1,
            num_appointments=len(appts),
            total_travel_time_min=total_travel_time,
            total_travel_distance_km=total_travel_distance_km,
            total_service_time_min=total_service_time,
            total_idle_time_min=total_idle_time,
        )

        enriched_routes.append(Route(
            route_id=route.route_id,
            vehicle_id=route.vehicle_id,
            distance_traveled=route.distance_traveled,
            time_traveled=route.time_traveled,
            appointments=appts,
            route_metrics=metrics
        ))

    return enriched_routes
