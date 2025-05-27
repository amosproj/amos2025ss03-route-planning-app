import { Appointment } from "./Appointment";
import { Vehicle } from "./Vehicle";

export interface Scenario {
    jobs: Appointment[];
    date: number;
    vehicles: Vehicle[];

}

export interface Worker {
    startAddress: string;
    finishAddress: string;
    workers: number;
}