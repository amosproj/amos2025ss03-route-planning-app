import { Appointment } from "./Appointment";

export interface Scenario {
    jobs: Appointment[];
    date: number;
    vehicles: Vehicle[];

}

export interface Vehicle { 
    id: number;
    capacity: number;
    skills: string[];
    workers: number;
}

export interface Worker {
    startAddress: string;
    finishAddress: string;
    workers: number;
}