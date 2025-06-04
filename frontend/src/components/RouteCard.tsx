import { Button } from '@/components/ui/button';
import { Download, Car, Users2, Wrench, Clock3, MapPin } from 'lucide-react';
import { Route } from '@/types/Solution';

interface RouteCardProps {
  route: Route;
  color: string;
  download: () => void;
}
export function RouteCard({ route, color, download }: RouteCardProps) {
  return (
    <div className="mb-6 border shadow-md p-6 rounded-md bg-neutral-50/10">
      <div className="flex justify-between items-center mb-2">
        <h3
          className="text-xl font-bold flex justify-between items-center gap-2"
          style={{ color: color }}
        >
          <Car /> Vehicle {route.route_id + 1}
        </h3>

        <div className="flex gap-2 items-center">
          <span
            className="bg-gray-100 border font-medium rounded text-sm px-3 py-1.5 text-center"
            style={{ color: color, borderColor: color }}
          >
            Total Appointments: {route?.appointments?.length}
          </span>
          <span className="text-sm bg-gray-100 px-3 py-1.5 rounded">
            Travel: {route?.route_metrics?.total_travel_distance_km} km
          </span>
          <span className="text-sm bg-gray-100 px-3 py-1.5 rounded">
            Service: {route?.route_metrics?.total_service_time_min} mins
          </span>
          <span className="text-sm bg-gray-100 px-3 py-1.5 rounded">
            Waiting: {route?.route_metrics?.total_idle_time_min} mins
          </span>
          <Button
            size={'sm'}
            className="text-sm px-3 rounded "
            style={{ background: color }}
            onClick={download}
          >
            {' '}
            <Download />
          </Button>
        </div>
      </div>

      <ol className="pl-2 ">
        {route.appointments.map((appointment, idx) => {
          const next = route.appointments[idx + 1];
          return (
            <li key={idx} className="relative pl-6 pb-6 pt-2 ">
              {/* Bullet */}
              <span
                className="absolute left-0 top-1.5 block h-3 w-3 rounded-full z-10"
                style={{ backgroundColor: color }}
              />

              {/* Connector */}
              {next && (
                <span
                  className="absolute left-1.5 top-2 h-full w-px border-l-2 border-dotted"
                  style={{ borderColor: color }}
                />
              )}

              {/* Appointment Details */}
              <div
                className="text-sm border p-3 rounded-sm"
                style={{ borderColor: color }}
              >
                <div className="text-sm text-gray-500 font-semibold">
                  {new Date(appointment?.appointment_start).toLocaleTimeString(
                    [],
                    {
                      hour: '2-digit',
                      minute: '2-digit',
                    },
                  )}{' '}
                  -
                  {new Date(appointment?.appointment_end).toLocaleTimeString(
                    [],
                    {
                      hour: '2-digit',
                      minute: '2-digit',
                    },
                  )}
                </div>

                <div
                  className="flex text-base font-medium items-center mt-1"
                  style={{ color: color }}
                >
                  <MapPin className="w-4 h-4" />
                  <span className="ml-2">
                    {appointment?.address.street},{' '}
                    {appointment?.address.zip_code} {appointment?.address.city}
                  </span>
                </div>

                <div className="flex text-sm text-gray-500 items-center mt-1 italic">
                  <Clock3 className="w-4 h-4" />
                  <span className="ml-2">
                    Service time: {appointment?.service_time} mins
                  </span>
                </div>

                <div className="flex text-sm text-gray-500 items-center mt-1">
                  <Users2 className="w-4 h-4" />
                  <span className="ml-2 text-sm text-gray-500 italic">
                    Required worker: {appointment?.number_of_workers}
                  </span>
                </div>

                <div className="flex text-sm text-gray-500 items-center mt-1">
                  <Wrench className="w-4 h-4" />{' '}
                  <span className="ml-2 text-sm text-gray-500 italic">
                    Required skills: Technician
                  </span>
                </div>
              </div>

              {/* Travel + Wait Info */}
              {next && (
                <div className="ml-1 mt-1 text-sm text-gray-500 italic">
                  ⏱ Travel time to next: {appointment?.travel_time_to_next_min}{' '}
                  • Travel distance: {appointment?.travel_distance_to_next_km}{' '}
                  km
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
