from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any, Union

# Define data models
class Node(BaseModel):
    id: str | int
    x: float
    y: float
    is_depot: bool
    time_window: Optional[List[float]] = None
    required_skills: Optional[List[str]] = None

class VRPData(BaseModel):
    nodes: List[Node]
    num_vehicles: int
    available_skills: Optional[List[str]] = Field(default_factory=list)
    vehicle_skills: Optional[Dict[str, List[str]]] = Field(default_factory=dict)

class VRPResponse(BaseModel):
    status: str
    routes: Optional[List[List[str|int]]] = None
    max_distance: Optional[float] = None
    total_distance: Optional[float] = None
    message: Optional[str] = None

class Appointment(BaseModel):
    appointment_start: str
    appointment_end: str
    street: str
    zip_code: str
    city: str
    number_of_workers: int

class CompanyInfo(BaseModel):
    start_address: str
    finish_address: str
    number_of_workers: int
