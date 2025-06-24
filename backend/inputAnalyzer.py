from datetime import datetime

from distance_matrix import get_distance_matrix_with_cache
from solver.models import *
from fastapi import HTTPException
import exceptionStrings
import os
import requests

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
        for fmt in ("%Y-%m-%dT%H:%M:%S.%f", "%Y-%m-%dT%H:%M:%S"):  # with/without milliseconds
            try:
                return datetime.strptime(original.rstrip('Z'), fmt)
            except ValueError:
                continue
    # Raise if parsing failed
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
        errors.append(exceptionStrings.START_ADDRESS_EMPTY)
        address_responses.append(
            EnhancedAddressResponse(
                could_be_fully_found=False,
                error_information= error_information,
                street=address.street,
                zipcode=address.zip_code,
                city=address.city,
                latitude=None,
                longitude=None
            )
        )
    else:
        start_address_response = validate_single_address_with_google_maps(address.street, address.zip_code, address.city)
        address_responses.append(start_address_response)


def validate_company_info(company_info: CompanyInfo)-> AppointmentValidationResponse:
    errors = []
    address_responses = []

    if not company_info.vehicles:
        errors.append(exceptionStrings.NUMBER_OF_VEHICLES_INVALID)

    start = company_info.start_address
    check_and_enhance_single_address(address_responses, errors, start,exceptionStrings.START_ADDRESS_EMPTY)

    finish = company_info.finish_address
    check_and_enhance_single_address(address_responses, errors, finish, exceptionStrings.FINISH_ADDRESS_EMPTY)

    for vehicle in company_info.vehicles:
        vehicle_start = vehicle.start_address
        check_and_enhance_single_address(
            address_responses,
            errors,
            vehicle_start,
            f"Startaddress invalid for vehicle {vehicle.vehicle_id} "
        )

        vehicle_finish = vehicle.finish_address
        check_and_enhance_single_address(
            address_responses,
            errors,
            vehicle_finish,
            f"Endaddress invalid for vehicle {vehicle.vehicle_id} "
        )


    all_valid = len(errors) == 0

    return AppointmentValidationResponse(
        all_valid=all_valid,
        errors=errors,
        address_responses=address_responses
    )


def validate_appointments(appointments: List[Appointment]) -> AppointmentValidationResponse:
    errors = []
    address_responses = []
    all_valid = True  # will be set False as soon as the first address is not valid

    for appointment in appointments:

        try:
            start = parse_datetime(appointment.appointment_start)
            end = parse_datetime(appointment.appointment_end)
        except ValueError:
            errors.append(exceptionStrings.APPOINTMENT_START_INVALID)
            all_valid = False
            continue

        if start > end:
            errors.append(exceptionStrings.APPOINTMENT_END_BEFORE_START)
            all_valid = False

        appointment_duration_hours = (end - start).total_seconds() / 3600  # duration in hours
        appointment_duration_minutes = (end - start).total_seconds() / 60  # duration in minutes
        appointment_max_duration = 24  # wahrscheinlich wird diese Ausnahme hauptsächlich durch Tippfehler in der Endzeit verursacht
        if appointment_duration_hours > appointment_max_duration:
            errors.append(exceptionStrings.APPOINTMENT_DURATION_TOO_LONG)
            all_valid = False
        if appointment_duration_minutes < appointment.service_time:
            errors.append(exceptionStrings.SERVICETIME_EXCEEDS_APPOINTMENT_LENGTH)
            all_valid = False

        if not appointment.address.street.strip():
            errors.append(exceptionStrings.APPOINTMENT_STREET_EMPTY)
            all_valid = False
        if not appointment.address.zip_code.strip():
            errors.append(exceptionStrings.APPOINTMENT_ZIPCODE_EMPTY)
            all_valid = False

        if not appointment.address.city.strip():
            errors.append(exceptionStrings.APPOINTMENT_CITY_EMPTY)
            all_valid = False

        if appointment.number_of_workers < 1:
            errors.append(exceptionStrings.NUMBER_OF_VEHICLES_INVALID)
            all_valid = False


        address_info = validate_single_address_with_google_maps(
            appointment.address.street,
            appointment.address.zip_code,
            appointment.address.city
        )

        address_responses.append(address_info)

        if not address_info.could_be_fully_found:
            error_message = f"{exceptionStrings.ADDRESS_NOT_FOUND_WITH_GOOGLE}: {address_info.error_information}"

            error_message += f" Address: {address_info.street}, {address_info.zipcode}, {address_info.city}"

            errors.append(error_message)
            all_valid = False

    if errors:
        return AppointmentValidationResponse(
            all_valid = False,
            errors = errors,
            address_responses = address_responses
        )

    return AppointmentValidationResponse(
        all_valid = all_valid,
        errors = errors,
        address_responses = address_responses
    )

def save_company_information_to_cache(company_info: CompanyInfo):
    #TODO implement
    print("Caching not yet implemented")
    return {"message": "Company Information was validated but could not be saved, since caching is not implemented yet"}


def validate_and_save_appointment_information(appointments: List[Appointment]):

    is_valid, errors, address_responses = validate_appointments(appointments)

    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail={
                "errors": errors,
                "address_responses": [response.__dict__ for response in address_responses]  # Umwandeln in Dictionary
            }
        )

    return address_responses

