import { EnhancedAppointment } from "./Appointment";
export interface Solution {
    total_distance_traveled: number;
    max_distance_traveled: number;
    routes: Route[]
}

interface Route {
    route_id: number;
    vehicle_id: number;
    distance_traveled: number;
    time_traveled: number;
    appointments: EnhancedAppointment[];
}