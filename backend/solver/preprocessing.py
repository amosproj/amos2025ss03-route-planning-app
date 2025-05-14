from backend.solver.models import EnhancedOptimizationRequest
from datetime import datetime

def validate_appointment_overlap(
        request: EnhancedOptimizationRequest,
        slack_max: int = 120,
        max_time_per_vehicle: int = 1440
) -> bool:
    """
    Returns False if the overlapping appointment worker demand ever exceeds available capacity.
    """
    total_worker_capacity = sum(w.worker_amount for w in request.company_info.number_of_workers)

    # Collect events from appointment start and end times
    events = []
    for appt in request.appointments:
        start = datetime.strptime(appt.appointment_start, "%Y-%m-%d %H:%M:%S.%f")
        end = datetime.strptime(appt.appointment_end, "%Y-%m-%d %H:%M:%S.%f")
        events.append((start, +appt.number_of_workers))
        events.append((end, -appt.number_of_workers))

    # Sort all events chronologically
    events.sort()

    current_workers = 0
    max_workers = 0
    for time, delta in events:
        current_workers += delta
        max_workers = max(max_workers, current_workers)

    return max_workers < total_worker_capacity

def sum_appointment_durations(request: EnhancedOptimizationRequest) -> int:

    appointments = request.appointments
    total_minutes = 0

    for appt in appointments:
        start = datetime.strptime(appt.appointment_start, "%Y-%m-%d %H:%M:%S.%f")
        end = datetime.strptime(appt.appointment_end, "%Y-%m-%d %H:%M:%S.%f")
        duration = (end - start).total_seconds() / 60
        total_minutes += duration
    return int(total_minutes)
