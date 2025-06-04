import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import { RootState } from '@/store';
import { Solution } from '@/types/Solution';
import { RouteCard } from '@/components/RouteCard';
import { getRouteColor } from '@/utils/routeColors';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export const Route = createFileRoute('/daily-plan/')({
  component: DailyPlan,
});

function DailyPlan() {
  const searchParams = new URLSearchParams(window.location.search);
  const date = searchParams.get('date') || '';
  const navigate = useNavigate();
  const solutions = useSelector((state: RootState) => state.solutions);
  const solution: Solution = solutions.byDate[date];

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
    <div className="container my-8">
      <div className="flex flex-wrap gap-3 my-5 w-full justify-between items-center">
        <h2 className="text-xl text-center text-blue-900 font-semibold my-5">
          Daily Plan for {formatDateString(date)}
        </h2>
        <Button
          onClick={downloadSolution}
          className="bg-indigo-100 text-blue-900 font-semibold px-4 py-1.5 rounded-sm text-sm shadow-sm"
        >
          <Download /> Download Day Plan
        </Button>
      </div>
      {solution.routes.map((route, idx) => (
        <RouteCard
          key={route.route_id}
          route={route}
          download={() => downloadRoute(route.route_id)}
          color={getRouteColor(idx)}
        />
      ))}

      <div className="flex justify-end">
        <Button className="bg-orange-100 text-orange-900 font-semibold px-4 py-1.5 rounded-sm text-sm shadow-sm">
          View Metrics & Errors
        </Button>
      </div>
    </div>
  );
}
