import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/map-view/')({
  component: MapView,
});

function MapView() {
  return <div className="text-primary">Hello "/map-view/"!</div>;
}
