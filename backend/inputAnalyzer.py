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
    print("API Key:", api_key)  # Debugging line to check if the API key is loaded
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

    print("Google Maps API Response:", data)

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

        appointment_duration = (end - start).total_seconds() / 3600  # duration in hours
        appointment_max_duration = 24  # wahrscheinlich wird diese Ausnahme hauptsächlich durch Tippfehler in der Endzeit verursacht
        if appointment_duration > appointment_max_duration:
            errors.append(exceptionStrings.APPOINTMENT_DURATION_TOO_LONG)
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
        location=location,
        number_of_workers=appointment.number_of_workers
    )

    return enhanced_appointment

def check_and_enhance_optimization_request(opti_request:OptimizationRequest) -> EnhancedOptimizationRequest:

    company_info = opti_request.company_info
    appointments = opti_request.appointments

    appointment_validation_response = validate_appointments(appointments)
    company_info_validation_response = validate_company_info(company_info)

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
    #jetzt sind alle addressen gültig, d.h. ich habe lat, long
    depot_location = convert_to_locations(company_info_validation_response.address_responses)
    locations = convert_to_locations(address_responses)

    enhanced_appointments = [
        convert_to_enhanced_appointment(appointments[i], locations[i])
        for i in range(len(appointments))
    ]

    locations = [depot_location[0]] + locations


    distance_matrix_response = get_distance_matrix_2d(locations)
    duration_matrix = distance_matrix_response.duration_matrix
    distance_matrix = distance_matrix_response.distance_matrix

    enhanced_opti_request = EnhancedOptimizationRequest(
        company_info=company_info,
        appointments=enhanced_appointments,
        time_matrix = duration_matrix,
        distance_matrix = distance_matrix
    )

    return enhanced_opti_request





