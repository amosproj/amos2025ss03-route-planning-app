import { Scenario } from '../types/Scenario';
import { Appointment } from '../types/Appointment';
import { Address } from '../types/Address';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { Warehouse } from 'lucide-react';
import dayjs from 'dayjs';

export function parseScenarioFromCsv(csvData: string): Scenario[] {
  const lines = csvData.trim().split(/\r?\n/);
  lines.shift();
  const jobs: Appointment[] = lines.filter(Boolean).map((line) => {
    const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
    const [start, end, streetRaw, zip, city, workers, service_time, skills] = values.map((v) =>
      v.replace(/^"|"$/g, ''),
    );
    const skillsArray = skills && skills.trim() ? skills.split(',').map(s => s.trim()).filter(Boolean) : [];
    return {
      appointment_start: new Date(start).toISOString(),
      appointment_end: new Date(end).toISOString(),
      address: {
        street: streetRaw,
        zip_code: zip,
        city,
      } as Address,
      number_of_workers: parseInt(workers, 10),
      service_time: service_time ? parseInt(service_time, 10) : 30, // Default to 30 minutes if not provided
      skills_needed: skillsArray,
      appointment_type: 'REAL_APPOINTMENT',
    };
  });
  const groups: Record<number, Appointment[]> = {};
  jobs.forEach((job) => {
    const day = new Date(job.appointment_start).setHours(0, 0, 0, 0);
    if (!groups[day]) groups[day] = [];
    groups[day].push(job);
  });
  return Object.entries(groups).map(
    ([date, jobs]) =>
      ({ date: Number(date), jobs } as Scenario),
  );
}
export function parseScenariofromJson(jsonData: string): Scenario {
  try {
    const data = JSON.parse(jsonData);
    const scenario: Scenario = {
      jobs: data.appointments.map(
        (appt: {
          appointment_start: string;
          appointment_end: string;
          address: { street: string; zip_code: string; city: string };
          number_of_workers: number;
          skills?: string;
        }) => ({
          appointment_start: new Date(appt.appointment_start).getTime(),
          appointment_end: new Date(appt.appointment_end).getTime(),
          address: {
            street: appt.address.street,
            zip_code: appt.address.zip_code,
            city: appt.address.city,
          } as Address,
          number_of_workers: appt.number_of_workers,
          skills: appt.skills || null,
        }),
      ),
      date: new Date('2025-05-01').getTime(),
    };
    return scenario;
  } catch (error) {
    console.error('Failed to parse JSON data:', error);
    return {
      jobs: [],
      date: new Date('2025-05-01').getTime(),
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

// Function to create a custom depot marker with warehouse icon
export const createDepotMarkerIcon = () => {
  // Create the Lucide Warehouse icon as a React element
  const warehouseIcon = createElement(Warehouse, {
    size: 16,
    color: 'white',
    strokeWidth: 2,
  });

  // Convert the React element to an SVG string
  const warehouseIconSvg = renderToString(warehouseIcon);

  const svg = `
    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" fill="#2C3E50" stroke="#34495E" stroke-width="2"/>
      <g transform="translate(12, 12)">
        ${warehouseIconSvg}
      </g>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

// Helper functions for week navigation
export const getWeekStartingSunday = (date: dayjs.Dayjs) => {
  const yearStart = dayjs(`${date.year()}-01-01`);
  const daysSinceSunday = yearStart.day();
  const firstSunday = yearStart.subtract(daysSinceSunday, 'day');
  const diffInDays = date.startOf('day').diff(firstSunday, 'day');
  const week = Math.floor(diffInDays / 7) + 1;
  return { year: date.year(), week };
}

export const getStartOfWeek = (year: number, week: number) => {
  const yearStart = dayjs(`${year}-01-01`);
  const daysSinceSunday = yearStart.day();
  const firstSunday = yearStart.subtract(daysSinceSunday, 'day');
  return firstSunday.add(week - 1, 'week');
}
export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};
