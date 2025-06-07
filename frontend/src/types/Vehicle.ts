import { Address } from "./Adress";

export interface OperationHours {
    start_minutes: number;
    end_minutes: number; 
}

export interface Vehicle {
    vehicle_id: number;
    skills: string | null;        
    worker_amount: number;
    operation_hours: OperationHours;
    depot?: Address
}