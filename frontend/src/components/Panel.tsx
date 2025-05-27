import * as React from 'react';
import { useSelector } from 'react-redux';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import AppointmentList from '@/components/AppointmentList';
import SolutionList from '@/components/SolutionList';
import type { RootState } from '@/store';
import type { Appointment } from '@/types/Appointment';
import type { EnhancedAddressResponse } from '@/types/EnhancedAddressResponse';
import { Solution } from '@/types/Solution';


interface PanelProps {
  date: string;
  jobs: Appointment[];
  locations: EnhancedAddressResponse[];
  excluded: number[];
  selectedIdx: number | null;
  onSelect: (idx: number) => void;
  onToggleExclude: (idx: number) => void;
  onToggleAll: (selectAll: boolean) => void;
}

export default function Panel({date, jobs, locations, excluded, selectedIdx, onSelect, onToggleExclude, onToggleAll }: PanelProps) {
    const solutions = useSelector((state: RootState) => state.solutions);
    const solution:Solution = solutions.byDate[date]
    // console.log('Panel solution', solution);

  return (
    <div className="flex flex-col h-screen w-90 flex-shrink-0 bg-white shadow-lg overflow-auto rounded-r-lg p-4">
      <Tabs defaultValue="appointments" className="flex flex-col flex-1 w-full">
        <TabsList className="mx-auto mb-4">
          <TabsTrigger
            value="appointments"
            className="text-lg font-semibold  px-6 rounded-full"
          >
            Appointments
          </TabsTrigger>
          <TabsTrigger
            value="solutions"
            disabled={!solution}
            className="text-lg font-semibold  px-6 rounded-full"
          >
            Routes
          </TabsTrigger>
        </TabsList>
        <div className="flex-1 flex flex-col min-h-0">
          <TabsContent value="appointments" className="flex-1 min-h-0 flex flex-col">
            <AppointmentList
              jobs={jobs}
              locations={locations}
              excluded={excluded}
              selectedIdx={selectedIdx}
              onSelect={onSelect}
              onToggleExclude={onToggleExclude}
              onToggleAll={onToggleAll}
            />
          </TabsContent>
          <TabsContent value="solutions" className="h-full ">
            {solution && <SolutionList solution={solution} date={date} />}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
