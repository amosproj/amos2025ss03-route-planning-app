import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/worker-view/')({
  component: WorkerView,
});

function WorkerView() {
  return <div>Hello "/worker-view/"!</div>;
}
