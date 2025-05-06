import { createFileRoute } from '@tanstack/react-router';
import { Button } from "@/components/ui/button"

export const Route = createFileRoute('/map-view/')({
  component: MapView,
});

function MapView() {
  return (
    <div className="flex flex-col items-center justify-center min-h-svh">
      <Button>Click me</Button>
    </div>
  );
}
