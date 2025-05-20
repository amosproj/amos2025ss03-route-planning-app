from copy import deepcopy

from solver.models import *
from typing import List
from datetime import datetime, timedelta
from typing import Tuple
import numpy as np

def calculate_max_parallel_worker_demand(appointments: List[EnhancedAppointment]) -> int:
    """
    Calculates the maximum number of workers required in parallel across all appointments.
    """
    events = []
    for appt in appointments:
        start = datetime.strptime(appt.appointment_start, "%Y-%m-%d %H:%M:%S.%f")
        end = datetime.strptime(appt.appointment_end, "%Y-%m-%d %H:%M:%S.%f")
        events.append((start, +appt.number_of_workers))
        events.append((end, -appt.number_of_workers))

    events.sort()

    current_workers = 0
    max_workers = 0
    for time, delta in events:
        current_workers += delta
        max_workers = max(max_workers, current_workers)

    return max_workers

def validate_appointment_overlap(
        request: EnhancedOptimizationRequest,
        slack_max: int = 120,
        max_time_per_vehicle: int = 1440
) -> bool:
    """
    Returns False if the overlapping appointment worker demand ever exceeds available capacity.
    """
    vehicle_amount = len(request.company_info.number_of_workers)
    max_workers = calculate_max_parallel_worker_demand(request.appointments)

    return max_workers <= vehicle_amount


def sum_appointment_durations(request: EnhancedOptimizationRequest) -> int:

    appointments = request.appointments
    total_minutes = 0

    for appt in appointments:
        start = datetime.strptime(appt.appointment_start, "%Y-%m-%d %H:%M:%S.%f")
        end = datetime.strptime(appt.appointment_end, "%Y-%m-%d %H:%M:%S.%f")
        duration = (end - start).total_seconds() / 60
        total_minutes += duration
    return int(total_minutes)


def calculate_average_and_max_travel_time(time_matrix: List[List[int]]) -> Tuple[float, int]:
    """
    Calculates the average and maximum travel time between all pairs (excluding self-loops).
    """
    matrix = np.array(time_matrix, dtype=float)
    np.fill_diagonal(matrix, np.nan)

    average_time = np.nanmean(matrix)
    max_time = np.nanmax(matrix)

    # Handle edge cases where matrix is empty or all values are NaN
    average_time = float(average_time) if not np.isnan(average_time) else 0.0
    max_time = int(max_time) if not np.isnan(max_time) else 0

    return average_time, max_time


def calculate_travel_time_quantile(time_matrix: List[List[int]], quantile: float) -> float:
    """
    Calculates a specific quantile (e.g., 0.25, 0.5, 0.75) from the flattened time matrix.

    Args:
        time_matrix (List[List[int]]): A 2D list of travel times in minutes.
        quantile (float): The desired quantile between 0 and 1.

    Returns:
        float: The travel time at the given quantile.
    """
    if not 0 <= quantile <= 1:
        raise ValueError("Quantile must be between 0 and 1")

    # Flatten the 2D time matrix and exclude 0 (distance to self)
    all_times = [time for row in time_matrix for time in row if time > 0]

    if not all_times:
        return 0.0

    return float(np.quantile(all_times, quantile))



def calculate_max_overlap_with_shifted_end_times(
    appointments: List[EnhancedAppointment],
    average_distance_minutes: float
) -> int:
    """
    Calculates the maximum number of workers required simultaneously,
    with each appointment being artificially extended by `average_distance_minutes`.
    """
    shift = timedelta(minutes=average_distance_minutes)
    shifted_appointments = []

    for appt in appointments:
        appt_copy = deepcopy(appt)
        original_end = datetime.strptime(appt_copy.appointment_end, "%Y-%m-%d %H:%M:%S.%f")
        new_end = original_end + shift
        appt_copy.appointment_end = new_end.strftime("%Y-%m-%d %H:%M:%S.%f")
        shifted_appointments.append(appt_copy)

    return calculate_max_parallel_worker_demand(shifted_appointments)