def validate_and_save_company_information(company_info: CompanyInfo):
    validation_result = validate_company_info(company_info)

    if not validation_result.all_valid:
        raise HTTPException(status_code=400, detail={
            "errors": validation_result["errors"],
            "address_responses": validation_result["address_responses"]
        })

    return save_company_information_to_cache(company_info)

def convert_to_locations(address_responses: list[EnhancedAddressResponse]) -> list[Location]:
    locations = []

    for address in address_responses:
        if address.latitude is not None and address.longitude is not None:
            location_id = f"{address.street}-{address.zipcode}-{address.city}"
            location = Location(id=location_id, lat=address.latitude, lng=address.longitude)
            locations.append(location)

    return locations

def convert_to_location(address_response: EnhancedAddressResponse) -> Location:
    if address_response.latitude is None or address_response.longitude is None:
        raise ValueError("Address is missing coordinates")

    location_id = f"{address_response.street}-{address_response.zipcode}-{address_response.city}"
    return Location(id=location_id, lat=address_response.latitude, lng=address_response.longitude)


def convert_to_enhanced_appointment(appointment: Appointment,location:Location) -> EnhancedAppointment:

    enhanced_appointment = EnhancedAppointment(
        appointment_start=appointment.appointment_start,
        appointment_end=appointment.appointment_end,
        address=appointment.address,
        service_time = appointment.service_time,
        skills_needed= appointment.skills_needed,
        location=location,
        number_of_workers=appointment.number_of_workers
    )

    return enhanced_appointment

def enhance_vehicles(
    vehicles: List[FilledVehicle],
    vehicle_address_responses: List[EnhancedAddressResponse]
) -> List[EnhancedFilledVehicle]:
    # vehicle_address_responses: [start1, finish1, start2, finish2, ...]
    if len(vehicle_address_responses) != 2 * len(vehicles):
        raise ValueError("Mismatch between number of vehicles and vehicle address responses")

    enhanced_vehicles = []
    for i, vehicle in enumerate(vehicles):
        start_index = 2 * i
        finish_index = start_index + 1

        start_location = convert_to_location(vehicle_address_responses[start_index])
        finish_location = convert_to_location(vehicle_address_responses[finish_index])

        enhanced_vehicle = EnhancedFilledVehicle(
            vehicle_id=vehicle.vehicle_id,
            skills=vehicle.skills,
            worker_amount=vehicle.worker_amount,
            operation_hours=vehicle.operation_hours,
            start_address=vehicle.start_address,
            start_location=start_location,
            finish_address=vehicle.finish_address,
            finish_location=finish_location,
            cost_per_km=vehicle.cost_per_km,
            cost_per_hour=vehicle.cost_per_hour
        )
        enhanced_vehicles.append(enhanced_vehicle)

    return enhanced_vehicles


def check_and_enhance_optimization_request(opti_request:OptimizationRequest) -> EnhancedOptimizationRequest:

    company_info = opti_request.company_info
    appointments = opti_request.appointments

    appointment_validation_response = validate_appointments(appointments)
    company_info_validation_response = validate_company_info(company_info)

    company_and_vehicle_locations = convert_to_locations(company_info_validation_response.address_responses)

    start_location = company_and_vehicle_locations[0]
    end_location = company_and_vehicle_locations[1]

    vehicle_address_responses = company_info_validation_response.address_responses[2:]
    enhanced_vehicles = enhance_vehicles(company_info.vehicles, vehicle_address_responses)

    enhanced_company_info = EnhancedCompanyInfo(
        start_address=company_info.start_address,
        start_location=start_location,
        finish_address=company_info.finish_address,
        finish_location=end_location,
        vehicles = enhanced_vehicles
    )

    if not company_info_validation_response.all_valid:
        raise HTTPException(
            status_code=400,
            detail={
                "errors": "Company Info could not be validated"
            }
        )

    all_valid = appointment_validation_response.all_valid
    errors = appointment_validation_response.errors
    appointment_address_responses = appointment_validation_response.address_responses

    if not all_valid:
        raise HTTPException(
            status_code=400,
            detail={
                "errors": errors
            }
        )
    #now all addresses are valid, therefore we have lat, long
    depot_location = convert_to_locations(company_info_validation_response.address_responses)
    appointment_locations = convert_to_locations(appointment_address_responses)

    enhanced_appointments = [
        convert_to_enhanced_appointment(appointments[i], appointment_locations[i])
        for i in range(len(appointments))
    ]

    num_vehicle_locations = len(company_info.vehicles) * 2
    vehicle_locations = company_and_vehicle_locations[2:num_vehicle_locations+2]
    all_locations = [depot_location[0]] + appointment_locations + vehicle_locations

    """
    distance matrix will be off size (1+ appointments + 2*vehicles)^2
    """

    distance_matrix_response = get_distance_matrix_with_cache(all_locations)
    location_ids = distance_matrix_response.location_ids
    duration_matrix = distance_matrix_response.duration_matrix
    distance_matrix = distance_matrix_response.distance_matrix

    enhanced_opti_request = EnhancedOptimizationRequest(
        company_info = enhanced_company_info,
        appointments = enhanced_appointments,
        location_ids = location_ids,
        time_matrix = duration_matrix,
        distance_matrix = distance_matrix
    )

    return enhanced_opti_request




