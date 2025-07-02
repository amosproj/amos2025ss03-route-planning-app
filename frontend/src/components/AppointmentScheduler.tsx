import { Button } from '@/components/ui/button';
import { ProgressAnimation } from '@/components/ui/progressAnimation';
import { AppDispatch, RootState } from '@/store';
import { setEnrichedAppointments } from '@/store/enrichedAppointmentsSlice';
import { addSolution } from '@/store/solutionsSlice';
import { ScenarioDateString } from '@/types/Scenario';
import apiClient from '@/utils/apiClient';
import { getStartOfWeek, getWeekStartingSunday } from '@/utils/helper';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { getRouteColor } from '@/utils/routeColors';
import { minutesToTime } from '@/utils/helper';
import dayjs from 'dayjs';
import {
  ArrowLeft,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleDot,
  CircleX,
  Clock,
  Loader2,
  Map,
  MapPin,
  History,
  Waypoints,
  Truck,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

interface AppointmentSchedulerProps {
  dates: dayjs.Dayjs[];
  title?: string;
  showBackButton?: boolean;
  showWeekNavigation?: boolean;
  onWeekChange?: (dates: dayjs.Dayjs[]) => void;
  className?: string;
}

export function AppointmentScheduler({
  dates,
  title,
  showBackButton = true,
  showWeekNavigation = false,
  onWeekChange,
  className = '',
}: AppointmentSchedulerProps) {
  const navigate = useNavigate();
  const { history } = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  // Redux selectors
  const scenarios = useSelector((state: RootState) => state.scenarios.scenarios);
  const solutions = useSelector((state: RootState) => state.solutions.byDate);
  const enrichedByDate = useSelector(
    (state: RootState) => state.enrichedAppointments,
  );
  const solutionByDate = useSelector(
    (state: RootState) => state.solutions.byDate,
  );
  const companyInfo = useSelector(
    (state: RootState) => state.companyInfo,
  );
  const excludedVehicles = useSelector(
    (state: RootState) => state.excludedVehicles,
  );
  const excludedAppointments = useSelector(
    (state: RootState) => state.excludedAppointments,
  );


  // Week navigation state
  const currentWeekInfo = useMemo(() => {
    if (!showWeekNavigation || dates.length === 0) return null;
    return getWeekStartingSunday(dates[0]);
  }, [dates, showWeekNavigation]);

  const weekRangeText = useMemo(() => {
    if (!showWeekNavigation || dates.length === 0) return '';
    return `${dates[0].format('MMM D')} – ${dates[dates.length - 1].format('D, YYYY')}`;
  }, [dates, showWeekNavigation]);

  // Computed values
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
    return dates
      .map((date) => {
        const dateKey = date.toDate().toDateString();
        return scenariosByDate[dateKey] || null;
      })
      .filter((sc) => sc !== null);
  }, [dates, scenariosByDate]);

  // State management
  const [enrichLoading, setEnrichLoading] = useState<Record<string, boolean>>(
    {},
  );
  const [optimizeLoading, setOptimizeLoading] = useState<
    Record<string, boolean>
  >({});
  const [enrichProgress, setEnrichProgress] = useState(-1);
  const [optimizeProgress, setOptimizeProgress] = useState(-1);
  const [enrichError, setEnrichError] = useState<Record<string, boolean>>({});
  const [optimizeError, setOptimizeError] = useState<Record<string, boolean>>(
    {},
  );

  // Week navigation handlers
  const handleWeekChange = (weekOffset: number) => {
    if (!currentWeekInfo || !onWeekChange) return;

    const newWeek = currentWeekInfo.week + weekOffset;
    let newYear = currentWeekInfo.year;

    // Handle year boundaries
    if (newWeek < 1) {
      newYear -= 1;
      // Approximate weeks in previous year (could be 52 or 53)
      const prevYearEnd = dayjs(`${newYear}-12-31`);
      const prevYearWeekInfo = getWeekStartingSunday(prevYearEnd);
      const adjustedWeek = prevYearWeekInfo.week;
      const newStartOfWeek = getStartOfWeek(newYear, adjustedWeek);
      const newWeekDates = Array.from({ length: 7 }, (_, i) =>
        newStartOfWeek.add(i, 'day'),
      );
      onWeekChange(newWeekDates);
    } else if (newWeek > 53) {
      newYear += 1;
      const newStartOfWeek = getStartOfWeek(newYear, 1);
      const newWeekDates = Array.from({ length: 7 }, (_, i) =>
        newStartOfWeek.add(i, 'day'),
      );
      onWeekChange(newWeekDates);
    } else {
      const newStartOfWeek = getStartOfWeek(newYear, newWeek);
      const newWeekDates = Array.from({ length: 7 }, (_, i) =>
        newStartOfWeek.add(i, 'day'),
      );
      onWeekChange(newWeekDates);
    }
  };

  const handleWeekSelect = (week: number) => {
    if (!currentWeekInfo || !onWeekChange) return;

    const newStartOfWeek = getStartOfWeek(currentWeekInfo.year, week);
    const newWeekDates = Array.from({ length: 7 }, (_, i) =>
      newStartOfWeek.add(i, 'day'),
    );
    onWeekChange(newWeekDates);
  };

  const handleYearSelect = (year: number) => {
    if (!currentWeekInfo || !onWeekChange) return;

    const newStartOfWeek = getStartOfWeek(year, currentWeekInfo.week);
    const newWeekDates = Array.from({ length: 7 }, (_, i) =>
      newStartOfWeek.add(i, 'day'),
    );
    onWeekChange(newWeekDates);
  };

  // Mutations
  const enrichMutation = useMutation({
    mutationFn: async (scenario: ScenarioDateString) => {
      const date = `"${scenario.date}"`;

      const payload = scenario.jobs.map((job) => ({
        address: job.address,
        number_of_workers: job.number_of_workers,
        service_time: 30,
        appointment_start: new Date(job.appointment_start).toISOString(),
        appointment_end: new Date(job.appointment_end).toISOString(),
        appointment_type: job?.appointment_type || 'REAL_APPOINTMENT',
      }));

      const res = await apiClient.post('/api/appointments', payload);
      return { date, data: res.data };
    },
    onSuccess: ({ date, data }) => {
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
      // Check for required data presence
      const companyInfoByDate = companyInfo[scenario.date];
      if (!companyInfoByDate) {
        console.error(`Missing companyInfo for date: ${date}`);
        throw new Error(`Missing company info for date: ${date}`);
      }

      const excludedVehiclesByDate = excludedVehicles[date] ?? [];

      const appointments = scenario.jobs
        .filter((_, idx) => !excludedAppointments[date]?.includes(idx))
        .map((job) => ({
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
          appointment_type: job?.appointment_type || 'REAL_APPOINTMENT',
        }));

      // const companyPayload = {
      //   start_address: companyInfo.start_address,
      //   finish_address: companyInfo.finish_address,
      //   vehicles: companyInfo.vehicles.map((v) => ({
      //     vehicle_id: v.vehicle_id,
      //     skills: v.skills ? [...v.skills] : [],
      //     worker_amount: v.worker_amount,
      //     operation_hours: v.operation_hours,
      //     start_address: v.depot?.start || companyInfo.start_address,
      //     finish_address: v.depot?.finish || companyInfo.finish_address,
      //     cost_per_km: v.cost_per_km,
      //     cost_per_hour: v.cost_per_hour,
      //   })),
      // };

      const { start_address, finish_address, vehicles } = companyInfo[scenario.date]

      const companyPayload = {
        start_address,
        finish_address,
        vehicles: vehicles
          .filter((v) => !excludedVehiclesByDate?.includes(v.vehicle_id))
          .map((v) => ({
            vehicle_id: v.vehicle_id,
            skills: v.skills ? [...v.skills] : [],
            worker_amount: v.worker_amount,
            operation_hours: v.operation_hours,
            start_address: v.depot?.start || start_address,
            finish_address: v.depot?.finish || finish_address,
            cost_per_km: v.cost_per_km,
            cost_per_hour: v.cost_per_hour,
            vehicle_break: v.vehicle_break || null,
          })),
      };
      const res = await apiClient.post('/api/check-and-solve', {
        company_info: companyPayload,
        appointments,
      });

      return { date, solution: res.data };
    },
    onSuccess: ({ date, solution }) => {
      dispatch(addSolution({ date, solution }));
    },
    onError: (error) => {
      console.error('Optimization failed:', error);
    },
  });

  // Helper functions
  const allLocationsFullyFound = (
    locations: { could_be_fully_found: boolean }[] = [],
  ) => locations.every((loc) => loc.could_be_fully_found);

  const finalEnrichedAppointments = (date: string) => {
    const dateWithQuotes = date.startsWith('"') ? date : `"${date}"`;
    const enriched = enrichedByDate[dateWithQuotes] || [];
    const excludedAppointmentsByDate = excludedAppointments[dateWithQuotes] || [];
    return enriched.filter((_, idx) => !excludedAppointmentsByDate?.includes(idx));

  }

  const finalVehicles = (date: string) => {
    const dateWithQuotes = `"${date}"`;
    const vehicles = companyInfo[date]?.vehicles || [];
    const excludedVehiclesByDate = excludedVehicles[dateWithQuotes] || [];
    return vehicles.filter((v) => !excludedVehiclesByDate?.includes(v.vehicle_id));
  }

  // Action handlers
  const handleEnrichAppointments = async () => {
    const tasksToRun = filteredScenarios.filter((scenario) => {
      const date = `"${scenario.date}"`;
      return !enrichedByDate[date];
    });

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
    setTimeout(() => setEnrichProgress(-1), 100);
  };

  const handleOptimization = async () => {
    const tasksToRun = filteredScenarios.filter((scenario) => {
      const date = `"${scenario.date}"`;
      // const enriched = enrichedByDate[date] || [];
      // const excludedAppointmentsByDate = excludedAppointments[date] || [];
      // const finalEnrichedAppointments = enriched.filter((_, idx) => {
      //   return !excludedAppointmentsByDate.includes(idx);
      // })
      const alreadySolved = solutionByDate[date];
      return !alreadySolved && finalEnrichedAppointments(scenario.date) && allLocationsFullyFound(finalEnrichedAppointments(scenario.date));
    });

    if (tasksToRun.length === 0) {
      setOptimizeProgress(-1);
      return;
    }

    setOptimizeProgress(0);
    const tasks = tasksToRun.map(async (scenario) => {
      const date = `"${scenario.date}"`;
      setOptimizeLoading((prev) => ({ ...prev, [date]: true }));
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
    setTimeout(() => setOptimizeProgress(-1), 1000);
  };

  // Status renderers
  const renderEnrichedStatus = (date: string) => {
    if (enrichLoading[date]) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }

    if (enrichError[date]) {
      return <CircleX className="h-4 w-4 text-red-500" />;
    }

    if (finalEnrichedAppointments(date).length > 0) {
      if (allLocationsFullyFound(finalEnrichedAppointments(date))) {
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
    <div
      className={`my-6 max-w-4xl mx-auto bg-white rounded-lg border shadow relative ${className}`}
    >
      {/* Progress bars */}
      <div className="absolute top-0 left-0 w-full">
        {enrichProgress !== -1 && (
          <ProgressAnimation
            value={enrichProgress * 100}
            className="bg-gray-200 [&>div]:bg-green-800 h-1.5"
          />
        )}

        {optimizeProgress !== -1 && (
          <ProgressAnimation
            value={optimizeProgress * 100}
            className="bg-gray-200 [&>div]:bg-sky-800 h-1.5"
          />
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Week Navigation */}
        {showWeekNavigation && currentWeekInfo && (
          <div className="flex items-center justify-between pt-4">
            <div className="flex gap-2">
              <button
                className="px-3 py-1.5 rounded-md border hover:bg-gray-100 text-black"
                onClick={() => handleWeekChange(-1)}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                className="px-3 py-1.5 rounded-md border hover:bg-gray-100 text-black"
                onClick={() => handleWeekChange(1)}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="text-lg font-semibold text-center">
              {weekRangeText}
            </div>

            <div className="flex gap-2">
              <select
                className="border rounded px-2 py-1"
                value={currentWeekInfo.week}
                onChange={(e) => handleWeekSelect(parseInt(e.target.value))}
              >
                {Array.from({ length: 53 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Week {i + 1}
                  </option>
                ))}
              </select>
              <select
                className="border rounded px-2 py-1"
                value={currentWeekInfo.year}
                onChange={(e) => handleYearSelect(parseInt(e.target.value))}
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
        )}

        {/* Header */}
        {(title || showBackButton) && (
          <div className="flex justify-between items-center pt-4">
            {showBackButton ? (
              <Button
                className="bg-white border border-gray-100 text-gray-800 font-semibold px-4 py-1.5 rounded-sm text-sm hover:bg-gray-100"
                onClick={() => history.go(-1)}
              >
                <ArrowLeft />
                <span className="ml-2">Back</span>
              </Button>
            ) : (
              <div />
            )}

            {title && (
              <div className="text-lg font-semibold text-center">{title}</div>
            )}

            {/* Action Buttons */}
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
          </div>
        )}

        {/* Days List */}
        <div className="flex flex-col gap-3">
          {dates.map((date) => {
            const dateKey = date.toDate().toDateString();
            const sc = scenariosByDate[dateKey];
            const so = solutionByDate[`"${sc?.date}"`];

            return (
              <div
                key={date.toISOString()}
                className="border rounded p-3 shadow-sm"
              >
                <div className="w-full flex justify-between">
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
                  {sc && (
                    <div className="flex divide-x divide-gray-200 items-center gap-2">
                      <p className="text-sm flex items-center gap-2 pr-3">
                        <span className="font-semibold">Verified:</span>{' '}
                        {renderEnrichedStatus(`"${sc.date}"`)}
                      </p>
                      <p className="text-sm flex items-center gap-2 pr-3">
                        <span className="font-semibold">Optimized:</span>{' '}
                        {renderSolutionStatus(`"${sc.date}"`)}
                      </p>
                      <div
                        className="cursor-pointer p-0.5 text-gray-800"
                        onClick={() =>
                          navigate({
                            to: '/map-view',
                            search: { date: sc?.date?.toString() },
                          })
                        }
                      >
                        <Map className="h-4.5 w-4.5" />
                      </div>
                    </div>
                  )}
                </div>

                {sc && (
                  <div className="flex justify-start items-center gap-4 text-sm text-gray-700">
                    {!so ? (
                      <>
                        {finalEnrichedAppointments(sc.date).length > 0 && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span className="font-semibold">Jobs:</span>{' '}
                            {finalEnrichedAppointments(sc.date).length}
                          </div>
                        )}
                        {finalVehicles(sc.date).length > 0 && (
                          <div className="flex items-center gap-1">
                            <Truck className="h-4 w-4" />
                            <span className="font-semibold">Vehicles:</span>{' '}
                            {finalVehicles(sc.date).length}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex overflow-auto gap-4">
                          {so.routes.map((route, idx) => {
                            const appointments = route.appointments;
                            const routeMetrics = route.route_metrics;

                            return (
                              <div
                                key={route.route_id}
                                className=" min-w-[350px] p-2 border border-l-4 rounded-sm"
                                style={{
                                  borderLeftColor: getRouteColor(idx),
                                }}
                              >
                                <p
                                  className="font-semibold text-base mb-2"
                                  style={{
                                    color: getRouteColor(idx),
                                  }}
                                >
                                  Route {idx + 1}
                                </p>

                                <ul className="space-y-0.5">
                                  {' '}
                                  <li className="flex items-center gap-1">
                                    <CalendarClock className="h-4 w-4" />
                                    <span className="font-semibold">
                                      Appointments:
                                    </span>{' '}
                                    {appointments.length}
                                  </li>
                                  <li className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    <span className="font-semibold">
                                      Start Address:
                                    </span>{' '}
                                    {appointments[0]?.address.street},{' '}
                                    {appointments[0]?.address.zip_code}{' '}
                                    {appointments[0]?.address.city}
                                  </li>
                                  <li className="flex items-center gap-1">
                                    <MapPin className="h-4 w-4" />
                                    <span className="font-semibold">
                                      End Address:
                                    </span>{' '}
                                    {
                                      appointments[appointments.length - 1]
                                        ?.address.street
                                    }
                                    ,{' '}
                                    {
                                      appointments[appointments.length - 1]
                                        ?.address.zip_code
                                    }{' '}
                                    {
                                      appointments[appointments.length - 1]
                                        ?.address.city
                                    }
                                  </li>
                                  <li className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    <span className="font-semibold">
                                      Start Time:
                                    </span>{' '}
                                    <span>
                                      {minutesToTime(routeMetrics?.start_time)}
                                    </span>
                                  </li>
                                  <li className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    <span className="font-semibold">
                                      End Time:
                                    </span>{' '}
                                    {minutesToTime(routeMetrics?.end_time)}
                                  </li>
                                  <li className="flex items-center gap-1">
                                    <History className="h-4 w-4" />
                                    <span className="font-semibold">
                                      Total Service Time:
                                    </span>{' '}
                                    {routeMetrics
                                      ? `${routeMetrics.total_service_time_min} ${routeMetrics.total_service_time_min <=
                                        1
                                        ? 'min'
                                        : 'mins'
                                      }`
                                      : '-'}
                                  </li>
                                  <li className="flex items-center gap-1">
                                    <Waypoints className="h-4 w-4" />
                                    <span className="font-semibold">
                                      Total Distance:
                                    </span>{' '}
                                    {routeMetrics
                                      ? `${routeMetrics.total_travel_distance_km.toFixed(2)} km`
                                      : '-'}
                                  </li>
                                </ul>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
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
