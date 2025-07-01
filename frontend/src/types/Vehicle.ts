import { Address } from "./Address";

export interface OperationHours {
    start_minutes: number;
    end_minutes: number; 
}

export interface VehicleBreak {
    duration: number;
    start_min: number;
    start_max: number;
}

export interface Vehicle {
    vehicle_id: number;
    skills: string | null;        
    worker_amount: number;
    operation_hours: OperationHours;
    depot?: {
        start: Address;
        finish: Address;
    };
    cost_per_km: number;
    cost_per_hour: number;
    vehicle_break?: VehicleBreak | null;
}