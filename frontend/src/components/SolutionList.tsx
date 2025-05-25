import * as React from 'react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import type { Solution } from '@/types/Solution';
import { getRouteColor } from '@/utils/routeColors';
import {Download} from 'lucide-react';

interface SolutionListProps {
  solution: Solution;
}

export default function SolutionList({ solution }: SolutionListProps) {
  const downloadRoute = (route: Solution['routes'][0]) => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(route));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `route-${route.route_id + 1}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
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
  }

  return (
    <Accordion type="single" collapsible className="space-y-2">
      {solution.routes.map((route, idx) => {
        const color = getRouteColor(idx);
        return (
          <AccordionItem
            key={route.route_id}
            value={`route-${route.route_id}`}
            className="border-l-4"
            style={{ borderLeftColor: color }}
          >
            <AccordionTrigger>
              <div className="flex justify-between items-center w-full">
                <span className="font-medium text-xl mx-2">
                  Route {route.route_id + 1}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadRoute(route);
                  }}
                >
                  <Download/>
                </Button>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 ">
              <ul className="relative mx-2 pl-2 pt-4 border-2 rounded-lg border-gray-200 ">
                {(() => {
                  const sorted = route.appointments
                    .slice()
                    .sort(
                      (a, b) =>
                        new Date(a.appointment_start).getTime() -
                        new Date(b.appointment_start).getTime(),
                    );
                  return sorted.map((appt, idx) => {
                    const start = new Date(
                      appt.appointment_start,
                    ).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const end = new Date(
                      appt.appointment_end,
                    ).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const next = sorted[idx + 1];
                    const diffMin = next
                      ? Math.round(
                          (new Date(next.appointment_start).getTime() -
                            new Date(appt.appointment_end).getTime()) /
                            60000,
                        )
                      : null;
                    return (
                      <li key={idx} className="relative  pb-8 pl-6">
                        {/* Bullet */}
                        <span
                          className="absolute left-0 top-1.5 block h-3 w-3 rounded-full opacity-65"
                          style={{ backgroundColor: color }}
                        />
                        {/* Connector */}
                        {next && (
                          <div
                            className="absolute left-1.25 top-6 bottom-0 border-l-2 border-dotted opacity-65"
                            style={{ borderColor: color }}
                          />
                        )}
                        <time className="block mb-1 text-xs text-gray-500">
                          {start} - {end}
                        </time>
                        <p className="text-sm text-gray-700">
                          {appt.address.street}, {appt.address.zip_code}{' '}
                          {appt.address.city}
                        </p>
                        {/* Interval label */}
                        {diffMin != null && (
                          <span style={{color: color}} className="absolute opacity-40 left-3 bottom-0 bg-white italic font-semibold px-1 text-xs text-gray-500 -translate-y-1/2">
                            {diffMin} min
                          </span>
                        )}
                      </li>
                    );
                  });
                })()}
              </ul>
            </AccordionContent>
          </AccordionItem>
        );
      })}
      <Button size='lg' className='w-full' onClick={downloadSolution}>
        <Download/>
      </Button>
    </Accordion>
  );
}
