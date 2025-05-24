import { Appointment } from "./Appointment";
import { CompanyInfo } from "./CompanyInfo";

export interface OptimizationRequest {
    company_info: CompanyInfo;
    appointments: Appointment[];
}