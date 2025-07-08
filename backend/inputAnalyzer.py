from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

from distance_matrix import get_distance_matrix_with_cache
from solver.models import *
from fastapi import HTTPException
import exceptionStrings
import os
import requests
import logging

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
        for fmt in ("%Y-%m-%dT%H:%M:%S.%f", "%Y-%m-%dT%H:%M:%S"):  # with/without milliseconds
            try:
                return datetime.strptime(original.rstrip('Z'), fmt)
            except ValueError:
                continue
    # Raise if parsing failed
    raise ValueError(f"Invalid datetime format: {original}")

# Google Geocoding API call with retry and exponential backoff
def geocode_with_retry(full_address: str, retries: int = 3, base_delay: int = 1) -> dict:
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    if not api_key:
        raise RuntimeError("GOOGLE_MAPS_API_KEY is not set in environment variables")
    
    params = {
        "address": full_address,
        "key": api_key
    }
    
    for attempt in range(retries):
        try:
            response = requests.get("https://maps.googleapis.com/maps/api/geocode/json", params=params, timeout=5)
            if response.status_code == 200:
                return response.json()
            logger.warning(f"Geocoding API status not OK (attempt {attempt + 1}): {response.status_code}")
        except Exception as e:
            logger.error(f"Geocoding API request failed (attempt {attempt + 1}): {e}")

        # Wait with exponential backoff: 1s, 2s, 4s...
        if attempt < retries - 1:  # Don't sleep on the last attempt
            delay = base_delay * (2 ** attempt)
            logger.info(f"Retrying geocoding in {delay} seconds...")
            time.sleep(delay)

    logger.error(f"All {retries} retries failed for address: {full_address}")
    return None

def validate_single_address_with_google_maps(street: str, zip_code: str, city: str) -> EnhancedAddressResponse:
    assert isinstance(street, str), "street must be a string"
    assert isinstance(zip_code, str), "zip_code must be a string"
    assert isinstance(city, str), "city must be a string"

    full_address = f"{street}, {zip_code} {city}"
    data = geocode_with_retry(full_address)

    if data is None:
        return EnhancedAddressResponse(
            could_be_fully_found=False,
            error_information=f"Error contacting Google Maps API for address: {full_address}",
            street=street,
            zipcode=zip_code,
            city=city
        )

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

# Validate multiple addresses in parallel using thread pool
def validate_addresses_parallel(addresses_to_validate: List[tuple]) -> List[EnhancedAddressResponse]:
    def validate_single_address(address_tuple):
        street, zip_code, city = address_tuple
        return validate_single_address_with_google_maps(street, zip_code, city)

    # Use ThreadPoolExecutor with max 10 workers (same as distance matrix)
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(validate_single_address, addr) for addr in addresses_to_validate]
        results = []
        
        for future in as_completed(futures):
            try:
                result = future.result()
                results.append(result)
            except Exception as e:
                logger.error(f"Address validation failed: {e}")
                # Create error response for failed validation
                results.append(EnhancedAddressResponse(
                    could_be_fully_found=False,
                    error_information=f"Validation failed: {str(e)}",
                    street="",
                    zipcode="",
                    city=""
                ))
    
    return results

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
    start_time = time.time()
    
    errors = []
    address_responses = []

    if not company_info.vehicles:
        errors.append(exceptionStrings.NUMBER_OF_VEHICLES_INVALID)

    # Collect all addresses to validate in parallel
    addresses_to_validate = []
    
    # Add company start and finish addresses
    start = company_info.start_address
    if start.street.strip() and start.zip_code.strip() and start.city.strip():
        addresses_to_validate.append((start.street, start.zip_code, start.city))
    else:
        errors.append(exceptionStrings.START_ADDRESS_EMPTY)
        address_responses.append(
            EnhancedAddressResponse(
                could_be_fully_found=False,
                error_information=exceptionStrings.START_ADDRESS_EMPTY,
                street=start.street,
                zipcode=start.zip_code,
                city=start.city,
                latitude=None,
                longitude=None
            )
        )

    finish = company_info.finish_address
    if finish.street.strip() and finish.zip_code.strip() and finish.city.strip():
        addresses_to_validate.append((finish.street, finish.zip_code, finish.city))
    else:
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

    # Add vehicle addresses
    for vehicle in company_info.vehicles:
        vehicle_start = vehicle.start_address
        if vehicle_start.street.strip() and vehicle_start.zip_code.strip() and vehicle_start.city.strip():
            addresses_to_validate.append((vehicle_start.street, vehicle_start.zip_code, vehicle_start.city))
        else:
            errors.append(f"Startaddress invalid for vehicle {vehicle.vehicle_id}")
            address_responses.append(
                EnhancedAddressResponse(
                    could_be_fully_found=False,
                    error_information=f"Startaddress invalid for vehicle {vehicle.vehicle_id}",
                    street=vehicle_start.street,
                    zipcode=vehicle_start.zip_code,
                    city=vehicle_start.city,
                    latitude=None,
                    longitude=None
                )
            )

        vehicle_finish = vehicle.finish_address
        if vehicle_finish.street.strip() and vehicle_finish.zip_code.strip() and vehicle_finish.city.strip():
            addresses_to_validate.append((vehicle_finish.street, vehicle_finish.zip_code, vehicle_finish.city))
        else:
            errors.append(f"Endaddress invalid for vehicle {vehicle.vehicle_id}")
            address_responses.append(
                EnhancedAddressResponse(
                    could_be_fully_found=False,
                    error_information=f"Endaddress invalid for vehicle {vehicle.vehicle_id}",
                    street=vehicle_finish.street,
                    zipcode=vehicle_finish.zip_code,
                    city=vehicle_finish.city,
                    latitude=None,
                    longitude=None
                )
            )

    # Validate all addresses in parallel
    if addresses_to_validate:
        parallel_results = validate_addresses_parallel(addresses_to_validate)
        address_responses.extend(parallel_results)

    all_valid = len(errors) == 0
    
    elapsed_time = time.time() - start_time
    logger.info(f"Company info validation completed in {elapsed_time:.2f} seconds.")

    return AppointmentValidationResponse(
        all_valid=all_valid,
        errors=errors,
        address_responses=address_responses
    )

