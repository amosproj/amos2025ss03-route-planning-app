import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import { RootState } from '@/store';
import { Solution } from '@/types/Solution';
import { RouteCard } from '@/components/RouteCard';
import { getRouteColor } from '@/utils/routeColors';
import { Button } from '@/components/ui/button';
import { Download, Map, AlertTriangle } from 'lucide-react';
import ValidationReportDialog from '@/components/ValidationReportDialog';
import { useState } from 'react';
import { BackButton } from '@/components/BackButton';

export const Route = createFileRoute('/daily-plan/')({
  component: DailyPlan,
});

function DailyPlan() {
  const searchParams = new URLSearchParams(window.location.search);
  const date = searchParams.get('date') || '';
  const navigate = useNavigate();
  const solutions = useSelector((state: RootState) => state.solutions);
  const solution: Solution = solutions.byDate[date];
  const [showValidationReport, setShowValidationReport] = useState(false);

  useEffect(() => {
    if (!solution) {
      navigate({ to: '/scenarios' });
    }
  }, [solution, navigate]);

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

  const downloadRoute = (routeId: number) => {
    const route = solution.routes.find((r) => r.route_id === routeId);
    if (!route) return;
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(route));
    const a = document.createElement('a');
    a.href = dataStr;
    // create name using route_id with date
    a.download = `route-${route.route_id}-${formatDateString(date)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="max-w-6xl mx-auto my-6 bg-white rounded-lg border shadow p-4">
      <div className="flex flex-wrap gap-3 w-full justify-between items-center">
        <h2 className="text-xl text-center text-blue-900 font-semibold my-5">
          <div className="flex items-center ">
            <BackButton />
            <span className='pl-4'>Daily Plan for {formatDateString(date)}</span>
          </div>{' '}
        </h2>

        <div className="flex gap-3">
          {!solution?.validation_report?.is_valid && (
            <Button
              size="lg"
              variant="outline"
              className="bg-red-100 text-red-900 font-semibold px-4 py-1.5 rounded-sm text-sm shadow-sm hover:bg-red-200 hover:text-red-900 hover:border-red-300"
              onClick={() => setShowValidationReport(true)}
            >
              <AlertTriangle /> Validation Report
            </Button>
          )}
          <Button
            variant="outline"
            className="bg-orange-100 text-orange-900 font-semibold px-4 py-1.5 rounded-sm text-sm shadow-sm hover:bg-orange-200 hover:text-orange-900 hover:border-orange-300"
            onClick={() =>
              navigate({
                to: `/map-view?date=${date}`,
              })
            }
          >
            <Map /> Show Map View
          </Button>
          <Button
            variant="outline"
            onClick={downloadSolution}
            className="bg-indigo-100 text-blue-900 font-semibold px-4 py-1.5 rounded-sm text-sm shadow-sm hover:bg-indigo-200 hover:text-blue-900 hover:border-indigo-300"
          >
            <Download /> Download Day Plan
          </Button>
        </div>
      </div>
      {solution.routes
        .filter((route) => route.appointments.length > 2)
        .map((route, idx) => (
          <RouteCard
            key={route.route_id}
            route={route}
            download={() => downloadRoute(route.route_id)}
            color={getRouteColor(idx)}
          />
        ))}

      {/* Validation report dialog */}
      <ValidationReportDialog
        open={showValidationReport}
        report={solution.validation_report}
        onClose={() => setShowValidationReport(false)}
      />
    </div>
  );
}
