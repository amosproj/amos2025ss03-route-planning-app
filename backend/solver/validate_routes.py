from backend.solver.models import *
from backend.solver.util import to_minutes


def validate_routes(routes: List[Route]) -> bool:
    print("🔍 Checking routes...\n")
    all_valid = True

    for route in routes:
        current_time = 0
        print(f"🚐 Vehicle {route.vehicle_id}:")

        for appt in route.appointments:
            appt_id = appt.location.id
            start = to_minutes(appt.appointment_start)
            end = to_minutes(appt.appointment_end)
            service_time = max(1, end - start)

            arrival = max(current_time, start)
            finish = arrival + service_time
            valid = arrival >= start and finish <= end
            all_valid = all_valid and valid

            print(
                f"📍 {appt_id} — Arrival: {arrival}, Finish: {finish}, "
                f"Window: [{start}, {end}], "
                f"Valid: {'✅' if valid else '❌'}"
            )

            current_time = finish  # update for next stop

        print()

    if all_valid:
        print("✅ All routes are valid.")
    else:
        print("❌ Some routes are invalid.")

    return all_valid