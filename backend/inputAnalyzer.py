from datetime import datetime
from distance_matrix import get_distance_matrix_with_cache
from solver.models import *
from fastapi import HTTPException
import exceptionStrings
import os
import requests
import time
import logging
import concurrent.futures

# Configure logger
logger = logging.getLogger(__name__)

def parse_datetime(dt_str: str) -> datetime:
    # Support ISO8601 with or without timezone Z or offset
    original = dt_str
    # Replace trailing 'Z' with '+00:00' for fromisoformat
    if dt_str.endswith('Z'):
        dt_str = dt_str[:-1] + '+00:00'
    try:
        return datetime.fromisoformat(dt_str)
    except ValueError:
        # Try common formats
        for fmt in ("%Y-%m-%dT%H:%M:%S.%f", "%Y-%m-%dT%H:%M:%S"):
            try:
                return datetime.strptime(original.rstrip('Z'), fmt)
            except ValueError:
                continue
    raise ValueError(f"Invalid datetime format: {original}")

def validate_single_address_with_google_maps(street: str, zip_code: str, city: str) -> EnhancedAddressResponse:
    assert isinstance(street, str), "street must be a string"
    assert isinstance(zip_code, str), "zip_code must be a string"
    assert isinstance(city, str), "city must be a string"

    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    if not api_key:
        raise RuntimeError("GOOGLE_MAPS_API_KEY is not set in environment variables")

    full_address = f"{street}, {zip_code} {city}"
    params = {
        "address": full_address,
        "key": api_key
    }

    response = requests.get("https://maps.googleapis.com/maps/api/geocode/json", params=params)

    if response.status_code != 200:
        return EnhancedAddressResponse(
            could_be_fully_found=False,
            error_information=f"Error contacting Google Maps API for address: {full_address}",
            street=street,
            zipcode=zip_code,
            city=city
        )

    data = response.json()

    if not data.get("results"):
        return EnhancedAddressResponse(
            could_be_fully_found=False,
            error_information=f"Address could not be found using Google Maps API: {full_address}",
            street=street,
            zipcode=zip_code,
            city=city
        )

    result = data["results"][0]
    if result.get("partial_match"):
        return EnhancedAddressResponse(
            could_be_fully_found=False,
            error_information=f"Address was only partially recognized — possibly invalid: {full_address}",
            street=street,
            zipcode=zip_code,
            city=city,
            latitude=result["geometry"]["location"]["lat"],
            longitude=result["geometry"]["location"]["lng"]
        )

    return EnhancedAddressResponse(
        could_be_fully_found=True,
        error_information=None,
        street=street,
        zipcode=zip_code,
        city=city,
        latitude=result["geometry"]["location"]["lat"],
        longitude=result["geometry"]["location"]["lng"]
    )


def check_and_enhance_single_address(address_responses, errors, address, error_information):
    if not address.street.strip() or not address.zip_code.strip() or not address.city.strip():
        errors.append(error_information)
        address_responses.append(
            EnhancedAddressResponse(
                could_be_fully_found=False,
                error_information=error_information,
                street=address.street,
                zipcode=address.zip_code,
                city=address.city
            )
        )
    else:
        resp = validate_single_address_with_google_maps(
            address.street, address.zip_code, address.city
        )
        address_responses.append(resp)


