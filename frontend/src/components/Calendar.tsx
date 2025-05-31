import { useState } from 'react'
import dayjs from 'dayjs'
import weekday from 'dayjs/plugin/weekday'
import isoWeek from 'dayjs/plugin/isoWeek'
import localeData from 'dayjs/plugin/localeData'
import { ArrowRight, Map, MapPin, Table } from 'lucide-react'
import { Button } from './ui/button'

dayjs.extend(weekday)
dayjs.extend(isoWeek)
dayjs.extend(localeData)

const months = dayjs.months()
const years = Array.from({ length: 10 }, (_, i) => dayjs().year() - 5 + i)

export function Calendar({ dateMap, setSelected, navigate }) {
    console.log("dateMap----", dateMap)
    const [currentDate, setCurrentDate] = useState(dayjs())
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

    const handlePrevMonth = () => setCurrentDate(currentDate.subtract(1, 'month'))
    const handleNextMonth = () => setCurrentDate(currentDate.add(1, 'month'))
    const handleToday = () => setCurrentDate(dayjs())
    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
        setCurrentDate(currentDate.month(parseInt(e.target.value)))
    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
        setCurrentDate(currentDate.year(parseInt(e.target.value)))

    return (
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
                <div className="flex items-center gap-2">
                    <button onClick={handlePrevMonth} className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300">
                        &lt;
                    </button>
                    <button onClick={handleToday} className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600">
                        Current
                    </button>
                    <button onClick={handleNextMonth} className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300">
                        &gt;
                    </button>
                </div>

                <h2 className="text-xl font-bold">
                    {currentDate.format('MMMM YYYY')}
                </h2>

                <div className="flex items-center gap-2">
                    <select
                        className="border rounded p-1"
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
                        className="border rounded p-1"
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
            <div className="grid grid-cols-7 text-center font-medium text-gray-600 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day}>{day}</div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 w-['100px'] h-['100px']">
                {days.map((day) => {
                    const isCurrentMonth = day.month() === currentDate.month()
                    const isToday = day.isSame(today, 'day')
                    const r_day = day.toDate().toDateString();
                    const sc = dateMap.get(r_day);
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
                            {isCurrentMonth && <div className='p-2'>
                                <div className='flex justify-between items-center'>
                                    <span className='text-xl font-semibold'>{day.date()}</span>
                                    <div className='flex items-center gap-1'>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                                navigate({
                                                    to: '/map-view',
                                                    search: { date: sc.date.toString() },
                                                })
                                            }
                                        >
                                            <Table className="h-4 w-4" />
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                                navigate({
                                                    to: '/map-view',
                                                    search: { date: sc.date.toString() },
                                                })
                                            }
                                        >
                                            <Map className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    {/* <ArrowRight className="h-4 w-4" /> */}
                                </div>
                                {sc && (
                                    <span
                                        className="flex items-center gap-1 px-2 py-1 mt-2 rounded bg-primary text-primary-foreground text-xs font-medium"
                                        onClick={() => setSelected(sc)}
                                    >
                                        <MapPin className="h-4 w-4" />
                                        {sc.jobs.length} jobs
                                    </span>
                                )}
                            </div>}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
