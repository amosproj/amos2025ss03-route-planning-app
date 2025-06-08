import { createFileRoute, useSearch, useNavigate } from '@tanstack/react-router'
import apiClient from '../../utils/apiClient';

import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { addSolution } from '../../store/solutionsSlice';
import { setEnrichedAppointments } from '../../store/enrichedAppointmentsSlice';

import dayjs from 'dayjs'
import { useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/week-view2/')({
  component: WeekViewPage2,
  validateSearch: (search) => {
    const year = parseInt(search.year as string) || dayjs().year()
    const week = parseInt(search.week as string) || getWeekStartingSunday(dayjs()).week
    return { year, week }
  },
})

function getWeekStartingSunday(date: dayjs.Dayjs) {
  const yearStart = dayjs(`${date.year()}-01-01`)
  const daysSinceSunday = yearStart.day() // Sunday = 0
  const firstSunday = yearStart.subtract(daysSinceSunday, 'day')
  const diffInDays = date.startOf('day').diff(firstSunday, 'day')
  const week = Math.floor(diffInDays / 7) + 1
  return { year: date.year(), week }
}

function getStartOfWeek(year: number, week: number) {
  const yearStart = dayjs(`${year}-01-01`)
  const daysSinceSunday = yearStart.day() // Sunday = 0
  const firstSunday = yearStart.subtract(daysSinceSunday, 'day')
  return firstSunday.add(week - 1, 'week')
}

