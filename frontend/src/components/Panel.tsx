import AppointmentList from '@/components/AppointmentList';
import SolutionList from '@/components/SolutionList';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { RootState } from '@/store';
import type { Appointment } from '@/types/Appointment';
import type { EnhancedAddressResponse } from '@/types/EnhancedAddressResponse';
import { Solution } from '@/types/Solution';
import { AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import VehicleList from '@/components/VehicleList';

interface PanelProps {
  date: string;
  jobs: Appointment[];
  locations: EnhancedAddressResponse[];
  excluded: number[];
  selectedIdx: number | null;
  onSelect: (idx: number) => void;
  onToggleExclude: (idx: number) => void;
  onToggleAll: (selectAll: boolean) => void;
  optimizationErrors: string[];
}

export default function Panel({
  date,
  jobs,
  locations,
  excluded,
  selectedIdx,
  onSelect,
  onToggleExclude,
  onToggleAll,
  optimizationErrors,
}: PanelProps) {
  const solutions = useSelector((state: RootState) => state.solutions);
  const solution: Solution = solutions.byDate[date];
  const [activeTab, setActiveTab] = useState('appointments');
  const [hasUserChangedTab, setHasUserChangedTab] = useState(false);

  useEffect(() => {
    // Only auto-switch to solutions tab if user hasn't manually changed tabs
    if ((solution || optimizationErrors.length > 0) && !hasUserChangedTab) {
      setActiveTab('solutions');
    }
  }, [solution, optimizationErrors, hasUserChangedTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setHasUserChangedTab(true);
  };

  return (
    <div className="flex flex-col h-screen w-90 flex-shrink-0 bg-white shadow-lg overflow-auto rounded-r-lg p-4">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex flex-col flex-1 w-full"
      >
        <TabsList className="mb-4 bg-gray-100 p-1 rounded-lg shadow-inner min-h-min">
          <TabsTrigger
            value="appointments"
            className="text-lg font-semibold  px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-500 data-[state=active]:shadow-md hover:bg-gray-200"
          >
            Appointments
          </TabsTrigger>
          <TabsTrigger
          value='fleet'
          className="text-lg font-semibold  px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-500 data-[state=active]:shadow-md hover:bg-gray-200">
            Fleet
          </TabsTrigger>

          <TabsTrigger
            value="solutions"
            disabled={!solution && optimizationErrors.length === 0}
            className="text-lg font-semibold py-2 px-4 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-500 data-[state=active]:shadow-md hover:bg-gray-200"
          >
            Routes
          </TabsTrigger>
        </TabsList>
        <div className="flex-1 flex flex-col min-h-0">
          <TabsContent
            value="appointments"
            className="flex-1 min-h-0 flex flex-col"
          >
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
          <TabsContent value='fleet'>
            <VehicleList date={date} />
          </TabsContent>
          <TabsContent value="solutions" className="h-full">
            {solution && <SolutionList  solution={solution} date={date} />}
            {!solution && optimizationErrors.length > 0 && (
              <div className="flex items-center justify-center">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Errors</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 space-y-1">
                      {optimizationErrors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
