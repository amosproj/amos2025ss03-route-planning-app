from copy import deepcopy

from solver.models import *
from typing import List
from datetime import datetime, timedelta
from typing import Tuple
import numpy as np

def sum_appointment_durations(request: EnhancedOptimizationRequest) -> int:

    appointments = request.appointments
    total_minutes = 0

    for appt in appointments:
        start = datetime.strptime(appt.appointment_start, "%Y-%m-%d %H:%M:%S.%f")
        end = datetime.strptime(appt.appointment_end, "%Y-%m-%d %H:%M:%S.%f")
        duration = (end - start).total_seconds() / 60
        total_minutes += duration
    return int(total_minutes)

def sum_appointment_servicetimes(request: EnhancedOptimizationRequest) -> int:
    return sum(appt.service_time for appt in request.appointments)



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

def collect_problem_metrics(request: EnhancedOptimizationRequest) -> List[ProblemMetric]:
    metrics = []

    metrics.append(ProblemMetric(
        name="total_appointment_time",
        value=sum_appointment_durations(request)
    ))

    metrics.append(ProblemMetric(
        name="total_service_time",
        value=sum_appointment_servicetimes(request)
    ))

    avg_time, max_time = calculate_average_and_max_travel_time(request.time_matrix)

    metrics.append(ProblemMetric(
        name="average_appointment_distance(time)",
        value=round(avg_time)
    ))

    metrics.append(ProblemMetric(
        name="max_appointment_distance(time)",
        value=round(max_time)
    ))

    return metrics

