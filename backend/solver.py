# backend/solver.py
import math
import numpy as np
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
from typing import Dict, List, Any, Union

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