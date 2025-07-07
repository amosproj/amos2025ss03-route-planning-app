import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/store';
import { setRouteVisibility } from '@/store/routeVisibilitySlice';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { Solution } from '@/types/Solution';
import { getRouteColor } from '@/utils/routeColors';
import { Download, NotepadText, AlertTriangle } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import ValidationReportDialog from '@/components/ValidationReportDialog';
import { useState } from 'react';

interface SolutionListProps {
  solution: Solution;
  date: string;
}

export default function SolutionList({ solution, date }: SolutionListProps) {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const visibilityMap = useSelector(
    (state: RootState) => state.routeVisibility.byDate[date] || {},
  );

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
  };

  const routeIds = solution.routes
    .filter((r) => r.appointments.length > 2)
    .map((r) => r.route_id);
  const masterChecked =
    routeIds.length > 0 && routeIds.every((id) => visibilityMap[id] ?? true);
  const toggleAll = (checked: boolean) => {
    routeIds.forEach((routeId) =>
      dispatch(setRouteVisibility({ date, routeId, isVisible: checked })),
    );
  };

  const [showValidationReport, setShowValidationReport] = useState(false);

  return (
    <Accordion type="single" collapsible className="space-y-2">
      {/* Master toggle to show/hide all routes */}
      <div className="flex justify-between items-center px-4 pt-2 border-b-2">
        <span className="text-xl font-semibold mr-2">Routes</span>
        <Switch
          checked={masterChecked}
          onClick={(e) => e.stopPropagation()}
          onCheckedChange={(checked) => toggleAll(checked)}
          className="mr-4"
        >
          Show All
        </Switch>
      </div>
      {solution.routes.map((route, idx) => {
        if (route.appointments.length <= 2) return null; // skip routes with less than 2 appointments
        const color = getRouteColor(idx);
        const isVisible = visibilityMap[route.route_id] ?? true;
        return (
          <AccordionItem
            key={route.route_id}
            value={`route-${route.route_id}`}
            className="border-l-4 relative py-0.5"
            style={{ borderLeftColor: color }}
          >
            <div className="absolute top-2 right-8 flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  downloadRoute(route);
                }}
              >
                <Download />
              </Button>
              <Switch
                checked={isVisible}
                onClick={(e) => e.stopPropagation()}
                onCheckedChange={(checked) =>
                  dispatch(
                    setRouteVisibility({
                      date,
                      routeId: route.route_id,
                      isVisible: checked,
                    }),
                  )
                }
                className="ml-2"
              >
                Show
              </Switch>
            </div>
            <AccordionTrigger>
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center">
                  <span className="font-medium text-xl mx-2">
                    Vehicle {route.route_id + 1}
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 ">
              <ul className="relative mx-2 pl-2 pt-4 border-2 rounded-lg border-gray-200 ">
                {(() => {
                  return route.appointments.map((appt, idx) => {
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
                    const next = route.appointments[idx + 1];
                    // const diffMin = next
                    //   ? Math.round(
                    //       (new Date(next.appointment_start).getTime() -
                    //         new Date(appt.appointment_end).getTime()) /
                    //         60000,
                    //     )
                    //   : null;
                    return (
                      <li key={idx} className="relative  pb-4 pl-6">
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
                        <p className=" flex text-sm text-gray-700">
                          {appt.address.street}, {appt.address.zip_code}{' '}
                          {appt.address.city}
                        </p>

                        {/* Interval label */}
                        {/* {diffMin != null && (
                          <span
                            style={{ color: color }}
                            className="absolute opacity-40 left-3 bottom-0 bg-white italic font-semibold px-1 text-xs text-gray-500 -translate-y-1/2"
                          >
                            {diffMin} min
                          </span>
                        )} */}
                      </li>
                    );
                  });
                })()}
              </ul>
            </AccordionContent>
          </AccordionItem>
        );
      })}

      {!solution?.validation_report?.is_valid && (
        <Button
          size="lg"
          variant="outline"
          className="w-full bg-red-100 text-red-900 font-semibold px-4 py-1.5 rounded-sm text-sm shadow-sm hover:bg-red-200 hover:text-red-900 hover:border-red-300"
          onClick={() => setShowValidationReport(true)}
        >
          <AlertTriangle /> Validation Report
        </Button>
      )}

      <Button
        size="lg"
        variant="outline"
        className="w-full bg-indigo-100 text-blue-900 font-semibold px-4 py-1.5 rounded-sm text-sm shadow-sm hover:bg-indigo-200 hover:text-blue-900 hover:border-blue-300"
        onClick={downloadSolution}
      >
        <Download /> Download Solution
      </Button>

      <Button
        size="lg"
        variant="outline"
        className="w-full  bg-orange-100 text-orange-900 font-semibold px-4 py-1.5 rounded-sm text-sm shadow-sm hover:bg-orange-200 hover:text-orange-900 hover:border-orange-300"
        onClick={() =>
          navigate({
            to: `/daily-plan?date=${date}`,
          })
        }
      >
        <NotepadText /> Show Daily Plan
      </Button>

      {/* Validation report dialog */}
      <ValidationReportDialog
        open={showValidationReport}
        report={solution.validation_report}
        onClose={() => setShowValidationReport(false)}
      />
    </Accordion>
  );
}
