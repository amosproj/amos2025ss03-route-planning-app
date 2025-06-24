import math
import os
import random
import json
import csv
from datetime import datetime, timedelta
from typing import Any

from solver.models import *

# === HELPERS ===

def generate_random_addresses(n:int) -> Address:
    addresses = [
        Address(street="Görlitzer Str. 3", zip_code="10997", city="Berlin"),
        Address(street="Allerstraße 11", zip_code="12049", city="Berlin"),
        Address(street="Rollbergstraße 70", zip_code="12049", city="Berlin"),
        Address(street="Grunewaldstraße 54", zip_code="10825", city="Berlin"),
        Address(street="Bamberger Str. 49", zip_code="10779", city="Berlin"),
        Address(street="Spichernstraße 24", zip_code="10777", city="Berlin"),
        Address(street="Straße des 17. Juni 135", zip_code="10623", city="Berlin"),
        Address(street="Hauptstraße 9", zip_code="13158", city="Berlin"),
        Address(street="Schönhauser Str. 41", zip_code="13158", city="Berlin"),
        Address(street="Alte Schönhauser Str. 46", zip_code="10119", city="Berlin"),
        Address(street="Strausberger Str. 46", zip_code="10243", city="Berlin"),
        Address(street="Richard-Sorge-Straße 21", zip_code="10249", city="Berlin"),
        Address(street="Späthstraße 80-81", zip_code="12437", city="Berlin"),
        Address(street="Johannisthaler Ch 46", zip_code="12437", city="Berlin"),
        Address(street="Delbrückstraße 37", zip_code="14193", city="Berlin"),
        Address(street="Messedamm 26", zip_code="14055", city="Berlin"),
        Address(street="Spandauer Damm 157", zip_code="14050", city="Berlin"),
        Address(street="Dunckerstraße 72", zip_code="10437", city="Berlin"),
        Address(street="Schönhauser Allee 65", zip_code="10437", city="Berlin"),
        Address(street="Putbusser Str. 44", zip_code="13355", city="Berlin"),
        Address(street="Gerichtstraße 10", zip_code="13347", city="Berlin"),
        Address(street="Gerichtstraße 60", zip_code="13347", city="Berlin"),
        Address(street="Lindower Str. 20", zip_code="13357", city="Berlin"),
        Address(street="Fennstraße 22", zip_code="13353", city="Berlin"),
        Address(street="Triftstraße 37", zip_code="13353", city="Berlin"),
        Address(street="Rathenower Str. 6", zip_code="10559", city="Berlin"),
        Address(street="Helgoländer Ufer 7", zip_code="10557", city="Berlin"),
        Address(street="Spreeweg 1", zip_code="10557", city="Berlin"),
        Address(street="Hanseatenweg 10", zip_code="10557", city="Berlin"),
        Address(street="Franklinstraße 12", zip_code="10587", city="Berlin"),
        Address(street="Manfred-von-Richthofen-Straße 30", zip_code="12101", city="Berlin"),
        Address(street="Udetzeile 2", zip_code="12101", city="Berlin"),
        Address(street="Gontermannstraße 52", zip_code="12101", city="Berlin"),
        Address(street="Bornsdorfer Str. 27", zip_code="12053", city="Berlin"),
        Address(street="Karl-Marx-Straße 172", zip_code="12043", city="Berlin"),
        Address(street="Elsenstraße 27", zip_code="12435", city="Berlin"),
        Address(street="Am Speicher 5", zip_code="10245", city="Berlin"),
        Address(street="Salzmannstraße 28", zip_code="10319", city="Berlin"),
        Address(street="Alt-Biesdorf 55", zip_code="12683", city="Berlin"),
        Address(street="Cecilienstraße 80", zip_code="12683", city="Berlin"),
        Address(street="Miraustraße 38", zip_code="13509", city="Berlin"),
        Address(street="Kissinger Str. 22", zip_code="14199", city="Berlin"),
        Address(street="Teplitzer Str. 9", zip_code="14193", city="Berlin"),
        Address(street="Brahmsstraße 10", zip_code="14193", city="Berlin"),
        Address(street="Königin-Elisabeth-Straße 47A", zip_code="14059", city="Berlin"),
        Address(street="Neuköllner Str. 201", zip_code="12357", city="Berlin"),
        Address(street="Zwickauer Damm 100", zip_code="12355", city="Berlin"),
        Address(street="Zwickauer Damm 112", zip_code="12355", city="Berlin"),
        Address(street="Köpenicker Straße 76, Brückenstraße 1", zip_code="10179", city="Berlin"),
        Address(street="Singerstraße 109", zip_code="10179", city="Berlin"),
        Address(street="Holteistraße 6-9", zip_code="10245", city="Berlin"),
        Address(street="Sewanstraße 41", zip_code="10319", city="Berlin"),
        Address(street="Königsheideweg 9b", zip_code="12437", city="Berlin"),
        Address(street="Johannisthaler Ch 46", zip_code="12437", city="Berlin"),
        Address(street="Seeadlerweg 103", zip_code="12355", city="Berlin"),
        Address(street="Titastraße 11", zip_code="13053", city="Berlin")
    ]
    if n > len(addresses):
        raise ValueError(f"Requested {n} addresses, but only {len(addresses)} are available.")

    return random.sample(addresses, n)

