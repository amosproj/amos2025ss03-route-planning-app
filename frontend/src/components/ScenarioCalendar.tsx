import { useEffect, useMemo } from 'react'
import dayjs from 'dayjs'
import weekday from 'dayjs/plugin/weekday'
import isoWeek from 'dayjs/plugin/isoWeek'
import localeData from 'dayjs/plugin/localeData'
import { ChevronLeft, ChevronRight, Map, MapPin, Table } from 'lucide-react'
import { useSearch, useNavigate } from '@tanstack/react-router'
import { ScenarioByDate } from '@/types/Scenario'

dayjs.extend(weekday)
dayjs.extend(isoWeek)
dayjs.extend(localeData)

const months = dayjs.months()
const years = Array.from({ length: 10 }, (_, i) => dayjs().year() - 5 + i)

export function ScenarioCalendar({ scenariosByDate, setSelected }: {
    scenariosByDate: Map<string, ScenarioByDate>
    setSelected: React.Dispatch<React.SetStateAction<ScenarioByDate | null>>
}) {

    const search = useSearch({ from: '/scenarios/' })
    const navigate = useNavigate({ from: '/scenarios' })

    // Set initial date from query params or fallback to today
    const currentDate = useMemo(() => {
        const year = search.year ?? dayjs().year()
        const month = search.month ?? dayjs().month()
        return dayjs().year(year).month(month)
    }, [search.year, search.month])

    useEffect(() => {
        const now = dayjs()
        const shouldUpdate =
            typeof search.year === 'undefined' || typeof search.month === 'undefined'

        if (shouldUpdate) {
            navigate({
                search: {
                    year: search.year ?? now.year(),
                    month: search.month ?? now.month(),
                },
                replace: true, // avoid adding to browser history
            })
        }
    }, [search.year, search.month, navigate])

    const today = dayjs()
    const startOfMonth = currentDate.startOf('month')
    const endOfMonth = currentDate.endOf('month')

    const startDate = startOfMonth.weekday(0) // Monday
    const endDate = endOfMonth.weekday(6) // Sunday

    const days = []
    let date = startDate

    while (date.isBefore(endDate) || date.isSame(endDate)) {
        days.push(date)
        date = date.add(1, 'day')
    }
    const setQuery = (date: dayjs.Dayjs) => {
        navigate({ search: { year: date.year(), month: date.month() } })
    }

    const handlePrevMonth = () => setQuery(currentDate.subtract(1, 'month'))
    const handleNextMonth = () => setQuery(currentDate.add(1, 'month'))
    const handleCurrentMonth = () => setQuery(dayjs())

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
        setQuery(currentDate.month(parseInt(e.target.value)))
    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
        setQuery(currentDate.year(parseInt(e.target.value)))

    return (
        <div className="max-w-4xl mx-auto bg-orange-50 rounded-lg shadow border-t-4 border-orange-400 p-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-2">
                <div className="flex items-center gap-2">
                    <button onClick={handlePrevMonth} className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 cursor-pointer">
                        <ChevronLeft />
                    </button>
                    <button onClick={handleCurrentMonth} className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-400 cursor-pointer">
                        Current
                    </button>
                    <button onClick={handleNextMonth} className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 cursor-pointer">
                        <ChevronRight />
                    </button>
                </div>

                <h2 className="text-xl font-bold">
                    {currentDate.format('MMMM YYYY')}
                </h2>

                <div className="flex items-center gap-2">
                    <select
                        className="border-2 rounded p-1"
                        value={currentDate.month()}
                        onChange={handleMonthChange}
                    >
                        {months.map((month, i) => (
                            <option key={month} value={i}>
                                {month}
                            </option>
                        ))}
                    </select>
                    <select
                        className="border-2 rounded p-1"
                        value={currentDate.year()}
                        onChange={handleYearChange}
                    >
                        {years.map((year) => (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 text-center font-bold text-gray-600 mb-2 text-xl font-serif">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day}>{day}</div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 w-['100px'] h-['100px']">
                {days.map((day) => {
                    const isCurrentMonth = day.month() === currentDate.month()
                    const isToday = day.isSame(today, 'day')
                    const dateKey = day.toDate().toDateString();
                    const sc = scenariosByDate.get(dateKey);
                    return (
                        <div
                            key={day.format('YYYY-MM-DD')}
                            className={`
                                aspect-square w-full rounded transition-all
                                ${isToday ? 'bg-green-500 text-white font-bold' : ''}
                                 ${!isCurrentMonth ? 'bg-gray-200 text-gray-500' : ''}
                                ${isCurrentMonth && !isToday ? 'bg-blue-100 text-blue-900' : ''}
                                ${!isCurrentMonth ? 'text-gray-400' : ''}
                                `}
                        >
                            {isCurrentMonth && <div className='p-2 flex flex-col justify-between h-full'>

                                <div className='text-xl font-bold'>
                                    {day.date()}
                                </div>

                                {sc && (
                                    <>
                                        <div
                                            className="flex items-center gap-1 px-2 py-1 mt-2 rounded bg-blue-900 text-primary-foreground text-xs font-medium cursor-pointer hover:bg-blue-900/50"
                                            onClick={() => setSelected(sc)}
                                        >
                                            <MapPin className="h-4 w-4" />
                                            {sc.jobs.length} jobs
                                        </div>
                                        <div className='flex justify-end items-center gap-1'>

                                            {sc?.solution && <div className='cursor-pointer p-0.5 border rounded bg-white hover:opacity-60'>
                                                <Table className="h-4.5 w-4.5" />
                                            </div>}
                                            <div className='cursor-pointer p-0.5 border rounded bg-white hover:opacity-60'
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
                                    </>
                                )}
                            </div>}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
