import { Calendar } from '@/components/Calendar'
import { createFileRoute } from '@tanstack/react-router'
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useMemo, useState } from 'react';
import { Appointment } from '../../types/Appointment';
import { Scenario } from '../../types/Scenario';
import { useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/calender-test/')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate();
  const scenarios = useSelector((s: RootState) => s.scenarios.scenarios);
  const solutions = useSelector((state: RootState) => state.solutions.byDate);

  // const sorted = [...scenarios].sort((a, b) => a.date - b.date);
  const sorted = useMemo(() => {
    return [...scenarios]
      .map((item) => ({
        ...item,
        solution: !!solutions[`"${item.date}"`],
      }))
      .sort((a, b) => a.date - b.date);
  }, [scenarios, solutions]);

  // Map dates to scenarios
  const dateMap = new Map(
    sorted.map((sc) => [new Date(sc.date).toDateString(), sc]),
  );

  return <div className="p-4">
    <h1 className="text-2xl font-bold mb-4">Calendar Test</h1>
    <Calendar dateMap={dateMap} />
  </div>
}