def validate_company_info(company_info: CompanyInfo) -> AppointmentValidationResponse:
    errors: list[str] = []
    addr_args: list[tuple[str, str, str, str]] = []

    if not company_info.vehicles:
        errors.append(exceptionStrings.NUMBER_OF_VEHICLES_INVALID)

    # Depot start & finish
    addr_args.append((
        company_info.start_address.street,
        company_info.start_address.zip_code,
        company_info.start_address.city,
        exceptionStrings.START_ADDRESS_EMPTY
    ))
    addr_args.append((
        company_info.finish_address.street,
        company_info.finish_address.zip_code,
        company_info.finish_address.city,
        exceptionStrings.FINISH_ADDRESS_EMPTY
    ))

    # Each vehicle's start & finish
    for vehicle in company_info.vehicles:
        addr_args.append((
            vehicle.start_address.street,
            vehicle.start_address.zip_code,
            vehicle.start_address.city,
            f"Start address invalid for vehicle {vehicle.vehicle_id}"
        ))
        addr_args.append((
            vehicle.finish_address.street,
            vehicle.finish_address.zip_code,
            vehicle.finish_address.city,
            f"End address invalid for vehicle {vehicle.vehicle_id}"
        ))

    def _validate(arg):
        street, zip_code, city, err = arg
        if not street.strip() or not zip_code.strip() or not city.strip():
            return EnhancedAddressResponse(
                could_be_fully_found=False,
                error_information=err,
                street=street,
                zipcode=zip_code,
                city=city
            )
        return validate_single_address_with_google_maps(street, zip_code, city)

    # Parallelize geocoding calls
    with concurrent.futures.ThreadPoolExecutor() as ex:
        address_responses = list(ex.map(_validate, addr_args))

    for resp in address_responses:
        if not resp.could_be_fully_found:
            errors.append(resp.error_information or "Unknown geocode error")

    return AppointmentValidationResponse(
        all_valid=(len(errors) == 0),
        errors=errors,
        address_responses=address_responses
    )


def validate_appointments(appointments: List[Appointment]) -> AppointmentValidationResponse:
    errors: list[str] = []
    addr_args: list[tuple[str, str, str, str]] = []

    for appointment in appointments:
        try:
            start = parse_datetime(appointment.appointment_start)
            end = parse_datetime(appointment.appointment_end)
        except ValueError:
            errors.append(exceptionStrings.APPOINTMENT_START_INVALID)
            continue

        if start > end:
            errors.append(exceptionStrings.APPOINTMENT_END_BEFORE_START)

        duration_hours = (end - start).total_seconds() / 3600
        duration_minutes = (end - start).total_seconds() / 60
        if duration_hours > 24:
            errors.append(exceptionStrings.APPOINTMENT_DURATION_TOO_LONG)
        if duration_minutes < appointment.service_time:
            errors.append(exceptionStrings.SERVICETIME_EXCEEDS_APPOINTMENT_LENGTH)

        if not appointment.address.street.strip():
            errors.append(exceptionStrings.APPOINTMENT_STREET_EMPTY)
        if not appointment.address.zip_code.strip():
            errors.append(exceptionStrings.APPOINTMENT_ZIPCODE_EMPTY)
        if not appointment.address.city.strip():
            errors.append(exceptionStrings.APPOINTMENT_CITY_EMPTY)
        if appointment.number_of_workers < 1:
            errors.append(exceptionStrings.NUMBER_OF_VEHICLES_INVALID)

        addr_args.append((
            appointment.address.street,
            appointment.address.zip_code,
            appointment.address.city,
            f"{exceptionStrings.ADDRESS_NOT_FOUND_WITH_GOOGLE}"
        ))

    def _validate_appt(arg):
        street, zip_code, city, err = arg
        if not street.strip() or not zip_code.strip() or not city.strip():
            return EnhancedAddressResponse(
                could_be_fully_found=False,
                error_information=err,
                street=street,
                zipcode=zip_code,
                city=city
            )
        resp = validate_single_address_with_google_maps(street, zip_code, city)
        if not resp.could_be_fully_found:
            resp.error_information = f"{err}: {resp.error_information}"
        return resp

    with concurrent.futures.ThreadPoolExecutor() as ex:
        address_responses = list(ex.map(_validate_appt, addr_args))

    for resp in address_responses:
        if not resp.could_be_fully_found:
            errors.append(resp.error_information or "Unknown geocode error")

    return AppointmentValidationResponse(
        all_valid=(len(errors) == 0),
        errors=errors,
        address_responses=address_responses
    )

def convert_to_locations(address_responses: list[EnhancedAddressResponse]) -> list[Location]:
    locations: list[Location] = []
    for addr in address_responses:
        if addr.latitude is not None and addr.longitude is not None:
            loc_id = f"{addr.street}-{addr.zipcode}-{addr.city}"
            locations.append(Location(id=loc_id, lat=addr.latitude, lng=addr.longitude))
    return locations


