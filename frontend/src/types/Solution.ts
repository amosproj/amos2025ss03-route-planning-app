import { EnhancedAppointment } from './Appointment';
export interface Solution {
  total_distance_traveled: number;
  max_distance_traveled: number;
  routes: Route[];
  method_used?: string;
  problem_metrics: ProblemMetric[];
  validation_report: SolutionValidationReport;
}

export interface Route {
  route_id: number;
  vehicle_id: number;
  distance_traveled: number;
  time_traveled: number;
  appointments: EnhancedAppointment[];
  route_metrics: RouteMetrics;
}

interface ProblemMetric {
  name: string;
  value: string | number;
}

interface RouteMetrics {
  route_id: number;
  vehicle_id: number;
  num_appointments: number;
  total_travel_time_min: number;
  total_travel_distance_km: number;
  total_service_time_min: number;
  total_idle_time_min: number;
  start_time: number;
  end_time: number; 
}

interface RouteValidationError {
  route_id: number;
  errors: string[];
}

export interface SolutionValidationReport {
  is_valid: boolean;
  errors: string[];
  missing_appointments: string[];
  duplicate_appointments: string[];
  route_level_errors: RouteValidationError[];
  impossible_appointments: string[];
}
