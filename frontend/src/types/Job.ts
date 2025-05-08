export interface Job {
    start: number;
    end: number;
    street: string;
    zip: string;
    city: string;
    workers: number;
    skills: string[] | null;
}