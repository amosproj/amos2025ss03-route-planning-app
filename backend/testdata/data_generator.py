import math
import os
import random
import csv
from datetime import datetime, timedelta
from typing import Any
import argparse
from datetime import date
import sys
import os

# Run this script from the root directory of the project
if __name__ == "__main__":
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))


from solver.models import *


# === HELPERS ===

def generate_random_vehicle_addresses(n:int) -> Address:
    vehicle_addresses = [
        Address(street="Friedrichstraße 236", zip_code="10969", city="Berlin"),
        Address(street="Kastanienallee 61", zip_code="10119", city="Berlin"),
        Address(street="Reinickendorfer Str. 54", zip_code="13347", city="Berlin"),
        Address(street="Kurt-Schumacher-Damm 41", zip_code="13405", city="Berlin"),
        Address(street="Goebelstraße 122A", zip_code="13629", city="Berlin"),
        Address(street="Werkring 3", zip_code="13597", city="Berlin"),
        Address(street="Murellenweg 1", zip_code="14052", city="Berlin"),
        Address(street="Wilhelmshöher Str. 13", zip_code="12161", city="Berlin"),
        Address(street="Beckerstraße 5", zip_code="12157", city="Berlin"),
        Address(street="Bessemerstraße 42A", zip_code="12103", city="Berlin"),
        Address(street="Hermannstraße 179", zip_code="12049", city="Berlin"),
        Address(street="Emser Str. 131", zip_code="12051", city="Berlin"),
        Address(street="Thomasstraße 53", zip_code="12053", city="Berlin"),
        Address(street="Sonnenallee 59", zip_code="12045", city="Berlin"),
        Address(street="Reichenberger Str. 71A", zip_code="10999", city="Berlin"),
        Address(street="Gustav-Zahnke-Straße 17", zip_code="10369", city="Berlin"),
        Address(street="Erich-Kuttner-Straße 3", zip_code="10369", city="Berlin"),
        Address(street="Storkower Str. 139D", zip_code="10407", city="Berlin"),
        Address(street="Bauhofstraße 6", zip_code="10117", city="Berlin"),
        Address(street="Unter den Linden 6", zip_code="10117", city="Berlin"),
        Address(street="Wilhelmstraße 55", zip_code="10117", city="Berlin"),
        Address(street="Jägerstraße 70", zip_code="10117", city="Berlin")
    ]

    if n > len(vehicle_addresses):
        raise ValueError(f"Requested {n} vehicle_addresses, but only {len(vehicle_addresses)} are available.")

    return random.sample(vehicle_addresses, n)

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
        Address(street="Titastraße 11", zip_code="13053", city="Berlin"),
        Address(street="Schubartstraße 47", zip_code="13509", city="Berlin"),
        Address(street="Gorkistraße 127", zip_code="13509", city="Berlin"),
        Address(street="Alt-Wittenau 56", zip_code="13437", city="Berlin"),
        Address(street="Dannenwalder Weg 70", zip_code="13439", city="Berlin"),
        Address(street="Teschendorfer Weg 6", zip_code="13439", city="Berlin"),
        Address(street="Uhlandstraße 33", zip_code="13158", city="Berlin"),
        Address(street="Kastanienallee 58A", zip_code="13158", city="Berlin"),
        Address(street="Florastraße 27", zip_code="13187", city="Berlin"),
        Address(street="Langhansstraße 86", zip_code="13086", city="Berlin"),
        Address(street="Dohlengrund 79", zip_code="12683", city="Berlin"),
        Address(street="Chemnitzer Str. 93", zip_code="12621", city="Berlin"),
        Address(street="Mirower Str. 152", zip_code="12623", city="Berlin"),
        Address(street="Summter Str. 229", zip_code="12623", city="Berlin"),
        Address(street="Köpenicker Str. 150", zip_code="12355", city="Berlin"),
        Address(street="Rhodeländerweg 111", zip_code="12355", city="Berlin"),
        Address(street="Karl-Marx-Str. 142", zip_code="12529", city="Schönefeld"),
        Address(street="Bornhagenweg 55", zip_code="12309", city="Berlin"),
        Address(street="Wünsdorfer Str. 98", zip_code="12307", city="Berlin"),
        Address(street="Ernst-Lemmer-Ring 14", zip_code="14165", city="Berlin"),
        Address(street="Robert-von-Ostertag-Straße 30", zip_code="14163", city="Berlin"),
        Address(street="Alt-Gatow 1-3", zip_code="14089", city="Berlin"),
        Address(street="Eisenzahnstraße 43-44", zip_code="10709", city="Berlin"),
        Address(street="Augsburger Str. 31", zip_code="10789", city="Berlin"),
        Address(street="Tauentzienstraße 20", zip_code="10789", city="Berlin"),
        Address(street="Budapester Str. 37", zip_code="10787", city="Berlin"),
        Address(street="Luisenstraße 64", zip_code="10117", city="Berlin"),
        Address(street="Wöhlertstraße 12-13", zip_code="10115", city="Berlin"),
        Address(street="Herzbergstraße 128-139", zip_code="10365", city="Berlin"),
        Address(street="Bernhard-Bästlein-Straße 56", zip_code="10367", city="Berlin"),
        Address(street="Weißenseer Weg 32-34", zip_code="13055", city="Berlin"),
        Address(street="Josef-Orlopp-Straße 51", zip_code="10365", city="Berlin"),
        Address(street="Coppistraße 14-24", zip_code="10365", city="Berlin"),
        Address(street="Fischerstraße 16", zip_code="10317", city="Berlin"),
        Address(street="Salzmannstraße 28", zip_code="10319", city="Berlin"),
        Address(street="Köpenicker Landstraße 66A", zip_code="12435", city="Berlin"),
        Address(street="Lützowstraße 73", zip_code="10785", city="Berlin"),
        Address(street="Pohlstraße 74", zip_code="10785", city="Berlin"),
        Address(street="Hohenstaufenstraße", zip_code="10781", city="Berlin"),
        Address(street="Barbarossastraße 25", zip_code="10779", city="Berlin"),
        Address(street="Jenaer Str. 27", zip_code="10717", city="Berlin"),
        Address(street="Pfalzburger Str. 43/44", zip_code="10717", city="Berlin"),
        Address(street="Bessemerstraße 42A", zip_code="12103", city="Berlin"),
        Address(street="Burgemeisterstraße 34", zip_code="12103", city="Berlin")
    ]

    if n > len(addresses):
        raise ValueError(f"Requested {n} addresses, but only {len(addresses)} are available.")

    return random.sample(addresses, n)

