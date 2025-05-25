import { createFileRoute } from '@tanstack/react-router';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
} from '@react-google-maps/api';
import { useEffect, useRef, useState } from 'react';

import { useSelector } from 'react-redux';
import type { RootState } from '@/store';
// import { Solution } from '@/types/Solution';

// Type imports
import type { RouteRequest } from '@/types/RouteRequest';
import type { MarkerData } from '@/types/MarkerData';
import type { DailyPlanRoute as RouteType } from '@/types/DailyPlanRoute';
import type { Waypoint } from '@/types/Waypoint';
const colors = [
  '#FF0000', // Red
  '#0000FF', // Blue
  '#008000', // Green
  '#FFA500', // Orange
  '#800080', // Purple
  '#00FFFF', // Cyan
  '#FFC0CB', // Pink
  '#A52A2A', // Brown
  '#FFFF00', // Yellow
  '#808000', // Olive
  '#00FF00', // Lime
  '#000080', // Navy
  '#FF00FF', // Magenta
  '#808080', // Gray
  '#00CED1', // Dark Turquoise
  '#DA70D6', // Orchid
  '#DC143C', // Crimson
  '#7FFF00', // Chartreuse
  '#D2691E', // Chocolate
  '#4682B4', // Steel Blue
];

export const Route = createFileRoute('/daily-plan/')({
  component: DailyPlan,
});

