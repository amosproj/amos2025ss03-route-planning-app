import { RouteInputForm } from '@/components/RouteInputForm';
import { createFileRoute } from '@tanstack/react-router';
import FileDropzone from '../components/FileDropzone';

export const Route = createFileRoute('/')({
  component: Index,
});

function Index() {
  return (
    // <Sheet
    //   sx={{
    //     flex: 1,
    //     padding: '2rem',
    //     maxWidth: '1200px',
    //     margin: '0 auto',
    //     marginTop: '2rem',
    //     width: '100%',
    //     boxSizing: 'border-box',
    //   }}
    // >
    //   <FileDropzone />
    // </Sheet>
    <div className="container mt-8">
      <h3 className="font-bold text-2xl p-1">Upload Data</h3>
      <FileDropzone />

      <div className="mt-8 p-1">
        <h3 className="font-bold text-2xl mb-2 ">Route & Worker Information</h3>
        <RouteInputForm />
      </div>
    </div>
  );
}
