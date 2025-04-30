from typing import List
from datetime import datetime
from models import CompanyInfo, Appointment
from fastapi import HTTPException
import exceptionStrings

def validate_company_info(company_info: CompanyInfo):

    errors = []

    if company_info.number_of_workers < 1:
        errors.append(exceptionStrings.NUMBER_OF_WORKERS_INVALID)

    if not company_info.start_address.strip():
       errors.append(exceptionStrings.START_ADDRESS_EMPTY)

    if not company_info.finish_address.strip():
        errors.append(exceptionStrings.FINISH_ADDRESS_EMPTY)

    if errors:
        return False, errors

    return True, []


def validate_appointments(appointments: List[Appointment]):

    errors = []
    date_format = "%Y-%m-%d %H:%M:%S.%f"

    for appointment in appointments:

        try:
            start = datetime.strptime(appointment.appointment_start, date_format)
            end = datetime.strptime(appointment.appointment_end, date_format)
        except ValueError:
            errors.append(exceptionStrings.APPOINTMENT_START_INVALID)
            continue

        if start > end:
            errors.append(exceptionStrings.APPOINTMENT_END_BEFORE_START)

        if not appointment.street.strip():
            errors.append(exceptionStrings.APPOINTMENT_STREET_EMPTY)

        appointment_duration = (end - start).total_seconds() / 3600 #duration in hours
        appointment_max_duration = 24  # probably this Exception will be mainly caused by typos in the endtime day
        if appointment_duration > appointment_max_duration:
            errors.append(exceptionStrings.APPOINTMENT_DURATION_TOO_LONG)

        if not appointment.zip_code.strip():
            errors.append(exceptionStrings.APPOINTMENT_ZIPCODE_EMPTY)

        if not appointment.city.strip():
            errors.append(exceptionStrings.APPOINTMENT_CITY_EMPTY)

        if appointment.number_of_workers < 1:
            errors.append(exceptionStrings.NUMBER_OF_WORKERS_INVALID)

        # TODO: API-Aufruf, um die Adresse zu überprüfen

    if errors:
        return False, errors

    return True, []

def save_company_information_to_cache(company_info: CompanyInfo):
    #TODO implement
    print("Caching not yet implemented")
    return {"message": "Company Information was validated but could not be saved, since caching is not implemented yet"}

def save_appointments_to_cache(appointments: List[Appointment]):
    #TODO implement
    print("Caching not yet implemented")
    return {"message": "Appointment Information was validated but could not be saved, since caching is not implemented yet"}


def validate_and_save_appointment_information(appointments: List[Appointment]):

        is_valid, errors = validate_appointments(appointments)

        if not is_valid:
            raise HTTPException(status_code=400, detail=errors)

        return save_appointments_to_cache(appointments)


def validate_and_save_company_information(company_info: CompanyInfo):

    is_valid, errors = validate_company_info(company_info)

    if not is_valid:
        raise HTTPException(status_code=400, detail=errors)

    return save_company_information_to_cache(company_info)


