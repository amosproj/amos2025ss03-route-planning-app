import { useSelector } from 'react-redux';
import { getRouteColor } from '@/utils/routeColors';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import type { RootState } from '@/store';

export default function DailyPlan() {
  const date = new Date().toISOString().split('T')[0]; // you can pass this as prop or from route params
  const solution = useSelector(
    (state: RootState) => state.solutions.byDate[date],
  );

  if (!solution) return <div className="p-4">No plan found for {date}</div>;

  const downloadSolution = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(solution));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `solution-${solution.total_distance_traveled}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Daily Plan for {date}</h1>

      {/* Summary Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg shadow-sm">
          <h2 className="text-sm text-gray-500">Total Distance</h2>
          <p className="text-lg font-medium">
            {solution.total_distance_traveled} meters
          </p>
        </div>
        <div className="p-4 border rounded-lg shadow-sm">
          <h2 className="text-sm text-gray-500">Total Routes</h2>
          <p className="text-lg font-medium">{solution.routes.length}</p>
        </div>
        <div className="p-4 border rounded-lg shadow-sm">
          <h2 className="text-sm text-gray-500">Total Appointments</h2>
          <p className="text-lg font-medium">
            {solution.routes.reduce((acc, r) => acc + r.appointments.length, 0)}
          </p>
        </div>
      </div>

      {/* Route Sections */}
      {solution.routes.map((route, idx) => {
        if (route.appointments.length <= 2) return null;
        const color = getRouteColor(idx);
        return (
          <div
            key={route.route_id}
            className="border-l-4 pl-4 rounded-md"
            style={{ borderLeftColor: color }}
          >
            <h2 className="text-xl font-semibold mb-2">
              Vehicle {route.route_id + 1}
            </h2>
            <ul className="space-y-4">
              {route.appointments.map((appt, idx) => {
                const start = new Date(
                  appt.appointment_start,
                ).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const end = new Date(appt.appointment_end).toLocaleTimeString(
                  [],
                  {
                    hour: '2-digit',
                    minute: '2-digit',
                  },
                );

                return (
                  <li
                    key={idx}
                    className="border p-4 rounded-md shadow-sm bg-white"
                  >
                    <p className="text-sm text-gray-500">
                      {start} - {end}
                    </p>
                    <p className="text-base font-medium">
                      {appt.address.street}, {appt.address.zip_code}{' '}
                      {appt.address.city}
                    </p>
                    {appt.service_time != null && (
                      <p className="text-sm text-gray-600">
                        Service Time: {appt.service_time} minutes
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      <Button size="lg" className="w-full" onClick={downloadSolution}>
        <Download className="mr-2" /> Download Full Plan
      </Button>
    </div>
  );
}
