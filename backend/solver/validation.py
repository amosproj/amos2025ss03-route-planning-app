from typing import List, Set, Dict
from collections import defaultdict
from solver.models import Route, SolutionValidationReport, RouteValidationError
from solver.util import to_minutes, to_hhmm

def validate_solution_and_report(
    routes: List[Route],
    time_matrix: List[List[int]],
    addresses: List[str],
    depot_start_location_id: str,
    depot_end_location_id: str
) -> SolutionValidationReport:
    global_errors = []
    route_level_errors = []
    visited_ids: List[str] = []
    location_to_routes = defaultdict(list)

    for route in routes:
        appts = route.appointments
        route_errors = []

        if not appts:
            route_errors.append(f"Route {route.route_id} has no appointments.")
            route_level_errors.append(RouteValidationError(route_id=route.route_id, errors=route_errors))
            continue

        if appts[0].location.id != depot_start_location_id:
            route_errors.append(f"Route does not start at correct depot: {appts[0].location.id}")
        if appts[-1].location.id != depot_end_location_id:
            route_errors.append(f"Route does not end at correct depot: {appts[-1].location.id}")

        for i in range(len(appts) - 1):
            current = appts[i]
            nxt = appts[i + 1]

            if not current.location or not nxt.location:
                route_errors.append(f"Invalid location in route {route.route_id}.")
                continue

            from_id = current.location.id
            to_id = nxt.location.id
            from_index = i
            to_index = i + 1

            current_start = to_minutes(current.appointment_start)
            current_end = to_minutes(current.appointment_end)
            service_time = current.service_time

            if current_start + service_time > current_end:
                route_errors.append(
                    f"Appointment at {from_id} exceeds its window "
                    f"(Start: {to_hhmm(current_start)}, End: {to_hhmm(current_end)}, Service: {service_time} min)."
                )

            travel_time = time_matrix[from_index][to_index]
            if travel_time is None:
                route_errors.append(f"No travel time from {from_id} to {to_id}.")
                continue

            arrival_at_next = current_start + service_time + travel_time
            nxt_window_start = to_minutes(nxt.appointment_start)
            nxt_window_end = to_minutes(nxt.appointment_end)

            if arrival_at_next < nxt_window_start:
                arrival_at_next = nxt_window_start  # Wait until next window starts

            if arrival_at_next + nxt.service_time > nxt_window_end:
                route_errors.append(
                    f"Cannot finish appointment at {to_id} in time "
                    f"(Finish: {to_hhmm(arrival_at_next + nxt.service_time)} > Window End: {to_hhmm(nxt_window_end)})."
                )

            if from_id not in {depot_start_location_id, depot_end_location_id}:
                visited_ids.append(from_id)
                location_to_routes[from_id].append(route.route_id)

        if route_errors:
            route_level_errors.append(RouteValidationError(route_id=route.route_id, errors=route_errors))

    duplicates = [loc_id for loc_id in set(visited_ids) if visited_ids.count(loc_id) > 1]
    if duplicates:
        global_errors.append(f"Appointments visited multiple times in same route: {duplicates}")

    cross_route_duplicates = {
        loc_id: route_ids for loc_id, route_ids in location_to_routes.items() if len(set(route_ids)) > 1
    }
    for loc_id, route_ids in cross_route_duplicates.items():
        global_errors.append(f"Appointment {loc_id} appears in multiple routes: {route_ids}")

    all_ids = set(addresses) - {depot_start_location_id, depot_end_location_id}
    visited_set: Set[str] = set(visited_ids)
    missed = list(all_ids - visited_set)
    if missed:
        global_errors.append(f"Appointments not visited: {missed}")

    is_valid = not global_errors and not route_level_errors

    return SolutionValidationReport(
        is_valid=is_valid,
        errors=global_errors,
        missing_appointments=missed,
        duplicate_appointments=duplicates,
        route_level_errors=route_level_errors
    )