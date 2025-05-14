# backend/solver/solver.py
import math
import numpy as np
from typing import Any
from ortools.constraint_solver import pywrapcp, routing_enums_pb2

from backend.exceptionStrings import APPOINTMENT_OVERLAP_TO_BIG
from backend.solver.models import *
from backend.solver.preprocessing import *
from backend.solver.util import *
from backend.solver.validate_routes import validate_routes


def solve_appointment_routing_pca(
    request: EnhancedOptimizationRequest,
    slack_max: int = 120,
    max_time_per_vehicle: int = 1440,
    optimization_time_limit: int = 15
) -> Solution:

    if not validate_appointment_overlap(request, slack_max, max_time_per_vehicle):
        print(APPOINTMENT_OVERLAP_TO_BIG)
        return Solution(
            total_distance_traveled=0,
            max_distance_traveled=0,
            routes=[],
            method_used= APPOINTMENT_OVERLAP_TO_BIG
        )

    total_appointment_time = sum_appointment_durations(request)
    print(f"Total appointment time: "+ str(total_appointment_time))

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
        start = to_minutes(appt.appointment_start)
        end = to_minutes(appt.appointment_end)
        service_times.append(max(1, end - start))  # Minimum 1 minute

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

    # Search parameters
    search_params = pywrapcp.DefaultRoutingSearchParameters()
    search_params.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    search_params.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    search_params.time_limit.FromSeconds(optimization_time_limit)
    search_params.log_search = False  # production-friendly

    # Solve
    solution = routing.SolveWithParameters(search_params)
    if not solution:
        return Solution(
            total_distance_traveled=0,
            max_distance_traveled=0,
            routes=[],
            method_used="No solution"
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
        method_used="Path Cheapest Arc"
    )
    
    # Check routes for validity
    validate_routes(routes)
        
    return response

def calculate_distance_matrix(nodes: List[Dict[str, Any]]) -> List[List[int]]:
    """Calculates the Euclidean distance matrix between nodes."""
    num_nodes = len(nodes)
    distance_matrix = np.zeros((num_nodes, num_nodes), dtype=int)

    for i in range(num_nodes):
        for j in range(i + 1, num_nodes):
            node_i = nodes[i]
            node_j = nodes[j]
            dist = int(math.sqrt((node_i['x'] - node_j['x'])**2 + (node_i['y'] - node_j['y'])**2) * 100)
            distance_matrix[i][j] = dist
            distance_matrix[j][i] = dist
    return distance_matrix.tolist() 

