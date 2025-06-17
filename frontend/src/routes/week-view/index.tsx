import {
  createFileRoute,
  useSearch,
  useNavigate,
} from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../utils/apiClient';

import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { addSolution } from '../../store/solutionsSlice';
import { setEnrichedAppointments } from '../../store/enrichedAppointmentsSlice';

import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleDot,
  CircleX,
  Loader2,
  Map,
  MapPin,
  CalendarClock,
  User,
  Waypoints,
  Clock,
  Clock1,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScenarioDateString } from '@/types/Scenario';
import { Progress } from '@/components/ui/progress';
import { ProgressAnimation } from '@/components/ui/progressAnimation';


export const Route = createFileRoute('/week-view/')({
  component: WeekViewPage,
  validateSearch: (search) => {
    const year = parseInt(search.year as string) || dayjs().year();
    const week =
      parseInt(search.week as string) || getWeekStartingSunday(dayjs()).week;
    return { year, week };
  },
});


function getWeekStartingSunday(date: dayjs.Dayjs) {
  const yearStart = dayjs(`${date.year()}-01-01`);
  const daysSinceSunday = yearStart.day();
  const firstSunday = yearStart.subtract(daysSinceSunday, 'day');
  const diffInDays = date.startOf('day').diff(firstSunday, 'day');
  const week = Math.floor(diffInDays / 7) + 1;
  return { year: date.year(), week };
}

function getStartOfWeek(year: number, week: number) {
  const yearStart = dayjs(`${year}-01-01`);
  const daysSinceSunday = yearStart.day();
  const firstSunday = yearStart.subtract(daysSinceSunday, 'day');
  return firstSunday.add(week - 1, 'week');
}

