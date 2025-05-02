import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/map-view/')({
  component: MapView,
});

function MapView() {
  return <div>Hello "/map-view/"!</div>;
}
