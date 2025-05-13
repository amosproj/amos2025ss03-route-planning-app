import { Address } from "./Adress";
import { Vehicle } from "./Vehicle";
export interface CompanyInfo {
    start_address: Address;
    finish_address: Address;
    vehicles: Vehicle[];
}