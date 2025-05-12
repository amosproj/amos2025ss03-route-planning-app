export interface EnhancedAddressResponse {
  could_be_fully_found: boolean;
  error_information?: string | null;
  street: string;
  zipcode: string;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
}