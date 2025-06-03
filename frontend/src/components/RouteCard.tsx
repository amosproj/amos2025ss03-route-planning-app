import { Button } from '@/components/ui/button';

export function RouteCard({ route, color }) {
  return (
    <div
      className="mb-6 border-l-4 pl-4 rounded-md"
      style={{ borderLeftColor: color }}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xl font-bold">Vehicle {route.route_id + 1}</h3>
        <div className="flex gap-2 items-center">
          <span className="text-sm bg-gray-200 px-2 py-1 rounded">
            Travel: 123 mins
          </span>
          <span className="text-sm bg-gray-200 px-2 py-1 rounded">
            Service: 45 mins
          </span>
          <span className="text-sm bg-gray-200 px-2 py-1 rounded">
            Waiting: 30 mins
          </span>
          <Button size="sm">Download</Button>
        </div>
      </div>

      <ol className="pl-2">
        {route.appointments.map((appt, idx) => {
          const next = route.appointments[idx + 1];
          return (
            <li key={idx} className="relative pl-6 pb-6">
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
              <div className="text-sm">
                <div className="text-xs text-gray-500">
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
                <div>
                  {appt.address.street}, {appt.address.zip_code}{' '}
                  {appt.address.city}
                </div>
                <div className="text-xs text-gray-500 italic">
                  Service time: {appt.service_time} mins
                </div>
              </div>

              {/* Travel + Wait Info */}
              {next && (
                <div className="ml-1 mt-1 text-xs text-gray-500 italic">
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
