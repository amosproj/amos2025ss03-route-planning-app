import { createFileRoute, useSearch, useNavigate } from '@tanstack/react-router'

import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';

import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'

export const Route = createFileRoute('/week-view/')({
    component: WeekViewPage,
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

function WeekViewPage() {
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
    // const appointmentsPayloadByDate = filteredScenarios.map((scenario) => ({
    //     date: scenario.date,
    //     appointments: scenario.jobs.map((job) => ({
    //         address: job.address,
    //         number_of_workers: job.number_of_workers,
    //         service_time: 30, // override to 30
    //         appointment_start: new Date(job.appointment_start).toISOString(),
    //         appointment_end: new Date(job.appointment_end).toISOString()
    //     })) || [],
    // }));

    const [enrichedAppointmentsByDate, setEnrichedAppointmentsByDate] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isAappointmentsEnriched, setIsAppointmentsEnriched] = useState(false);

    const [solutionByDate, setSolutionByDate] = useState<{ [date: string]: any }>({});

    const handleEnrichAppointments = async () => {
        setLoading(true);

        const appointmentsPayloadByDate = filteredScenarios.map((scenario) => ({
            date: scenario.date,
            appointments: scenario.jobs.map((job) => ({
                address: job.address,
                number_of_workers: job.number_of_workers,
                service_time: 30, // override to 30
                appointment_start: new Date(job.appointment_start).toISOString(),
                appointment_end: new Date(job.appointment_end).toISOString(),
            })) || [],
        }));

        console.log('appointmentsPayloadByDate', appointmentsPayloadByDate);

        const results: { [date: string]: any } = {};

        for (const payload of appointmentsPayloadByDate) {
            try {
                const response = await fetch('http://localhost:8080/api/appointments', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload.appointments),
                });

                if (!response.ok) {
                    throw new Error(`Failed for date ${payload.date}: ${response.statusText}`);
                }

                const enrichedAppointments = await response.json();

                results[payload.date] = enrichedAppointments;
            } catch (error) {
                console.error('Error enriching appointments:', error);
            }

        }

        setEnrichedAppointmentsByDate(results);
        setLoading(false);
        setIsAppointmentsEnriched(true);
    };

    useEffect(() => {
        if (isAappointmentsEnriched) {
            console.log('isAappointmentsEnriched:', isAappointmentsEnriched);
        }
    }, [isAappointmentsEnriched]);

    useEffect(() => {
        console.log('Enriched Appointments By Date:', enrichedAppointmentsByDate);
    }, [enrichedAppointmentsByDate]);

    const companyInfo = useSelector(
        (s: RootState) => Object.values(s.companyInfo)[0],
    );
    console.log('companyInfo', companyInfo);

    const handleOptimization = async () => {
        // Handle optimization logic here
        console.log('Optimization started');
        const payload = {
            scenarios: filteredScenarios
                .filter((sc) => enrichedAppointmentsByDate[sc.date]?.all_valid === true)
                .map((sc) => ({
                    date: sc.date,
                    jobs: sc.jobs.map((job) => ({
                        address: job.address,
                        number_of_workers: job.number_of_workers,
                        service_time: 30, // override to 30
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
                    })),
                })),
            alteredCompanyInfo: {
                start_address: companyInfo.start_address,
                finish_address: companyInfo.finish_address,
                number_of_workers: companyInfo.vehicles.map((v) => ({
                    vehicle_id: v.vehicle_id,
                    skills: v.skills,
                    worker_amount: v.worker_amount,
                })),
            },
        };

        console.log('Optimization payload:', payload);

        // Call API for each scenario
        try {
            const results = await Promise.all(
                payload.scenarios.map(async (scenario) => {
                    const response = await fetch('http://localhost:8080/api/check-and-solve', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            company_info: payload.alteredCompanyInfo,
                            appointments: scenario.jobs,
                        }),
                    });
                    if (!response.ok) {
                        throw new Error(`Failed for date ${scenario.date}: ${response.statusText}`);
                    }
                    const data = await response.json();
                    console.log(`Result for ${scenario.date}:`, data);
                    setSolutionByDate((prev) => ({
                        ...prev,
                        [scenario.date]: data,
                    }));
                    return { date: scenario.date, result: data };
                })
            );
            // Optionally, do something with results
            console.log('All optimization results:', results);
        } catch (error) {
            console.error('Error during optimization:', error);
        }
    }


    // ---------------------------------------------------------------------------



    const handleWeekChange = (newWeek: number, newYear = year) => {
        navigate({ search: { week: newWeek, year: newYear } })
    }

    const weekRangeText = `${weekDates[0].format('MMM D')} – ${weekDates[6].format('D, YYYY')}`

    return (
        <div className="p-4 space-y-4 max-w-xl mx-auto">
            {/* Top Bar */}
            <div className="flex items-center justify-between">
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

            <div className='flex justify-end items-center gap-3'>
                <button
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    onClick={handleEnrichAppointments}
                >
                    Check Appointments
                </button>

                <button
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    onClick={handleOptimization}
                >
                    Start Optimization
                </button>
            </div>

            {/* Vertical Days List */}
            <div className="flex flex-col gap-3">
                {weekDates.map((date, idx) => {
                    const dateKey = date.toDate().toDateString();
                    const sc = scenariosByDate.get(dateKey);
                    const appointment = enrichedAppointmentsByDate[dateKey];
                    console.log('appointment', appointment);

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
                                Enriched: {enrichedAppointmentsByDate[sc.date] ? JSON.stringify(enrichedAppointmentsByDate[sc.date].all_valid) : 'Not enriched'}
                                <br />
                                Solution: {solutionByDate[sc.date] ? 'Success' : 'No solution yet'}
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
