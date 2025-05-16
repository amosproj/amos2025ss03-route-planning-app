from datetime import datetime

def to_minutes(dt_str: str) -> int:
    dt = datetime.fromisoformat(dt_str)
    return dt.hour * 60 + dt.minute