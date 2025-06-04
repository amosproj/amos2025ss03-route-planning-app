import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export function RouteCard({ route, color }) {
  return (
    <div className="mb-6 border shadow-md p-6 rounded-md bg-neutral-50/10">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xl font-bold" style={{ color: color }}>
          Vehicle {route.route_id + 1}
        </h3>
        <div className="flex gap-2 items-center">
          <span className="text-sm bg-gray-100 px-3 py-1.5 rounded">
            Travel: 123 mins
          </span>
          <span className="text-sm bg-gray-100 px-3 py-1.5 rounded">
            Service: 45 mins
          </span>
          <span className="text-sm bg-gray-100 px-3 py-1.5 rounded">
            Waiting: 30 mins
          </span>
          <Button
            className="text-sm px-3 py-1.5 rounded  "
            style={{ background: color }}
          >
            {' '}
            <Download />
          </Button>
        </div>
      </div>

      <ol className="pl-2 ">
        {route.appointments.map((appt, idx) => {
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
                <div className="text-sm text-gray-500">
                  {new Date(appt.appointment_start).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  -
                  {new Date(appt.appointment_end).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <div className="text-base font-medium">
                  {appt.address.street}, {appt.address.zip_code}{' '}
                  {appt.address.city}
                </div>
                <div className="text-sm text-gray-500 italic">
                  Service time: {appt.service_time} mins
                </div>
              </div>

              {/* Travel + Wait Info */}
              {next && (
                <div className="ml-1 mt-1 text-sm text-gray-500 italic">
                  ⏱ Travel to next: 12 mins • Waiting time: 5 mins
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
