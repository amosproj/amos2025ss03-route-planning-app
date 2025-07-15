import { Fragment, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import isoWeek from 'dayjs/plugin/isoWeek';
import localeData from 'dayjs/plugin/localeData';
import { ArrowRight, ChevronLeft, ChevronRight, Map, MapPin, Table } from 'lucide-react';
import { useSearch, useNavigate } from '@tanstack/react-router';
import { ScenarioByDate } from '@/types/Scenario';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Switch } from './ui/switch';
import { Label } from './ui/label';

dayjs.extend(weekday);
dayjs.extend(isoWeek);
dayjs.extend(localeData);

const months = dayjs.months();
const years = Array.from({ length: 10 }, (_, i) => dayjs().year() - 5 + i);

export function ScenarioCalendar({
  scenariosByDate,
  setSelected,
}: {
  scenariosByDate: Map<string, ScenarioByDate>;
  setSelected: React.Dispatch<React.SetStateAction<ScenarioByDate | null>>;
}) {
  const search = useSearch({ from: '/scenarios/' });
  const navigate = useNavigate({ from: '/scenarios' });

  const currentDate = useMemo(() => {
    const year = search.year ?? dayjs().year();
    const month = search.month ?? dayjs().month();
    return dayjs().year(year).month(month);
  }, [search.year, search.month]);

  useEffect(() => {
    const now = dayjs();
    const shouldUpdate =
      typeof search.year === 'undefined' || typeof search.month === 'undefined';

    if (shouldUpdate) {
      navigate({
        search: {
          year: search.year ?? now.year(),
          month: search.month ?? now.month(),
        },
        replace: true,
      });
    }
  }, [search.year, search.month, navigate]);

  const today = dayjs();
  const startOfMonth = currentDate.startOf('month');
  const endOfMonth = currentDate.endOf('month');

  const startDate = startOfMonth.weekday(0); // Monday
  const endDate = endOfMonth.weekday(6); // Sunday

  const days: dayjs.Dayjs[] = [];
  let date = startDate;

  while (date.isBefore(endDate) || date.isSame(endDate)) {
    days.push(date);
    date = date.add(1, 'day');
  }

  const setQuery = (date: dayjs.Dayjs) => {
    navigate({ search: { year: date.year(), month: date.month() } });
  };

  const handlePrevMonth = () => setQuery(currentDate.subtract(1, 'month'));
  const handleNextMonth = () => setQuery(currentDate.add(1, 'month'));
  const handleToday = () => setQuery(dayjs());

  const getCalendarWeekNumber = (sunday: dayjs.Dayjs) => {
    return sunday.add(1, 'day').isoWeek();
  };

  const [multipleSelection, setMultipleSelection] = useState(false);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  return (

    <div className="max-w-5xl mx-auto mt-2 bg-white rounded-lg border shadow p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-2">
        <div className="flex items-center gap-2 ">
          <button
            onClick={handlePrevMonth}
            className="px-3 py-1.5 rounded-md border hover:bg-gray-100  text-black cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNextMonth}
            className="px-3 py-1.5 rounded-md border  hover:bg-gray-100 text-black cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-md border  hover:bg-gray-100  text-black text-sm cursor-pointer"
          >
            Today
          </button>

          {/* multiple selection button */}
          {/* <Button
            size={"sm"}
            onClick={
              () => setMultipleSelection(!multipleSelection)
            }
            className="" variant={multipleSelection ? 'outline' : 'default'
            }
          >
            Multiple Selection
          </Button> */}
          <div className="flex items-center space-x-2">
            <Switch
              id='multiple-selection'
              className='cursor-pointer'
              checked={multipleSelection}
              onCheckedChange={
                () => setMultipleSelection(!multipleSelection)
              }
            />
            <Label htmlFor='multiple-selection'>Multiple Selection</Label>
          </div>
        </div>

        <h2 className="text-xl font-bold text-black">
          {currentDate.format('MMMM YYYY')}
        </h2>

        <div className="flex items-center gap-2">
          {/* Month Select */}
          <Select
            value={currentDate.month().toString()}
            onValueChange={(val) => setQuery(currentDate.month(parseInt(val)))}
          >
            <SelectTrigger className="w-[120px] cursor-pointer">
              <SelectValue
                placeholder="Select month"
                defaultValue={months[currentDate.month()]}
              />
            </SelectTrigger>
            <SelectContent>
              {months.map((month, i) => (
                <SelectItem key={month} value={i.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Year Select */}
          <Select
            value={currentDate.year().toString()}
            onValueChange={(val) => setQuery(currentDate.year(parseInt(val)))}
          >
            <SelectTrigger className="w-[100px] cursor-pointer">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-[35px_repeat(7,_1fr)] text-center font-semibold text-gray-900 mb-2 text-xl">
        <div></div> {/* week number column header */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Days Grid with week numbers */}
      <div className="grid grid-cols-[35px_repeat(7,_1fr)] gap-1">
        {Array.from({ length: days.length / 7 }).map((_, weekIndex) => {
          const weekDays = days.slice(weekIndex * 7, weekIndex * 7 + 7);
          const sunday = weekDays[0];
          const weekNumber = getCalendarWeekNumber(sunday);

          return (
            <Fragment key={weekIndex}>
              {/* Week number column */}
              <div className="flex justify-center mt-1.5">
                <div
                  className="w-8 h-8 flex justify-center items-center border rounded-full cursor-pointer font-semibold  text-blue-800 bg-blue-50  hover:border-blue-700"
                  onClick={() =>
                    navigate({
                      to: '/week-view',
                      search: {
                        year: weekDays[0].year(),
                        week: weekNumber,
                      },
                    })
                  }
                >
                  {weekNumber}
                </div>
              </div>

              {/* 7 day cells */}
              {weekDays.map((day) => {
                const isCurrentMonth = day.month() === currentDate.month();
                const isToday = day.isSame(today, 'day');
                const dateKey = day.toDate().toDateString();
                const sc = scenariosByDate.get(dateKey);
                const timestamp = day.valueOf().toString();

                return (
                  <div
                    key={day.format('YYYY-MM-DD')}
                    className={`
                        aspect-square w-full rounded transition-all border
                        ${isToday ? 'bg-gray-200 text-gray-900' : ''}
                        ${!isCurrentMonth ? 'bg-white text-gray-400' : ''}
                        ${isCurrentMonth && !isToday ? 'bg-gray-50 text-gray-900' : ''}
                    `}
                  >
                    {isCurrentMonth && (
                      <div className="p-2 flex flex-col justify-between h-full">
                        <div className="flex justify-between items-center gap-2 mb-2 relative">
                          <div className="text-lg font-semibold">
                            {day.date()}
                          </div>
                          <div>
                            {multipleSelection && (
                              <Checkbox
                                checked={selectedDays.includes(timestamp)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedDays((prev) => [...prev, timestamp]);
                                  } else {
                                    setSelectedDays((prev) => prev.filter((d) => d !== timestamp));
                                  }
                                }}
                                aria-label="Select dates"
                                className='bg-white border border-gray-500 cursor-pointer'
                              />
                            )}
                          </div>

                          {sc?.solution && (
                            <span className="absolute -right-1 -top-3 flex size-3">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75"></span>
                              <span className="relative inline-flex size-3 rounded-full bg-teal-600"></span>
                            </span>
                          )}
                        </div>

                        {sc && (
                          <>
                            <div
                              className="flex items-center gap-1 px-2 py-1 mt-2 rounded bg-blue-900 text-white text-xs font-medium cursor-pointer hover:bg-indigo-900"
                              onClick={() => setSelected(sc)}
                            >
                              <MapPin className="h-4 w-4" />
                              {sc.jobs.length} jobs
                            </div>
                            <div className="flex justify-end items-center gap-2">
                              {sc?.solution && (
                                <div
                                  className="cursor-pointer p-1 border rounded bg-amber-50 text-gray-800 hover:border-amber-500 "
                                  onClick={() =>
                                    navigate({
                                      to: '/daily-plan',
                                      search: { date: sc.date.toString() },
                                    })
                                  }
                                >
                                  <Table className="h-5 w-5 text-amber-600" />
                                </div>
                              )}
                              <div
                                className="cursor-pointer p-1 border rounded bg-cyan-50 text-gray-800 hover:border-cyan-700"
                                onClick={() =>
                                  navigate({
                                    to: '/map-view',
                                    search: { date: sc.date.toString() },
                                  })
                                }
                              >
                                <Map className="h-5 w-5 text-cyan-800" />
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </Fragment>
          );
        })}
      </div>
      {/* Optimize button for multiple selection */}
      {multipleSelection && selectedDays.length > 1 && (
        <Button
          className='fixed top-27 right-4 px-4 py-2 bg-blue-900 text-white rounded hover:bg-indigo-900 transition-colors shadow-lg group flex items-center gap-2'
          onClick={() => {
            navigate({
              to: '/multi-days-view',
              search: { dates: selectedDays.join(',') },
            });
          }}
        >
          <span>Continue</span>
          <ArrowRight className="transition-transform duration-200 group-hover:translate-x-1" />
        </Button>
      )}
    </div>
  );
}