function DailyPlan() {
  const searchParams = new URLSearchParams(window.location.search);
  const date = searchParams.get('date') || '';
  const solution = useSelector(
    (state: RootState) => state.solutions.byDate[date],
  );

  // Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY!,
    libraries: ['places'],
  });

  // Map refs and state
  const mapRef = useRef<google.maps.Map | null>(null);
  const polylineRefs = useRef<Record<string, google.maps.Polyline>>({});
  const [activeMarker, setActiveMarker] = useState<MarkerData | null>(null);
  const [routes, setRoutes] = useState<RouteType[]>([]);

  // Main effect: fetch directions and draw polylines
  useEffect(() => {
    if (!isLoaded) return;
    const directionsService = new google.maps.DirectionsService();
    const fetchRoute = (route: RouteRequest) => {
      return new Promise<{
        id: string;
        color: string;
        visible: boolean;
        result: google.maps.DirectionsResult;
        appointments: typeof route.appointments;
      }>((resolve, reject) => {
        directionsService.route(
          {
            origin: route.origin,
            destination: route.destination,
            waypoints: route.waypoints,
            travelMode: google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === google.maps.DirectionsStatus.OK && result) {
              resolve({
                id: route.id,
                color: route.color,
                visible: true,
                result,
                appointments: route.appointments,
              });
            } else {
              reject(`Failed to fetch directions for ${route.id}: ${status}`);
            }
          },
        );
      });
    };
    // Build routeRequests from solution
    const routeRequests: RouteRequest[] = solution.routes.map((route, idx) => {
      const waypoints = route.appointments
        .slice(1, -1)
        .map((appt) => ({
          location: { lat: appt.location[0].lat, lng: appt.location[0].lng },
          stopover: true,
        }));
      const originLoc = route.appointments[0].location[0];
      const destinationLoc =
        route.appointments[route.appointments.length - 1].location[0];
      return {
        id: `Route-${route.route_id + 1}`,
        origin: { lat: originLoc.lat, lng: originLoc.lng },
        destination: { lat: destinationLoc.lat, lng: destinationLoc.lng },
        waypoints,
        color: colors[idx % colors.length],
        appointments: route.appointments,
      };
    });

    Promise.all(routeRequests.map(fetchRoute))
      .then((results) => {
        setRoutes(results);
        if (!mapRef.current) return;
        const bounds = new google.maps.LatLngBounds();
        results.forEach((route) => {
          const path = route.result.routes[0].overview_path;
          path.forEach((pt) => bounds.extend(pt));
          const polyline = new google.maps.Polyline({
            path,
            strokeColor: route.color,
            strokeOpacity: 0.8,
            strokeWeight: 5,
          });
          polyline.setMap(mapRef.current!);
          polylineRefs.current[route.id] = polyline;
        });
        mapRef.current.fitBounds(bounds);
      })
      .catch((err) => console.error('Error fetching routes:', err));
  }, [colors, isLoaded, solution.routes]);

  // Cleanup on unmount
  useEffect(() => {
    const lines = { ...polylineRefs.current };
    return () => {
      Object.values(lines).forEach((pl) => pl.setMap(null));
    };
  }, []);

  // Early returns
  if (loadError) return <div>Error loading Maps</div>;
  if (!isLoaded)
    return <Skeleton className="h-[calc(100vh-5.3rem)] w-full rounded-none" />;
  if (!solution) return <div>No solution found for date: {date}</div>;

  const defaultCenter = { lat: 52.4369434, lng: 13.5451477 };

  const toggleVisibility = (id: string) => {
    if (activeMarker?.routeId === id) {
      setActiveMarker(null);
    }
    setRoutes((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const polyline = polylineRefs.current[id];
          if (polyline) {
            polyline.setMap(r.visible ? null : mapRef.current!);
          }
          return { ...r, visible: !r.visible };
        }
        return r;
      }),
    );
  };

  return (
    <div className="flex w-full h-[calc(100vh-5.3rem)] relative">
      <GoogleMap
        center={defaultCenter}
        zoom={12}
        mapContainerStyle={{ width: '100%', height: '100%' }}
        onLoad={(map) => {
          mapRef.current = map;
        }}
      >
        {routes.map((route) => {
          if (!route.visible) return null;

          const leg = route.result.routes[0].legs[0];
          const rawWaypoints = route.result.request.waypoints;
          const stringWaypoints = JSON.stringify(rawWaypoints);
          const waypoints = JSON.parse(stringWaypoints);

          return (
            <div key={route.id}>
              <Marker
                position={leg.start_location}
                // label="Start"
                icon={{
                  url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                }}
                onClick={() =>
                  setActiveMarker({
                    position: leg.start_location.toJSON(),
                    label: `Start of ${route.id}`,
                    routeId: route.id,
                    appointment: route.appointments[0],
                    color: route.color,
                  })
                }
              />
              <Marker
                position={leg.end_location}
                // label="End"
                icon={{
                  url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                }}
                onClick={() =>
                  setActiveMarker({
                    position: leg.end_location.toJSON(),
                    label: `End of ${route.id}`,
                    routeId: route.id,
                    appointment:
                      route.appointments[route.appointments.length - 1],
                    color: route.color,
                  })
                }
              />
              {/* White Dots for Waypoints */}
              {waypoints.map((waypoint: Waypoint, index: number) => {
                const color = route.color;
                const position = waypoint.location.location;

                if (!position) return null;

                return (
                  <Marker
                    key={index}
                    position={position}
                    label={(index + 1).toString()}
                    icon={{
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: 8,
                      fillColor: '#FFFFFF',
                      fillOpacity: 1,
                      strokeColor: color,
                      strokeWeight: 1,
                    }}
                    onClick={() =>
                      setActiveMarker({
                        position,
                        label: `Waypoint ${index + 1}`,
                        routeId: route.id,
                        appointment: route.appointments[index + 1],
                        color: route.color,
                      })
                    }
                  />
                );
              })}

              {activeMarker && (
                <InfoWindow
                  position={activeMarker.position}
                  onCloseClick={() => setActiveMarker(null)}
                >
                  <>
                    <div>
                      <strong
                        style={{ color: activeMarker.color }}
                        className="text-xl"
                      >
                        {activeMarker.label}
                      </strong>
                    </div>
                    <div>
                      <strong>Start:</strong>{' '}
                      {activeMarker.appointment?.appointment_start &&
                        new Date(
                          activeMarker.appointment.appointment_start,
                        ).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                    </div>
                    <div>
                      <strong>End:</strong>{' '}
                      {activeMarker.appointment?.appointment_end &&
                        new Date(
                          activeMarker.appointment.appointment_end,
                        ).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                    </div>
                    <div>
                      <strong>Address:</strong>{' '}
                      {activeMarker.appointment?.address &&
                        `${activeMarker.appointment.address.street}, ${activeMarker.appointment.address.zip_code} ${activeMarker.appointment.address.city}`}
                    </div>
                    <div>
                      <strong>Workers:</strong>{' '}
                      {activeMarker.appointment?.number_of_workers}
                    </div>
                  </>
                </InfoWindow>
              )}
            </div>
          );
        })}
      </GoogleMap>

      {/* Toggle Controls */}
      <div className="absolute top-2.5 right-2.5 bg-white p-2.5 rounded-lg shadow-md">
        <strong className="block mb-2">Toggle Routes:</strong>
        {routes.map((route) => (
          <div key={route.id} className="flex items-center space-x-2 mb-1">
            <Switch
              checked={route.visible}
              className="cursor-pointer"
              onCheckedChange={() => toggleVisibility(route.id)}
              id={`switch-${route.id}`}
            />
            <label
              htmlFor={`switch-${route.id}`}
              className="text-sm font-medium"
              style={{ color: route.color }}
            >
              {route.id}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
