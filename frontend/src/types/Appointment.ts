import { Address } from './Address';

export interface Appointment {
  appointment_start: string;
  appointment_end: string;
  address: Address;
  number_of_workers: number;
  service_time: number;
  travel_time_to_next_min?: number;
  travel_distance_to_next_km?: number;
  appointment_type?: string;
}

export interface EnhancedAppointment extends Appointment {
  address: Address;
  location: {
    id: string;
    lat: number;
    lng: number;
  };
  arrival_time?: number
}

export interface EnhancedAddressResponse {
  could_be_fully_found: boolean;
  error_information: string[] | null;
  street: string;
  zip_code: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
}
