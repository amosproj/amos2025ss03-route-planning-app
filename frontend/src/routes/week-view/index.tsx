import {
  createFileRoute,
  useSearch,
  useNavigate,
} from '@tanstack/react-router';
import dayjs from 'dayjs';
import { useState } from 'react';
import { AppointmentScheduler } from '@/components/AppointmentScheduler';
import { getStartOfWeek, getWeekStartingSunday } from '@/utils/helper';

export const Route = createFileRoute('/week-view/')({
  component: WeekViewPage,
  validateSearch: (search) => {
    const year = parseInt(search.year as string) || dayjs().year();
    const week =
      parseInt(search.week as string) || getWeekStartingSunday(dayjs()).week;
    return { year, week };
  },
});



function WeekViewPage() {
  const { year, week } = useSearch({ from: '/week-view/' });
  const navigate = useNavigate({ from: '/week-view' });

  const [selectedDates, setSelectedDates] = useState(() => {
    const startOfWeek = getStartOfWeek(year, week);
    return Array.from({ length: 7 }, (_, i) =>
      startOfWeek.add(i, 'day')
    );
  });

  const handleWeekChange = (newDates: dayjs.Dayjs[]) => {
    setSelectedDates(newDates);
    // Extract week and year from the new dates to update URL
    const firstDate = newDates[0];
    const weekInfo = getWeekStartingSunday(firstDate);
    navigate({ search: { week: weekInfo.week, year: weekInfo.year } });
  };

  return (
    <AppointmentScheduler
      dates={selectedDates}
      showBackButton={true}
      showWeekNavigation={true}
      onWeekChange={handleWeekChange}
    />
  );
}