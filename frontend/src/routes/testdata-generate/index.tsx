import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { CalendarDateRangePicker } from "@/components/ui/date-range-picker";
import { subDays } from "date-fns";
import dayjs from "dayjs";
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { Slider } from "@/components/ui/slider";
import apiClient from '@/utils/apiClient';
import { useMutation } from "@tanstack/react-query";
import { ToastContainer, toast } from 'react-toastify';
import { Progress } from "@/components/ui/progress";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { setScenarios } from "@/store/scenariosSlice";


dayjs.extend(isSameOrBefore);

export const Route = createFileRoute("/testdata-generate/")({
  component: TestDataGeneratePage,
});

function TestDataGeneratePage() {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });

  const dispatch = useDispatch<AppDispatch>();
  const scenarios = useSelector((s: RootState) => s.scenarios.scenarios)

  const [appointmentRange, setAppointmentRange] = useState<[number, number]>([10, 50]);
  const [progress, setProgress] = useState(0);

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
      const res = await apiClient.post('/api/testdata/optimization-request', payload);
      return res.data;
    },
  });

  const handleSubmit = async () => {
    if (!dateRange.from || !dateRange.to) {
      toast("Date range is incomplete.");
      return;
    }

    const start = dayjs(dateRange.from);
    const end = dayjs(dateRange.to);

    const totalDays = end.diff(start, "day") + 1;
    let processed = 0;

    for (let d = start; d.isSameOrBefore(end); d = d.add(1, "day")) {
      const payload = {
        number_of_appointments: getRandomInt(appointmentRange[0], appointmentRange[1]),
        number_of_vehicles: 20,
        appointment_duration_factor: 3.0,
        month: d.month() + 1,
        day: d.date(),
      };

      try {
        const response = await generateTestDataMutation.mutateAsync(payload);
        toast(
          `✅ Success for ${payload.month}/${payload.day}`
        );
        console.log(`Generated data for ${payload.month}/${payload.day}`, response);
        const { appointments, conpany_info } = response;
        const scenario = {
          date: new Date(2025, d.month(), d.day() + 1).getTime(), // timestamp
          jobs: appointments,
          vehicles: [
            {
              vehicle_id: 0,
              skills: "",
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
        dispatch(setScenarios([...scenarios, scenario]));
        console.log(`Scenario for ${d.format('YYYY-MM-DD')}:`, scenario);
      } catch (error) {
        toast(
          `❌ Failed for ${payload.month}/${payload.day}`
        );
      }

      processed += 1;
      setProgress((processed / totalDays) * 100);
    }

    toast("🎉 Test data generation complete!");
  };


  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <ToastContainer
        position="top-right"
        autoClose={5000}
      />
      <Progress value={progress} className="h-2" />
      <h1 className="text-2xl font-bold">Test Data Generator</h1>

      <div>
        <label className="block mb-2 font-medium">Date Range</label>
        <CalendarDateRangePicker
          dateRange={dateRange}
          setDateRange={setDateRange}
        />
      </div>

      <div>
        <label className="block mb-1 font-medium">Number of Appointments (Range)</label>
        <div className="text-sm text-muted-foreground mb-2">
          {appointmentRange[0]} to {appointmentRange[1]} appointments per day
        </div>
        <Slider
          min={1}
          max={100}
          step={1}
          value={appointmentRange}
          onValueChange={(vals) => setAppointmentRange(vals as [number, number])}
        />
      </div>

      <Button onClick={handleSubmit} disabled={generateTestDataMutation.isPending}>
        {generateTestDataMutation.isPending ? "Sending..." : "Generate Test Data"}
      </Button>
    </div>
  );
}
