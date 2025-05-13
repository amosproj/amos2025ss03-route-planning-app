export interface Appointment {
    start: number;
    end: number;
    street: string;
    zip: string;
    city: string;
    workers: number;
    skills: string[] | null;
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