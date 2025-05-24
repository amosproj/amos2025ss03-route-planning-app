import { createFileRoute } from '@tanstack/react-router';
import FileDropzone from '../components/FileDropzone';

import { setScenarios } from '../store/scenariosSlice';
import { setCompanyInfo } from '../store/companyInfoSlice';
import { parseScenarioFromCsv, parseCompanyInfoFromCsv } from '../utils/helper';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  const dispatch = useDispatch();
  const scenarios = useSelector((state: RootState) => state.scenarios.scenarios);

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
        // apply as defaults for all scenarios by date
        scenarios.forEach((scenario) => {
          dispatch(setCompanyInfo({ date: scenario.date.toString(), companyInfo }));
        });
      } catch (error) {
        console.error('Error reading worker file:', error);
        alert('Failed to read worker file.');
      }
    },
    [dispatch, scenarios],
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
