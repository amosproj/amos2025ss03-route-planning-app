# backend/solver/solver.py
from ortools.constraint_solver import pywrapcp, routing_enums_pb2
from backend.exceptionStrings import APPOINTMENT_OVERLAP_TO_BIG
from backend.solver.preprocessing import *
from backend.solver.util import *
from backend.solver.validate_routes import validate_routes


def solve_appointment_routing(
    request: EnhancedOptimizationRequest,
    slack_max: int = 1440,
    max_time_per_vehicle: int = 1440,
    optimization_time_limit: int = 15
) -> Solution:

    optimization_problem_information: List[ProblemMetric] = collect_problem_metrics(request)

    company_info = request.company_info
    appointments = request.appointments
    time_matrix = request.time_matrix
    distance_matrix = request.distance_matrix

    depot_address = (
        f"{company_info.start_address.street} {company_info.start_address.zip_code} {company_info.start_address.city}"
    )

    addresses = [depot_address] + [
        f"{a.address.street} {a.address.zip_code} {a.address.city}" for a in appointments
    ]

    # Time windows
    time_windows = [(0, 1440)]  # Depot open all day
    for appt in appointments:
        time_windows.append((to_minutes(appt.appointment_start), to_minutes(appt.appointment_end)))

    # Service times in minutes
    service_times = [0]  # Depot
    for appt in appointments:
        service_times.append(appt.service_time)

    num_locations = len(addresses)
    num_vehicles = len(company_info.number_of_workers)
    depot_index = 0

    # Routing setup
    manager = pywrapcp.RoutingIndexManager(num_locations, num_vehicles, depot_index)
    routing = pywrapcp.RoutingModel(manager)

    # Time callback (travel time + service time)
    def time_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return time_matrix[from_node][to_node] + service_times[from_node]

    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return distance_matrix[from_node][to_node]

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


    # Apply time windows and enforce: arrival + service_time <= end
    for idx, (start, end) in enumerate(time_windows):
        index = manager.NodeToIndex(idx)
        cumul = time_dimension.CumulVar(index)

        cumul.SetRange(start, end)
        routing.solver().Add(cumul + service_times[idx] <= end)

    #Allow skipping appointments with very high penalty. This makes possible a fast first valid Solution
    penalty = 10000
    for idx in range(1, num_locations):
        routing.AddDisjunction([manager.NodeToIndex(idx)], penalty)

    # Search parameters
    search_params = pywrapcp.DefaultRoutingSearchParameters()
    search_params.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PARALLEL_CHEAPEST_INSERTION
    search_params.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    search_params.time_limit.FromSeconds(optimization_time_limit)
    search_params.log_search = True  # dev-friendly

    # Solve
    solution = routing.SolveWithParameters(search_params)
    if not solution:
        return Solution(
            total_distance_traveled=0,
            max_distance_traveled=0,
            routes=[],
            method_used="No solution",
            problem_metrics = optimization_problem_information
        )

    total_time = 0
    total_distance = 0
    max_distance = 0
    max_time = 0
    routes: List[Route] = []

    for vehicle_id in range(num_vehicles):
        index = routing.Start(vehicle_id)
        route_time = 0
        route_distance = 0
        vehicle_route = []

        while not routing.IsEnd(index):
            node_index = manager.IndexToNode(index)

            # Add appointment if it's not the depot
            if node_index > 0:
                vehicle_route.append(appointments[node_index - 1])

            next_index = solution.Value(routing.NextVar(index))
            from_node = manager.IndexToNode(index)
            to_node = manager.IndexToNode(next_index)

            # Travel time and distance
            travel_time = time_matrix[from_node][to_node]
            travel_distance = distance_matrix[from_node][to_node]

            # Arrival time at current node
            arrival_time = solution.Value(time_dimension.CumulVar(index))

            # Service time and waiting time
            appt_start = time_windows[node_index][0]
            service_time = service_times[node_index]
            waiting_time = max(0, appt_start - arrival_time) if node_index > 0 else 0

            # Total time spent at this node
            route_time += travel_time + waiting_time + service_time
            route_distance += travel_distance

            index = next_index

        total_time += route_time
        total_distance += route_distance
        max_distance = max(max_distance, route_distance)
        max_time = max(max_time, route_time)

        routes.append(
            Route(
                route_id=vehicle_id,
                vehicle_id=vehicle_id,
                distance_traveled=route_distance,
                time_traveled=route_time,
                appointments=vehicle_route
            )
        )

    response = Solution(
        total_distance_traveled=total_distance,
        max_distance_traveled=max_distance,
        routes=routes,
        method_used="Path Cheapest Arc",
        problem_metrics = optimization_problem_information
    )
    
    # Check routes for validity
    validate_routes(routes)
        
    return response