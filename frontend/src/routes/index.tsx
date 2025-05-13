import { RouteInputForm } from '@/components/RouteInputForm';
import { createFileRoute } from '@tanstack/react-router';
import FileDropzone from '../components/FileDropzone';

import { parseScenarioFromCsv, parseWorkerFromCsv } from '../utils/helper';
import { setScenarios } from '../store/scenariosSlice';
import { setWorkers } from '../store/workersSlice';

import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  const dispatch = useDispatch();

  const handleAppointmentsDrop = useCallback(async (acceptedFiles: File[]) => {
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
  }, [dispatch]);

  const handleWorkersDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    try {
      const text = await file.text();
      const parsed = parseWorkerFromCsv(text); // or a different parser
      console.log('Parsed worker', parsed);
      dispatch(setWorkers(parsed));
    } catch (error) {
      console.error('Error reading worker file:', error);
      alert('Failed to read worker file.');
    }
  }, [dispatch]);


  return (
    <div className="container mt-8">
      <div>
        <h3 className="font-bold text-2xl p-1">Upload Appointment Data</h3>
        <FileDropzone onDrop={handleAppointmentsDrop} />
      </div>

      <div className="mt-8">
        <h3 className="font-bold text-2xl p-1">Upload Worker Data</h3>
        <FileDropzone onDrop={handleWorkersDrop} />
      </div>

      <div className="mt-8 p-1">
        <h3 className="font-bold text-2xl mb-2 ">Route & Worker Information</h3>
        <RouteInputForm />
      </div>
    </div>
  );
}
