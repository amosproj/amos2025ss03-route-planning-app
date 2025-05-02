import { Typography } from '@mui/joy';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

const FileDropzone = () => {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    console.log('Selected file:', file);

    const formData = new FormData();
    formData.append('file', file);

    // try {
    //   const response = await axios.post("http://localhost:8000/upload", formData, {
    //     headers: {
    //       "Content-Type": "multipart/form-data",
    //     },
    //   });
    //   console.log("Upload successful:", response.data);
    // } catch (error) {
    //   console.error("Upload failed:", error);
    // }
  }, []);

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
