import { createFileRoute, useSearch } from '@tanstack/react-router';
import dayjs from 'dayjs';
import { z } from 'zod';
import { AppointmentScheduler } from '@/components/AppointmentScheduler';

export const Route = createFileRoute('/multi-days-view/')({
  validateSearch: z.object({
    dates: z.string().optional(),
  }),
  component: MultiDaysViewPage,
});

function MultiDaysViewPage() {
  const search = useSearch({ from: "/multi-days-view/" });
  const rawDates = search.dates?.split(',') ?? [];
  const selectedDates = rawDates.map((ts) => dayjs(Number(ts)));

  return (
    <AppointmentScheduler
      dates={selectedDates}
      showBackButton={true}
    />
  );
}