def generate_random_address() -> Address:
    return generate_random_addresses(1)[0]

def get_random_service_time() -> int:
    choices = [30, 60, 45, 90]
    weights = [0.4, 0.3, 0.15, 0.15]
    return random.choices(choices, weights=weights, k=1)[0]

skills_pool = ["electrician", "plumber","carpenter"]

def generate_filled_vehicles(amount: int) -> list[FilledVehicle]:
    vehicle_address = generate_random_address()  # TODO change to real logic

    return [
        FilledVehicle(
            vehicle_id=i + 1,
            skills=set(random.sample(skills_pool, k=random.randint(1, len(skills_pool)))),
            worker_amount=random.choices([1, 2, 3], weights=[0.7, 0.2, 0.1])[0],
            operation_hours=OperationHours(start_minutes=0, end_minutes=1440),  # TODO change to real logic
            start_address=vehicle_address,
            finish_address=vehicle_address,
            cost_per_km=round(random.uniform(0.4, 1.0), 2),
            cost_per_hour=round(random.uniform(20.0, 60.0), 2)
        ) for i in range(amount)
    ]


def round_to_nearest_quarter(dt: datetime, direction: str = "down") -> datetime:
    minute = (dt.minute // 15) * 15
    if direction == "up" and dt.minute % 15 != 0:
        minute += 15
    minute = 0 if minute == 60 else minute
    return dt.replace(minute=minute, second=0, microsecond=0) + (
        timedelta(hours=1) if minute == 0 and direction == "up" else timedelta()
    )

def generate_random_appointments(n: int, appointment_duration_factor: float = 3.0) -> List[Appointment]:
    appointments = []
    addresses = generate_random_addresses(n)

    base_date = datetime(2025, 4, 29)
    day_start = datetime(2025, 4, 29, 8, 0, 0)
    day_end = datetime(2025, 4, 29, 18, 0, 0)

    for i in range(n):
        service_time = get_random_service_time()
        duration_minutes = int(service_time * appointment_duration_factor)

        available_minutes = int((day_end - day_start).total_seconds() // 60)
        max_offset = max(0, available_minutes - duration_minutes)
        offset_minutes = random.randint(0, max_offset)

        raw_start = day_start + timedelta(minutes=offset_minutes)
        appointment_start = round_to_nearest_quarter(raw_start, direction="up")
        appointment_end = round_to_nearest_quarter(appointment_start + timedelta(minutes=duration_minutes), direction="up")

        num_skills = math.ceil(len(skills_pool) / 2)

        selected_skills = set(random.sample(skills_pool, num_skills))

        appointment = Appointment(
            appointment_start=appointment_start.strftime("%Y-%m-%d %H:%M:%S.000"),
            appointment_end=appointment_end.strftime("%Y-%m-%d %H:%M:%S.000"),
            address=addresses[i],
            service_time=str(service_time),
            skills_needed=selected_skills,
            number_of_workers=random.choices([1, 2, 3], weights=[0.7, 0.25, 0.05])[0]
        )

        appointments.append(appointment)

    return appointments



# === MAIN FACTORY FUNCTION ===

def create_testdata_optimization_request(num_vehicles: int, num_appointments: int,appointment_duration_factor:float = 3.0) -> OptimizationRequest:
    start_address = generate_random_address()
    finish_address = start_address

    company_info = CompanyInfo(
        start_address=start_address,
        finish_address=finish_address,
        vehicles =generate_filled_vehicles(num_vehicles)
    )

    appointments = generate_random_appointments(num_appointments,appointment_duration_factor)

    return OptimizationRequest(
        company_info=company_info,
        appointments=appointments
    )

# === JSON DUMP ===

def save_optimization_request_to_json(opt_req: OptimizationRequest, filename: str):
    def convert_sets(obj: Any):
        if isinstance(obj, set):
            return list(obj)
        raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")

    current_folder = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(current_folder, filename)

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(opt_req.model_dump(), f, indent=2, ensure_ascii=False, default=convert_sets)

    print(f"JSON File successfully saved here: {file_path}")

# === CSV DUMP ===
def export_appointments_to_csv(request: OptimizationRequest, filename: str):
    current_folder = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(current_folder, filename)

    with open(file_path, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)

        writer.writerow([
            "appointment_start", "appointment_end",
            "street", "zip_code", "city",
            "service_time", "number_of_workers",
            "skills_needed"
        ])

        for appt in request.appointments:
            skills_str = ", ".join(sorted(appt.skills_needed)) if appt.skills_needed else ""
            writer.writerow([
                appt.appointment_start,
                appt.appointment_end,
                appt.address.street,
                appt.address.zip_code,
                appt.address.city,
                appt.service_time,
                appt.number_of_workers,
                skills_str
            ])

    print(f"CSV File successfully saved here: {file_path}")


# === OPTIONAL SCRIPT ENTRYPOINT ===

if __name__ == "__main__":
    request_obj = create_testdata_optimization_request(num_vehicles=7, num_appointments=25)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    json_filename = f"testdata_{timestamp}.json"
    csv_filename = f"testdata_{timestamp}.csv"

    export_appointments_to_csv(request_obj,csv_filename)
    save_optimization_request_to_json(request_obj, json_filename)

