import { WaypointAppointment } from './WaypointAppointment';
import { EnhancedAppointment } from './Appointment';

export interface RouteRequest {
  id: string;
  origin: {
    lat: number;
    lng: number;
  };
  destination: {
    lat: number;
    lng: number;
  };
  waypoints: WaypointAppointment[];
  color: string;
  appointments: EnhancedAppointment[];
}
