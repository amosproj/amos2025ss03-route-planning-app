# backend/solver.py
import math
import numpy as np
from typing import Dict, List, Any
from ortools.constraint_solver import pywrapcp, routing_enums_pb2
from datetime import datetime
from models import *

def solve_appointment_routing(
        request: EnhancedOptimizationRequest,
        slack_max = 120,
        max_time_per_vehicle = 1440
) -> Solution:

    def to_minutes(dt_str):
        dt = datetime.fromisoformat(dt_str)
        return dt.hour * 60 + dt.minute


    company_info = request.company_info
    appointments = request.appointments
    time_matrix = request.time_matrix

    depot_address = company_info.start_address.street + " " + company_info.start_address.zip_code + " " + company_info.start_address.city
    addresses = [depot_address] + [appointment.address.street + " " + appointment.address.zip_code + " " + appointment.address.city for appointment in appointments]

    # Depot-Zeitfenster von 0 bis 1440 Minuten hinzufügen (24 Stunden).
    depot_time_window = (0, 1440)  # Beispiel: Depot jederzeit während des 24-Stunden-Zeitrahmens verfügbar.

    # Beginnen mit den Zeitfenstern für das Depot:
    time_windows = [
        {'address': depot_address, 'time_window': depot_time_window}]  # Depot-Zeitfenster und Adresse hinzufügen

    # Hinzufügen der Zeitfenster für die tatsächlichen Termine
    for appointment in request.appointments:
        time_windows.append({
            'address': appointment,
            'time_window': (to_minutes(appointment.appointment_start), to_minutes(appointment.appointment_end))
        })

    num_locations = len(addresses)
    num_vehicles = len(company_info.number_of_workers)
    depot_index = 0

    # Routing setup
    manager = pywrapcp.RoutingIndexManager(
        num_locations,
        num_vehicles,
        depot_index
    )
    routing = pywrapcp.RoutingModel(manager)

    # calc service times in minutes todo: get service times(if different from time window)
    service_times = [0]  # Depot hat 0 Minuten Servicezeit
    for appointment in appointments:
        start = to_minutes(appointment.appointment_start)
        end = to_minutes(appointment.appointment_end)
        duration = max(1, end - start)
        service_times.append(duration)

    service_times_inlc_depot = [0] + service_times #add depot service time 0

    def time_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return time_matrix[from_node][to_node] + service_times_inlc_depot[from_node]

    transit_callback_index = routing.RegisterTransitCallback(time_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    # Time-Dimension
    routing.AddDimension(
        transit_callback_index,
        slack_max,     # max waiting time
        max_time_per_vehicle,   # max total time per vehicle
        False,
        'Time'
    )
    time_dimension = routing.GetDimensionOrDie('Time')
    time_dimension.SetGlobalSpanCostCoefficient(100)

    for idx, time_window_entry in enumerate(time_windows):
        index = manager.NodeToIndex(idx)
        start, end = time_window_entry['time_window']
        time_dimension.CumulVar(index).SetRange(start, end)
    for idx, tw in enumerate(time_windows):
        print(f"Node {idx} time window: {tw['time_window']}")

    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    search_parameters.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GREEDY_DESCENT
    search_parameters.log_search = True
    solution = routing.SolveWithParameters(search_parameters)

    if not solution:
        return Solution(total_distance_traveled=0, max_distance_traveled=0, routes=[], method_used="No solution")

    total_distance = 0
    max_distance = 0
    routes = []

    # Create route for every vehicle
    for vehicle_id in range(num_vehicles):
        route_time = 0
        index = routing.Start(vehicle_id)
        vehicle_route = []

        while not routing.IsEnd(index):
            node_index = manager.IndexToNode(index)
            appointment = appointments[node_index - 1] if node_index > 0 else None  # skip depot
            if node_index > 0:
                vehicle_route.append(appointment)

            # Berechne die Distanz
            next_index = solution.Value(routing.NextVar(index))
            route_time += routing.GetArcCostForVehicle(index, next_index, vehicle_id)

            index = next_index

        total_distance += route_time
        max_distance = max(max_distance, route_time)

        # Route für Fahrzeug hinzufügen
        routes.append(Route(
            route_id=vehicle_id,
            vehicle_id=vehicle_id,
            distance_traveled = 0,#todo calc the distance
            time_traveled = route_time,
            appointments=vehicle_route
        ))

    # Rückgabewert
    return Solution(
        total_distance_traveled=total_distance,
        max_distance_traveled=max_distance,
        routes=routes,
        method_used="Path Cheapest Arc"
    )

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