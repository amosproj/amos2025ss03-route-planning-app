import { createFileRoute, useNavigate } from '@tanstack/react-router';
import FileDropzone from '../components/FileDropzone';

import { setScenarios } from '../store/scenariosSlice';
import { setCompanyInfo } from '../store/companyInfoSlice';
import { parseScenarioFromCsv } from '../utils/helper';

import { useCallback, useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { CompanyInfo } from '../types/CompanyInfo';
import { Button } from '@/components/ui/button';
import { CalendarDays } from 'lucide-react';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  return <LandingPage />;
}

function LandingPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const [defaultCompanyInfo] =
    useState<CompanyInfo | null>(null);
  const [appointmentsUploaded, setAppointmentsUploaded] = useState(false);
  const [uploadedYear, setUploadedYear] = useState<number | null>(null);
  const [uploadedMonth, setUploadedMonth] = useState<number | null>(null);

  useEffect(() => {
    if (defaultCompanyInfo) {
      dispatch(setCompanyInfo(defaultCompanyInfo));
    }
  }, [defaultCompanyInfo, dispatch]);

  const handleAppointmentsDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      try {
        const text = await file.text();
        const parsed = parseScenarioFromCsv(text);
        console.log('Parsed scenarios:', parsed);

        if (parsed.length > 0) {
          const firstDate = new Date(parsed[0].date);
          setUploadedYear(firstDate.getFullYear());
          setUploadedMonth(firstDate.getMonth());
        }

        dispatch(setScenarios(parsed));
        setAppointmentsUploaded(true);
      } catch (error) {
        console.error('Error reading appointment file:', error);
        alert('Failed to read appointment file.');
      }
    },
    [dispatch],
  );


  const handleViewScenarios = () => {
    if (uploadedYear === null || uploadedMonth === null) {
      alert('Year or month not found from uploaded data.');
      return;
    }

    navigate({
      to: '/scenarios',
      search: {
        year: uploadedYear,
        month: uploadedMonth,
      },
    });
  };

  const canViewScenarios = appointmentsUploaded;

  return (
    <div className="max-w-5xl mx-auto mt-6 bg-white rounded-lg border shadow p-4">
      <div>
        <h3 className="font-bold text-2xl p-1 mb-2">Upload Appointment Data</h3>
        <FileDropzone onDrop={handleAppointmentsDrop} />
      </div>

      <div className="mt-3 text-center">
        <Button
          size="lg"
          variant="outline"
          disabled={!canViewScenarios}
          onClick={handleViewScenarios}
          className={`mt-6 bg-sky-50 text-sky-900 font-semibold px-4 py-1.5 rounded-sm text-sm shadow-sm 
          ${canViewScenarios ? 'hover:bg-sky-100 hover:text-sky-900 hover:border-sky-700' : 'opacity-50 cursor-not-allowed'}`}
        >
          <CalendarDays className="mr-2" /> View Appointments Scenario
        </Button>
      </div>
    </div>
  );
}