def solve_vrp(data: Dict[str, Any]) -> Dict[str, Any]:
    """Solves the VRP problem using Google OR-Tools."""
    try:
        nodes = data['nodes']
        num_vehicles = data['num_vehicles']
        vehicle_skills = data.get('vehicle_skills', {})
        available_skills = data.get('available_skills', [])
        depot_index = 0 

        # --- Data Validation ---
        if not nodes:
            return {"status": "error", "message": "No nodes provided."}
        if num_vehicles <= 0:
            return {"status": "error", "message": "Number of vehicles must be positive."}
        if not nodes[0]['is_depot']:
            return {"status": "error", "message": "First node must be the depot."}
        if len(nodes) == 1 and num_vehicles > 0:
            return {"status": "success", "routes": [[] for _ in range(num_vehicles)], "max_distance": 0.0, "message": "Only depot present, no routes generated."}
        if len(nodes) > 1 and num_vehicles == 0:
            return {"status": "error", "message": "No vehicles available to serve customer nodes."}

        # --- Prepare OR-Tools Data ---
        distance_matrix = calculate_distance_matrix(nodes)
        or_data = {}
        or_data["distance_matrix"] = distance_matrix
        or_data["num_vehicles"] = num_vehicles
        or_data["depot"] = depot_index

        # --- Create Routing Model ---
        manager = pywrapcp.RoutingIndexManager(
            len(or_data["distance_matrix"]), or_data["num_vehicles"], or_data["depot"]
        )
        routing = pywrapcp.RoutingModel(manager)

        # --- Distance Callback ---
        def distance_callback(from_index, to_index):
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            return or_data["distance_matrix"][from_node][to_node]

        transit_callback_index = routing.RegisterTransitCallback(distance_callback)
        routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

        # Distance Dimension
        routing.AddDimension(
            transit_callback_index,
            0,      # No slack
            300000, # Vehicle maximum travel distance (scaled by 100)
            True,   # Start cumul to zero
            "Distance",
        )
        distance_dimension = routing.GetDimensionOrDie("Distance")
        distance_dimension.SetGlobalSpanCostCoefficient(100) 

        # Add Time Windows if specified
        has_time_windows = any(node.get('time_window') for node in nodes)
        if has_time_windows:
            routing.AddDimension(
                transit_callback_index,
                3000,  # Allow wait time (scaled) 
                300000, # Max time (scaled)
                False, # Don't force start cumul to zero
                "Time"
            )
            time_dimension = routing.GetDimensionOrDie("Time")
            for node_idx, node in enumerate(nodes):
                if node.get('time_window'):
                    # Ensure time_window is [start, end] and scaled
                    start_time = node['time_window'][0] * 100
                    end_time = node['time_window'][1] * 100
                    index = manager.NodeToIndex(node_idx)
                    time_dimension.CumulVar(index).SetRange(start_time, end_time)

        # Add Skills Requirements if specified
        has_skills_requirement = any(node.get('required_skills') for node in nodes)
        if has_skills_requirement and available_skills:
            for node_idx, node in enumerate(nodes):
                required = set(node.get('required_skills', []))
                if not required or node.get('is_depot'):
                    continue
                can_serve = False
                for v_id in range(num_vehicles):
                    v_skills = set(vehicle_skills.get(str(v_id), [])) 
                    if required.issubset(v_skills):
                        can_serve = True
                        break
                if not can_serve:
                    return {"status": "error", "message": f"No vehicle has the required skills ({', '.join(required)}) for node {node['id']}"}

            # Apply constraints
            for node_idx, node in enumerate(nodes):
                required = set(node.get('required_skills', []))
                if not required or node.get('is_depot'):
                    continue

                valid_vehicles = []
                for v_id in range(num_vehicles):
                    v_skills = set(vehicle_skills.get(str(v_id), []))
                    if required.issubset(v_skills):
                        valid_vehicles.append(v_id)

                index = manager.NodeToIndex(node_idx)
                routing.VehicleVar(index).SetValues(valid_vehicles)

        # --- Set Search Parameters ---
        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        search_parameters.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
        )
        search_parameters.local_search_metaheuristic = (
            routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
        )
        search_parameters.time_limit.FromSeconds(10)  # Adjust time limit

        # --- Solve ---
        solution = routing.SolveWithParameters(search_parameters)

        # --- Process Solution ---
        if solution:
            routes = []
            max_route_distance = 0
            total_distance = solution.ObjectiveValue() 

            for vehicle_id in range(or_data["num_vehicles"]):
                vehicle_route = []
                index = routing.Start(vehicle_id)
                route_distance = 0
                while not routing.IsEnd(index):
                    node_index = manager.IndexToNode(index)
                    vehicle_route.append(nodes[node_index]['id']) 
                    previous_index = index
                    index = solution.Value(routing.NextVar(index))
                    route_distance += routing.GetArcCostForVehicle(
                        previous_index, index, vehicle_id
                    )
                final_node_index = manager.IndexToNode(index)
                vehicle_route.append(nodes[final_node_index]['id'])

                routes.append(vehicle_route)
                max_route_distance = max(route_distance, max_route_distance)

            return {
                "status": "success",
                "routes": routes,
                "max_distance": max_route_distance / 100.0,
                "total_distance": total_distance / 100.0
            }
        else:
            return {"status": "error", "message": "No solution found."}

    except Exception as e:
        import traceback
        print(f"Error in solve_vrp: {e}")
        print(traceback.format_exc())
        return {"status": "error", "message": f"An unexpected error occurred: {str(e)}"}