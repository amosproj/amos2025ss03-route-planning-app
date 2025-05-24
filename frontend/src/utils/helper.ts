import { Scenario, Vehicle } from '../types/Scenario';
import { Appointment } from '../types/Appointment';
import { CompanyInfo } from '../types/CompanyInfo';
import { Address } from '../types/Adress';

export function parseScenarioFromCsv(csvData: string): Scenario[] {
  const lines = csvData.trim().split(/\r?\n/);
  lines.shift();
  const jobs: Appointment[] = lines.filter(Boolean).map((line) => {
    const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
    const [start, end, streetRaw, zip, city, workers] = values.map((v) =>
      v.replace(/^"|"$/g, ''),
    );
    return {
      start: new Date(start).getTime(),
      end: new Date(end).getTime(),
      street: streetRaw,
      zip,
      city,
      workers: parseInt(workers, 10),
      skills: null,
    };
  });
  const groups: Record<number, Appointment[]> = {};
  jobs.forEach((job) => {
    const day = new Date(job.start).setHours(0, 0, 0, 0);
    if (!groups[day]) groups[day] = [];
    groups[day].push(job);
  });
  const defaultVehicle = {
    id: 0,
    capacity: 0,
    skills: [],
    workers: 1,
  } as Vehicle;
  return Object.entries(groups).map(
    ([date, jobs]) =>
      ({ date: Number(date), jobs, vehicles: [defaultVehicle] }) as Scenario,
  );
}

export function parseCompanyInfoFromCsv(csvData: string): CompanyInfo {
  const lines = csvData.split('\n');
  let startStr = '';
  let finishStr = '';
  let workersCount = 0;

  lines.forEach((line) => {
    const [keyRaw, valueRaw] = line.split(',');
    if (!keyRaw || !valueRaw) return;
    const key = keyRaw.trim().toLowerCase();
    const value = valueRaw.trim().replace(/^"|"$/g, '');
    if (key.includes('start address')) {
      startStr = value;
    } else if (key.includes('finish address')) {
      finishStr = value;
    } else if (key.includes('workers') || key.includes('# of workers')) {
      workersCount = parseInt(value, 10);
    }
  });

  const parseAddress = (str: string): Address => {
    const parts = str.split(',').map(s => s.trim());
    return {
      street: parts[0] || '',
      zip_code: parts[1] || '',
      city: parts[2] || '',
    };
  };

  const companyInfo: CompanyInfo = {
    start_address: parseAddress(startStr),
    finish_address: parseAddress(finishStr),
    vehicles: [{ id: 0, skills: [], woker_amount: workersCount }],
  };
  return companyInfo;
}