import { createFileRoute } from '@tanstack/react-router';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useState } from 'react';
import { Job } from '../../types/Job';
import { Scenario } from '../../types/Scenario';
import { Button } from '@/components/ui/button';
import { MapPin, Truck, ArrowRight, X } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/scenarios/')({
  component: ScenarioList,
});

function ScenarioList() {
  const [selected, setSelected] = useState<Scenario | null>(null);
  const navigate = useNavigate();
  const scenarios = useSelector((s: RootState) => s.scenarios.scenarios);
  const sorted = [...scenarios].sort((a, b) => a.date - b.date);

  // Map dates to scenarios
  const dateMap = new Map(
    sorted.map((sc) => [new Date(sc.date).toDateString(), sc]),
  );

  // Determine date range start (Monday) and end
  const minDate = new Date(Math.min(...sorted.map((sc) => sc.date)));
  const maxDate = new Date(Math.max(...sorted.map((sc) => sc.date)));
  const start = new Date(minDate);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));

  // Build weeks
  const weeks: Date[][] = [];
  const current = new Date(start);
  while (current <= maxDate) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }

  return (
    <div className="p-4">
      <div className="flex flex-col space-y-2">
        <div className="flex flex-row space-x-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="flex-1">
              <h4 className="text-lg font-semibold text-center">{day}</h4>
            </div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-row space-x-2">
            {week.map((day) => {
              const keyStr = day.toISOString();
              const sc = dateMap.get(day.toDateString());
              return (
                <div
                  key={keyStr}
                  className={`flex-1 border border-gray-200 rounded-md p-2 flex flex-col ${
                    sc ? 'cursor-pointer hover:bg-gray-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-semibold">{day.getDate()}</h4>
                    {sc && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          navigate({
                            to: '/map-view',
                            search: { date: sc.date.toString() },
                          })
                        }
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {sc && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-1 mt-2 rounded bg-primary text-primary-foreground text-xs font-medium"
                      onClick={() => setSelected(sc)}
                    >
                      <MapPin className="h-4 w-4" />
                      {sc.jobs.length} jobs
                    </span>
                  )}
                  {sc && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 mt-1 rounded bg-primary text-primary-foreground text-xs font-medium">
                      <Truck className="h-4 w-4" />
                      {sc.vehicles.length} vehicles
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-4 max-h-full overflow-y-auto w-11/12 max-w-3xl">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xl font-semibold">
                Jobs on {new Date(selected.date).toLocaleDateString()}
              </h4>
              <Button variant="ghost" size="icon" onClick={() => setSelected(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left text-sm font-semibold">Start</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">End</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Address</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Workers</th>
                </tr>
              </thead>
              <tbody>
                {selected.jobs
                  .sort((a: Job, b: Job) => a.start - b.start)
                  .map((job: Job, i: number) => (
                    <tr key={i} className="border-t">
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {new Date(job.start).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {new Date(job.end).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {`${job.street}, ${job.zip} ${job.city}`}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">{job.workers}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
