import { Calendar } from '@/components/Calendar'
import { createFileRoute } from '@tanstack/react-router'
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useEffect, useMemo, useState } from 'react';
import { Appointment } from '../../types/Appointment';
import { Scenario } from '../../types/Scenario';
import { useNavigate } from '@tanstack/react-router';
import { ColumnDef } from "@tanstack/react-table";

// type Job
export type Job = {
  appointment_start: string;
  appointment_end: string;
  address: {
    street: string;
    zip_code: string;
    city: string;
  };
  number_of_workers: number;
  service_time: number;
  skills: string[] | null;
};


const columns: ColumnDef<Job>[] = [
  {
    accessorKey: "appointment_start",
    header: "Start",
    cell: ({ row }) => {
      const start = new Date(row.original.appointment_start);
      return start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    },
  },
  {
    accessorKey: "appointment_end",
    header: "End",
    cell: ({ row }) => {
      const end = new Date(row.original.appointment_end);
      return end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    },
  },
  {
    header: "Address",
    accessorFn: (row) =>
      `${row.address.street}, ${row.address.zip_code} ${row.address.city}`,
    cell: ({ getValue }) => getValue<string>(),
  },
  {
    header: "Workers",
    accessorKey: "number_of_workers",
    cell: ({ getValue }) => getValue<number>(),
  },
];


import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/DataTable';

export const Route = createFileRoute('/calender-test/')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Scenario | null>(null);
  const scenarios = useSelector((s: RootState) => s.scenarios.scenarios);
  const solutions = useSelector((state: RootState) => state.solutions.byDate);

  // const sorted = [...scenarios].sort((a, b) => a.date - b.date);
  const sorted = useMemo(() => {
    return [...scenarios]
      .map((item) => ({
        ...item,
        solution: !!solutions[`"${item.date}"`],
      }))
      .sort((a, b) => a.date - b.date);
  }, [scenarios, solutions]);

  // Map dates to scenarios
  const dateMap = new Map(
    sorted.map((sc) => [new Date(sc.date).toDateString(), sc]),
  );

  useEffect(() => {
    console.log("selected----", selected)
  }, [selected])

  return (
    <div>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Calendar Test</h1>
        <Calendar dateMap={dateMap} setSelected={setSelected} navigate={navigate} />
      </div>
      <Dialog open={!!selected} onOpenChange={(isOpen) => !isOpen && setSelected(null)}>
        {selected && (
          <DialogContent className="w-full max-w-5xl h-[85vh] overflow-y-auto scroll flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-center w-full">
                {new Date(selected.jobs[0].appointment_start).toDateString()}
              </DialogTitle>
            </DialogHeader>

            <DataTable columns={columns} data={selected.jobs} />

          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
