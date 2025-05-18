import { createFileRoute } from '@tanstack/react-router';
import { Switch } from '@/components/ui/switch';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow
} from '@react-google-maps/api';
import { useEffect, useRef, useState } from 'react';

import dailyPlanData from '../../../testData/dailyPlanData.json';

export const Route = createFileRoute('/daily-plan/')({
  component: DailyPlan,
});

function DailyPlan() {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY!,
  });

  console.log('dailyPlanData:', dailyPlanData);

  const defaultCenter = { lat: 52.4369434, lng: 13.5451477 };
  const mapRef = useRef<google.maps.Map | null>(null);
  const polylineRefs = useRef<Record<string, google.maps.Polyline>>({});

  const [activeMarker, setActiveMarker] = useState<{
    position: google.maps.LatLngLiteral;
    label: string;
    routeId: string;
  } | null>(null);

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
  const routeRequests = dailyPlanData.routes.map((route, idx) => {
    const waypoints = route.appointments.slice(1, -1).map((appt) => ({
      location: { lat: appt.location.lat, lng: appt.location.lng },
      stopover: true,
    }));

    const origin = route.appointments[0].location;
    const destination = route.appointments[route.appointments.length - 1].location;

    return {
      id: `Route-${route.route_id + 1}`,
      origin: { lat: origin.lat, lng: origin.lng },
      destination: { lat: destination.lat, lng: destination.lng },
      waypoints,
      color: colors[idx % colors.length],
    };
  });

  // const routeRequests = [
  //   {
  //     id: 'route-1',
  //     origin: { lat: 52.4369434, lng: 13.5451477 },
  //     destination: { lat: 52.520008, lng: 13.404954 },
  //     waypoints: [
  //       { location: { lat: 52.45, lng: 13.5 }, stopover: true },
  //       { location: { lat: 52.48, lng: 13.48 }, stopover: true },
  //     ],
  //     color: '#FF0000',
  //   },
  //   {
  //     id: 'route-2',
  //     origin: { lat: 52.5, lng: 13.3 },
  //     destination: { lat: 52.52, lng: 13.6 },
  //     waypoints: [
  //       { location: { lat: 52.51, lng: 13.4 }, stopover: true },
  //     ],
  //     color: '#0000FF',
  //   },
  // ];

  const [routes, setRoutes] = useState<{
    id: string;
    color: string;
    visible: boolean;
    result: google.maps.DirectionsResult;
  }[]>([]);

  useEffect(() => {
    if (!isLoaded) return;

    const directionsService = new google.maps.DirectionsService();

    Promise.all(
      routeRequests.map((route) =>
        new Promise<{
          id: string;
          color: string;
          visible: boolean;
          result: google.maps.DirectionsResult;
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
                });
              } else {
                reject(`Failed to fetch directions: ${status}`);
              }
            }
          );
        })
      )
    )
      .then((results) => {
        setRoutes(results);

        if (mapRef.current) {
          const bounds = new google.maps.LatLngBounds();

          results.forEach((route) => {
            const path = route.result.routes[0].overview_path;

            // Extend bounds with each point in the polyline
            path.forEach((point) => bounds.extend(point));

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
        }
      })
      .catch((error) => console.error(error));
  }, [isLoaded]);

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
      })
    );
  };

  useEffect(() => {
    return () => {
      // Cleanup polylines on unmount
      Object.values(polylineRefs.current).forEach((polyline) =>
        polyline.setMap(null)
      );
    };
  }, []);

  useEffect(() => {
    console.log('Routes:', routes);
  }, [routes]);

  if (loadError) return <div>Error loading Maps</div>;
  if (!isLoaded) return <div>Loading Maps...</div>;

  return (
    <div style={{ height: '90vh', width: '100%', position: 'relative' }}>
      <GoogleMap
        center={defaultCenter}
        zoom={14}
        mapContainerStyle={{ width: '100%', height: '100%' }}
        onLoad={(map) => (mapRef.current = map)}
      >
        {routes.map((route) => {
          if (!route.visible) return null;

          const leg = route.result.routes[0].legs[0];
          const waypoints = route.result.request.waypoints;
          console.log('waypoints:', waypoints);

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
                  })
                }
              />
              {/* White Dots for Waypoints */}
              {waypoints?.map((waypoint, index) => {
                const color = route.color;
                const position = waypoint?.location?.location;

                if (!position) return null;

                return (<Marker
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
                    })
                  }
                />
                )
              })}

              {activeMarker && (
                <InfoWindow
                  position={activeMarker.position}
                  onCloseClick={() => setActiveMarker(null)}
                >
                  <div>{activeMarker.label}</div>
                </InfoWindow>
              )}
            </div>
          );
        })}
      </GoogleMap>

      {/* Toggle Controls */}
      <div className="absolute top-2.5 right-2.5 bg-white p-2.5 rounded-lg shadow-md">
        <strong className="block mb-2">Toggle Routes:</strong>
        {routes.map(route => (
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