function WeekViewPage() {
  const { year, week } = useSearch({ from: '/week-view/' });
  const navigate = useNavigate({ from: '/week-view' });

  const dispatch = useDispatch<AppDispatch>();

  const startOfWeek = useMemo(() => getStartOfWeek(year, week), [year, week]);
  const weekDates = Array.from({ length: 7 }, (_, i) =>
    startOfWeek.add(i, 'day'),
  );
  const weekRangeText = `${weekDates[0].format('MMM D')} – ${weekDates[6].format('D, YYYY')}`;

  const handleWeekChange = (newWeek: number, newYear = year) => {
    navigate({ search: { week: newWeek, year: newYear } });
  };

  const scenarios = useSelector((s: RootState) => s.scenarios.scenarios);
  const solutions = useSelector((state: RootState) => state.solutions.byDate);
  const enrichedByDate = useSelector(
    (state: RootState) => state.enrichedAppointments,
  );
  const solutionByDate = useSelector(
    (state: RootState) => state.solutions.byDate,
  );
  const companyInfo = useSelector(
    (s: RootState) => Object.values(s.companyInfo)[0],
  );

  const sortedScenarios = useMemo(() => {
    return [...scenarios]
      .map((item) => ({
        ...item,
        solution: !!solutions[`"${item.date}"`],
      }))
      .sort((a, b) => a.date - b.date);
  }, [scenarios, solutions]);

  const scenariosByDate = useMemo(() => {
    return Object.fromEntries(
      sortedScenarios.map((sc) => [
        new Date(sc.date).toDateString(),
        { ...sc, date: sc.date.toString() },
      ]),
    );
  }, [sortedScenarios]);

  const filteredScenarios = useMemo(() => {
    return weekDates
      .map((date) => {
        const dateKey = date.toDate().toDateString();
        return scenariosByDate[dateKey] || null;
      })
      .filter((sc) => sc !== null);
  }, [weekDates, scenariosByDate]);

  const [enrichLoading, setEnrichLoading] = useState<Record<string, boolean>>(
    {},
  );
  const [optimizeLoading, setOptimizeLoading] = useState<
    Record<string, boolean>
  >({});

  // progress states
  const [enrichProgress, setEnrichProgress] = useState(-1); // -1 | 0 | 1
  const [optimizeProgress, setOptimizeProgress] = useState(-1);

  // Error handling
  const [enrichError, setEnrichError] = useState<Record<string, boolean>>({});
  const [optimizeError, setOptimizeError] = useState<Record<string, boolean>>(
    {},
  );

  const queryClient = useQueryClient();

  const enrichMutation = useMutation({
    mutationFn: async (scenario: ScenarioDateString) => {
      const date = `"${scenario.date}"`;

      const payload = scenario.jobs.map((job) => ({
        address: job.address,
        number_of_workers: job.number_of_workers,
        service_time: 30,
        appointment_start: new Date(job.appointment_start).toISOString(),
        appointment_end: new Date(job.appointment_end).toISOString(),
      }));

      const res = await apiClient.post('/api/appointments', payload);
      return { date, data: res.data };
    },
    onSuccess: ({ date, data }) => {
      queryClient.setQueryData(
        ['enrichedAppointments', date],
        data.address_responses,
      );

      dispatch(
        setEnrichedAppointments({
          date,
          address_responses: data.address_responses,
        }),
      );
    },
  });

  const optimizeMutation = useMutation({
    mutationFn: async (scenario: ScenarioDateString) => {
      const date = `"${scenario.date}"`;

      const appointments = scenario.jobs.map((job) => ({
        address: job.address,
        number_of_workers: job.number_of_workers,
        service_time: 15,
        appointment_start:
          new Date(job.appointment_start)
            .toISOString()
            .replace('T', ' ')
            .split('.')[0] + '.000',
        appointment_end:
          new Date(job.appointment_end)
            .toISOString()
            .replace('T', ' ')
            .split('.')[0] + '.000',
      }));

      const companyPayload = {
        start_address: companyInfo.start_address,
        finish_address: companyInfo.finish_address,
        vehicles: companyInfo.vehicles.map((v) => ({
          vehicle_id: v.vehicle_id,
          skills: v.skills ? [...v.skills] : [],
          worker_amount: v.worker_amount,
          operation_hours: v.operation_hours,
          start_address: v.depot?.start || companyInfo.start_address,
          finish_address: v.depot?.finish || companyInfo.finish_address,
        })),
      };

      const res = await apiClient.post('/api/check-and-solve', {
        company_info: companyPayload,
        appointments,
      });

      console.log('Optimization result:', date, res.data);

      return { date, solution: res.data };
    },
    onSuccess: ({ date, solution }) => {
      queryClient.setQueryData(['solution', date], solution);
      dispatch(addSolution({ date, solution }));
    },
  });

  const handleEnrichAppointments = async () => {
    const tasksToRun = filteredScenarios.filter((scenario) => {
      const date = `"${scenario.date}"`;
      return !enrichedByDate[date];
    });

    console.log('Tasks to run for enrichment:', tasksToRun);

    if (tasksToRun.length === 0) {
      setEnrichProgress(-1);
      return;
    }

    setEnrichProgress(0);
    const tasks = tasksToRun.map(async (scenario) => {
      const date = `"${scenario.date}"`;
      setEnrichLoading((prev) => ({ ...prev, [date]: true }));

      try {
        await enrichMutation.mutateAsync(scenario);
        setEnrichError((prev) => ({ ...prev, [date]: false }));
      } catch (e) {
        console.error(`Failed enriching ${date}`, e);
        setEnrichError((prev) => ({ ...prev, [date]: true }));
      } finally {
        setEnrichLoading((prev) => ({ ...prev, [date]: false }));
        setEnrichProgress((prev) => prev + 1 / tasksToRun.length);
      }
    });

    await Promise.allSettled(tasks);
    // setEnrichProgress(1); // Snap to 100%
    setTimeout(() => setEnrichProgress(-1), 100);
  };

  const allLocationsFullyFound = (
    locations: { could_be_fully_found: boolean }[] = [],
  ) => locations.every((loc) => loc.could_be_fully_found);

  const handleOptimization = async () => {
    const tasksToRun = filteredScenarios.filter((scenario) => {
      const date = `"${scenario.date}"`;
      const enriched = enrichedByDate[date];
      const alreadySolved = solutionByDate[date];
      return !alreadySolved && allLocationsFullyFound(enriched);
    });

    console.log('Tasks to run for optimization:', tasksToRun);
    // return;
    if (tasksToRun.length === 0) {
      setOptimizeProgress(-1);
      return;
    }

    setOptimizeProgress(0);
    const tasks = tasksToRun.map(async (scenario) => {
      const date = `"${scenario.date}"`;
      setOptimizeLoading((prev) => ({ ...prev, [date]: true }));
      console.log(`Optimizing-- ${date}`, scenario);
      try {
        await optimizeMutation.mutateAsync(scenario);
        setOptimizeError((prev) => ({ ...prev, [date]: false }));
      } catch (e) {
        console.error(`Failed optimizing ${date}`, e);
        setOptimizeError((prev) => ({ ...prev, [date]: true }));
      } finally {
        setOptimizeLoading((prev) => ({ ...prev, [date]: false }));
        setOptimizeProgress((prev) => prev + 1 / tasksToRun.length);
      }
    });

    await Promise.allSettled(tasks);
    // setOptimizeProgress(1); // Snap to 100%
    setTimeout(() => setOptimizeProgress(-1), 1000);
  };

  // show status
  const renderEnrichedStatus = (date: string) => {
    if (enrichLoading[date]) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }

    if (enrichError[date]) {
      return <CircleX className="h-4 w-4 text-red-500" />;
    }

    const enriched = enrichedByDate[date];
    if (enriched) {
      if (allLocationsFullyFound(enriched)) {
        return <CircleCheck className="h-4 w-4 text-green-600" />;
      } else {
        return <CircleX className="h-4 w-4 text-red-500" />;
      }
    }

    return <CircleDot className="h-4 w-4 text-yellow-600" />;
  };

  const renderSolutionStatus = (date: string) => {
    if (optimizeLoading[date]) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }

    if (optimizeError[date]) {
      return <CircleX className="h-4 w-4 text-red-500" />;
    }

    const data = solutionByDate[date];
    if (data) {
      return <CircleCheck className="h-4 w-4 text-green-600" />;
    }

    return <CircleDot className="h-4 w-4 text-yellow-600" />;
  };

  return (
    <div className="my-6 max-w-xl mx-auto bg-white rounded-lg border shadow relative">
      {/* Progress bars */}
      <div className='absolute top-0 left-0 w-full'>
        {enrichProgress !== -1 && (
          <ProgressAnimation value={enrichProgress * 100} className="bg-gray-200 [&>div]:bg-green-800 h-1.5" />
        )}

        {optimizeProgress !== -1 && (
          <ProgressAnimation value={optimizeProgress * 100} className="bg-gray-200 [&>div]:bg-sky-800 h-1.5" />
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 rounded-md border hover:bg-gray-100 text-black"
              onClick={() => handleWeekChange(week - 1)}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              className="px-3 py-1.5 rounded-md border hover:bg-gray-100 text-black"
              onClick={() => handleWeekChange(week + 1)}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="text-lg font-semibold text-center">{weekRangeText}</div>

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
                const y = dayjs().year() - 2 + i;
                return (
                  <option key={y} value={y}>
                    {y}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end items-center gap-3">
          <Button
            className="bg-green-50 text-green-800 font-semibold px-4 py-1.5 rounded-sm text-sm shadow-sm hover:bg-green-100"
            onClick={handleEnrichAppointments}
          >
            Verify Appointments
          </Button>
          <Button
            className="bg-blue-50 text-sky-800 font-semibold px-4 py-1.5 rounded-sm text-sm shadow-sm hover:bg-blue-100"
            onClick={handleOptimization}
          >
            Start Optimization
          </Button>
        </div>

        {/* Week Days List */}
        <div className="flex flex-col gap-3">
          {weekDates.map((date) => {
            const dateKey = date.toDate().toDateString();
            const sc = scenariosByDate[dateKey];
            const so = solutionByDate[`"${sc?.date}"`];

            console.log('Rendering date:', dateKey, so);

            return (
              <div
                key={date.toISOString()}
                className="border rounded p-3 shadow-sm"
              >
                {/* <div className="flex justify-between items-top mb-2">
                <div>
                  <div className="text-lg font-semibold">
                    {date.format('dddd')}
                  </div>
                  <div className="text-sm text-gray-600">
                    {date.format('MMM D, YYYY')}
                  </div>
                </div>

                <div
                  className="cursor-pointer p-0.5 text-gray-800"
                  onClick={() =>
                    navigate({
                      to: '/map-view',
                      search: { date: sc.date.toString() },
                    })
                  }
                >
                  <Map className="h-4.5 w-4.5" />
                </div>
              </div> */}
                <div className=" w-full flex justify-between  ">
                  {' '}
                  <div>
                    <div className="mb-4">
                      <div className="text-lg font-semibold">
                        {date.format('dddd')}
                      </div>
                      <div className="text-base text-gray-600">
                        {date.format('MMM D, YYYY')}
                      </div>
                    </div>
                  </div>
                  <div
                    className="cursor-pointer p-0.5 text-gray-800"
                    onClick={() =>
                      navigate({
                        to: '/map-view',
                        search: { date: sc.date.toString() },
                      })
                    }
                  >
                    <Map className="h-4.5 w-4.5" />
                  </div>
                </div>
                {sc && (
                  <div className="">

                    <div className="grid grid-cols-2 divide-x divide-gray-200">
                      <div className="pr-4">
                        <ul className="text-sm text-gray-700">

                          {!so ?
                            (<>
                              {sc.jobs.length &&
                                <li className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  <span className="font-semibold">
                                    Jobs:
                                  </span>{' '}
                                  {sc.jobs.length}
                                </li>
                              }
                            </>) :
                            (<>
                              <li className="flex items-center gap-1">
                                <CalendarClock className="h-4 w-4" />
                                <span className="font-semibold">
                                  Appointments:
                                </span>{' '}
                                {so.routes.reduce(
                                  (acc, route) => acc + route.appointments.length,
                                  0,
                                )}
                              </li>
                              <li className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span className="font-semibold">
                                  Start Time:
                                </span>{' '}
                                {dayjs(so?.routes[0]?.appointments[0]?.appointment_start).format('HH:mm')}
                              </li>
                              <li className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span className="font-semibold">
                                  End Time:</span>{' '}
                                {dayjs(
                                  so?.routes[so.routes.length - 1]?.appointments[
                                    so?.routes[so.routes.length - 1]?.appointments.length - 1
                                  ]?.appointment_end
                                ).format('HH:mm')}
                              </li>
                              <li className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                <span className="font-semibold">
                                  Workers:</span>{' '}
                                {so.routes.length}
                              </li>

                              <li className="flex items-center gap-1">
                                <Waypoints className="h-4 w-4" />
                                <span className="font-semibold">
                                  Total Distance:
                                </span>{' '}
                                {(so.max_distance_traveled / 1000).toFixed(2)} km
                              </li>
                            </>)}
                        </ul>
                      </div>

                      <div className="pl-4 text-gray-700">
                        <p className=" text-sm flex items-center gap-2">
                          <span className="font-semibold">
                            Appointments verification:
                          </span>{' '}
                          {renderEnrichedStatus(`"${sc.date}"`)}
                        </p>
                        <p className=" text-sm flex items-center gap-2">
                          <span className="font-semibold">
                            Solution Optimization:
                          </span>{' '}
                          {renderSolutionStatus(`"${sc.date}"`)}
                        </p>
                      </div>
                    </div>

                    {/* <div className="w-24 flex items-center gap-1 px-2 py-1 mt-2 rounded bg-sky-600 text-white text-xs font-medium">
                    <MapPin className="h-4 w-4" />
                    {sc.jobs.length} jobs
                  </div> */}

                    {/* 
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-18">Verified:</span>{' '}
                      {renderEnrichedStatus(`"${sc.date}"`)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-18">Solution:</span>{' '}
                      {renderSolutionStatus(`"${sc.date}"`)}
                    </div>
                  </div> */}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
