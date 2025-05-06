import { Scenario, Vehicle } from "../types/Scenario";
import { Job } from "../types/Job";

export function parseScenarioFromCsv(csvData: string): Scenario[] {
    const lines = csvData.trim().split(/\r?\n/);
    lines.shift();
    const jobs: Job[] = lines.filter(Boolean).map(line => {
      const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
      const [start, end, streetRaw, zip, city, workers] = values.map(v => v.replace(/^"|"$/g, ''));
      return { start: new Date(start).getTime(), end: new Date(end).getTime(), street: streetRaw, zip, city, workers: parseInt(workers, 10), skills: null };
    });
    const groups: Record<number, Job[]> = {};
    jobs.forEach(job => {
      const day = new Date(job.start).setHours(0,0,0,0);
      if (!groups[day]) groups[day] = [];
      groups[day].push(job);
    });
    const defaultVehicle = { id: 0, capacity: 0, skills: [], workers: 1 } as Vehicle;
    return Object.entries(groups).map(([date, jobs]) => ({ date: Number(date), jobs, vehicles: [defaultVehicle],   } as Scenario));
  }