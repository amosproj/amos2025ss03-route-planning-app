from datetime import datetime

def to_minutes(dt_str: str) -> int:
    dt = datetime.fromisoformat(dt_str)
    return dt.hour * 60 + dt.minute

def extract_day_bounds(time_str: str) -> tuple[str, str]:
    dt = datetime.strptime(time_str, "%Y-%m-%d %H:%M:%S.%f")
    date_only = dt.date()

    start_dt = datetime.combine(date_only, datetime.min.time())       # 00:00:00
    end_dt = datetime.combine(date_only, datetime.min.time()).replace(hour=23, minute=59)

    # Return the endtime and starttime Strings in the format required for EnhancedAppointment
    start_str = start_dt.strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
    end_str = end_dt.strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]

    return start_str, end_str
