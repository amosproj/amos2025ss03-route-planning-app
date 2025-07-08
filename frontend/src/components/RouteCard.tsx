import { Button } from '@/components/ui/button';
import { Download, Car, Users2, Wrench, Clock3, MapPin, Timer, Navigation } from 'lucide-react';
import { Route } from '@/types/Solution';
import { minutesToTime } from '@/utils/helper';

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
          const isDepot = appointment?.appointment_type === 'DEPOT';
          return (
            <li key={idx} className="relative pl-6 pb-6 pt-2 ">
              {/* Bullet */}
              <span
                className={`absolute left-0 top-1.5 block h-3 w-3 rounded-full z-10 ${isDepot ? 'ring-2 ring-gray-400' : ''}`}
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
                className={`text-sm border p-4 rounded-lg shadow-sm ${isDepot ? 'bg-gray-50' : 'bg-white'}`}
                style={{ borderColor: color }}
              >
                {/* Address Header */}
                <div
                  className="flex text-base font-medium items-center mb-3"
                  style={{ color: color }}
                >
                  <MapPin className="w-4 h-4" />
                  <span className="ml-2">
                    {isDepot && '🏢 '}
                    {appointment?.address.street},{' '}
                    {appointment?.address.zip_code} {appointment?.address.city}
                  </span>
                </div>

                {/* Timing Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  {/* Scheduled Time */}
                  <div className="bg-gray-50 p-2 rounded-md">
                    <div className="text-xs text-gray-600 font-medium mb-1">
                      {isDepot ? '🏢 Depot Hours' : '📅 Scheduled Time'}
                    </div>
                    <div className="text-sm font-semibold text-gray-800">
                      {new Date(appointment?.appointment_start).toLocaleTimeString(
                        [],
                        {
                          hour: '2-digit',
                          minute: '2-digit',
                        },
                      )}{' '}
                      -{' '}
                      {new Date(appointment?.appointment_end).toLocaleTimeString(
                        [],
                        {
                          hour: '2-digit',
                          minute: '2-digit',
                        },
                      )}
                    </div>
                  </div>

                  {/* Actual Time */}
                  {appointment?.arrival_time !== undefined && !isDepot && (
                    <div 
                      className="p-2 rounded-md"
                      style={{ backgroundColor: `${color}15` }}
                    >
                      <div className="text-xs font-medium mb-1" style={{ color: color }}>
                        🚛 Actual Arrival & Departure
                      </div>
                      <div className="text-sm font-semibold" style={{ color: color }}>
                        {minutesToTime(appointment.arrival_time)} - {minutesToTime(appointment.arrival_time + appointment.service_time)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Service Details */}
                {!isDepot && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-600">
                    <div className="flex items-center">
                      <Clock3 className="w-3 h-3 mr-1" />
                      <span>Service: {appointment?.service_time} mins</span>
                    </div>
                    
                    <div className="flex items-center">
                      <Users2 className="w-3 h-3 mr-1" />
                      <span>Workers: {appointment?.number_of_workers}</span>
                    </div>

                    <div className="flex items-center">
                      <Wrench className="w-3 h-3 mr-1" />
                      <span>Skills: Technician</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Travel + Wait Info */}
              {next && (
                <div 
                  className="ml-1 mt-2 p-2 rounded-md bg-blue-50 border-l-2 border-blue-300"
                >
                  <div className="flex items-center gap-4 text-sm text-blue-700">
                    <div className="flex items-center">
                      <Timer className="w-4 h-4 mr-1" />
                      <span className="font-medium">Travel to next: {appointment?.travel_time_to_next_min} min</span>
                    </div>
                    <div className="flex items-center">
                      <Navigation className="w-4 h-4 mr-1" />
                      <span className="font-medium">Distance: {appointment?.travel_distance_to_next_km} km</span>
                    </div>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
