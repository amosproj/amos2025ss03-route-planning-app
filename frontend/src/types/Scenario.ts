import { Appointment } from "./Appointment";

export interface Scenario {
    jobs: Appointment[];
    date: number;

}

export interface ScenarioDateString {
    jobs: Appointment[];
    date: string;

}

export interface ScenarioByDate {
    date: number; // timestamp
    jobs: Appointment[];
    solution: boolean;
}

export interface Worker {
    startAddress: string;
    finishAddress: string;
    workers: number;
}