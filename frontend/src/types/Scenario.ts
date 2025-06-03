import { Appointment } from "./Appointment";
import { Vehicle } from "./Vehicle";

export interface Scenario {
    jobs: Appointment[];
    date: number;
    vehicles: Vehicle[];

}

export interface ScenarioByDate {
    date: number // timestamp
    jobs: Appointment[]
    vehicles: Vehicle[]
    solution: boolean
}

export interface Worker {
    startAddress: string;
    finishAddress: string;
    workers: number;
}