"use client";

import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

export function CalendarDateRangePicker({
  dateRange,
  setDateRange,
}: {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
}) {
  const formatted =
    dateRange.from && dateRange.to
      ? `${format(dateRange.from, "LLL dd")} - ${format(dateRange.to, "LLL dd")}`
      : "Pick a date range";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-left font-normal">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatted}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="range"
          selected={dateRange}
          onSelect={setDateRange}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
}