def validate_appointments(appointments: List[Appointment]) -> AppointmentValidationResponse:
    start_time = time.time()
    
    errors = []
    address_responses = []
    all_valid = True

    # Collect all valid addresses for parallel validation
    addresses_to_validate = []
    appointment_indices = []  # Track which appointment each address belongs to

    for idx, appointment in enumerate(appointments):
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

        appointment_duration_hours = (end - start).total_seconds() / 3600
        appointment_duration_minutes = (end - start).total_seconds() / 60
        appointment_max_duration = 24
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

        # If address is valid, add to parallel validation list
        if (appointment.address.street.strip() and 
            appointment.address.zip_code.strip() and 
            appointment.address.city.strip()):
            addresses_to_validate.append((
                appointment.address.street,
                appointment.address.zip_code,
                appointment.address.city
            ))
            appointment_indices.append(idx)

    # Validate all addresses in parallel
    if addresses_to_validate:
        parallel_results = validate_addresses_parallel(addresses_to_validate)
        
        # Process results and check for validation errors
        for result in parallel_results:
            address_responses.append(result)
            if not result.could_be_fully_found:
                error_message = f"{exceptionStrings.ADDRESS_NOT_FOUND_WITH_GOOGLE}: {result.error_information}"
                error_message += f" Address: {result.street}, {result.zipcode}, {result.city}"
                errors.append(error_message)
                all_valid = False

    elapsed_time = time.time() - start_time
    logger.info(f"Appointment validation completed in {elapsed_time:.2f} seconds.")

    return AppointmentValidationResponse(
        all_valid=all_valid,
        errors=errors,
        address_responses=address_responses
    )

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
        number_of_workers=appointment.number_of_workers,
        appointment_type=AppointmentType.REAL_APPOINTMENT.value
    )

    return enhanced_appointment

def enhance_vehicles(
    vehicles: List[FilledVehicle],
    vehicle_address_responses: List[EnhancedAddressResponse]
) -> List[EnhancedFilledVehicle]:
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
            cost_per_hour=vehicle.cost_per_hour,
            vehicle_break=vehicle.vehicle_break
        )
        enhanced_vehicles.append(enhanced_vehicle)

    return enhanced_vehicles

def check_and_enhance_optimization_request(opti_request:OptimizationRequest) -> EnhancedOptimizationRequest:
    # Start time of the operation
    start_time = time.time()

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

    depot_location = convert_to_locations(company_info_validation_response.address_responses)
    appointment_locations = convert_to_locations(appointment_address_responses)

    enhanced_appointments = [
        convert_to_enhanced_appointment(appointments[i], appointment_locations[i])
        for i in range(len(appointments))
    ]

    num_vehicle_locations = len(company_info.vehicles) * 2
    vehicle_locations = company_and_vehicle_locations[2:num_vehicle_locations+2]
    all_locations = [depot_location[0]] + appointment_locations + vehicle_locations

    # Log total time taken for the operation
    elapsed_time = time.time() - start_time
    logger.info(f"Enhancing optimization request completed in {elapsed_time:.2f} seconds.")

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