# backend/solver/solver.py
import math
import numpy as np
from typing import Any
from ortools.constraint_solver import pywrapcp, routing_enums_pb2

from exceptionStrings import APPOINTMENT_OVERLAP_TO_BIG
from solver.models import *
from solver.preprocessing import *
from solver.util import *
from solver.validation import validate_solution_and_report
from solver.postprocessing import extract_enriched_metrics
from typing import List

from solver.models import FilledVehicle


def build_compatibility_matrix(appointments: List[EnhancedAppointment], vehicles: List[FilledVehicle]) -> List[List[bool]]:
    matrix = []
    for appointment in appointments:
        required_skills = appointment.skills_needed
        required_workers = appointment.number_of_workers
        row = []
        for vehicle in vehicles:
            vehicle_skills = vehicle.skills
            available_workers = vehicle.worker_amount
            has_required_skills = required_skills.issubset(vehicle_skills)
            has_enough_workers = available_workers >= required_workers
            is_compatible = has_required_skills and has_enough_workers
            row.append(is_compatible)
        matrix.append(row)
    return matrix


def solve_appointment_routing(
    optimization_request: EnhancedOptimizationRequest,
    slack_max: int = 1440,
    max_time_per_vehicle: int = 1440,
    optimization_time_limit: int = 15
) -> Solution:

    optimization_problem_information: List[ProblemMetric] = collect_problem_metrics(optimization_request)

    # Time windows
    appointment_time_windows = [(0, 1440)]  # Depot open all day
    for appt in optimization_request.appointments:
        appointment_time_windows.append((to_minutes(appt.appointment_start), to_minutes(appt.appointment_end)))

    num_locations = len(optimization_request.location_ids)
    num_vehicles = len(optimization_request.company_info.vehicles)

    # Service times in minutes
    service_times = [0]  # Depot
    for appt in optimization_request.appointments:
        service_times.append(appt.service_time)
    service_times += [0] * (2 * num_vehicles)


    vehicle_start_end_indices = list(range(num_locations - 2 * num_vehicles, num_locations))
    start_indices = vehicle_start_end_indices[::2]
    end_indices = vehicle_start_end_indices[1::2]

    # Create mapping between OR-Tools vehicle indices and actual vehicle IDs
    vehicle_index_to_id = {i: vehicle.vehicle_id for i, vehicle in enumerate(optimization_request.company_info.vehicles)}

    # Routing setup
    manager = pywrapcp.RoutingIndexManager(num_locations, num_vehicles, start_indices,end_indices)
    routing = pywrapcp.RoutingModel(manager)

    # Time callback (travel time + service time)
    def time_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return optimization_request.time_matrix[from_node][to_node] + service_times[from_node]

    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return optimization_request.distance_matrix[from_node][to_node]

    time_callback_index = routing.RegisterTransitCallback(time_callback)
    distance_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(time_callback_index)

    # Add Time Dimension
    routing.AddDimension(
        time_callback_index,
        slack_max,
        max_time_per_vehicle,
        False,
        "Time"
    )
    time_dimension = routing.GetDimensionOrDie("Time")
    # Treat waiting time as equivalent to driving time
    time_dimension.SetSlackCostCoefficientForAllVehicles(1)
    time_dimension.SetGlobalSpanCostCoefficient(100)

    for vehicle_index, _ in enumerate(optimization_request.company_info.vehicles):
        filled_vehicle = optimization_request.company_info.vehicles[vehicle_index]

        start = filled_vehicle.operation_hours.start_minutes
        end = filled_vehicle.operation_hours.end_minutes

        start_index = routing.Start(vehicle_index)
        end_index = routing.End(vehicle_index)

        time_dimension.CumulVar(start_index).SetRange(start, end)
        time_dimension.CumulVar(end_index).SetRange(start, end)

    # Apply time windows and enforce: arrival + service_time <= end
    for idx, (start, end) in enumerate(appointment_time_windows):
        index = manager.NodeToIndex(idx)
        cumul = time_dimension.CumulVar(index)

        cumul.SetRange(start, end)
        routing.solver().Add(cumul + service_times[idx] <= end)

    #Allow skipping appointments with very high penalty. This makes possible a fast first valid Solution
    penalty_default = 100000
    compat_matrix = build_compatibility_matrix(optimization_request.appointments, optimization_request.company_info.vehicles)

    for appt_idx, row in enumerate(compat_matrix):
        # depot = 0, therefore +1
        node_index = manager.NodeToIndex(appt_idx + 1)

        allowed_vehicle_ids = [vehicle_idx for vehicle_idx, is_ok in enumerate(row) if is_ok]

        # Set only if there are allowed vehicles
        if allowed_vehicle_ids:
            routing.SetAllowedVehiclesForIndex(allowed_vehicle_ids, node_index)

        # Set disjunction: 0 penalty if no vehicle can serve this appointment, else 10000
        penalty = 0 if not allowed_vehicle_ids else penalty_default
        #TODO inculde zero-compatibility-information in validation report
        routing.AddDisjunction([node_index], penalty)

    # Search parameters
    search_params = pywrapcp.DefaultRoutingSearchParameters()
    search_params.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PARALLEL_CHEAPEST_INSERTION
    search_params.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    search_params.time_limit.FromSeconds(optimization_time_limit)
    search_params.log_search = False

    # Solve
    solution = routing.SolveWithParameters(search_params)
    if not solution:
        return Solution(
            total_distance_traveled=0,
            max_distance_traveled=0,
            routes=[],
            method_used="No solution",
            problem_metrics=optimization_problem_information,
            validation_report=SolutionValidationReport(
                is_valid=False,
                errors=["No solution found"],
                missing_appointments=[],
                duplicate_appointments=[],
                route_level_errors=[]
            )
        )

    total_time = 0
    total_distance = 0
    max_distance = 0
    max_time = 0
    routes: List[Route] = []

    for vehicle_index in range(num_vehicles):
        # Get the actual vehicle ID from our mapping
        actual_vehicle_id = vehicle_index_to_id[vehicle_index]

        index = routing.Start(vehicle_index)
        start_index = routing.Start(vehicle_index)
        end_index = routing.End(vehicle_index)

        start_time = solution.Value(time_dimension.CumulVar(start_index))
        end_time = solution.Value(time_dimension.CumulVar(end_index))


        start_hours = start_time // 60
        start_minutes = start_time % 60
        end_hours = end_time // 60
        end_minutes = end_time % 60
        # TODO add this starting_time to route information as soon as the data structure exists
        print(f"Vehicle {actual_vehicle_id} (index {vehicle_index}):")
        print(f"  Leaves the depot at {start_hours:02d}:{start_minutes:02d}")
        print(f"  Returns to the depot at {end_hours:02d}:{end_minutes:02d}")

        route_time = 0
        route_distance = 0
        vehicle_route = []

        previous_index = index

        print(f"index: {index}")
        print(f"num_locations: {num_locations}")
        print(f"num_vehicles: {num_vehicles}")
        while not routing.IsEnd(index):
            node_index = manager.IndexToNode(index)
            print(f"node_index:{node_index}")

            # Add appointment if it's not the depot
            try:
                if 0 < node_index <= len(optimization_request.appointments):
                    vehicle_route.append(optimization_request.appointments[node_index - 1])
            except IndexError:
                print(f"Invalid node_index={node_index} for appointments (len={len(optimization_request.appointments)})")

            next_index = solution.Value(routing.NextVar(index))
            from_node = manager.IndexToNode(index)
            to_node = manager.IndexToNode(next_index)

            # Travel time and distance

            travel_time = optimization_request.time_matrix[from_node][to_node]
            travel_distance = optimization_request.distance_matrix[from_node][to_node]

            # Arrival time at current node
            arrival_time = solution.Value(time_dimension.CumulVar(index))

            # Service time and waiting time
            waiting_time = 0
            if 0 < node_index <= len(optimization_request.appointments):
                appt_start = appointment_time_windows[node_index][0]
                waiting_time = max(0, appt_start - arrival_time) if 0 < node_index <= len(optimization_request.appointments) else 0

            service_time = service_times[node_index]

            # Total time spent at this node
            route_time += travel_time + waiting_time + service_time
            route_distance += travel_distance

            index = next_index

        last_node = manager.IndexToNode(previous_index)
        depot_node = manager.IndexToNode(routing.End(vehicle_index))

        travel_time_to_depot = optimization_request.time_matrix[last_node][depot_node]
        travel_distance_to_depot = optimization_request.distance_matrix[last_node][depot_node]

        route_time += travel_time_to_depot
        route_distance += travel_distance_to_depot

        # Add dummy depot start and end
        #get dummy times first
        start, end = extract_day_bounds(optimization_request.appointments[0].appointment_start)

        vehicle_route.insert(0, EnhancedAppointment(
            address=optimization_request.company_info.vehicles[vehicle_index].start_address,
            appointment_start= start,
            appointment_end= end,
            service_time=0,
            skills_needed = set(),
            location=optimization_request.company_info.vehicles[vehicle_index].start_location,
            number_of_workers=0
        ))

        vehicle_route.append(EnhancedAppointment(
            address=optimization_request.company_info.vehicles[vehicle_index].finish_address,
            appointment_start= start,
            appointment_end= end,
            service_time=0,
            skills_needed=set(),
            location=optimization_request.company_info.vehicles[vehicle_index].finish_location,
            number_of_workers=0
        ))

        total_time += route_time
        total_distance += route_distance
        max_distance = max(max_distance, route_distance)
        max_time = max(max_time, route_time)

        routes.append(
            Route(
                route_id=vehicle_index,  # Use vehicle_index as route_id for consistency with OR-Tools
                vehicle_id=actual_vehicle_id,  # Use the actual vehicle ID from the input
                distance_traveled=route_distance,
                time_traveled=route_time,
                appointments=vehicle_route
            )
        )


    # Check routes for validity
    report = validate_solution_and_report(
        routes=routes,
        time_matrix=optimization_request.time_matrix,
        addresses=optimization_request.location_ids,
        depot_start_location_id = generate_location_id(optimization_request.company_info.start_address),
        depot_end_location_id = generate_location_id(optimization_request.company_info.finish_address)
    )

    # Enriched Routes
    enriched_routes = extract_enriched_metrics(
        routes=routes,
        time_matrix=optimization_request.time_matrix,
        distance_matrix=optimization_request.distance_matrix,
        location_ids=optimization_request.location_ids
    )

    response = Solution(
        total_distance_traveled=total_distance,
        max_distance_traveled=max_distance,
        routes=enriched_routes,
        method_used="Path Cheapest Arc",
        problem_metrics = optimization_problem_information,
        validation_report=report
    )
    
    return response