import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import { RootState } from '@/store';
import { Solution } from '@/types/Solution';
import { MetricsPanel } from '@/components/MetricsPanel';
import { RouteCard } from '@/components/RouteCard';
import { getRouteColor } from '@/utils/routeColors';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/daily-plan/')({
  component: DailyPlan,
});

function DailyPlan() {
  const searchParams = new URLSearchParams(window.location.search);
  const date = searchParams.get('date') || '';
  // const navigate = useNavigate();
  // const solutions = useSelector((state: RootState) => state.solutions);
  // const solution: Solution = solutions.byDate[date];

  const staticResponse = {
    total_distance_traveled: 197578.0,
    max_distance_traveled: 63924.0,
    routes: [
      {
        route_id: 0,
        vehicle_id: 0,
        distance_traveled: 54428.0,
        time_traveled: 275.0,
        appointments: [
          {
            appointment_start: '2025-04-29 00:00:00.000',
            appointment_end: '2025-04-29 23:59:00.000',
            address: {
              street: 'Görlitzer Str. 3',
              zip_code: '10997',
              city: 'Berlin',
            },
            service_time: 0,
            location: {
              id: 'Görlitzer Str. 3-10997-Berlin',
              lat: 52.49812439999999,
              lng: 13.4345773,
            },
            number_of_workers: 0,
            travel_time_to_next_min: 30,
            travel_distance_to_next_km: 16.42,
          },
          {
            appointment_start: '2025-04-29 09:00:00.000',
            appointment_end: '2025-04-29 11:00:00.000',
            address: {
              street: 'Messedamm 26',
              zip_code: '14055',
              city: 'Berlin',
            },
            service_time: 60,
            location: {
              id: 'Messedamm 26-14055-Berlin',
              lat: 52.5007333,
              lng: 13.271065,
            },
            number_of_workers: 1,
            travel_time_to_next_min: 31,
            travel_distance_to_next_km: 11.82,
          },
          {
            appointment_start: '2025-04-29 13:00:00.000',
            appointment_end: '2025-04-29 15:00:00.000',
            address: {
              street: 'Alte Schönhauser Str. 46',
              zip_code: '10119',
              city: 'Berlin',
            },
            service_time: 30,
            location: {
              id: 'Alte Schönhauser Str. 46-10119-Berlin',
              lat: 52.52663399999999,
              lng: 13.4080465,
            },
            number_of_workers: 1,
            travel_time_to_next_min: 23,
            travel_distance_to_next_km: 7.06,
          },
          {
            appointment_start: '2025-04-29 14:00:00.000',
            appointment_end: '2025-04-29 14:30:00.000',
            address: {
              street: 'Allerstraße 11',
              zip_code: '12049',
              city: 'Berlin',
            },
            service_time: 30,
            location: {
              id: 'Allerstraße 11-12049-Berlin',
              lat: 52.47498849999999,
              lng: 13.4239202,
            },
            number_of_workers: 1,
            travel_time_to_next_min: 18,
            travel_distance_to_next_km: 11.11,
          },
          {
            appointment_start: '2025-04-29 15:00:00.000',
            appointment_end: '2025-04-29 16:30:00.000',
            address: {
              street: 'Grunewaldstraße 54',
              zip_code: '10825',
              city: 'Berlin',
            },
            service_time: 30,
            location: {
              id: 'Grunewaldstraße 54-10825-Berlin',
              lat: 52.4880055,
              lng: 13.3379483,
            },
            number_of_workers: 1,
            travel_time_to_next_min: 23,
            travel_distance_to_next_km: 8.01,
          },
          {
            appointment_start: '2025-04-29 00:00:00.000',
            appointment_end: '2025-04-29 23:59:00.000',
            address: {
              street: 'Görlitzer Str. 3',
              zip_code: '10997',
              city: 'Berlin',
            },
            service_time: 0,
            location: {
              id: 'Görlitzer Str. 3-10997-Berlin',
              lat: 52.49812439999999,
              lng: 13.4345773,
            },
            number_of_workers: 0,
            travel_time_to_next_min: null,
            travel_distance_to_next_km: null,
          },
        ],
        route_metrics: {
          route_id: 0,
          vehicle_id: 0,
          num_appointments: 6,
          total_travel_time_min: 125,
          total_travel_distance_km: 54.43,
          total_service_time_min: 150,
          total_idle_time_min: 780,
        },
      },
      {
        route_id: 1,
        vehicle_id: 1,
        distance_traveled: 63924.0,
        time_traveled: 342.0,
        appointments: [
          {
            appointment_start: '2025-04-29 00:00:00.000',
            appointment_end: '2025-04-29 23:59:00.000',
            address: {
              street: 'Görlitzer Str. 3',
              zip_code: '10997',
              city: 'Berlin',
            },
            service_time: 0,
            location: {
              id: 'Görlitzer Str. 3-10997-Berlin',
              lat: 52.49812439999999,
              lng: 13.4345773,
            },
            number_of_workers: 0,
            travel_time_to_next_min: 19,
            travel_distance_to_next_km: 9.18,
          },
          {
            appointment_start: '2025-04-29 09:00:00.000',
            appointment_end: '2025-04-29 11:00:00.000',
            address: {
              street: 'Johannisthaler Ch 46',
              zip_code: '12437',
              city: 'Berlin',
            },
            service_time: 60,
            location: {
              id: 'Johannisthaler Ch 46-12437-Berlin',
              lat: 52.4479323,
              lng: 13.4841446,
            },
            number_of_workers: 1,
            travel_time_to_next_min: 22,
            travel_distance_to_next_km: 15.17,
          },
          {
            appointment_start: '2025-04-29 10:00:00.000',
            appointment_end: '2025-04-29 12:30:00.000',
            address: {
              street: 'Spichernstraße 24',
              zip_code: '10777',
              city: 'Berlin',
            },
            service_time: 30,
            location: {
              id: 'Spichernstraße 24-10777-Berlin',
              lat: 52.4976816,
              lng: 13.3340756,
            },
            number_of_workers: 1,
            travel_time_to_next_min: 7,
            travel_distance_to_next_km: 2.28,
          },
          {
            appointment_start: '2025-04-29 11:00:00.000',
            appointment_end: '2025-04-29 12:30:00.000',
            address: {
              street: 'Straße des 17. Juni 135',
              zip_code: '10623',
              city: 'Berlin',
            },
            service_time: 30,
            location: {
              id: 'Straße des 17. Juni 135-10623-Berlin',
              lat: 52.5120946,
              lng: 13.3269947,
            },
            number_of_workers: 1,
            travel_time_to_next_min: 26,
            travel_distance_to_next_km: 10.59,
          },
          {
            appointment_start: '2025-04-29 10:00:00.000',
            appointment_end: '2025-04-29 13:30:00.000',
            address: {
              street: 'Rollbergstraße 70',
              zip_code: '12049',
              city: 'Berlin',
            },
            service_time: 30,
            location: {
              id: 'Rollbergstraße 70-12049-Berlin',
              lat: 52.4786365,
              lng: 13.4272965,
            },
            number_of_workers: 1,
            travel_time_to_next_min: 17,
            travel_distance_to_next_km: 6.46,
          },
          {
            appointment_start: '2025-04-29 14:00:00.000',
            appointment_end: '2025-04-29 16:00:00.000',
            address: {
              street: 'Späthstraße 80-81',
              zip_code: '12437',
              city: 'Berlin',
            },
            service_time: 30,
            location: {
              id: 'Späthstraße 80-81-12437-Berlin',
              lat: 52.4529029,
              lng: 13.4718397,
            },
            number_of_workers: 1,
            travel_time_to_next_min: 20,
            travel_distance_to_next_km: 12.95,
          },
          {
            appointment_start: '2025-04-29 15:00:00.000',
            appointment_end: '2025-04-29 16:30:00.000',
            address: {
              street: 'Bamberger Str. 49',
              zip_code: '10779',
              city: 'Berlin',
            },
            service_time: 30,
            location: {
              id: 'Bamberger Str. 49-10779-Berlin',
              lat: 52.49406949999999,
              lng: 13.3375464,
            },
            number_of_workers: 1,
            travel_time_to_next_min: 21,
            travel_distance_to_next_km: 7.29,
          },
          {
            appointment_start: '2025-04-29 00:00:00.000',
            appointment_end: '2025-04-29 23:59:00.000',
            address: {
              street: 'Görlitzer Str. 3',
              zip_code: '10997',
              city: 'Berlin',
            },
            service_time: 0,
            location: {
              id: 'Görlitzer Str. 3-10997-Berlin',
              lat: 52.49812439999999,
              lng: 13.4345773,
            },
            number_of_workers: 0,
            travel_time_to_next_min: null,
            travel_distance_to_next_km: null,
          },
        ],
        route_metrics: {
          route_id: 1,
          vehicle_id: 1,
          num_appointments: 8,
          total_travel_time_min: 132,
          total_travel_distance_km: 63.92,
          total_service_time_min: 210,
          total_idle_time_min: 810,
        },
      },
      {
        route_id: 2,
        vehicle_id: 2,
        distance_traveled: 49665.0,
        time_traveled: 274.0,
        appointments: [
          {
            appointment_start: '2025-04-29 00:00:00.000',
            appointment_end: '2025-04-29 23:59:00.000',
            address: {
              street: 'Görlitzer Str. 3',
              zip_code: '10997',
              city: 'Berlin',
            },
            service_time: 0,
            location: {
              id: 'Görlitzer Str. 3-10997-Berlin',
              lat: 52.49812439999999,
              lng: 13.4345773,
            },
            number_of_workers: 0,
            travel_time_to_next_min: 25,
            travel_distance_to_next_km: 8.89,
          },
          {
            appointment_start: '2025-04-29 09:00:00.000',
            appointment_end: '2025-04-29 11:00:00.000',
            address: {
              street: 'Delbrückstraße 37',
              zip_code: '14193',
              city: 'Berlin',
            },
            service_time: 60,
            location: {
              id: 'Delbrückstraße 37-14193-Berlin',
              lat: 52.5031112,
              lng: 13.3217026,
            },
            number_of_workers: 1,
            travel_time_to_next_min: 27,
            travel_distance_to_next_km: 11.26,
          },
          {
            appointment_start: '2025-04-29 13:00:00.000',
            appointment_end: '2025-04-29 14:30:00.000',
            address: {
              street: 'Richard-Sorge-Straße 21',
              zip_code: '10249',
              city: 'Berlin',
            },
            service_time: 30,
            location: {
              id: 'Richard-Sorge-Straße 21-10249-Berlin',
              lat: 52.5200219,
              lng: 13.4478154,
            },
            number_of_workers: 1,
            travel_time_to_next_min: 29,
            travel_distance_to_next_km: 11.14,
          },
          {
            appointment_start: '2025-04-29 12:00:00.000',
            appointment_end: '2025-04-29 14:30:00.000',
            address: {
              street: 'Hauptstraße 9',
              zip_code: '13158',
              city: 'Berlin',
            },
            service_time: 30,
            location: {
              id: 'Hauptstraße 9-13158-Berlin',
              lat: 52.585242,
              lng: 13.3668631,
            },
            number_of_workers: 1,
            travel_time_to_next_min: 6,
            travel_distance_to_next_km: 2.78,
          },
          {
            appointment_start: '2025-04-29 15:00:00.000',
            appointment_end: '2025-04-29 16:30:00.000',
            address: {
              street: 'Schönhauser Str. 41',
              zip_code: '13158',
              city: 'Berlin',
            },
            service_time: 30,
            location: {
              id: 'Schönhauser Str. 41-13158-Berlin',
              lat: 52.5914026,
              lng: 13.3993389,
            },
            number_of_workers: 1,
            travel_time_to_next_min: 37,
            travel_distance_to_next_km: 15.6,
          },
          {
            appointment_start: '2025-04-29 00:00:00.000',
            appointment_end: '2025-04-29 23:59:00.000',
            address: {
              street: 'Görlitzer Str. 3',
              zip_code: '10997',
              city: 'Berlin',
            },
            service_time: 0,
            location: {
              id: 'Görlitzer Str. 3-10997-Berlin',
              lat: 52.49812439999999,
              lng: 13.4345773,
            },
            number_of_workers: 0,
            travel_time_to_next_min: null,
            travel_distance_to_next_km: null,
          },
        ],
        route_metrics: {
          route_id: 2,
          vehicle_id: 2,
          num_appointments: 6,
          total_travel_time_min: 124,
          total_travel_distance_km: 49.66,
          total_service_time_min: 150,
          total_idle_time_min: 870,
        },
      },
      {
        route_id: 3,
        vehicle_id: 3,
        distance_traveled: 29561.0,
        time_traveled: 166.0,
        appointments: [
          {
            appointment_start: '2025-04-29 00:00:00.000',
            appointment_end: '2025-04-29 23:59:00.000',
            address: {
              street: 'Görlitzer Str. 3',
              zip_code: '10997',
              city: 'Berlin',
            },
            service_time: 0,
            location: {
              id: 'Görlitzer Str. 3-10997-Berlin',
              lat: 52.49812439999999,
              lng: 13.4345773,
            },
            number_of_workers: 0,
            travel_time_to_next_min: 34,
            travel_distance_to_next_km: 13.16,
          },
          {
            appointment_start: '2025-04-29 09:00:00.000',
            appointment_end: '2025-04-29 11:00:00.000',
            address: {
              street: 'Spandauer Damm 157',
              zip_code: '14050',
              city: 'Berlin',
            },
            service_time: 60,
            location: {
              id: 'Spandauer Damm 157-14050-Berlin',
              lat: 52.5195218,
              lng: 13.2707295,
            },
            number_of_workers: 1,
            travel_time_to_next_min: 31,
            travel_distance_to_next_km: 12.65,
          },
          {
            appointment_start: '2025-04-29 15:00:00.000',
            appointment_end: '2025-04-29 16:30:00.000',
            address: {
              street: 'Strausberger Str. 46',
              zip_code: '10243',
              city: 'Berlin',
            },
            service_time: 30,
            location: {
              id: 'Strausberger Str. 46-10243-Berlin',
              lat: 52.5218544,
              lng: 13.4327016,
            },
            number_of_workers: 1,
            travel_time_to_next_min: 11,
            travel_distance_to_next_km: 3.75,
          },
          {
            appointment_start: '2025-04-29 00:00:00.000',
            appointment_end: '2025-04-29 23:59:00.000',
            address: {
              street: 'Görlitzer Str. 3',
              zip_code: '10997',
              city: 'Berlin',
            },
            service_time: 0,
            location: {
              id: 'Görlitzer Str. 3-10997-Berlin',
              lat: 52.49812439999999,
              lng: 13.4345773,
            },
            number_of_workers: 0,
            travel_time_to_next_min: null,
            travel_distance_to_next_km: null,
          },
        ],
        route_metrics: {
          route_id: 3,
          vehicle_id: 3,
          num_appointments: 4,
          total_travel_time_min: 76,
          total_travel_distance_km: 29.56,
          total_service_time_min: 90,
          total_idle_time_min: 840,
        },
      },
    ],
    method_used: 'Path Cheapest Arc',
    problem_metrics: [
      {
        name: 'total_appointment_time',
        value: 1800,
      },
      {
        name: 'total_service_time',
        value: 600,
      },
      {
        name: 'average_appointment_distance(time)',
        value: 22,
      },
      {
        name: 'max_appointment_distance(time)',
        value: 44,
      },
      {
        name: 'max_overlap',
        value: 6,
      },
      {
        name: 'max_overlap_with_endtime_shifted_by_avg_traveltime',
        value: 7,
      },
      {
        name: 'Max overlap with endtime shifted by median travel time: 7',
        value: 7,
      },
      {
        name: 'Max overlap with endtime shifted by bottom25 quantile travel time: 7',
        value: 7,
      },
      {
        name: 'Max overlap with endtime shifted by bottom10 quantile travel time: 7',
        value: 7,
      },
    ],
    validation_report: {
      is_valid: true,
      errors: [],
      missing_appointments: [],
      duplicate_appointments: [],
      route_level_errors: [],
    },
  };

  const solution: Solution = staticResponse as Solution;

  // useEffect(() => {
  //   if (!solution) {
  //     navigate({ to: '/scenarios' });
  //   }
  // }, [solution, navigate]);

  console.log('DailyPlan solution', solution);

  const formatDateString = (raw: string): string => {
    const clean = raw.replace(/"/g, '').trim();
    const num = Number(clean);
    if (isNaN(num)) return 'Invalid Date';

    return new Date(num).toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div className="container mt-8">
      <h2 className="text-xl text-center font-semibold text-primary my-5">
        Daily Plan for {formatDateString(date)}
      </h2>
      <div className="flex flex-wrap gap-3 my-5 w-full justify-center items-center">
        <Button>View Metrics & Errors</Button>
        <Button>Download Day Plan</Button>
      </div>
      {solution.routes.map((route, idx) => (
        <RouteCard
          key={route.route_id}
          route={route}
          color={getRouteColor(idx)}
        />
      ))}
    </div>
  );
}
