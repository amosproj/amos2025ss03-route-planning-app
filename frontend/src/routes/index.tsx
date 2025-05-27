import { createFileRoute } from '@tanstack/react-router';
import FileDropzone from '../components/FileDropzone';

import { setScenarios } from '../store/scenariosSlice';
import { setCompanyInfo } from '../store/companyInfoSlice';
import { parseScenarioFromCsv, parseCompanyInfoFromCsv } from '../utils/helper';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

import { useCallback, useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { CompanyInfo } from '../types/CompanyInfo';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  const dispatch = useDispatch();
  const scenarios = useSelector((state: RootState) => state.scenarios.scenarios);

  // track default companyInfo to apply across all scenarios
  const [defaultCompanyInfo, setDefaultCompanyInfo] = useState<CompanyInfo | null>(null);

  // apply defaults when scenarios or uploaded defaults change
  useEffect(() => {
    if (defaultCompanyInfo) {
      scenarios.forEach(scenario => {
        dispatch(setCompanyInfo({ date: scenario.date.toString(), companyInfo: defaultCompanyInfo }));
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

        dispatch(setScenarios(parsed));
      } catch (error) {
        console.error('Error reading appointment file:', error);
        alert('Failed to read appointment file.');
      }
    },
    [dispatch],
  );

  const handleWorkersDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      try {
        const text = await file.text();
        const companyInfo = parseCompanyInfoFromCsv(text);
        console.log('Parsed company info:', companyInfo);
        // set uploaded data as default for all scenarios
        setDefaultCompanyInfo(companyInfo);
      } catch (error) {
        console.error('Error reading worker file:', error);
        alert('Failed to read worker file.');
      }
    },
    [],
  );

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
    </div>
  );
}
