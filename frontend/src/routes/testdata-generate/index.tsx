import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { CalendarDateRangePicker } from '@/components/ui/date-range-picker';
import { subDays } from 'date-fns';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { Slider } from '@/components/ui/slider';
import apiClient from '@/utils/apiClient';
import { useMutation } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store';
import { setScenarios } from '@/store/scenariosSlice';
import { setCompanyInfo } from '@/store/companyInfoSlice';
import { Scenario } from '@/types/Scenario';
import { ProgressAnimation } from '@/components/ui/progressAnimation';

dayjs.extend(isSameOrBefore);

export const Route = createFileRoute('/testdata-generate/')({
  component: TestDataGeneratePage,
});

function TestDataGeneratePage() {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to?: Date | undefined;
  }>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });

  const dispatch = useDispatch<AppDispatch>();
  const scenarios = useSelector((s: RootState) => s.scenarios.scenarios);

  const [appointmentRange, setAppointmentRange] = useState<[number, number]>([
    10, 50,
  ]);
  const [progress, setProgress] = useState(-1);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const getRandomInt = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  const generateTestDataMutation = useMutation({
    mutationFn: async (payload: {
      number_of_appointments: number;
      number_of_vehicles: number;
      appointment_duration_factor: number;
      month: number;
      day: number;
    }) => {
      const res = await apiClient.post(
        '/api/testdata/optimization-request',
        payload,
      );
      return res.data;
    },
  });

  const handleSubmit = async () => {
    if (!dateRange.from || !dateRange.to) {
      setErrorMessages((prev) => [
        ...prev,
        'Please select a complete date range.',
      ]);
      return;
    }

    const start = dayjs(dateRange.from);
    const end = dayjs(dateRange.to);

    const totalDays = end.diff(start, 'day') + 1;
    let processed = 0;
    const newScenarios: Scenario[] = [];

    for (let d = start; d.isSameOrBefore(end); d = d.add(1, 'day')) {
      const payload = {
        number_of_appointments: getRandomInt(
          appointmentRange[0],
          appointmentRange[1],
        ),
        number_of_vehicles: 5,
        appointment_duration_factor: 2.0,
        month: d.month() + 1,
        day: d.date(),
      };

      try {
        const response = await generateTestDataMutation.mutateAsync(payload);
        console.log(
          `Generated data for ${payload.month}/${payload.day}`,
          response,
        );
        const { appointments, company_info } = response;
        const timestamp = d.toDate().getTime();

        const scenario = {
          // date: new Date(2025, d.month(), d.day() + 1).getTime(), // timestamp
          date: timestamp,
          jobs: appointments,
          vehicles: [
            {
              vehicle_id: 0,
              skills: [],
              worker_amount: 1,
              operation_hours: {
                start_minutes: 480,
                end_minutes: 960,
              },
              cost_per_km: 0.5,
              cost_per_hour: 45,
            },
          ],
        };
        newScenarios.push(scenario);
        // Set company info once for all scenarios
        dispatch(setCompanyInfo(company_info));
        console.log(`📦 Scenario for ${d.format('YYYY-MM-DD')}:`, scenario);
      } catch {
        setErrorMessages((prev) => [
          ...prev,
          `Failed to generate data for ${payload.month}/${payload.day}`,
        ]);
        console.error(
          `Failed to generate data for ${payload.month}/${payload.day}`,
        );
        continue;
      }

      processed += 1;
      setProgress((processed / totalDays) * 100);
    }

    dispatch(setScenarios([...scenarios, ...newScenarios]));
    setIsComplete(true);

    setTimeout(() => setProgress(-1), 1000);
    setTimeout(() => setIsComplete(false), 5000);
  };

  return (
    <div className="my-6 max-w-xl mx-auto p-6 space-y-6 bg-white rounded-lg border shadow relative">
      {/* Progress bars */}
      <div className="absolute top-0 left-0 w-full">
        {progress !== -1 && (
          <ProgressAnimation value={progress} className="h-2" />
        )}
      </div>
      <h1 className="text-2xl font-bold">Test Data Generator</h1>

      <div>
        <label className="block mb-2 font-medium">Date Range</label>
        <CalendarDateRangePicker
          dateRange={dateRange}
          setDateRange={setDateRange}
        />
      </div>

      <div>
        <label className="block mb-1 font-medium">
          Number of Appointments (Range)
        </label>
        <div className="text-sm text-muted-foreground mb-2">
          {appointmentRange[0]} to {appointmentRange[1]} appointments per day
        </div>
        <Slider
          min={1}
          max={100}
          step={1}
          value={appointmentRange}
          onValueChange={(vals) =>
            setAppointmentRange(vals as [number, number])
          }
        />
      </div>

      <Button
        className="bg-sky-600 text-white hover:bg-sky-600/90"
        onClick={handleSubmit}
        disabled={generateTestDataMutation.isPending}
      >
        {generateTestDataMutation.isPending
          ? 'Sending...'
          : 'Generate Test Data'}
      </Button>

      {/* Completion message */}
      {isComplete && (
        <div className="mt-4 p-4 bg-green-100 text-green-800 rounded">
          <h2 className="font-semibold">🎉 Test data generation complete!</h2>
        </div>
      )}

      {/* error message  */}
      {errorMessages.length > 0 && (
        <div className="mt-4 p-4 bg-red-100 text-red-800 rounded">
          <h2 className="font-semibold">Errors:</h2>
          <ul className="list-disc pl-5">
            {errorMessages.map((msg, index) => (
              <li key={index}>{msg}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
