import { Scenario } from '../types/Scenario';
import { Vehicle } from '../types/Vehicle';
import { Appointment } from '../types/Appointment';
import { CompanyInfo } from '../types/CompanyInfo';
import { Address } from '../types/Adress';
import { jsonData } from '../../../backend/testdata/optimizationRequest.json'

export function parseScenarioFromCsv(csvData: string): Scenario[] {
  const lines = csvData.trim().split(/\r?\n/);
  lines.shift();
  const jobs: Appointment[] = lines.filter(Boolean).map((line) => {
    const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
    const [start, end, streetRaw, zip, city, workers] = values.map((v) =>
      v.replace(/^"|"$/g, ''),
    );
    return {
      appointment_start: new Date(start).getTime(),
      appointment_end: new Date(end).getTime(),
      address: {
        street: streetRaw,
        zip_code: zip,
        city,
      } as Address,
      number_of_workers: parseInt(workers, 10),
      skills: null,
    };
  });
  const groups: Record<number, Appointment[]> = {};
  jobs.forEach((job) => {
    const day = new Date(job.appointment_start).setHours(0, 0, 0, 0);
    if (!groups[day]) groups[day] = [];
    groups[day].push(job);
  });
  const defaultVehicle = {
    vehicle_id: 0,
    skills: '',
    worker_amount: 1,
  } as Vehicle;
  return Object.entries(groups)
    .map(
      ([date, jobs]) =>
        ({ date: Number(date), jobs, vehicles: [defaultVehicle] }) as Scenario,
    )
  
}
export function parseScenariofromJson(jsonData: string): Scenario {
  try {
    const data = JSON.parse(jsonData);
    const scenario: Scenario = {
      jobs: data.appointments.map((appt: any) => ({
        appointment_start: new Date(appt.appointment_start).getTime(),
        appointment_end: new Date(appt.appointment_end).getTime(),
        address: {
          street: appt.address.street,
          zip_code: appt.address.zip_code,
          city: appt.address.city,
        } as Address,
        number_of_workers: appt.number_of_workers,
        skills: appt.skills || null,
      })),
      date: new Date('2025-05-01').getTime(),
      vehicles: data.number_of_workers.map((veh: any) => ({
        vehicle_id: veh.vehicle_id,
        skills: veh.skills || '',
        worker_amount: veh.worker_amount || 1,
      })),
    };
    return scenario;
  } catch (error) {
    console.error('Failed to parse JSON data:', error);
    return {
      jobs: [],
      date: new Date('2025-05-01').getTime(),
      vehicles: [],
    };
  }
}
export function timestampToDateString(timestamp: number | string): string {
  const dateString = new Date(timestamp)
    .toISOString()
    .replace('T', ' ')
    .split('.')[0]
    .concat('.000');
  return dateString;
}

export function parseCompanyInfoFromCsv(csvData: string): CompanyInfo {
  const lines = csvData.replace(/\r\n/g, '\n').split('\n');
  let startStr = '';
  let finishStr = '';
  const vehicles: Vehicle[] = [];

  lines.forEach((line) => {
    if (!line.trim()) return;
    const idx = line.indexOf(',');
    if (idx < 0) return;
    const key = line.slice(0, idx).trim().toLowerCase();
    let value = line.slice(idx + 1).trim();
    value = value.replace(/^"|"$/g, '');
    if (key.includes('start address')) {
      startStr = value;
    } else if (key.includes('finish address')) {
      finishStr = value;
    } else if (key.includes('workers')) {
      const num = parseInt(value, 10);
      for (let i = 0; i < num; i++) {
        vehicles.push({
          vehicle_id: i,
          skills: 'electrician',
          worker_amount: 1,
        });
      }
    }
  });

  const parseAddress = (str: string): Address => {
    const [streetPart, rest = ''] = str.split(',').map((s) => s.trim());
    const [zip = '', ...cityParts] = rest.split(/\s+/);
    return {
      street: streetPart || '',
      zip_code: zip || '',
      city: cityParts.join(' ') || '',
    };
  };

  const companyInfo: CompanyInfo = {
    start_address: parseAddress(startStr),
    finish_address: parseAddress(finishStr),
    vehicles: vehicles,
  };
  return companyInfo;
}
