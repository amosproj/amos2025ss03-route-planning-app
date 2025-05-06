import { Job } from "./Job";

export interface Scenario {
    jobs: Job[];
    date: number;
    vehicles: Vehicle[];

}

export interface Vehicle {
    id: number;
    capacity: number;
    skills: string[];
    workers: number;
}