function WeekViewPage2() {
  const { year, week } = useSearch({ from: '/week-view/' })
  const startOfWeek = useMemo(() => getStartOfWeek(year, week), [year, week])
  const weekDates = Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'))
  const weekRangeText = `${weekDates[0].format('MMM D')} – ${weekDates[6].format('D, YYYY')}`

  const handleWeekChange = (newWeek: number, newYear = year) => {
    navigate({ search: { week: newWeek, year: newYear } })
  }

  const navigate = useNavigate()

  const scenarios = useSelector((s: RootState) => s.scenarios.scenarios);
  const solutions = useSelector((state: RootState) => state.solutions.byDate);
  const sortedScenarios = useMemo(() => {
    return [...scenarios]
      .map((item) => ({
        ...item,
        solution: !!solutions[`"${item.date}"`],
      }))
      .sort((a, b) => a.date - b.date);
  }, [scenarios, solutions]);

  const dispatch = useDispatch<AppDispatch>();
  const enrichedByDate = useSelector((state: RootState) => state.enrichedAppointments);
  const solutionByDate = useSelector((state: RootState) => state.solutions.byDate);

  // Map dates to scenarios
  const scenariosByDate = useMemo(
    () =>
      new Map(
        sortedScenarios.map((sc) => [new Date(sc.date).toDateString(), { ...sc, date: sc.date.toString() }]),
      ),
    [sortedScenarios]
  );


  const filteredScenarios = useMemo(() => {
    return weekDates.map(date => {
      const dateKey = date.toDate().toDateString()
      return scenariosByDate.get(dateKey) || null
    }).filter(sc => sc !== null)
  }, [weekDates, scenariosByDate])


  const companyInfo = useSelector(
    (s: RootState) => Object.values(s.companyInfo)[0],
  );

  const handleEnrichAppointments = async () => {
    for (const scenario of filteredScenarios) {
      const date = `"${scenario.date}"`;

      // Skip if already in Redux
      if (enrichedByDate[date]) continue;

      const payload = scenario.jobs.map((job) => ({
        address: job.address,
        number_of_workers: job.number_of_workers,
        service_time: 30,
        appointment_start: new Date(job.appointment_start).toISOString(),
        appointment_end: new Date(job.appointment_end).toISOString(),
      }));

      try {
        const res = await apiClient.post('/api/appointments', payload);
        const data = res.data;

        dispatch(setEnrichedAppointments({ date, address_responses: data.address_responses }));
      } catch (err) {
        console.error('Error enriching', date, err);
      }
    }
  };

  function allLocationsFullyFound(locations: { could_be_fully_found: boolean }[]): boolean {
    return locations.every(location => location.could_be_fully_found);
  }

  const handleOptimization = async () => {
    for (const scenario of filteredScenarios) {
      const date = `"${scenario.date}"`;

      // Skip if already optimized
      if (solutionByDate[date]) continue;

      if (
        !allLocationsFullyFound(enrichedByDate[date])
      ) continue;

      const appointments = scenario.jobs.map((job) => ({
        address: job.address,
        number_of_workers: job.number_of_workers,
        service_time: 15,
        appointment_start: new Date(job.appointment_start)
          .toISOString()
          .replace('T', ' ')
          .split('.')[0]
          .concat('.000'),
        appointment_end: new Date(job.appointment_end)
          .toISOString()
          .replace('T', ' ')
          .split('.')[0]
          .concat('.000'),
      }));

      const companyPayload = {
        start_address: companyInfo.start_address,
        finish_address: companyInfo.finish_address,
        number_of_workers: companyInfo.vehicles.map((v) => ({
          vehicle_id: v.vehicle_id,
          skills: v.skills,
          worker_amount: v.worker_amount,
        })),
      };

      try {
        const res = await apiClient.post('/api/check-and-solve', {
          company_info: companyPayload,
          appointments,
        });
        const data = res.data;

        dispatch(addSolution({ date, solution: data }));
      } catch (err) {
        console.error('Error solving', date, err);
      }
    }
  };


  return (
    <div className="p-4 space-y-4 max-w-xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        {/* Prev / Next */}
        <div className="flex gap-2">
          <button
            className="px-3 py-1.5 rounded-md border hover:bg-gray-100  text-black"
            onClick={() => handleWeekChange(week - 1)}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            className="px-3 py-1.5 rounded-md border hover:bg-gray-100  text-black"
            onClick={() => handleWeekChange(week + 1)}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Week Range Display */}
        <div className="text-lg font-semibold text-center">
          {weekRangeText}
        </div>

        {/* Week/Year Dropdowns */}
        <div className="flex gap-2">
          <select
            className="border rounded px-2 py-1"
            value={week}
            onChange={(e) => handleWeekChange(parseInt(e.target.value))}
          >
            {Array.from({ length: 53 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                Week {i + 1}
              </option>
            ))}
          </select>
          <select
            className="border rounded px-2 py-1"
            value={year}
            onChange={(e) => handleWeekChange(week, parseInt(e.target.value))}
          >
            {Array.from({ length: 5 }, (_, i) => {
              const y = dayjs().year() - 2 + i
              return <option key={y} value={y}>{y}</option>
            })}
          </select>
        </div>
      </div>

      <div className='flex justify-end items-center gap-3'>
        <Button
          onClick={handleEnrichAppointments}
        >
          Verify Appointments
        </Button>

        <Button
          onClick={handleOptimization}
        >
          Start Optimization
        </Button>
      </div>

      {/* Vertical Days List */}
      <div className="flex flex-col gap-3">
        {weekDates.map((date) => {
          const dateKey = date.toDate().toDateString();
          const sc = scenariosByDate.get(dateKey);

          return (
            <div
              key={date.toISOString()}
              className="border rounded p-3 shadow-sm"
            >
              <div className="text-lg font-semibold">{date.format('dddd')}</div>
              <div className="text-sm text-gray-600">{date.format('MMM D, YYYY')}</div>
              {sc && <div>
                Jobs: {sc.jobs.length}
                <br />
                Enriched: {enrichedByDate[`"${sc.date}"`] ? '✓' : 'Not enriched'}
                <br />
                Solution: {solutionByDate[`"${sc.date}"`] ? 'Success' : 'No solution yet'}
              </div>}
              <div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  )
}