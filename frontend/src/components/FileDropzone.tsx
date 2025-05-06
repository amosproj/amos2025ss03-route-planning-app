import { Typography } from '@mui/joy';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useDispatch } from 'react-redux';
import { setScenarios } from '../store/scenariosSlice';
import { parseScenarioFromCsv } from '../utils/helper';

const FileDropzone = () => {
  const dispatch = useDispatch();
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    console.log('Selected file:', file);
    try {
      const text = await file.text();
      const parsed = parseScenarioFromCsv(text);
      console.log('Parsed scenarios:', parsed);

      // Dispatch to Redux store and persist
      dispatch(setScenarios(parsed));
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Failed to read the file. Please try again with a valid file.');
    }

    const formData = new FormData();
    formData.append('file', file);

  }, [dispatch]);

  const { acceptedFiles, getRootProps, getInputProps, isDragActive } =
    useDropzone({
      onDrop,
      accept: {
        'text/csv': ['.csv'],
        'application/vnd.ms-excel': ['.xls'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
          '.xlsx',
        ],
      },
      maxFiles: 1,
    });

  const files = acceptedFiles.map((file) => (
    <span key={file.path}>
      {file.name} - {file.size} bytes
    </span>
  ));
  return (
    <section>
      <div
        {...getRootProps()}
        style={{
          border: '2px dashed #ccc',
          padding: '40px',
          textAlign: 'center',
          cursor: 'pointer',
          borderRadius: '8px',
        }}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the file here...</p>
        ) : (
          <p>Drag & drop a CSV or Excel file here, or click to select</p>
        )}
        <Typography color="primary">{files}</Typography>
      </div>
    </section>
  );
};

export default FileDropzone;
