from pydantic import BaseModel
from typing import List, Optional, Union
from dataclasses import dataclass

class Address(BaseModel):
    street: str
    zip_code: str
    city: str

class Location(BaseModel):
    id: str
    lat: float
    lng: float

class Appointment(BaseModel):
    appointment_start: str
    appointment_end: str
    address:Address
    service_time: int
    number_of_workers: int

class EnhancedAppointment(BaseModel):
    appointment_start: str
    appointment_end: str
    address:Address
    service_time: int
    location:Location
    number_of_workers: int

class FilledVehicle(BaseModel):
    vehicle_id:int
    skills:Optional[str]
    worker_amount:int

class CompanyInfo(BaseModel):
    start_address: Address
    finish_address: Address
    number_of_workers: List[FilledVehicle]

class OptimizationRequest(BaseModel):
    company_info: CompanyInfo
    appointments: List[Appointment]


class DistanceMatrixRequest(BaseModel):
    locations: List[Location]

class MatrixElement(BaseModel):
    from_id: str
    to_id: str
    distance_text: str
    distance_value: int
    duration_text: str
    duration_value: int

class DistanceMatrixResponse(BaseModel):
    matrix: List[MatrixElement]

@dataclass
class EnhancedAddressResponse:
    could_be_fully_found: bool
    error_information: Optional[str]
    street: str
    zipcode: str
    city: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class AppointmentValidationResponse(BaseModel):
    all_valid:bool
    errors:List[str]
    address_responses:List[EnhancedAddressResponse]

class EnhancedOptimizationRequest(BaseModel):
    company_info: CompanyInfo
    appointments: List[EnhancedAppointment]
    time_matrix: List[List[int]]
    distance_matrix: List[List[int]]

class DistanceAndDurationMatrices(BaseModel):
    ids: List[str]  # Liste der IDs
    distance_matrix: List[List[int]]  # Matrix für Entfernungen (in Metern)
    duration_matrix: List[List[int]]  # Matrix für Dauer (in Sekunden)

class Route(BaseModel):
    route_id: int
    vehicle_id:Optional[int]
    distance_traveled: float
    time_traveled: float
    appointments: List[EnhancedAppointment] #first and last appointments are not real appointments but the starting address

#suggestion for next week
class ProblemMetric(BaseModel):
    name: str
    value: Union[str, float, int]

class Solution(BaseModel):
    total_distance_traveled: float
    max_distance_traveled: float
    routes: List[Route]
    method_used: Optional[str]
    problem_metrics: List[ProblemMetric]







