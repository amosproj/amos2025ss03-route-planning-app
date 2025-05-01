import { createFileRoute } from '@tanstack/react-router'
import FileDropzone from '../components/FileDropzone';


export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function RouteComponent() {

  return (
    <div>
      <FileDropzone />
    </div>
  );
}