def generate_random_address() -> Address:
    return generate_random_addresses(1)[0]

def generate_random_vehicle_address() -> Address:
    return generate_random_vehicle_addresses(1)[0]

def get_random_bad_address() -> Address:
    bad_addresses = [
        Address(street="!! INVALID STREET", zip_code="00000", city="Errorville"),
        Address(street="INVALID STREET", zip_code="00000", city="bhjbb"), 
        Address(street="123 !@#", zip_code="000", city="nbbhjb"),
        Address(street="NULL NULL NULL", zip_code="7777", city="hgvg"),
        Address(street="Some Street - No City", zip_code="99999", city="fffg")
    ]
    return random.choice(bad_addresses)

def get_random_service_time() -> int:
    choices = [30, 60, 45, 90]
    weights = [0.4, 0.3, 0.15, 0.15]
    return random.choices(choices, weights=weights, k=1)[0]

skills_pool = ["electrician", "plumber","carpenter"]

def generate_filled_vehicles(amount: int) -> list[FilledVehicle]:
    vehicle_addresses = generate_random_vehicle_addresses(amount)

    return [
        FilledVehicle(
            vehicle_id=i + 1,
            skills=set(random.sample(skills_pool, k=random.randint(1, len(skills_pool)))),
            worker_amount=random.choices([1, 2, 3], weights=[0.7, 0.2, 0.1])[0],
            operation_hours=OperationHours(start_minutes= 360, end_minutes=1140), #todo change to real logic
            start_address=vehicle_addresses[i],
            finish_address=vehicle_addresses[i],
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

def generate_random_appointments(
        n: int,
        appointment_duration_factor: float = 3.0,
        month:int =4,
        day:int= 29
) -> List[Appointment]:
    appointments = []
    addresses = generate_random_addresses(n)

    day_start = datetime(2025, month, day, 8, 0, 0)
    day_end = datetime(2025, month, day, 18, 0, 0)

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
            number_of_workers=random.choices([1, 2, 3], weights=[0.7, 0.25, 0.05])[0],
            appointment_type = AppointmentType.REAL_APPOINTMENT.value
        )

        appointments.append(appointment)

    return appointments



# === MAIN FACTORY FUNCTION ===

def create_testdata_optimization_request(
        num_vehicles: int,
        num_appointments: int,
        appointment_duration_factor:float = 3.0,
        month:int = 4,
        day:int = 29
) -> OptimizationRequest:
    start_address = generate_random_address()
    finish_address = start_address

    company_info = CompanyInfo(
        start_address=start_address,
        finish_address=finish_address,
        vehicles =generate_filled_vehicles(num_vehicles)
    )

    appointments = generate_random_appointments(num_appointments,appointment_duration_factor,month,day)

    return OptimizationRequest(
        company_info=company_info,
        appointments=appointments
    )

# === CSV DUMP ===
def export_appointments_to_csv(request: OptimizationRequest, filename: str):
    current_folder = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(current_folder, filename)

    with open(file_path, mode="w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)

        writer.writerow([
            "appointment_start", "appointment_end",
            "street", "zip_code", "city",
            "number_of_workers", "service_time", 
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
                appt.number_of_workers,
                appt.service_time,
                skills_str
            ])

    print(f"CSV File successfully saved here: {file_path}")

# Create and save test data for multiple dates or range of dates
def create_and_save_appointments_for_date_range(
    appointments_per_day: int,
    appointment_duration_factor: float,
    start_date: date,
    end_date: date,
    inject_errors: bool = False
):
    all_appointments = []
    delta = end_date - start_date

    if inject_errors:
        num_bad_days = min(delta.days + 1, random.randint(1, 2))
        bad_day_indices = random.sample(range(delta.days + 1), num_bad_days)
    else:
        bad_day_indices = []


    for i in range(delta.days + 1):
        current_date = start_date + timedelta(days=i)
        random_n = random.randint(
            max(1, appointments_per_day - 5),
            appointments_per_day + 5
        )

        daily_appointments = generate_random_appointments(
            n=random_n,
            appointment_duration_factor=appointment_duration_factor,
            month=current_date.month,
            day=current_date.day
        )

        # Inject bad addresses
        if i in bad_day_indices:
            num_to_corrupt = min(2, len(daily_appointments))
            indices_to_replace = random.sample(range(len(daily_appointments)), num_to_corrupt)

            for idx in indices_to_replace:
                old_address = daily_appointments[idx].address
                new_address = get_random_bad_address()
                daily_appointments[idx].address = new_address
                print(f"⚠️ Injected bad address for {current_date.strftime('%Y-%m-%d')} at index {idx}: {old_address} → {new_address}")

        all_appointments.extend(daily_appointments)

    dummy_request = OptimizationRequest(
        company_info=CompanyInfo(
            start_address=generate_random_address(),
            finish_address=generate_random_address(),
            vehicles=[]
        ),
        appointments=all_appointments
    )

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    csv_filename = f"appointments_range_{timestamp}.csv"

    export_appointments_to_csv(dummy_request, csv_filename)

    print(f"✅ Appointments saved to:")
    print(f"   📄 {csv_filename}")



# === OPTIONAL SCRIPT ENTRYPOINT ===

if __name__ == "__main__":
    # Argument parser for command line options
    parser = argparse.ArgumentParser(description="Generate appointment test data.")
    parser.add_argument("--mode", choices=["single", "range"], default="single", help="Mode: 'single' (default) or 'range'")
    parser.add_argument("--start", type=str, help="Start date in YYYY-MM-DD (required for range)")
    parser.add_argument("--end", type=str, help="End date in YYYY-MM-DD (required for range)")
    parser.add_argument("--per-day", type=int, default=25, help="Appointments per day (default: 25)")
    parser.add_argument("--duration-factor", type=float, default=2.0, help="Appointment duration multiplier")
    parser.add_argument("--vehicles", type=int, default=7, help="Number of vehicles (default: 7)")
    parser.add_argument("--inject-errors", action="store_true", help="Inject bad addresses into appointments")
    # Month and day arguments for single mode
    parser.add_argument("--month", type=int, default=7, help="Month for single mode (default: 7)")
    parser.add_argument("--day", type=int, default=29, help="Day for single mode (default: 29)")

    args = parser.parse_args()


    if args.mode == "range":
        if not args.start or not args.end:
            parser.error("--start and --end are required in 'range' mode.")

        start_date = date.fromisoformat(args.start)
        end_date = date.fromisoformat(args.end)

        create_and_save_appointments_for_date_range(
            appointments_per_day=args.per_day,
            appointment_duration_factor=args.duration_factor,
            start_date=start_date,
            end_date=end_date,
            inject_errors=args.inject_errors
        )

    else:
        request_obj = create_testdata_optimization_request(
            num_vehicles=args.vehicles,
            num_appointments=args.per_day,
            appointment_duration_factor=args.duration_factor,
            month=4,
            day=29
        )
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        csv_filename = f"testdata_{timestamp}.csv"
        json_filename = f"testdata_{timestamp}.json"

        export_appointments_to_csv(request_obj, csv_filename)