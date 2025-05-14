import { useDropzone } from 'react-dropzone';

type FileDropzoneProps = {
  onDrop: (files: File[]) => void;
};

const FileDropzone: React.FC<FileDropzoneProps> = ({ onDrop }) => {
  const { acceptedFiles, getRootProps, getInputProps, isDragActive } =
    useDropzone({
      onDrop,
      accept: {
        'text/csv': ['.csv'],
        // 'application/vnd.ms-excel': ['.xls'],
        // 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
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
          <p>Drag & drop a CSV file here, or click to select</p>
        )}
        <p className="text-blue-400">{files}</p>
      </div>
    </section>
  );
};

export default FileDropzone;
