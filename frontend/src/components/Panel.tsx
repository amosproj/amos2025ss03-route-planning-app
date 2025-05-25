import * as React from 'react';
import { useSelector } from 'react-redux';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import AppointmentList from '@/components/AppointmentList';
import SolutionList from '@/components/SolutionList';
import type { RootState } from '@/store';
import type { Appointment } from '@/types/Appointment';
import type { EnhancedAddressResponse } from '@/types/EnhancedAddressResponse';
import { Solution } from '@/types/Solution';
import example from '@/assets/NewTestdataSolution.json';

const exampleSolution: Solution = example as unknown as Solution;

interface PanelProps {
  date: string;
  jobs: Appointment[];
  locations: EnhancedAddressResponse[];
  excluded: number[];
  selectedIdx: number | null;
  onSelect: (idx: number) => void;
  onToggleExclude: (idx: number) => void;
}

export default function Panel({ date, jobs, locations, excluded, selectedIdx, onSelect, onToggleExclude }: PanelProps) {
  const solution = exampleSolution;

  return (
    <div className="flex flex-col h-screen w-90 flex-shrink-0 bg-white shadow-lg overflow-auto rounded-r-lg p-4">
      <Tabs defaultValue="appointments" className="flex flex-col flex-1 w-full">
        <TabsList className="mb-6 grid grid-cols-2 bg-gray-100 p-1 rounded-full shadow-inner">
          <TabsTrigger
            value="appointments"
            className="text-lg font-semibold py-2 px-6 rounded-full data-[state=active]:bg-white data-[state=active]:text-blue-500 data-[state=active]:shadow-md hover:bg-gray-200"
          >
            Appointments
          </TabsTrigger>
          <TabsTrigger
            value="solutions"
            disabled={!solution}
            className="text-lg font-semibold py-2 px-6 rounded-full data-[state=active]:bg-white data-[state=active]:text-blue-500 data-[state=active]:shadow-md hover:bg-gray-200"
          >
            Solution
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
            />
          </TabsContent>
          <TabsContent value="solutions" className="h-full ">
            {solution && <SolutionList solution={solution} />}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
