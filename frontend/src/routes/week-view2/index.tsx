import { createFileRoute, useSearch, useNavigate } from '@tanstack/react-router'

import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';

import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import apiClient from '@/utils/apiClient';
import { useMutation, useQueries } from '@tanstack/react-query';
import { EnhancedAddressResponse } from '@/types/EnhancedAddressResponse';
import { setEnrichedAppointments } from '@/store/enrichedAppointmentsSlice';
import { set } from 'zod';

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
  const scenarios = useSelector((s: RootState) => s.scenarios.scenarios);
  console.log('scenarios', scenarios)
  const solutions = useSelector((state: RootState) => state.solutions.byDate);

  const sortedScenarios = useMemo(() => {
    return [...scenarios]
      .map((item) => ({
        ...item,
        solution: !!solutions[`"${item.date}"`],
      }))
      .sort((a, b) => a.date - b.date);
  }, [scenarios, solutions]);

  // Map dates to scenarios
  const scenariosByDate = new Map(
    sortedScenarios.map((sc) => [new Date(sc.date).toDateString(), sc]),
  );

  const companyInfo = useSelector(
    (s: RootState) => s.companyInfo["1745877600000".split('"')[1]] ?? null,
  );

  const { year, week } = useSearch({ from: '/week-view/' })
  const navigate = useNavigate()

  const startOfWeek = useMemo(() => getStartOfWeek(year, week), [year, week])
  const weekDates = Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'))

  const filteredScenarios = useMemo(() => {
    return weekDates.map(date => {
      const dateKey = date.toDate().toDateString()
      return scenariosByDate.get(dateKey) || null
    }).filter(sc => sc !== null)
  }, [weekDates, scenariosByDate])


  // prepare appointments for payload by date
  const appointmentsPayloadByDate = filteredScenarios.map((scenario) => ({
    date: scenario.date,
    appointments: scenario.jobs.map((job) => ({
      address: job.address,
      number_of_workers: job.number_of_workers,
      service_time: 30, // override to 30
      appointment_start: new Date(job.appointment_start).toISOString(),
      appointment_end: new Date(job.appointment_end).toISOString()
    })) || [],
  }));
  console.log('appointmentsPayloadByDate', appointmentsPayloadByDate)

  interface AppointmentResponse {
    address_responses: EnhancedAddressResponse[];
    errors: string[];
  }

  const dispatch = useDispatch<AppDispatch>();

  // Collect all cached enriched appointments once, outside of the callback
  const enrichedAppointments = useSelector((s: RootState) => s.enrichedAppointments);

  const enrichedAppointmentQueries = useQueries({
    queries: appointmentsPayloadByDate.map((scenario) => {
      const cachedResponses = enrichedAppointments[scenario.date];

      const initialData:
        | { address_responses: EnhancedAddressResponse[]; errors: string[] }
        | undefined = cachedResponses
          ? { address_responses: cachedResponses, errors: [] }
          : undefined;

      const appointmentsPayload = scenario.appointments;

      return {
        queryKey: ['enriched-appointments', scenario.date],
        queryFn: () =>
          apiClient
            .post('/api/appointments', appointmentsPayload)
            .then((res) => res.data as AppointmentResponse),
        enabled: !!scenario,
        staleTime: Infinity,
        select: (data: AppointmentResponse) => {
          dispatch(
            setEnrichedAppointments({
              date: scenario.date,
              address_responses: data.address_responses,
            }),
          );
          return {
            date: scenario.date,
            address_responses: data,
          };
        },
        ...(initialData ? { initialData } : {}),
      };
    }),
  });



  enrichedAppointmentQueries.forEach((query, index) => {
    const { data, isLoading, error } = query;

    if (isLoading) {
      // loading state for this scenario
    } else if (error) {
      // handle error
    } else if (data) {
      // const locations = data.address_responses;
      // use locations
      console.log("----locations", data)

    }
  });

  // Optimization status per date
  const [optimizationStatus, setOptimizationStatus] = useState<{ [date: number]: 'idle' | 'loading' | 'done' }>({});


  // Optimization mutation
  const optimizationMutation = useMutation({
    mutationFn: async ({ scenario, companyInfo }: { scenario: any, companyInfo: any }) => {
      setOptimizationStatus((prev) => ({ ...prev, [scenario.date]: 'loading' }));
      // Prepare appointments as in your handleOptimize
      const enhancedAppointments =
        scenario.jobs.map((app: any) => ({
          appointment_start: new Date(app.appointment_start)
            .toISOString()
            .replace('T', ' ')
            .split('.')[0]
            .concat('.000'),
          appointment_end: new Date(app.appointment_end)
            .toISOString()
            .replace('T', ' ')
            .split('.')[0]
            .concat('.000'),
          address: app.address,
          number_of_workers: app.number_of_workers,
          service_time: 15,
        })) || [];

      const alteredCompanyInfo = {
        start_address: companyInfo.start_address,
        finish_address: companyInfo.finish_address,
        number_of_workers: companyInfo.vehicles.map((v: any) => ({
          vehicle_id: v.vehicle_id,
          skills: v.skills,
          worker_amount: v.worker_amount,
        })),
      };

      const request = {
        company_info: alteredCompanyInfo,
        appointments: enhancedAppointments,
      };

      await apiClient.post('/api/check-and-solve', request);
      setOptimizationStatus((prev) => ({ ...prev, [scenario.date]: 'done' }));
    },
    onError: (_err, variables) => {
      setOptimizationStatus((prev) => ({ ...prev, [variables.scenario.date]: 'idle' }));
    }
  });

  // Button handler: optimize all days with all addresses fully found
  const handleOptimizeAll = () => {
    console.log('calling handleOptimizeAll');
    weekDates.forEach((date, idx) => {
      const sc = scenariosByDate.get(date.toDate().toDateString());
      const query = enrichedAppointmentQueries[idx];
      if (!sc || !companyInfo || !query?.data) return;
      const addresses = query.data.address_responses.address_responses || [];
      const allFound = addresses.length > 0 && addresses.every((addr: any) => addr.could_be_fully_found);
      if (allFound && optimizationStatus[sc.date] !== 'loading' && optimizationStatus[sc.date] !== 'done') {
        optimizationMutation.mutate({ scenario: sc, companyInfo });
      }
    });
  };


  const handleWeekChange = (newWeek: number, newYear = year) => {
    navigate({ search: { week: newWeek, year: newYear } })
  }

  const weekRangeText = `${weekDates[0].format('MMM D')} – ${weekDates[6].format('D, YYYY')}`

  return (
    <div className="p-4 space-y-4 max-w-xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        {/* Optimize All Button */}
        <button
          className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700"
          onClick={handleOptimizeAll}
          disabled={optimizationMutation.isPending}
        >
          {optimizationMutation.isPending ? "Optimizing..." : "Optimize All Fully Found Days"}
        </button>
        {/* Prev / Next */}
        <div className="flex gap-2">
          <button
            className="text-blue-600 hover:underline"
            onClick={() => handleWeekChange(week - 1)}
          >
            &larr; Prev
          </button>
          <button
            className="text-blue-600 hover:underline"
            onClick={() => handleWeekChange(week + 1)}
          >
            Next &rarr;
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

      {/* Vertical Days List */}
      <div className="flex flex-col gap-3">
        {weekDates.map((date, idx) => {
          const dateKey = date.toDate().toDateString();
          const sc = scenariosByDate.get(dateKey);

          // Find the query for this date
          const query = enrichedAppointmentQueries[idx];
          let statusElem = null;

          if (query) {
            if (query.isLoading) {
              statusElem = <div className="text-yellow-600">Loading enriched addresses...</div>;
            } else if (query.error) {
              statusElem = <div className="text-red-600">Error loading addresses</div>;
            } else if (query.data) {
              // The structure is: { date, address_responses: { address_responses: [...], errors: [] } }
              const addresses = query.data.address_responses.address_responses || [];
              const anyFalse = addresses.some(addr => addr.could_be_fully_found === false);
              const allFound = addresses.length > 0 && !anyFalse;
              statusElem = (
                <div>
                  <div>
                    All addresses fully found: <span className={anyFalse ? "text-red-600" : "text-green-600"}>{!anyFalse ? "true" : "false"}</span>
                  </div>
                  {allFound && (
                    <div>
                      {optimizationStatus[sc.date] === 'loading' && <span className="text-yellow-600">Optimizing...</span>}
                      {optimizationStatus[sc.date] === 'done' && <span className="text-green-600">Optimized completed</span>}
                    </div>
                  )}
                  {/* <ul className="text-xs mt-1">
                                        {addresses.map((addr, i) => (
                                            <li key={i}>
                                                {addr.street}, {addr.city}:
                                                <span className={addr.could_be_fully_found ? "text-green-600" : "text-red-600"}>
                                                    {addr.could_be_fully_found ? "true" : "false"}
                                                </span>
                                                {addr.error_information && !addr.could_be_fully_found && (
                                                    <> — {addr.error_information}</>
                                                )}
                                            </li>
                                        ))}
                                    </ul> */}
                </div>
              );
            }
          }

          return (
            <div
              key={date.toISOString()}
              className="border rounded p-3 shadow-sm"
            >
              <div className="text-lg font-semibold">{date.format('dddd')}</div>
              <div className="text-sm text-gray-600">{date.format('MMM D, YYYY')}</div>
              {sc && <div>{sc.jobs.length}</div>}
              {statusElem}
            </div>
          );
        })}
      </div>
    </div>
  )
}
