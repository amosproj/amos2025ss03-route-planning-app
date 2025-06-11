import { createFileRoute, useNavigate } from '@tanstack/react-router';
import FileDropzone from '../components/FileDropzone';

import { setScenarios } from '../store/scenariosSlice';
import { setCompanyInfo } from '../store/companyInfoSlice';
import { parseScenarioFromCsv, parseCompanyInfoFromCsv } from '../utils/helper';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

import { useCallback, useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { CompanyInfo } from '../types/CompanyInfo';
import { Button } from '@/components/ui/button';
import { CalendarDays } from 'lucide-react';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const scenarios = useSelector(
    (state: RootState) => state.scenarios.scenarios,
  );

  const [defaultCompanyInfo, setDefaultCompanyInfo] =
    useState<CompanyInfo | null>(null);
  const [appointmentsUploaded, setAppointmentsUploaded] = useState(false);
  const [companyInfoUploaded, setCompanyInfoUploaded] = useState(false);
  const [uploadedYear, setUploadedYear] = useState<number | null>(null);
  const [uploadedMonth, setUploadedMonth] = useState<number | null>(null);

  useEffect(() => {
    if (defaultCompanyInfo) {
      scenarios.forEach((scenario) => {
        dispatch(
          setCompanyInfo({
            date: scenario.date.toString(),
            companyInfo: defaultCompanyInfo,
          }),
        );
      });
    }
  }, [scenarios, defaultCompanyInfo, dispatch]);

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

  const handleWorkersDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    try {
      const text = await file.text();
      const companyInfo = parseCompanyInfoFromCsv(text);
      console.log('Parsed company info:', companyInfo);
      setDefaultCompanyInfo(companyInfo);
      setCompanyInfoUploaded(true);
    } catch (error) {
      console.error('Error reading worker file:', error);
      alert('Failed to read worker file.');
    }
  }, []);

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

  const canViewScenarios = appointmentsUploaded && companyInfoUploaded;

  return (
    <div className="container mt-8">
      <div>
        <h3 className="font-bold text-2xl p-1">Upload Appointment Data</h3>
        <FileDropzone onDrop={handleAppointmentsDrop} />
      </div>

      <div className="mt-8">
        <h3 className="font-bold text-2xl p-1">Upload Company Info</h3>
        <FileDropzone onDrop={handleWorkersDrop} />
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
