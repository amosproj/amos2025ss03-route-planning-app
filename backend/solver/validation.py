from typing import List, Set
from collections import defaultdict
from solver.models import Route, SolutionValidationReport
from solver.util import to_minutes


def validate_solution_and_report(
    routes: List[Route],
    time_matrix: List[List[int]],
    addresses: List[str],
    depot_start_location_id: str,
    depot_end_location_id: str
) -> SolutionValidationReport:
    errors = []
    visited_ids: List[str] = []
    location_to_routes = defaultdict(list)

    for route in routes:
        appts = route.appointments

        if not appts:
            errors.append(f"Route {route.route_id} has no appointments.")
            continue

        # Check depot correctness
        if appts[0].location.id != depot_start_location_id:
            errors.append(f"Route {route.route_id} does not start at the correct depot: {appts[0].location.id}")
        if appts[-1].location.id != depot_end_location_id:
            errors.append(f"Route {route.route_id} does not end at the correct depot: {appts[-1].location.id}")

        # Route validity: appointment windows and travel feasibility
        for i in range(1, len(appts) - 1):
            current = appts[i]
            nxt = appts[i + 1]

            from_id = current.location.id
            to_id = nxt.location.id
            from_index = i
            to_index = i + 1

            current_start = to_minutes(current.appointment_start)
            current_end = to_minutes(current.appointment_end)
            service_time = current.service_time

            # Check appointment fits within its window
            if current_start + service_time > current_end:
                errors.append(
                    f"Route {route.route_id}: Appointment at {from_id} exceeds its time window "
                    f"(Start: {current_start}, End: {current_end}, Service: {service_time})."
                )

            # Get travel time from current to next
            travel_time = time_matrix[from_index][to_index]
            if travel_time is None:
                errors.append(
                    f"Route {route.route_id} has no travel time from {from_id} to {to_id}."
                )
                continue

            arrival_at_next = current_start + service_time + travel_time
            nxt_window_start = to_minutes(nxt.appointment_start)
            nxt_window_end = to_minutes(nxt.appointment_end)

            if arrival_at_next > nxt_window_end:
                errors.append(
                    f"Route {route.route_id} cannot reach appointment {to_id} in time "
                    f"(Arrival: {arrival_at_next} > End: {nxt_window_end})."
                )

            if current.location and getattr(current.location, "id", None):
                visited_ids.append(from_id)
                location_to_routes[from_id].append(route.route_id)
            else:
                errors.append(
                    f"Route {route.route_id}: Invalid location ID at index {i}."
                )

    # Duplicate visits within a single route
    duplicates = [loc_id for loc_id in set(visited_ids) if visited_ids.count(loc_id) > 1]
    if duplicates:
        errors.append(f"Appointments visited multiple times in a single route: {duplicates}")

    # Appointments visited in multiple routes
    cross_route_duplicates = {
        loc_id: route_ids for loc_id, route_ids in location_to_routes.items() if len(set(route_ids)) > 1
    }
    for loc_id, route_ids in cross_route_duplicates.items():
        errors.append(
            f"Appointment with location ID '{loc_id}' appears in multiple routes: {route_ids}"
        )

    # Missed appointments
    all_ids = set(addresses) - {depot_start_location_id, depot_end_location_id}
    visited_set: Set[str] = set(visited_ids)
    missed = list(all_ids - visited_set)
    if missed:
        errors.append(f"Appointments not visited: {missed}")

    return SolutionValidationReport(
        is_valid=len(errors) == 0,
        errors=errors,
        missing_appointments=missed,
        duplicate_appointments=duplicates,
    )