def convert_to_location(address_response: EnhancedAddressResponse) -> Location:
    if address_response.latitude is None or address_response.longitude is None:
        raise ValueError("Address is missing coordinates")
    loc_id = f"{address_response.street}-{address_response.zipcode}-{address_response.city}"
    return Location(id=loc_id, lat=address_response.latitude, lng=address_response.longitude)


def convert_to_enhanced_appointment(appointment: Appointment, location: Location) -> EnhancedAppointment:
    return EnhancedAppointment(
        appointment_start=appointment.appointment_start,
        appointment_end=appointment.appointment_end,
        address=appointment.address,
        service_time=appointment.service_time,
        skills_needed=appointment.skills_needed,
        location=location,
        number_of_workers=appointment.number_of_workers,
        appointment_type=AppointmentType.REAL_APPOINTMENT.value
    )


def enhance_vehicles(
    vehicles: List[FilledVehicle],
    vehicle_address_responses: List[EnhancedAddressResponse]
) -> List[EnhancedFilledVehicle]:
    if len(vehicle_address_responses) != 2 * len(vehicles):
        raise ValueError("Mismatch between number of vehicles and vehicle address responses")

    enhanced_list: list[EnhancedFilledVehicle] = []
    for i, veh in enumerate(vehicles):
        start_resp = vehicle_address_responses[2*i]
        end_resp = vehicle_address_responses[2*i + 1]
        start_loc = convert_to_location(start_resp)
        end_loc = convert_to_location(end_resp)
        enhanced_list.append(EnhancedFilledVehicle(
            vehicle_id=veh.vehicle_id,
            skills=veh.skills,
            worker_amount=veh.worker_amount,
            operation_hours=veh.operation_hours,
            start_address=veh.start_address,
            start_location=start_loc,
            finish_address=veh.finish_address,
            finish_location=end_loc,
            cost_per_km=veh.cost_per_km,
            cost_per_hour=veh.cost_per_hour,
            vehicle_break=veh.vehicle_break
        ))
    return enhanced_list


def check_and_enhance_optimization_request(opti_request: OptimizationRequest) -> EnhancedOptimizationRequest:
    start_time = time.time()

    # Validate
    app_val = validate_appointments(opti_request.appointments)
    comp_val = validate_company_info(opti_request.company_info)

    if not comp_val.all_valid:
        raise HTTPException(status_code=400, detail={"errors": "Company Info could not be validated"})
    if not app_val.all_valid:
        raise HTTPException(status_code=400, detail={"errors": app_val.errors})

    # Convert locations
    all_comp_locs = convert_to_locations(comp_val.address_responses)
    depot_start, depot_end = all_comp_locs[0], all_comp_locs[1]
    vehicle_addrs = comp_val.address_responses[2:]
    enhanced_vehicles = enhance_vehicles(opti_request.company_info.vehicles, vehicle_addrs)

    enhanced_company = EnhancedCompanyInfo(
        start_address=opti_request.company_info.start_address,
        start_location=depot_start,
        finish_address=opti_request.company_info.finish_address,
        finish_location=depot_end,
        vehicles=enhanced_vehicles
    )

    appt_locs = convert_to_locations(app_val.address_responses)
    enhanced_appts = [
        convert_to_enhanced_appointment(opti_request.appointments[i], appt_locs[i])
        for i in range(len(opti_request.appointments))
    ]

    all_locations = [depot_start] + appt_locs + [loc for veh in enhanced_vehicles for loc in (veh.start_location, veh.finish_location)]

    elapsed = time.time() - start_time
    logger.info(f"Enhancing optimization request completed in {elapsed:.2f} seconds.")

    dist_resp = get_distance_matrix_with_cache(all_locations)
    return EnhancedOptimizationRequest(
        company_info=enhanced_company,
        appointments=enhanced_appts,
        location_ids=dist_resp.location_ids,
        time_matrix=dist_resp.duration_matrix,
        distance_matrix=dist_resp.distance_matrix
    )
