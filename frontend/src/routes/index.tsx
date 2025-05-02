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
      <FileDropzone />
    </div>
  );
}
