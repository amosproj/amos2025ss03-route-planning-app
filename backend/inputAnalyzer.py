from datetime import datetime

from distance_matrix import get_distance_matrix_2d
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


def validate_company_info(company_info: CompanyInfo)-> AppointmentValidationResponse:
    errors = []
    address_responses = []

    if not company_info.number_of_workers:
        errors.append(exceptionStrings.NUMBER_OF_WORKERS_INVALID)

    start = company_info.start_address
    if not start.street.strip() or not start.zip_code.strip() or not start.city.strip():
        errors.append(exceptionStrings.START_ADDRESS_EMPTY)
        address_responses.append(
            EnhancedAddressResponse(
                could_be_fully_found=False,
                error_information = exceptionStrings.START_ADDRESS_EMPTY,
                street=start.street,
                zipcode=start.zip_code,
                city=start.city,
                latitude=None,
                longitude=None
            )
        )
    else:
        start_address_response = validate_single_address_with_google_maps(start.street, start.zip_code, start.city)
        address_responses.append(start_address_response)

    # Google Maps Validierung für die Zieladresse
    finish = company_info.finish_address
    if not finish.street.strip() or not finish.zip_code.strip() or not finish.city.strip():
        errors.append(exceptionStrings.FINISH_ADDRESS_EMPTY)
        address_responses.append(
            EnhancedAddressResponse(
                could_be_fully_found=False,
                error_information=exceptionStrings.FINISH_ADDRESS_EMPTY,
                street=finish.street,
                zipcode=finish.zip_code,
                city=finish.city,
                latitude=None,
                longitude=None
            )
        )
    else:
        finish_address_response = validate_single_address_with_google_maps(finish.street, finish.zip_code, finish.city)
        address_responses.append( finish_address_response)

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
            errors.append(exceptionStrings.NUMBER_OF_WORKERS_INVALID)
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


def convert_to_enhanced_appointment(appointment: Appointment,location:Location) -> EnhancedAppointment:

    enhanced_appointment = EnhancedAppointment(
        appointment_start=appointment.appointment_start,
        appointment_end=appointment.appointment_end,
        address=appointment.address,
        service_time = appointment.service_time,
        location=location,
        number_of_workers=appointment.number_of_workers
    )

    return enhanced_appointment

def check_and_enhance_optimization_request(opti_request:OptimizationRequest) -> EnhancedOptimizationRequest:

    company_info = opti_request.company_info
    appointments = opti_request.appointments

    appointment_validation_response = validate_appointments(appointments)
    company_info_validation_response = validate_company_info(company_info)

    company_locations = convert_to_locations(company_info_validation_response.address_responses)

    start_location = company_locations[0]
    end_location = company_locations[-1]

    enhanced_company_info = EnhancedCompanyInfo(
        start_address=company_info.start_address,
        start_location=start_location,
        finish_address=company_info.finish_address,
        finish_location=end_location,
        number_of_workers=company_info.number_of_workers
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
    address_responses = appointment_validation_response.address_responses

    if not all_valid:
        raise HTTPException(
            status_code=400,
            detail={
                "errors": errors
            }
        )
    # Build per-vehicle depot start and finish address responses
    num_vehicles = len(company_info.number_of_workers)
    vehicle_depot_addresses = []
    vehicle_start_indices = []
    vehicle_finish_indices = []  # will be used to map vehicle idx to finish address index
    custom_finish_map = {}  # vehicle idx -> custom finish index

    
    index_shift = 2  # first two indices are company start and finish, so appointments start at index 2
    for idx, vehicle in enumerate(company_info.number_of_workers):
        if vehicle.depot:
            ds = vehicle.depot.start
            df = vehicle.depot.finish
            start_resp = validate_single_address_with_google_maps(ds.street, ds.zip_code, ds.city)
            vehicle_start_indices.append(len(vehicle_depot_addresses) + index_shift)
            vehicle_depot_addresses.append(start_resp)
            if not (ds.street == df.street and ds.zip_code == df.zip_code and ds.city == df.city):
                vehicle_finish_indices.append(1)
            else:
                vehicle_finish_indices.append(len(vehicle_depot_addresses) - 1 + index_shift)
        else:
            vehicle_start_indices.append(0)
            vehicle_finish_indices.append(1)  # default finish is company finish
       
    # appointment responses
    appt_responses = appointment_validation_response.address_responses
    matrix_responses = appt_responses[:2] + vehicle_depot_addresses + appt_responses[2:]

    # convert to Location objects
    matrix_locations = convert_to_locations(matrix_responses)
    # build enhanced appointments (appointments start at offset num_vehicles)
    enhanced_appointments = [
        convert_to_enhanced_appointment(appointments[i], matrix_locations[num_vehicles + i])
        for i in range(len(appointments))
    ]
    # compute matrices
    distance_matrix_response = get_distance_matrix_2d(matrix_locations)
    location_ids = distance_matrix_response.location_ids
    time_matrix = distance_matrix_response.duration_matrix
    distance_matrix = distance_matrix_response.distance_matrix
    # define per-vehicle start and end indices
    starts = list(range(num_vehicles))
    ends = []
    # ends: for each vehicle, custom finish index or company finish index
    for idx in range(num_vehicles):
        if idx in custom_finish_map:
            ends.append(num_vehicles + len(appointments) + custom_finish_map[idx])
        else:
            ends.append(comp_finish_index)
    enhanced_opti_request = EnhancedOptimizationRequest(
        company_info=enhanced_company_info,
        appointments=enhanced_appointments,
        location_ids=location_ids,
        time_matrix=time_matrix,
        distance_matrix=distance_matrix,
        starts=starts,
        ends=ends,
    )

    return enhanced_opti_request





