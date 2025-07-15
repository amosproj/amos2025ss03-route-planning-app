import { ScenarioCalendar } from '@/components/ScenarioCalendar'
import { createFileRoute } from '@tanstack/react-router'
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useEffect, useMemo, useState } from 'react';
import { Appointment } from '../../types/Appointment';
import { ColumnDef } from "@tanstack/react-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DataTable } from '@/components/DataTable';
import { z } from 'zod'
import { ScenarioByDate } from '@/types/Scenario';

// data table columns 
const columns: ColumnDef<Appointment>[] = [
  {
    header: "Time",
    accessorFn: (row) => {
      const start = new Date(row.appointment_start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const end = new Date(row.appointment_end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      return `${start} - ${end}`;
    },
    cell: ({ getValue }) => getValue<string>(),
  },
  {
    header: "Workers",
    accessorKey: "number_of_workers",
    cell: ({ getValue }) => getValue<number>(),
  },
  {
    header: "Service Time",
    accessorKey: "service_time",
    cell: ({ getValue }) => getValue<number>(),
  },
  {
    header: "Skill Needed",
    accessorKey: "skills_needed",
    cell: ({ getValue }) => {
      const skills = getValue<string[]>();
      return skills?.length > 0 ? skills.join(', ') : 'None';
    },
  },
  {
    header: "Address",
    accessorFn: (row) =>
      `${row.address.street}, ${row.address.zip_code} ${row.address.city}`,
    cell: ({ getValue }) => getValue<string>(),
  },
];

export const Route = createFileRoute('/scenarios/')({
  component: ScenarioList,
  // Define expected search params
  validateSearch: z.object({
    year: z.coerce.number().optional(),
    month: z.coerce.number().optional(),
  }),
})

function ScenarioList() {
  const [selected, setSelected] = useState<ScenarioByDate | null>(null);
  const scenarios = useSelector((s: RootState) => s.scenarios.scenarios);
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

  useEffect(() => {
    console.log(selected);
  }, [selected]);


  return (
    <div>
      <div className="p-4">
        <ScenarioCalendar scenariosByDate={scenariosByDate} setSelected={setSelected} />
      </div>
      <Dialog open={!!selected} onOpenChange={(isOpen) => !isOpen && setSelected(null)}>
        {selected && (
          <DialogContent className="sm:max-w-2xl h-[85vh] overflow-y-auto scroll flex flex-col">
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
