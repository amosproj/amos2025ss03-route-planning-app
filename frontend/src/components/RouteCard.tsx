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
  // Calculate buffer time statistics for the route (slack time between appointments)
  const bufferStats = route.appointments.reduce(
    (stats, appointment, idx) => {
      const nextAppointment = route.appointments[idx + 1];
      if (appointment?.arrival_time !== undefined && 
          appointment?.appointment_type !== 'DEPOT' &&
          nextAppointment && 
          nextAppointment?.arrival_time !== undefined &&
          nextAppointment?.appointment_type !== 'DEPOT' &&
          appointment?.travel_time_to_next_min !== undefined) {
        
        // Calculate when current appointment finishes
        const currentFinishTime = appointment.arrival_time + appointment.service_time;
        
        // Calculate when we're scheduled to arrive at next appointment (finish + travel)
        const scheduledNextArrival = currentFinishTime + appointment.travel_time_to_next_min;
        
        // When we actually arrive at next appointment
        const actualNextArrival = nextAppointment.arrival_time;
        
        // Buffer time is the difference between actual and scheduled arrival
        const bufferTime = actualNextArrival - scheduledNextArrival;
        
        if (bufferTime > 0) {
          stats.total += bufferTime;
          stats.count++;
          if (bufferTime > 10) stats.early++;
          else stats.onTime++;
        } else if (bufferTime < 0) {
          stats.total += Math.abs(bufferTime);
          stats.count++;
          stats.late++;
        }
      }
      return stats;
    },
    { total: 0, count: 0, early: 0, late: 0, onTime: 0 }
  );
  
  const avgBuffer = bufferStats.count > 0 ? Math.round(bufferStats.total / bufferStats.count) : 0;
  
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
          {/* Buffer Time Summary */}
          {bufferStats.count > 0 && (
            <span className={`text-sm px-3 py-1.5 rounded font-medium ${
              bufferStats.early > bufferStats.late ? 'bg-green-100 text-green-800' :
              bufferStats.late > 0 ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              Slack: {avgBuffer}min avg
            </span>
          )}
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
          
          // Calculate buffer time (slack time between scheduled and actual arrival at next appointment)
          let bufferTimeMinutes = null;
          let bufferType = null; // 'buffer', 'tight', or 'rushed'
          
          if (appointment?.arrival_time !== undefined && 
              !isDepot &&
              next && 
              next?.arrival_time !== undefined &&
              next?.appointment_type !== 'DEPOT' &&
              appointment?.travel_time_to_next_min !== undefined) {
            
            // When current appointment finishes
            const currentFinishTime = appointment.arrival_time + appointment.service_time;
            
            // When we're scheduled to arrive at next appointment (finish + travel)
            const scheduledNextArrival = currentFinishTime + appointment.travel_time_to_next_min;
            
            // When we actually arrive at next appointment
            const actualNextArrival = next.arrival_time;
            
            // Buffer time is the difference (positive = waiting time, negative = behind schedule)
            bufferTimeMinutes = actualNextArrival - scheduledNextArrival;
            
            if (bufferTimeMinutes > 10) {
              bufferType = 'buffer';
            } else if (bufferTimeMinutes >= 0) {
              bufferType = 'tight';
            } else {
              bufferType = 'rushed';
            }
          }
          
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
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

                  {/* Buffer/Slack Time */}
                  {bufferTimeMinutes !== null && next && next?.appointment_type !== 'DEPOT' && (
                    <div className={`p-2 rounded-md ${
                      bufferType === 'buffer' ? 'bg-green-50 border border-green-200' :
                      bufferType === 'tight' ? 'bg-yellow-50 border border-yellow-200' :
                      'bg-red-50 border border-red-200'
                    }`}>
                      <div className={`text-xs font-medium mb-1 ${
                        bufferType === 'buffer' ? 'text-green-700' :
                        bufferType === 'tight' ? 'text-yellow-700' :
                        'text-red-700'
                      }`}>
                        {bufferType === 'buffer' ? '⏱️ Buffer Time' :
                         bufferType === 'tight' ? '🎯 Tight Schedule' :
                         '🚨 Time Conflict'}
                      </div>
                      <div className={`text-sm font-semibold ${
                        bufferType === 'buffer' ? 'text-green-800' :
                        bufferType === 'tight' ? 'text-yellow-800' :
                        'text-red-800'
                      }`}>
                        {bufferType === 'buffer' ? `${bufferTimeMinutes} min waiting` :
                         bufferType === 'tight' ? `${bufferTimeMinutes} min slack` :
                         `${Math.abs(bufferTimeMinutes)} min behind`}
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
